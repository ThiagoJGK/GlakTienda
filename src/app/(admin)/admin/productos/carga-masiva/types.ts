import { ColorVariation } from '@/components/admin/ColorSizesSection';

export type SizeEntry = {
  name: string;
  stock: number;
};

export type UploadingProduct = {
  id: string;
  imageUrls: string[]; 
  
  // AI / Meta Fields
  name: string;
  description: string;
  category: string;
  tags: string;

  // Manual Fields — price set in Step 1
  price: string;
  collections: {id: string, name: string}[];

  /**
   * Simple size stock entries used in Step 2.
   * Replaces complex multi-dimensional ColorVariation for bulk uploader.
   */
  sizes: SizeEntry[];

  /**
   * Legacy color variations, kept for compatibility with Phase 3 Review (ColorSizesSection).
   */
  variations: ColorVariation[];

  // Status
  aiStatus: 'idle' | 'generating' | 'done' | 'error';
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';

  parentId?: string;
};
