import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ggycziwlmgcttkmgshmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneWN6aXdsbWdjdHRrbWdzaG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDA5NDEsImV4cCI6MjA5NDA3Njk0MX0.nnlwQfphENl-gOEcY64nBn7MeYAYQXhrFdp60HCpeYE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseShelter {
  shelter_id: number;
  shelter_type: 'official' | 'household';

  shelter_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  num_members?: number | null;

  address: string | null;
  capacity: number;
  current_occupancy: number;
  status?: 'Available' | 'Near Full' | 'Full' | null;

  evacuated_to_shelter_id?: number | null;

  created_at?: string | null;
  updated_at?: string | null;

  last_updated_timestamp: string | null;
}