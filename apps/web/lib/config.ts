// Configuración para A/B Testing
// Cambiar esta variable para seleccionar el método a usar

export const FACE_RECOGNITION_METHOD = process.env.NEXT_PUBLIC_FACE_METHOD || 'external';

export type FaceRecognitionMethod = 'external' | 'faceapi_local' | 'both';

export const FACE_METHODS = {
  external: {
    name: 'Endpoint Externo',
    description: 'Facenet512 - 512 dimensiones - Más preciso, más lento',
    endpoint: '/api/match'
  },
  faceapi_local: {
    name: 'Face-API Local',
    description: 'Face-recognition - 128 dimensiones - Más rápido, menos preciso',
    endpoint: '/api/match-local'
  },
  both: {
    name: 'A/B Testing',
    description: 'Prueba ambos métodos',
    endpoint: '/api/match-ab'
  }
} as const;

