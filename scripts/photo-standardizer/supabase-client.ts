import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from './config.js';

let supabase: SupabaseClient;

export function initSupabase(config: Config) {
  supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  return supabase;
}

export async function fetchPendingJob() {
  const { data, error } = await supabase
    .from('photo_standardization_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    throw new Error(`Error fetching pending job: ${error.message}`);
  }

  return data;
}

export async function updateJobStatus(
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  updates?: {
    started_at?: string;
    completed_at?: string;
    error_message?: string | null;
    results?: any;
    flow_project_id?: string | null;
  }
) {
  const { error } = await supabase
    .from('photo_standardization_jobs')
    .update({ status, ...updates })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Error updating job status: ${error.message}`);
  }
}

export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('images, slug')
    .eq('id', productId)
    .single();

  if (error) {
    throw new Error(`Error fetching product images: ${error.message}`);
  }

  return data;
}
