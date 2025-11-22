import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EXTERNAL_API_URL = 'http://38.54.20.121/api/identify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, method = 'external' } = body; // 'external' | 'faceapi_local' | 'both'

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'No image provided', message: 'Please provide image as base64 string in the request body' },
        { status: 400 }
      );
    }

    console.log('Sending image to external API for face recognition...');

    // Hacer POST al endpoint externo
    const response = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: image, // Base64 con prefijo data:image/jpeg;base64,
      }),
    });
        
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        {
          error: 'External API error',
          message: `External API returned status ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Match result from external API:', JSON.stringify(result, null, 2));

    // Retornar la respuesta completa del endpoint externo
    // Esto incluye todos los campos del perfil que vengan en result.match
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/match:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

