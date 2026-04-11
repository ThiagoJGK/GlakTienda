/**
 * Cloudinary image URL builder
 * Generates optimized URLs with automatic format (AVIF/WebP) and quality.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "glak";

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "thumb" | "pad";
  gravity?: "auto" | "face" | "center";
  aspectRatio?: string;
}

/**
 * Build a Cloudinary URL with transformations
 * @example cloudinaryUrl("products/vestido-lino", { width: 400 })
 * // => https://res.cloudinary.com/glak/image/upload/f_auto,q_auto,w_400/products/vestido-lino
 */
export function cloudinaryUrl(
  publicId: string,
  options: ImageOptions = {}
): string {
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
    aspectRatio,
  } = options;

  const transforms: string[] = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (aspectRatio) transforms.push(`ar_${aspectRatio}`);

  const transformString = transforms.join(",");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate srcSet for responsive images
 */
export function cloudinarySrcSet(
  publicId: string,
  widths: number[] = [375, 640, 768, 1024, 1280],
  options: Omit<ImageOptions, "width"> = {}
): string {
  return widths
    .map((w) => `${cloudinaryUrl(publicId, { ...options, width: w })} ${w}w`)
    .join(", ");
}

/**
 * Get a blurred placeholder (tiny image for lazy loading)
 */
export function cloudinaryBlurPlaceholder(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 20,
    quality: 30,
    format: "webp",
  });
}
