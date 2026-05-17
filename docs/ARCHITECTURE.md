# Architecture

This document explains the key technical decisions behind `@vaerone/use-flip` not just *what* was built, but *why* each call was made. It is intended for contributors, curious users, and future maintainers.

---

## Table of Contents

- [001 — Why WAAPI over CSS transitions](#001--why-waapi-over-css-transitions)
- [002 — Why explicit snapshot() instead of automatic diffing](#002--why-explicit-snapshot-instead-of-automatic-diffing)
- [003 — Why getRef(key) instead of a FlipItem component](#003--why-getrefkey-instead-of-a-flipitem-component)
- [004 — Why no spring physics](#004--why-no-spring-physics)
- [005 — Why dual ESM + CJS build](#005--why-dual-esm--cjs-build)
- [006 — Why zero runtime dependencies](#006--why-zero-runtime-dependencies)
- [007 — Why FlipProvider is opt-in](#007--why-flipprovider-is-opt-in)
- [008 — Why getBoundingClientRect over ResizeObserver](#008--why-getboundingclientrect-over-resizeobserver)
- [009 — SSR safety strategy](#009--ssr-safety-strategy)
- [010 — Reduced motion strategy](#010--reduced-motion-strategy)

---

## 001 — Why WAAPI over CSS transitions

**Status:** Accepted

### Context

Layout animations need to be cancellable. If a user triggers a second animation before the first one finishes, the library needs to interrupt cleanly and start fresh from wherever the element currently is not snap to the end state and restart.

CSS transitions cannot be cancelled programmatically. Once a transition starts, the only way to stop it is to remove the property, which causes a visual snap.

### Decision

Use the **Web Animations API (WAAPI)** as the primary animation engine.

```ts
element.animate(keyframes, {
  duration,
  easing,
  fill: 'none',
})
```

WAAPI animations return an `Animation` object that can be paused, reversed, cancelled, or have their playback rate changed at any time. This is the only browser-native API that gives full programmatic control over an in-progress animation.

### Consequences

- Animations can be interrupted and restarted cleanly mid-flight
- The animation runs on the compositor thread where supported
- `requestAnimationFrame` fallback is used for environments where WAAPI is unavailable
- Slightly more code than CSS transitions, but the control is worth it

---

## 002 — Why explicit `snapshot()` instead of automatic diffing

**Status:** Accepted

### Context

An alternative design would use `MutationObserver` or `ResizeObserver` to automatically detect when elements move, and trigger FLIP animations without any manual call. This feels ergonomic on the surface.

### Decision

Require the user to call `snapshot()` explicitly before any state update that will cause a layout change.

```ts
const toggle = () => {
  snapshot()                    // explicit — user is in control
  setExpanded(prev => !prev)
}
```

### Why

Automatic diffing creates hidden coupling between the library and React's render cycle. React 18 batches state updates, defers renders with `startTransition`, and can re-render components in any order. An observer-based approach would need to know exactly when React has finished committing a layout change, which is an internal implementation detail that can change between React versions.

Explicit `snapshot()` is a deliberate affordance: the user declares *"the layout is about to change, record it now."* This is predictable, debuggable, and immune to React internals changing.

### Consequences

- Slightly more code for the user (one extra call before state updates)
- Zero coupling to React's internal render timing
- Works correctly with concurrent mode, `startTransition`, and `Suspense`
- Easy to understand what is happening and when

---

## 003 — Why `getRef(key)` instead of a `<FlipItem>` component

**Status:** Accepted

### Context

A component-based API for group animations would look like this:

```tsx
<FlipGroup>
  {items.map(item => (
    <FlipItem key={item.id}>
      <li>{item.label}</li>
    </FlipItem>
  ))}
</FlipGroup>
```

This is the pattern Framer Motion uses with `<AnimatePresence>` and `<motion.li>`.

### Decision

Use a ref-based API instead:

```tsx
{items.map(item => (
  <li key={item.id} ref={getRef(String(item.id))}>
    {item.label}
  </li>
))}
```

### Why

A component-based API forces users to restructure their JSX. Every animated element must be wrapped in a library component, which:

- Breaks composition when the list item is a third-party component that does not forward refs
- Adds a React component to the tree for every list item — measurable overhead on large lists
- Makes it harder to animate elements that are already wrapped in other components

A ref-based API drops into any existing list with zero restructuring. `getRef(key)` returns a standard React ref callback — it works on any element or component that accepts a `ref` prop.

### Consequences

- Zero JSX restructuring required
- Works with any component that forwards refs
- No extra React tree nodes
- Slightly less "magical" users need to understand refs

---

## 004 — Why no spring physics

**Status:** Accepted

### Context

Spring-based animations feel more natural for many interactions. Libraries like react-spring and Framer Motion use physics simulations to produce organic motion. Should `use-flip` support springs?

### Decision

No. `use-flip` uses duration-based easing only (`ease-out`, `cubic-bezier(...)`, etc.).

### Why

Spring physics require a simulation loop — on every frame, the spring's position is calculated based on mass, stiffness, and damping. This cannot run on the compositor thread. It must run on the main thread via `requestAnimationFrame`, which makes it vulnerable to jank under load.

FLIP's core advantage is that it animates `transform` values that the browser can run entirely on the GPU compositor thread. Replacing the easing function with a spring simulation would surrender that advantage.

Additionally, spring animations do not have a fixed duration, they run until the spring settles. This makes it impossible to know when `onComplete` should fire, and complicates interruption handling.

For use cases that genuinely need spring physics, Framer Motion is the right tool.

### Consequences

- Animations are always GPU-compositor-eligible
- `onComplete` fires at a predictable, known time
- Interruption handling is clean and deterministic
- Users who want spring feel must use `cubic-bezier` easing to approximate it

---

## 005 — Why dual ESM + CJS build

**Status:** Accepted

### Context

The npm ecosystem is in a long transition from CommonJS to ES Modules. Not all tools and environments support ESM yet particularly older Next.js configs, Jest without configuration, and some Node.js toolchains.

### Decision

Ship both formats from a single source using `tsup`:

```
dist/
├── index.js    ← CommonJS (require)
├── index.mjs   ← ES Module (import)
└── index.d.ts  ← TypeScript declarations
```

With a full `exports` map in `package.json`:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false
}
```

### Consequences

- Works in any modern bundler (Vite, webpack, Rollup, esbuild)
- Works in Jest without extra transform config
- Tree-shaking works correctly in ESM-aware bundlers
- `sideEffects: false` tells bundlers they can safely drop unused exports

---

## 006 — Why zero runtime dependencies

**Status:** Accepted

### Context

Every dependency a library ships is a dependency its users must also ship even if they do not use it directly. Dependencies also introduce version conflicts, security surface, and upgrade churn.

### Decision

`use-flip` has zero runtime dependencies. The only peer dependencies are `react` and `react-dom`, which the user already has.

### Why

The FLIP technique only requires:

- `getBoundingClientRect()` — built into the browser
- `element.animate()` — WAAPI, built into the browser
- `requestAnimationFrame` — built into the browser
- `window.matchMedia('prefers-reduced-motion')` — built into the browser

There is no need for any external utility library. Adding one would increase bundle size, introduce a dependency tree, and provide no capability that the browser does not already offer.

### Consequences

- Zero version conflicts with user's existing dependencies
- Smallest possible bundle footprint
- No transitive security vulnerabilities
- Slightly more code written from scratch, but each piece is small and well-tested

---

## 007 — Why `FlipProvider` is opt-in

**Status:** Accepted

### Context

Many React libraries wrap their entire API in a required context provider. This is a common pattern but has a real cost: it forces users to modify their app root, makes the library harder to adopt incrementally, and adds a React context subscription to every consuming component.

### Decision

`FlipProvider` is entirely optional. `useFlip` and `useFlipGroup` work with zero providers anywhere in the tree.

`FlipProvider` exists only for one specific use case: coordinating animations across components that are far apart in the React tree and cannot share state directly.

### Consequences

- `useFlip` can be dropped into any component with zero setup
- No mandatory app-root changes
- Users pay the context cost only when they actually need cross-tree coordination
- Progressive adoption — start with `useFlip`, add `FlipProvider` only if needed

---

## 008 — Why `getBoundingClientRect` over `ResizeObserver`

**Status:** Accepted

### Context

`ResizeObserver` fires whenever an element's size changes. It seems like a natural fit for detecting layout changes that should trigger a FLIP animation.

### Decision

Use `getBoundingClientRect()` called synchronously inside `snapshot()`.

### Why

`ResizeObserver` is asynchronous, it fires after the browser has already painted the new layout. By the time it fires, the "First" position is gone. FLIP requires capturing the position *before* the layout change, which means the measurement must be synchronous and user-initiated.

`getBoundingClientRect()` is synchronous. When the user calls `snapshot()` before a state update, it reads the current position immediately and accurately before React re-renders and before the browser repaints.

### Consequences

- Accurate "First" position capture every time
- No async timing issues
- `snapshot()` call is intentionally synchronous, users should not `await` it
- Calling `getBoundingClientRect` forces a layout read, so users should avoid calling `snapshot()` in a loop

---

## 009 — SSR Safety Strategy

**Status:** Accepted

### Context

`use-flip` is used in Next.js, Remix, and Astro all of which render components on the server where `window`, `document`, and DOM APIs do not exist.

### Decision

All DOM access is guarded behind environment checks. The hooks return safe no-ops on the server.

```ts
if (typeof window === 'undefined') return

const rect = element.getBoundingClientRect()
```

No animation code runs during server-side rendering. The hooks hydrate and activate only after mounting in a browser environment.

### Consequences

- Zero SSR errors out of the box
- No `typeof window` checks required in user code
- Works with Next.js App Router, Pages Router, Remix, and Astro without configuration
- Animations are always a progressive enhancement, the page is fully usable before they activate

---

## 010 — Reduced Motion Strategy

**Status:** Accepted

### Context

Some users have vestibular disorders that make motion-heavy interfaces physically uncomfortable or disorienting. Operating systems provide a `prefers-reduced-motion` setting to signal this preference to applications.

### Decision

Read `prefers-reduced-motion` via `window.matchMedia` and skip all animations when it is set to `reduce`. This happens automatically no configuration required from the user.

```ts
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (prefersReducedMotion) return
```

Critically, the animation is **not played at an instant duration**, it is not played at all. Setting `duration: 0` still triggers the animation machinery and fires `onStart`/`onComplete`. Skipping the animation entirely is the correct accessible behavior.

The library also listens for changes to the media query at runtime, so if a user toggles the setting while the app is open, subsequent animations immediately respect the new preference.

### Consequences

- Accessible by default no opt-in required
- Respects the user's system preference at the OS level
- `onStart` and `onComplete` are not called when motion is reduced (the animation did not happen)
- Passes WCAG 2.1 Success Criterion 2.3.3

---

## Contributing a New Decision

If you are proposing a significant change to the library, a new API, a change to the build pipeline, a shift in browser support, please add a new ADR to this file as part of your pull request.

Use this template:

```markdown
## NNN — Title

**Status:** Proposed | Accepted | Deprecated | Superseded by NNN

### Context
What is the situation that requires a decision?

### Decision
What was decided?

### Consequences
What are the trade-offs?
```
---

*Maintained by [Ram Krishnan](https://github.com/iramkrish)*
