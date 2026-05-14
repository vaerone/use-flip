import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFlip } from "../useFlip";
import { animateMock } from "./setup";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

// Simple fixture component
function Box({ expanded }: { expanded?: boolean }) {
  const [open, setOpen] = useState(expanded ?? false);
  const { ref, snapshot } = useFlip({ duration: 200 });

  return (
    <div
      data-testid="box"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ height: open ? 200 : 80 }}
      onClick={() => {
        snapshot();
        setOpen((o) => !o);
      }}
    >
      {open ? "expanded" : "collapsed"}
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useFlip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without animating on mount", () => {
    render(<Box />);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("does NOT animate when snapshot() is not called before a state change", async () => {
    const user = userEvent.setup();
    // Render without snapshot call — simulate a state change that bypasses snapshot
    function NoSnapshot() {
      const [open, setOpen] = useState(false);
      const { ref } = useFlip();
      return (
        <div
          data-testid="box"
          ref={ref as React.RefObject<HTMLDivElement>}
          onClick={() => setOpen((o) => !o)}
        />
      );
    }
    render(<NoSnapshot />);
    await user.click(screen.getByTestId("box"));
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("calls animate() when element moves after snapshot()", async () => {
    const user = userEvent.setup();
    const box = { top: 0, left: 0, width: 100, height: 80 };

    // First call: before click (snapshot position)
    // Second call: after React re-render (new position)
    vi.spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValueOnce(makeRect(box))
      .mockReturnValueOnce(makeRect({ ...box, height: 200 }));

    render(<Box />);
    await user.click(screen.getByTestId("box"));

    expect(animateMock).toHaveBeenCalledTimes(1);
    const [keyframes] = animateMock.mock.calls[0];
    // First keyframe should invert the scale change (80/200 = 0.4 scaleY)
    expect(keyframes[0].transform).toContain("scale");
  });

  it("skips animation when element has not moved", async () => {
    const user = userEvent.setup();
    // Same rect before and after
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      makeRect({ top: 0, left: 0, width: 100, height: 100 }),
    );

    render(<Box />);
    await user.click(screen.getByTestId("box"));
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("skips animation when prefers-reduced-motion is set", async () => {
    const user = userEvent.setup();
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    vi.spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValueOnce(makeRect({ top: 0 }))
      .mockReturnValueOnce(makeRect({ top: 150 }));

    render(<Box />);
    await user.click(screen.getByTestId("box"));
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("cancels a running animation before starting a new one", async () => {
    const user = userEvent.setup();
    const cancelMock = vi.fn();

    vi.spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValue(makeRect({ top: 0 }))
      .mockReturnValueOnce(makeRect({ top: 100 }))
      .mockReturnValueOnce(makeRect({ top: 200 }));

    // Make first animate() return an animation with a cancel spy
    animateMock.mockImplementationOnce(() => ({
      onfinish: null,
      oncancel: null,
      cancel: cancelMock,
      finish() {
        this.onfinish?.();
      },
    }));

    render(<Box />);
    await user.click(screen.getByTestId("box"));
    await user.click(screen.getByTestId("box"));
    await waitFor(() => {
      expect(cancelMock).toHaveBeenCalled();
    });
    // expect(cancelMock).toHaveBeenCalled();
  });

  it("calls onStart and onComplete callbacks", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onComplete = vi.fn();

    function Tracked() {
      const [open, setOpen] = useState(false);
      const { ref, snapshot } = useFlip({ duration: 200, onStart, onComplete });
      return (
        <div
          data-testid="box"
          ref={ref as React.RefObject<HTMLDivElement>}
          onClick={() => {
            snapshot();
            setOpen((o) => !o);
          }}
        />
      );
    }

    vi.spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValueOnce(makeRect({ top: 0 }))
      .mockReturnValueOnce(makeRect({ top: 100 }));

    render(<Tracked />);
    await user.click(screen.getByTestId("box"));
    await waitFor(() => {
      expect(onStart).toHaveBeenCalledTimes(1);
    });
    // expect(onStart).toHaveBeenCalledTimes(1);

    // onComplete fires when the mock animation finishes (next microtask)
    await waitFor(async () => {
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
