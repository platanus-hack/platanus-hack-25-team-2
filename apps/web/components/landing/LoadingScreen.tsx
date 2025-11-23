"use client";

import React from "react";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-black z-100 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        {/* Logo matching Navbar */}
        <div className="text-4xl md:text-5xl font-bold text-terminal-phosphor mb-4 font-mono">
          [ RECORD<span className="text-gray-400">.AI</span> ]
        </div>
        {/* Optional spinner or just the pulsing logo */}
        <div className="w-12 h-12 border-4 border-terminal-phosphor border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
