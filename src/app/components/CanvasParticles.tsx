"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function CanvasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 45; // Small count for peak 60fps performance
    const connectionDistance = 110;
    const mouseConnectionDistance = 150;

    // Theme color references (RGB coordinates for alpha interpolation)
    let tealRgb = { r: 34, g: 211, b: 238 };
    let violetRgb = { r: 167, g: 139, b: 250 };

    const parseHexColor = (hexStr: string) => {
      const hex = hexStr.trim();
      if (!hex.startsWith("#")) return null;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const updateThemeColors = () => {
      if (typeof window === "undefined") return;
      const rootStyles = getComputedStyle(document.documentElement);
      const tealColor = rootStyles.getPropertyValue("--accent-teal").trim();
      const violetColor = rootStyles.getPropertyValue("--accent-violet").trim();

      const parsedTeal = parseHexColor(tealColor);
      const parsedViolet = parseHexColor(violetColor);

      if (parsedTeal) tealRgb = parsedTeal;
      if (parsedViolet) violetRgb = parsedViolet;
    };

    // Initialize colors
    updateThemeColors();

    // Setup MutationObserver to watch style modifications on html root element
    const observer = new MutationObserver(() => {
      updateThemeColors();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, // Slow, peaceful movements
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    const onMouseLeave = () => {
      mousePos.current.x = -1000;
      mousePos.current.y = -1000;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tealRgb.r}, ${tealRgb.g}, ${tealRgb.b}, 0.25)`;
        ctx.fill();

        // Connect particles to each other
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${violetRgb.r}, ${violetRgb.g}, ${violetRgb.b}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Connect particle to mouse pointer
        const mouseDist = Math.hypot(p.x - mousePos.current.x, p.y - mousePos.current.y);
        if (mouseDist < mouseConnectionDistance) {
          const alpha = (1 - mouseDist / mouseConnectionDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mousePos.current.x, mousePos.current.y);
          ctx.strokeStyle = `rgba(${tealRgb.r}, ${tealRgb.g}, ${tealRgb.b}, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
