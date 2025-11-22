import base64
import io
from PIL import Image
import tempfile
import os

def process_image_input(image_data):
    """
    Process image input from various formats (base64 string or file upload)
    and return a temporary file path that DeepFace can use.
    
    Args:
        image_data: Either a base64 string or FileStorage object
        
    Returns:
        str: Path to temporary image file
        
    Raises:
        ValueError: If image format is invalid
    """
    temp_file = None
    
    try:
        # Check if it's a string (base64)
        if isinstance(image_data, str):
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            image.save(temp_file.name, format='JPEG')
            temp_file.close()
            
            return temp_file.name
            
        # Check if it's a file upload (Flask FileStorage)
        elif hasattr(image_data, 'read'):
            # Read file content
            image_bytes = image_data.read()
            image = Image.open(io.BytesIO(image_bytes))
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            image.save(temp_file.name, format='JPEG')
            temp_file.close()
            
            return temp_file.name
            
        else:
            raise ValueError("Invalid image format. Must be base64 string or file upload.")
            
    except Exception as e:
        # Clean up temp file if created
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise ValueError(f"Failed to process image: {str(e)}")


def cleanup_temp_file(file_path):
    """
    Remove temporary file safely.
    
    Args:
        file_path: Path to temporary file
    """
    try:
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        print(f"Warning: Failed to cleanup temp file {file_path}: {str(e)}")
