import { useRef, useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import * as faceapi from "face-api.js";
import { toaster } from "components/ui/toaster";

import Webcam from "react-webcam";

import { useAuth } from "hooks/auth-provider.tsx";

interface FACEIDPROPS {
  setFaceLogin: (value: boolean) => void;
  faceLogin: boolean;
}

const FACEID = ({ setFaceLogin, faceLogin }: FACEIDPROPS) => {
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const { face_login } = useAuth();
  // Reset state
  const resetState = () => {
    setPhoto(null);
    setFaceDetected(false);
    setHasTried(false);
  };

  // Load face-api.js model
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    };

    if (faceLogin) {
      loadModels();
    }
  }, [faceLogin]);

  // Detección de rostro
  useEffect(() => {
    const detectFace = async () => {
      if (!webcamRef.current || photo || hasTried) return;

      const video = webcamRef.current.video;
      if (!video) return;

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

      if (detections.length > 0 && !faceDetected) {
        setFaceDetected(true);
        takePhoto(); // Captura y manda
      } else if (detections.length === 0 && faceDetected) {
        setFaceDetected(false);
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [photo, faceDetected, hasTried]);

  // Captura
  const takePhoto = () => {
    if (!webcamRef.current || hasTried) return;

    setHasTried(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      sendPhoto(imageSrc);
    }
  };

  const sendPhoto = async (dataUrl: string) => {
    try {
      const success = await face_login(dataUrl);
      if (success) {
        toaster.create({
          title: "Inicio de sesión correcto",
          type: "success",
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <Flex boxShadow="2xl" direction="column" w="100%" h="100%" p={5} gap={5} align="center" border="1px solid gray" borderRadius={5} bg="white">
      <Flex align="center" justify="center" w="100%" h="100%" direction="column" gap={5}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          mirrored
          videoConstraints={{ facingMode: "user" }}
          style={{
            height: "300px",
            borderRadius: "5px",
            objectFit: "cover",
            aspectRatio: "1/1",
          }}
        />
        <Text color="gray" fontWeight="bold" mt={2} fontSize="2xl" userSelect="none">
          {photo ? "Listo" : "Mira a la cámara"}
        </Text>
      </Flex>

      {photo && (
        <Flex mt={3} pos="absolute" top="50%" left="50%" transform="translate(-50%, 100px)" w="250px" gap={3}>
          <Flex
            onClick={() => {
              setFaceLogin(false);
              resetState();
            }}
            w="100%"
            h="50px"
            bg="#e16e09"
            cursor="pointer"
            align="center"
            justify="center"
            borderRadius={5}
            padding={2}
            color="white"
          >
            <Text color="white" fontWeight="bold" userSelect="none">
              Volver Atrás
            </Text>
          </Flex>
          <Flex w="100%" h="50px" bg="#e16e09" cursor="pointer" align="center" justify="center" borderRadius={5} padding={2} onClick={resetState}>
            <Text color="white" fontWeight="bold" userSelect="none">
              Reintentar
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default FACEID;
