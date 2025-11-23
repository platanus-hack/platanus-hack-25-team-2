import { NextRequest, NextResponse } from 'next/server';
import { generateVoiceGreeting } from '@/lib/voiceGreetingService';

export const dynamic = 'force-dynamic';

// In-memory set to track which persons have already received greetings
// REMOVED: We now rely on client-side state (session based) to track this.
// The server should essentially be stateless regarding who was greeted.
// const greetedPersons = new Set<string>();

interface RequestBody {
  person_id: string;
  person_name: string;
  linkedin_content?: string;
  discord_username?: string;
  label?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { person_id, person_name, linkedin_content, discord_username, label } = body;

    // Validate required fields
    if (!person_id || !person_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: person_id and person_name',
        },
        { status: 400 }
      );
    }

    // Check if this person has already been greeted
    // REMOVED SERVER-SIDE CHECK: We trust the client to manage session state.
    // If the client requests a greeting, it means a new session started or it's a new person.
    /* 
    if (greetedPersons.has(person_id)) {
      console.log(`[VoiceGreeting] Person ${person_name} (${person_id}) already greeted. Skipping.`);
      return NextResponse.json({
        success: false,
        error: 'Person already greeted in this session',
        person_id,
      });
    }
    */

    console.log(`[VoiceGreeting] Generating greeting for ${person_name} (${person_id})...`);

    // Generate the voice greeting
    const result = await generateVoiceGreeting({
      person_name,
      linkedin_content,
      discord_username,
      label,
    });

    if (!result.success) {
      // Silent failure - log but don't crash
      console.error('[VoiceGreeting] Failed to generate greeting:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        person_id,
      });
    }

    // Mark this person as greeted
    // greetedPersons.add(person_id);
    console.log(`[VoiceGreeting] Successfully generated greeting for ${person_name}`);

    // Return the audio and text
    return NextResponse.json({
      success: true,
      audio: result.audio,
      text: result.text,
      person_id,
    });
  } catch (error) {
    console.error('[VoiceGreeting] Unexpected error:', error);

    // Silent failure - return error but don't crash
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: Endpoint to reset the greeted persons set (useful for testing)
export async function DELETE() {
  // greetedPersons.clear();
  console.log('[VoiceGreeting] Cleared greeted persons set (noop)');
  return NextResponse.json({
    success: true,
    message: 'Greeted persons set cleared',
  });
}

// Optional: Endpoint to check if a person has been greeted
export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get('person_id');
  
  if (!personId) {
    return NextResponse.json(
      { error: 'Missing person_id parameter' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    person_id: personId,
    has_been_greeted: false, // greetedPersons.has(personId),
  });
}
