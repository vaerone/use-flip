# Examples

Live, interactive examples for `@vaerone/use-flip`. Each is a standalone Vite + React app.

---

## Open on StackBlitz

| Example | Hook used | Open |
|---------|-----------|------|
| Expandable Card | `useFlip` | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/vaerone/use-flip/tree/main/examples/expandable-card) |
| Sortable List | `useFlipGroup` | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/vaerone/use-flip/tree/main/examples/sortable-list) |
| Shared Layout | `FlipProvider` | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/vaerone/use-flip/tree/main/examples/shared-layout) |

---

## Run locally

```bash
# Clone the repo
git clone https://github.com/vaerone/use-flip.git
cd use-flip

# Run expandable card
cd examples/expandable-card
pnpm install
pnpm dev

# Run sortable list
cd examples/sortable-list
pnpm install
pnpm dev

# Run shared layout
cd examples/shared-layout
pnpm install
pnpm dev
```

---

## Structure

```
examples/
├── expandable-card/    ← useFlip — single element expand/collapse
├── sortable-list/      ← useFlipGroup — animated list reordering
└── shared-layout/      ← FlipProvider — cross-component coordination
```
