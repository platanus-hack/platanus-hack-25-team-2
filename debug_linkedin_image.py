import time
import os
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

"""
Debug script to find the correct selector for LinkedIn profile images.

This will:
1. Open a LinkedIn profile
2. Wait for you to log in (if needed)
3. Show you all the img tags on the page
4. Help identify the correct selector for profile pictures
"""

def debug_profile_image():
    load_dotenv()
    
    # Get a test LinkedIn URL from your data
    test_url = input("Enter a LinkedIn profile URL to test (or press Enter for default): ").strip()
    if not test_url:
        # Use a default public profile
        test_url = "https://www.linkedin.com/in/andrepachecot"
    
    print(f"\n🔍 Debugging profile image selector for: {test_url}")
    print("=" * 70)
    
    with sync_playwright() as p:
        # Launch browser in headed mode so you can see
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        # Check for LinkedIn credentials
        linkedin_email = os.getenv('LINKEDIN_EMAIL')
        linkedin_password = os.getenv('LINKEDIN_PASSWORD')
        
        if linkedin_email and linkedin_password:
            print("Attempting auto-login...")
            try:
                page.goto('https://www.linkedin.com/login', wait_until='domcontentloaded')
                time.sleep(2)
                page.fill('#username', linkedin_email)
                page.fill('#password', linkedin_password)
                page.click('button[type="submit"]')
                time.sleep(5)
                print("✓ Auto-login attempted")
            except Exception as e:
                print(f"Auto-login failed: {e}")
        else:
            print("\n⚠️  No credentials in .env file")
            print("Opening LinkedIn login page...")
            page.goto('https://www.linkedin.com/login', wait_until='domcontentloaded')
            time.sleep(2)
        
        print("\n⚠️  Please log in manually if needed...")
        print("Press Enter after you're logged in and see the feed...")
        input()
        
        # Navigate to profile
        print(f"\n📄 Loading profile: {test_url}")
        try:
            page.goto(test_url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(5)
            
            # Check if we're on the right page
            current_url = page.url
            print(f"Current URL: {current_url}")
            
            if 'about:blank' in current_url:
                print("⚠️  Page is blank! This might be a navigation issue.")
                print("Trying again...")
                page.goto(test_url, wait_until='networkidle', timeout=30000)
                time.sleep(5)
                
            if 'authwall' in current_url or 'login' in current_url:
                print("⚠️  Hit login wall! Please log in manually.")
                print("Press Enter after logging in and navigating to the profile...")
                input()
                
        except Exception as e:
            print(f"Error navigating to profile: {e}")
            print("Please manually navigate to the profile in the browser.")
            print("Press Enter when ready...")
            input()
        
        print("\n" + "=" * 70)
        print("🔍 SEARCHING FOR PROFILE IMAGES")
        print("=" * 70)
        
        # Try to find all images on the page
        all_images = page.query_selector_all('img')
        print(f"\n📊 Found {len(all_images)} total images on page\n")
        
        # Test various selectors
        selectors_to_test = [
            'img.pv-top-card-profile-picture__image',
            'img.profile-photo-edit__preview',
            'button.pv-top-card-profile-picture img',
            'img[alt*="photo"]',
            'img[alt*="Photo"]',
            '.pv-top-card--photo img',
            '.pv-top-card-profile-picture img',
            'img.profile-photo',
            'img.avatar-image',
            '.profile-picture img',
            'div.pv-top-card__photo img',
            'img.presence-entity__image',
            'img.EntityPhoto-circle-9',
            'button img[width="200"]',
            'img.evi-image',
        ]
        
        print("🧪 TESTING COMMON SELECTORS:")
        print("-" * 70)
        
        found_images = []
        for selector in selectors_to_test:
            try:
                elem = page.query_selector(selector)
                if elem:
                    src = elem.get_attribute('src')
                    alt = elem.get_attribute('alt')
                    width = elem.get_attribute('width')
                    height = elem.get_attribute('height')
                    classes = elem.get_attribute('class')
                    
                    print(f"✅ FOUND: {selector}")
                    print(f"   src: {src[:100] if src else 'None'}...")
                    print(f"   alt: {alt}")
                    print(f"   size: {width}x{height}")
                    print(f"   classes: {classes}")
                    print()
                    
                    found_images.append({
                        'selector': selector,
                        'src': src,
                        'alt': alt,
                        'size': f"{width}x{height}"
                    })
            except:
                pass
        
        if not found_images:
            print("❌ None of the common selectors worked!\n")
            print("🔍 Let me show you ALL images with their attributes:\n")
            print("=" * 70)
            
            for idx, img in enumerate(all_images[:20], 1):  # Show first 20 images
                try:
                    src = img.get_attribute('src') or ''
                    alt = img.get_attribute('alt') or ''
                    classes = img.get_attribute('class') or ''
                    width = img.get_attribute('width') or ''
                    height = img.get_attribute('height') or ''
                    
                    # Try to identify if this might be a profile picture
                    is_likely_profile = any([
                        'profile' in classes.lower(),
                        'avatar' in classes.lower(),
                        'photo' in alt.lower(),
                        'picture' in alt.lower(),
                        width in ['200', '160', '150'],
                        height in ['200', '160', '150']
                    ])
                    
                    marker = "⭐ LIKELY PROFILE IMAGE" if is_likely_profile else ""
                    
                    print(f"\nImage #{idx} {marker}")
                    print(f"  src: {src[:80]}...")
                    print(f"  alt: {alt[:60]}")
                    print(f"  class: {classes[:60]}")
                    print(f"  size: {width}x{height}")
                    
                except Exception as e:
                    print(f"  Error reading image: {e}")
        
        print("\n" + "=" * 70)
        print("📝 RECOMMENDATIONS:")
        print("=" * 70)
        
        if found_images:
            print("\n✅ Found working selectors! Here are the best options:\n")
            for img_info in found_images[:3]:
                print(f"  • {img_info['selector']}")
                print(f"    Size: {img_info['size']}, Alt: {img_info['alt']}")
                print()
        else:
            print("\n⚠️  No standard selectors worked.")
            print("👆 Look at the images listed above marked with ⭐")
            print("   Copy the 'class' value of the profile image and share it with me.")
        
        print("\n🔍 You can also inspect the page manually:")
        print("   1. Right-click the profile image")
        print("   2. Click 'Inspect' or 'Inspect Element'")
        print("   3. Look at the <img> tag's attributes")
        print("   4. Share the class names and structure with me")
        
        print("\n⏸️  Browser will stay open. Press Enter when done inspecting...")
        input()
        
        browser.close()
        
        print("\n✅ Debug session complete!")

if __name__ == "__main__":
    debug_profile_image()
