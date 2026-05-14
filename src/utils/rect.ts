import type { FlipDelta, FlipRect, FlipSnapshot } from "../types";

export function captureSnapshot(el: HTMLElement): FlipSnapshot {
  const r = el.getBoundingClientRect();
  return {
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    opacity: parseFloat(getComputedStyle(el).opacity ?? "1"),
  };
}

export function computeDelta(first: FlipRect, last: FlipRect): FlipDelta {
  return {
    x: first.left - last.left,
    y: first.top - last.top,
    scaleX: last.width === 0 ? 1 : first.width / last.width,
    scaleY: last.height === 0 ? 1 : first.height / last.height,
  };
}

export function hasMoved(delta: FlipDelta, threshold = 0.5): boolean {
  return (
    Math.abs(delta.x) > threshold ||
    Math.abs(delta.y) > threshold ||
    Math.abs(delta.scaleX - 1) > 0.005 ||
    Math.abs(delta.scaleY - 1) > 0.005
  );
}

export function deltaToTransform(
  delta: FlipDelta,
  animateSize: boolean,
): string {
  const t = `translate(${delta.x}px, ${delta.y}px)`;
  return animateSize ? `${t} scale(${delta.scaleX}, ${delta.scaleY})` : t;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
