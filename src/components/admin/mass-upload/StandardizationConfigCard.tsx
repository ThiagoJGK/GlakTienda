'use client';

import React from 'react';
import { GENERAL_PHOTO_PRESETS } from '@/lib/photo-presets';
import styles from './StandardizationConfigCard.module.css';

export interface StandardizationConfigCardProps {
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  selectedPresets: string[];
  onTogglePreset: (presetId: string) => void;
  quality: '1080p' | '2k' | '4k';
  onChangeQuality: (quality: '1080p' | '2k' | '4k') => void;
  productCount: number;
}

export function StandardizationConfigCard({
  enabled,
  onToggleEnabled,
  selectedPresets,
  onTogglePreset,
  quality,
  onChangeQuality,
  productCount,
}: StandardizationConfigCardProps) {
  const generalPresets = Object.values(GENERAL_PHOTO_PRESETS);

  return (
    <div className={`${styles.card} ${enabled ? styles.cardActive : ''}`}>
      <div className={styles.headerRow}>
        <div className={styles.titleInfo}>
          <div className={styles.badgeRow}>
            <span className={styles.sparkleIcon}>✨</span>
            <span className={styles.titleText}>Fotos de Catálogo con IA</span>
            <span className={styles.optionalBadge}>Opcional</span>
          </div>
          <p className={styles.description}>
            Genera automáticamente tomas de estudio editorial para este lote.
          </p>
        </div>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            aria-label="Habilitar estandarización con IA"
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      {enabled && (
        <div className={styles.expandableContent}>
          <div className={styles.presetSection}>
            <span className={styles.sectionLabel}>Tomas a generar por producto:</span>
            <div className={styles.presetList}>
              {generalPresets.map((preset) => {
                const isChecked = selectedPresets.includes(preset.id);
                return (
                  <label
                    key={preset.id}
                    className={`${styles.presetItem} ${isChecked ? styles.presetItemChecked : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onTogglePreset(preset.id)}
                    />
                    <span className={styles.presetIcon}>{preset.icon}</span>
                    <div className={styles.presetInfo}>
                      <span className={styles.presetName}>{preset.name}</span>
                      <span className={styles.presetAspect}>({preset.aspectRatio})</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.qualitySection}>
            <span className={styles.sectionLabel}>Resolución:</span>
            <div className={styles.qualityGroup}>
              {(['1080p', '2k', '4k'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`${styles.qualityBtn} ${quality === q ? styles.qualityBtnActive : ''}`}
                  onClick={() => onChangeQuality(q)}
                >
                  {q.toUpperCase()} {q === '2k' ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.noticeBox}>
            <p>
              ⚡ <strong>100% Asíncrono:</strong> Los {productCount} productos se publicarán de inmediato con sus fotos originales. Las tomas IA se procesarán en segundo plano y podrás aprobarlas en cualquier momento desde <em>Fotos IA</em>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardizationConfigCard;
