import numpy as np
from deepface import DeepFace

def generate_face_embedding(image_path):
    """
    Generate face embedding using DeepFace with Facenet512 model.
    
    Args:
        image_path: Path to image file
        
    Returns:
        dict: Contains 'success', 'embedding' (numpy array), and optional 'error'
    """
    try:
        # Generate embedding using DeepFace
        embedding_objs = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet512",
            detector_backend="retinaface",
            enforce_detection=True
        )
        
        if not embedding_objs:
            return {
                'success': False,
                'error': "No face detected in the image"
            }
        
        # Extract the embedding (first face detected)
        embedding = np.array(embedding_objs[0]['embedding'])
        
        return {
            'success': True,
            'embedding': embedding
        }
        
    except ValueError as e:
        # DeepFace raises ValueError when no face is detected
        if "Face could not be detected" in str(e) or "no face" in str(e).lower():
            return {
                'success': False,
                'error': "No face detected in the image"
            }
        return {
            'success': False,
            'error': f"Face detection error: {str(e)}"
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f"Failed to generate embedding: {str(e)}"
        }


def calculate_cosine_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings.
    
    Args:
        embedding1: numpy array
        embedding2: numpy array or list
        
    Returns:
        float: Cosine similarity score (0 to 1)
    """
    embedding1 = np.array(embedding1)
    embedding2 = np.array(embedding2)
    
    return np.dot(embedding1, embedding2) / (
        np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
    )


def get_confidence_level(similarity_score):
    """
    Determine confidence level based on similarity score.
    Facenet512 typical thresholds: >0.8 High, >0.7 Medium, else Low
    
    Args:
        similarity_score: float
        
    Returns:
        str: "High", "Medium", or "Low"
    """
    if similarity_score > 0.8:
        return "High"
    elif similarity_score > 0.7:
        return "Medium"
    else:
        return "Low"


def is_match(similarity_score, threshold=0.7):
    """
    Determine if the similarity score indicates a match.
    
    Args:
        similarity_score: float
        threshold: float (default 0.7 for Facenet512)
        
    Returns:
        bool: True if match, False otherwise
    """
    return similarity_score > threshold
