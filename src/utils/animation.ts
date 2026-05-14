import type { FlipConfig, FlipDelta, FlipSnapshot } from "../types";
import { deltaToTransform } from "./rect";

export interface AnimateFlipOptions {
  el: HTMLElement;
  delta: FlipDelta;
  firstSnapshot: FlipSnapshot;
  lastSnapshot: FlipSnapshot;
  config: Required<
    Pick<
      FlipConfig,
      | "duration"
      | "easing"
      | "delay"
      | "animateSize"
      | "animateOpacity"
      | "animatePosition"
    >
  >;

  onStart?: (el: HTMLElement) => void;
  onComplete?: (el: HTMLElement) => void;
}

export function animateFlip({
  el,
  delta,
  firstSnapshot,
  lastSnapshot,
  config,
  onStart,
  onComplete,
}: AnimateFlipOptions): Animation | null {
  const effectiveDelta = config.animatePosition
    ? delta
    : { ...delta, x: 0, y: 0 };
  const invertTransform = deltaToTransform(effectiveDelta, config.animateSize);

  const keyframes: Keyframe[] = [
    {
      transform: invertTransform,
      transformOrigin: "center center",
      ...(config.animateOpacity ? { opacity: firstSnapshot.opacity } : {}),
    },
    {
      transform: "translate(0px, 0px) scale(1, 1)",
      transformOrigin: "center center",
      ...(config.animateOpacity ? { opacity: lastSnapshot.opacity } : {}),
    },
  ];

  if (typeof el.animate === "function") {
    const anim = el.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: "none",
    });
    onStart?.(el);
    anim.onfinish = () => onComplete?.(el);
    anim.oncancel = () => onComplete?.(el);
    return anim;
  }

  // RAF fallback
  const startTime = performance.now() + config.delay;
  let rafId: number;

  const tick = (now: number) => {
    if (now < startTime) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    const t = Math.min((now - startTime) / config.duration, 1);
    const e = easeOutQuart(t);
    const x = delta.x * (1 - e);
    const y = delta.y * (1 - e);
    const sx = config.animateSize ? 1 + (delta.scaleX - 1) * (1 - e) : 1;
    const sy = config.animateSize ? 1 + (delta.scaleY - 1) * (1 - e) : 1;
    el.style.transform = `translate(${x}px,${y}px) scale(${sx},${sy})`;
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      el.style.transform = "";
      onComplete?.(el);
    }
  };

  rafId = requestAnimationFrame(tick);
  return {
    cancel: () => {
      cancelAnimationFrame(rafId);
      el.style.transform = "";
    },
  } as unknown as Animation;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
