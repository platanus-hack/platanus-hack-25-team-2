import { NextRequest, NextResponse } from 'next/server';
import { getAllKnownPeople } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Función para calcular distancia euclidiana
function calculateEuclideanDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { face_descriptor, threshold = 0.6 } = body;

    if (!face_descriptor || !Array.isArray(face_descriptor)) {
      return NextResponse.json(
        { error: 'No face descriptor provided', message: 'Please provide face_descriptor array in the request body' },
        { status: 400 }
      );
    }

    console.log(`Processing face descriptor (${face_descriptor.length} dimensions)`);

    // Obtener personas conocidas de Supabase
    const knownPeople = await getAllKnownPeople();
    
    if (knownPeople.length === 0) {
      return NextResponse.json({
        match_found: false,
        threshold,
        message: 'La base de datos está vacía'
      });
    }

    console.log(`Comparing with ${knownPeople.length} known people...`);

    // Encontrar el mejor match
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    let matchDetails: any = null;

    for (const person of knownPeople) {
      try {
        const distance = calculateEuclideanDistance(face_descriptor, person.face_encoding);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = person.full_name;
          matchDetails = person;
        }
      } catch (error) {
        console.error(`Error comparing with ${person.full_name}:`, error);
        continue;
      }
    }

    const matchFound = bestDistance < threshold;

    if (matchFound && matchDetails) {
      return NextResponse.json({
        match_found: true,
        person_name: bestMatch,
        distance: bestDistance,
        threshold,
        linkedin_content: matchDetails.linkedin_content,
        discord_username: matchDetails.discord_username,
        message: `Match encontrado: ${bestMatch}`
      });
    } else {
      return NextResponse.json({
        match_found: false,
        person_name: bestMatch,
        distance: bestMatch ? bestDistance : null,
        threshold,
        message: bestMatch 
          ? `No se encontró match. El más cercano fue ${bestMatch} con distancia ${bestDistance.toFixed(4)}`
          : 'No se encontraron coincidencias'
      });
    }
  } catch (error) {
    console.error('Error in /api/match:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

