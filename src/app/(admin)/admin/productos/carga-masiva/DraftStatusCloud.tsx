'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

interface DraftStatusCloudProps {
  status: 'unsaved' | 'saving' | 'saved' | 'error';
  onSave: () => void;
  lastSavedAt?: Date | null;
}

export default function DraftStatusCloud({ status, onSave, lastSavedAt }: DraftStatusCloudProps) {
  const [prevStatus, setPrevStatus] = useState(status);
  const [prevLastSavedAt, setPrevLastSavedAt] = useState<Date | null | undefined>(lastSavedAt);
  const [triggerPulse, setTriggerPulse] = useState(false);

  if (status !== prevStatus || lastSavedAt !== prevLastSavedAt) {
    setPrevStatus(status);
    setPrevLastSavedAt(lastSavedAt);
    if (status === 'saved') {
      setTriggerPulse(true);
    }
  }

  useEffect(() => {
    if (triggerPulse) {
      const timer = setTimeout(() => setTriggerPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [triggerPulse]);

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Guardando borrador...';
      case 'saved':
        return 'Borrador guardado en la nube';
      case 'error':
        return 'Error al guardar';
      case 'unsaved':
      default:
        return 'Cambios sin guardar';
    }
  };

  const getCloudClassName = () => {
    switch (status) {
      case 'saving':
        return styles.cloudSaving;
      case 'saved':
        return styles.cloudCeleste;
      case 'error':
        return styles.cloudError;
      case 'unsaved':
      default:
        return styles.cloudGray;
    }
  };

  return (
    <div
      id="draft-status-cloud"
      className={`${styles.cloudContainer} ${status === 'saved' ? styles.cloudContainerActive : ''} ${triggerPulse ? styles.pulseAnimation : ''}`}
      onClick={onSave}
      title="Haga clic para forzar guardado manual"
    >
      <span className={`${styles.cloudIcon} ${getCloudClassName()}`}>
        {status === 'saving' ? (
          // Animated spinner icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          // Cloud upload / save icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        )}
      </span>
      <span className={styles.cloudText}>
        {getStatusText()}
        {status === 'saved' && lastSavedAt && (
          <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '4px' }}>
            ({lastSavedAt.toLocaleTimeString()})
          </span>
        )}
      </span>
    </div>
  );
}
