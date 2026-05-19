import { useState } from "react";
// import { useFlipGroup } from "@vaerone/use-flip";
import { useFlipGroup } from "../../../src";

type SortKey = "name" | "size";

const libraries = [
  {
    id: 1,
    name: "@vaerone/use-flip",
    stars: 941,
    size: 2.1,
    deps: 0,
    color: "#c0392b",
    desc: "FLIP hooks for React",
  },
  {
    id: 2,
    name: "framer-motion",
    stars: 24800,
    size: 146,
    deps: 4,
    color: "#7c3aed",
    desc: "Full animation framework",
  },
  {
    id: 3,
    name: "react-spring",
    stars: 27400,
    size: 84,
    deps: 3,
    color: "#2563eb",
    desc: "Spring physics animations",
  },
  {
    id: 4,
    name: "motion-one",
    stars: 4200,
    size: 18,
    deps: 0,
    color: "#059669",
    desc: "Web Animations API wrapper",
  },
  {
    id: 5,
    name: "animejs",
    stars: 49100,
    size: 17,
    deps: 0,
    color: "#d97706",
    desc: "JavaScript animation engine",
  },
];

const sortFns: Record<
  SortKey,
  (a: (typeof libraries)[number], b: (typeof libraries)[number]) => number
> = {
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => a.size - b.size,
};

const sortLabels: Record<SortKey, string> = {
  name: "Name A→Z",
  size: "Smallest",
};

export default function App() {
  const [items, setItems] = useState(libraries);
  const [activeSort, setActiveSort] = useState<SortKey | null>(null);

  const { getRef, snapshot } = useFlipGroup({
    duration: 500,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    animateSize: false,
    animateOpacity: false,
    animatePosition: true,
  });

  const sortBy = (key: SortKey) => {
    snapshot();
    setActiveSort(key);
    setItems((prev) => [...prev].sort(sortFns[key]));
  };

  const shuffle = () => {
    snapshot();
    setActiveSort(null);
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 580 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-block",
              background: "#111",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              padding: "6px 14px",
              borderRadius: 20,
              marginBottom: 16,
              fontFamily: "monospace",
            }}
          >
            @vaerone/use-flip
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 8px",
            }}
          >
            Sortable List
          </h1>
          <p style={{ fontSize: 15, color: "#888", margin: 0 }}>
            Sort or shuffle, every item animates to its new position
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
            justifyContent: "center",
          }}
        >
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => sortBy(key)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1.5px solid",
                borderColor: activeSort === key ? "#111" : "#e0dcd8",
                background: activeSort === key ? "#111" : "#fff",
                color: activeSort === key ? "#fff" : "#555",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {sortLabels[key]}
            </button>
          ))}
          <button
            onClick={shuffle}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1.5px solid #e0dcd8",
              background: "#fff",
              color: "#555",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Shuffle
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
          }}
        >
          {items.map((lib, index) => (
            <div
              key={lib.id}
              ref={getRef(String(lib.id))}
              style={{
                position: "relative",
                background: "#fff",
                border: "1.5px solid #e8e4df",
                borderLeft: `4px solid ${lib.color}`,
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "#f4f2ef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#aaa",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1a1a1a",
                    fontFamily: "monospace",
                    marginBottom: 2,
                  }}
                >
                  {lib.name}
                </div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{lib.desc}</div>
              </div>

              <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}
                  >
                    {lib.size}kb
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>gzipped</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: 13,
            color: "#bbb",
          }}
        >
          Powered by{" "}
          <code
            style={{
              background: "#f0ece8",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 12,
              color: "#888",
            }}
          >
            useFlipGroup
          </code>
        </div>
      </div>
    </div>
  );
}
