"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { RefreshCcw } from "lucide-react";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check for camera permissions
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Video constraints
  const videoConstraints = {
    facingMode: facingMode,
    // Use a typical mobile aspect ratio or responsive
    aspectRatio: 9 / 16,
  };

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white font-sans text-base">Cargando permisos...</p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white font-sans text-base mb-4">Se necesita permiso para usar la cámara</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-black px-6 py-3 rounded font-medium"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Camera View */}
      <div className="flex-1 relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover"
          mirrored={facingMode === "user"}
        />
      </div>

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 z-10 pt-[env(safe-area-inset-top)] pb-4">
        <div className="flex flex-col items-center justify-center pt-4 px-6">
          <h1 className="text-white text-sm tracking-[0.25em] font-light font-sans">
            FACE RECOGNITION
          </h1>
          {/* Status text placeholder - shows when face detected */}
          {/* <p className="text-white text-[10px] tracking-[0.2em] font-normal mt-1 font-sans">
            CARA DETECTADA
          </p> */}
        </div>
      </div>

      {/* Face Box (Mockup/Placeholder) - Hidden by default as per logic, but structure is here */}
      {/* 
      <div 
        className="absolute z-[5] border-2 border-white"
        style={{
            left: '50%',
            top: '50%',
            width: '200px',
            height: '200px',
            transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="absolute w-5 h-5 border-white border-l-2 border-t-2 -top-[2px] -left-[2px]"></div>
        <div className="absolute w-5 h-5 border-white border-r-2 border-t-2 -top-[2px] -right-[2px]"></div>
        <div className="absolute w-5 h-5 border-white border-l-2 border-b-2 -bottom-[2px] -left-[2px]"></div>
        <div className="absolute w-5 h-5 border-white border-r-2 border-b-2 -bottom-[2px] -right-[2px]"></div>
      </div> 
      */}

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 z-10 pb-[env(safe-area-inset-bottom)] pt-10">
        <div className="flex flex-col items-center justify-center pb-10 px-6">
          <p className="text-white text-xs tracking-widest font-light font-sans mb-6">
            {facingMode === "user" ? "Mira a la cámara frontal" : "Usando cámara trasera"}
          </p>
          
          {/* Camera Switch Control */}
          <button 
            onClick={toggleCamera}
            className="p-3 rounded-full bg-white/20 backdrop-blur-sm active:bg-white/40 transition-colors"
            aria-label="Cambiar cámara"
          >
            <RefreshCcw className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
