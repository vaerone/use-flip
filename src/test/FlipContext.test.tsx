import React, { useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FlipProvider,
  useFlipContext,
  useFlipRegistered,
} from "../FlipContext";
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

function Card({ id, top }: { id: string; top: number }) {
  const ref = useFlipRegistered(id);
  return (
    <div
      data-testid={`card-${id}`}
      ref={ref as React.RefCallback<HTMLDivElement>}
      style={{ position: "absolute", top }}
    >
      {id}
    </div>
  );
}

function Board() {
  const { snapshotAll } = useFlipContext();
  const [flipped, setFlipped] = React.useState(false);

  return (
    <div>
      <button
        onClick={() => {
          snapshotAll();
          setFlipped(true);
        }}
      >
        Flip
      </button>
      <Card id="a" top={flipped ? 200 : 0} />
      <Card id="b" top={flipped ? 0 : 200} />
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FlipProvider + useFlipRegistered", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when useFlipContext is used outside FlipProvider", () => {
    function Bad() {
      useFlipContext();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      "useFlipContext must be used inside <FlipProvider>",
    );
  });

  it("renders children without animating on mount", () => {
    render(
      <FlipProvider>
        <Board />
      </FlipProvider>,
    );
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("animates registered elements that moved after snapshotAll + state change", async () => {
    const user = userEvent.setup();

    // a: moves from top:0 → top:200; b: moves from top:200 → top:0
    let call = 0;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () => {
        call++;
        // First 2 calls are snapshot (a=0, b=200), next 2 are play (a=200, b=0)
        if (call <= 2) {
          return makeRect({ top: call === 1 ? 0 : 200 });
        }
        return makeRect({ top: call === 3 ? 200 : 0 });
      },
    );

    render(
      <FlipProvider duration={300}>
        <Board />
      </FlipProvider>,
    );

    await user.click(screen.getByText("Flip"));
    await waitFor(() => {
      expect(animateMock).toHaveBeenCalledTimes(2);
    });
  });

  it("cleans up registered element on unmount", async () => {
    function Toggled() {
      const [show, setShow] = React.useState(true);
      return (
        <FlipProvider>
          <button onClick={() => setShow(false)}>Hide</button>
          {show && <Card id="x" top={0} />}
        </FlipProvider>
      );
    }

    const user = userEvent.setup();
    render(<Toggled />);
    expect(screen.getByTestId("card-x")).toBeInTheDocument();
    await user.click(screen.getByText("Hide"));
    // Should not throw — stale ref cleaned up
    expect(screen.queryByTestId("card-x")).not.toBeInTheDocument();
  });

  it("skips animations with prefers-reduced-motion", async () => {
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

    render(
      <FlipProvider>
        <Board />
      </FlipProvider>,
    );
    await user.click(screen.getByText("Flip"));
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("passes config to animations (duration, easing)", async () => {
    const user = userEvent.setup();

    vi.spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValueOnce(makeRect({ top: 0 }))
      .mockReturnValueOnce(makeRect({ top: 200 }))
      .mockReturnValueOnce(makeRect({ top: 200 }))
      .mockReturnValueOnce(makeRect({ top: 0 }));

    render(
      <FlipProvider duration={500} easing="ease-in-out">
        <Board />
      </FlipProvider>,
    );
    await user.click(screen.getByText("Flip"));
    await waitFor(() => {
      const [, options] = animateMock.mock.calls[0];
      expect(options.duration).toBe(500);
      expect(options.easing).toBe("ease-in-out");
    });
  });
});
