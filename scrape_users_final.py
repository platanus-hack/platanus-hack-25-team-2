import time
import sys
import json
import re
import os
from playwright.sync_api import sync_playwright
from firecrawl import FirecrawlApp

def scrape_discord_and_profiles():
    # --- 1. Configure Firecrawl ---
    # Try to get key from env or use a placeholder that will likely fail if not provided
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

    # --- 2. Configure Discord Scraper ---
    TARGET_URL = "https://discord.com/channels/1439366811979223345/1439370964663140354"
    MEMBER_SELECTOR = ".member__5d473"
    SCROLLABLE_SELECTOR = "aside .scrollerBase_d125d2"
    
    user_data_dir = "/Users/martinmunoz/Library/Application Support/BraveSoftware/Brave-Browser"
    executable_path = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

    print("\n--- Starting Phase 1: Scraping Discord Usernames ---")
    print("IMPORTANT: Close Brave before running.")

    discord_users = []
    processed_ids = set()

    with sync_playwright() as p:
        try:
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                executable_path=executable_path,
                headless=False,
                viewport={'width': 1280, 'height': 800}
            )
            page = context.pages[0] if context.pages else context.new_page()
        except Exception as e:
            print(f"Error launching browser: {e}")
            sys.exit(1)

        print(f"Navigating to {TARGET_URL}")
        page.goto(TARGET_URL)
        
        print("Waiting for member list...")
        try:
            page.wait_for_selector(MEMBER_SELECTOR, state="visible", timeout=60000)
            time.sleep(5) # Extra wait for hydration
        except:
            print("Timeout waiting for members.")
            context.close()
            sys.exit(1)

        # Find scroller
        scroller = page.locator(SCROLLABLE_SELECTOR).first
        if not scroller.is_visible():
            print("Warning: Scroller not found immediately.")
        
        last_scroll_top = -1
        unchanged_count = 0
        
        while True:
            # Get all visible member elements
            members = page.query_selector_all(MEMBER_SELECTOR)
            
            print(f"Found {len(members)} visible members. Collecting info...")
            
            for member in members:
                try:
                    # Extract Info
                    # Avatar for ID
                    avatar_img = member.query_selector("img[src*='avatars']")
                    if not avatar_img:
                        continue
                        
                    src = avatar_img.get_attribute("src")
                    user_id = None
                    match = re.search(r'avatars/(\d+)/', src)
                    if match:
                        user_id = match.group(1)
                    
                    if not user_id or user_id in processed_ids:
                        continue
                        
                    # Username
                    username_el = member.query_selector(".username__5d473")
                    username = username_el.inner_text.strip() if username_el else "Unknown"
                    
                    # Store basic info
                    discord_users.append({
                        "id": user_id,
                        "username": username
                    })
                    processed_ids.add(user_id)
                    
                except Exception as e:
                    print(f"Error processing member: {e}")
                    continue

            # Scroll down
            current_scroll = scroller.evaluate("el => el.scrollTop")
            if current_scroll == last_scroll_top:
                unchanged_count += 1
                if unchanged_count >= 5:
                    print("Finished scrolling.")
                    break
            else:
                unchanged_count = 0
                last_scroll_top = current_scroll
                
            scroller.evaluate("el => el.scrollBy(0, 800)")
            time.sleep(0.8) # Wait for render

        context.close()
        print(f"Phase 1 Complete. Found {len(discord_users)} unique users.")

    # --- 3. Phase 2: Firecrawl for External Links ---
    print("\n--- Starting Phase 2: Scraping External Profiles with Firecrawl ---")
    
    final_results = []
    
    for i, user in enumerate(discord_users):
        username = user["username"]
        user_id = user["id"]
        profile_url = f"https://hack.platan.us/id/{username}"
        
        print(f"[{i+1}/{len(discord_users)}] Scraping {profile_url}...")
        
        github_link = None
        linkedin_link = None
        
        try:
            # Use Firecrawl to scrape the page
            # We ask for markdown or links, markdown usually is good for extraction if we parse it,
            # but 'links' format might be cleaner if Firecrawl supports it reliably.
            # Documentation says formats=['links'] is supported.
            scrape_result = firecrawl.scrape_url(
                profile_url, 
                params={
                    'formats': ['links', 'json'],
                    'jsonOptions': {
                        'prompt': 'Extract the GitHub profile link and LinkedIn profile link for the user.'
                    }
                }
            )
            
            # Method A: Check the JSON extraction (if it worked)
            json_data = scrape_result.get('json', {})
            if json_data:
                github_link = json_data.get('github_profile_link') or json_data.get('github')
                linkedin_link = json_data.get('linkedin_profile_link') or json_data.get('linkedin')

            # Method B: Fallback to link analysis if JSON extraction is empty/null
            if not github_link or not linkedin_link:
                links = scrape_result.get('links', [])
                for link in links:
                    # link is often a string URL
                    if not github_link and "github.com" in link:
                         # Avoid generic github links like extracting the repo itself if possible, but usually profile links are clean
                         # Filter out 'github.com/sponsors' or similar if needed
                         github_link = link
                    if not linkedin_link and "linkedin.com/in/" in link:
                        linkedin_link = link
            
            print(f"   -> Found: GH={github_link}, LI={linkedin_link}")
            
        except Exception as e:
            print(f"   -> Error scraping {profile_url}: {e}")
        
        final_results.append({
            "id": user_id,
            "username": username,
            "github_link": github_link,
            "linkedin_link": linkedin_link
        })
        
        # Respect rate limits slightly
        time.sleep(1)

    # --- 4. Save Final Data ---
    output_file = "discord_users_final.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2)
        
    print(f"\nDone! Data saved to {output_file}")

if __name__ == "__main__":
    scrape_discord_and_profiles()
