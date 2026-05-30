'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadingProduct } from './types';

interface Step1GroupingProps {
  products: UploadingProduct[];
  onAddFiles: (files: FileList) => void;
  onRemoveProduct: (id: string) => void;
  onProceed: () => void;
  pendingDraft?: { phase: number; products: UploadingProduct[] } | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
}

interface UnassignedImage {
  id: string;
  url: string;
  file: File;
  selected: boolean;
}

export default function Step1Grouping({
  products,
  onAddFiles,
  onRemoveProduct,
  onProceed,
  pendingDraft,
  onResumeDraft,
  onDiscardDraft,
}: Step1GroupingProps) {
  const [unassignedImages, setUnassignedImages] = useState<UnassignedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Clean up Object URLs when component unmounts
  useEffect(() => {
    return () => {
      unassignedImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [unassignedImages]);

  // Handle file selection
  const processFiles = (files: FileList) => {
    const newImages: UnassignedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: crypto.randomUUID(),
          url,
          file,
          selected: false,
        });
      }
    }
    setUnassignedImages((prev) => [...prev, ...newImages]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if we leave the actual dropzone element
    if (e.currentTarget === dropzoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Toggle selection for a thumbnail
  const toggleImageSelection = (id: string) => {
    setUnassignedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, selected: !img.selected } : img))
    );
  };

  // Clear current selection
  const clearSelection = () => {
    setUnassignedImages((prev) => prev.map((img) => ({ ...img, selected: false })));
  };

  // Group selected images and push to parent State
  const createProductGroup = () => {
    const selected = unassignedImages.filter((img) => img.selected);
    if (selected.length === 0) return;

    // Use DataTransfer to programmatically build a FileList for the parent
    try {
      const dataTransfer = new DataTransfer();
      selected.forEach((img) => {
        dataTransfer.items.add(img.file);
      });

      // Call parent handler to upload these files and create the group
      onAddFiles(dataTransfer.files);

      // Remove selected images from local unassigned pool
      setUnassignedImages((prev) => prev.filter((img) => !img.selected));
    } catch (error) {
      console.error('Failed to create file list group', error);
      // Fallback: If DataTransfer fails, we alert or handle gracefully
    }
  };

  const selectedCount = unassignedImages.filter((img) => img.selected).length;

  return (
    <div className="grouping-container animate-fade-in">
      {/* Dynamic Scoped CSS Styles to guarantee zero-JS performance and state-of-the-art visual aesthetics */}
      <style dangerouslySetInnerHTML={{ __html: `
        .grouping-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: var(--space-6) var(--container-padding) var(--space-24) var(--container-padding);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .grouping-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: var(--space-6);
        }

        .grouping-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-4xl);
          color: var(--text-primary);
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .grouping-subtitle {
          color: var(--text-secondary);
          font-size: var(--text-base);
          font-family: var(--font-inter), sans-serif;
          max-width: 700px;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .workspace-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        /* --- Dropzone Canvas Style --- */
        .dropzone-canvas {
          background-color: var(--bg-primary);
          border: 2px dashed var(--border-strong);
          border-radius: var(--radius-xl);
          padding: var(--space-10) var(--space-6);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-bounce);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          min-height: 240px;
        }

        .dropzone-canvas:hover {
          border-color: var(--accent-primary);
          background-color: var(--accent-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .dropzone-canvas.dragging {
          border-color: var(--accent-primary);
          background-color: var(--accent-light);
          transform: scale(1.02);
          box-shadow: var(--shadow-lg);
        }

        .dropzone-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-pill);
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
          box-shadow: var(--shadow-xs);
          transition: transform var(--transition-spring);
        }

        .dropzone-canvas:hover .dropzone-icon-wrapper,
        .dropzone-canvas.dragging .dropzone-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .dropzone-text-primary {
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
        }

        .dropzone-text-secondary {
          font-family: var(--font-inter), sans-serif;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        /* --- Unassigned Pool Panel --- */
        .pool-panel {
          background-color: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .panel-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: var(--space-3);
        }

        .thumbnail-card {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .thumbnail-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }

        .thumbnail-card:hover img {
          transform: scale(1.05);
        }

        .thumbnail-card.selected {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-light);
        }

        /* Star Cover Icon Badge */
        .cover-star-badge {
          position: absolute;
          top: var(--space-2);
          left: var(--space-2);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid var(--border-subtle);
          color: #D4AF37; /* Gold */
          font-size: var(--text-xs);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
          z-index: 5;
          box-shadow: var(--shadow-xs);
          pointer-events: none;
        }

        /* --- Checkboxes with 44px hitboxes --- */
        .checkbox-hitbox {
          position: absolute;
          top: 0;
          right: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          cursor: pointer;
        }

        .checkbox-circle {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-pill);
          border: 2px solid rgba(255, 255, 255, 0.8);
          background-color: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all var(--transition-bounce);
          box-shadow: var(--shadow-xs);
        }

        .thumbnail-card:hover .checkbox-circle {
          border-color: #FFFFFF;
          transform: scale(1.05);
        }

        .thumbnail-card.selected .checkbox-circle {
          border-color: var(--accent-primary);
          background-color: var(--accent-primary);
          color: var(--text-on-accent);
          transform: scale(1.1);
        }

        /* --- Grouped Panel & 3D Stacks --- */
        .grouped-panel {
          background-color: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .groups-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .group-card {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: var(--space-6);
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          padding: var(--space-4);
          transition: all var(--transition-base);
          align-items: center;
        }

        .group-card:hover {
          background-color: var(--bg-surface);
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        /* --- GPU-Accelerated 3D Folder Stack (Pila de Hojas) --- */
        .stack-perspective {
          perspective: 1000px;
          width: 140px;
          height: 140px;
          position: relative;
          cursor: pointer;
        }

        .stack-sheet {
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 120px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--bg-surface);
          border: 2px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
          transition: transform 0.4s var(--transition-spring), opacity 0.4s ease;
          will-change: transform, opacity;
        }

        .stack-sheet img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Individual sheets transforms for beautiful 3D Stack */
        .stack-sheet.index-0 {
          z-index: 4;
          transform: translate3d(0px, 12px, 0px) rotate(0deg) scale(1);
        }
        .stack-sheet.index-1 {
          z-index: 3;
          transform: translate3d(8px, 4px, -10px) rotate(3deg) scale(0.96);
          opacity: 0.95;
        }
        .stack-sheet.index-2 {
          z-index: 2;
          transform: translate3d(16px, -4px, -20px) rotate(-4deg) scale(0.92);
          opacity: 0.9;
        }
        .stack-sheet.index-3 {
          z-index: 1;
          transform: translate3d(24px, -12px, -30px) rotate(5deg) scale(0.88);
          opacity: 0.8;
        }

        /* Dynamic GPU-accelerated Hover Fan-out / Expansion Animation */
        .stack-perspective:hover .stack-sheet.index-0 {
          transform: translate3d(-18px, 16px, 20px) rotate(-8deg) scale(1.04);
        }
        .stack-perspective:hover .stack-sheet.index-1 {
          transform: translate3d(12px, 8px, 0px) rotate(2deg) scale(1.02);
          opacity: 1;
        }
        .stack-perspective:hover .stack-sheet.index-2 {
          transform: translate3d(42px, 0px, -10px) rotate(9deg) scale(0.98);
          opacity: 1;
        }
        .stack-perspective:hover .stack-sheet.index-3 {
          transform: translate3d(72px, -8px, -20px) rotate(15deg) scale(0.94);
          opacity: 0.95;
        }

        .stack-counter-badge {
          position: absolute;
          bottom: var(--space-3);
          right: var(--space-3);
          background-color: var(--accent-primary);
          color: var(--text-on-accent);
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-xs);
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          z-index: 10;
          box-shadow: var(--shadow-sm);
        }

        .group-details {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .group-name {
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: 600;
        }

        .group-meta {
          font-family: var(--font-inter), sans-serif;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .group-actions {
          margin-top: var(--space-3);
          display: flex;
          gap: var(--space-2);
        }

        /* --- Floating Action Bar with Glassmorphic styles --- */
        .floating-action-bar {
          position: fixed;
          bottom: var(--space-6);
          left: 50%;
          transform: translate3d(-50%, 0, 0);
          width: calc(100% - (var(--container-padding) * 2));
          max-width: 800px;
          z-index: var(--z-navbar);
          background: rgba(253, 251, 245, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-6);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          will-change: transform, opacity;
          animation: floatIn 0.4s var(--transition-spring);
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translate3d(-50%, 24px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(-50%, 0, 0);
          }
        }

        .bar-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .bar-selection-badge {
          background-color: var(--accent-light);
          color: var(--accent-primary);
          font-family: var(--font-outfit), sans-serif;
          font-size: var(--text-sm);
          font-weight: 600;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-pill);
        }

        .bar-text {
          font-family: var(--font-inter), sans-serif;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .bar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .empty-state {
          padding: var(--space-12) var(--space-6);
          text-align: center;
          color: var(--text-tertiary);
          font-family: var(--font-inter), sans-serif;
          font-size: var(--text-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          border: 1px dashed var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .empty-state-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2);
        }

        /* --- Miscellaneous --- */
        .btn-avocado {
          background-color: var(--accent-primary);
          color: var(--text-on-accent);
          box-shadow: var(--shadow-sm);
        }

        .btn-avocado:hover {
          background-color: var(--accent-hover);
          box-shadow: var(--shadow-md);
        }

        .btn-avocado:active {
          background-color: var(--accent-pressed);
        }

        .btn-avocado:disabled {
          background-color: var(--border-input);
          color: var(--text-tertiary);
          box-shadow: none;
          cursor: not-allowed;
        }

        .badge-cover {
          background-color: var(--accent-light);
          color: var(--accent-primary);
          border: 1px solid var(--border-subtle);
        }
      ` }} />

      {/* Header section with Outfit fluid typography */}
      <header className="grouping-header">
        <h1 className="grouping-title">Carga Masiva — Paso 1</h1>
        <p className="grouping-subtitle">
          Agrupa tus imágenes de forma visual y táctil. Suelta o selecciona archivos en el área de carga, elige las fotos de un producto y agrúpalas.
        </p>
      </header>

      {/* Active pending draft alert if present */}
      {pendingDraft && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: 'rgba(229, 163, 0, 0.08)',
            border: '1px solid rgba(229, 163, 0, 0.25)',
            padding: '16px 24px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-lg)', color: 'var(--warning)', fontFamily: 'var(--font-outfit)' }}>
              Tienes un borrador pendiente
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Hay un proceso de carga sin finalizar con {pendingDraft.products.length} productos en la memoria del navegador.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onDiscardDraft} className="btn btn-ghost btn-sm">
              Descartar
            </button>
            <button type="button" onClick={onResumeDraft} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--warning)' }}>
              Retomar Carga
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace split */}
      <div className="workspace-grid">
        {/* Left Side: File Upload Dropzone + Unassigned Photos Bank */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Hardware accelerated Dropzone Canvas with custom high-radius borders */}
          <div
            ref={dropzoneRef}
            className={`dropzone-canvas ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon-wrapper">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="dropzone-text-primary">Arrastra tus fotos aquí</span>
              <span className="dropzone-text-secondary">O presiona para seleccionar desde tu dispositivo</span>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Unassigned pool of thumbnails */}
          <div className="pool-panel">
            <h2 className="panel-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--accent-primary)' }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Mesa de Trabajo
              {unassignedImages.length > 0 && (
                <span className="bar-selection-badge" style={{ fontSize: 'var(--text-xs)', padding: '2px 8px' }}>
                  {unassignedImages.length} fotos sueltas
                </span>
              )}
            </h2>

            {unassignedImages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📸</span>
                <strong>Mesa de trabajo vacía</strong>
                <p>Las imágenes que selecciones o arrastres se mostrarán aquí para que las agrupes por producto.</p>
              </div>
            ) : (
              <div className="thumbnail-grid">
                {unassignedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`thumbnail-card ${img.selected ? 'selected' : ''}`}
                    onClick={() => toggleImageSelection(img.id)}
                  >
                    {/* Cover Star on the leftmost unassigned item for visual preview */}
                    {idx === 0 && (
                      <div className="cover-star-badge">
                        <span>★</span> Portada
                      </div>
                    )}
                    <img src={img.url} alt={`Loose item ${idx + 1}`} />

                    {/* Circular Checkbox with a minimum of 44px hitbox for mobile touch ergonomics */}
                    <div
                      className="checkbox-hitbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleImageSelection(img.id);
                      }}
                    >
                      <div className="checkbox-circle">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Grouped Products (Pila de Hojas / 3D Folder Stack) */}
        <div className="grouped-panel">
          <h2 className="panel-title">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--accent-primary)' }}
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Productos Agrupados ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-16) var(--space-6)' }}>
              <span className="empty-state-icon">📁</span>
              <strong>Ningún grupo de producto creado</strong>
              <p>Selecciona una o más fotos en la mesa de trabajo de la izquierda y presiona &quot;Crear Grupo de Producto&quot;.</p>
            </div>
          ) : (
            <div className="groups-list">
              {products.map((p, pIndex) => (
                <div key={p.id} className="group-card">
                  {/* Hardware accelerated 3D Folder Stack displaying up to 4 elements fanning out on hover */}
                  <div className="stack-perspective">
                    {p.imageUrls.length === 0 ? (
                      <div className="stack-sheet index-0 flex items-center justify-center bg-subtle">
                        {p.uploadStatus === 'uploading' ? (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              border: '2px solid var(--accent-primary)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Sin imagen</span>
                        )}
                      </div>
                    ) : (
                      p.imageUrls.slice(0, 4).map((url, i) => (
                        <div key={i} className={`stack-sheet index-${i}`}>
                          <img src={url} alt={`Prod group ${pIndex + 1} img ${i}`} />
                          {/* Star portada indicator overlay inside leftmost cover element */}
                          {i === 0 && (
                            <div className="cover-star-badge" style={{ top: '8px', left: '8px' }}>
                              <span>★</span> Portada
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {p.imageUrls.length > 1 && (
                      <div className="stack-counter-badge">
                        {p.imageUrls.length} fotos
                      </div>
                    )}
                  </div>

                  {/* Group Info & Actions */}
                  <div className="group-details">
                    <span className="group-name">Producto #{pIndex + 1}</span>
                    <div className="group-meta">
                      {p.uploadStatus === 'uploading' ? (
                        <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'var(--warning)',
                              borderRadius: '50%',
                              display: 'inline-block',
                            }}
                          />
                          Subiendo fotos...
                        </span>
                      ) : p.uploadStatus === 'error' ? (
                        <span style={{ color: 'var(--error)' }}>⚠️ Error al subir</span>
                      ) : (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'var(--success)',
                              borderRadius: '50%',
                              display: 'inline-block',
                            }}
                          />
                          Subida exitosa
                        </span>
                      )}
                    </div>

                    <div className="group-actions">
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(p.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', paddingLeft: 0, minHeight: '36px' }}
                      >
                        Desagrupar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphic Floating Action Bar displaying dynamic grouping and flow progression options */}
      {selectedCount > 0 && (
        <div className="floating-action-bar">
          <div className="bar-left">
            <span className="bar-selection-badge">{selectedCount}</span>
            <span className="bar-text hide-mobile">Fotos seleccionadas para agrupar</span>
          </div>

          <div className="bar-actions">
            <button type="button" onClick={clearSelection} className="btn btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={createProductGroup}
              className="btn btn-avocado"
            >
              Crear Grupo de Producto
            </button>
          </div>
        </div>
      )}

      {/* Main flow navigation (shows when no loose items are being selected) */}
      {selectedCount === 0 && products.length > 0 && (
        <div className="floating-action-bar" style={{ justifyContent: 'flex-end' }}>
          <div className="bar-left hide-mobile">
            <span className="bar-text" style={{ fontStyle: 'italic' }}>
              Tienes {products.length} producto{products.length !== 1 ? 's' : ''} listo{products.length !== 1 ? 's' : ''} para continuar
            </span>
          </div>
          <div className="bar-actions">
            <button
              type="button"
              onClick={onProceed}
              className="btn btn-primary"
              style={{ paddingLeft: 'var(--space-8)', paddingRight: 'var(--space-8)' }}
            >
              Continuar a Paso 2 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
