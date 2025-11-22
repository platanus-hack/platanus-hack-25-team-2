"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import {
  RefreshCcw,
  Camera,
  CheckCircle2,
  Loader2,
  Scan,
  Linkedin,
  Disc,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { FACE_RECOGNITION_METHOD, FACE_METHODS } from "@/lib/config";

interface FaceRecognitionProps {
  onPhotoCapture?: (photo: string) => void;
}

interface Candidate {
  person_name: string;
  discord_username?: string;
  photo_path?: string;
  linkedin_content?: string;
  distance?: number;
}

interface MatchResult {
  match_found: boolean;
  person_name: string | null;
  distance: number | null;
  confidence?: string | null;
  threshold: number;
  linkedin_content?: string | null;
  discord_username?: string | null;
  photo_path?: string | null;
  candidates?: Candidate[];
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
  const [timeUntilNextCheck, setTimeUntilNextCheck] = useState<number>(2);
  const [faceBox, setFaceBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFaceBoxRef = useRef<{
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
      // No hacer nada si ya está procesando una petición
      if (!webcamRef.current || isProcessing) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length > 0) {
          const now = Date.now();
          const wasFaceDetected = faceDetected;

          setFaceDetected(true);

          // Obtener las coordenadas de la cara detectada
          const detection = detections[0];
          const box = detection.box;

          // Calcular posición relativa al video
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          const currentFaceBox = {
            x: (box.x / videoWidth) * 100,
            y: (box.y / videoHeight) * 100,
            width: (box.width / videoWidth) * 100,
            height: (box.height / videoHeight) * 100,
          };

          setFaceBox(currentFaceBox);

          // Simplificado para face-api: solo seguir la cara sin reaccionar a movimiento
          lastFaceBoxRef.current = currentFaceBox;

          // Estrategia simple para face-api rápido:
          // - Consultar inmediatamente la primera vez
          // - Luego cada 2 segundos para la misma persona
          // - Si cambia de persona, consultar inmediatamente
          const timeSinceLastCheck = now - lastCheckTime;
          const THROTTLE_SAME_PERSON = 2000; // 2 segundos para la misma persona (más rápido)
          const isFirstDetection = !wasFaceDetected;

          const shouldCheck =
            isFirstDetection || // Siempre consultar la primera detección
            timeSinceLastCheck >= THROTTLE_SAME_PERSON; // O después del throttle

          if (shouldCheck && !isProcessing) {
            console.log("📸 Performing face match...");
            await performFaceMatch();
            setLastCheckTime(now);
          } else {
            // Actualizar contador para mostrar tiempo hasta próxima consulta
            const remainingTime = Math.max(
              0,
              THROTTLE_SAME_PERSON - timeSinceLastCheck
            );
            setTimeUntilNextCheck(Math.ceil(remainingTime / 1000));
          }
        } else {
          // Si la cara desaparece, limpiar UI pero mantener el último resultado
          if (faceDetected) {
            console.log("👋 Face disappeared");
            setFaceDetected(false);
            setFaceBox(null);
            lastFaceBoxRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error detecting faces:", error);
      }
    };

    // Frecuencia de detección: 100ms para respuesta rápida
    const interval = setInterval(detectAndMatch, 100);
    return () => clearInterval(interval);
  }, [modelsLoaded, isProcessing, lastCheckTime]);

  // Perform face matching
  const performFaceMatch = async () => {
    if (!webcamRef.current || isProcessing) return;

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController para esta petición
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);

    try {
      // Capturar screenshot actual (ya viene en base64 con prefijo data:image/jpeg;base64,)
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setIsProcessing(false);
        return;
      }

      console.log(
        `✅ Image captured, sending to API (${FACE_RECOGNITION_METHOD})...`
      );

      // Seleccionar endpoint basado en configuración
      const endpoint =
        FACE_METHODS[FACE_RECOGNITION_METHOD as keyof typeof FACE_METHODS]
          ?.endpoint || "/api/match";

      let requestBody: any = {};

      // Para método local, calcular descriptor; para externo, enviar imagen
      if (FACE_RECOGNITION_METHOD === "faceapi_local") {
        // Crear imagen para face-api
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

        requestBody = {
          face_descriptor: Array.from(detection.descriptor),
          threshold: 0.6,
        };
      } else {
        // Método externo: enviar imagen en base64
        requestBody = {
          image: imageSrc, // Base64 con prefijo data:image/jpeg;base64,
          method: FACE_RECOGNITION_METHOD,
        };
      }

      // Enviar al servidor con soporte para cancelación
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal, // Permitir cancelar la petición
      });

      // Verificar si la petición fue cancelada
      if (abortController.signal.aborted) {
        console.log("Request cancelled");
        return;
      }

      const result = await response.json();
      console.log("Match result:", JSON.stringify(result, null, 2));

      // Manejar respuesta basada en si hay match
      if (result.match_found) {
        // Capturar distance/similarity
        let distance: number | null = result.distance || null;

        // Capturar confidence como texto (ej: "Medium", "High", "Low")
        const confidenceText =
          result.confidence && typeof result.confidence === "string"
            ? result.confidence
            : null;

        setMatchResult({
          match_found: true,
          person_name: result.person_name || null,
          distance: distance,
          confidence: confidenceText,
          threshold: result.threshold || 0.6,
          linkedin_content: result.linkedin_content || null,
          discord_username: result.discord_username || null,
          photo_path: result.photo_path || null,
          message: result.message || `Match encontrado: ${result.person_name}`,
        });
      } else {
        setMatchResult({
          match_found: false,
          person_name: result.person_name || null,
          distance: result.distance || null,
          confidence: result.confidence || null,
          threshold: result.threshold || 0.6,
          candidates: result.candidates || [],
          message: result.message || "No se encontró match",
        });
      }
    } catch (error) {
      // No mostrar error si la petición fue cancelada intencionalmente
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request cancelled");
        return;
      }

      console.error("Error processing face:", error);
      setMatchResult({
        match_found: false,
        person_name: null,
        distance: null,
        threshold: 0.6,
        message: "Error al procesar la imagen",
      });
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setPhoto(null);
    setFaceDetected(false);
    setHasTried(false);
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

  const currentMethod =
    FACE_METHODS[FACE_RECOGNITION_METHOD as keyof typeof FACE_METHODS];

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white/80 font-sans text-base">
            Iniciando cámara...
          </p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-md text-center max-w-md border border-white/10">
          <Camera className="w-12 h-12 text-white/50 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold mb-2">
            Acceso a cámara requerido
          </h2>
          <p className="text-white/60 font-sans text-sm mb-6">
            Necesitamos acceso a tu cámara para realizar el reconocimiento
            facial. Por favor, permite el acceso en tu navegador.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all active:scale-95"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col md:flex-row">
      {/* Main Camera Section */}
      <div className="relative flex-1 flex flex-col bg-black">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-start bg-linear-to-b from-black/80 to-transparent pointer-events-none">
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-400" />
              FACE ID SYSTEM
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  modelsLoaded ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-xs text-white/60 font-mono uppercase tracking-wider">
                {modelsLoaded ? "System Online" : "Initializing..."}
              </span>
            </div>
          </div>
          <div className="pointer-events-auto">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2">
              <Cpu className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/80 font-medium">
                {currentMethod?.name || "Auto"}
              </span>
            </div>
          </div>
        </div>

        {/* Webcam Container */}
        <div className="relative flex-1 overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="absolute inset-0 w-full h-full object-cover"
            mirrored={facingMode === "user"}
          />

          {/* Scanlines & CRT Effect Overlay (Removed for minimalism) */}

          {/* Face Tracking Visuals */}
          {faceDetected && faceBox ? (
            <div
              className="absolute pointer-events-none transition-all duration-200 ease-linear z-20 border border-white/30 rounded-lg shadow-2xl"
              style={{
                left: `${faceBox.x}%`,
                top: `${faceBox.y}%`,
                width: `${faceBox.width}%`,
                height: `${faceBox.height}%`,
              }}
            >
              {/* Simple Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-white" />

              {/* Minimal Name Tag */}
              {matchResult?.match_found && (
                <div className="absolute -top-8 left-0">
                  <div className="text-white font-medium text-sm tracking-wide drop-shadow-md">
                    {matchResult.person_name}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Minimal Idle Indicator */
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-2xl flex items-center justify-center z-10">
              <div className="w-full h-px bg-white/10 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-px bg-white/10 absolute left-1/2 -translate-x-1/2" />
            </div>
          )}

          {/* Camera Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30 pointer-events-auto">
            <button
              onClick={toggleCamera}
              className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 active:scale-95 transition-all group"
            >
              <RefreshCcw className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar / Info Panel */}
      <div className="w-full md:w-[400px] bg-[#0A0A0A] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[40vh] md:h-screen transition-all z-30 shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6">
          {!matchResult ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Scan className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-sm font-medium">
                {faceDetected ? "Procesando rostro..." : "Esperando rostro..."}
              </p>
              <div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                {isProcessing && (
                  <div className="h-full bg-blue-500 animate-indeterminate" />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Primary Match Status */}
              <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-white font-semibold text-lg leading-tight">
                      {matchResult.match_found
                        ? matchResult.person_name
                        : "Identidad desconocida"}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium ${
                          matchResult.match_found
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {matchResult.confidence
                          ? `${matchResult.confidence}`
                          : matchResult.message}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                {matchResult.distance !== null && (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                    <div>
                      <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                        Similitud
                      </div>
                      <div className="text-white font-mono text-base">
                        {((1 - matchResult.distance) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                        Distancia
                      </div>
                      <div className="text-white font-mono text-base">
                        {matchResult.distance.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              {matchResult.match_found && (
                <div className="space-y-4">
                  {/* Photo if available */}
                  {matchResult.photo_path && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative group">
                      <img
                        src={matchResult.photo_path}
                        alt="Reference"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/90 to-transparent">
                        <span className="text-xs text-white/60">
                          Foto de Referencia
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="space-y-2">
                    {matchResult.discord_username && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                          <Disc className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-indigo-200 text-xs font-medium">
                            Discord
                          </div>
                          <div className="text-indigo-100 text-sm font-mono">
                            @{matchResult.discord_username}
                          </div>
                        </div>
                      </div>
                    )}

                    {matchResult.linkedin_content && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                          <Linkedin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-blue-200 text-xs font-medium mb-0.5">
                            LinkedIn Info
                          </div>
                          <p className="text-blue-100/80 text-xs leading-relaxed line-clamp-4">
                            {matchResult.linkedin_content}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Candidates List (if no precise match but candidates exist) */}
              {!matchResult.match_found &&
                matchResult.candidates &&
                matchResult.candidates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider ml-1">
                      Posibles Coincidencias
                    </h3>
                    <div className="space-y-2">
                      {matchResult.candidates
                        .slice(
                          0,
                          matchResult.confidence === "Medium" ? 3 : 3 // Show top 3 always for better feedback
                        )
                        .map((candidate, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-white/40">
                              {idx + 1}
                            </div>
                            {candidate.photo_path && (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/20">
                                <img
                                  src={candidate.photo_path}
                                  alt={candidate.person_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {candidate.person_name}
                              </div>
                              {candidate.distance !== undefined && (
                                <div className="text-white/40 text-xs">
                                  {((1 - candidate.distance) * 100).toFixed(0)}%
                                  match
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm text-xs text-white/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isProcessing ? "bg-blue-500 animate-pulse" : "bg-white/20"
              }`}
            />
            {isProcessing ? "Procesando..." : "Listo"}
          </div>
          <div>v1.2 • {timeUntilNextCheck}s refresh</div>
        </div>
      </div>

      {/* Inline Styles for Custom Animations */}
      <style jsx global>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-indeterminate {
          animation: indeterminate 1s infinite linear;
        }
      `}</style>
    </div>
  );
}
