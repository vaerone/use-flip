import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type {
  FlipGroupConfig,
  FlipSnapshot,
  UseFlipGroupReturn,
} from "./types";
import { animateFlip } from "./utils/animation";
import {
  captureSnapshot,
  computeDelta,
  hasMoved,
  prefersReducedMotion,
} from "./utils/rect";

const DEFAULT_ENTER: Keyframe[] = [
  { opacity: 0, transform: "scale(0.92)" },
  { opacity: 1, transform: "scale(1)" },
];
const DEFAULT_EXIT: Keyframe[] = [
  { opacity: 1, transform: "scale(1)" },
  { opacity: 0, transform: "scale(0.92)" },
];

/**
 * useFlipGroup — animates a keyed collection of elements through
 * reorders, inserts, and **removals** using FLIP.
 *
 * Exit animations: when a key disappears from the list, the element is
 * cloned, appended to its former parent, animated out, then removed.
 * This means your state update can remove the item immediately — the
 * hook handles keeping it visible during the exit animation.
 *
 * React 18 Strict Mode safe. Handles `prefers-reduced-motion`.
 *
 * ```tsx
 * const { getRef, snapshot } = useFlipGroup({ duration: 350 });
 *
 * const shuffle = () => {
 *   snapshot();
 *   setItems(prev => [...prev].sort(() => Math.random() - 0.5));
 * };
 *
 * return items.map(item => (
 *   <li key={item.id} ref={getRef(item.id)}>{item.name}</li>
 * ));
 * ```
 */
export function useFlipGroup(config: FlipGroupConfig = {}): UseFlipGroupReturn {
  const {
    duration = 300,
    easing = "ease-out",
    delay = 0,
    animateSize = false,
    animateOpacity = false,
    animatePosition = false,
    enterKeyframes = DEFAULT_ENTER,
    exitKeyframes = DEFAULT_EXIT,
    enterExitDuration,
    onStart,
    onComplete,
  } = config;

  const eeDuration = enterExitDuration ?? duration;

  // key → live DOM element
  const elements = useRef<Map<string, HTMLElement>>(new Map());
  // key → snapshot before the state change
  const snapshots = useRef<Map<string, FlipSnapshot>>(new Map());
  // key → running animation (for cancellation)
  const animations = useRef<Map<string, Animation>>(new Map());
  // Whether a snapshot is pending play
  const pendingPlay = useRef(false);
  // Strict Mode: track mount count per key to avoid double-registration
  const mountCount = useRef<Map<string, number>>(new Map());

  /**
   * Ref callback factory. Handles registration and cleanup automatically,
   * including React 18 Strict Mode double-mount.
   */
  const getRef = useCallback(
    (key: string): React.RefCallback<HTMLElement> =>
      (el) => {
        if (el) {
          // Increment mount count; register the element
          mountCount.current.set(key, (mountCount.current.get(key) ?? 0) + 1);
          elements.current.set(key, el);
        } else {
          // Unmount: decrement; only remove if fully unmounted
          const count = (mountCount.current.get(key) ?? 1) - 1;
          if (count <= 0) {
            mountCount.current.delete(key);
            elements.current.delete(key);
          } else {
            mountCount.current.set(key, count);
          }
        }
      },
    [],
  );

  /** Step 1 — First: snapshot all current elements */
  const snapshot = useCallback(() => {
    snapshots.current.clear();

    for (const [key, el] of elements.current.entries()) {
      // Cancel in-flight animation so we read real geometry
      animations.current.get(key)?.cancel();
      el.style.transform = "";
      snapshots.current.set(key, captureSnapshot(el));
    }

    pendingPlay.current = true;
  }, []);

  /** Steps 3+4 — Invert + Play for all changed elements */
  const play = useCallback(() => {
    if (!pendingPlay.current) return;
    pendingPlay.current = false;

    const reduced = prefersReducedMotion();

    // ── Exits: keys that had a snapshot but are no longer in the DOM ──────────
    if (!reduced) {
      for (const [key, first] of snapshots.current.entries()) {
        if (elements.current.has(key)) continue; // still present — not an exit

        // Find a parent to temporarily host the clone
        const parent = document
          .elementFromPoint(first.rect.left + 1, first.rect.top + 1)
          ?.closest("[data-flip-group]") as HTMLElement | null;
        if (!parent) continue;

        // Clone the element and position it exactly where it was
        const clone = document.createElement("div");
        clone.style.cssText = [
          "position:fixed",
          `top:${first.rect.top}px`,
          `left:${first.rect.left}px`,
          `width:${first.rect.width}px`,
          `height:${first.rect.height}px`,
          "pointer-events:none",
          "z-index:9999",
          "margin:0",
        ].join(";");

        // Copy visual appearance from the snapshot data
        clone.style.opacity = String(first.opacity);
        parent.appendChild(clone);

        const anim = clone.animate(exitKeyframes, {
          duration: eeDuration,
          easing,
          fill: "none",
        });
        anim.onfinish = () => clone.remove();
        anim.oncancel = () => clone.remove();
      }
    }

    // ── Enters + Moves: keys currently in the DOM ─────────────────────────────
    for (const [key, el] of elements.current.entries()) {
      const first = snapshots.current.get(key);

      if (!first) {
        // New element — enter animation
        if (!reduced) {
          const anim = el.animate(enterKeyframes, {
            duration: eeDuration,
            easing,
            fill: "none",
          });
          animations.current.set(key, anim);
        }
        continue;
      }

      if (reduced) continue;

      const last = captureSnapshot(el);
      const delta = computeDelta(first.rect, last.rect);
      if (!hasMoved(delta) && !animateOpacity) continue;

      const anim = animateFlip({
        el,
        delta,
        firstSnapshot: first,
        lastSnapshot: last,
        config: {
          duration,
          easing,
          delay,
          animateSize,
          animateOpacity,
          animatePosition,
        },
        onStart,
        onComplete,
      });

      if (anim) animations.current.set(key, anim);
    }

    snapshots.current.clear();
  }, [
    duration,
    easing,
    delay,
    animateSize,
    animateOpacity,
    animatePosition,
    eeDuration,
    enterKeyframes,
    exitKeyframes,
    onStart,
    onComplete,
  ]);

  // Auto-play after every commit if a snapshot is pending
  useLayoutEffect(() => {
    if (pendingPlay.current) play();
  });

  return { getRef, snapshot, play };
}
