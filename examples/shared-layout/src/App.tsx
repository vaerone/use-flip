import { useState } from "react";
import { FlipProvider, useFlipRegistered, useFlipContext } from "../../../src";

const cards = [
  {
    id: "hooks",
    title: "Hooks",
    desc: "useFlip and useFlipGroup APIs",
  },
  {
    id: "provider",
    title: "Provider",
    desc: "Shared layout coordination",
  },
  {
    id: "typescript",
    title: "TypeScript",
    desc: "Fully typed public API",
  },
  {
    id: "performance",
    title: "Performance",
    desc: "GPU accelerated transforms",
  },
];

function FeatureCard({
  card,
  expanded,
  index,
}: {
  card: (typeof cards)[number];
  expanded: boolean;
  index: number;
}) {
  const ref = useFlipRegistered(card.id);

  const positions = expanded
    ? [
        { top: 0, left: 0 },
        { top: 0, left: 320 },
        { top: 240, left: 0 },
        { top: 240, left: 320 },
      ]
    : [
        { top: 0, left: 170 },
        { top: 140, left: 170 },
        { top: 280, left: 170 },
        { top: 420, left: 170 },
      ];

  const pos = positions[index];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",

        top: pos.top,
        left: pos.left,

        width: 280,
        height: expanded ? 200 : 110,

        background: "#fff",
        border: "1.5px solid #e8e4df",
        borderRadius: 14,
        padding: 20,

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",

        willChange: "transform",
        transformOrigin: "center center",
        backfaceVisibility: "hidden",
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            color: "#1a1a1a",
          }}
        >
          {card.title}
        </h3>

        <p
          style={{
            marginTop: 10,
            color: "#777",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {card.desc}
        </p>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid #f0ece8",
            color: "#999",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          Coordinated layout animation powered by FlipProvider.
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [expanded, setExpanded] = useState(false);

  const { snapshotAll } = useFlipContext();

  const toggle = () => {
    snapshotAll();

    requestAnimationFrame(() => {
      setExpanded((v) => !v);
    });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <button
          onClick={toggle}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1.5px solid #111",
            background: "#111",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {expanded ? "Stack Layout" : "Grid Layout"}
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: 620,
          height: expanded ? 460 : 560,
          margin: "0 auto",

          display: "flex",
          justifyContent: "center",
        }}
      >
        {cards.map((card, index) => (
          <FeatureCard
            key={card.id}
            card={card}
            expanded={expanded}
            index={index}
          />
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <FlipProvider
      duration={1000}
      easing="cubic-bezier(0.22, 1, 0.36, 1)"
      animatePosition
      animateSize
      animateOpacity={false}
    >
      <div
        style={{
          minHeight: "100vh",
          background: "#faf9f7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 20px",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1100,
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 36,
            }}
          >
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
              Coordinated Layout
            </h1>

            <p
              style={{
                fontSize: 15,
                color: "#888",
                margin: 0,
              }}
            >
              Registered elements animate together via FlipProvider
            </p>
          </div>

          <Dashboard />

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
              FlipProvider
            </code>{" "}
            +{" "}
            <code
              style={{
                background: "#f0ece8",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 12,
                color: "#888",
              }}
            >
              useFlipRegistered
            </code>
          </div>
        </div>
      </div>
    </FlipProvider>
  );
}
