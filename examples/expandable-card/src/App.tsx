import { useState } from "react";
import { useFlip } from "@vaerone/use-flip";

const articles = [
  {
    id: 1,
    title: "Why FLIP animations are faster",
    summary: "FLIP avoids animating layout properties entirely.",
    body: "Instead of animating top, left, width or height — properties that force the browser to recalculate layout on every frame — FLIP animates only transform and opacity. These two properties are handled entirely by the GPU compositor thread, meaning the main JavaScript thread stays free. The result is smooth 60fps motion even when the rest of your app is busy.",
    tag: "Performance",
    color: "#c0392b",
  },
  {
    id: 2,
    title: "How snapshot() works",
    summary: "One call before a state update is all it takes.",
    body: "snapshot() calls getBoundingClientRect() synchronously, capturing the element's current position in the viewport. When React re-renders and the element moves, the library computes the delta between the old and new positions, applies an inverted transform to visually hold the element in place, then animates that transform back to zero — creating the illusion of smooth movement.",
    tag: "API",
    color: "#2980b9",
  },
  {
    id: 3,
    title: "When to use useFlipGroup",
    summary: "For lists, grids, and any keyed collection.",
    body: "useFlipGroup tracks multiple elements by key. When the collection reorders — from a sort, filter, or drag-and-drop — every element that changed position gets its own independent FLIP animation. Each item moves from where it was to where it is now, simultaneously, without any manual position calculation.",
    tag: "Hooks",
    color: "#27ae60",
  },
];

function Card({ article }: { article: (typeof articles)[number] }) {
  const [expanded, setExpanded] = useState(false);

  const { ref, snapshot, isAnimating } = useFlip({
    duration: 380,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  });

  const toggle = () => {
    snapshot();
    setExpanded((prev) => !prev);
  };

  return (
    <div
      ref={ref}
      onClick={toggle}
      style={{
        background: "#fff",
        border: "1.5px solid #e8e4df",
        borderRadius: 12,
        padding: "20px 24px",
        cursor: "pointer",
        overflow: "hidden",
        userSelect: "none",
        borderTop: `3px solid ${article.color}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: article.color,
            textTransform: "uppercase",
          }}
        >
          {article.tag}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "#aaa",
            transition: "transform 0.3s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#1a1a1a",
          marginBottom: 6,
          lineHeight: 1.4,
        }}
      >
        {article.title}
      </h3>

      <p style={{ fontSize: 14, color: "#888", margin: 0, lineHeight: 1.6 }}>
        {article.summary}
      </p>

      {expanded && (
        <p
          style={{
            fontSize: 14,
            color: "#444",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #f0ece8",
            lineHeight: 1.75,
            marginBottom: 0,
          }}
        >
          {article.body}
        </p>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: "#bbb" }}>
        {isAnimating
          ? "animating..."
          : expanded
            ? "Click to collapse"
            : "Click to expand"}
      </div>
    </div>
  );
}

export default function App() {
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
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
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
            Expandable Card
          </h1>
          <p style={{ fontSize: 15, color: "#888", margin: 0 }}>
            Click any card to expand it with a FLIP animation
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {articles.map((article) => (
            <Card key={article.id} article={article} />
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 13,
            color: "#bbb",
          }}
        >
          Each card uses{" "}
          <code
            style={{
              background: "#f0ece8",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 12,
              color: "#888",
            }}
          >
            useFlip
          </code>{" "}
          independently
        </div>
      </div>
    </div>
  );
}
