import json
import os
from typing import Dict, List

def add_github_urls_to_profiles(
    profiles_file: str = 'linkedin_profiles_data.json',
    discord_links_file: str = 'discord_users_links.json',
    output_file: str = None,
    create_backup: bool = True
):
    """
    Adds GitHub URLs to LinkedIn profile data by matching usernames.
    
    This script will:
    1. Load existing LinkedIn profiles from linkedin_profiles_data.json
    2. Load Discord user links (which contains GitHub URLs) from discord_users_links.json
    3. Match profiles by username
    4. Add 'github_url' field to each profile (preserving all existing fields)
    5. Save the enriched data back to the file (or new file if specified)
    
    Args:
        profiles_file: Path to LinkedIn profiles JSON file
        discord_links_file: Path to Discord user links JSON file  
        output_file: Optional custom output file (defaults to overwriting profiles_file)
        create_backup: If True, creates a backup before modifying (default: True)
    
    The output will have the same structure but with added 'github_url' field:
    {
        "username": "user123",
        "linkedin_url": "...",
        "github_url": "https://github.com/user123",  # <-- ADDED
        "scraped_at": "...",
        "name": "...",
        ... all other fields preserved ...
    }
    """
    
    print("="*60)
    print("GitHub URL Enrichment Script")
    print("="*60)
    
    # Set output file to profiles_file if not specified
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
    
    # --- 2. Load Discord user links (source of GitHub URLs) ---
    print(f"\n📖 Loading Discord user links from: {discord_links_file}")
    
    if not os.path.exists(discord_links_file):
        print(f"❌ Error: {discord_links_file} not found!")
        return
    
    try:
        with open(discord_links_file, 'r', encoding='utf-8') as f:
            discord_links: List[Dict] = json.load(f)
        print(f"✅ Loaded {len(discord_links)} Discord user records")
    except Exception as e:
        print(f"❌ Error loading Discord links: {e}")
        return
    
    # --- 3. Create username -> GitHub URL mapping ---
    print(f"\n🔗 Building GitHub URL lookup map...")
    
    github_map: Dict[str, str] = {}
    for user in discord_links:
        username = user.get('username')
        github_link = user.get('github_link')
        
        if username and github_link:
            github_map[username] = github_link
    
    print(f"✅ Created mapping for {len(github_map)} users with GitHub links")
    
    # --- 4. Create backup if requested ---
    if create_backup and output_file == profiles_file:
        backup_file = profiles_file.replace('.json', '_backup.json')
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
    
    # --- 5. Add GitHub URLs to profiles ---
    print(f"\n🔧 Adding GitHub URLs to profiles...")
    
    added_count = 0
    updated_count = 0
    missing_count = 0
    
    for profile in profiles:
        username = profile.get('username')
        
        if not username:
            continue
        
        # Check if profile already has a github_url
        had_github = 'github_url' in profile and profile['github_url']
        
        # Get GitHub URL from mapping
        github_url = github_map.get(username)
        
        if github_url:
            profile['github_url'] = github_url
            
            if had_github:
                updated_count += 1
            else:
                added_count += 1
        else:
            # No GitHub URL found for this user
            if 'github_url' not in profile:
                profile['github_url'] = None
            missing_count += 1
    
    # --- 6. Save enriched profiles ---
    print(f"\n💾 Saving enriched profiles to: {output_file}")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(profiles, f, indent=2, ensure_ascii=False)
        print(f"✅ Successfully saved {len(profiles)} profiles")
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return
    
    # --- 7. Summary ---
    print("\n" + "="*60)
    print("✅ ENRICHMENT COMPLETE")
    print("="*60)
    print(f"📊 Statistics:")
    print(f"   • Total profiles processed: {len(profiles)}")
    print(f"   • New GitHub URLs added: {added_count}")
    print(f"   • Existing GitHub URLs updated: {updated_count}")
    print(f"   • Profiles without GitHub URL: {missing_count}")
    print(f"\n💾 Output saved to: {output_file}")
    
    if create_backup and output_file == profiles_file:
        print(f"🔒 Backup available at: {backup_file}")
    
    print("="*60)
    
    # Show sample of enriched data
    print("\n📄 Sample enriched profile (first with GitHub URL):")
    for profile in profiles:
        if profile.get('github_url'):
            print(json.dumps({
                'username': profile.get('username'),
                'name': profile.get('name'),
                'linkedin_url': profile.get('linkedin_url'),
                'github_url': profile.get('github_url'),
                'headline': profile.get('headline')
            }, indent=2))
            break
    
    print("\n✅ Done!")


if __name__ == "__main__":
    import sys
    
    # Allow command-line arguments
    profiles_file = sys.argv[1] if len(sys.argv) > 1 else 'linkedin_profiles_data.json'
    discord_links_file = sys.argv[2] if len(sys.argv) > 2 else 'discord_users_links.json'
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    print(f"\n📋 Configuration:")
    print(f"   • LinkedIn profiles: {profiles_file}")
    print(f"   • Discord links source: {discord_links_file}")
    print(f"   • Output file: {output_file or profiles_file + ' (will overwrite)'}")
    print(f"   • Backup enabled: Yes")
    
    # Confirm before proceeding
    if output_file is None:
        print(f"\n⚠️  Warning: This will modify {profiles_file}")
        print(f"   (A backup will be created as {profiles_file.replace('.json', '_backup.json')})")
        response = input("\nProceed? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)
    
    add_github_urls_to_profiles(
        profiles_file=profiles_file,
        discord_links_file=discord_links_file,
        output_file=output_file,
        create_backup=True
    )
