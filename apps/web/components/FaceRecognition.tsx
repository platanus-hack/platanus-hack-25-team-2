"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { RefreshCcw } from "lucide-react";

interface FaceRecognitionProps {
  onPhotoCapture?: (photo: string) => void;
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

  // Face detection loop
  useEffect(() => {
    if (!modelsLoaded || photo || hasTried) return;

    const detectFace = async () => {
      if (!webcamRef.current) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length > 0) {
          if (!faceDetected) {
            setFaceDetected(true);
            // Auto-capture after detecting face
            takePhoto();
          }
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Error detecting faces:", error);
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [modelsLoaded, photo, faceDetected, hasTried]);

  // Capture photo
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

  // Video constraints
  const videoConstraints = {
    facingMode: facingMode,
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
          <h1 className="text-white text-sm tracking-[0.25em] font-light">
            FACE RECOGNITION
          </h1>
          {faceDetected && !photo && (
            <p className="text-white text-[10px] tracking-[0.2em] font-normal mt-1">
              CARA DETECTADA
            </p>
          )}
          {photo && (
            <p className="text-white text-[10px] tracking-[0.2em] font-normal mt-1">
              FOTO CAPTURADA
            </p>
          )}
        </div>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 z-10 pb-[env(safe-area-inset-bottom)] pt-10">
        <div className="flex flex-col items-center justify-center pb-10 px-6 gap-6">
          {!photo ? (
            <>
              <p className="text-white text-xs tracking-widest font-light">
                {faceDetected
                  ? "Capturando foto..."
                  : facingMode === "user"
                  ? "Mira a la cámara frontal"
                  : "Mira a la cámara"}
              </p>

              {/* Camera Switch Button */}
              <button
                onClick={toggleCamera}
                className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 transition-colors"
                aria-label="Cambiar cámara"
              >
                <RefreshCcw className="w-6 h-6 text-white" />
              </button>
            </>
          ) : (
            <>
              <p className="text-white text-xs tracking-widest font-light mb-2">
                {photo ? "Listo" : "Mira a la cámara"}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full max-w-md px-4">
                <div className="flex gap-3">
                  <button
                    onClick={resetState}
                    className="flex-1 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded font-medium hover:bg-white/30 active:bg-white/40 transition-colors"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={downloadPhoto}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
                  >
                    Descargar
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!photo) return;

                    console.log("📤 Processing photo for face recognition...");
                    try {
                      // Crear un elemento de imagen para procesar con face-api
                      const img = new Image();
                      img.src = photo;

                      await new Promise((resolve) => {
                        img.onload = resolve;
                      });

                      // Detectar cara y obtener descriptor
                      const detection = await faceapi
                        .detectSingleFace(
                          img,
                          new faceapi.TinyFaceDetectorOptions()
                        )
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                      if (!detection) {
                        alert(
                          "❌ No se detectó ninguna cara en la imagen capturada."
                        );
                        return;
                      }

                      console.log("✅ Face descriptor calculated");

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

                      if (result.match_found) {
                        alert(
                          `✅ Match encontrado!\n\nPersona: ${
                            result.person_name
                          }\nDistancia: ${result.distance?.toFixed(4)}\n\n${
                            result.linkedin_content
                              ? result.linkedin_content.substring(0, 200) +
                                "..."
                              : ""
                          }`
                        );
                      } else {
                        alert(`❌ No se encontró match\n\n${result.message}`);
                      }
                    } catch (error) {
                      console.error("Error processing photo:", error);
                      alert(
                        "Error al procesar la imagen. Por favor, intenta de nuevo."
                      );
                    }
                  }}
                  className="w-full bg-white text-black px-6 py-3 rounded font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  Buscar Match
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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
