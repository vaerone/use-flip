// ─── Geometry ──────────────────────────────────────────────────────────────────

export interface FlipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FlipDelta {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

// ─── Animation Config ──────────────────────────────────────────────────────────

export type FlipEasing =
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "linear"
  | `cubic-bezier(${number}, ${number}, ${number}, ${number})`;

export interface FlipConfig {
  /** Animation duration in ms. Default: 300 */
  duration?: number;
  /** CSS easing function. Default: "ease-out" */
  easing?: FlipEasing;
  /** Delay before the animation starts in ms. Default: 0 */
  delay?: number;
  /** Animate position (translate). Default: true */
  animatePosition?: boolean;
  /** Animate size (scale). Default: true */
  animateSize?: boolean;
  /** Animate opacity between snapshots. Default: false */
  animateOpacity?: boolean;
  /** Called when animation starts */
  onStart?: (el: HTMLElement) => void;
  /** Called when animation ends */
  onComplete?: (el: HTMLElement) => void;
}

export interface FlipGroupConfig extends FlipConfig {
  /**
   * Keyframes applied when an item ENTERS the list.
   * Default: [{ opacity: 0 }, { opacity: 1 }]
   */
  enterKeyframes?: Keyframe[];
  /**
   * Keyframes applied when an item EXITS the list.
   * Default: [{ opacity: 1 }, { opacity: 0 }]
   * The element is removed from the DOM once the animation completes.
   */
  exitKeyframes?: Keyframe[];
  /**
   * Duration for enter/exit animations in ms.
   * Falls back to `duration` if not set.
   */
  enterExitDuration?: number;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export interface FlipSnapshot {
  rect: FlipRect;
  opacity: number;
}

// ─── Hook Return Types ─────────────────────────────────────────────────────────

export interface UseFlipReturn {
  ref: React.RefObject<HTMLElement>;
  snapshot: () => void;
  play: () => void;
  isAnimating: boolean;
}

export interface UseFlipGroupReturn {
  getRef: (key: string) => React.RefCallback<HTMLElement>;
  snapshot: () => void;
  play: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface FlipContextValue {
  config: Required<Omit<FlipConfig, "onStart" | "onComplete">>;
  register: (key: string, el: HTMLElement | null) => void;
  snapshotAll: () => void;
  playAll: () => void;
  pendingPlay: React.MutableRefObject<boolean>;
}
