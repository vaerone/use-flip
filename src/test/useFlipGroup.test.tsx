import React, { useState } from "react";
import { render, act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFlipGroup } from "../useFlipGroup";
import { animateMock } from "./setup";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: top,
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

const INITIAL_ITEMS = ["alpha", "beta", "gamma"];

function SortableList({ items }: { items: string[] }) {
  const { getRef, snapshot } = useFlipGroup({ duration: 200 });
  return (
    <div data-flip-group>
      {items.map((item) => (
        <div key={item} ref={getRef(item)} data-testid={`item-${item}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

function ControlledList() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const { getRef, snapshot } = useFlipGroup({ duration: 200 });

  return (
    <div data-flip-group>
      <button
        onClick={() => {
          snapshot();
          setItems((prev) => [...prev].reverse());
        }}
      >
        Shuffle
      </button>
      <button
        onClick={() => {
          snapshot();
          setItems((prev) => prev.filter((i) => i !== "beta"));
        }}
      >
        Remove beta
      </button>
      <button
        onClick={() => {
          snapshot();
          setItems((prev) => [...prev, "delta"]);
        }}
      >
        Add delta
      </button>
      {items.map((item) => (
        <div key={item} ref={getRef(item)} data-testid={`item-${item}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useFlipGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders list without animating on mount", () => {
    render(<SortableList items={INITIAL_ITEMS} />);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("animates items that changed position after shuffle", async () => {
    const user = userEvent.setup();

    let phase: "first" | "last" = "first";

    const positions = {
      alpha: { first: 0, last: 100 },
      beta: { first: 50, last: 50 },
      gamma: { first: 100, last: 0 },
    } as const;

    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        const testId = this.getAttribute("data-testid");
        const key = testId?.replace("item-", "") as keyof typeof positions;

        if (!key || !positions[key]) {
          return makeRect({ top: 0, left: 0 });
        }

        return makeRect({ top: positions[key][phase], left: 0 });
      },
    );

    render(<ControlledList />);

    // --- CRITICAL PART ---
    // Click synchronously so snapshot() runs in "first"
    await waitFor(async () => {
      const btn = screen.getByText("Shuffle");

      // fire event manually to control timing
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // snapshot() has run → now switch to "last"
      phase = "last";
    });

    await waitFor(() => {
      expect(animateMock).toHaveBeenCalledTimes(2);
    });
  });

  it("plays enter animation for newly added item", async () => {
    const user = userEvent.setup();
    render(<ControlledList />);
    await user.click(screen.getByText("Add delta"));

    // The new "delta" item should get an enter animation
    expect(animateMock).toHaveBeenCalled();
    const enterCall = animateMock.mock.calls.find(
      ([kf]) => Array.isArray(kf) && kf[0]?.opacity === 0,
    );
    expect(enterCall).toBeDefined();
  });

  it("does not animate when prefers-reduced-motion is set", async () => {
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

    render(<ControlledList />);
    await user.click(screen.getByText("Shuffle"));
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("cleans up element registry on unmount (no stale refs)", async () => {
    function Toggled() {
      const [show, setShow] = useState(true);
      const { getRef } = useFlipGroup();
      return (
        <div>
          <button onClick={() => setShow(false)}>Hide</button>
          {show && (
            <div ref={getRef("x")} data-testid="x">
              X
            </div>
          )}
        </div>
      );
    }

    const user = userEvent.setup();
    render(<Toggled />);
    expect(screen.getByTestId("x")).toBeInTheDocument();
    await user.click(screen.getByText("Hide"));
    expect(screen.queryByTestId("x")).not.toBeInTheDocument();
    // No errors thrown — stale ref was cleaned up
  });

  it("handles React 18 Strict Mode double-mount without duplicate registration", () => {
    // Strict Mode mounts → unmounts → remounts each component.
    // getRef should handle this without throwing or losing the element.
    const { getRef } = (() => {
      let result: ReturnType<typeof useFlipGroup>;
      function Probe() {
        result = useFlipGroup();
        return <div ref={result.getRef("probe")} />;
      }
      render(
        <React.StrictMode>
          <Probe />
        </React.StrictMode>,
      );
      return result!;
    })();

    // Should not throw; group is usable after Strict Mode double-mount
    expect(() => getRef("probe")).not.toThrow();
  });
});
