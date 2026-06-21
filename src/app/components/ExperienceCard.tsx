"use client";

import React, { useRef } from "react";
import { Experience } from "../data";

interface ExperienceCardProps {
  experience: Experience;
}

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty("--card-mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--card-mouse-y", `${y}px`);

    // 3D Tilt calculation
    const maxTilt = 4; // subtle tilt for experience list cards
    const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * maxTilt;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

    cardRef.current.style.setProperty("--card-tilt-x", `${rotateX}deg`);
    cardRef.current.style.setProperty("--card-tilt-y", `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--card-tilt-x", "0deg");
    cardRef.current.style.setProperty("--card-tilt-y", "0deg");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="spotlight-card interactive-element spotlight-card-tilt"
    >
      <div className="spotlight-card-content" style={{ display: "flex", gap: "24px", flexDirection: "row" }}>
        {/* Left Column: Date Range */}
        <div style={{ width: "25%", minWidth: "100px", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: "4px" }}>
          {experience.yearRange}
        </div>
        
        {/* Right Column: Experience Details */}
        <div style={{ width: "75%", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span>{experience.title}</span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            {experience.companyUrl ? (
              <a
                href={experience.companyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="interactive-element"
                style={{ color: "var(--accent-teal)", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <span>{experience.company}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "12px", height: "12px", transition: "transform 0.2s" }} className="company-link-arrow">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            ) : (
              <span style={{ color: "var(--accent-teal)" }}>{experience.company}</span>
            )}
          </h3>
          
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6", marginBottom: "16px" }}>
            {experience.description}
          </p>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {experience.tags.map((tag) => (
              <span key={tag} className="tech-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .spotlight-card:hover .company-link-arrow {
          transform: translate(2px, -2px);
        }
        @media (max-width: 640px) {
          .spotlight-card-content {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .spotlight-card-content > div {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
