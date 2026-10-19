import fs from 'node:fs';
import crypto from 'node:crypto';
import { Config } from './config.js';

export async function uploadToCloudinary(
  localFilePath: string,
  publicId: string,
  config: Config
): Promise<{ public_id: string; secure_url: string }> {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  
  const signature = crypto
    .createHash('sha1')
    .update(`${paramsToSign}${config.cloudinaryApiSecret}`)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(localFilePath)]));
  formData.append('public_id', publicId);
  formData.append('api_key', config.cloudinaryApiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
  };
}
