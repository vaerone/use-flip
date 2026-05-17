# @vaerone/use-flip

![use-flip — GPU-accelerated FLIP animation hooks for React](https://github.com/vaerone/use-flip/blob/main/docs/assets/hero_image.png "Hero image")

Lightweight FLIP animation hooks for React.

`@vaerone/use-flip` provides high-performance layout animations using the FLIP technique:

> First → Last → Invert → Play

Built for modern React applications that need smooth UI transitions without the overhead of large animation frameworks.

Perfect for:

* Reordering lists
* Expand/collapse animations
* Dynamic dashboards
* Grid transitions
* Shared layout transitions
* Animated React state updates

---

![npm](https://img.shields.io/npm/v/@vaerone/use-flip)
![bundle size](https://img.shields.io/bundlephobia/minzip/@vaerone/use-flip)
![license](https://img.shields.io/npm/l/@vaerone/use-flip)

---

# Author

Ram Krishnan

* GitHub: https://github.com/iramkrish

---

# Features

* Zero runtime dependencies
* Tiny bundle footprint
* GPU-accelerated animations
* React 18+ compatible
* TypeScript-first API
* List reorder animations
* Enter/exit animations
* Shared animation context
* Reduced motion accessibility support
* ESM + CommonJS builds
* SSR-safe

---

# Installation

## npm

```bash
npm install @vaerone/use-flip
```

## pnpm

```bash
pnpm add @vaerone/use-flip
```

## yarn

```bash
yarn add @vaerone/use-flip
```

---

# Requirements

| Dependency | Version |
| ---------- | ------- |
| React      | >=18    |
| React DOM  | >=18    |

---

# What is FLIP?

FLIP is a layout animation technique designed to avoid expensive browser reflows.

Instead of animating layout-heavy properties like:

* `top`
* `left`
* `width`
* `height`

FLIP primarily animates:

* `transform`
* `opacity`

This keeps animations smooth and GPU accelerated.

---

# How FLIP Works

1. **First** → capture the current layout
2. **Last** → render the updated layout
3. **Invert** → visually offset elements back to their previous position
4. **Play** → animate transforms back to identity

This creates smooth transitions even when layouts change drastically.

---

# Quick Example

```tsx
import { useState } from "react";
import { useFlip } from "@vaerone/use-flip";

export function ExpandableCard() {
  const [expanded, setExpanded] = useState(false);

  const {
    ref,
    snapshot,
  } = useFlip({
    duration: 350,
  });

  const toggle = () => {
    snapshot();

    setExpanded(prev => !prev);
  };

  return (
    <div
      ref={ref}
      onClick={toggle}
      style={{
        height: expanded ? 320 : 100,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid #ddd",
        padding: 16,
      }}
    >
      Click to expand
    </div>
  );
}
```

---

# API

---

# useFlip

Animate a single element using FLIP.

---

## Example

```tsx
import { useState } from "react";
import { useFlip } from "@vaerone/use-flip";

export function Card() {
  const [expanded, setExpanded] = useState(false);

  const {
    ref,
    snapshot,
    isAnimating,
  } = useFlip({
    duration: 300,
    easing: "ease-out",
  });

  const toggle = () => {
    snapshot();

    setExpanded(prev => !prev);
  };

  return (
    <div
      ref={ref}
      onClick={toggle}
      style={{
        height: expanded ? 300 : 120,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {isAnimating ? "Animating..." : "Click me"}
    </div>
  );
}
```

---

## Configuration

| Option            | Type           | Default      | Description                        |
| ----------------- | -------------- | ------------ | ---------------------------------- |
| `duration`        | `number`       | `300`        | Animation duration in milliseconds |
| `easing`          | `string`       | `"ease-out"` | CSS easing function                |
| `delay`           | `number`       | `0`          | Delay before animation             |
| `animatePosition` | `boolean`      | `true`       | Animate translation                |
| `animateSize`     | `boolean`      | `true`       | Animate scaling                    |
| `animateOpacity`  | `boolean`      | `false`      | Animate opacity                    |
| `onStart`         | `(el) => void` | `undefined`  | Triggered when animation starts    |
| `onComplete`      | `(el) => void` | `undefined`  | Triggered when animation completes |

---

## Return Values

| Property      | Description                                 |
| ------------- | ------------------------------------------- |
| `ref`         | Attach to animated element                  |
| `snapshot()`  | Capture current layout before state updates |
| `play()`      | Trigger animation manually                  |
| `isAnimating` | Current animation state                     |

---

# useFlipGroup

Animate keyed collections such as:

* sortable lists
* grids
* masonry layouts
* filtered collections
* reorderable interfaces

---

## Example

```tsx
import { useState } from "react";
import { useFlipGroup } from "@vaerone/use-flip";

const initialItems = [
  { id: 1, label: "React" },
  { id: 2, label: "TypeScript" },
  { id: 3, label: "FLIP" },
];

export function SortableList() {
  const [items, setItems] = useState(initialItems);

  const {
    getRef,
    snapshot,
  } = useFlipGroup({
    duration: 400,
  });

  const shuffle = () => {
    snapshot();

    setItems(prev =>
      [...prev].sort(() => Math.random() - 0.5)
    );
  };

  return (
    <div>
      <button onClick={shuffle}>
        Shuffle
      </button>

      <ul>
        {items.map(item => (
          <li
            key={item.id}
            ref={getRef(String(item.id))}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Return Values

| Property      | Description                    |
| ------------- | ------------------------------ |
| `getRef(key)` | Register keyed elements        |
| `snapshot()`  | Capture layouts before updates |
| `play()`      | Trigger animations manually    |

---

# FlipProvider

Coordinate FLIP animations across component trees.

---

## Example

```tsx
import {
  FlipProvider,
  useFlipRegistered,
} from "@vaerone/use-flip";

function App() {
  return (
    <FlipProvider duration={300}>
      <Item id="a" />
      <Item id="b" />
    </FlipProvider>
  );
}

function Item({
  id,
}: {
  id: string;
}) {
  const ref = useFlipRegistered(id);

  return (
    <div ref={ref}>
      {id}
    </div>
  );
}
```

---

# Exported APIs

```ts
import {
  useFlip,
  useFlipGroup,
  FlipProvider,
  useFlipContext,
  useFlipRegistered,
} from "@vaerone/use-flip";
```

---

# Accessibility

`@vaerone/use-flip` automatically respects:

```css
prefers-reduced-motion
```

When enabled, animations are skipped automatically.

---

# Browser Support

Uses:

* Web Animations API (WAAPI)
* `requestAnimationFrame` fallback

Supported in all modern browsers.

---

# SSR Compatibility

Safe for:

* Next.js
* Remix
* Astro

Animations execute only in browser environments.

---

# Best Use Cases

* Reordering lists
* Expand/collapse transitions
* Dynamic dashboards
* Shared layout transitions
* Animated filtering
* Grid transitions
* Accordion interfaces

---

# Not Intended For

* Physics-based animation systems
* Gesture-heavy interactions
* Timeline choreography
* Canvas/WebGL rendering
* 3D animation systems

---

# Development

## Install dependencies

```bash
pnpm install
```

---

## Development

```bash
pnpm dev
```

---

## Build

```bash
pnpm build
```

---

## Type Check

```bash
pnpm typecheck
```

---

## Tests

```bash
pnpm test
```

---

## Coverage

```bash
pnpm test:coverage
```

---

# Build Output

```text
dist/
├── index.js
├── index.mjs
└── index.d.ts
```

---

# Comparison

| Feature                | @vaerone/use-flip | Framer Motion | react-spring |
| ---------------------- | ----------------- | ------------- | ------------ |
| Bundle Size            | Tiny              | Large         | Medium       |
| Runtime Dependencies   | 0                 | Multiple      | Multiple     |
| FLIP Layout Animations | Yes               | Yes           | Manual       |
| TypeScript-first       | Yes               | Yes           | Yes          |
| Reduced Motion Support | Yes               | Yes           | Partial      |
| Group Reordering       | Yes               | Yes           | Manual       |

---

# License

MIT

---

# Author

Ram Krishnan

* GitHub: https://github.com/vaerone
* npm: https://www.npmjs.com/~vaerone
