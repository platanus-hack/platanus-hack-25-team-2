from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.image_utils import process_image_input, cleanup_temp_file
from services.face_service import generate_face_embedding
from services.db_service import SupabaseService

app = Flask(__name__)
CORS(app)

# Initialize Supabase service
db_service = SupabaseService()


@app.route('/api/identify', methods=['POST'])
def identify():
    """
    Identify a person from an uploaded image by comparing face embeddings
    with known people in the database.
    
    Accepts:
        - JSON with base64 encoded image: {"image": "base64string..."}
        - Multipart form data with image file: image=<file>
    
    Returns:
        JSON with best match profile and similarity metrics
    """
    temp_file_path = None
    
    try:
        # Get image from request
        image_data = None
        
        # Check if JSON request with base64 image
        if request.is_json:
            data = request.get_json()
            if not data or 'image' not in data:
                return jsonify({
                    'success': False,
                    'error': 'No image provided in request body'
                }), 400
            image_data = data['image']
        
        # Check if multipart form data with file
        elif 'image' in request.files:
            image_data = request.files['image']
        
        else:
            return jsonify({
                'success': False,
                'error': 'No image provided. Send JSON with "image" field or multipart form-data with "image" file'
            }), 400
        
        # Process image input (convert to temp file for DeepFace)
        try:
            temp_file_path = process_image_input(image_data)
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
        
        # Generate face embedding
        embedding_result = generate_face_embedding(temp_file_path)
        
        if not embedding_result['success']:
            return jsonify({
                'success': False,
                'error': embedding_result['error']
            }), 400
        
        # Find best match in database
        match_result = db_service.find_best_match(embedding_result['embedding'])
        
        if not match_result['success']:
            return jsonify({
                'success': False,
                'error': match_result['error']
            }), 404
        
        # Return successful match
        return jsonify({
            'success': True,
            'match': match_result['match']
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500
    
    finally:
        # Clean up temporary file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-service'
    }), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
