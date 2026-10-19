/**
 * Direct Cloudinary REST API Server-Side Uploader
 * 
 * Uploads base64 or buffer images directly to Cloudinary using standard
 * Web APIs (fetch, FormData, Web Crypto).
 * 
 * Designed specifically for Next.js Server Actions and Cloudflare Workers Edge
 * runtime without requiring heavy Node-only SDK packages.
 * 
 * @module cloudinary/server-upload
 */

export interface CloudinaryUploadOptions {
  /** Target Cloudinary folder (defaults to 'products/standardized') */
  folder?: string;
  /** Custom public ID for the uploaded asset */
  publicId?: string;
  /** Descriptive tags for catalog organization */
  tags?: string[];
  /** Cloudinary Cloud Name (falls back to process.env) */
  cloudName?: string;
  /** Cloudinary API Key for signed uploads */
  apiKey?: string;
  /** Cloudinary API Secret for signed uploads */
  apiSecret?: string;
  /** Cloudinary Unsigned Upload Preset (falls back to 'GlakTienda') */
  uploadPreset?: string;
}

export interface CloudinaryUploadResult {
  /** Cloudinary Public ID */
  public_id: string;
  /** Cloudinary HTTPS URL */
  secure_url: string;
  /** Image pixel width */
  width?: number;
  /** Image pixel height */
  height?: number;
  /** Stored image format (e.g. 'jpg', 'webp') */
  format?: string;
}

/**
 * Computes SHA-1 hex digest using standard Web Crypto API with Node.js fallback.
 */
async function computeSha1(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha1').update(data).digest('hex');
}

/**
 * Uploads a base64 image directly to Cloudinary via REST API.
 * Supports signed authentication if API key and secret are present,
 * otherwise gracefully falls back to unsigned preset uploads.
 * 
 * @param base64Data - Raw base64 string or data URI
 * @param mimeType - Image mime type (default: 'image/jpeg')
 * @param options - Upload customization options
 * @returns CloudinaryUploadResult with public_id and secure_url
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  mimeType: string = 'image/jpeg',
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const cloudName =
    options.cloudName ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "dpm4judv4";

  const apiKey = options.apiKey || process.env.CLOUDINARY_API_KEY;
  const apiSecret = options.apiSecret || process.env.CLOUDINARY_API_SECRET;
  const uploadPreset =
    options.uploadPreset ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    "GlakTienda";

  const dataUri = base64Data.startsWith('data:')
    ? base64Data
    : `data:${mimeType};base64,${base64Data}`;

  const formData = new FormData();
  formData.append('file', dataUri);

  const folder = options.folder ?? 'products/standardized';
  const publicId = options.publicId;

  if (apiKey && apiSecret) {
    // Signed upload: sign parameters (alphabetically sorted, concatenated with secret)
    const timestamp = Math.round(Date.now() / 1000).toString();
    const signParams: Record<string, string> = { timestamp };

    if (folder) {
      signParams.folder = folder;
      formData.append('folder', folder);
    }
    if (publicId) {
      signParams.public_id = publicId;
      formData.append('public_id', publicId);
    }
    if (options.tags && options.tags.length > 0) {
      const tagsStr = options.tags.join(',');
      signParams.tags = tagsStr;
      formData.append('tags', tagsStr);
    }

    const sortedQuery = Object.keys(signParams)
      .sort()
      .map((k) => `${k}=${signParams[k]}`)
      .join('&');

    const signature = await computeSha1(`${sortedQuery}${apiSecret}`);

    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
  } else {
    // Unsigned upload fallback using preset
    formData.append('upload_preset', uploadPreset);
    if (folder) formData.append('folder', folder);
    if (publicId) formData.append('public_id', publicId);
    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status} ${response.statusText}): ${errText}`);
  }

  const json = await response.json();
  return {
    public_id: json.public_id,
    secure_url: json.secure_url,
    width: json.width,
    height: json.height,
    format: json.format,
  };
}
