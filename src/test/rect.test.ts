import { describe, it, expect } from "vitest";
import { computeDelta, hasMoved, deltaToTransform } from "../utils/rect";
import type { FlipRect } from "../types";

const rect = (top: number, left: number, w = 100, h = 100): FlipRect => ({
  top, left, width: w, height: h,
});

describe("computeDelta", () => {
  it("returns zero delta when rects are identical", () => {
    const d = computeDelta(rect(0, 0), rect(0, 0));
    expect(d).toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  });

  it("computes x/y translation correctly", () => {
    const d = computeDelta(rect(50, 100), rect(200, 300));
    expect(d.x).toBe(100 - 300); // first.left - last.left
    expect(d.y).toBe(50 - 200);  // first.top  - last.top
  });

  it("computes scale correctly when sizes differ", () => {
    const d = computeDelta(rect(0, 0, 50, 80), rect(0, 0, 100, 160));
    expect(d.scaleX).toBeCloseTo(0.5);
    expect(d.scaleY).toBeCloseTo(0.5);
  });

  it("returns scale 1 when last dimension is zero (avoid division by zero)", () => {
    const d = computeDelta(rect(0, 0, 50, 50), rect(0, 0, 0, 0));
    expect(d.scaleX).toBe(1);
    expect(d.scaleY).toBe(1);
  });
});

describe("hasMoved", () => {
  it("returns false for zero delta", () => {
    expect(hasMoved({ x: 0, y: 0, scaleX: 1, scaleY: 1 })).toBe(false);
  });

  it("returns true when x exceeds threshold", () => {
    expect(hasMoved({ x: 2, y: 0, scaleX: 1, scaleY: 1 })).toBe(true);
  });

  it("returns true when scale changes meaningfully", () => {
    expect(hasMoved({ x: 0, y: 0, scaleX: 0.9, scaleY: 1 })).toBe(true);
  });

  it("returns false for sub-threshold movement", () => {
    expect(hasMoved({ x: 0.3, y: 0.3, scaleX: 1.001, scaleY: 0.999 })).toBe(false);
  });
});

describe("deltaToTransform", () => {
  it("includes scale when animateSize is true", () => {
    const t = deltaToTransform({ x: 10, y: 20, scaleX: 0.5, scaleY: 0.8 }, true);
    expect(t).toContain("translate(10px, 20px)");
    expect(t).toContain("scale(0.5, 0.8)");
  });

  it("omits scale when animateSize is false", () => {
    const t = deltaToTransform({ x: 10, y: 20, scaleX: 0.5, scaleY: 0.8 }, false);
    expect(t).toContain("translate(10px, 20px)");
    expect(t).not.toContain("scale");
  });

  it("produces identity-like string for zero delta", () => {
    const t = deltaToTransform({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, true);
    expect(t).toBe("translate(0px, 0px) scale(1, 1)");
  });
});
