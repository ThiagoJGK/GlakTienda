/**
 * Custom Cloudinary loader for Next.js Image component.
 * Avoids passing image formatting through Next.js server-side / Edge Worker layers.
 */

interface CloudinaryLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality = 75 }: CloudinaryLoaderProps) {
  // If the image is an external full URL, do not process with Cloudinary
  if (src.startsWith('http') && !src.includes('res.cloudinary.com')) {
    return src;
  }
  
  // Extract asset public ID if it is a full Cloudinary URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";
  const marker = `${cloudName}/image/upload/`;
  let publicId = src;
  
  if (src.includes(marker)) {
    publicId = src.split(marker)[1];
    // Clean previous transformations if any exist
    if (publicId.includes('/')) {
      const parts = publicId.split('/');
      // If the first folder starts with common transformation prefixes, skip it
      if (parts[0].match(/c_fill|c_pad|c_fit|c_scale|w_|h_|q_|f_/)) {
        publicId = parts.slice(1).join('/');
      }
    }
  }

  // Return optimized Cloudinary URL with auto format and quality
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},q_${quality},f_auto/${publicId}`;
}
