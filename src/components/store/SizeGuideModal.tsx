'use client';

import React, { useState, useId } from 'react';
import {
  GarmentCategoryType,
  EnrichedSizeStock,
  SizeGenderProfile,
  GlakStandardSize,
} from '@/types/sizing';
import {
  getIramTable,
  resolveGarmentCategoryType,
} from '@/lib/sizing/iramStandards';
import {
  recommendCustomerSize,
  CustomerSizeRecommendation,
} from '@/lib/sizing/sizeTranslator';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentCategory?: string;
  sizes?: any[]; // EnrichedSizeStock[] or string[]
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  garmentCategory = 'Vestidos',
  sizes = [],
  selectedSize,
  onSelectSize,
}: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'garment' | 'calculator' | 'official'>('garment');
  const [genderProfile, setGenderProfile] = useState<SizeGenderProfile>('female');

  // Calculator inputs
  const [chestInput, setChestInput] = useState<string>('');
  const [waistInput, setWaistInput] = useState<string>('');
  const [hipInput, setHipInput] = useState<string>('');
  const [preferredFit, setPreferredFit] = useState<'snug' | 'true_to_size' | 'loose'>('true_to_size');
  const [recommendation, setRecommendation] = useState<CustomerSizeRecommendation | null>(null);

  const resolvedCategory: GarmentCategoryType = resolveGarmentCategoryType(garmentCategory);
  const iramRows = getIramTable(genderProfile);

  if (!isOpen) return null;

  // Extract enriched sizes if available
  const normalizedEnrichedSizes: EnrichedSizeStock[] = sizes
    .map((s) => {
      if (typeof s === 'string') {
        return { name: s, stock: 1 };
      }
      if (typeof s === 'object' && s !== null) {
        return s as EnrichedSizeStock;
      }
      return null;
    })
    .filter((s): s is EnrichedSizeStock => s !== null);

  const hasFlatMeasurements = normalizedEnrichedSizes.some(
    (s) => s.measurementsFlatCm && Object.values(s.measurementsFlatCm).some((v) => Number(v) > 0)
  );

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const chest = parseFloat(chestInput);
    const waist = parseFloat(waistInput);
    const hip = parseFloat(hipInput);

    const rec = recommendCustomerSize(
      {
        chestContourCm: !isNaN(chest) && chest > 0 ? chest : undefined,
        waistContourCm: !isNaN(waist) && waist > 0 ? waist : undefined,
        hipContourCm: !isNaN(hip) && hip > 0 ? hip : undefined,
        garmentCategory: resolvedCategory,
        genderProfile,
        preferredFit,
      },
      normalizedEnrichedSizes.length > 0 ? normalizedEnrichedSizes : undefined
    );

    setRecommendation(rec);
  };

  const handleApplyRecommendedSize = (size: GlakStandardSize) => {
    if (onSelectSize) {
      onSelectSize(size);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>📏</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Guía de Talles y Medidas
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
              Estandarizado según Norma Argentina IRAM 75300 · Ley 27.521 (SUNITI)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('garment')}
            style={{
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'garment' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              color: activeTab === 'garment' ? '#16a34a' : '#64748b',
              fontWeight: activeTab === 'garment' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📐 Medidas de esta prenda
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            style={{
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'calculator' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              color: activeTab === 'calculator' ? '#16a34a' : '#64748b',
              fontWeight: activeTab === 'calculator' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ✨ ¿Cuál es mi talle?
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('official')}
            style={{
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'official' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              color: activeTab === 'official' ? '#16a34a' : '#64748b',
              fontWeight: activeTab === 'official' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📋 Tabla SUNITI Oficial
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: Medidas de la prenda */}
          {activeTab === 'garment' && (
            <div>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '0.825rem',
                  color: '#166534',
                  lineHeight: 1.5,
                }}
              >
                <strong>ℹ️ Información de Medición:</strong> Las medidas que figuran a continuación fueron
                tomadas apoyando la prenda sobre una superficie plana de costura a costura. Para saber si te
                quedará cómoda, podés comparar estos centímetros con una prenda similar que ya tengas en tu armario.
              </div>

              {hasFlatMeasurements ? (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Talle GLak AR</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Etiqueta Prenda</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Sisa / Pecho Plano</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Cintura Plana</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Cadera Plana</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>Largo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedEnrichedSizes.map((s, idx) => {
                        const isSelected = selectedSize === s.name;
                        const m = s.measurementsFlatCm || {};
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {s.name} {isSelected && <span style={{ color: '#16a34a' }}>✓</span>}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>
                              {s.supplierSizeLabel ? (
                                <span
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {s.supplierSizeLabel}
                                </span>
                              ) : (
                                s.name
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              {m.chestFlatCm ? `${m.chestFlatCm} cm` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              {m.waistFlatCm ? `${m.waistFlatCm} cm` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              {m.hipFlatCm ? `${m.hipFlatCm} cm` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              {m.lengthCm ? `${m.lengthCm} cm` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                    Esta prenda utiliza el tallaje normalizado oficial de Argentina IRAM 75300. Rango de
                    contorno corporal recomendado para los talles disponibles:
                  </p>
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Talle GLak</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Equivalencia Numérica</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Busto / Pecho (cm)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cintura (cm)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cadera (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iramRows.map((r, i) => {
                          const isSelected = selectedSize === r.size;
                          return (
                            <tr
                              key={r.size}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                                {r.size} {isSelected && <span style={{ color: '#16a34a' }}>✓</span>}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                                {r.numericSize} (AR)
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>
                                {r.chestCm.min} - {r.chestCm.max}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>
                                {r.waistCm.min} - {r.waistCm.max}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>
                                {r.hipCm.min} - {r.hipCm.max}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notice for transparent labeling */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: '#475569',
                }}
              >
                <strong>🏷️ Política de Doble Etiquetado Transparente:</strong> En GLak Tienda trabajamos
                con distintos talleres y diseñadores. Para garantizarte un calce perfecto, medimos cada prenda
                físicamente y la traducimos al Estándar Argentino IRAM 75300. Si la etiqueta cosida por el fabricante
                indica otro talle, te lo especificamos claramente para que compres con total tranquilidad.
              </div>
            </div>
          )}

          {/* TAB 2: Calculador interactivo */}
          {activeTab === 'calculator' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                Ingresá tus medidas corporales en centímetros (tomadas con centímetro de costurera alrededor
                del cuerpo) y nuestro algoritmo calculará tu talle óptimo:
              </p>

              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Busto / Pecho (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 96"
                      value={chestInput}
                      onChange={(e) => setChestInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Cintura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 78"
                      value={waistInput}
                      onChange={(e) => setWaistInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Cadera (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 104"
                      value={hipInput}
                      onChange={(e) => setHipInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    ¿Cómo preferís que te calce la prenda?
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { id: 'snug', label: 'Al cuerpo' },
                      { id: 'true_to_size', label: 'Estándar / Cómodo' },
                      { id: 'loose', label: 'Holgado / Suelto' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferredFit(opt.id as any)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: preferredFit === opt.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
                          backgroundColor: preferredFit === opt.id ? '#f0fdf4' : '#ffffff',
                          color: preferredFit === opt.id ? '#15803d' : '#475569',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: preferredFit === opt.id ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '4px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                  }}
                >
                  ✨ Calcular mi Talle Ideal
                </button>
              </form>

              {/* Recommendation Result Card */}
              {recommendation && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #86efac',
                    backgroundColor: '#f0fdf4',
                    animation: 'fadeIn 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎉</span>
                      <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>
                        Talle Recomendado: {recommendation.recommendedSize} ({recommendation.numericSize})
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor:
                          recommendation.matchConfidence === 'high'
                            ? '#dcfce7'
                            : recommendation.matchConfidence === 'medium'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          recommendation.matchConfidence === 'high'
                            ? '#166534'
                            : recommendation.matchConfidence === 'medium'
                            ? '#92400e'
                            : '#991b1b',
                      }}
                    >
                      Coincidencia {recommendation.matchConfidence === 'high' ? 'Alta' : recommendation.matchConfidence === 'medium' ? 'Media' : 'Aproximada'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: '6px 0 10px', lineHeight: 1.5 }}>
                    {recommendation.explanation}
                  </p>

                  {recommendation.supplierTagNotice && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px dashed #86efac',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: '#166534',
                        marginBottom: '12px',
                      }}
                    >
                      💡 <strong>Aviso de Etiqueta:</strong> {recommendation.supplierTagNotice}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleApplyRecommendedSize(recommendation.recommendedSize)}
                    style={{
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ✓ Elegir talle {recommendation.recommendedSize} para este producto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Tabla Oficial SUNITI */}
          {activeTab === 'official' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Perfil Antropométrico:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'female', label: 'Femenino (75300-1)' },
                    { id: 'male', label: 'Masculino (75300-2)' },
                    { id: 'unisex', label: 'Unisex' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGenderProfile(g.id as any)}
                      style={{
                        padding: '4px 10px',
                        border: genderProfile === g.id ? '1px solid #16a34a' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: genderProfile === g.id ? '#f0fdf4' : '#ffffff',
                        color: genderProfile === g.id ? '#15803d' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#334155' }}>Talle</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Equivalencia AR</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Equivalencia US</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Pecho / Busto (cm)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Cintura (cm)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Cadera (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iramRows.map((r, i) => (
                      <tr
                        key={r.size}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>{r.size}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155', fontWeight: 500 }}>{r.numericSize}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{r.jeansUsEquivalent}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>{r.chestCm.min} - {r.chestCm.max}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>{r.waistCm.min} - {r.waistCm.max}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>{r.hipCm.min} - {r.hipCm.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <strong>📐 ¿Cómo tomarte las medidas correctamente?</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                  <li><strong>Busto / Pecho:</strong> Pasá el centímetro alrededor de la parte más saliente del pecho, por debajo de las axilas y manteniéndolo horizontal.</li>
                  <li><strong>Cintura:</strong> Medí alrededor de la cintura natural (la parte más estrecha del torso, arriba del ombligo).</li>
                  <li><strong>Cadera:</strong> Colocá los pies juntos y medí la parte más ancha de la cadera y glúteos.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
