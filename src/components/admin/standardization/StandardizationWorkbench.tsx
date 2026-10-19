'use client';

import React, { useState } from 'react';
import styles from '@/app/(admin)/admin/productos/estandarizar/[id]/page.module.css';
import {
  approveGeneratedPhoto,
  rejectGeneratedPhoto,
  generateStandardizedPhotosCloudAction,
} from '@/app/(admin)/admin/productos/standardizationActions';
import {
  PresetResult,
  StandardizedImage,
  getPreset,
  getPresetsForCategory,
} from '@/lib/photo-presets';
import { StandardizationStatusBadge, StandardizationStatus } from '@/components/admin/StandardizationStatusBadge';
import { RegenerationModal } from './RegenerationModal';

export interface StandardizationWorkbenchProduct {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  images?: string[];
  standardized_images?: StandardizedImage[];
}

export interface StandardizationWorkbenchJob {
  id: string;
  product_id: string;
  created_at: string;
  status: StandardizationStatus;
  results?: PresetResult[];
  error_message?: string;
}

interface PhotoCardState {
  status: 'pending_review' | 'approved' | 'discarded' | 'failed';
  isApproving: boolean;
  isDiscarding: boolean;
  cloudinary_id: string;
  url?: string;
  isJustRegenerated?: boolean;
  error?: string;
}

interface Props {
  product: StandardizationWorkbenchProduct;
  initialJobs: StandardizationWorkbenchJob[];
}

