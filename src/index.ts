// ─── Hooks ─────────────────────────────────────────────────────────────────────
export { useFlip } from "./useFlip";
export { useFlipGroup } from "./useFlipGroup";

// ─── Context ───────────────────────────────────────────────────────────────────
export { FlipProvider, useFlipContext, useFlipRegistered } from "./FlipContext";
export type { FlipProviderProps } from "./FlipContext";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type {
  FlipRect,
  FlipDelta,
  FlipEasing,
  FlipConfig,
  FlipGroupConfig,
  FlipSnapshot,
  UseFlipReturn,
  UseFlipGroupReturn,
  FlipContextValue,
} from "./types";

export {
  captureSnapshot,
  computeDelta,
  hasMoved,
  deltaToTransform,
} from "./utils/rect";
export { animateFlip } from "./utils/animation";
