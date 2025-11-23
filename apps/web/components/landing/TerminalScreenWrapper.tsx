"use client";

import React from "react";

/**
 * TerminalScreenWrapper - A modern implementation of retro-futuristic CRT terminal effects
 *
 * This component wraps the entire application with terminal-style visual effects:
 * - Scanline overlay for authentic CRT appearance
 * - Subtle vignette effect at corners
 * - Phosphor glow on interactive elements
 * - Deep black background with retro color scheme
 */
interface TerminalScreenWrapperProps {
  children: React.ReactNode;
}

const TerminalScreenWrapper = ({ children }: TerminalScreenWrapperProps) => {
  return (
    <div className="relative min-h-screen bg-terminal-black font-mono text-terminal-phosphor overflow-x-hidden">
      {/* Main content wrapper */}
      <div className="relative z-10">{children}</div>

      {/* Scanline overlay - creates horizontal lines effect */}
      <div
        className="fixed inset-0 pointer-events-none z-20 opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 65, 0.1) 2px,
            rgba(0, 255, 65, 0.1) 4px
          )`,
        }}
      />

      {/* Vignette overlay - subtle corner darkening */}
      <div
        className="fixed inset-0 pointer-events-none z-20"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 70%,
            rgba(5, 5, 5, 0.3) 100%
          )`,
        }}
      />

      {/* Subtle screen flicker animation */}
      <div
        className="fixed inset-0 pointer-events-none z-30 opacity-5"
        style={{
          background: "rgba(0, 255, 65, 0.02)",
          animation: "flicker 0.15s infinite linear alternate",
        }}
      />

      {/* Global styles for the terminal effect */}
      <style jsx>{`
        @keyframes flicker {
          0% {
            opacity: 0.02;
          }
          100% {
            opacity: 0.05;
          }
        }

        /* Global text glow for all phosphor-colored text */
        .text-terminal-phosphor {
          text-shadow: 0 0 5px currentColor;
        }

        /* Enhanced glow for headers and important text */
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          text-shadow: 0 0 8px currentColor;
        }

        /* Subtle glow for buttons and interactive elements */
        button,
        a {
          transition: all 0.2s ease;
        }

        button:hover,
        a:hover {
          text-shadow: 0 0 10px currentColor;
        }

        /* Terminal cursor blink animation */
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        .cursor-blink::after {
          content: "_";
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default TerminalScreenWrapper;
