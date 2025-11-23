import { NextRequest, NextResponse } from 'next/server';

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
        { 
          error: 'No face descriptor provided',
          match_found: false,
          person_name: null,
          distance: null,
          method: 'faceapi',
          threshold: 0.6,
          message: 'Please provide face_descriptor array in the request body'
        },
        { status: 400 }
      );
    }

    console.log(`[Face-API Local] Processing descriptor (${face_descriptor.length} dimensions)`);

    // Importar Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgvntpcrofqtmuktrqjs.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey || '');

    // Obtener todas las personas conocidas con embedding de face-api
    const { data: knownPeople, error } = await supabase
      .from('known_people')
      .select('id, full_name, face_encoding_faceapi, linkedin_content, discord_username')
      .not('face_encoding_faceapi', 'is', null);

    if (error || !knownPeople || knownPeople.length === 0) {
      console.log('[Face-API] No profiles with face-api embeddings found');
      return NextResponse.json({
        match_found: false,
        person_name: null,
        distance: null,
        method: 'faceapi',
        threshold,
        message: 'No profiles with local embeddings available'
      });
    }

    console.log(`[Face-API] Comparing with ${knownPeople.length} profiles`);

    // Calcular distancias a todos los perfiles
    const candidates: Array<{
      distance: number;
      person: any;
    }> = [];

    for (const person of knownPeople) {
      try {
        const distance = calculateEuclideanDistance(
          face_descriptor,
          person.face_encoding_faceapi
        );
        candidates.push({ distance, person });
      } catch (error) {
        console.error(`Error comparing with ${person.full_name}:`, error);
        continue;
      }
    }

    // Ordenar por distancia (menor es mejor)
    candidates.sort((a, b) => a.distance - b.distance);

    const bestMatch = candidates[0];
    const matchFound = bestMatch && bestMatch.distance < threshold;

    // Determinar nivel de confianza basado en distancia
    let confidence = 'Low';
    if (bestMatch) {
      // Distancia 0 = match perfecto, distancia > 0.6 = no match
      const normalizedDistance = Math.min(1, Math.max(0, bestMatch.distance));
      if (normalizedDistance < 0.3) {
        confidence = 'High';
      } else if (normalizedDistance < 0.5) {
        confidence = 'Medium';
      } else {
        confidence = 'Low';
      }
    }

    if (matchFound) {
      console.log(
        `[Face-API] Match found: ${bestMatch.person.full_name} (distance: ${bestMatch.distance.toFixed(4)}, confidence: ${confidence})`
      );

      return NextResponse.json({
        match_found: true,
        person_name: bestMatch.person.full_name,
        distance: bestMatch.distance,
        confidence,
        method: 'faceapi',
        threshold,
        linkedin_content: bestMatch.person.linkedin_content,
        discord_username: bestMatch.person.discord_username,
        photo_path: bestMatch.person.photo_path,
        message: `Match encontrado (Face-API): ${bestMatch.person.full_name}`,
      });
    } else {
      // Devolver top 3 candidatos incluso si no hay match
      const topCandidates = candidates.slice(0, 3).map((candidate) => ({
        person_name: candidate.person.full_name,
        distance: candidate.distance,
        linkedin_content: candidate.person.linkedin_content,
        discord_username: candidate.person.discord_username,
        photo_path: candidate.person.photo_path,
      }));

      const message = bestMatch
        ? `No confidence match. Top candidate: ${bestMatch.person.full_name} (distance: ${bestMatch.distance.toFixed(
            4
          )})`
        : 'No matches found';

      console.log(`[Face-API] No match. ${message}`);

      return NextResponse.json({
        match_found: false,
        confidence,
        distance: bestMatch?.distance || null,
        candidates: topCandidates,
        method: 'faceapi',
        threshold,
        message,
      });
    }
  } catch (error) {
    console.error('[Face-API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        match_found: false,
        person_name: null,
        distance: null,
        method: 'faceapi',
        threshold: 0.6,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

