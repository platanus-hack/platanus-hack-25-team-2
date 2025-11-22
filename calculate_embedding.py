import face_recognition
import numpy as np
import json

def get_embedding(filename):
    try:
        image = face_recognition.load_image_file(filename)
        encodings = face_recognition.face_encodings(image)
        if encodings:
            return encodings[0].tolist()
        else:
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

embedding = get_embedding("linkedin-photo.png")
if embedding:
    print(json.dumps(embedding))
else:
    print("No embedding found")

