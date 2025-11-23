import json
import os
import cv2
import numpy as np
import requests
from io import BytesIO
from typing import List, Dict, Tuple
from urllib.parse import urlparse

def extract_github_username(github_url: str) -> str:
    """
    Extract username from GitHub URL.
    Examples:
        https://github.com/username -> username
        https://github.com/username/ -> username
    """
    if not github_url:
        return None
    
    try:
        path = urlparse(github_url).path.strip('/')
        username = path.split('/')[0]
        return username if username else None
    except:
        return None


def get_github_avatar_url(github_url: str) -> str:
    """
    Construct GitHub avatar URL from GitHub profile URL.
    """
    username = extract_github_username(github_url)
    if not username:
        return None
    
    return f"https://avatars.githubusercontent.com/{username}"


def download_image(url: str, timeout: int = 10) -> np.ndarray:
    """
    Download image from URL and return as OpenCV numpy array.
    Returns None if download fails.
    """
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        
        # Convert to numpy array
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        return image
    except Exception as e:
        print(f"   ⚠️  Failed to download image: {e}")
        return None


def detect_face_opencv(image: np.ndarray) -> bool:
    """
    Detect if image contains a face using OpenCV's Haar Cascade.
    Returns True if at least one face is detected.
    """
    if image is None:
        return False
    
    try:
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load OpenCV's pre-trained Haar Cascade for face detection
        # This is bundled with OpenCV
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # Return True if at least one face detected
        return len(faces) > 0
    
    except Exception as e:
        print(f"   ⚠️  Face detection error: {e}")
        return False


