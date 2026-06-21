export interface SocialLink {
  platform: string;
  url: string;
  iconName: string; // Used to determine icon rendering
}

export interface Experience {
  yearRange: string;
  title: string;
  company: string;
  companyUrl?: string;
  description: string;
  tags: string[];
}

export interface Project {
  title: string;
  description: string;
  url?: string;
  githubUrl?: string;
  tags: string[];
  accentColor: string; // HSL color string, e.g., "var(--accent-teal)" or custom hex
}

export interface PortfolioData {
  personalInfo: {
    name: string;
    title: string;
    subtitle: string;
    bio: string;
    resumeUrl: string;
    socials: SocialLink[];
  };
  about: string[];
  experiences: Experience[];
  projects: Project[];
  skills: string[];
}

export const portfolioData: PortfolioData = {
  personalInfo: {
    name: "Alex Rivera",
    title: "Senior Full Stack Engineer",
    subtitle: "I build responsive, pixel-perfect experiences for the web.",
    bio: "Focused on crafting high-performance, accessible web applications at the intersection of design and scale.",
    resumeUrl: "/resume.pdf",
    socials: [
      {
        platform: "GitHub",
        url: "https://github.com",
        iconName: "github"
      },
      {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        iconName: "linkedin"
      },
      {
        platform: "Twitter",
        url: "https://twitter.com",
        iconName: "twitter"
      },
      {
        platform: "Email",
        url: "mailto:alex@rivera.dev",
        iconName: "email"
      }
    ]
  },
  about: [
    "I'm a software engineer with over six years of experience building accessible, inclusive products and digital experiences. I specialize in React, Next.js, Node.js, and TypeScript, focusing on clean architecture, fluid animations, and pixel-perfect execution.",
    "Currently, I work on the Core UI Platform team at TechSphere, where I lead the development of our enterprise component library. I partner closely with design and accessibility specialists to ensure inclusive design standards are built into the core foundations of all our user journeys.",
    "Outside of my day-to-day work, I am passionate about open-source projects, mentoring junior developers, and experimenting with creative coding tools like Three.js and WebGL. When I'm not in front of a screen, you'll likely find me hiking, taking film photographs, or reading sci-fi novels."
  ],
  experiences: [
    {
      yearRange: "2024 — Present",
      title: "Senior Full Stack Engineer",
      company: "TechSphere",
      companyUrl: "https://example.com",
      description: "Build and scale modular UI components and tooling for the core product library. Advocate for web accessibility (WCAG AA standards) across multi-functional development hubs. Optimize React rendering lifecycles, cutting initial bundle sizes by 28%.",
      tags: ["React", "TypeScript", "Next.js", "Jest", "Web Accessibility"]
    },
    {
      yearRange: "2021 — 2024",
      title: "Software Engineer II",
      company: "NovaStream Solutions",
      companyUrl: "https://example.com",
      description: "Architected a real-time analytics dashboard monitoring internal server health, handling over 250,000 requests per minute. Spearheaded a migration from legacy codebase to Next.js App Router, resulting in a 40% improvement in page transition speed.",
      tags: ["TypeScript", "Next.js", "Node.js", "GraphQL", "Docker"]
    },
    {
      yearRange: "2019 — 2021",
      title: "Frontend Developer",
      company: "PixelCraft Agency",
      companyUrl: "https://example.com",
      description: "Developed and launched custom static websites and headless CMS architectures for mid-to-enterprise clients. Integrated micro-animations and physics-based graphics to build award-winning creative interfaces.",
      tags: ["JavaScript", "React", "Sass", "Gatsby", "Framer Motion"]
    }
  ],
  projects: [
    {
      title: "Spectral Dash",
      description: "A highly-customizable data visualization workspace integrating server-sent events for real-time traffic statistics. Features interactive charting, dark-mode styling, and custom metrics monitoring templates.",
      url: "https://example.com",
      githubUrl: "https://github.com",
      tags: ["React", "TypeScript", "Chart.js", "Node.js"],
      accentColor: "var(--accent-teal)"
    },
    {
      title: "Vortex CMS",
      description: "A lightweight, headless content management system optimized for developer convenience. Employs advanced indexing architectures to support zero-lag API-based content distribution.",
      url: "https://example.com",
      githubUrl: "https://github.com",
      tags: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
      accentColor: "var(--accent-violet)"
    },
    {
      title: "Fluid Dynamics Simulator",
      description: "A creative web playground utilizing WebGL shader code to simulate interactive liquid behavior. Features physics adjustments, custom color palettes, and full multi-touch tablet support.",
      url: "https://example.com",
      githubUrl: "https://github.com",
      tags: ["HTML5 Canvas", "WebGL", "TypeScript", "Three.js"],
      accentColor: "var(--accent-blue)"
    }
  ],
  skills: [
    "JavaScript (ES6+)",
    "TypeScript",
    "React / Next.js",
    "Node.js / Express",
    "HTML5 / CSS3 / Sass",
    "REST APIs & GraphQL",
    "SQL (PostgreSQL) & NoSQL (MongoDB)",
    "Git & GitHub Workflow",
    "Docker & CI/CD",
    "Web Accessibility (WCAG)"
  ]
};
