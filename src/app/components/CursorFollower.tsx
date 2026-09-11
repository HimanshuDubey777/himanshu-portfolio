"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse position coordinates
  const mousePos = useRef({ x: 0, y: 0 });
  // Trailing outline position coordinates
  const outlinePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if the device is touch-based or has fine pointer
    const isTouch = window.matchMedia("(max-width: 989px)").matches;
    if (isTouch) return;

    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      
      // Update dot cursor immediately
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    // Update outline cursor with easing/lag effect
    let animationFrameId: number;
    const animateOutline = () => {
      const ease = 0.15; // Damping/smoothing factor
      
      outlinePos.current.x += (mousePos.current.x - outlinePos.current.x) * ease;
      outlinePos.current.y += (mousePos.current.y - outlinePos.current.y) * ease;

      if (outlineRef.current) {
        outlineRef.current.style.left = `${outlinePos.current.x}px`;
        outlineRef.current.style.top = `${outlinePos.current.y}px`;
      }

      animationFrameId = requestAnimationFrame(animateOutline);
    };

    animationFrameId = requestAnimationFrame(animateOutline);

    // Event listener to check for clickable hovers
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if target is a link, button, input, textarea, select or contains data-hover attribute
      const isClickable = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.closest("a") !== null ||
        target.closest("button") !== null ||
        target.closest(".interactive-element") !== null;

      setIsHovered(!!isClickable);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`cursor-wrapper ${isHovered ? "cursor-hover" : ""}`}>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={outlineRef} className="cursor-outline" />
    </div>
  );
}
