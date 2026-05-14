import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FlipConfig, FlipSnapshot, UseFlipReturn } from "./types";
import { animateFlip } from "./utils/animation";
import {
  captureSnapshot,
  computeDelta,
  hasMoved,
  prefersReducedMotion,
} from "./utils/rect";

/**
 * useFlip — animates a single element using the FLIP technique.
 *
 * Call `snapshot()` immediately BEFORE a state change.
 * The hook will automatically animate from the old position to the new one
 * after React commits the update.
 *
 * Safe for React 18 Strict Mode. Handles `prefers-reduced-motion`.
 *
 * ```tsx
 * const { ref, snapshot } = useFlip({ duration: 350 });
 *
 * const toggle = () => {
 *   snapshot();
 *   setExpanded(e => !e);
 * };
 *
 * return <div ref={ref} onClick={toggle} />;
 * ```
 */
export function useFlip(config: FlipConfig = {}): UseFlipReturn {
  const {
    duration = 300,
    easing = "ease-out",
    delay = 0,
    animateSize = true,
    animateOpacity = false,
    animatePosition = false,
    onStart,
    onComplete,
  } = config;

  const ref = useRef<HTMLElement>(null);
  const snapshotRef = useRef<FlipSnapshot | null>(null);
  const animationRef = useRef<Animation | null>(null);

  // Tracks whether snapshot() was paired with an actual render.
  // A snapshot without a render should never fire an animation.
  const renderCountRef = useRef(0);
  const snapshotRenderCountRef = useRef(-1);

  const [isAnimating, setIsAnimating] = useState(false);

  /** Step 1 — First */
  const snapshot = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Cancel any in-flight animation so we read real geometry
    animationRef.current?.cancel();
    el.style.transform = "";

    snapshotRef.current = captureSnapshot(el);
    // Record which render cycle this snapshot belongs to
    snapshotRenderCountRef.current = renderCountRef.current;
  }, []);

  /** Steps 3 + 4 — Invert + Play */
  const play = useCallback(() => {
    const el = ref.current;
    const first = snapshotRef.current;
    if (!el || !first) return;

    // Guard: only play if snapshot was taken before THIS render
    if (snapshotRenderCountRef.current >= renderCountRef.current) return;

    snapshotRef.current = null;
    snapshotRenderCountRef.current = -1;

    if (prefersReducedMotion()) return;

    const last = captureSnapshot(el);
    const delta = computeDelta(first.rect, last.rect);

    if (!hasMoved(delta) && !animateOpacity) return;

    setIsAnimating(true);
    animationRef.current = animateFlip({
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
      onComplete: (el) => {
        setIsAnimating(false);
        onComplete?.(el);
      },
    });
  }, [
    duration,
    easing,
    delay,
    animateSize,
    animateOpacity,
    animatePosition,
    onStart,
    onComplete,
  ]);

  // Increment render counter and auto-play after every commit
  useLayoutEffect(() => {
    renderCountRef.current += 1;
    play();
  });

  return { ref, snapshot, play, isAnimating };
}
