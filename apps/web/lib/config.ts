// Configuración de métodos de reconocimiento facial
// Cambiar esta variable para seleccionar el método a usar

export const FACE_RECOGNITION_METHOD = process.env.NEXT_PUBLIC_FACE_METHOD || 'faceapi';

export type FaceRecognitionMethod = 'faceapi' | 'deepface';

export const FACE_METHODS = {
  deepface: {
    name: 'DeepFace (512 dimensiones)',
    description: 'DeepFace Facenet512 - 512 dimensiones - Más preciso',
    endpoint: '/api/match-deepface',
    dimensions: 512,
    threshold: 1.0
  },
  faceapi: {
    name: 'Face-API (128 dimensiones)',
    description: 'Face-recognition - 128 dimensiones - Más rápido, menos preciso',
    endpoint: '/api/match-faceapi',
    dimensions: 128,
    threshold: 0.6
  }
} as const;

