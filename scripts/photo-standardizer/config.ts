import fs from 'node:fs';
import path from 'node:path';

export interface Config {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  pollIntervalSeconds: number;
  tempDir: string;
}

export function loadConfig(): Config {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  const pollIntervalSeconds = parseInt(process.env.POLL_INTERVAL_SECONDS || '10', 10);
  const tempDir = process.env.TEMP_DIR || './temp';

  const missing: string[] = [];

  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!cloudinaryCloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!cloudinaryApiKey) missing.push('CLOUDINARY_API_KEY');
  if (!cloudinaryApiSecret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Ensure temp dir exists
  const resolvedTempDir = path.resolve(tempDir);
  if (!fs.existsSync(resolvedTempDir)) {
    fs.mkdirSync(resolvedTempDir, { recursive: true });
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
    cloudinaryCloudName: cloudinaryCloudName!,
    cloudinaryApiKey: cloudinaryApiKey!,
    cloudinaryApiSecret: cloudinaryApiSecret!,
    pollIntervalSeconds,
    tempDir: resolvedTempDir,
  };
}