def enrich_profiles_with_github_avatars(
    profiles_file: str = 'linkedin_profiles_data.json',
    output_file: str = None,
    changed_users_file: str = 'github_avatar_updates.txt',
    create_backup: bool = True
):
    """
    Enriches LinkedIn profiles with GitHub avatar URLs for profiles missing images.
    
    This script will:
    1. Load linkedin_profiles_data.json
    2. For each profile where profile_image_url is null AND github_url exists:
       - Construct GitHub avatar URL
       - Download the image
       - Use OpenCV to detect if it contains a face
       - If face detected, update profile_image_url
    3. Save updated profiles to JSON
    4. Output list of changed usernames to TXT file
    
    Args:
        profiles_file: Path to LinkedIn profiles JSON file
        output_file: Optional custom output file (defaults to overwriting profiles_file)
        changed_users_file: Path to TXT file listing updated usernames
        create_backup: If True, creates backup before modifying
    """
    
    print("="*70)
    print("GitHub Avatar Enrichment Script")
    print("="*70)
    
    # Set output file
    if output_file is None:
        output_file = profiles_file
    
    # --- 1. Load LinkedIn profiles ---
    print(f"\n📖 Loading LinkedIn profiles from: {profiles_file}")
    
    if not os.path.exists(profiles_file):
        print(f"❌ Error: {profiles_file} not found!")
        return
    
    try:
        with open(profiles_file, 'r', encoding='utf-8') as f:
            profiles: List[Dict] = json.load(f)
        print(f"✅ Loaded {len(profiles)} profiles")
    except Exception as e:
        print(f"❌ Error loading profiles: {e}")
        return
    
    # --- 2. Identify candidates for GitHub avatar enrichment ---
    print(f"\n🔍 Identifying profiles with null images and GitHub URLs...")
    
    candidates = []
    for profile in profiles:
        has_no_image = profile.get('profile_image_url') is None
        has_github = profile.get('github_url') is not None
        
        if has_no_image and has_github:
            candidates.append(profile)
    
    print(f"✅ Found {len(candidates)} candidates for GitHub avatar enrichment")
    
    if len(candidates) == 0:
        print("\n✅ No profiles need GitHub avatar enrichment. Exiting.")
        return
    
    # --- 3. Create backup if requested ---
    if create_backup and output_file == profiles_file:
        backup_file = profiles_file.replace('.json', '_backup_github.json')
        print(f"\n💾 Creating backup: {backup_file}")
        try:
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(profiles, f, indent=2, ensure_ascii=False)
            print(f"✅ Backup created successfully")
        except Exception as e:
            print(f"⚠️  Warning: Could not create backup: {e}")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                print("Aborted.")
                return
    
    # --- 4. Process each candidate ---
    print(f"\n🔧 Processing {len(candidates)} candidates...")
    print("   (Downloading images and detecting faces)\n")
    
    updated_usernames = []
    success_count = 0
    no_face_count = 0
    error_count = 0
    
    for i, profile in enumerate(candidates):
        username = profile.get('username', f'unknown_{i}')
        github_url = profile.get('github_url')
        
        print(f"[{i+1}/{len(candidates)}] Processing {username}")
        
        # Get GitHub avatar URL
        avatar_url = get_github_avatar_url(github_url)
        
        if not avatar_url:
            print(f"   ⚠️  Could not construct avatar URL from: {github_url}")
            error_count += 1
            continue
        
        print(f"   📥 Downloading: {avatar_url}")
        
        # Download image
        image = download_image(avatar_url)
        
        if image is None:
            print(f"   ❌ Failed to download image")
            error_count += 1
            continue
        
        # Detect face
        print(f"   👤 Detecting face...")
        has_face = detect_face_opencv(image)
        
        if has_face:
            # Update profile with GitHub avatar URL
            profile['profile_image_url'] = avatar_url
            updated_usernames.append(username)
            success_count += 1
            print(f"   ✅ Face detected! Updated profile_image_url")
        else:
            no_face_count += 1
            print(f"   ⚠️  No face detected - skipping (likely default GitHub avatar)")
    
    # --- 5. Save updated profiles ---
    if success_count > 0:
        print(f"\n💾 Saving updated profiles to: {output_file}")
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(profiles, f, indent=2, ensure_ascii=False)
            print(f"✅ Successfully saved {len(profiles)} profiles")
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            return
        
        # --- 6. Save list of updated usernames ---
        print(f"\n📝 Saving list of updated usernames to: {changed_users_file}")
        
        try:
            with open(changed_users_file, 'w', encoding='utf-8') as f:
                for username in updated_usernames:
                    f.write(f"{username}\n")
            print(f"✅ Saved {len(updated_usernames)} usernames to {changed_users_file}")
        except Exception as e:
            print(f"⚠️  Warning: Could not save usernames list: {e}")
    else:
        print(f"\n⚠️  No profiles were updated. Skipping file save.")
    
    # --- 7. Summary ---
    print("\n" + "="*70)
    print("✅ ENRICHMENT COMPLETE")
    print("="*70)
    print(f"📊 Statistics:")
    print(f"   • Total candidates processed: {len(candidates)}")
    print(f"   • ✅ Successfully updated: {success_count}")
    print(f"   • ⚠️  No face detected (skipped): {no_face_count}")
    print(f"   • ❌ Errors encountered: {error_count}")
    print(f"\n💾 Files:")
    print(f"   • Updated profiles: {output_file}")
    
    if success_count > 0:
        print(f"   • Changed usernames: {changed_users_file}")
    
    if create_backup and output_file == profiles_file:
        print(f"   • Backup: {backup_file}")
    
    print("="*70)
    
    # Show sample
    if updated_usernames:
        print(f"\n📄 Sample updated usernames:")
        for username in updated_usernames[:5]:
            print(f"   • {username}")
        if len(updated_usernames) > 5:
            print(f"   ... and {len(updated_usernames) - 5} more")
    
    print("\n✅ Done!")


if __name__ == "__main__":
    import sys
    
    # Allow command-line arguments
    profiles_file = sys.argv[1] if len(sys.argv) > 1 else 'linkedin_profiles_data.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    changed_users_file = sys.argv[3] if len(sys.argv) > 3 else 'github_avatar_updates.txt'
    
    print(f"\n📋 Configuration:")
    print(f"   • Input file: {profiles_file}")
    print(f"   • Output file: {output_file or profiles_file + ' (will overwrite)'}")
    print(f"   • Changed users list: {changed_users_file}")
    print(f"   • Backup enabled: Yes")
    
    # Confirm before proceeding
    if output_file is None:
        print(f"\n⚠️  Warning: This will modify {profiles_file}")
        print(f"   (A backup will be created)")
        response = input("\nProceed? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)
    
    enrich_profiles_with_github_avatars(
        profiles_file=profiles_file,
        output_file=output_file,
        changed_users_file=changed_users_file,
        create_backup=True
    )
