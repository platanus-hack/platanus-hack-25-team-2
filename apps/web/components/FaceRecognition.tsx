"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
import { fetchAndPlayGreeting } from "@/lib/audioPlayer";

interface FaceRecognitionProps {
  onPhotoCapture?: (photo: string) => void;
}

interface Candidate {
  person_name: string;
  discord_username?: string;
  photo_path?: string;
  linkedin_content?: string;
  distance?: number;
  label?: string | null;
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
  label?: string | null;
  candidates?: Candidate[];
  message: string;
}

interface FaceBoxPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TrackedFace {
  id: string;
  box: FaceBoxPercent;
  lastSeen: number;
  lastMatchTime: number;
  isProcessing: boolean;
  matchResult: MatchResult | null;
  captureProgress: number; // 0-3: número de fotos capturadas
  capturedDescriptors: Float32Array[]; // Almacena los 3 descriptores capturados
}

const MAX_SIMULTANEOUS_FACES = 3;
const MATCH_THROTTLE_MS = 2000;
const BOX_MATCH_THRESHOLD = 30; // Aumentado para ser más tolerante a movimientos de cámara
const PHOTOS_TO_CAPTURE = 5; // Número de fotos a capturar antes de hacer match
const CAPTURE_INTERVAL_MS = 150; // Intervalo entre capturas (ms) - reducido para mayor velocidad
const FACE_DISAPPEAR_TIMEOUT_MS = 10000; // Aumentado a 10 segundos para ser más tolerante a movimientos
const CACHE_TIMEOUT_MS = 30000; // Cache de última persona identificada por 30 segundos
const BOX_SMOOTHING_FACTOR = 0.3; // Factor de suavizado para posiciones de boxes (0-1, menor = más suave)
const FACE_DETECTION_INTERVAL_MS = 150; // Intervalo entre detecciones (aumentado para reducir sensibilidad)
const FACE_PADDING_RATIO = 0.15;
const FACE_PADDING_ATTEMPTS = [
  FACE_PADDING_RATIO,
  FACE_PADDING_RATIO * 2,
  FACE_PADDING_RATIO * 3,
];
const createFaceDetectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.3,
  });

// Session-level cache for greeted persons
// This persists across component remounts (navigation) but resets on page reload
const greetedPersonsSession = new Set<string>();

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Función para extraer el headline de linkedin_content
const extractHeadline = (
  linkedinContent: string | null | undefined
): string | null => {
  if (!linkedinContent) return null;

  const headlineMatch = linkedinContent.match(/Headline:\s*(.+?)(?:\n|$)/i);
  return headlineMatch ? headlineMatch[1].trim() : null;
};

// Función para truncar texto con límite de caracteres
const truncateText = (text: string | null, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Función para generar un "power level" estilo Dragon Ball basado en el nombre
// Esto genera un número consistente para la misma persona
const generatePowerLevel = (personName: string | null): number => {
  if (!personName) return Math.floor(Math.random() * 5000) + 1000;

  // Crear un hash simple del nombre para generar un número consistente
  let hash = 0;
  for (let i = 0; i < personName.length; i++) {
    const char = personName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }

  // Generar un número entre 1000 y 9999 basado en el hash
  const powerLevel = (Math.abs(hash) % 9000) + 1000;
  return powerLevel;
};

const getCenter = (box: FaceBoxPercent) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

const getCropDimensions = (
  width: number,
  height: number,
  box: FaceBoxPercent,
  paddingRatio = FACE_PADDING_RATIO
) => {
  const x = (box.x / 100) * width;
  const y = (box.y / 100) * height;
  const boxWidth = (box.width / 100) * width;
  const boxHeight = (box.height / 100) * height;

  const padX = boxWidth * paddingRatio;
  const padY = boxHeight * paddingRatio;

  const cropX = clamp(x - padX, 0, width);
  const cropY = clamp(y - padY, 0, height);
  const cropWidth = clamp(boxWidth + padX * 2, 1, width - cropX);
  const cropHeight = clamp(boxHeight + padY * 2, 1, height - cropY);

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  };
};

const cropImageToBox = async (
  image: string | HTMLImageElement,
  box: FaceBoxPercent,
  paddingRatio = FACE_PADDING_RATIO
): Promise<string> => {
  const img = typeof image === "string" ? await loadImage(image) : image;
  const { cropX, cropY, cropWidth, cropHeight } = getCropDimensions(
    img.width,
    img.height,
    box,
    paddingRatio
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropWidth));
  canvas.height = Math.max(1, Math.round(cropHeight));
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo preparar el canvas para recortar la imagen.");
  }

  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.92);
};

