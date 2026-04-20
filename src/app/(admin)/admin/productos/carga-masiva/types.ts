import { ColorVariation } from '@/components/admin/ColorSizesSection';

export type UploadingProduct = {
  id: string;
  imageUrls: string[]; 
  
  // AI / Meta Fields
  name: string;
  description: string;
  category: string;
  tags: string;

  // Manual Fields
  price: string;
  collections: {id: string, name: string}[];
  variations: ColorVariation[];

  // Status
  aiStatus: 'idle' | 'generating' | 'done' | 'error';
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
};
