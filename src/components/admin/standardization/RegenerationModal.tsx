'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { regenerateSinglePhotoAction } from '@/app/(admin)/admin/productos/standardizationActions';
import styles from './RegenerationModal.module.css';

export const SUGGESTION_CHIPS = [
  { label: 'Sin fondo oscuro', promptText: 'evitar fondo oscuro, fondo limpio marfil claro' },
  { label: 'Mantener botones', promptText: 'no modificar botones originales, preservar diseño y material de botones' },
  { label: 'Tela mate', promptText: 'evitar brillos sintéticos, textura de tela mate natural' },
  { label: 'Sin sombras duras', promptText: 'sin sombras duras, iluminación de estudio difusa' },
  { label: 'Mejor iluminación', promptText: 'iluminación frontal uniforme de alta costura, sin zonas subexpuestas' },
  { label: 'Color más fiel', promptText: 'preservar tono, matiz y saturación exacta del color original de la prenda' },
] as const;

export interface RegenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  jobId?: string;
  presetId: string;
  presetName: string;
  presetIcon?: string;
  category?: string;
  currentImageUrl: string;
  originalImageUrl: string;
  onSuccess: (newPhoto: {
    preset: string;
    cloudinary_id: string;
    url?: string;
    status: 'pending_review' | 'completed';
  }) => void;
}

function resolveFullImageUrl(urlOrId?: string): string {
  if (!urlOrId) return '';
  if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://')) {
    return urlOrId;
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpm4judv4';
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_533,q_auto,f_auto/${urlOrId}`;
}

export function RegenerationModal({
  isOpen,
  onClose,
  productId,
  jobId,
  presetId,
  presetName,
  presetIcon = '📸',
  category = 'Indumentaria',
  currentImageUrl,
  originalImageUrl,
  onSuccess,
}: RegenerationModalProps) {
  const [negativePrompt, setNegativePrompt] = useState('');
  const [quality, setQuality] = useState<'1080p' | '2k' | '4k'>('2k');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRegenerating) {
        onClose();
      }
    },
    [isRegenerating, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleChipClick = (chipText: string) => {
    setNegativePrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chipText;
      if (trimmed.toLowerCase().includes(chipText.toLowerCase())) return prev;
      return `${trimmed}, ${chipText}`;
    });
  };

  const handleRetry = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const res = await regenerateSinglePhotoAction({
        productId,
        jobId,
        presetId,
        originalImageUrl,
        category,
        negativePrompt,
        quality,
      });

      if (res.success && res.photo) {
        onSuccess({
          preset: res.photo.preset,
          cloudinary_id: res.photo.cloudinary_id,
          url: res.photo.url,
          status: 'pending_review',
        });
        setNegativePrompt('');
        onClose();
      } else {
        setErrorMessage(res.error || 'No se pudo regenerar la toma. Intenta nuevamente.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión con el servicio de generación.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const currentSrc = resolveFullImageUrl(currentImageUrl);
  const originalSrc = resolveFullImageUrl(originalImageUrl);

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRegenerating) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="regeneration-modal-title"
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.presetIcon}>{presetIcon}</span>
            <div>
              <h2 id="regeneration-modal-title" className={styles.title}>
                Regenerar Toma: {presetName}
              </h2>
              <p className={styles.subtitle}>
                Ajustá la toma con feedback correctivo para la IA.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isRegenerating}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {/* Visual Dual-Preview */}
          <div className={styles.previewComparison}>
            <div className={styles.previewBox}>
              <span className={styles.badgeCurrent}>⚠️ Toma actual a reemplazar</span>
              <div className={styles.imageWrapper}>
                {currentSrc ? (
                  <img
                    src={currentSrc}
                    alt={`Toma actual ${presetName}`}
                    className={styles.previewImg}
                  />
                ) : (
                  <div style={{ color: '#888', fontSize: '0.8rem', padding: '1rem' }}>Sin imagen</div>
                )}
              </div>
            </div>
            <div className={styles.previewBox}>
              <span className={styles.badgeOriginal}>📸 Prenda original (referencia)</span>
              <div className={styles.imageWrapper}>
                {originalSrc ? (
                  <img
                    src={originalSrc}
                    alt="Prenda original de referencia"
                    className={styles.previewImg}
                  />
                ) : (
                  <div style={{ color: '#888', fontSize: '0.8rem', padding: '1rem' }}>Sin referencia</div>
                )}
              </div>
            </div>
          </div>

          {/* Negative Prompt / Corrective Feedback */}
          <div className={styles.formGroup}>
            <label htmlFor="negative-prompt-input" className={styles.label}>
              Prompt Negativo / Feedback Correctivo
            </label>
            <p className={styles.fieldHelp}>
              Indicá qué elementos querés EVITAR o qué detalles corregir (ej: tela más mate, fondo sin sombras, botones reales).
            </p>
            <textarea
              id="negative-prompt-input"
              className={styles.textarea}
              rows={3}
              placeholder="ej: evitar fondo oscuro, no cambiar botones originales, tela más mate..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              disabled={isRegenerating}
            />
          </div>

          {/* 1-Click Suggestion Chips */}
          <div className={styles.chipsSection}>
            <span className={styles.chipsLabel}>Sugerencias rápidas de 1 clic:</span>
            <div className={styles.chipsRow}>
              {SUGGESTION_CHIPS.map((chip) => {
                const isActive = negativePrompt
                  .toLowerCase()
                  .includes(chip.promptText.toLowerCase());
                return (
                  <button
                    key={chip.label}
                    type="button"
                    className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                    onClick={() => handleChipClick(chip.promptText)}
                    disabled={isRegenerating}
                  >
                    <span>{isActive ? '✓' : '+'}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Picker */}
          <div className={styles.qualityRow}>
            <span className={styles.qualityLabel}>Resolución:</span>
            <div className={styles.qualityBtns}>
              {(['1080p', '2k', '4k'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`${styles.qualityBtn} ${quality === q ? styles.qualityBtnActive : ''}`}
                  onClick={() => setQuality(q)}
                  disabled={isRegenerating}
                >
                  {q.toUpperCase()} {q === '2k' ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={styles.errorAlert} role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isRegenerating}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleRetry}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <span className={styles.spinner}></span>
                <span>Generando toma con IA...</span>
              </>
            ) : (
              <>
                <span>🔄 Reintentar Toma</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default RegenerationModal;
