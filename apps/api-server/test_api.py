"""
Script de ejemplo para probar la API de reconocimiento facial
"""
import os
import base64
import requests
import json
from PIL import Image

# URL del servidor (ajusta según tu configuración)
API_URL = os.environ.get("API_URL", "http://localhost:8000")
# API Key (debe coincidir con la configurada en el servidor)
API_KEY = os.environ.get("API_KEY", "cambiar-esta-clave-por-una-segura-12345")

def get_image_info(image_path: str):
    """Obtiene información sobre la imagen"""
    try:
        with Image.open(image_path) as img:
            return {
                "size": os.path.getsize(image_path),
                "dimensions": f"{img.width}x{img.height}",
                "mode": img.mode,
                "format": img.format
            }
    except Exception as e:
        return {"error": str(e)}

def test_api_with_image(image_path: str, threshold: float = 0.6):
    """
    Prueba la API con una imagen local
    
    Args:
        image_path: Ruta a la imagen
        threshold: Umbral de distancia para considerar match (default 0.6)
    """
    # Verificar que el archivo existe
    if not os.path.exists(image_path):
        print(f"❌ Error: El archivo {image_path} no existe")
        return
    
    # Mostrar información de la imagen
    print("\n" + "="*60)
    print("INFORMACIÓN DE LA IMAGEN")
    print("="*60)
    img_info = get_image_info(image_path)
    if "error" in img_info:
        print(f"⚠️  No se pudo leer información de la imagen: {img_info['error']}")
    else:
        print(f"  Archivo: {image_path}")
        print(f"  Tamaño: {img_info['size']:,} bytes ({img_info['size']/1024:.2f} KB)")
        print(f"  Dimensiones: {img_info['dimensions']} pixels")
        print(f"  Modo: {img_info['mode']}")
        print(f"  Formato: {img_info['format']}")
    print("="*60)
    
    # Leer imagen y convertir a base64
    print("\nConvirtiendo imagen a base64...")
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        print(f"✅ Base64 generado: {len(image_base64):,} caracteres ({len(image_base64)/1024:.2f} KB)")
    except Exception as e:
        print(f"❌ Error al leer la imagen: {e}")
        return
    
    # Preparar request
    payload = {
        "image_base64": image_base64,
        "threshold": threshold
    }
    
    # Headers (nota: el servidor actual no requiere API key, pero lo dejamos por si acaso)
    headers = {
        "Content-Type": "application/json"
    }
    
    # Enviar request
    print(f"\n📤 Enviando request a la API...")
    print(f"  URL: {API_URL}/match")
    print(f"  Threshold: {threshold}")
    
    try:
        response = requests.post(
            f"{API_URL}/match", 
            json=payload, 
            headers=headers,
            timeout=30  # Timeout de 30 segundos
        )
        
        print(f"  Status Code: {response.status_code}")
        
        # Mostrar resultado
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*60)
            print("✅ RESULTADO EXITOSO")
            print("="*60)
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print("="*60)
            
            # Mostrar resumen
            if result.get("match_found"):
                print(f"\n🎯 MATCH ENCONTRADO: {result.get('person_name')}")
                print(f"   Distancia: {result.get('distance'):.4f}")
            else:
                print(f"\n❌ No se encontró match")
                if result.get("person_name"):
                    print(f"   Persona más cercana: {result.get('person_name')}")
                    print(f"   Distancia: {result.get('distance'):.4f} (threshold: {threshold})")
        elif response.status_code == 400:
            print("\n" + "="*60)
            print("❌ ERROR 400: Bad Request")
            print("="*60)
            try:
                error_detail = response.json()
                print(json.dumps(error_detail, indent=2, ensure_ascii=False))
            except:
                print(response.text)
            print("="*60)
        elif response.status_code == 401:
            print("\n❌ Error de autenticación: API key inválida")
            print("   Asegúrate de configurar la variable de entorno API_KEY")
            print("   o actualiza el valor en este script")
        elif response.status_code == 429:
            print("\n❌ Rate limit excedido. Espera un momento antes de intentar de nuevo.")
        else:
            print("\n" + "="*60)
            print(f"❌ ERROR {response.status_code}")
            print("="*60)
            print(response.text)
            print("="*60)
            
    except requests.exceptions.Timeout:
        print("\n❌ Timeout: El servidor tardó demasiado en responder")
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error de conexión: No se pudo conectar a {API_URL}")
        print("   Asegúrate de que el servidor esté corriendo")
    except Exception as e:
        print(f"\n❌ Error inesperado: {type(e).__name__}: {e}")


if __name__ == "__main__":
    import sys
    
    # Permitir pasar la imagen como argumento
    if len(sys.argv) > 1:
        test_image = sys.argv[1]
    else:
        # Imágenes de prueba disponibles
        test_images = [
            "test-photo-0.png",
            "test-photo.png",
            "test-photo-2.png",
            "test-photo-3.png",
            "test-photo-4.png",
            "test-photo-5.png"
        ]
        
        # Buscar la primera imagen que exista
        test_image = None
        for img in test_images:
            if os.path.exists(img):
                test_image = img
                break
        
        if not test_image:
            print("❌ No se encontró ninguna imagen de prueba")
            print(f"   Buscadas: {', '.join(test_images)}")
            print("\nUso: python test_api.py <ruta_a_imagen>")
            sys.exit(1)
    
    # Permitir pasar threshold como segundo argumento
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
    
    print(f"🧪 Probando API con imagen: {test_image}")
    test_api_with_image(test_image, threshold=threshold)