const computeDescriptorFromImage = async (
  imageSrc: string,
  box: FaceBoxPercent
): Promise<Float32Array | null> => {
  const detectDescriptor = async (
    image: string | HTMLImageElement
  ): Promise<Float32Array | null> => {
    const img = typeof image === "string" ? await loadImage(image) : image;
    const detection = await faceapi
      .detectSingleFace(img, createFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection?.descriptor || null;
  };

  let baseImage: HTMLImageElement | null = null;

  for (const paddingRatio of FACE_PADDING_ATTEMPTS) {
    try {
      if (!baseImage) {
        baseImage = await loadImage(imageSrc);
      }
      const croppedImage = await cropImageToBox(baseImage, box, paddingRatio);
      const descriptor = await detectDescriptor(croppedImage);
      if (descriptor) {
        return descriptor;
      }
    } catch (error) {
      console.warn("Error detectando descriptor en recorte:", error);
    }
  }

  const fallbackDescriptor = await detectDescriptor(baseImage || imageSrc);
  return fallbackDescriptor || null;
};

// Función para promediar múltiples descriptores
const averageDescriptors = (
  descriptors: Float32Array[]
): Float32Array | null => {
  if (descriptors.length === 0) return null;
  if (descriptors.length === 1) return descriptors[0];

  const length = descriptors[0].length;
  const averaged = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const descriptor of descriptors) {
      sum += descriptor[i];
    }
    averaged[i] = sum / descriptors.length;
  }

  return averaged;
};

const findClosestFaceIndex = (
  faces: TrackedFace[],
  box: FaceBoxPercent,
  now: number
): number => {
  const targetCenter = getCenter(box);
  let closestIndex = -1;
  let shortestDistance = Number.POSITIVE_INFINITY;

  faces.forEach((face, index) => {
    // Considerar solo rostros que fueron vistos recientemente (últimos 2 segundos)
    const timeSinceLastSeen = now - face.lastSeen;
    if (timeSinceLastSeen > 2000) {
      return; // Ignorar rostros que no se han visto recientemente
    }

    const center = getCenter(face.box);
    const distance = Math.hypot(
      center.x - targetCenter.x,
      center.y - targetCenter.y
    );

    // También considerar el tamaño del box para mejor matching
    const sizeDifference = Math.abs(
      (box.width * box.height) / (face.box.width * face.box.height) - 1
    );
    const combinedDistance = distance + sizeDifference * 20; // Penalizar cambios grandes de tamaño

    if (combinedDistance < shortestDistance) {
      shortestDistance = combinedDistance;
      closestIndex = index;
    }
  });

  return shortestDistance <= BOX_MATCH_THRESHOLD ? closestIndex : -1;
};

// Función para suavizar la transición de posiciones de boxes
const smoothBox = (
  currentBox: FaceBoxPercent,
  previousBox: FaceBoxPercent | null
): FaceBoxPercent => {
  if (!previousBox) return currentBox;

  return {
    x: previousBox.x + (currentBox.x - previousBox.x) * BOX_SMOOTHING_FACTOR,
    y: previousBox.y + (currentBox.y - previousBox.y) * BOX_SMOOTHING_FACTOR,
    width:
      previousBox.width +
      (currentBox.width - previousBox.width) * BOX_SMOOTHING_FACTOR,
    height:
      previousBox.height +
      (currentBox.height - previousBox.height) * BOX_SMOOTHING_FACTOR,
  };
};

