"use client";

import React, { useState } from "react";

interface SkillAxis {
  name: string;
  value: number; // 0 to 100
}

const SKILLS_DATA: SkillAxis[] = [
  { name: "Frontend (React/Next)", value: 95 },
  { name: "Backend (Node/APIs)", value: 85 },
  { name: "Systems (DBs/SQL)", value: 80 },
  { name: "Architecture", value: 75 },
  { name: "UI/UX & Design", value: 80 }
];

export default function RadarChart() {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  // SVG Size Constants
  const width = 340;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 100; // max radius for 100% value
  const totalAxes = SKILLS_DATA.length;

  // Calculate coordinates for a given axis and value
  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2; // Offset by -90deg to start at top
    const r = (val / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  // Generate web concentric backgrounds (20%, 40%, 60%, 80%, 100% rings)
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridPolygons = levels.map((level) => {
    const points = [];
    for (let i = 0; i < totalAxes; i++) {
      const coord = getCoordinates(i, level * 100);
      points.push(`${coord.x},${coord.y}`);
    }
    return points.join(" ");
  });

  // Calculate active data polygon coordinates
  const dataPoints = SKILLS_DATA.map((axis, index) => {
    // Stretches axis dynamically on hover for interactive feedback
    const scaleFactor = hoveredAxis === index ? 1.05 : 1;
    const coord = getCoordinates(index, axis.value * scaleFactor);
    return `${coord.x},${coord.y}`;
  }).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "24px" }}>
      <div 
        style={{ 
          position: "relative",
          background: "rgba(17, 24, 39, 0.3)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "16px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "380px"
        }}
        className="interactive-element"
      >
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--accent-violet)" stopOpacity={0.05} />
            </radialGradient>
            <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Web Concentric grid lines */}
          {gridPolygons.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth="1"
            />
          ))}

          {/* Radar Axis lines */}
          {SKILLS_DATA.map((_, index) => {
            const outerCoord = getCoordinates(index, 100);
            return (
              <line
                key={index}
                x1={cx}
                y1={cy}
                x2={outerCoord.x}
                y2={outerCoord.y}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Glowing Skills Polygon Area */}
          <polygon
            points={dataPoints}
            fill="url(#radar-glow)"
            stroke="var(--accent-teal)"
            strokeWidth="2"
            style={{ transition: "all 0.3s ease", filter: "drop-shadow(0px 0px 4px rgba(34, 211, 238, 0.3))" }}
          />

          {/* Axis Labels and Interactive Nodes */}
          {SKILLS_DATA.map((axis, index) => {
            const textCoord = getCoordinates(index, 120); // offset labels slightly outward
            const nodeCoord = getCoordinates(index, axis.value);
            const isHovered = hoveredAxis === index;

            return (
              <g key={index} style={{ cursor: "pointer" }}>
                {/* Invisible larger hover node target */}
                <circle
                  cx={nodeCoord.x}
                  cy={nodeCoord.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredAxis(index)}
                  onMouseLeave={() => setHoveredAxis(null)}
                />

                {/* Glowing Node Dot */}
                <circle
                  cx={nodeCoord.x}
                  cy={nodeCoord.y}
                  r={isHovered ? "6" : "4.5"}
                  fill={isHovered ? "var(--accent-teal)" : "var(--accent-violet)"}
                  stroke="#fff"
                  strokeWidth={isHovered ? "1.5" : "1"}
                  style={{ transition: "all 0.2s ease" }}
                  onMouseEnter={() => setHoveredAxis(index)}
                  onMouseLeave={() => setHoveredAxis(null)}
                />

                {/* Axis Label Text */}
                <text
                  x={textCoord.x}
                  y={textCoord.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHovered ? "var(--accent-teal)" : "var(--text-secondary)"}
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: isHovered ? "700" : "500",
                    fontFamily: "var(--font-outfit), sans-serif",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={() => setHoveredAxis(index)}
                  onMouseLeave={() => setHoveredAxis(null)}
                >
                  {axis.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover statistics detail box */}
        <div style={{ minHeight: "40px", marginTop: "8px", textAlign: "center" }}>
          {hoveredAxis !== null ? (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--accent-teal)" }}>
                {SKILLS_DATA[hoveredAxis].name}
              </span>
              <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>|</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Expertise: {SKILLS_DATA[hoveredAxis].value}%
              </span>
            </div>
          ) : (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Hover over axis nodes to query expertise ratings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
