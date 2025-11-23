# LinkedIn Profile Scraper - Usage Guide

## Overview

This project contains two LinkedIn scraping scripts:

1. **`scrape_linkedin.py`** - Original script that scrapes from `discord_users_links.json`
2. **`scrape_linkedin_from_urls.py`** - New flexible script that accepts any list of LinkedIn URLs

## Quick Start - scrape_linkedin_from_urls.py

### 1. Prepare Your Input File

The script supports **3 input formats**:

#### Option A: Plain Text File (Simplest)
Create a file `linkedin_urls.txt` with one URL per line:

```txt
https://www.linkedin.com/in/username1
https://www.linkedin.com/in/username2
https://www.linkedin.com/in/username3
```

#### Option B: JSON Array of URLs
Create a file `linkedin_urls.json`:

```json
[
  "https://www.linkedin.com/in/username1",
  "https://www.linkedin.com/in/username2",
  "https://www.linkedin.com/in/username3"
]
```

#### Option C: JSON Array of Objects (with custom identifiers)
Create a file `linkedin_urls.json`:

```json
[
  {
    "url": "https://www.linkedin.com/in/username1",
    "id": "user_001"
  },
  {
    "url": "https://www.linkedin.com/in/username2",
    "id": "user_002"
  }
]
```

### 2. Set Up LinkedIn Credentials (Optional)

Create or edit `.env` file in the project directory:

```env
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password
```

**OR** manually log in when the browser opens.

### 3. Run the Script

#### Basic usage (uses default files):
```bash
python scrape_linkedin_from_urls.py
```

This will:
- Read from `linkedin_urls.txt` (default input)
- Save to `linkedin_profiles_output.json` (default output)

#### Custom input/output files:
```bash
python scrape_linkedin_from_urls.py my_urls.txt my_output.json
```

Or with JSON input:
```bash
python scrape_linkedin_from_urls.py linkedin_urls.json team_profiles.json
```

### 4. Output Format

The script generates JSON output in the **same format** as `linkedin_profiles_data.json`:

```json
[
  {
    "username": "user_001",
    "linkedin_url": "https://www.linkedin.com/in/username1",
    "scraped_at": "2025-11-22 14:30:00",
    "name": "John Doe",
    "headline": "Software Engineer at Company",
    "location": "San Francisco, CA",
    "profile_image_url": "https://media.licdn.com/...",
    "about": "Passionate about building...",
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Company Name"
      }
    ],
    "education": [
      {
        "school": "University Name",
        "degree": "Bachelor's degree, Computer Science"
      }
    ],
    "skills": [],
    "error": null
  }
]
```

## Features

### ✅ Resume Support
- The script automatically **resumes from where it left off**
- If the script crashes or you stop it, just run it again
- Already scraped profiles are skipped automatically

### ⏱️ Rate Limiting
- **Random delays** between profiles (8-15 seconds)
- **Long breaks** every 10 profiles (60-90 seconds)
- **Random breaks** at unpredictable intervals (45-75 seconds)
- Human-like scrolling behavior to avoid detection

### 🔄 Real-time Saving
- Results are saved **after each profile**
- Safe to interrupt and resume at any time

### 🎯 Smart Extraction
Extracts the following profile data:
- Name
- Headline
- Location
- Profile Image URL (200x200 high quality)
- About section
- Top 3 work experiences
- Top 2 education entries
- Skills (if available)

## Examples

### Example 1: Scrape from a simple text file
```bash
# Create linkedin_urls.txt with your URLs
echo "https://www.linkedin.com/in/munoncode" > linkedin_urls.txt
echo "https://www.linkedin.com/in/diego-huaccha-diestra" >> linkedin_urls.txt

# Run the scraper
python scrape_linkedin_from_urls.py

# Output saved to linkedin_profiles_output.json
```

### Example 2: Scrape specific list with custom output
```bash
python scrape_linkedin_from_urls.py team_urls.txt team_profiles.json
```

### Example 3: Use JSON input with identifiers
```json
// my_team.json
[
  {
    "url": "https://www.linkedin.com/in/munoncode",
    "username": "munonzito"
  },
  {
    "url": "https://www.linkedin.com/in/diego-huaccha-diestra",
    "username": "diieggo"
  }
]
```

```bash
python scrape_linkedin_from_urls.py my_team.json team_output.json
```

## Troubleshooting

### "Login Required" Error
- Make sure you're logged in to LinkedIn
- Check your `.env` credentials
- Try logging in manually when the browser opens

### "Profile Not Found (404)"
- Verify the LinkedIn URL is correct
- Check if the profile is public
- Some profiles may be restricted

### Rate Limiting / Blocked
- The script includes built-in rate limiting
- If you get blocked, wait 24 hours before trying again
- Consider reducing the number of profiles per session
- Use longer delays (edit `MIN_DELAY` and `MAX_DELAY` in the script)

### Timeout Errors
- Check your internet connection
- LinkedIn might be slow or down
- The script will mark profiles with errors and continue

## Comparison: scrape_linkedin.py vs scrape_linkedin_from_urls.py

| Feature | scrape_linkedin.py | scrape_linkedin_from_urls.py |
|---------|-------------------|------------------------------|
| Input format | `discord_users_links.json` only | Text file, JSON array, or JSON objects |
| Flexibility | Fixed for Discord users | Any LinkedIn URLs |
| Priority users | Built-in priority list | All URLs treated equally |
| Output format | Same JSON format | Same JSON format |
| Rate limiting | ✅ | ✅ |
| Resume support | ✅ | ✅ |
| Custom identifiers | Uses Discord username | Customizable via JSON input |

## Tips for Best Results

1. **Start small**: Test with 5-10 profiles first
2. **Use good identifiers**: If using JSON objects, provide meaningful IDs
3. **Monitor the browser**: Watch the first few scrapes to ensure login works
4. **Be patient**: Rate limiting is important to avoid getting blocked
5. **Check errors**: Review profiles with `"error": "..."` in the output

## Requirements

Make sure you have the required packages installed:

```bash
pip install playwright python-dotenv
playwright install chromium
```

## License

This script is for educational purposes. Please respect LinkedIn's Terms of Service and use responsibly.
