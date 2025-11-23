import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// URL del api_server.py local para calcular embeddings (DeepFace es Python)
const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:8000';

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

// Función para promediar múltiples embeddings
function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return embeddings[0];

  const length = embeddings[0].length;
  const averaged = new Array(length).fill(0);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const embedding of embeddings) {
      sum += embedding[i];
    }
    averaged[i] = sum / embeddings.length;
  }

  return averaged;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, images, threshold = 1.0 } = body; // Umbral por defecto 1.0 para embeddings de 512 dimensiones

    // Soporte para imagen única (backward compatibility) o múltiples imágenes
    const imagesToProcess: string[] = images && Array.isArray(images) ? images : (image ? [image] : []);

    if (imagesToProcess.length === 0) {
      return NextResponse.json(
        { 
          error: 'No image(s) provided',
          match_found: false,
          person_name: null,
          distance: null,
          method: 'deepface_512',
          threshold: 1.0,
          message: 'Please provide image or images array as base64 string(s) in the request body'
        },
        { status: 400 }
      );
    }

    console.log(`[DeepFace 512] Processing ${imagesToProcess.length} image(s)...`);

    // Paso 1: Calcular embeddings de 512 dimensiones para cada imagen usando api_server.py local
    const embeddings: number[][] = [];
    
    for (let i = 0; i < imagesToProcess.length; i++) {
      const img = imagesToProcess[i];
      if (typeof img !== 'string') {
        console.warn(`[DeepFace 512] Skipping invalid image at index ${i}`);
        continue;
      }

      try {
        // Convertir imagen base64 a FormData para enviar al api_server
        const formData = new FormData();
        
        // Convertir base64 a blob
        const base64Data = img.includes(',') ? img.split(',')[1] : img;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        formData.append('file', blob, `face_${i}.jpg`);

        // Llamar al api_server.py para calcular el embedding
        const apiResponse = await fetch(`${API_SERVER_URL}/calculate-embedding`, {
          method: 'POST',
          body: formData,
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`[DeepFace 512] Error calculating embedding for image ${i}: ${apiResponse.status} - ${errorText}`);
          continue;
        }

        const apiResult = await apiResponse.json();
        if (apiResult.embedding && Array.isArray(apiResult.embedding)) {
          embeddings.push(apiResult.embedding);
          console.log(`[DeepFace 512] Embedding ${i + 1}/${imagesToProcess.length} calculated: ${apiResult.embedding.length} dimensions`);
        }
      } catch (error) {
        console.error(`[DeepFace 512] Error calculating embedding for image ${i}:`, error);
        continue;
      }
    }

    if (embeddings.length === 0) {
      return NextResponse.json(
        {
          error: 'Error calculating embeddings',
          match_found: false,
          person_name: null,
          distance: null,
          method: 'deepface_512',
          threshold,
          message: 'No se pudieron calcular embeddings válidos. Asegúrate de que api_server.py esté corriendo en ' + API_SERVER_URL
        },
        { status: 500 }
      );
    }

    // Paso 2: Promediar los embeddings capturados
    const faceDescriptor = averageEmbeddings(embeddings);
    console.log(`[DeepFace 512] Averaged embedding calculated from ${embeddings.length} image(s): ${faceDescriptor.length} dimensions`);

    // Paso 2: Obtener embeddings de 512 dimensiones desde Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgvntpcrofqtmuktrqjs.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      return NextResponse.json(
        {
          error: 'Supabase key not configured',
          match_found: false,
          person_name: null,
          distance: null,
          method: 'deepface_512',
          threshold,
          message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada'
        },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener todas las personas conocidas con embedding de 512 dimensiones
    const { data: knownPeople, error } = await supabase
      .from('known_people')
      .select('id, full_name, face_encoding, face_encoding_deepface_512, linkedin_content, discord_username, photo_path')
      .or('face_encoding.not.is.null,face_encoding_deepface_512.not.is.null');

    if (error) {
      console.error('[DeepFace 512] Supabase error:', error);
      return NextResponse.json(
        {
          error: 'Database error',
          match_found: false,
          person_name: null,
          distance: null,
          method: 'deepface_512',
          threshold,
          message: `Error al consultar la base de datos: ${error.message}`
        },
        { status: 500 }
      );
    }

    if (!knownPeople || knownPeople.length === 0) {
      console.log('[DeepFace 512] No profiles with 512-dim embeddings found');
      return NextResponse.json({
        match_found: false,
        person_name: null,
        distance: null,
        method: 'deepface_512',
        threshold,
        message: 'No hay perfiles con embeddings de 512 dimensiones en la base de datos'
      });
    }

    console.log(`[DeepFace 512] Comparing with ${knownPeople.length} profiles`);

    // Paso 3: Calcular distancias a todos los perfiles
    const candidates: Array<{
      distance: number;
      person: any;
    }> = [];

    for (const person of knownPeople) {
      try {
        // Priorizar face_encoding_deepface_512, sino usar face_encoding
        const dbEmbedding = person.face_encoding_deepface_512 || person.face_encoding;
        
        if (!dbEmbedding || !Array.isArray(dbEmbedding)) {
          continue;
        }

        // Validar dimensiones
        if (dbEmbedding.length !== faceDescriptor.length) {
          console.warn(`[DeepFace 512] Dimension mismatch for ${person.full_name}: DB=${dbEmbedding.length}, Target=${faceDescriptor.length}`);
          continue;
        }

        const distance = calculateEuclideanDistance(faceDescriptor, dbEmbedding);
        candidates.push({ distance, person });
      } catch (error) {
        console.error(`[DeepFace 512] Error comparing with ${person.full_name}:`, error);
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
      // Para embeddings de 512 dimensiones, umbrales típicos:
      // < 0.6: High confidence
      // 0.6-1.0: Medium confidence
      // > 1.0: Low confidence
      if (bestMatch.distance < 0.6) {
        confidence = 'High';
      } else if (bestMatch.distance < 1.0) {
        confidence = 'Medium';
      } else {
        confidence = 'Low';
      }
    }

    if (matchFound) {
      console.log(
        `[DeepFace 512] Match found: ${bestMatch.person.full_name} (distance: ${bestMatch.distance.toFixed(4)}, confidence: ${confidence})`
      );

      return NextResponse.json({
        match_found: true,
        person_name: bestMatch.person.full_name,
        distance: bestMatch.distance,
        confidence,
        method: 'deepface_512',
        threshold,
        linkedin_content: bestMatch.person.linkedin_content,
        discord_username: bestMatch.person.discord_username,
        photo_path: bestMatch.person.photo_path,
        message: `Match encontrado: ${bestMatch.person.full_name}`,
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
        ? `No se encontró match. El más cercano fue ${bestMatch.person.full_name} con distancia ${bestMatch.distance.toFixed(4)}`
        : 'No se encontraron coincidencias';

      console.log(`[DeepFace 512] No match. ${message}`);

      return NextResponse.json({
        match_found: false,
        confidence,
        distance: bestMatch?.distance || null,
        candidates: topCandidates,
        method: 'deepface_512',
        threshold,
        message,
      });
    }
  } catch (error) {
    console.error('[DeepFace 512] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        match_found: false,
        person_name: null,
        distance: null,
        method: 'deepface_512',
        threshold: 1.0,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

