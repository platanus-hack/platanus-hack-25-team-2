import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

const MODELS = [
  // SSD MobileNet V1
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        // File doesn't exist, skip it
        fs.unlinkSync(destPath);
        console.log(`⏭️  Skipping ${path.basename(destPath)} (not found on server)`);
        resolve();
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  const modelsDir = path.join(process.cwd(), 'public', 'models');
  
  // Crear directorio si no existe
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log(`✅ Created models directory: ${modelsDir}`);
  }

  console.log('📥 Downloading face-api models...\n');

  for (const modelFile of MODELS) {
    const url = `${MODEL_BASE_URL}/${modelFile}`;
    const destPath = path.join(modelsDir, modelFile);
    
    // Skip if already exists
    if (fs.existsSync(destPath)) {
      console.log(`⏭️  Skipping ${modelFile} (already exists)`);
      continue;
    }

    try {
      console.log(`⬇️  Downloading ${modelFile}...`);
      await downloadFile(url, destPath);
      if (fs.existsSync(destPath)) {
        console.log(`✅ Downloaded ${modelFile}`);
      }
    } catch (error) {
      console.error(`❌ Failed to download ${modelFile}:`, error);
      // Continue with other models
    }
  }

  console.log('\n✅ Model download process completed!');
  console.log(`Models location: ${modelsDir}`);
}

// Run download
downloadModels().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

