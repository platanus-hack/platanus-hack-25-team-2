// Track if audio is currently playing
let currentAudio: HTMLAudioElement | null = null;
let audioEndTime: number = 0;

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && Date.now() < audioEndTime;
}

/**
 * Get remaining audio playback time in milliseconds
 */
export function getAudioRemainingTime(): number {
  if (!isAudioPlaying()) return 0;
  return Math.max(0, audioEndTime - Date.now());
}

/**
 * Play a voice greeting from base64-encoded audio data
 * @param base64Audio - Base64-encoded MP3 audio data
 * @param delayMs - Optional delay before playing (default: 500ms for natural feel)
 * @returns Promise that resolves when audio finishes playing
 */
export async function playVoiceGreeting(
  base64Audio: string,
  delayMs: number = 500
): Promise<void> {
  try {
    // Check if audio is already playing
    if (isAudioPlaying()) {
      const remaining = getAudioRemainingTime();
      console.warn(
        `[AudioPlayer] Audio already playing. ${Math.ceil(remaining / 1000)}s remaining. Skipping new audio.`
      );
      throw new Error('Audio already playing');
    }

    // Add a small delay for natural feel
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Create audio element from base64 data
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);

    // Optional: Set volume (0.0 to 1.0)
    audio.volume = 0.8;

    // Store reference to current audio
    currentAudio = audio;

    // Estimate duration based on base64 size (rough approximation)
    // MP3 at 32kbps ≈ 4KB per second, base64 adds ~33% overhead
    const audioSizeBytes = (base64Audio.length * 3) / 4;
    const estimatedDurationMs = (audioSizeBytes / 4096) * 1000;
    
    // Add buffer time to be safe
    const durationWithBuffer = estimatedDurationMs + 1000;
    audioEndTime = Date.now() + durationWithBuffer;

    console.log(`[AudioPlayer] Playing audio (estimated ${Math.ceil(estimatedDurationMs / 1000)}s)`);

    // Set up event listeners
    audio.addEventListener('ended', () => {
      console.log('[AudioPlayer] Audio playback finished');
      currentAudio = null;
      audioEndTime = 0;
    });

    audio.addEventListener('error', () => {
      console.error('[AudioPlayer] Audio playback error');
      currentAudio = null;
      audioEndTime = 0;
    });

    // Play the audio
    await audio.play();

    console.log('[AudioPlayer] Voice greeting started successfully');
  } catch (error) {
    // Clean up on error
    currentAudio = null;
    audioEndTime = 0;

    // Handle autoplay restrictions or other errors
    console.error('[AudioPlayer] Error playing audio:', error);
    
    // In some browsers, autoplay is restricted until user interaction
    if (error instanceof Error && error.name === 'NotAllowedError') {
      console.warn(
        '[AudioPlayer] Autoplay blocked. User interaction required to play audio.'
      );
    }

    throw error;
  }
}

/**
 * Fetch and play a voice greeting for a detected person
 * @param personData - Data about the detected person
 */
export async function fetchAndPlayGreeting(personData: {
  person_id: string;
  person_name: string;
  linkedin_content?: string;
  discord_username?: string;
}): Promise<void> {
  try {
    // Check if audio is already playing before making the API call
    if (isAudioPlaying()) {
      const remaining = getAudioRemainingTime();
      console.log(
        `[AudioPlayer] ⏸️ Skipping greeting for ${personData.person_name} - audio already playing (${Math.ceil(remaining / 1000)}s remaining)`
      );
      return;
    }

    console.log(`[AudioPlayer] 🎤 Fetching greeting for ${personData.person_name}...`);

    const response = await fetch('/api/generate-voice-greeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personData),
    });

    const result = await response.json();

    if (result.success && result.audio) {
      console.log('[AudioPlayer] 📝 Greeting text:', result.text);
      await playVoiceGreeting(result.audio);
    } else {
      console.log('[AudioPlayer] ❌ No greeting generated:', result.error || 'Unknown reason');
    }
  } catch (error) {
    console.error('[AudioPlayer] ❌ Error fetching greeting:', error);
    // Silent failure - don't block the main flow
  }
}
