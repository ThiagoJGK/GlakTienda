/**
 * Cloudinary image URL builder
 * Generates optimized URLs with automatic format (AVIF/WebP) and quality.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "thumb" | "pad";
  gravity?: "auto" | "face" | "center" | string;
  aspectRatio?: string;
  background?: "brand" | "white" | string;
}

/**
 * Extract publicId and format/extension from a Cloudinary URL
 */
export function parseCloudinaryUrl(url: string): { publicId: string; format?: string } | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const parts = url.split(/\/image\/upload\/(?:v\d+\/)?/);
    if (parts.length < 2) return null;

    const pathAndExt = parts[1];
    const dotIndex = pathAndExt.lastIndexOf(".");
    if (dotIndex === -1) {
      return { publicId: pathAndExt };
    }

    const publicId = pathAndExt.substring(0, dotIndex);
    const format = pathAndExt.substring(dotIndex + 1);

    return { publicId, format };
  } catch (error) {
    console.error("Error parsing Cloudinary URL:", error);
    return null;
  }
}

/**
 * Build a Cloudinary URL with transformations
 * @example cloudinaryUrl("products/vestido-lino", { width: 400 })
 * // => https://res.cloudinary.com/glak/image/upload/f_auto,q_auto,w_400/products/vestido-lino
 */
export function cloudinaryUrl(
  publicIdOrUrl: string,
  options: ImageOptions = {}
): string {
  if (!publicIdOrUrl) return "";

  // Bypass local blob URLs or non-Cloudinary HTTP URLs
  if (
    publicIdOrUrl.startsWith("blob:") ||
    (publicIdOrUrl.startsWith("http") && !publicIdOrUrl.includes("res.cloudinary.com"))
  ) {
    return publicIdOrUrl;
  }

  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    const parsed = parseCloudinaryUrl(publicIdOrUrl);
    if (parsed) {
      publicId = parsed.publicId;
    }
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop,
    gravity,
    aspectRatio,
    background,
  } = options;

  const transforms: string[] = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  
  if (crop) {
    transforms.push(`c_${crop}`);
  }
  
  if (gravity) {
    transforms.push(`g_${gravity}`);
  } else if (crop === "pad") {
    // Smart crop padding default gravity is auto
    transforms.push("g_auto");
  }

  if (aspectRatio) transforms.push(`ar_${aspectRatio}`);

  // Handle background color filling for c_pad/smart crop
  if (background) {
    let bgValue = background;
    if (background === "brand") {
      bgValue = "rgb:fdfbf5";
    } else if (background === "white") {
      bgValue = "rgb:ffffff";
    } else if (background.startsWith("#")) {
      bgValue = `rgb:${background.substring(1)}`;
    }
    transforms.push(`b_${bgValue}`);
  } else if (crop === "pad") {
    // Default background for pad crop is brand cream
    transforms.push("b_rgb:fdfbf5");
  }

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

/**
 * Build an optimized Cloudinary URL for a standardized product photo.
 * Uses the same quality/format pipeline as regular product images.
 * @param cloudinaryId - The Cloudinary public ID of the standardized image
 * @param width - Target display width (default 800)
 * @returns Optimized Cloudinary URL string
 */
export function standardizedImageUrl(cloudinaryId: string, width: number = 800): string {
  return cloudinaryUrl(cloudinaryId, {
    width,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
  });
}
