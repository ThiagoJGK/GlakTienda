'use client';

import React, { useState, useEffect } from 'react';
import {
  GarmentCategoryType,
  MeasurementMode,
  GarmentFitType,
  FabricStretchLevel,
  SupplierSizeRowInput,
  TranslatedSizeResult,
  EnrichedSizeStock,
  SupplierSizeProfile,
} from '@/types/sizing';
import {
  translateSupplierSizeChart,
  mapTranslatedRowsToSizeStock,
} from '@/lib/sizing/sizeTranslator';
import {
  extractSupplierSizeChartAction,
  listSupplierSizeProfilesAction,
  saveSupplierSizeProfileAction,
  deleteSupplierSizeProfileAction,
} from '@/app/(admin)/admin/productos/geminiActions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (enrichedSizes: EnrichedSizeStock[], supplierName?: string) => void;
  initialCategory?: string;
  initialSupplierName?: string;
}

export default function SupplierSizeTranslatorModal({
  isOpen,
  onClose,
  onApply,
  initialCategory = 'Camisas',
  initialSupplierName = '',
}: Props) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'saved'>('ai');

  // Common Configuration
  const [supplierName, setSupplierName] = useState(initialSupplierName);
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategoryType>(
    initialCategory.toLowerCase().includes('pantalon') || initialCategory.toLowerCase().includes('jean')
      ? 'lower'
      : initialCategory.toLowerCase().includes('vestido')
      ? 'dress'
      : 'upper'
  );
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('flat_garment');
  const [fitType, setFitType] = useState<GarmentFitType>('regular');
  const [stretchLevel, setStretchLevel] = useState<FabricStretchLevel>('rigid');

  // AI Tab State
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual / Table State
  const [rows, setRows] = useState<SupplierSizeRowInput[]>([
    { supplierSizeLabel: 'S', measurements: { chestCm: 48, waistCm: 42, lengthCm: 65 }, stock: 5 },
    { supplierSizeLabel: 'M', measurements: { chestCm: 51, waistCm: 45, lengthCm: 67 }, stock: 10 },
    { supplierSizeLabel: 'L', measurements: { chestCm: 55, waistCm: 49, lengthCm: 70 }, stock: 8 },
  ]);

  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<SupplierSizeProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  async function loadProfiles() {
    setIsLoadingProfiles(true);
    try {
      const res = await listSupplierSizeProfilesAction();
      if (res && res.success && res.profiles) {
        setSavedProfiles(res.profiles);
      }
    } catch (e) {
      console.warn('No se pudieron cargar los perfiles de proveedores:', e);
    } finally {
      setIsLoadingProfiles(false);
    }
  }

  // Calculate live translations
  let translatedRows: TranslatedSizeResult[] = [];
  let translationError: string | null = null;

  try {
    if (rows.length > 0 && rows.some((r) => r.supplierSizeLabel.trim())) {
      const validRows = rows.filter((r) => r.supplierSizeLabel.trim());
      translatedRows = translateSupplierSizeChart({
        supplierName: supplierName || 'Proveedor',
        garmentCategory,
        measurementMode,
        fitType,
        stretchLevel,
        rows: validRows,
      });
    }
  } catch (err: any) {
    translationError = err?.message || 'Error en la traducción de medidas';
  }

  // Handle AI Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAiImagePreview(reader.result as string);
      setAiError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiAnalysis = async () => {
    if (!aiImagePreview) return;
    setIsAnalyzingAi(true);
    setAiError(null);

    try {
      const res = await extractSupplierSizeChartAction(aiImagePreview, {
        supplierName: supplierName.trim() || undefined,
        garmentCategory,
        measurementMode,
        fitType,
        stretchLevel,
      });

      if (res.success && res.extracted && res.extracted.rows.length > 0) {
        setRows(res.extracted.rows);
        if (res.extracted.supplierName) {
          setSupplierName(res.extracted.supplierName);
        }
        if (res.extracted.detectedCategory) {
          setGarmentCategory(res.extracted.detectedCategory);
        }
        if (res.extracted.detectedMeasurementMode) {
          setMeasurementMode(res.extracted.detectedMeasurementMode);
        }
        setActiveTab('manual'); // Switch to review & edit table
      } else {
        setAiError(res.error || 'No se pudieron extraer filas de talles válidas de la imagen.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error de conexión analizando la imagen.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Row Management
  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        supplierSizeLabel: `Talle ${rows.length + 1}`,
        measurements: { chestCm: 50, waistCm: 44 },
        stock: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpdateRowField = (
    index: number,
    field: 'supplierSizeLabel' | 'stock' | keyof SupplierSizeRowInput['measurements'],
    value: any
  ) => {
    setRows(
      rows.map((row, i) => {
        if (i !== index) return row;
        if (field === 'supplierSizeLabel') {
          return { ...row, supplierSizeLabel: value };
        }
        if (field === 'stock') {
          return { ...row, stock: Number(value) || 0 };
        }
        return {
          ...row,
          measurements: {
            ...row.measurements,
            [field]: value === '' ? undefined : Number(value) || 0,
          },
        };
      })
    );
  };

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    if (!supplierName.trim()) {
      alert('Por favor ingresa el Nombre del Proveedor para guardar la plantilla.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const res = await saveSupplierSizeProfileAction({
        supplierName: supplierName.trim(),
        profileName: `${supplierName.trim()} - ${garmentCategory === 'upper' ? 'Superior' : garmentCategory === 'lower' ? 'Inferior' : 'Vestido'} (${measurementMode === 'flat_garment' ? 'Plano' : 'Contorno'})`,
        garmentCategory,
        measurementMode,
        fitType,
        stretchLevel,
        rows,
        sourceType: aiImagePreview ? 'ai_image' : 'manual_template',
      });

      if (res.success && res.profile) {
        setProfileSuccessMsg('¡Plantilla del proveedor guardada con éxito!');
        loadProfiles();
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      } else {
        alert('Error guardando plantilla: ' + (res.error || 'Desconocido'));
      }
    } catch (err: any) {
      alert('Error guardando plantilla: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Load a saved profile
  const handleSelectSavedProfile = (profile: SupplierSizeProfile) => {
    setSupplierName(profile.supplierName);
    setGarmentCategory(profile.garmentCategory);
    setMeasurementMode(profile.measurementMode);
    setFitType(profile.fitType || 'regular');
    setStretchLevel(profile.stretchLevel || 'rigid');
    setRows(profile.rows);
    setActiveTab('manual');
  };

  // Delete a saved profile
  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas eliminar esta plantilla de proveedor guardada?')) return;
    await deleteSupplierSizeProfileAction(id);
    loadProfiles();
  };

  // Apply translated sizes to product
  const handleApplyToProduct = () => {
    if (translatedRows.length === 0) {
      alert('No hay talles traducidos válidos para aplicar.');
      return;
    }

    const stocksByLabel: Record<string, number> = {};
    for (const r of rows) {
      stocksByLabel[r.supplierSizeLabel] = r.stock || 0;
    }

    const enrichedStock = mapTranslatedRowsToSizeStock(
      translatedRows,
      stocksByLabel,
      supplierName.trim() || undefined
    );

    onApply(enrichedStock, supplierName.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafaf9',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1c1917' }}>
              🪄 Traductor Inteligente de Talles por Proveedor
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#78716c' }}>
              Traduce medidas de proveedores a la Norma Oficial Argentina (IRAM 75300 / SUNITI)
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#78716c',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'ai' ? 700 : 500,
              color: activeTab === 'ai' ? '#568203' : '#64748b',
              borderBottom: activeTab === 'ai' ? '2px solid #568203' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            📸 Extraer desde Foto con IA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'manual' ? 700 : 500,
              color: activeTab === 'manual' ? '#568203' : '#64748b',
              borderBottom: activeTab === 'manual' ? '2px solid #568203' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            📋 Plantilla Manual de Medidas ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'saved' ? 700 : 500,
              color: activeTab === 'saved' ? '#568203' : '#64748b',
              borderBottom: activeTab === 'saved' ? '2px solid #568203' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            📂 Proveedores Guardados ({savedProfiles.length})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Global Parameters Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Proveedor *
              </label>
              <input
                type="text"
                value={supplierName}
                placeholder="Ej. Taller Lino Flores"
                onChange={(e) => setSupplierName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Tipo de Prenda
              </label>
              <select
                value={garmentCategory}
                onChange={(e) => setGarmentCategory(e.target.value as GarmentCategoryType)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="upper">👕 Superior (Camisa/Remera)</option>
                <option value="lower">👖 Inferior (Pantalón/Jean)</option>
                <option value="dress">👗 Vestido / Enterito</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Modo de Medición
              </label>
              <select
                value={measurementMode}
                onChange={(e) => setMeasurementMode(e.target.value as MeasurementMode)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="flat_garment">📏 Prenda en plano (en mesa x2)</option>
                <option value="body_contour">🧍 Contorno corporal (360°)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Calce (Fit)
              </label>
              <select
                value={fitType}
                onChange={(e) => setFitType(e.target.value as GarmentFitType)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="slim">Slim (Ajustado)</option>
                <option value="regular">Regular (Clásico)</option>
                <option value="relaxed">Relaxed (Holgado)</option>
                <option value="oversize">Oversize (Muy amplio)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Elasticidad
              </label>
              <select
                value={stretchLevel}
                onChange={(e) => setStretchLevel(e.target.value as FabricStretchLevel)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="rigid">Rígida (Lino / Jean)</option>
                <option value="medium">Media (Spandex suave)</option>
                <option value="high">Alta (Lycra / Morley)</option>
              </select>
            </div>
          </div>

          {/* TAB 1: AI Extraer desde Imagen */}
          {activeTab === 'ai' && (
            <div>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: '#fafaf9',
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
                onClick={() => {
                  const inp = document.getElementById('supplier-chart-file-input');
                  inp?.click();
                }}
              >
                <input
                  id="supplier-chart-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1e293b' }}>
                  Subí o pegá la foto de la tabla de talles del proveedor
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Capturas de WhatsApp, fotos de etiquetas o tablas de catálogos en JPG/PNG
                </p>
              </div>

              {aiImagePreview && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <img
                    src={aiImagePreview}
                    alt="Vista previa tabla de talles"
                    style={{
                      maxHeight: '220px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={handleRunAiAnalysis}
                      disabled={isAnalyzingAi}
                      style={{
                        backgroundColor: '#568203',
                        color: '#ffffff',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: isAnalyzingAi ? 'not-allowed' : 'pointer',
                        opacity: isAnalyzingAi ? 0.7 : 1,
                      }}
                    >
                      {isAnalyzingAi ? '⏳ Procesando con Gemini Vision...' : '✨ Extraer Talles con IA'}
                    </button>
                  </div>
                </div>
              )}

              {aiError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #f87171',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                  }}
                >
                  ⚠️ {aiError}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Plantilla Manual / Grilla de Medidas */}
          {activeTab === 'manual' && (
            <div>
              {translationError && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#92400e',
                    fontSize: '0.85rem',
                    marginBottom: '14px',
                  }}
                >
                  ⚠️ {translationError}
                </div>
              )}

              {/* Table of Rows */}
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Etiqueta Taller *</th>
                      {garmentCategory !== 'lower' && (
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {measurementMode === 'flat_garment' ? 'Sisa / Pecho plano (cm)' : 'Busto Contorno (cm)'} *
                        </th>
                      )}
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {measurementMode === 'flat_garment' ? 'Cintura plana (cm)' : 'Cintura Contorno (cm)'}
                      </th>
                      {garmentCategory !== 'upper' && (
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {measurementMode === 'flat_garment' ? 'Cadera plana (cm)' : 'Cadera Contorno (cm)'}
                        </th>
                      )}
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Largo (cm)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Stock Inicial</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#568203', fontWeight: 700 }}>
                        🇦🇷 Talle GLak AR
                      </th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const tr = translatedRows[idx];
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={row.supplierSizeLabel}
                              placeholder="Ej. S, 1, 42"
                              onChange={(e) => handleUpdateRowField(idx, 'supplierSizeLabel', e.target.value)}
                              style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          {garmentCategory !== 'lower' && (
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input
                                type="number"
                                value={row.measurements.chestCm || ''}
                                placeholder="cm"
                                onChange={(e) => handleUpdateRowField(idx, 'chestCm', e.target.value)}
                                style={{ width: '65px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </td>
                          )}
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={row.measurements.waistCm || ''}
                              placeholder="cm"
                              onChange={(e) => handleUpdateRowField(idx, 'waistCm', e.target.value)}
                              style={{ width: '65px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          {garmentCategory !== 'upper' && (
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input
                                type="number"
                                value={row.measurements.hipCm || ''}
                                placeholder="cm"
                                onChange={(e) => handleUpdateRowField(idx, 'hipCm', e.target.value)}
                                style={{ width: '65px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </td>
                          )}
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={row.measurements.lengthCm || ''}
                              placeholder="cm"
                              onChange={(e) => handleUpdateRowField(idx, 'lengthCm', e.target.value)}
                              style={{ width: '65px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={row.stock || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateRowField(idx, 'stock', e.target.value)}
                              style={{ width: '65px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            {tr ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span
                                  style={{
                                    backgroundColor: '#ecfccb',
                                    color: '#365314',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {tr.glakStandardSize} ({tr.glakNumericSize})
                                </span>
                                {tr.hasLabelDiscrepancy && (
                                  <span style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '2px' }} title={tr.discrepancyNote}>
                                    ⚠️ Etiqueta {tr.supplierSizeLabel}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title="Eliminar fila"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleAddRow}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px dashed #94a3b8',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  + Agregar Fila de Talle
                </button>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {profileSuccessMsg && (
                    <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
                      ✓ {profileSuccessMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      color: '#1e293b',
                    }}
                  >
                    {isSavingProfile ? 'Guardando...' : '💾 Guardar Plantilla de Proveedor'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Proveedores Guardados */}
          {activeTab === 'saved' && (
            <div>
              {isLoadingProfiles ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  Cargando plantillas guardadas...
                </div>
              ) : savedProfiles.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  No tienes plantillas de proveedores guardadas aún. Crea una desde la pestaña Manual o Foto con IA y haz clic en &quot;Guardar Plantilla&quot;.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {savedProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => handleSelectSavedProfile(prof)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#1c1917' }}>{prof.supplierName}</strong>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProfile(prof.id, e)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          title="Eliminar plantilla"
                        >
                          ✕
                        </button>
                      </div>
                      <p style={{ margin: '4px 0 8px', fontSize: '0.8rem', color: '#64748b' }}>{prof.profileName}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {prof.garmentCategory === 'upper' ? 'Superior' : prof.garmentCategory === 'lower' ? 'Inferior' : 'Vestido'}
                        </span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {prof.measurementMode === 'flat_garment' ? 'Plano' : 'Contorno'}
                        </span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#ecfccb', color: '#365314', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {prof.rows?.length || 0} talles
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafaf9',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApplyToProduct}
            disabled={translatedRows.length === 0}
            style={{
              backgroundColor: '#568203',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: translatedRows.length === 0 ? 'not-allowed' : 'pointer',
              opacity: translatedRows.length === 0 ? 0.6 : 1,
            }}
          >
            ✅ Aplicar Talles al Producto ({translatedRows.length} talles)
          </button>
        </div>
      </div>
    </div>
  );
}
