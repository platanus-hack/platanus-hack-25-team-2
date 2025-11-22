import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zgvntpcrofqtmuktrqjs.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpndm50cGNyb2ZxdG11a3RycWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODAwODgsImV4cCI6MjA3OTM1NjA4OH0.EqWHH-K3358RN5YDpAgB1oprDzf6yZzzhoTg2e6YodA";

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface KnownPerson {
  id?: string;
  full_name: string;
  face_encoding: number[];
  linkedin_content?: string;
  discord_username?: string;
  created_at?: string;
}

export async function getAllKnownPeople(): Promise<KnownPerson[]> {
  const { data, error } = await supabase
    .from('known_people')
    .select('full_name, face_encoding, linkedin_content, discord_username');

  if (error) {
    throw new Error(`Error fetching from Supabase: ${error.message}`);
  }

  return data || [];
}

