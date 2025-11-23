"""
Script to upsert (insert or update) a single person to the known_people table.

Strategy:
- Calculates Face-API embedding (128D) from profile image
- Uses the 128D embedding for BOTH face_encoding and face_encoding_faceapi
- This ensures compatibility with /api/match-faceapi endpoint
"""

import os
import json
import tempfile
import requests
import face_recognition
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://zgvntpcrofqtmuktrqjs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def download_image(url, output_path):
    """Download an image from URL"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    except Exception as e:
        print(f"[ERROR] Failed to download image: {e}")
        return None


def calculate_faceapi_embedding(image_path):
    """Calculate embedding with face_recognition (128 dimensions) - same as add_faceapi_embeddings.py"""
    try:
        print(f"      Attempting with standard face_recognition...")
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        
        if encodings:
            return encodings[0].tolist()
            
        # 2. Try with upsampling (helps with small faces)
        print(f"      Standard failed. Attempting with upsampling (x2)...")
        locations = face_recognition.face_locations(image, number_of_times_to_upsample=2)
        if locations:
            encodings = face_recognition.face_encodings(image, known_face_locations=locations)
            if encodings:
                return encodings[0].tolist()
        
        # 3. Try with DeepFace if available (uses different detectors like OpenCV, SSD, etc.)
        try:
            from deepface import DeepFace
            print(f"      face_recognition failed. Attempting with DeepFace (Model: Dlib, Detector: opencv)...")
            
            # Use Dlib model to be compatible with 128D
            # Use 'opencv' detector which is robust and doesn't require extra installs (like retinaface might)
            embeddings = DeepFace.represent(
                img_path=image_path,
                model_name="Dlib",
                detector_backend="opencv", 
                enforce_detection=True
            )
            
            if embeddings:
                return embeddings[0]["embedding"]
                
        except ImportError:
            print("      DeepFace not installed.")
        except Exception as e:
             print(f"      DeepFace attempt failed: {e}")
             
             # 4. Last resort: DeepFace with enforce_detection=False? 
             # Risky as it might encode background, but sometimes detector fails on obvious face.
             # Only do this if we are desperate.
             try:
                 print(f"      Attempting DeepFace without enforcement...")
                 embeddings = DeepFace.represent(
                    img_path=image_path,
                    model_name="Dlib",
                    detector_backend="skip", # Skip detection, just encode center/whole image
                    enforce_detection=False
                 )
                 if embeddings:
                     return embeddings[0]["embedding"]
             except Exception as e2:
                 print(f"      DeepFace skip detection failed: {e2}")

        return None
    except Exception as e:
        print(f"[ERROR] Error al calcular embedding: {e}")
        return None





def check_person_exists(name=None, discord_username=None):
    """
    Check if person already exists in database by name or discord_username.
    Returns the existing record if found, None otherwise.
    """
    try:
        # Try to find by discord_username first (more unique)
        if discord_username:
            response = supabase.table("known_people").select("*").eq("discord_username", discord_username).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
        
        # Try to find by full_name (case-insensitive)
        if name:
            response = supabase.table("known_people").select("*").ilike("full_name", name).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
        
        return None
    except Exception as e:
        print(f"[WARNING] Error checking if person exists: {e}")
        return None


def upsert_person(person_data):
    """
    Insert or update a person in the known_people table.
    
    Args:
        person_data: Dictionary with person information from JSON
        
    Expected format:
    {
        "username": "...",
        "linkedin_url": "...",
        "name": "...",
        "profile_image_url": "...",  # REQUIRED - will download and calculate 128D embedding
        "github_url": "...",  # optional
        "headline": "...",
        "about": "...",
        "experience": [...],
        "education": [...],
        ...
    }
    """
    print("="*80)
    print(f"Processing: {person_data.get('name', 'Unknown')}")
    print("="*80)
    
    # Extract data
    name = person_data.get('name')
    username = person_data.get('username')
    linkedin_url = person_data.get('linkedin_url')
    github_url = person_data.get('github_url')
    profile_image_url = person_data.get('profile_image_url')
    headline = person_data.get('headline', '')
    about = person_data.get('about', '')
    experience = person_data.get('experience', [])
    education = person_data.get('education', [])
    
    # Validate required fields
    if not name or not profile_image_url:
        print(f"[ERROR] Missing required fields: name and profile_image_url")
        return False
    
    # Check if person already exists
    print(f"[1/5] Checking if person already exists...")
    existing_person = check_person_exists(name, username)
    is_update = existing_person is not None
    
    if is_update:
        print(f"[✓] Person found in database (ID: {existing_person['id']})")
        print(f"     Will UPDATE existing record")
    else:
        print(f"[✓] Person not found in database")
        print(f"     Will INSERT new record")
    
    # Build LinkedIn content
    linkedin_content = f"# {name}\n\n"
    if headline:
        linkedin_content += f"**{headline}**\n\n"
    
    # Add URLs to content
    if linkedin_url:
        linkedin_content += f"LinkedIn: {linkedin_url}\n\n"
    if github_url:
        linkedin_content += f"GitHub: {github_url}\n\n"
    
    if about:
        linkedin_content += f"## About\n{about}\n\n"
    if experience:
        linkedin_content += f"## Experience\n"
        for exp in experience:
            title = exp.get('title', 'N/A')
            company = exp.get('company', 'N/A')
            linkedin_content += f"- {title} at {company}\n"
        linkedin_content += "\n"
    if education:
        linkedin_content += f"## Education\n"
        for edu in education:
            school = edu.get('school', 'N/A')
            degree = edu.get('degree', 'N/A')
            linkedin_content += f"- {school} - {degree}\n"
    
    # Download image
    print(f"[2/5] Downloading profile image...")
    temp_dir = tempfile.gettempdir()
    image_path = os.path.join(temp_dir, f"{username or 'temp'}.jpg")
    
    downloaded_path = download_image(profile_image_url, image_path)
    if not downloaded_path:
        print(f"[ERROR] Failed to download image")
        return False
    
    print(f"[✓] Image downloaded to: {downloaded_path}")
    
    # Calculate Face-API embedding (128D) from downloaded image
    print(f"[3/5] Calculating Face-API embedding (128D) from profile image...")
    face_encoding_faceapi = calculate_faceapi_embedding("./agustin.JPG")
    
    if not face_encoding_faceapi:
        print(f"[ERROR] Failed to calculate Face-API embedding from image")
        print(f"        No face detected in the image or processing error")
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return False
    
    print(f"[✓] Face-API embedding calculated ({len(face_encoding_faceapi)} dimensions)")
    
    # Prepare data for database
    # Table columns: id, full_name, face_encoding, linkedin_content, discord_username, 
    #                photo_path, face_encoding_faceapi, face_encoding_deepface_512, created_at
    print(f"[4/5] Preparing database record...")
    data = {
        "full_name": name,
        "discord_username": username,
        "linkedin_content": linkedin_content,
        "photo_path": profile_image_url,
        # Use 128D Face-API embedding for BOTH columns
        "face_encoding": face_encoding_faceapi,           # Primary (128D)
        "face_encoding_faceapi": face_encoding_faceapi,   # Explicit Face-API column (128D)
    }
    
    print(f"[✓] Using 128D Face-API embedding for both face_encoding and face_encoding_faceapi")
    
    # Insert or Update in database
    print(f"[5/5] {'Updating' if is_update else 'Inserting'} record in database...")
    try:
        if is_update:
            # Update existing record
            response = supabase.table("known_people").update(data).eq("id", existing_person['id']).execute()
            print(f"[✓] Record UPDATED for {name} (ID: {existing_person['id']})")
        else:
            # Insert new record
            response = supabase.table("known_people").insert(data).execute()
            print(f"[✓] Record INSERTED for {name}")
        
        print(f"     - Full name: {name}")
        print(f"     - Discord username: {username}")
        print(f"     - LinkedIn URL: {linkedin_url or 'N/A'}")
        print(f"     - GitHub URL: {github_url or 'N/A'}")
        print(f"     - Face-API embedding (128D): ✓ calculated and stored")
        print(f"     - Embedding dimensions: {len(face_encoding_faceapi)}")
        
    except Exception as e:
        print(f"[ERROR] Failed to upsert in database: {e}")
        if os.path.exists(downloaded_path):
            os.remove(downloaded_path)
        return False
    
    # Cleanup
    if os.path.exists(downloaded_path):
        os.remove(downloaded_path)
    
    print("="*80)
    print(f"✅ SUCCESS: {name} processed successfully!")
    print("="*80)
    return True


if __name__ == "__main__":
    # Load from JSON file
    print("💡 Loading from linkedin_profiles_data.json")
    json_file = "linkedin_profiles_data.json"
    
    person_data = None
    
    if os.path.exists(json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            all_data = json.load(f)
        
        # Find the person by username
        for person in all_data:
            if person.get('username') == 'HechoEnChile':
                person_data = person
                print(f"✓ Found 'HechoEnChile' in JSON")
                break
        
        if not person_data:
            print("⚠️  'HechoEnChile' not found in JSON, using first person")
            person_data = all_data[0] if all_data else None
    
    if not person_data:
        # Fallback example data
        print("⚠️  JSON file not found, using example data")
        person_data = {
            "username": "HechoEnChile",
            "linkedin_url": "https://www.linkedin.com/in/agust%C3%ADn-ar%C3%A9valo-487878332",
            "name": "Agustín Arévalo",
            "headline": "Estudiante de Física UC | Fundador de empresa TI | IA & Desarrollo Full-Stack",
            "profile_image_url": "https://l1cty5yj80.ufs.sh/f/tnqDMx4f3sdoyubIrO1puLj9sMkAKwXmHfaz3htRZQnPN6dc",
            "about": None,
            "experience": [{"title": "Gerente general", "company": "Komos SpA"}],
            "education": [{"school": "Pontificia Universidad Católica de Chile", "degree": "Bachelor's degree, Física"}],
            "github_url": "https://github.com/HechoEnChile"
        }
    
    print("\n" + "🚀 "*40)
    print("UPSERT SINGLE PERSON TO DATABASE")
    print("🚀 "*40 + "\n")
    
    success = upsert_person(person_data)
    
    if success:
        print("\n✅ Process completed successfully!")
    else:
        print("\n❌ Process failed!")
