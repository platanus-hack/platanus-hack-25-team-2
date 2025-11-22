import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EXTERNAL_API_URL = 'http://38.54.20.121/api/identify';

interface ABTestResponse {
  match_found: boolean;
  person_name: string | null;
  distance: number | null;
  method: 'external' | 'faceapi_local' | 'external_primary';
  threshold: number;
  linkedin_content?: string | null;
  discord_username?: string | null;
  message: string;
  processing_time_ms?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<ABTestResponse>> {
  try {
    const body = await request.json();
    const { image, method = 'external' } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        {
          match_found: false,
          person_name: null,
          distance: null,
          method: 'external_primary',
          threshold: 0.6,
          message: 'Error: No image provided'
        },
        { status: 400 }
      );
    }

    console.log(`[A/B Test] Starting face recognition with method: ${method}`);
    const startTime = Date.now();

    // MÉTODO 1: Endpoint externo (default y más rápido)
    if (method === 'external' || method === 'external_primary') {
      console.log('[A/B Test] Using: EXTERNAL ENDPOINT');

      try {
        const externalResponse = await fetch(EXTERNAL_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        });

        if (!externalResponse.ok) {
          const errorText = await externalResponse.text();
          console.error('[A/B Test] External API error:', errorText);
          throw new Error(`External API error: ${externalResponse.status}`);
        }

        const externalResult = await externalResponse.json();
        const processingTime = Date.now() - startTime;

        console.log('[A/B Test] External method result:', externalResult.match?.full_name, `(${processingTime}ms)`);

        if (externalResult.match) {
          return NextResponse.json({
            match_found: true,
            person_name: externalResult.match.full_name,
            distance: 1 - (externalResult.match.cosine_similarity || 0),
            method: 'external',
            threshold: 0.6,
            linkedin_content: externalResult.match.linkedin_content,
            discord_username: externalResult.match.discord_username,
            message: `External API match: ${externalResult.match.full_name}`,
            processing_time_ms: processingTime
          });
        }
      } catch (error) {
        console.error('[A/B Test] External method failed:', error);

        if (method === 'external_primary') {
          throw error;
        }
      }
    }

    // MÉTODO 2: Fallback - retornar error si no hay match
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      match_found: false,
      person_name: null,
      distance: null,
      method: 'external',
      threshold: 0.6,
      message: 'No match found',
      processing_time_ms: processingTime
    });
  } catch (error) {
    console.error('[A/B Test] Error:', error);

    return NextResponse.json(
      {
        match_found: false,
        person_name: null,
        distance: null,
        method: 'external_primary',
        threshold: 0.6,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

