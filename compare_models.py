import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Suppress TensorFlow warnings

from deepface import DeepFace
import json

# Definimos las imágenes
img1_path = "linkedin-photo.png"
img2_path = "test-photo.png"

models = ["VGG-Face", "ArcFace"]
metrics = ["cosine", "euclidean", "euclidean_l2"]

print(f"Comparando imágenes: {img1_path} vs {img2_path}")
print("=" * 50)

for model in models:
    print(f"\n--- Modelo: {model} ---")
    try:
        # La primera ejecución descargará los pesos del modelo automáticamente
        result = DeepFace.verify(
            img1_path=img1_path,
            img2_path=img2_path,
            model_name=model,
            detector_backend="opencv", # backend rápido para detección, podemos usar 'retinaface' para más precisión
            distance_metric="cosine",
            enforce_detection=False
        )
        
        print(json.dumps(result, indent=2))
        
        distance = result['distance']
        threshold = result['threshold']
        verified = result['verified']
        
        # Interpretación humana
        confidence_score = (1 - distance) * 100 if distance < 1 else 0
        
        if verified:
            print(f"✅ MATCH CONFIRMADO")
            print(f"Distancia: {distance:.4f} (Umbral: {threshold})")
            # Nota: cosine distance va de 0 a 1 (o 2), donde 0 es idéntico.
        else:
            print(f"❌ NO MATCH")
            print(f"Distancia: {distance:.4f} (Umbral: {threshold})")

    except Exception as e:
        print(f"Error al ejecutar {model}: {e}")

print("\n" + "=" * 50)
print("Nota: ArcFace con distancia Coseno es el estándar actual del estado del arte.")

