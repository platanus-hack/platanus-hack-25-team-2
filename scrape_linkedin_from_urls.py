import json
import time
import os
import random
from urllib.parse import quote, unquote
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from dotenv import load_dotenv

def scrape_linkedin_from_urls(input_file='linkedin_urls.txt', output_file='linkedin_profiles_output.json'):
    """
    Scrapes LinkedIn profiles from a list of URLs.
    
    This script will:
    1. Read LinkedIn URLs from input file (one URL per line, or JSON array)
    2. Use Playwright to visit each profile
    3. Extract profile information (name, headline, location, about, experience, education, etc.)
    4. Save results to output JSON file in the same format as linkedin_profiles_data.json
    
    Args:
        input_file: Path to file containing LinkedIn URLs (txt or json)
        output_file: Path to output JSON file
    
    Input file formats supported:
        - Plain text file with one URL per line
        - JSON array of URLs: ["url1", "url2", ...]
        - JSON array of objects: [{"url": "url1", "id": "user1"}, ...]
    
    Note: LinkedIn requires authentication to view profiles. You'll need to:
    - Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your .env file, OR
    - Log in manually when the browser opens (script will pause for you)
    
    Rate Limiting Strategy:
    - Random delays between 8-15 seconds per profile
    - Longer breaks (60-90 seconds) every 10 profiles
    - Human-like scroll behavior
    - Variable timing patterns
    """
    
    # === RATE LIMITING CONFIGURATION ===
    MIN_DELAY = 8       # Minimum seconds between profiles
    MAX_DELAY = 15      # Maximum seconds between profiles
    
    # Fixed interval breaks
    LONG_BREAK_EVERY = 10   # Take a longer break every N profiles
    LONG_BREAK_MIN = 60     # Minimum long break duration (seconds)
    LONG_BREAK_MAX = 90     # Maximum long break duration (seconds)
    
    # Random interval breaks (more unpredictable)
    RANDOM_BREAK_MIN_INTERVAL = 5   # Minimum profiles before random break
    RANDOM_BREAK_MAX_INTERVAL = 12  # Maximum profiles before random break
    RANDOM_BREAK_DURATION_MIN = 45  # Minimum random break duration (seconds)
    RANDOM_BREAK_DURATION_MAX = 75  # Maximum random break duration (seconds)
    
    # Load environment variables
    load_dotenv()
    
    # --- 1. Load LinkedIn URLs ---
    print(f"Loading LinkedIn URLs from {input_file}...")
    urls_to_scrape = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            
            # Try to parse as JSON first
            try:
                data = json.loads(content)
                
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, str):
                            # Simple array of URLs
                            urls_to_scrape.append({
                                'url': item,
                                'identifier': f'profile_{len(urls_to_scrape) + 1}'
                            })
                        elif isinstance(item, dict):
                            # Array of objects with url field
                            url = item.get('url') or item.get('linkedin_url') or item.get('link')
                            identifier = item.get('id') or item.get('username') or item.get('name') or f'profile_{len(urls_to_scrape) + 1}'
                            if url:
                                urls_to_scrape.append({
                                    'url': url,
                                    'identifier': identifier
                                })
                else:
                    print(f"Error: JSON file must contain an array of URLs or objects")
                    return
                    
            except json.JSONDecodeError:
                # Not JSON, treat as plain text file (one URL per line)
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    line = line.strip()
                    if line and not line.startswith('#'):  # Skip empty lines and comments
                        urls_to_scrape.append({
                            'url': line,
                            'identifier': f'profile_{i + 1}'
                        })
                        
    except FileNotFoundError:
        print(f"Error: {input_file} not found!")
        print(f"\nPlease create {input_file} with LinkedIn URLs (one per line)")
        print("Example:")
        print("https://www.linkedin.com/in/username1")
        print("https://www.linkedin.com/in/username2")
        return
    
    if not urls_to_scrape:
        print("Error: No URLs found in input file!")
        return
    
    print(f"Found {len(urls_to_scrape)} LinkedIn URLs to scrape")
    
    # Calculate estimated time
    profiles_to_process = len(urls_to_scrape)
    avg_delay = (MIN_DELAY + MAX_DELAY) / 2
    long_breaks = profiles_to_process // LONG_BREAK_EVERY
    avg_long_break = (LONG_BREAK_MIN + LONG_BREAK_MAX) / 2
    
    estimated_time_mins = (profiles_to_process * avg_delay + long_breaks * avg_long_break) / 60
    print(f"\n⏱️  Estimated time (with rate limiting): ~{int(estimated_time_mins)} minutes")
    print(f"   - Average delay between profiles: {avg_delay:.1f}s")
    print(f"   - Long breaks every {LONG_BREAK_EVERY} profiles: {int(avg_long_break)}s")
    
    # --- 2. Load existing results to avoid re-scraping ---
    existing_profiles = {}
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            for profile in existing_data:
                # Index by both URL and identifier
                url_key = profile.get('linkedin_url', '').lower()
                id_key = profile.get('username', '')
                if url_key:
                    existing_profiles[url_key] = profile
                if id_key:
                    existing_profiles[id_key] = profile
        print(f"Loaded {len(existing_data)} existing profiles from {output_file}")
    except FileNotFoundError:
        print("No existing profiles found. Starting fresh.")
    
    results = []
    
    # --- 3. Set up Playwright ---
    print("\n=== Starting LinkedIn Scraper ===")
    print("IMPORTANT: LinkedIn requires login to view profiles.")
    print("Options:")
    print("1. Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env for auto-login")
    print("2. The browser will open - you can log in manually")
    print("\nPress Ctrl+C to cancel...\n")
    time.sleep(3)
    
    with sync_playwright() as p:
        # Launch browser in headed mode so user can see what's happening
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        
        # Check if we should auto-login
        linkedin_email = os.getenv('LINKEDIN_EMAIL')
        linkedin_password = os.getenv('LINKEDIN_PASSWORD')
        
        logged_in = False
        
        if linkedin_email and linkedin_password:
            print("Attempting auto-login with credentials from .env...")
            try:
                page.goto('https://www.linkedin.com/login', wait_until='domcontentloaded')
                page.fill('#username', linkedin_email)
                page.fill('#password', linkedin_password)
                page.click('button[type="submit"]')
                time.sleep(5)
                
                # Check if login was successful
                if 'feed' in page.url or 'mynetwork' in page.url:
                    print("✓ Auto-login successful!")
                    logged_in = True
                else:
                    print("⚠ Auto-login may have failed. Please log in manually if needed.")
            except Exception as e:
                print(f"Auto-login error: {e}")
                print("Please log in manually in the browser window.")
        
        if not logged_in:
            print("\n=== Manual Login Required ===")
            print("Please log in to LinkedIn in the browser window that opened.")
            print("Once you're logged in and see your feed, press Enter here to continue...")
            page.goto('https://www.linkedin.com/login', wait_until='domcontentloaded')
            input("Press Enter after logging in...")
        
        # --- 4. Scrape each profile ---
        scraped_count = 0
        skipped_count = 0
        error_count = 0
        
        # Initialize random break counter
        next_random_break = random.randint(RANDOM_BREAK_MIN_INTERVAL, RANDOM_BREAK_MAX_INTERVAL)
        profiles_since_last_random_break = 0
        
        for i, url_data in enumerate(urls_to_scrape):
            identifier = url_data['identifier']
            linkedin_url = url_data['url']
            
            # Fix URL encoding issues (normalize to proper percent-encoding)
            try:
                # Decode then re-encode to normalize
                linkedin_url = quote(unquote(linkedin_url), safe=':/?#[]@!$&\'()*+,;=')
            except:
                pass  # If encoding fails, use original URL
            
            # Check if already scraped (by URL or identifier)
            url_key = linkedin_url.lower()
            if url_key in existing_profiles or identifier in existing_profiles:
                print(f"[{i+1}/{len(urls_to_scrape)}] Skipping {identifier} (already scraped)")
                # Add to results from existing data
                existing_profile = existing_profiles.get(url_key) or existing_profiles.get(identifier)
                results.append(existing_profile)
                skipped_count += 1
                continue
            
            print(f"[{i+1}/{len(urls_to_scrape)}] Scraping {identifier}: {linkedin_url}")
            
            profile_data = {
                'username': identifier,
                'linkedin_url': linkedin_url,
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'name': None,
                'headline': None,
                'location': None,
                'profile_image_url': None,
                'about': None,
                'experience': [],
                'education': [],
                'skills': [],
                'error': None
            }
            
            try:
                # Navigate to profile
                page.goto(linkedin_url, wait_until='domcontentloaded', timeout=30000)
                
                # Human-like behavior: random initial wait
                initial_wait = random.uniform(2.5, 4.5)
                time.sleep(initial_wait)
                
                # Simulate human scrolling behavior
                try:
                    # Scroll down slowly in steps
                    for _ in range(random.randint(2, 4)):
                        page.evaluate(f'window.scrollBy(0, {random.randint(300, 600)})')
                        time.sleep(random.uniform(0.5, 1.2))
                    
                    # Scroll back up a bit (humans do this)
                    page.evaluate(f'window.scrollBy(0, -{random.randint(100, 300)})')
                    time.sleep(random.uniform(0.3, 0.8))
                except:
                    pass  # If scrolling fails, continue anyway
                
                # Check if we hit a login wall or profile doesn't exist
                if 'authwall' in page.url or 'login' in page.url:
                    print("   ⚠ Hit login wall - session may have expired")
                    profile_data['error'] = 'login_required'
                elif '404' in page.url or 'page-not-found' in page.url:
                    print("   ⚠ Profile not found (404)")
                    profile_data['error'] = 'profile_not_found'
                else:
                    # Extract profile information
                    try:
                        # Name (usually in h1)
                        name_elem = page.query_selector('h1.text-heading-xlarge, h1.inline.t-24')
                        if name_elem:
                            profile_data['name'] = name_elem.inner_text().strip()
                        
                        # Headline
                        headline_elem = page.query_selector('div.text-body-medium, div.mt1.t-18')
                        if headline_elem:
                            profile_data['headline'] = headline_elem.inner_text().strip()
                        
                        # Location
                        location_elem = page.query_selector('span.text-body-small.inline.t-black--light')
                        if location_elem:
                            profile_data['location'] = location_elem.inner_text().strip()
                        
                        # Profile Image URL
                        try:
                            # Wait a bit for images to load
                            time.sleep(1)
                            
                            # Try multiple selectors for profile image (in order of preference)
                            selectors = [
                                'button img[width="200"]',  # Best: 200x200 profile picture
                                'img.presence-entity__image',  # Also works but smaller
                                'img[width="200"]',  # Any 200px image
                                'button.pv-top-card-profile-picture img',
                                'div.pv-top-card__photo img',
                                '.pv-top-card--photo img',
                            ]
                            
                            for selector in selectors:
                                img_elem = page.query_selector(selector)
                                if img_elem:
                                    src = img_elem.get_attribute('src')
                                    # Make sure it's a valid LinkedIn profile image URL
                                    if src and ('media.licdn.com' in src or 'licdn.com' in src):
                                        # Prefer the larger image (200x200 or better)
                                        if 'shrink_200_200' in src or 'displayphoto' in src:
                                            profile_data['profile_image_url'] = src
                                            break
                                        # Accept smaller images if no better option
                                        elif not profile_data['profile_image_url']:
                                            profile_data['profile_image_url'] = src
                        except Exception as e:
                            pass  # Silently fail on image extraction
                        
                        # About section
                        try:
                            about_section = page.query_selector('section:has(#about)')
                            if about_section:
                                about_elem = about_section.query_selector('div.inline-show-more-text span[aria-hidden="true"]')
                                if about_elem:
                                    profile_data['about'] = about_elem.inner_text().strip()
                        except:
                            pass
                        
                        # Experience (first 3 entries)
                        try:
                            exp_section = page.query_selector('section:has(#experience)')
                            if exp_section:
                                exp_items = exp_section.query_selector_all('li.artdeco-list__item')[:3]
                                for exp_item in exp_items:
                                    try:
                                        title = exp_item.query_selector('div.display-flex.align-items-center span[aria-hidden="true"]')
                                        company = exp_item.query_selector('span.t-14.t-normal span[aria-hidden="true"]')
                                        if title:
                                            profile_data['experience'].append({
                                                'title': title.inner_text().strip() if title else None,
                                                'company': company.inner_text().strip() if company else None
                                            })
                                    except:
                                        continue
                        except:
                            pass
                        
                        # Education (first 2 entries)
                        try:
                            edu_section = page.query_selector('section:has(#education)')
                            if edu_section:
                                edu_items = edu_section.query_selector_all('li.artdeco-list__item')[:2]
                                for edu_item in edu_items:
                                    try:
                                        school = edu_item.query_selector('div.display-flex.align-items-center span[aria-hidden="true"]')
                                        degree = edu_item.query_selector('span.t-14.t-normal span[aria-hidden="true"]')
                                        if school:
                                            profile_data['education'].append({
                                                'school': school.inner_text().strip() if school else None,
                                                'degree': degree.inner_text().strip() if degree else None
                                            })
                                    except:
                                        continue
                        except:
                            pass
                        
                        img_status = "✓ img" if profile_data['profile_image_url'] else "✗ no img"
                        print(f"   ✓ Scraped: {profile_data['name']} - {profile_data['headline']} ({img_status})")
                        scraped_count += 1
                    
                    except Exception as extract_error:
                        print(f"   ⚠ Error extracting data: {extract_error}")
                        profile_data['error'] = str(extract_error)
                        error_count += 1
                
            except PlaywrightTimeout:
                print(f"   ⚠ Timeout loading profile")
                profile_data['error'] = 'timeout'
                error_count += 1
            except Exception as e:
                print(f"   ⚠ Error: {e}")
                profile_data['error'] = str(e)
                error_count += 1
            
            results.append(profile_data)
            
            # Save after each profile (in case of crashes)
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            # === ENHANCED RATE LIMITING ===
            if i < len(urls_to_scrape) - 1:  # Don't wait after last one
                # Increment random break counter only if we successfully scraped
                if not profile_data.get('error'):
                    profiles_since_last_random_break += 1
                
                # Check if it's time for a RANDOM break (unpredictable timing)
                if profiles_since_last_random_break >= next_random_break:
                    random_break = random.uniform(RANDOM_BREAK_DURATION_MIN, RANDOM_BREAK_DURATION_MAX)
                    print(f"\n   🎲 RANDOM BREAK! Taking {int(random_break)}s pause (scraped {profiles_since_last_random_break} profiles)")
                    print(f"   ⏸️  This helps avoid predictable patterns. Time: {time.strftime('%H:%M:%S')}")
                    time.sleep(random_break)
                    print(f"   ▶️  Resuming at {time.strftime('%H:%M:%S')}\n")
                    
                    # Reset and set next random break interval
                    profiles_since_last_random_break = 0
                    next_random_break = random.randint(RANDOM_BREAK_MIN_INTERVAL, RANDOM_BREAK_MAX_INTERVAL)
                    print(f"   📝 Next random break will occur after {next_random_break} more profiles\n")
                
                # Check if it's time for a FIXED interval longer break
                elif scraped_count > 0 and scraped_count % LONG_BREAK_EVERY == 0:
                    # Take a longer break every N profiles
                    long_break = random.uniform(LONG_BREAK_MIN, LONG_BREAK_MAX)
                    print(f"\n   ⏸️  Taking scheduled break ({int(long_break)}s) after {LONG_BREAK_EVERY} profiles")
                    print(f"   ⏸️  Progress will resume automatically. Time: {time.strftime('%H:%M:%S')}")
                    time.sleep(long_break)
                    print(f"   ▶️  Resuming at {time.strftime('%H:%M:%S')}\n")
                else:
                    # Normal delay between profiles (randomized)
                    wait_time = random.uniform(MIN_DELAY, MAX_DELAY)
                    print(f"   ⏳ Waiting {wait_time:.1f}s before next profile...")
                    time.sleep(wait_time)
        
        # Close browser
        browser.close()
    
    # --- 5. Summary ---
    print("\n" + "="*50)
    print("=== SCRAPING COMPLETE ===")
    print("="*50)
    print(f"📊 Total URLs processed: {len(urls_to_scrape)}")
    print(f"⏭️  Skipped (already scraped): {skipped_count}")
    print(f"✅ Newly scraped: {scraped_count}")
    print(f"❌ Errors encountered: {error_count}")
    print(f"💾 Results saved to: {output_file}")
    print("="*50)

if __name__ == "__main__":
    import sys
    
    # Allow command-line arguments for input/output files
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'linkedin_urls.txt'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'linkedin_profiles_output.json'
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print()
    
    scrape_linkedin_from_urls(input_file, output_file)
