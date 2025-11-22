"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { RefreshCcw } from "lucide-react";
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
  confidence?: string | null; // Nivel de confianza como texto (ej: "Medium", "High", "Low")
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
      <div className="w-full md:w-96 bg-black/90 backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/10 h-[50vh] md:h-screen flex flex-col">
        <div className="p-6 flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="border-b border-white/20 pb-4 shrink-0">
            <h2 className="text-white text-xl font-light tracking-wider">
              RECONOCIMIENTO FACIAL
            </h2>
            <p className="text-white/60 text-xs mt-2 tracking-wide">
              Sistema de verificación en tiempo real
            </p>
          </div>

          {/* Status 
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
          </div>
          */}

          {/* Match Result */}
          {matchResult && (
            <div className="border-none border-white/20 space-y-4 flex-1 overflow-y-auto mt-6">
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
                      Confianza: {matchResult.confidence || "N/A"}
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
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-400 font-medium text-sm">
                        {matchResult.confidence === "Medium"
                          ? "CANDIDATOS SUGERIDOS"
                          : "NO RECONOCIDO"}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {matchResult.message}
                    </p>
                  </div>

                  {/* Mostrar candidatos si confianza es Media o Baja */}
                  {matchResult.candidates &&
                    matchResult.candidates.length > 0 && (
                      <div className="space-y-3">
                        {/* Limitar a 1 candidato si confianza es Alta, sino 3 */}
                        {(() => {
                          const maxCandidates =
                            matchResult.confidence === "High" ? 1 : 3;
                          const displayedCandidates =
                            matchResult.candidates.slice(0, maxCandidates);
                          return (
                            <>
                              <h4 className="text-white/80 text-sm font-medium">
                                Top {displayedCandidates.length}{" "}
                                {displayedCandidates.length === 1
                                  ? "candidato"
                                  : "candidatos"}
                                :
                              </h4>
                              {displayedCandidates.map((candidate, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                                >
                                  {/* Header con ranking */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                                      <span className="text-white text-xs font-bold">
                                        #{idx + 1}
                                      </span>
                                    </div>
                                    <h5 className="text-white font-medium text-sm flex-1 truncate">
                                      {candidate.person_name}
                                    </h5>
                                  </div>

                                  {/* Contenedor con foto y detalles */}
                                  <div className="flex gap-3">
                                    {/* Foto del candidato como círculo */}
                                    {candidate.photo_path && (
                                      <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-white/10 border border-white/20">
                                        <img
                                          src={candidate.photo_path}
                                          alt={candidate.person_name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                    {/* Detalles del candidato */}
                                    <div className="flex-1 space-y-1">
                                      {candidate.discord_username && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-white/60 text-xs">
                                            Discord:
                                          </span>
                                          <span className="text-white text-xs font-mono">
                                            @{candidate.discord_username}
                                          </span>
                                        </div>
                                      )}
                                      {candidate.distance !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-white/60 text-xs">
                                            Similitud:
                                          </span>
                                          <span className="text-blue-400 text-xs font-medium">
                                            {(
                                              (1 - candidate.distance) *
                                              100
                                            ).toFixed(1)}
                                            %
                                          </span>
                                        </div>
                                      )}
                                      {candidate.linkedin_content && (
                                        <p className="text-white/40 text-xs line-clamp-2">
                                          {candidate.linkedin_content.substring(
                                            0,
                                            80
                                          )}
                                          ...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {!matchResult && faceDetected && (
            <div className="border-t border-white/20 pt-4 flex-1 flex items-center justify-center">
              <div className="text-center text-white/60 text-sm">
                Esperando verificación...
              </div>
            </div>
          )}

          {!faceDetected && (
            <div className="border-t border-white/20 pt-4 flex-1 flex items-center justify-center">
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
