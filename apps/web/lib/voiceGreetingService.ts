import Anthropic from '@anthropic-ai/sdk';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_CLAUDE_API_KEY,
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.NEXT_ELEVENLABS_API_KEY,
});

// Rachel voice - natural, friendly female voice
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = 'eleven_flash_v2_5';

interface PersonData {
  person_name: string;
  linkedin_content?: string;
  discord_username?: string;
}

interface VoiceGreetingResult {
  success: boolean;
  audio?: string;
  text?: string;
  error?: string;
}

/**
 * Generate a personalized text greeting using Claude AI
 */
async function generateGreetingText(personData: PersonData): Promise<string> {
  const { person_name, linkedin_content } = personData;

  // Build the prompt with available information
  let prompt = `Tienes información sobre esta persona:\nNombre: ${person_name}`;

  if (linkedin_content) {
    prompt += `\nLinkedIn: ${linkedin_content}`;
  }

  prompt += '\n\n¿Quién es esta persona? Resúmelo en una sola oración de forma amigable, conversacional y breve. Solo responde con texto natural.';

  console.log('[VoiceGreeting] Generating text with Claude...');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text from the response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const greetingText = textContent.text;
  console.log('[VoiceGreeting] Generated text:', greetingText);

  return greetingText;
}

/**
 * Convert text to speech using ElevenLabs
 */
async function convertTextToSpeech(text: string): Promise<string> {
  console.log('[VoiceGreeting] Converting text to speech with ElevenLabs...');

  const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
    text,
    modelId: MODEL_ID,
    languageCode: 'es',
    outputFormat: 'mp3_22050_32',
    voiceSettings: {
      speed: 1.2
    }
  });

  // Convert ReadableStream to Buffer
  const chunks: Uint8Array[] = [];
  const reader = audioStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Concatenate all chunks
  const audioBuffer = Buffer.concat(chunks);

  // Convert to base64
  const base64Audio = audioBuffer.toString('base64');

  console.log('[VoiceGreeting] Audio generated successfully');

  return base64Audio;
}

/**
 * Generate a complete voice greeting for a person
 */
export async function generateVoiceGreeting(
  personData: PersonData
): Promise<VoiceGreetingResult> {
  try {
    // Step 1: Generate greeting text with Claude
    const greetingText = await generateGreetingText(personData);

    // Step 2: Convert text to speech with ElevenLabs
    const base64Audio = await convertTextToSpeech(greetingText);

    return {
      success: true,
      audio: base64Audio,
      text: greetingText,
    };
  } catch (error) {
    console.error('[VoiceGreeting] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
