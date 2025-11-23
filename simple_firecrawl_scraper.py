import time
import sys
import json
import os
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

def scrape_usernames_only():
    # Load environment variables from .env file
    load_dotenv()

    # --- 1. Configure Firecrawl ---
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print("WARNING: FIRECRAWL_API_KEY environment variable not found.")
        print("Please set it before running, or enter it now:")
        try:
            api_key = input("Firecrawl API Key: ").strip()
        except EOFError:
            print("No input possible. Exiting.")
            sys.exit(1)
            
    firecrawl = FirecrawlApp(api_key=api_key)

    # --- 2. Read Usernames ---
    # We will read discord_users.txt
    # Note: The file contains some noise like "INDI", "OAI", "777", "NEXT" which seem to be badges/roles captured by previous scrape.
    # We should try to filter these out if possible, or just accept them and let the scraper fail gracefully.
    # Common short noisy strings might be filterable.
    
    IGNORED_STRINGS = {"INDI", "OAI", "NEXT", "SEAF", "CVX", "EART", "777", "CHUD", "HOTP", "PEAK", "VIVE"}
    
    usernames = []
    try:
        with open("discord_users.txt", "r", encoding="utf-8") as f:
            for line in f:
                clean = line.strip()
                if clean and clean not in IGNORED_STRINGS:
                    usernames.append(clean)
    except FileNotFoundError:
        print("Error: discord_users.txt not found.")
        sys.exit(1)
        
    print(f"Loaded {len(usernames)} usernames to process.")

    # --- 3. Load existing results if available ---
    output_file = "discord_users_links.json"
    existing_results = {}
    
    try:
        with open(output_file, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
            # Create a dict for quick lookup
            for entry in existing_data:
                existing_results[entry['username']] = entry
        print(f"Loaded {len(existing_results)} existing entries from {output_file}")
    except FileNotFoundError:
        print(f"No existing file found. Starting fresh.")
    
    final_results = []

    # --- 4. Scrape with Firecrawl ---
    print("\n--- Starting Firecrawl Extraction ---")
    
    users_to_scrape = 0
    users_skipped = 0
    
    for i, username in enumerate(usernames):
        # Check if we already have this user's data
        existing = existing_results.get(username, {})
        existing_github = existing.get('github_link')
        existing_linkedin = existing.get('linkedin_link')
        
        # Skip if we already have both links
        if existing_github and existing_linkedin:
            print(f"[{i+1}/{len(usernames)}] Skipping {username} (already have both links)")
            final_results.append(existing)
            users_skipped += 1
            continue
        
        profile_url = f"https://hack.platan.us/id/{username}"
        print(f"[{i+1}/{len(usernames)}] Scraping {username} ({profile_url})...")
        users_to_scrape += 1
        
        # Start with existing links if available
        github_link = existing_github
        linkedin_link = existing_linkedin
        
        try:
            # Using 'json' format with a prompt is often more reliable for structured data
            # According to Firecrawl v2 API, pass options directly, not in 'params'
            scrape_result = firecrawl.scrape(
                profile_url, 
                formats=[{
                    'type': 'json',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'github_profile_link': {'type': 'string'},
                            'linkedin_profile_link': {'type': 'string'}
                        }
                    },
                    'prompt': 'Extract the GitHub profile link and LinkedIn profile link for the user.'
                }]
            )
            
            # scrape_result is a Document object with direct attribute access
            data = scrape_result.json if hasattr(scrape_result, 'json') else {}
            if data:
                # Only update if we don't already have the link
                if not github_link:
                    github_link = data.get('github_profile_link')
                if not linkedin_link:
                    linkedin_link = data.get('linkedin_profile_link')
            
            if github_link or linkedin_link:
                print(f"   -> Found: GH={github_link}, LI={linkedin_link}")
            else:
                print("   -> No links found (page might not exist or is empty).")

        except Exception as e:
            error_msg = str(e)
            print(f"   -> Error scraping {username}: {e}")
            
            # If rate limited, wait longer before continuing
            if "Rate Limit Exceeded" in error_msg or "rate limit" in error_msg.lower():
                print("   -> Rate limited! Waiting 20 seconds before continuing...")
                time.sleep(20)
        
        final_results.append({
            "username": username,
            "github_link": github_link,
            "linkedin_link": linkedin_link
        })
        
        # Rate limit handling - wait between requests
        # Firecrawl free tier has limits, so we need to be careful
        time.sleep(5)

    # --- 5. Save Results ---
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2)
        
    print(f"\n=== Summary ===")
    print(f"Total users: {len(usernames)}")
    print(f"Skipped (already had both links): {users_skipped}")
    print(f"Scraped: {users_to_scrape}")
    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    scrape_usernames_only()
