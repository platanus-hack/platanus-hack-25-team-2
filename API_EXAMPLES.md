# Face Recognition API - Usage Examples

## Endpoint
```
POST http://38.54.20.121/api/identify
```

## Authentication
Currently no authentication required (consider adding API keys for production)

---

## Method 1: Base64 Image (JSON)

### Request Format
```http
POST /api/identify HTTP/1.1
Host: 38.54.20.121
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

### JavaScript Example
```javascript
// Option 1: From file input
async function identifyFaceFromFile(fileInput) {
  const file = fileInput.files[0];
  
  // Convert file to base64
  const reader = new FileReader();
  reader.onloadend = async function() {
    const base64Image = reader.result; // Already includes "data:image/jpeg;base64," prefix
    
    const response = await fetch('http://38.54.20.121/api/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Match found:', result.match.full_name);
      console.log('Confidence:', result.match.confidence);
      console.log('Similarity:', result.match.cosine_similarity);
      console.log('Discord:', result.match.discord_username);
    } else {
      console.error('Error:', result.error);
    }
  };
  
  reader.readAsDataURL(file);
}

// Option 2: From image URL
async function identifyFaceFromURL(imageUrl) {
  // Fetch image and convert to base64
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  const reader = new FileReader();
  reader.onloadend = async function() {
    const base64Image = reader.result;
    
    const apiResponse = await fetch('http://38.54.20.121/api/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });
    
    const result = await apiResponse.json();
    console.log(result);
  };
  
  reader.readAsDataURL(blob);
}

// Option 3: Using canvas
async function identifyFaceFromCanvas(canvas) {
  const base64Image = canvas.toDataURL('image/jpeg', 0.9);
  
  const response = await fetch('http://38.54.20.121/api/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image
    })
  });
  
  const result = await response.json();
  return result;
}

// Usage with HTML
/*
<input type="file" id="imageInput" accept="image/*">
<button onclick="identifyFaceFromFile(document.getElementById('imageInput'))">
  Identify Face
</button>
*/
```

### Python Example
```python
import requests
import base64

# From local file
def identify_face_from_file(image_path):
    with open(image_path, 'rb') as image_file:
        # Encode image to base64
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Add data URL prefix (optional but recommended)
        base64_with_prefix = f"data:image/jpeg;base64,{base64_image}"
        
        response = requests.post(
            'http://38.54.20.121/api/identify',
            json={'image': base64_with_prefix}
        )
        
        result = response.json()
        
        if result['success']:
            match = result['match']
            print(f"✅ Match found: {match['full_name']}")
            print(f"Discord: {match['discord_username']}")
            print(f"Confidence: {match['confidence']}")
            print(f"Similarity: {match['cosine_similarity']:.2%}")
        else:
            print(f"❌ Error: {result['error']}")
        
        return result

# From URL
def identify_face_from_url(image_url):
    import requests
    from io import BytesIO
    
    # Download image
    response = requests.get(image_url)
    image_bytes = response.content
    
    # Encode to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    base64_with_prefix = f"data:image/jpeg;base64,{base64_image}"
    
    # Send to API
    api_response = requests.post(
        'http://38.54.20.121/api/identify',
        json={'image': base64_with_prefix}
    )
    
    return api_response.json()

# Usage
result = identify_face_from_file('photo.jpg')
# or
result = identify_face_from_url('https://example.com/photo.jpg')
```

### cURL Example
```bash
# First, convert your image to base64
BASE64_IMAGE=$(base64 -w 0 photo.jpg)

# Send request (note: you may need to escape quotes properly)
curl -X POST http://38.54.20.121/api/identify \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"data:image/jpeg;base64,$BASE64_IMAGE\"}"
```

---

## Method 2: File Upload (Multipart Form Data)

### Request Format
```http
POST /api/identify HTTP/1.1
Host: 38.54.20.121
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="image"; filename="photo.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### JavaScript Example
```javascript
async function identifyFaceWithFormData(fileInput) {
  const file = fileInput.files[0];
  
  // Create FormData
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('http://38.54.20.121/api/identify', {
    method: 'POST',
    body: formData
    // Note: Do NOT set Content-Type header, browser will set it automatically with boundary
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Match found:', result.match.full_name);
    console.log('Discord:', result.match.discord_username);
    console.log('Confidence:', result.match.confidence);
    console.log('Similarity:', result.match.cosine_similarity);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// Usage with React
function FaceIdentifier() {
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('http://38.54.20.121/api/identify', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Match: ${result.match.full_name} (${result.match.confidence})`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };
  
  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileChange} 
    />
  );
}
```

### Python Example
```python
import requests

def identify_face_with_file(image_path):
    with open(image_path, 'rb') as image_file:
        files = {'image': image_file}
        
        response = requests.post(
            'http://38.54.20.121/api/identify',
            files=files
        )
        
        result = response.json()
        
        if result['success']:
            match = result['match']
            print(f"✅ Match: {match['full_name']}")
            print(f"Discord: @{match['discord_username']}")
            print(f"Confidence: {match['confidence']}")
            print(f"Similarity: {match['cosine_similarity']:.2%}")
            return match
        else:
            print(f"❌ Error: {result['error']}")
            return None

