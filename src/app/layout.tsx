import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import CursorFollower from "./components/CursorFollower";
import CanvasParticles from "./components/CanvasParticles";
import { portfolioData } from "./data";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${portfolioData.personalInfo.name} | ${portfolioData.personalInfo.title}`,
  description: portfolioData.personalInfo.subtitle,
  keywords: `${portfolioData.personalInfo.name}, ${portfolioData.personalInfo.title}, developer portfolio, full stack engineer, web developer`,
  authors: [{ name: portfolioData.personalInfo.name }],
  openGraph: {
    title: `${portfolioData.personalInfo.name} | ${portfolioData.personalInfo.title}`,
    description: portfolioData.personalInfo.subtitle,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${portfolioData.personalInfo.name} | ${portfolioData.personalInfo.title}`,
    description: portfolioData.personalInfo.subtitle,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        {/* Hardware-accelerated Custom Cursor Follower */}
        <CursorFollower />

        {/* Interactive Background Particles */}
        <CanvasParticles />

        {/* Aurora Glowing Backdrop */}
        <div className="aurora-container">
          <div className="aurora-blob blob-1" />
          <div className="aurora-blob blob-2" />
          <div className="aurora-blob blob-3" />
        </div>

        {/* Film Grain Texture & Grid Line Patterns */}
        <div className="overlay-grid" />
        <div className="overlay-grain" />

        {children}
      </body>
    </html>
  );
}
