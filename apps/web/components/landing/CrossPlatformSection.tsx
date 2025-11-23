"use client";

import React from "react";

const CrossPlatformSection = () => {
  return (
    <div className="w-full bg-black font-mono text-white overflow-hidden relative py-24">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
                            linear-gradient(to right, #333 1px, transparent 1px),
                            linear-gradient(to bottom, #333 1px, transparent 1px)
                        `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Technical System Info */}
      <div className="absolute top-8 left-8 text-gray-400 text-xs font-mono z-20">
        <div>CROSS_PLATFORM.exe</div>
        <div>VERSION: v1.9.4</div>
        <div>DEVICES: SYNCED</div>
        <div>STATUS: ACTIVE</div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Column: Text */}
        <div className="space-y-8">
          <div className="text-gray-500 text-xs mb-4">
            <pre>{`
┌────────────────────────────┐
│  CONNECTIVITY_PROTOCOL.exe │
└────────────────────────────┘
                        `}</pre>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-wider uppercase">
            CONEXIÓN.PERFECTA,
            <br />
            <span className="text-gray-400">EN.CUALQUIER.LUGAR.</span>
          </h2>

          <div className="text-gray-500 text-sm mb-4">
            <div>════════════════════════════════</div>
          </div>

          <p className="text-lg leading-relaxed text-gray-300 max-w-lg uppercase">
            &gt; MANTENTE CONECTADO CON TU RED YA SEA
            <br />
            &gt; EN TU TELÉFONO, COMPUTADORA, O USANDO
            <br />
            &gt; TUS GAFAS. CAMBIA DE DISPOSITIVO AL INSTANTE
            <br />
            &gt; SIN PERDER EL RITMO.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="group relative bg-transparent border-2 border-white text-white px-8 py-3 font-mono uppercase hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 text-sm tracking-wider overflow-hidden">
              <span className="relative z-10">[ DESCARGAR.APP ]</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </button>
            <button className="bg-transparent border border-gray-400 text-gray-400 px-8 py-3 font-mono uppercase hover:border-white hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 text-sm tracking-wider">
              [ SABER.MÁS ]
            </button>
          </div>

          <div className="text-gray-600 text-xs mt-6">
            <div>COMPATIBLE_PLATFORMS:</div>
            <div>&gt; IOS | ANDROID | WINDOWS | MACOS | LINUX</div>
          </div>
        </div>

        {/* Right Column: Modern Visual Devices Grid */}
        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-full max-w-lg">
            {/* Device Grid - Modern Card Style */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {/* Mobile Device Card */}
              <div className="border border-gray-600 bg-gradient-to-br from-black to-gray-900 p-6 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-gray-400 text-xs font-mono mb-3 group-hover:text-white transition-colors">
                  MOBILE
                </div>
                <svg
                  className="w-12 h-12 text-white mb-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="5"
                    y="2"
                    width="14"
                    height="20"
                    rx="2"
                    ry="2"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="18"
                    x2="12.01"
                    y2="18"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-white text-sm font-mono text-center mb-1">
                  SMARTPHONE
                </div>
                <div className="text-gray-500 text-xs font-mono text-center">
                  iOS / Android
                </div>
                <div className="text-gray-600 text-xs font-mono text-center mt-2">
                  STATUS: SYNCED
                </div>
              </div>

              {/* Desktop Card */}
              <div className="border border-gray-600 bg-gradient-to-br from-black to-gray-900 p-6 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-gray-400 text-xs font-mono mb-3 group-hover:text-white transition-colors">
                  DESKTOP
                </div>
                <svg
                  className="w-12 h-12 text-white mb-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="14"
                    rx="2"
                    ry="2"
                    strokeWidth="2"
                  />
                  <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                  <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
                </svg>
                <div className="text-white text-sm font-mono text-center mb-1">
                  COMPUTER
                </div>
                <div className="text-gray-500 text-xs font-mono text-center">
                  Win / Mac / Linux
                </div>
                <div className="text-gray-600 text-xs font-mono text-center mt-2">
                  STATUS: SYNCED
                </div>
              </div>

              {/* Tablet Card */}
              <div className="border border-gray-600 bg-gradient-to-br from-black to-gray-900 p-6 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-gray-400 text-xs font-mono mb-3 group-hover:text-white transition-colors">
                  TABLET
                </div>
                <svg
                  className="w-12 h-12 text-white mb-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="4"
                    y="2"
                    width="16"
                    height="20"
                    rx="2"
                    ry="2"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="18"
                    x2="12.01"
                    y2="18"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-white text-sm font-mono text-center mb-1">
                  TABLET
                </div>
                <div className="text-gray-500 text-xs font-mono text-center">
                  iPad / Android
                </div>
                <div className="text-gray-600 text-xs font-mono text-center mt-2">
                  STATUS: SYNCED
                </div>
              </div>

              {/* Cloud Sync Card */}
              <div className="border border-gray-600 bg-gradient-to-br from-black to-gray-900 p-6 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-gray-400 text-xs font-mono mb-3 group-hover:text-white transition-colors">
                  CLOUD
                </div>
                <svg
                  className="w-12 h-12 text-white mb-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
                    strokeWidth="2"
                  />
                </svg>
                <div className="text-white text-sm font-mono text-center mb-1">
                  CLOUD.SYNC
                </div>
                <div className="text-gray-500 text-xs font-mono text-center">
                  Auto Backup
                </div>
                <div className="text-gray-600 text-xs font-mono text-center mt-2">
                  STATUS: ACTIVE
                </div>
              </div>
            </div>

            {/* Central US - AR Glasses */}
            <div className="mt-6 border-2 border-white bg-gradient-to-br from-black to-gray-900 p-8 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 relative group">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white"></div>

              <div className="text-center">
                <div className="text-xs text-gray-400 mb-4 font-mono">
                  [CENTRAL.US]
                </div>

                {/* Modern Glasses Icon */}
                <svg
                  className="w-20 h-20 text-white mb-4 mx-auto group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M2 10h3a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H2v7z"
                    strokeWidth="2"
                  />
                  <path
                    d="M22 10h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3v7z"
                    strokeWidth="2"
                  />
                  <path d="M8 7h8" strokeWidth="2" />
                  <circle cx="5" cy="7" r="1.5" fill="currentColor" />
                  <circle cx="19" cy="7" r="1.5" fill="currentColor" />
                </svg>

                <div className="text-xl font-bold text-white mb-2 font-mono tracking-wider">
                  AR.SMART.GLASSES
                </div>
                <div className="text-gray-400 text-xs font-mono mb-4">
                  PREMIUM.EDITION.v2
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-500">CONNECTED</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400">4 DEVICES</span>
                </div>
              </div>
            </div>

            {/* Connection Indicator */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-black/80 border border-gray-600 px-4 py-2 text-xs font-mono text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>REAL.TIME.SYNCHRONIZATION.ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Footer */}
      <div className="text-center mt-16 text-gray-500 text-xs font-mono"></div>
    </div>
  );
};

export default CrossPlatformSection;
