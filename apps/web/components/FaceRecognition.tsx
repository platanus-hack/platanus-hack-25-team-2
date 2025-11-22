"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { RefreshCcw } from "lucide-react";

interface FaceRecognitionProps {
  onPhotoCapture?: (photo: string) => void;
}

interface MatchResult {
  match_found: boolean;
  person_name: string | null;
  distance: number | null;
  threshold: number;
  linkedin_content?: string | null;
  discord_username?: string | null;
  message: string;
}

export default function FaceRecognition({
  onPhotoCapture,
}: FaceRecognitionProps) {
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [timeUntilNextCheck, setTimeUntilNextCheck] = useState<number>(5);
  const [faceBox, setFaceBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Check for camera permissions
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log("✅ Face detection models loaded");
      } catch (error) {
        console.error("❌ Error loading face detection models:", error);
      }
    };

    loadModels();
  }, []);

  // Face detection and automatic matching loop
  useEffect(() => {
    if (!modelsLoaded) return;

    const detectAndMatch = async () => {
      if (!webcamRef.current || isProcessing) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length > 0) {
          setFaceDetected(true);

          // Obtener las coordenadas de la cara detectada
          const detection = detections[0];
          const box = detection.box;

          // Calcular posición relativa al video
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          setFaceBox({
            x: (box.x / videoWidth) * 100,
            y: (box.y / videoHeight) * 100,
            width: (box.width / videoWidth) * 100,
            height: (box.height / videoHeight) * 100,
          });

          // Verificar si han pasado al menos 5 segundos desde la última verificación
          const now = Date.now();
          const timeSinceLastCheck = now - lastCheckTime;

          if (timeSinceLastCheck >= 5000) {
            await performFaceMatch();
            setLastCheckTime(now);
          } else {
            // Actualizar contador
            setTimeUntilNextCheck(
              Math.ceil((5000 - timeSinceLastCheck) / 1000)
            );
          }
        } else {
          setFaceDetected(false);
          setMatchResult(null);
          setFaceBox(null);
        }
      } catch (error) {
        console.error("Error detecting faces:", error);
      }
    };

    const interval = setInterval(detectAndMatch, 100); // Más frecuente para seguimiento suave
    return () => clearInterval(interval);
  }, [modelsLoaded, isProcessing, lastCheckTime]);

  // Perform face matching
  const performFaceMatch = async () => {
    if (!webcamRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      // Capturar screenshot actual
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setIsProcessing(false);
        return;
      }

      // Crear un elemento de imagen para procesar con face-api
      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Detectar cara y obtener descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log("No face detected in screenshot");
        setIsProcessing(false);
        return;
      }

      console.log("✅ Face descriptor calculated, sending to API...");

      // Enviar descriptor al servidor
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          face_descriptor: Array.from(detection.descriptor),
          threshold: 0.6,
        }),
      });

      const result = await response.json();
      console.log("Match result:", result);

      setMatchResult(result);
    } catch (error) {
      console.error("Error processing face:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture photo (mantener para compatibilidad)
  const takePhoto = () => {
    if (!webcamRef.current || hasTried) return;

    setHasTried(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      console.log("📸 Photo captured");

      // Call callback if provided
      if (onPhotoCapture) {
        onPhotoCapture(imageSrc);
      }
    }
  };

  // Reset state
  const resetState = () => {
    setPhoto(null);
    setFaceDetected(false);
    setHasTried(false);
  };

  // Download photo
  const downloadPhoto = () => {
    if (!photo) return;

    const link = document.createElement("a");
    link.href = photo;
    link.download = `face-capture-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("📥 Photo downloaded");
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    resetState();
  };

  // Video constraints con exposición muy reducida
  const videoConstraints = {
    facingMode: facingMode,
    width: 1280,
    height: 720,
    advanced: [
      { exposureMode: "manual" as any },
      { exposureCompensation: -3 as any },
      { brightness: 0.1 as any },
      { contrast: 0.8 as any },
      { saturation: 0.8 as any },
    ] as any,
  };

  // Permission states
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
        <p className="text-white font-sans text-base mb-4">
          Se necesita permiso para usar la cámara
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-black px-6 py-3 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col md:flex-row">
      {/* Camera View */}
      <div className="flex-1 relative min-h-[50vh] md:min-h-screen">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover"
          mirrored={facingMode === "user"}
        />

        {/* Face Detection Box - Sigue la cara */}
        {faceDetected && faceBox && (
          <div
            className="absolute pointer-events-none transition-all duration-100 ease-out"
            style={{
              left: `${faceBox.x}%`,
              top: `${faceBox.y}%`,
              width: `${faceBox.width}%`,
              height: `${faceBox.height}%`,
            }}
          >
            {/* Cuadrado verde */}
            <div className="w-full h-full border-4 border-green-500 rounded-lg shadow-lg shadow-green-500/50"></div>

            {/* Nombre encima del cuadrado */}
            {matchResult?.match_found && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-lg">
                  {matchResult.person_name}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="w-full md:w-96 bg-black/90 backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto max-h-[50vh] md:max-h-screen">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="border-b border-white/20 pb-4">
            <h2 className="text-white text-xl font-light tracking-wider">
              RECONOCIMIENTO FACIAL
            </h2>
            <p className="text-white/60 text-xs mt-2 tracking-wide">
              Sistema de verificación en tiempo real
            </p>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Estado:</span>
              <span
                className={`text-sm font-medium ${
                  faceDetected ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {faceDetected ? "● Rostro detectado" : "○ Buscando rostro..."}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Modelos:</span>
              <span
                className={`text-sm font-medium ${
                  modelsLoaded ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {modelsLoaded ? "✓ Cargados" : "⟳ Cargando..."}
              </span>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Procesando:</span>
                <span className="text-sm font-medium text-blue-400">
                  ⟳ Analizando...
                </span>
              </div>
            )}
          </div>

          {/* Match Result */}
          {matchResult && (
            <div className="border-t border-white/20 pt-4 space-y-4">
              {matchResult.match_found ? (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium text-sm">
                        MATCH ENCONTRADO
                      </span>
                    </div>
                    <h3 className="text-white text-2xl font-light mb-1">
                      {matchResult.person_name}
                    </h3>
                    <p className="text-white/60 text-xs">
                      Confianza:{" "}
                      {((1 - (matchResult.distance || 0)) * 100).toFixed(1)}%
                    </p>
                  </div>

                  {matchResult.linkedin_content && (
                    <div className="space-y-2">
                      <h4 className="text-white/80 text-sm font-medium">
                        Información:
                      </h4>
                      <div className="bg-white/5 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <p className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">
                          {matchResult.linkedin_content}
                        </p>
                      </div>
                    </div>
                  )}

                  {matchResult.discord_username && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">Discord:</span>
                      <span className="text-white text-sm font-mono">
                        {matchResult.discord_username}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-red-400 font-medium text-sm">
                      NO RECONOCIDO
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{matchResult.message}</p>
                </div>
              )}

              <div className="text-white/40 text-xs text-center">
                Próxima verificación en {timeUntilNextCheck}s
              </div>
            </div>
          )}

          {!matchResult && faceDetected && (
            <div className="border-t border-white/20 pt-4">
              <div className="text-center text-white/60 text-sm">
                Esperando verificación...
              </div>
            </div>
          )}

          {!faceDetected && (
            <div className="border-t border-white/20 pt-4">
              <div className="text-center text-white/60 text-sm">
                Posiciona tu rostro frente a la cámara
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Switch Button */}
      <button
        onClick={toggleCamera}
        className="absolute bottom-6 left-6 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 transition-colors"
        aria-label="Cambiar cámara"
      >
        <RefreshCcw className="w-6 h-6 text-white" />
      </button>

      {/* Loading indicator for models */}
      {!modelsLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-black/70 text-white px-6 py-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm">Cargando modelo de detección...</p>
          </div>
        </div>
      )}
    </div>
  );
}
