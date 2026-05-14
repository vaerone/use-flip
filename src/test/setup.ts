import "@testing-library/jest-dom";
import { vi } from "vitest";

class MockAnimation {
  onfinish: (() => void) | null = null;
  oncancel: (() => void) | null = null;
  private _cancelled = false;

  finish() {
    if (!this._cancelled) this.onfinish?.();
  }
  cancel() {
    this._cancelled = true;
    this.oncancel?.();
  }
}

const animateMock = vi.fn(
  (_keyframes: Keyframe[], _options: KeyframeAnimationOptions) => {
    const anim = new MockAnimation();
    // Auto-finish on next microtask
    Promise.resolve().then(() => anim.finish());
    return anim;
  },
);

Element.prototype.animate =
  animateMock as unknown as typeof Element.prototype.animate;

// ── matchMedia mock ────────────────────────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false, // reduced motion OFF by default
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── getBoundingClientRect mock ─────────────────────────────────────────────────
// Tests override this per-element as needed.
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));

export { animateMock };
