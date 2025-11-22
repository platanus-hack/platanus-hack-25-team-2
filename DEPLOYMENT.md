# Face Recognition Service - Deployment Guide

## Service Information

**Status**: ✅ Deployed and Running  
**URL**: `http://38.54.20.121`  
**Health Check**: `http://38.54.20.121/health`  
**API Endpoint**: `http://38.54.20.121/api/identify`

## Deployment Details

### System Service
- **Service Name**: `face-recognition.service`
- **Status**: Active and enabled (starts on boot)
- **Workers**: 2 Gunicorn workers
- **Timeout**: 120 seconds (for face processing)
- **Logs**:
  - Access: `/root/face-recognition-service/logs/access.log`
  - Error: `/root/face-recognition-service/logs/error.log`

### Nginx Configuration
- **Port**: 80 (HTTP)
- **Server Name**: 38.54.20.121 (IP-based access)
- **Max Upload Size**: 10MB
- **Endpoints Proxied**:
  - `/api/identify` → Face recognition endpoint
  - `/health` → Health check endpoint

### Database
- **Service**: Supabase
- **Table**: `known_people`
- **URL**: `https://zgvntpcrofqtmuktrqjs.supabase.co`

## Service Management Commands

### Check Service Status
```bash
systemctl status face-recognition.service
```

### Start/Stop/Restart Service
```bash
systemctl start face-recognition.service
systemctl stop face-recognition.service
systemctl restart face-recognition.service
```

### View Logs
```bash
# Real-time error logs
tail -f /root/face-recognition-service/logs/error.log

# Real-time access logs
tail -f /root/face-recognition-service/logs/access.log

# Systemd logs
journalctl -u face-recognition.service -f
```

### Reload Nginx (after config changes)
```bash
nginx -t  # Test configuration
systemctl reload nginx
```

## API Usage

### Health Check
```bash
curl http://38.54.20.121/health
```

Response:
```json
{
  "status": "healthy",
  "service": "face-recognition-service"
}
```

### Face Identification

#### Method 1: Base64 Image (JSON)
```bash
curl -X POST http://38.54.20.121/api/identify \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

#### Method 2: File Upload (Multipart)
```bash
curl -X POST http://38.54.20.121/api/identify \
  -F "image=@/path/to/image.jpg"
```

#### Success Response
```json
{
  "success": true,
  "match": {
    "username": "HechoEnChile",
    "name": "Agustín Arévalo",
    "headline": "Estudiante de Física UC...",
    "location": "Chile",
    "profile_image_url": "https://...",
    "linkedin_url": "https://linkedin.com/in/...",
    "about": null,
    "experience": [...],
    "education": [...],
    "skills": [],
    "cosine_similarity": 0.85,
    "confidence": "High",
    "is_match": true
  }
}
```

#### Error Responses
```json
{
  "success": false,
  "error": "No face detected in the image"
}
```

## Python Integration Example

```python
import requests
import base64

# Using base64
with open('photo.jpg', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')

response = requests.post(
    'http://38.54.20.121/api/identify',
    json={'image': image_b64}
)

result = response.json()
if result['success']:
    match = result['match']
    print(f"Match: {match['name']} ({match['confidence']} confidence)")
    print(f"Similarity: {match['cosine_similarity']:.2f}")
else:
    print(f"Error: {result['error']}")

# Using file upload
with open('photo.jpg', 'rb') as f:
    response = requests.post(
        'http://38.54.20.121/api/identify',
        files={'image': f}
    )
print(response.json())
```

## JavaScript Integration Example

```javascript
// Using base64
const imageBase64 = '...'; // Your base64 string

fetch('http://38.54.20.121/api/identify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ image: imageBase64 })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Match:', data.match.name);
    console.log('Confidence:', data.match.confidence);
  } else {
    console.error('Error:', data.error);
  }
});

// Using FormData (file upload)
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://38.54.20.121/api/identify', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs for errors
journalctl -u face-recognition.service -n 50

# Check if port 5000 is in use
netstat -tulpn | grep 5000

# Restart service
systemctl restart face-recognition.service
```

### Nginx Returns 502 Bad Gateway
```bash
# Check if Flask app is running
curl http://127.0.0.1:5000/health

# Check nginx error logs
tail -f /var/log/nginx/error.log

# Restart both services
systemctl restart face-recognition.service
systemctl reload nginx
```

### Slow Response Times
- First request after restart will be slow (DeepFace model loading)
- Face detection and embedding generation takes 2-5 seconds
- Consider increasing `timeout` in systemd service if needed

### High Memory Usage
- Each worker loads TensorFlow (~500MB per worker)
- Consider reducing workers if memory is limited
- Edit `/etc/systemd/system/face-recognition.service`
- Change `--workers 2` to `--workers 1`
- Run: `systemctl daemon-reload && systemctl restart face-recognition.service`

## Performance Notes

- **First Request**: 5-10 seconds (model loading)
- **Subsequent Requests**: 2-5 seconds (face processing)
- **Memory Usage**: ~1GB for 2 workers
- **CPU**: Uses all available CPU cores for face detection
- **Recommended**: At least 2GB RAM, 2 CPU cores

## Security Recommendations

1. **Add HTTPS**: Set up SSL certificate with Let's Encrypt
2. **Add Authentication**: Implement API key or OAuth
3. **Rate Limiting**: Add nginx rate limiting to prevent abuse
4. **Firewall**: Ensure only necessary ports are open
5. **Logs**: Regularly rotate and monitor logs for suspicious activity

## Maintenance

### Update Dependencies
```bash
cd /root/face-recognition-service
pip3 install --upgrade deepface tensorflow supabase
systemctl restart face-recognition.service
```

### Backup Configuration
```bash
cp /etc/systemd/system/face-recognition.service ~/backup/
cp /etc/nginx/sites-available/face-recognition ~/backup/
```

### Monitor Disk Space
```bash
du -sh /root/face-recognition-service/logs/
# Rotate logs if too large
truncate -s 0 /root/face-recognition-service/logs/*.log
```
