"use client";

import React, { useRef } from "react";
import { Project } from "../data";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty("--card-mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--card-mouse-y", `${y}px`);

    // 3D Tilt calculation
    const maxTilt = 8; // degrees
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
      style={{
        borderLeft: `3px solid ${project.accentColor}`
      } as React.CSSProperties}
    >
      <div className="spotlight-card-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--text-primary)" }}>
            {project.title}
          </h3>
          <div style={{ display: "flex", gap: "12px" }}>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`GitHub repository for ${project.title}`}
                className="project-link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            )}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Live site for ${project.title}`}
                className="project-link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6", marginBottom: "20px" }}>
          {project.description}
        </p>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {project.tags.map((tag) => (
            <span key={tag} className="tech-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
