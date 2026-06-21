"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portfolioData, SocialLink } from "./data";
import GlitchText from "./components/GlitchText";
import ProjectCard from "./components/ProjectCard";
import ExperienceCard from "./components/ExperienceCard";
import RadarChart from "./components/RadarChart";
import { playSynthClick, initAudioEngine } from "./utils/sound";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("about");
  const [accentTheme, setAccentTheme] = useState<'teal' | 'violet' | 'coral'>('teal');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  // Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSoundToggle = () => {
    if (!isSoundEnabled) {
      initAudioEngine();
      setIsSoundEnabled(true);
    } else {
      setIsSoundEnabled(false);
    }
  };

  // Sound effects hover listener (event delegation)
  useEffect(() => {
    if (!isSoundEnabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest(".interactive-element");
      if (interactive) {
        if (target.dataset.hovered === "true") return;
        target.dataset.hovered = "true";
        playSynthClick("hover");

        setTimeout(() => {
          target.removeAttribute("data-hovered");
        }, 150);
      }
    };

    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isSoundEnabled]);

  // Dynamic Theme Customizer Effect
  useEffect(() => {
    const root = document.documentElement;
    if (accentTheme === "teal") {
      root.style.setProperty("--accent-teal", "#22d3ee");
      root.style.setProperty("--accent-violet", "#a78bfa");
      root.style.setProperty("--spotlight-color", "rgba(34, 211, 238, 0.08)");
    } else if (accentTheme === "violet") {
      root.style.setProperty("--accent-teal", "#a78bfa");
      root.style.setProperty("--accent-violet", "#f43f5e");
      root.style.setProperty("--spotlight-color", "rgba(167, 139, 250, 0.08)");
    } else if (accentTheme === "coral") {
      root.style.setProperty("--accent-teal", "#f97316");
      root.style.setProperty("--accent-violet", "#facc15");
      root.style.setProperty("--spotlight-color", "rgba(249, 115, 22, 0.08)");
    }
  }, [accentTheme]);

  // Global mouse tracking for background spotlight mask
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      containerRef.current.style.setProperty("--mouse-x", `${e.clientX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Secret "hacker" Easter Egg
  useEffect(() => {
    let keys: string[] = [];
    const targetCode = "hacker";

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.push(e.key.toLowerCase());
      keys = keys.slice(-targetCode.length);

      if (keys.join("") === targetCode) {
        initAudioEngine();
        playSynthClick("beep");
        setTimeout(() => playSynthClick("beep"), 120);
        setTimeout(() => playSynthClick("beep"), 240);
        
        alert("CRITICAL OVERRIDE: INTRUSION ATTEMPT SPOTTED! REDIRECTING TO ROOT SHELL SYSTEM...");
        window.location.href = "/playground?override=true";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);


  // Intersection Observer for scroll spy navigation
  useEffect(() => {
    const sections = ["about", "experience", "projects", "skills", "contact"];
    const observers = sections.map((sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(sectionId);
            }
          });
        },
        {
          rootMargin: "-25% 0px -65% 0px", // Triggers active class when section is in middle viewport
        }
      );

      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  // Render social icon SVGs
  const renderSocialIcon = (iconName: string) => {
    const style = { width: "20px", height: "20px" };
    switch (iconName.toLowerCase()) {
      case "github":
        return (
          <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        );
      case "linkedin":
        return (
          <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      case "twitter":
        return (
          <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        );
      case "email":
        return (
          <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    // Simulate server side request submission delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ name: "", email: "", message: "" });

    // Reset success banner after 4 seconds
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div ref={containerRef} className="spotlight-wrapper">
      {/* Floating Theme Customizer & Sound Toggler */}
      <div 
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 50,
          background: "rgba(17, 24, 39, 0.6)",
          border: "1px solid var(--card-border)",
          padding: "8px 16px",
          borderRadius: "9999px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        className="interactive-element"
      >
        {/* Sound Toggle Button */}
        <button
          onClick={handleSoundToggle}
          style={{
            background: "transparent",
            border: "none",
            color: isSoundEnabled ? "var(--accent-teal)" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            padding: 0,
            transition: "color 0.3s ease",
          }}
          aria-label={isSoundEnabled ? "Disable sound effects" : "Enable sound effects"}
        >
          {isSoundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}>
              <path d="M10 3.75a.75.75 0 00-1.264-.546L5.203 6.25H3.75a1.75 1.75 0 00-1.75 1.75v4c0 .966.784 1.75 1.75 1.75h1.453l3.533 3.046A.75.75 0 0010 16.25V3.75zM13.28 7.22a.75.75 0 10-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 001.06 1.06L15 11.06l1.72 1.72a.75.75 0 101.06-1.06L16.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L15 8.94l-1.72-1.72z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}>
              <path d="M9.82 3.125a.75.75 0 00-1.084-.017L5.203 6.25H3.75a1.75 1.75 0 00-1.75 1.75v4c0 .966.784 1.75 1.75 1.75h1.453l3.533 3.046A.75.75 0 0010 16.25V3.75a.75.75 0 00-.18-.625zM12.44 10a2.5 2.5 0 00.75-1.768.75.75 0 111.5 0A4 4 0 0113.5 12.12.75.75 0 0112.44 10zM15.44 13a5.5 5.5 0 001.31-3.889.75.75 0 011.5 0A7 7 0 0116.5 15.56.75.75 0 0115.44 13z" />
            </svg>
          )}
        </button>

        {/* Separator Line */}
        <div style={{ width: "1px", height: "16px", background: "var(--card-border)" }} />
        <span style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", paddingLeft: "4px" }}>
          Theme
        </span>
        <button
          onClick={() => setAccentTheme('teal')}
          aria-label="Set theme to Teal"
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#22d3ee",
            border: accentTheme === 'teal' ? "2px solid #fff" : "none",
            boxShadow: "0 0 10px rgba(34, 211, 238, 0.4)",
            cursor: "pointer",
          }}
        />
        <button
          onClick={() => setAccentTheme('violet')}
          aria-label="Set theme to Violet"
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#a78bfa",
            border: accentTheme === 'violet' ? "2px solid #fff" : "none",
            boxShadow: "0 0 10px rgba(167, 139, 250, 0.4)",
            cursor: "pointer",
          }}
        />
        <button
          onClick={() => setAccentTheme('coral')}
          aria-label="Set theme to Coral"
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#f97316",
            border: accentTheme === 'coral' ? "2px solid #fff" : "none",
            boxShadow: "0 0 10px rgba(249, 115, 22, 0.4)",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Background Spotlight Tracking Layer */}
      <div className="spotlight-bg" />

      <div className="main-layout">
        {/* Left column: Profile, Navigation & Socials */}
        <header className="sidebar-column">
          <div>
            <h1 style={{ fontSize: "2.8rem", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              <GlitchText text={portfolioData.personalInfo.name} />
            </h1>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "500", color: "var(--text-primary)", marginBottom: "16px" }}>
              {portfolioData.personalInfo.title}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", maxWidth: "320px" }}>
              {portfolioData.personalInfo.subtitle}
            </p>

            {/* In-page jump navigation links */}
            <nav style={{ marginTop: "64px" }} aria-label="Sections navigation">
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                <li>
                  <a href="#about" className={`nav-link-item ${activeSection === "about" ? "active" : ""}`}>
                    <span className="nav-link-indicator" />
                    <span>About</span>
                  </a>
                </li>
                <li>
                  <a href="#experience" className={`nav-link-item ${activeSection === "experience" ? "active" : ""}`}>
                    <span className="nav-link-indicator" />
                    <span>Experience</span>
                  </a>
                </li>
                <li>
                  <a href="#projects" className={`nav-link-item ${activeSection === "projects" ? "active" : ""}`}>
                    <span className="nav-link-indicator" />
                    <span>Projects</span>
                  </a>
                </li>
                <li>
                  <a href="#skills" className={`nav-link-item ${activeSection === "skills" ? "active" : ""}`}>
                    <span className="nav-link-indicator" />
                    <span>Skills</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className={`nav-link-item ${activeSection === "contact" ? "active" : ""}`}>
                    <span className="nav-link-indicator" />
                    <span>Contact</span>
                  </a>
                </li>
                <li>
                  <Link href="/playground" className="nav-link-item interactive-element" style={{ color: "var(--accent-teal)" }}>
                    <span className="nav-link-indicator" style={{ backgroundColor: "var(--accent-teal)" }} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Playground</span>
                      <span style={{ fontSize: "0.55rem", background: "rgba(34, 211, 238, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                        Game
                      </span>
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Social Media Links */}
          <ul style={{ listStyle: "none", display: "flex", gap: "20px", alignItems: "center" }} aria-label="Social connections">
            {portfolioData.personalInfo.socials.map((social: SocialLink) => (
              <li key={social.platform}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.platform}
                  className="interactive-element"
                  style={{ color: "var(--text-secondary)", transition: "color 0.3s ease", display: "block" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-teal)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                  {renderSocialIcon(social.iconName)}
                </a>
              </li>
            ))}
          </ul>
        </header>

        {/* Right column: Sections details */}
        <main className="content-column">
          {/* About Section */}
          <section id="about" style={{ scrollMarginTop: "96px" }} aria-label="About details">
            <h2 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: "24px" }} className="d-block d-md-none">
              About
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.75" }}>
              {portfolioData.about.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Experience Section */}
          <section id="experience" style={{ scrollMarginTop: "96px" }} aria-label="Work history">
            <h2 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: "24px" }} className="d-block d-md-none">
              Experience
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {portfolioData.experiences.map((exp, index) => (
                <ExperienceCard key={index} experience={exp} />
              ))}
            </div>
            <div style={{ marginTop: "32px" }}>
              <a href={portfolioData.personalInfo.resumeUrl} target="_blank" rel="noreferrer noopener" className="btn-premium interactive-element">
                <span>View Full Résumé</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path fillRule="evenodd" d="M12.23 2.25a.75.75 0 01.02 1.06L8.53 7H17a.75.75 0 010 1.5H8.53l3.72 3.69a.75.75 0 01-1.04 1.08l-5-5a.75.75 0 010-1.08l5-5a.75.75 0 011.06.02z" clipRule="evenodd" transform="rotate(180 10 10)" />
                </svg>
              </a>
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" style={{ scrollMarginTop: "96px" }} aria-label="Featured projects">
            <h2 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: "24px" }} className="d-block d-md-none">
              Projects
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {portfolioData.projects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))}
            </div>
          </section>

          {/* Skills Section */}
          <section id="skills" style={{ scrollMarginTop: "96px" }} aria-label="Technical skills">
            <h2 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: "24px" }}>
              Skills & Expertise
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
              {portfolioData.skills.map((skill) => (
                <span
                  key={skill}
                  className="interactive-element"
                  style={{
                    display: "inline-flex",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--card-border)",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "var(--text-secondary)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-teal)";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.boxShadow = "0 0 10px rgba(34, 211, 238, 0.1)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
            
            {/* Interactive SVG Radar Skills Chart */}
            <RadarChart />
          </section>

          {/* Contact Section */}
          <section id="contact" style={{ scrollMarginTop: "96px" }} aria-label="Get in touch">
            <h2 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: "8px" }}>
              Get In Touch
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Have an exciting project, job opportunity, or just want to chat? Send me a message and I'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleFormSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="form-input interactive-element"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="form-input interactive-element"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Hi Himanshu, I'd love to work together..."
                  className="form-input interactive-element"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium interactive-element"
                style={{ width: "fit-content", marginTop: "8px" }}
              >
                {isSubmitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-9.154.75.75 0 000-1.118A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Success Feedback Banner */}
            {isSuccess && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px 20px",
                  borderRadius: "8px",
                  background: "rgba(34, 211, 238, 0.08)",
                  border: "1px solid var(--accent-teal)",
                  color: "var(--accent-teal)",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                Thank you! Your message has been sent successfully. I will get back to you shortly.
              </div>
            )}
          </section>

          {/* Simple subtle footer */}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
