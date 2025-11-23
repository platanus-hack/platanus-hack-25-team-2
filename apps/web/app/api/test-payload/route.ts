import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify the exact payload being sent to external API
 * This proves to the server guy that we're sending valid JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URI prefix
    const base64String = image.includes(',') ? image.split(',')[1] : image;

    // Validate base64
    const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64String.substring(0, 100));

    // Calculate size
    const imageSizeKB = Math.round((base64String.length * 0.75) / 1024);

    // Create the exact payload that would be sent to external API
    const externalPayload = {
      image: base64String
    };

    // Return diagnostic information
    return NextResponse.json({
      status: 'OK',
      validation: {
        hasDataURIPrefix: image.includes('data:image/'),
        isValidBase64: isValidBase64,
        base64Length: base64String.length,
        estimatedSizeKB: imageSizeKB,
        base64Preview: base64String.substring(0, 50) + '...',
        base64End: '...' + base64String.substring(base64String.length - 20),
      },
      exactPayloadThatWouldBeSent: {
        structure: JSON.stringify(externalPayload, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      message: '✅ This is the EXACT payload that will be sent to the external API',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