function resolveThumbnailUrl(cloudinaryIdOrUrl?: string): string {
  if (!cloudinaryIdOrUrl) return '';
  if (cloudinaryIdOrUrl.startsWith('http://') || cloudinaryIdOrUrl.startsWith('https://')) {
    return cloudinaryIdOrUrl;
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpm4judv4';
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_533,q_auto,f_auto/${cloudinaryIdOrUrl}`;
}

export function StandardizationWorkbench({ product, initialJobs }: Props) {
  const [jobs, setJobs] = useState<StandardizationWorkbenchJob[]>(initialJobs);

  // Determine category presets
  const categoryPresets = getPresetsForCategory(product.category);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(
    categoryPresets.map((p) => p.id)
  );
  const [quality, setQuality] = useState<'1080p' | '2k' | '4k'>('2k');
  const [isGeneratingCloud, setIsGeneratingCloud] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Initialize individual card states from product.standardized_images and jobs
  const [cardStates, setCardStates] = useState<Record<string, PhotoCardState>>(() => {
    const initial: Record<string, PhotoCardState> = {};
    const approvedImages = product.standardized_images || [];

    for (const job of initialJobs) {
      for (const res of job.results || []) {
        const key = `${job.id}_${res.preset}`;
        const isApproved = approvedImages.some(
          (si) => si.preset === res.preset && (si.cloudinary_id === res.cloudinary_id || !res.cloudinary_id)
        );

        let initialStatus: PhotoCardState['status'] = 'pending_review';
        if (res.status === 'failed') {
          initialStatus = 'failed';
        } else if (isApproved) {
          initialStatus = 'approved';
        }

        initial[key] = {
          status: initialStatus,
          isApproving: false,
          isDiscarding: false,
          cloudinary_id: res.cloudinary_id,
          url: res.url,
          error: res.error,
        };
      }
    }
    return initial;
  });

  // Regeneration Modal State
  const [activeRegen, setActiveRegen] = useState<{
    jobId: string;
    presetId: string;
    presetName: string;
    presetIcon?: string;
    currentImageUrl: string;
  } | null>(null);

  const togglePreset = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // 1. Cloud Generation Handler
  const handleGenerateCloud = async () => {
    if (selectedPresets.length === 0) return;
    setIsGeneratingCloud(true);
    setGenerationError(null);

    try {
      const res = await generateStandardizedPhotosCloudAction({
        productId: product.id,
        category: product.category,
        quality,
        requestedPresets: selectedPresets,
      });

      if (res.success && res.jobId && res.photos) {
        const newJob: StandardizationWorkbenchJob = {
          id: res.jobId,
          product_id: product.id,
          created_at: new Date().toISOString(),
          status: res.photos.every((p) => p.status === 'completed')
            ? 'completed'
            : res.photos.some((p) => p.status === 'completed')
            ? 'partial'
            : 'failed',
          results: res.photos,
        };

        // Prepend new job
        setJobs((prev) => [newJob, ...prev]);

        // Register card states for new job
        setCardStates((prev) => {
          const updated = { ...prev };
          for (const photo of res.photos) {
            const key = `${res.jobId}_${photo.preset}`;
            updated[key] = {
              status: photo.status === 'completed' ? 'pending_review' : 'failed',
              isApproving: false,
              isDiscarding: false,
              cloudinary_id: photo.cloudinary_id,
              url: photo.url,
              isJustRegenerated: true,
              error: photo.error,
            };
          }
          return updated;
        });
      } else {
        setGenerationError(res.error || 'Error al generar fotos en la nube.');
      }
    } catch (err: any) {
      setGenerationError(err?.message || 'Error de conexión con el servicio de generación.');
    } finally {
      setIsGeneratingCloud(false);
    }
  };

  // 2. Action: Approve Generated Photo
  const handleApprove = async (jobId: string, presetId: string) => {
    const key = `${jobId}_${presetId}`;
    setCardStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], isApproving: true, error: undefined },
    }));

    try {
      const res = await approveGeneratedPhoto(jobId, presetId);
      if (res.success) {
        setCardStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            isApproving: false,
            status: 'approved',
            isJustRegenerated: false,
          },
        }));
      } else {
        setCardStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            isApproving: false,
            error: res.error || 'No se pudo aprobar la foto.',
          },
        }));
      }
    } catch (err: any) {
      setCardStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          isApproving: false,
          error: err?.message || 'Error de conexión.',
        },
      }));
    }
  };

  // 3. Action: Discard Generated Photo
  const handleDiscard = async (jobId: string, presetId: string) => {
    const key = `${jobId}_${presetId}`;
    setCardStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], isDiscarding: true, error: undefined },
    }));

    try {
      const res = await rejectGeneratedPhoto(jobId, presetId);
      if (res.success) {
        setCardStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            isDiscarding: false,
            status: 'discarded',
            isJustRegenerated: false,
          },
        }));
      } else {
        setCardStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            isDiscarding: false,
            error: res.error || 'No se pudo descartar la foto.',
          },
        }));
      }
    } catch (err: any) {
      setCardStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          isDiscarding: false,
          error: err?.message || 'Error de conexión.',
        },
      }));
    }
  };

  // 4. Action: Open Regeneration Modal
  const handleOpenRegen = (
    jobId: string,
    presetId: string,
    presetName: string,
    presetIcon?: string,
    currentIdOrUrl?: string
  ) => {
    setActiveRegen({
      jobId,
      presetId,
      presetName,
      presetIcon,
      currentImageUrl: currentIdOrUrl || '',
    });
  };

  // 5. Callback on Successful Regeneration
  const handleRegenerationSuccess = (newPhoto: {
    preset: string;
    cloudinary_id: string;
    url?: string;
  }) => {
    if (!activeRegen) return;
    const key = `${activeRegen.jobId}_${newPhoto.preset}`;

    setCardStates((prev) => ({
      ...prev,
      [key]: {
        status: 'pending_review',
        isApproving: false,
        isDiscarding: false,
        cloudinary_id: newPhoto.cloudinary_id,
        url: newPhoto.url,
        isJustRegenerated: true,
        error: undefined,
      },
    }));
  };

  const originalRefPhoto = product.images?.[0] || '';
  const completedJobs = jobs.filter(
    (j) => j.status === 'completed' || j.status === 'partial'
  );

  return (
    <>
      {/* Top Section: Cloud Generation Controls */}
      <section className={styles.section}>
        <div className={styles.panelContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Generación Cloud con IA (Gemini 3.1 Flash Image)
            </h2>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Calidad:</span>
              {(['1080p', '2k', '4k'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  disabled={isGeneratingCloud}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(86,130,3,0.2))',
                    background: quality === q ? 'var(--accent-primary, #568203)' : 'var(--bg-subtle, #f5f0e6)',
                    color: quality === q ? '#ffffff' : 'var(--text-secondary, #5c5c52)',
                    cursor: 'pointer',
                  }}
                >
                  {q.toUpperCase()} {q === '2k' ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.presetGrid}>
            {categoryPresets.map((preset) => {
              const isSelected = selectedPresets.includes(preset.id);
              return (
                <div
                  key={preset.id}
                  className={`${styles.presetCard} ${isSelected ? styles.presetSelected : ''}`}
                  onClick={() => togglePreset(preset.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') togglePreset(preset.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className={styles.presetCheckbox}
                    aria-label={preset.name}
                  />
                  <div>
                    <h3 className={styles.presetName}>
                      {preset.icon} {preset.name}
                    </h3>
                    <p className={styles.presetDesc}>{preset.description}</p>
                    <span className={styles.presetAspect}>{preset.aspectRatio}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {generationError && (
            <div className={`${styles.message} ${styles.messageError}`}>
              ⚠️ {generationError}
            </div>
          )}

          <button
            className={styles.submitBtn}
            onClick={handleGenerateCloud}
            disabled={isGeneratingCloud || selectedPresets.length === 0 || !originalRefPhoto}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isGeneratingCloud ? (
              <>
                <span className={styles.actionSpinner}></span>
                <span>Generando tomas de alta costura en la nube...</span>
              </>
            ) : !originalRefPhoto ? (
              'El producto no tiene fotos originales para estandarizar'
            ) : (
              `Generar ${selectedPresets.length} Tomas en la Nube con IA 🚀`
            )}
          </button>
        </div>
      </section>

      {/* Results Section: Interactive Photo Cards */}
      {completedJobs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Resultados y Supervisión Fotográfica</h2>
          <div className={styles.resultsList}>
            {completedJobs.map((job) => (
              <div key={job.id} className={styles.jobResult}>
                <div className={styles.jobHeader}>
                  <h3>Trabajo del {new Date(job.created_at).toLocaleDateString('es-AR')}</h3>
                  <StandardizationStatusBadge status={job.status} />
                </div>

                <div className={styles.resultsGrid}>
                  {(job.results || []).map((result, idx) => {
                    const preset = getPreset(result.preset);
                    const key = `${job.id}_${result.preset}`;
                    const cardState: PhotoCardState = cardStates[key] || {
                      status: result.status === 'failed' ? 'failed' : 'pending_review',
                      isApproving: false,
                      isDiscarding: false,
                      cloudinary_id: result.cloudinary_id,
                      url: result.url,
                      error: result.error,
                    };

                    const currentImageSrc = resolveThumbnailUrl(
                      cardState.cloudinary_id || cardState.url
                    );

                    const isApproved = cardState.status === 'approved';
                    const isDiscarded = cardState.status === 'discarded';
                    const isFailed = cardState.status === 'failed';
                    const isPending = cardState.status === 'pending_review';

                    return (
                      <div
                        key={idx}
                        className={`${styles.resultCard} ${
                          cardState.isJustRegenerated ? styles.cardPulse : ''
                        } ${isDiscarded ? styles.cardDiscarded : ''}`}
                      >
                        {/* Top Badges */}
                        <div className={styles.cardTopBadges}>
                          <span className={styles.presetBadge}>
                            <span>{preset?.icon || '📸'}</span>
                            <span>{preset?.name || result.preset}</span>
                          </span>
                          {preset?.aspectRatio && (
                            <span className={styles.aspectBadge}>{preset.aspectRatio}</span>
                          )}
                        </div>

                        {/* Image Preview */}
                        <div className={styles.imageContainer}>
                          {currentImageSrc ? (
                            <img
                              src={currentImageSrc}
                              alt={`Resultado ${preset?.name || result.preset}`}
                              className={styles.resultImage}
                            />
                          ) : (
                            <div style={{ color: '#aaa', fontSize: '0.8rem', padding: '1rem' }}>
                              {isFailed ? 'Error en la generación' : 'Sin imagen disponible'}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={styles.statusBadgeRow}>
                          {isApproved && (
                            <span className={`${styles.statusBadge} ${styles.badgeApproved}`}>
                              ✓ Aprobada en Tienda ✅
                            </span>
                          )}
                          {isDiscarded && (
                            <span className={`${styles.statusBadge} ${styles.badgeDiscarded}`}>
                              🗑️ Descartada
                            </span>
                          )}
                          {isPending && (
                            <span className={`${styles.statusBadge} ${styles.badgePending}`}>
                              ⏳ Pendiente de Revisión
                            </span>
                          )}
                          {isFailed && (
                            <span className={`${styles.statusBadge} ${styles.badgeFailed}`}>
                              ⚠️ Generación Fallida
                            </span>
                          )}
                        </div>

                        {cardState.error && (
                          <p className={styles.cardErrorText}>{cardState.error}</p>
                        )}

                        {/* 3 Independent Action Buttons */}
                        <div className={styles.resultActions}>
                          {/* [Aprobar ✅] */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${
                              isApproved ? styles.approveBtnActive : styles.approveBtn
                            }`}
                            onClick={() => handleApprove(job.id, result.preset)}
                            disabled={
                              cardState.isApproving ||
                              cardState.isDiscarding ||
                              isApproved ||
                              !cardState.cloudinary_id
                            }
                            title="Aprobar para catálogo de la tienda"
                          >
                            {cardState.isApproving ? (
                              <span className={styles.actionSpinner}></span>
                            ) : isApproved ? (
                              '✓ Aprobada'
                            ) : (
                              'Aprobar ✅'
                            )}
                          </button>

                          {/* [Descartar 🗑️] */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                            onClick={() => handleDiscard(job.id, result.preset)}
                            disabled={
                              cardState.isApproving ||
                              cardState.isDiscarding ||
                              isDiscarded
                            }
                            title="Descartar esta foto"
                          >
                            {cardState.isDiscarding ? (
                              <span className={styles.actionSpinner}></span>
                            ) : (
                              'Descartar 🗑️'
                            )}
                          </button>

                          {/* [Regenerar 🔄] */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.regenerateBtn}`}
                            onClick={() =>
                              handleOpenRegen(
                                job.id,
                                result.preset,
                                preset?.name || result.preset,
                                preset?.icon,
                                cardState.cloudinary_id || cardState.url
                              )
                            }
                            disabled={cardState.isApproving || cardState.isDiscarding}
                            title="Ajustar y regenerar con IA"
                          >
                            Regenerar 🔄
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {(!job.results || job.results.length === 0) && (
                    <p className={styles.emptyText}>
                      No hay resultados para mostrar en este trabajo.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regeneration Modal */}
      {activeRegen && (
        <RegenerationModal
          isOpen={true}
          onClose={() => setActiveRegen(null)}
          productId={product.id}
          jobId={activeRegen.jobId}
          presetId={activeRegen.presetId}
          presetName={activeRegen.presetName}
          presetIcon={activeRegen.presetIcon}
          category={product.category}
          currentImageUrl={activeRegen.currentImageUrl}
          originalImageUrl={originalRefPhoto}
          onSuccess={handleRegenerationSuccess}
        />
      )}
    </>
  );
}

export default StandardizationWorkbench;
