import time
import sys
import json
import re
from playwright.sync_api import sync_playwright

def scrape_discord_detailed():
    TARGET_URL = "https://discord.com/channels/1439366811979223345/1439370964663140354"
    MEMBER_SELECTOR = ".member__5d473"
    SCROLLABLE_SELECTOR = "aside .scrollerBase_d125d2"
    
    user_data_dir = "/Users/martinmunoz/Library/Application Support/BraveSoftware/Brave-Browser"
    executable_path = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

    print("Starting Detailed Discord Scraper...")
    print("IMPORTANT: Close Brave before running.")

    users_data = []
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
            # Fallback logic from before could go here, but assuming selector works for now based on previous success
            print("Warning: Scroller not found immediately.")
        
        print("Scanning members...")
        
        # We'll do a pass: find visible members, process them, scroll, repeat.
        # To avoid re-processing, we check IDs.
        
        last_scroll_top = -1
        unchanged_count = 0
        
        while True:
            # Get all visible member elements
            # We need element handles to interact with them
            members = page.query_selector_all(MEMBER_SELECTOR)
            
            print(f"Found {len(members)} visible members. Processing...")
            
            for member in members:
                try:
                    # 1. Extract Basic Info & ID from Avatar URL
                    # Avatar img is usually inside .avatar__91a9d img
                    avatar_img = member.query_selector("img[src*='avatars']")
                    if not avatar_img:
                        continue
                        
                    src = avatar_img.get_attribute("src")
                    # URL format: https://cdn.discordapp.com/avatars/USER_ID/HASH.webp
                    user_id = None
                    match = re.search(r'avatars/(\d+)/', src)
                    if match:
                        user_id = match.group(1)
                    
                    if not user_id or user_id in processed_ids:
                        continue
                        
                    # New user found
                    username_el = member.query_selector(".username__5d473")
                    username = username_el.inner_text if username_el else "Unknown"
                    
                    print(f"Processing {username} (ID: {user_id})...")
                    
                    # 2. Click to open profile
                    member.click()
                    
                    # 3. Wait for profile popout
                    # It usually has a generic class or role="dialog"
                    # We look for a container that appears
                    try:
                        # Wait for a popout/modal
                        profile_selector = "[class*='userPopout'], [class*='userProfileModal']"
                        page.wait_for_selector(profile_selector, timeout=3000)
                        
                        # 4. Extract Links (GitHub/LinkedIn)
                        # We look for anchor tags in the profile
                        # Connections often appear in specific sections, but searching all 'a' tags is safer
                        links = page.eval_on_selector_all(f"{profile_selector} a[href]", "(elements) => elements.map(e => e.href)")
                        
                        github_link = None
                        linkedin_link = None
                        
                        for link in links:
                            if "github.com" in link:
                                github_link = link
                            elif "linkedin.com" in link:
                                linkedin_link = link
                        
                        # Also check for text content if links aren't explicit anchors (sometimes they are just text in bio)
                        # But connections are usually clickable.
                        
                        users_data.append({
                            "id": user_id,
                            "username": username,
                            "github_link": github_link,
                            "linkedin_link": linkedin_link
                        })
                        
                        processed_ids.add(user_id)
                        print(f"   -> GitHub: {github_link}, LinkedIn: {linkedin_link}")
                        
                        # 5. Close profile
                        page.keyboard.press("Escape")
                        time.sleep(0.5) # Wait for animation
                        
                    except Exception as e:
                        print(f"   -> Error opening/reading profile: {e}")
                        # Ensure we try to close if stuck
                        page.keyboard.press("Escape")

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
                
            scroller.evaluate("el => el.scrollBy(0, 600)")
            time.sleep(1.0) # Wait for render

        # Save to JSON
        with open("discord_users_detailed.json", "w", encoding="utf-8") as f:
            json.dump(users_data, f, indent=2)
            
        print(f"\nSaved {len(users_data)} users to discord_users_detailed.json")
        context.close()

if __name__ == "__main__":
    scrape_discord_detailed()
