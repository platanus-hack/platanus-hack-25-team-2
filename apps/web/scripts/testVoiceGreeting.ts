/**
 * Test script for voice greeting generation
 * Run with: npx tsx scripts/testVoiceGreeting.ts
 */

import { generateVoiceGreeting } from '../lib/voiceGreetingService';
import * as fs from 'fs';
import * as path from 'path';

async function testVoiceGreeting() {
  console.log('🎤 Testing Voice Greeting Generation\n');

  // Test data
  const testPerson = {
    person_name: 'Juan Pérez',
    linkedin_content: 'Software Engineer passionate about AI and web development. Currently working at Tech Corp building innovative solutions.',
    discord_username: 'juan_dev',
  };

  console.log('📋 Test Person Data:');
  console.log(JSON.stringify(testPerson, null, 2));
  console.log('\n🔄 Generating voice greeting...\n');

  try {
    const result = await generateVoiceGreeting(testPerson);

    if (result.success) {
      console.log('✅ Success!');
      console.log('\n📝 Generated Text:');
      console.log(result.text);
      console.log('\n🔊 Audio Details:');
      console.log(`- Format: Base64-encoded MP3`);
      console.log(`- Size: ${result.audio?.length} characters`);
      console.log(`- Estimated audio size: ~${Math.round((result.audio?.length || 0) * 0.75 / 1024)} KB`);

      // Optionally save the audio to a file for manual testing
      if (result.audio) {
        const outputDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const audioBuffer = Buffer.from(result.audio, 'base64');
        const outputPath = path.join(outputDir, `test-greeting-${Date.now()}.mp3`);
        fs.writeFileSync(outputPath, audioBuffer);
        
        console.log(`\n💾 Audio saved to: ${outputPath}`);
        console.log('   You can play it with: open ' + outputPath);
      }
    } else {
      console.error('❌ Failed to generate greeting');
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }

  console.log('\n✨ Test completed');
}

// Run the test
testVoiceGreeting().catch(console.error);
