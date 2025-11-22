import os
from supabase import create_client, Client
from dotenv import load_dotenv
from services.face_service import calculate_cosine_similarity, get_confidence_level, is_match

load_dotenv()

class SupabaseService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        self.client: Client = create_client(url, key)
    
    def get_all_known_people(self):
        """
        Fetch all users from known_people table with valid face encodings.
        
        Returns:
            list: List of user profiles with face encodings
        """
        try:
            response = self.client.table('known_people').select('*').not_.is_('face_encoding', 'null').execute()
            
            if not response.data:
                return []
            
            return response.data
            
        except Exception as e:
            raise Exception(f"Failed to fetch known people from database: {str(e)}")
    
    def find_best_match(self, query_embedding):
        """
        Find the best matching person from database based on cosine similarity.
        
        Args:
            query_embedding: numpy array of face embedding
            
        Returns:
            dict: Contains 'success', 'match' (profile + similarity info), and optional 'error'
        """
        try:
            # Get all known people with embeddings
            known_people = self.get_all_known_people()
            
            if not known_people:
                return {
                    'success': False,
                    'error': "No known people found in database"
                }
            
            best_match = None
            best_similarity = -1
            
            # Compare query embedding with all database encodings
            for person in known_people:
                if not person.get('face_encoding'):
                    continue
                
                # Calculate similarity
                similarity = calculate_cosine_similarity(
                    query_embedding,
                    person['face_encoding']
                )
                
                # Track best match
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = person
            
            if not best_match:
                return {
                    'success': False,
                    'error': "No valid matches found"
                }
            
            # Prepare response with match info using correct field names
            match_result = {
                'id': best_match.get('id'),
                'full_name': best_match.get('full_name'),
                'discord_username': best_match.get('discord_username'),
                'photo_path': best_match.get('photo_path'),
                'linkedin_content': best_match.get('linkedin_content'),
                'created_at': best_match.get('created_at'),
                'cosine_similarity': float(best_similarity),
                'confidence': get_confidence_level(best_similarity),
                'is_match': bool(is_match(best_similarity))
            }
            
            return {
                'success': True,
                'match': match_result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Database matching error: {str(e)}"
            }
