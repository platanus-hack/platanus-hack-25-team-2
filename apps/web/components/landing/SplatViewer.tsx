"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Splat, Center } from "@react-three/drei";

function SplatModel() {
  return (
    <Center>
      <Splat src="/lentes_modelo3d.splat" alphaTest={0.1} toneMapped={false} />
    </Center>
  );
}

export default function SplatViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0); // Force remount on context loss

  // Lazy load when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle context loss by remounting
  useEffect(() => {
    if (!isVisible) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("WebGL context lost. Remounting...");
      setTimeout(() => setKey((prev) => prev + 1), 100);
    };

    const container = containerRef.current;
    const canvas = container?.querySelector("canvas");

    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost);
      return () =>
        canvas.removeEventListener("webglcontextlost", handleContextLost);
    }
  }, [isVisible, key]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: "relative" }}
    >
      {!isVisible ? (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400 text-xs font-mono">
            LOADING_3D_MODEL...
          </div>
        </div>
      ) : (
        <Canvas
          key={key}
          camera={{ position: [0, 0, 2.5], fov: 50, near: 0.1, far: 1000 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          resize={{ scroll: false, debounce: 0 }}
        >
          <color attach="background" args={["#FFF"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <OrbitControls
            makeDefault
            autoRotate
            autoRotateSpeed={2.0}
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={5}
          />
          <SplatModel />
        </Canvas>
      )}
    </div>
  );
}
