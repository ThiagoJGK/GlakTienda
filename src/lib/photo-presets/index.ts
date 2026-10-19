/**
 * Photo Standardization Preset System
 * 
 * Predefined photography prompts for AI photo generation (Gemini Image API & Google Flow).
 * These define the visual aesthetics and editorial angles applied to product photos.
 * 
 * @module photo-presets
 */

export * from './category-matrices';

import {
  PhotoPreset,
  CATEGORY_SHOT_MATRICES,
  GENERAL_PHOTO_PRESETS,
} from './category-matrices';

/**
 * Master photography presets for GLak Tienda product standardization.
 * Maintained for backwards compatibility with existing UI components and jobs.
 */
export const PHOTO_PRESETS: Record<string, PhotoPreset> = GENERAL_PHOTO_PRESETS;

/** Array of general preset IDs */
export const PRESET_IDS = Object.keys(PHOTO_PRESETS) as (keyof typeof PHOTO_PRESETS)[];

/** Union type of valid general preset identifiers */
export type PresetId = keyof typeof PHOTO_PRESETS;

/**
 * Get a preset by ID with type safety across both general presets and category matrices.
 * @param id - The preset identifier (e.g. 'frontal_editorial', 'vestido_frontal_entero', 'top_plano_medio')
 * @returns The preset configuration or undefined if not found
 */
export function getPreset(id: string): PhotoPreset | undefined {
  if (PHOTO_PRESETS[id]) return PHOTO_PRESETS[id];
  for (const list of Object.values(CATEGORY_SHOT_MATRICES)) {
    const found = list.find((p) => p.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get all available presets (general and category-specific) as an ordered array.
 * Guaranteed unique by preset ID.
 * @returns Array of PhotoPreset in display order
 */
export function getAllPresets(): PhotoPreset[] {
  const general = PRESET_IDS.map((id) => PHOTO_PRESETS[id]);
  const categoryPresets = Object.values(CATEGORY_SHOT_MATRICES).flat();

  const seen = new Set<string>();
  const all: PhotoPreset[] = [];
  for (const p of [...general, ...categoryPresets]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      all.push(p);
    }
  }
  return all;
}
