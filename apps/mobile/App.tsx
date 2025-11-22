import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useFrameProcessor } from "react-native-vision-camera";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FaceBounds {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}

interface DetectedFace {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rollAngle?: number;
  yawAngle?: number;
}

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front"); // Usar cámara frontal para detectar al usuario
  const cameraRef = useRef<Camera>(null);
  const insets = useSafeAreaInsets();
  const [detectedFace, setDetectedFace] = useState<FaceBounds | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const updateDetectedFace = (faces: DetectedFace[]) => {
    if (faces && faces.length > 0) {
      // Encontrar la cara más grande (más cercana)
      const largestFace = faces.reduce((prev, current) => {
        const prevSize = prev.bounds.width * prev.bounds.height;
        const currentSize = current.bounds.width * current.bounds.height;
        return currentSize > prevSize ? current : prev;
      });

      // Convertir coordenadas del frame a coordenadas de pantalla
      // Las coordenadas de vision-camera están normalizadas (0-1)
      setDetectedFace({
        origin: {
          x: largestFace.bounds.x * SCREEN_WIDTH,
          y: largestFace.bounds.y * SCREEN_HEIGHT,
        },
        size: {
          width: largestFace.bounds.width * SCREEN_WIDTH,
          height: largestFace.bounds.height * SCREEN_HEIGHT,
        },
      });
    } else {
      setDetectedFace(null);
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    try {
      // @ts-ignore - El plugin se inyecta en runtime
      const faces = __detectFaces(frame);
      if (faces && faces.length > 0) {
        runOnJS(updateDetectedFace)(faces);
      } else {
        runOnJS(updateDetectedFace)([]);
      }
    } catch (error) {
      console.log("Error detecting faces:", error);
      runOnJS(updateDetectedFace)([]);
    }
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cargando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Se necesita permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cámara no disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      >
        {/* Overlay superior */}
        <View style={[styles.topOverlay, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>FACE RECOGNITION</Text>
            {detectedFace && (
              <Text style={styles.statusText}>CARA DETECTADA</Text>
            )}
          </View>
        </View>

        {/* Recuadro de cara detectada */}
        {detectedFace && (
          <View
            style={[
              styles.faceBox,
              {
                left: detectedFace.origin.x,
                top: detectedFace.origin.y,
                width: detectedFace.size.width,
                height: detectedFace.size.height,
              },
            ]}
          >
            {/* Esquinas del recuadro */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        )}

        {/* Overlay inferior */}
        <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom }]}>
          <View style={styles.controls}>
            {!detectedFace && (
              <Text style={styles.instructionText}>
                Mira a la cámara frontal
              </Text>
            )}
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "System",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: "300",
    fontFamily: "System",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "400",
    marginTop: 4,
    fontFamily: "System",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
  controls: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: "300",
    fontFamily: "System",
  },
  faceBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 5,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
});
