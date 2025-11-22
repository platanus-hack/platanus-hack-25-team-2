"""
Script de ejemplo para probar la API de reconocimiento facial
"""
import os
import base64
import requests
import json

# URL del servidor (ajusta según tu configuración)
API_URL = os.environ.get("API_URL", "http://localhost:8000")
# API Key (debe coincidir con la configurada en el servidor)
API_KEY = os.environ.get("API_KEY", "cambiar-esta-clave-por-una-segura-12345")

def test_api_with_image(image_path: str, threshold: float = 0.6):
    """
    Prueba la API con una imagen local
    
    Args:
        image_path: Ruta a la imagen
        threshold: Umbral de distancia para considerar match (default 0.6)
    """
    # Leer imagen y convertir a base64
    with open(image_path, 'rb') as image_file:
        image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
    
    # Preparar request
    payload = {
        "image_base64": image_base64,
        "threshold": threshold
    }
    
    # Headers con API key
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    # Enviar request
    print(f"Enviando imagen {image_path} a la API...")
    print(f"API URL: {API_URL}")
    print(f"Usando API Key: {API_KEY[:10]}...")
    
    response = requests.post(f"{API_URL}/match", json=payload, headers=headers)
    
    # Mostrar resultado
    if response.status_code == 200:
        result = response.json()
        print("\n" + "="*50)
        print("RESULTADO:")
        print("="*50)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*50)
    elif response.status_code == 401:
        print("❌ Error de autenticación: API key inválida")
        print("   Asegúrate de configurar la variable de entorno API_KEY")
        print("   o actualiza el valor en este script")
    elif response.status_code == 429:
        print("❌ Rate limit excedido. Espera un momento antes de intentar de nuevo.")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)


if __name__ == "__main__":
    # Ejemplo de uso
    test_image = "test-photo.png"  # Cambia por la ruta de tu imagen
    test_api_with_image(test_image, threshold=0.6)

