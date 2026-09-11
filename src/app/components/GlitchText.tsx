"use client";

import React from "react";

interface GlitchTextProps 
  text: string;
  className?: string;
}

export default function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <span className={`glitch-wrapper ${className}`}>
      <span className="glitch-text" data-text={text}>
        {text}
      </span>
    </span>
  );
}
