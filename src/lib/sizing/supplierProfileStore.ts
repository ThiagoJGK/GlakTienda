import {
  SupplierSizeProfile,
  SupplierChartTranslationRequest,
} from '@/types/sizing';
import { translateSupplierSizeChart } from './sizeTranslator';
import { createClient } from '@/lib/supabase/client';

export function buildSupplierSizeProfile(
  request: SupplierChartTranslationRequest & {
    id?: string;
    profileName?: string;
    sourceType?: 'ai_image' | 'manual_template';
  }
): SupplierSizeProfile {
  const now = new Date().toISOString();
  const id = request.id || crypto.randomUUID();
  const supplierName = (request.supplierName || 'Proveedor').trim();
  const profileName = (
    request.profileName ||
    `${supplierName} - ${request.garmentCategory}`
  ).trim();

  const translatedRows = translateSupplierSizeChart(request);

  return {
    id,
    supplierName,
    profileName,
    garmentCategory: request.garmentCategory,
    genderProfile: request.genderProfile || 'female',
    measurementMode: request.measurementMode || 'flat_garment',
    fitType: request.fitType || 'regular',
    stretchLevel: request.stretchLevel || 'rigid',
    rows: request.rows || [],
    translatedRows,
    sourceType: request.sourceType || 'manual_template',
    createdAt: now,
    updatedAt: now,
  };
}

export interface SupplierProfileRepository {
  listProfiles(supplierNameFilter?: string): Promise<SupplierSizeProfile[]>;
  saveProfile(profile: SupplierSizeProfile): Promise<SupplierSizeProfile>;
  deleteProfile(id: string): Promise<boolean>;
}

// Resilient memory cache fallback when Supabase table isn't migrated yet or during offline testing
const memoryProfiles = new Map<string, SupplierSizeProfile>();

export function createSupplierProfileRepository(
  customClient?: any
): SupplierProfileRepository {
  return {
    async listProfiles(supplierNameFilter?: string): Promise<SupplierSizeProfile[]> {
      try {
        const client = customClient || createClient();
        let query = client
          .from('supplier_size_profiles')
          .select('*')
          .order('updated_at', { ascending: false });

        if (supplierNameFilter && supplierNameFilter.trim()) {
          query = query.ilike('supplier_name', `%${supplierNameFilter.trim()}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map((d: any) => ({
            id: d.id,
            supplierName: d.supplier_name,
            profileName: d.profile_name,
            garmentCategory: d.garment_category,
            genderProfile: d.gender_profile,
            measurementMode: d.measurement_mode,
            fitType: d.fit_type,
            stretchLevel: d.stretch_level,
            rows: d.rows || [],
            translatedRows: d.translated_rows || [],
            sourceType: d.source_type,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch {
        // Fallback to memory
      }

      // Memory fallback
      const all = Array.from(memoryProfiles.values());
      if (supplierNameFilter && supplierNameFilter.trim()) {
        const filterLower = supplierNameFilter.toLowerCase();
        return all.filter((p) => p.supplierName.toLowerCase().includes(filterLower));
      }
      return all;
    },

    async saveProfile(profile: SupplierSizeProfile): Promise<SupplierSizeProfile> {
      memoryProfiles.set(profile.id, profile);
      try {
        const client = customClient || createClient();
        const payload = {
          id: profile.id,
          supplier_name: profile.supplierName,
          profile_name: profile.profileName,
          garment_category: profile.garmentCategory,
          gender_profile: profile.genderProfile,
          measurement_mode: profile.measurementMode,
          fit_type: profile.fitType,
          stretch_level: profile.stretchLevel,
          rows: profile.rows,
          translated_rows: profile.translatedRows,
          source_type: profile.sourceType,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await client
          .from('supplier_size_profiles')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            supplierName: data.supplier_name,
            profileName: data.profile_name,
            garmentCategory: data.garment_category,
            genderProfile: data.gender_profile,
            measurementMode: data.measurement_mode,
            fitType: data.fit_type,
            stretchLevel: data.stretch_level,
            rows: data.rows,
            translatedRows: data.translated_rows,
            sourceType: data.source_type,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch {
        // Fallback to memory
      }

      return profile;
    },

    async deleteProfile(id: string): Promise<boolean> {
      memoryProfiles.delete(id);
      try {
        const client = customClient || createClient();
        const { error } = await client
          .from('supplier_size_profiles')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch {
        // Fallback to memory
      }
      return true;
    },
  };
}
