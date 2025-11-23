import time
import sys
from playwright.sync_api import sync_playwright

def scrape_discord_users():
    # Configuration
    TARGET_URL = "https://discord.com/channels/1439366811979223345/1439370964663140354"
    # Target the member list directly based on analysis
    MEMBER_SELECTOR = ".member__5d473"
    # The scrollable container usually has 'scroller' in its class in Discord
    SCROLLABLE_SELECTOR = "aside .scrollerBase_d125d2" 
    
    print("Starting Discord Scraper...")
    print("Note: This script uses your existing Brave profile.")
    print("IMPORTANT: You must CLOSE Brave completely before running this script.")

    user_data_dir = "/Users/martinmunoz/Library/Application Support/BraveSoftware/Brave-Browser"
    executable_path = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

    with sync_playwright() as p:
        try:
            print(f"Launching Brave with profile from: {user_data_dir}")
            # launch_persistent_context launches the browser and returns the context directly
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                executable_path=executable_path,
                headless=False,
                viewport={'width': 1280, 'height': 800}
            )
            
            # Get the first page (persistent context usually opens one)
            page = context.pages[0] if context.pages else context.new_page()
            
        except Exception as e:
            print("\nERROR: Could not launch Brave with your profile.")
            print("Most likely cause: Brave is currently running.")
            print("Please quit Brave (Cmd+Q) and try again.")
            print(f"Details: {e}")
            sys.exit(1)

        print(f"Navigating to {TARGET_URL}")
        page.goto(TARGET_URL)

        print("Waiting 15 seconds for page initial load...")
        time.sleep(15)

        # Wait for the page/sidebar to be visible. 
        print(f"Waiting for members to appear ({MEMBER_SELECTOR})...")
        try:
            # Wait up to 5 minutes 
            page.wait_for_selector(MEMBER_SELECTOR, state="visible", timeout=300000)
            print("Members list detected!")
        except Exception as e:
            print("Timeout: Members list not found.")
            context.close()
            sys.exit(1)

        # Locate the scrollable sidebar element
        print("Identifying scrollable element...")
        try:
            # Try the specific class we found
            scrollable_handle = page.locator(SCROLLABLE_SELECTOR).element_handle()
            if not scrollable_handle:
                # Fallback: try to find the parent of a member that is scrollable
                print("Primary scroller selector failed, trying fallback...")
                scrollable_handle = page.evaluate_handle(f"""
                    () => {{
                        const member = document.querySelector('{MEMBER_SELECTOR}');
                        if (!member) return null;
                        let parent = member.parentElement;
                        while (parent) {{
                            const style = window.getComputedStyle(parent);
                            if (style.overflowY === 'auto' || style.overflowY === 'scroll' || parent.classList.contains('scrollerBase_d125d2')) {{
                                return parent;
                            }}
                            parent = parent.parentElement;
                        }}
                        return null;
                    }}
                """)
        except Exception as e:
            print(f"Error finding scroller: {e}")
            context.close()
            sys.exit(1)

        if not scrollable_handle:
            print("Could not find scrollable element.")
            context.close()
            sys.exit(1)

        extracted_names = set()
        last_scroll_top = -1
        unchanged_count = 0
        MAX_UNCHANGED = 10  # Stop if scroll position doesn't change for N iterations

        print("Starting scroll and scrape loop...")
        
        while True:
            # 1. Extract visible usernames
            new_names = page.evaluate(f"""
                (container) => {{
                    const names = [];
                    // Find all members within the container (or globally if container is the list itself)
                    // We use the document to find all members currently rendered
                    const items = document.querySelectorAll('{MEMBER_SELECTOR}');
                    
                    items.forEach(item => {{
                        // Try to find the username span specifically
                        const nameSpan = item.querySelector('.username__5d473');
                        if (nameSpan && nameSpan.innerText) {{
                            names.push(nameSpan.innerText);
                        }} else if (item.innerText) {{
                            // Fallback
                            names.push(item.innerText.split('\\n')[0]);
                        }}
                    }});
                    return names;
                }}
            """, scrollable_handle)

            # Add valid names to our set
            if new_names:
                count_before = len(extracted_names)
                for name in new_names:
                    clean_name = name.strip()
                    if clean_name:
                        extracted_names.add(clean_name)
                
                if len(extracted_names) > count_before:
                    print(f"Collected {len(extracted_names)} unique users so far...")

            # 2. Scroll down
            # Get current scroll position
            current_scroll_top = page.evaluate("el => el.scrollTop", scrollable_handle)
            
            # Check if we are stuck or at bottom
            if current_scroll_top == last_scroll_top:
                unchanged_count += 1
                if unchanged_count >= MAX_UNCHANGED:
                    print("Reached end of list or scrolling stopped.")
                    break
            else:
                unchanged_count = 0
                last_scroll_top = current_scroll_top

            # Scroll by a fixed amount
            page.evaluate("el => el.scrollBy(0, 800)", scrollable_handle)
            
            # Wait for content to load - dynamic lists need time to render new items
            time.sleep(0.5) 
 

        # Save results
        output_file = "discord_users.txt"
        with open(output_file, "w", encoding="utf-8") as f:
            for name in sorted(extracted_names):
                f.write(name + "\n")

        print(f"\nDone! Extracted {len(extracted_names)} unique usernames.")
        print(f"Saved to {output_file}")
        
        context.close()

if __name__ == "__main__":
    scrape_discord_users()