export default function FaceRecognition({
  onPhotoCapture,
}: FaceRecognitionProps) {
  const webcamRef = useRef<Webcam>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [trackedFaces, setTrackedFaces] = useState<TrackedFace[]>([]);
  const [timeUntilNextCheck, setTimeUntilNextCheck] = useState<number>(2);
  const [lastIdentifiedPerson, setLastIdentifiedPerson] = useState<{
    result: MatchResult;
    timestamp: number;
  } | null>(null);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState<number>(0);
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const faceIdRef = useRef(0);
  // Removed useRef for greetedPersons to use session-level Set instead

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

  // Face detection loop tracking up to 3 faces
  useEffect(() => {
    if (!modelsLoaded) return;

    const detectFaces = async () => {
      if (!webcamRef.current) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          createFaceDetectorOptions()
        );

        // No limpiar inmediatamente si no hay detecciones - esperar un poco para evitar pérdidas por movimiento
        if (!detections.length) {
          // Solo limpiar si no hay rostros detectados por un tiempo considerable
          setTrackedFaces((prevFaces) => {
            const now = Date.now();
            // Mantener rostros que fueron vistos recientemente (últimos 5 segundos)
            const filtered = prevFaces.filter(
              (face) => now - face.lastSeen < FACE_DISAPPEAR_TIMEOUT_MS / 2
            );

            // Solo marcar como no detectado si realmente no hay rostros rastreados
            if (filtered.length === 0) {
              setFaceDetected(false);
            }

            return filtered;
          });

          return;
        }

        setFaceDetected(true);
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const now = Date.now();

        setTrackedFaces((prevFaces) => {
          const remainingFaces = [...prevFaces];
          const updatedFaces: TrackedFace[] = [];

          const limitedDetections = detections
            .slice()
            .sort(
              (a, b) => b.box.width * b.box.height - a.box.width * a.box.height
            )
            .slice(0, MAX_SIMULTANEOUS_FACES);

          limitedDetections.forEach((detection) => {
            const box = detection.box;
            const normalizedBox: FaceBoxPercent = {
              x: (box.x / videoWidth) * 100,
              y: (box.y / videoHeight) * 100,
              width: (box.width / videoWidth) * 100,
              height: (box.height / videoHeight) * 100,
            };

            const matchIndex = findClosestFaceIndex(
              remainingFaces,
              normalizedBox,
              now
            );

            if (matchIndex !== -1) {
              const matchedFace = remainingFaces.splice(matchIndex, 1)[0];
              // Si el rostro desapareció por mucho tiempo y reaparece, resetear el match
              const timeSinceLastSeen = now - matchedFace.lastSeen;
              const shouldResetMatch =
                timeSinceLastSeen > FACE_DISAPPEAR_TIMEOUT_MS;

              // Aplicar suavizado a la posición del box para reducir saltos
              const smoothedBox = smoothBox(normalizedBox, matchedFace.box);

              updatedFaces.push({
                ...matchedFace,
                box: smoothedBox,
                lastSeen: now,
                // Resetear match si desapareció por mucho tiempo (podría ser otra persona)
                matchResult: shouldResetMatch ? null : matchedFace.matchResult,
                lastMatchTime: shouldResetMatch ? 0 : matchedFace.lastMatchTime,
                captureProgress: shouldResetMatch
                  ? 0
                  : matchedFace.captureProgress,
                capturedDescriptors: shouldResetMatch
                  ? []
                  : matchedFace.capturedDescriptors,
              });
            } else if (updatedFaces.length < MAX_SIMULTANEOUS_FACES) {
              updatedFaces.push({
                id: `face-${faceIdRef.current++}`,
                box: normalizedBox,
                lastSeen: now,
                lastMatchTime: 0,
                isProcessing: false,
                matchResult: null,
                captureProgress: 0,
                capturedDescriptors: [],
              });
            }
          });

          return updatedFaces;
        });
      } catch (error) {
        console.error("Error detecting faces:", error);
      }
    };

    const interval = setInterval(detectFaces, FACE_DETECTION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [modelsLoaded]);

  const updateFaceState = useCallback(
    (faceId: string, updater: (face: TrackedFace) => TrackedFace) => {
      setTrackedFaces((prevFaces) =>
        prevFaces.map((face) => (face.id === faceId ? updater(face) : face))
      );
    },
    []
  );

  const performFaceMatchForFace = useCallback(
    async (face: TrackedFace) => {
      if (!webcamRef.current) return;

      if (abortControllersRef.current[face.id]) {
        abortControllersRef.current[face.id].abort();
      }

      updateFaceState(face.id, (prev) => ({
        ...prev,
        isProcessing: true,
      }));

      const abortController = new AbortController();
      abortControllersRef.current[face.id] = abortController;

      try {
        // Paso 1: Capturar PHOTOS_TO_CAPTURE fotos con intervalo
        const capturedImages: string[] = [];
        const capturedDescriptors: Float32Array[] = [];

        for (let i = 0; i < PHOTOS_TO_CAPTURE; i++) {
          if (abortController.signal.aborted) {
            return;
          }

          // Esperar intervalo entre capturas (excepto la primera)
          if (i > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, CAPTURE_INTERVAL_MS)
            );
          }

          const imageSrc = webcamRef.current.getScreenshot();
          if (!imageSrc) {
            throw new Error("No se pudo capturar la imagen del rostro.");
          }

          if (onPhotoCapture && i === 0) {
            onPhotoCapture(imageSrc);
          }

          // Recortar imagen según el box del rostro
          const croppedImage = await cropImageToBox(imageSrc, face.box);
          capturedImages.push(croppedImage);

          // Calcular descriptor para esta foto (para FaceAPI)
          if (FACE_RECOGNITION_METHOD === "faceapi") {
            const descriptor = await computeDescriptorFromImage(
              imageSrc,
              face.box
            );
            if (descriptor) {
              capturedDescriptors.push(descriptor);
            }
          }

          // Actualizar progreso en UI
          updateFaceState(face.id, (prev) => ({
            ...prev,
            captureProgress: i + 1,
          }));
        }

        let requestBody: Record<string, any> = {};

        if (FACE_RECOGNITION_METHOD === "faceapi") {
          // Para FaceAPI: promediar los descriptores capturados
          if (capturedDescriptors.length === 0) {
            throw new Error("No se pudieron capturar descriptores válidos.");
          }

          const averagedDescriptor = averageDescriptors(capturedDescriptors);
          if (!averagedDescriptor) {
            throw new Error("No se pudo calcular el promedio de descriptores.");
          }

          requestBody = {
            face_descriptor: Array.from(averagedDescriptor),
            threshold: 0.6,
          };
        } else {
          // Para DeepFace: enviar las 3 imágenes para que el endpoint calcule y promedie
          // El endpoint modificado calculará embeddings de cada imagen y promediará
          requestBody = {
            images: capturedImages, // Enviar array de imágenes
            method: FACE_RECOGNITION_METHOD,
          };
        }

        const endpoint =
          FACE_METHODS[FACE_RECOGNITION_METHOD as keyof typeof FACE_METHODS]
            ?.endpoint || "/api/match-deepface";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          throw new Error("Respuesta inválida del servidor.");
        }

        const result = await response.json();

        const formattedResult: MatchResult = result.match_found
          ? {
              match_found: true,
              person_name: result.person_name || null,
              distance:
                typeof result.distance === "number" ? result.distance : null,
              confidence:
                result.confidence && typeof result.confidence === "string"
                  ? result.confidence
                  : null,
              threshold: result.threshold || 0.6,
              linkedin_content: result.linkedin_content || null,
              discord_username: result.discord_username || null,
              photo_path: result.photo_path || null,
              label: result.label || null,
              message:
                result.message || `Match encontrado: ${result.person_name}`,
            }
          : {
              match_found: false,
              person_name: result.person_name || null,
              distance:
                typeof result.distance === "number" ? result.distance : null,
              confidence:
                result.confidence && typeof result.confidence === "string"
                  ? result.confidence
                  : null,
              threshold: result.threshold || 0.6,
              candidates: result.candidates || [],
              linkedin_content: null,
              discord_username: null,
              photo_path: null,
              label: null,
              message: result.message || "No se encontró match",
            };

        updateFaceState(face.id, (prev) => ({
          ...prev,
          matchResult: formattedResult,
          captureProgress: PHOTOS_TO_CAPTURE, // Marcar como completado
        }));

        // Actualizar cache de última persona identificada si hay match exitoso
        if (formattedResult.match_found) {
          console.log(
            "[FaceRecognition] ✅ Match found! Full result:",
            formattedResult
          );

          setLastIdentifiedPerson({
            result: formattedResult,
            timestamp: Date.now(),
          });

          // 🎤 Generate and play voice greeting for matched person (only once per person)
          const personId =
            (formattedResult as any).person_id || formattedResult.person_name;

          if (personId && !greetedPersonsSession.has(personId)) {
            const greetingData = {
              person_id: personId,
              person_name: formattedResult.person_name || "Unknown",
              linkedin_content: formattedResult.linkedin_content || undefined,
              discord_username: formattedResult.discord_username || undefined,
              label: formattedResult.label || undefined,
            };

            console.log(
              "[FaceRecognition] 🎤 First time greeting for:",
              personId
            );

            // Mark as greeted immediately to prevent duplicates
            greetedPersonsSession.add(personId);

            fetchAndPlayGreeting(greetingData).catch((error) => {
              console.error(
                "[FaceRecognition] ❌ Error playing greeting:",
                error
              );
              // Remove from greeted set on error so it can be retried
              greetedPersonsSession.delete(personId);
            });
          } else {
            console.log(
              "[FaceRecognition] ⏭️ Person already greeted, skipping voice generation"
            );
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Error processing face:", error);
        updateFaceState(face.id, (prev) => ({
          ...prev,
          matchResult: {
            match_found: false,
            person_name: null,
            distance: null,
            confidence: null,
            threshold: 0.6,
            message:
              error instanceof Error
                ? error.message
                : "Error al procesar la imagen",
          },
          captureProgress: 0, // Reset en caso de error
          capturedDescriptors: [],
        }));
      } finally {
        updateFaceState(face.id, (prev) => ({
          ...prev,
          isProcessing: false,
          lastMatchTime: Date.now(),
        }));
        delete abortControllersRef.current[face.id];
      }
    },
    [updateFaceState, onPhotoCapture]
  );

  // Launch individual matching per tracked face with throttling
  useEffect(() => {
    if (!trackedFaces.length) {
      setTimeUntilNextCheck(2);
      return;
    }

    const now = Date.now();

    trackedFaces.forEach((face) => {
      const elapsed = now - face.lastMatchTime;

      // Determinar si debe ejecutar el match:
      // 1. No está procesando actualmente
      // 2. No ha comenzado a capturar (captureProgress === 0)
      // 3. Y una de estas condiciones:
      //    - No tiene resultado todavía (matchResult === null)
      //    - O tiene un resultado pero es un fallo (match_found === false) y ha pasado el throttle time
      //    - NO volver a hacer match si ya hay un match exitoso (match_found === true)
      const hasSuccessfulMatch = face.matchResult?.match_found === true;
      const shouldRun =
        !face.isProcessing &&
        face.captureProgress === 0 &&
        !hasSuccessfulMatch && // No volver a hacer match si ya hay un match exitoso
        (face.matchResult === null ||
          (face.matchResult.match_found === false &&
            elapsed >= MATCH_THROTTLE_MS));

      if (shouldRun) {
        performFaceMatchForFace(face);
      }
    });

    const remaining = trackedFaces.map((face) => {
      if (face.lastMatchTime === 0) {
        return 0;
      }
      // Si tiene un match exitoso, no mostrar countdown
      if (face.matchResult?.match_found === true) {
        return Infinity;
      }
      return Math.max(0, MATCH_THROTTLE_MS - (now - face.lastMatchTime));
    });

    const nextRefresh = Math.min(...remaining.filter((r) => r !== Infinity));
    setTimeUntilNextCheck(
      nextRefresh === Infinity ? 0 : Math.max(0, Math.ceil(nextRefresh / 1000))
    );
  }, [trackedFaces, performFaceMatchForFace]);

  // Cleanup controllers for faces that disappear
  useEffect(() => {
    const currentIds = new Set(trackedFaces.map((face) => face.id));
    Object.entries(abortControllersRef.current).forEach(
      ([faceId, controller]) => {
        if (!currentIds.has(faceId)) {
          controller.abort();
          delete abortControllersRef.current[faceId];
        }
      }
    );
  }, [trackedFaces]);

  // Limpiar cache después de 30 segundos y actualizar contador
  useEffect(() => {
    if (!lastIdentifiedPerson) {
      setCacheTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - lastIdentifiedPerson.timestamp;
      const remaining = Math.max(0, CACHE_TIMEOUT_MS - elapsed);
      setCacheTimeRemaining(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        setLastIdentifiedPerson(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    const timeout = setTimeout(() => {
      setLastIdentifiedPerson(null);
    }, CACHE_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [lastIdentifiedPerson]);

  // Actualizar cache cuando aparece una nueva persona diferente
  useEffect(() => {
    const hasNewMatch = trackedFaces.some(
      (face) =>
        face.matchResult?.match_found &&
        face.matchResult.person_name !==
          lastIdentifiedPerson?.result.person_name
    );

    if (hasNewMatch) {
      const newMatch = trackedFaces.find(
        (face) =>
          face.matchResult?.match_found &&
          face.matchResult.person_name !==
            lastIdentifiedPerson?.result.person_name
      );
      if (newMatch?.matchResult) {
        setLastIdentifiedPerson({
          result: newMatch.matchResult,
          timestamp: Date.now(),
        });
      }
    }
  }, [trackedFaces, lastIdentifiedPerson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach((controller) =>
        controller.abort()
      );
    };
  }, []);

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setFaceDetected(false);
    setTrackedFaces([]);
    setTimeUntilNextCheck(2);
    Object.values(abortControllersRef.current).forEach((controller) =>
      controller.abort()
    );
    abortControllersRef.current = {};
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
  const isAnyProcessing = trackedFaces.some((face) => face.isProcessing);

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
          {faceDetected && trackedFaces.length > 0 ? (
            trackedFaces.map((face) => (
              <div
                key={face.id}
                className="absolute pointer-events-none transition-all duration-200 ease-linear z-20 border border-white/30 rounded-lg shadow-2xl"
                style={{
                  left: `${face.box.x}%`,
                  top: `${face.box.y}%`,
                  width: `${face.box.width}%`,
                  height: `${face.box.height}%`,
                }}
              >
                {/* Simple Corner Indicators */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-white" />

                {/* Minimal Name Tag */}
                {face.matchResult?.match_found && (
                  <div className="absolute -top-12 left-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium text-sm tracking-wide drop-shadow-md">
                        {face.matchResult.person_name}
                      </div>
                      {face.matchResult.label && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium drop-shadow-md capitalize ${
                            face.matchResult.label.toLowerCase() === "cuidado"
                              ? "bg-red-500/90 text-white"
                              : "bg-blue-500/90 text-white"
                          }`}
                        >
                          {face.matchResult.label}
                        </span>
                      )}
                    </div>
                    {face.matchResult.linkedin_content &&
                      extractHeadline(face.matchResult.linkedin_content) && (
                        <div className="text-white/80 text-xs tracking-wide drop-shadow-md max-w-[300px]">
                          {truncateText(
                            extractHeadline(face.matchResult.linkedin_content)!,
                            100
                          )}
                        </div>
                      )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/50 text-[10px] font-mono tracking-wider">
                        POWER LEVEL:
                      </span>
                      <span className="text-green-400 text-xs font-bold font-mono drop-shadow-md">
                        {generatePowerLevel(
                          face.matchResult.person_name
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
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
          {trackedFaces.length === 0 ? (
            lastIdentifiedPerson ? (
              // Mostrar cache de última persona identificada
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/40 px-1">
                  <span>Última identificación</span>
                  <span className="text-white/30">{cacheTimeRemaining}s</span>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-white font-semibold text-lg leading-tight">
                          {lastIdentifiedPerson.result.person_name}
                        </h2>
                        {lastIdentifiedPerson.result.label && (
                          <span
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              lastIdentifiedPerson.result.label.toLowerCase() ===
                              "cuidado"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {lastIdentifiedPerson.result.label}
                          </span>
                        )}
                      </div>
                      {lastIdentifiedPerson.result.linkedin_content &&
                        extractHeadline(
                          lastIdentifiedPerson.result.linkedin_content
                        ) && (
                          <p className="text-white/60 text-sm mt-2 leading-relaxed">
                            {truncateText(
                              extractHeadline(
                                lastIdentifiedPerson.result.linkedin_content
                              )!,
                              80
                            )}
                          </p>
                        )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-md font-medium bg-green-500/10 text-green-400">
                          {lastIdentifiedPerson.result.confidence ||
                            lastIdentifiedPerson.result.message}
                        </span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 ml-2" />
                  </div>

                  {lastIdentifiedPerson.result.distance !== null && (
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                          Similitud
                        </div>
                        <div className="text-white font-mono text-base">
                          {(
                            (1 - lastIdentifiedPerson.result.distance) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                          Distancia
                        </div>
                        <div className="text-white font-mono text-base">
                          {lastIdentifiedPerson.result.distance.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    {lastIdentifiedPerson.result.discord_username && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                          <Disc className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-indigo-200 text-xs font-medium">
                            Discord
                          </div>
                          <div className="text-indigo-100 text-sm font-mono">
                            @{lastIdentifiedPerson.result.discord_username}
                          </div>
                        </div>
                      </div>
                    )}

                    {lastIdentifiedPerson.result.linkedin_content && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                          <Linkedin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 w-full">
                          <div className="text-blue-200 text-xs font-medium mb-0.5">
                            LinkedIn Info
                          </div>
                          <p className="text-blue-100/80 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
                            {lastIdentifiedPerson.result.linkedin_content}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Scan className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/60 text-sm font-medium">
                  {faceDetected
                    ? "Procesando rostros..."
                    : "Esperando rostros..."}
                </p>
                <div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                  {isAnyProcessing && (
                    <div className="h-full bg-blue-500 animate-indeterminate" />
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {trackedFaces.map((face, index) => {
                const result = face.matchResult;
                return (
                  <div key={face.id} className="space-y-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/40 px-1">
                      <span>Rostro {index + 1}</span>
                      <span>
                        {face.isProcessing
                          ? face.captureProgress > 0 &&
                            face.captureProgress < PHOTOS_TO_CAPTURE
                            ? `Capturando ${face.captureProgress}/${PHOTOS_TO_CAPTURE}...`
                            : face.captureProgress === PHOTOS_TO_CAPTURE
                            ? "Promediando y comparando..."
                            : "Analizando..."
                          : result?.match_found
                          ? "Match confirmado"
                          : result
                          ? "Sin match"
                          : "Pendiente"}
                      </span>
                    </div>

                    <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-white font-semibold text-lg leading-tight">
                              {result
                                ? result.match_found
                                  ? result.person_name
                                  : "Identidad desconocida"
                                : "Procesando rostro..."}
                            </h2>
                            {result?.match_found && result.label && (
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-medium ${
                                  result.label.toLowerCase() === "cuidado"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {result.label}
                              </span>
                            )}
                          </div>
                          {result?.match_found &&
                            result.linkedin_content &&
                            extractHeadline(result.linkedin_content) && (
                              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                                {truncateText(
                                  extractHeadline(result.linkedin_content)!,
                                  80
                                )}
                              </p>
                            )}
                          <div className="flex items-center gap-2 mt-2">
                            {result ? (
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-medium ${
                                  result.match_found
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {result.confidence || result.message}
                              </span>
                            ) : face.captureProgress > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/60 font-medium">
                                  Capturando fotos...
                                </span>
                                <div className="flex gap-1">
                                  {Array.from({
                                    length: PHOTOS_TO_CAPTURE,
                                  }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        i < face.captureProgress
                                          ? "bg-blue-400"
                                          : "bg-white/20"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-white/60 font-medium">
                                Analizando...
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                            face.isProcessing
                              ? "bg-blue-400 animate-pulse"
                              : result?.match_found
                              ? "bg-green-400"
                              : "bg-white/30"
                          }`}
                        />
                      </div>

                      {result && result.distance !== null ? (
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                          <div>
                            <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                              Similitud
                            </div>
                            <div className="text-white font-mono text-base">
                              {((1 - result.distance) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1">
                              Distancia
                            </div>
                            <div className="text-white font-mono text-base">
                              {result.distance.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white/40 text-sm mt-4">
                          {face.isProcessing
                            ? "Calculando coincidencias..."
                            : "Esperando resultados..."}
                        </div>
                      )}
                    </div>

                    {result?.match_found && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {result.discord_username && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                              <div className="bg-indigo-500/20 p-2 rounded-lg">
                                <Disc className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-indigo-200 text-xs font-medium">
                                  Discord
                                </div>
                                <div className="text-indigo-100 text-sm font-mono">
                                  @{result.discord_username}
                                </div>
                              </div>
                            </div>
                          )}

                          {result.linkedin_content && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                                <Linkedin className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="min-w-0 w-full">
                                <div className="text-blue-200 text-xs font-medium mb-0.5">
                                  LinkedIn Info
                                </div>
                                <p className="text-blue-100/80 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
                                  {result.linkedin_content}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result &&
                      !result.match_found &&
                      result.candidates &&
                      result.candidates.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider ml-1">
                            Posibles Coincidencias
                          </h3>
                          <div className="space-y-2">
                            {result.candidates
                              .slice(0, 3)
                              .map((candidate, idx) => (
                                <div
                                  key={`${face.id}-candidate-${idx}`}
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
                                        {(
                                          (1 - candidate.distance) *
                                          100
                                        ).toFixed(0)}
                                        % match
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm text-xs text-white/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isAnyProcessing ? "bg-blue-500 animate-pulse" : "bg-white/20"
              }`}
            />
            {isAnyProcessing ? "Procesando..." : "Listo"}
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