# Usage
match = identify_face_with_file('photo.jpg')
```

### cURL Example
```bash
curl -X POST http://38.54.20.121/api/identify \
  -F "image=@/path/to/photo.jpg"
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "match": {
    "id": "5ac54b63-e6cd-4510-be46-e7d1ef0cec69",
    "full_name": "Agustín Arévalo",
    "discord_username": "HechoEnChile",
    "photo_path": "https://l1cty5yj80.ufs.sh/f/tnqDMx4f3sdolAq6LPFBaZQTq3N1SbVeHyjv7D9Y4zEWGgLX",
    "linkedin_content": "Nombre: Agustín Arévalo\nHeadline: Estudiante de Física UC...",
    "created_at": "2025-11-22T18:01:10.460188+00:00",
    "cosine_similarity": 0.754322545835123,
    "confidence": "Medium",
    "is_match": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "No face detected in the image"
}
```

**Possible Errors:**
- `"No image provided in request body"` - Missing image in request
- `"No face detected in the image"` - No face found by DeepFace
- `"No known people found in database"` - Empty database
- `"Invalid image format"` - Corrupted or unsupported image

---

## Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the identification was successful |
| `match.id` | string | Unique UUID of the person in database |
| `match.full_name` | string | Full name of the identified person |
| `match.discord_username` | string | Discord username |
| `match.photo_path` | string | URL to the person's photo |
| `match.linkedin_content` | string | Full LinkedIn profile information |
| `match.created_at` | string | ISO 8601 timestamp when record was created |
| `match.cosine_similarity` | float | Similarity score (0-1, higher is better) |
| `match.confidence` | string | "High" (>0.8), "Medium" (>0.7), or "Low" (≤0.7) |
| `match.is_match` | boolean | True if similarity > 0.7 threshold |

---

## Best Practices

### Image Quality
- **Recommended**: Clear, front-facing photos with good lighting
- **Image size**: Any size (API handles resizing), but keep under 10MB
- **Format**: JPEG, PNG, WebP, BMP supported
- **Resolution**: 640x480 minimum recommended for best accuracy

### Performance
- **First request**: 5-10 seconds (model loading)
- **Subsequent requests**: 2-5 seconds per image
- **Timeout**: 120 seconds max

### Error Handling
```javascript
async function robustIdentification(imageData) {
  try {
    const response = await fetch('http://38.54.20.121/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      // Handle API-level errors
      if (result.error.includes('No face detected')) {
        return { error: 'NO_FACE', message: 'Please use a clear photo with a visible face' };
      } else if (result.error.includes('No known people')) {
        return { error: 'EMPTY_DB', message: 'No people in database yet' };
      } else {
        return { error: 'API_ERROR', message: result.error };
      }
    }
    
    // Success - check confidence
    if (result.match.confidence === 'Low') {
      return { 
        warning: 'LOW_CONFIDENCE',
        match: result.match,
        message: 'Match found but with low confidence'
      };
    }
    
    return { match: result.match };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'TIMEOUT', message: 'Request took too long' };
    }
    return { error: 'NETWORK', message: error.message };
  }
}
```

### Rate Limiting
Currently no rate limiting, but consider:
- Batching requests if processing multiple images
- Caching results if identifying the same person repeatedly
- Implementing retry logic with exponential backoff

---

## Complete Working Example (React + TypeScript)

```typescript
import React, { useState } from 'react';

interface IdentificationResult {
  id: string;
  full_name: string;
  discord_username: string;
  photo_path: string;
  linkedin_content: string;
  created_at: string;
  cosine_similarity: number;
  confidence: 'High' | 'Medium' | 'Low';
  is_match: boolean;
}

interface ApiResponse {
  success: boolean;
  match?: IdentificationResult;
  error?: string;
}

export default function FaceIdentifier() {
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch('http://38.54.20.121/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image })
        });

        const data: ApiResponse = await response.json();

        if (data.success && data.match) {
          setResult(data.match);
        } else {
          setError(data.error || 'Unknown error occurred');
        }
        
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="face-identifier">
      <h2>Face Recognition</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={loading}
      />

      {loading && <p>🔍 Identifying face...</p>}

      {error && (
        <div className="error">
          <p>❌ Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="result">
          <h3>✅ Match Found!</h3>
          <p><strong>Name:</strong> {result.full_name}</p>
          <p><strong>Discord:</strong> @{result.discord_username}</p>
          <p><strong>Confidence:</strong> {result.confidence} ({(result.cosine_similarity * 100).toFixed(1)}%)</p>
          <img src={result.photo_path} alt={result.full_name} style={{ width: 200 }} />
        </div>
      )}
    </div>
  );
}
```

---

## Testing the API

### Quick Test with cURL
```bash
# Download test image
wget -O test.jpg "https://l1cty5yj80.ufs.sh/f/tnqDMx4f3sdolAq6LPFBaZQTq3N1SbVeHyjv7D9Y4zEWGgLX"

# Test with file upload
curl -X POST http://38.54.20.121/api/identify -F "image=@test.jpg"
```

### Health Check
```bash
curl http://38.54.20.121/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "face-recognition-service"
}
```
