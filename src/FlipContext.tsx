import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { FlipConfig, FlipContextValue, FlipSnapshot } from "./types";
import { animateFlip } from "./utils/animation";
import {
  captureSnapshot,
  computeDelta,
  hasMoved,
  prefersReducedMotion,
} from "./utils/rect";

const FlipCtx = createContext<FlipContextValue | null>(null);

export function useFlipContext(): FlipContextValue {
  const ctx = useContext(FlipCtx);
  if (!ctx) {
    throw new Error("useFlipContext must be used inside <FlipProvider>");
  }
  return ctx;
}

export interface FlipProviderProps extends FlipConfig {
  children: React.ReactNode;
}

export function FlipProvider({
  children,
  duration = 300,
  easing = "ease-out",
  delay = 0,
  animateSize = true,
  animateOpacity = false,
  animatePosition = true,
  onStart,
  onComplete,
}: FlipProviderProps) {
  const elements = useRef<Map<string, HTMLElement>>(new Map());
  const snapshots = useRef<Map<string, FlipSnapshot>>(new Map());

  const pendingPlay = useRef(false);

  const register = useCallback((key: string, el: HTMLElement | null) => {
    if (el) {
      elements.current.set(key, el);
    } else {
      elements.current.delete(key);
    }
  }, []);

  const playAll = useCallback(() => {
    if (prefersReducedMotion()) {
      snapshots.current.clear();
      return;
    }

    for (const [key, el] of elements.current.entries()) {
      const first = snapshots.current.get(key);
      if (!first) continue;

      const last = captureSnapshot(el);
      const delta = computeDelta(first.rect, last.rect);

      if (!hasMoved(delta)) continue;

      animateFlip({
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
    }

    snapshots.current.clear();
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

  const snapshotAll = useCallback(() => {
    snapshots.current.clear();

    for (const [key, el] of elements.current.entries()) {
      snapshots.current.set(key, captureSnapshot(el));
    }

    // mark that we should play after layout settles
    pendingPlay.current = true;
  }, []);

  const value = useMemo<FlipContextValue>(
    () => ({
      config: {
        duration,
        easing,
        delay,
        animateSize,
        animateOpacity,
        animatePosition,
      },
      register,
      snapshotAll,
      playAll,
      pendingPlay,
    }),
    [
      duration,
      easing,
      delay,
      animateSize,
      animateOpacity,
      animatePosition,
      register,
      snapshotAll,
      playAll,
    ],
  );

  return <FlipCtx.Provider value={value}>{children}</FlipCtx.Provider>;
}

export function useFlipRegistered(key: string): React.RefCallback<HTMLElement> {
  const { register, playAll, pendingPlay } = useFlipContext();
  const elRef = useRef<HTMLElement | null>(null);

  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      register(key, el);
    },
    [key, register],
  );

  useLayoutEffect(() => {
    if (pendingPlay.current) {
      pendingPlay.current = false;
      playAll();
    }
  });

  useEffect(() => {
    return () => {
      register(key, null);
    };
  }, [key, register]);

  return refCallback;
}
