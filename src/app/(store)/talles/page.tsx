'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IRAM_75300_TABLES } from '@/lib/sizing/iramStandards';
import { SizeGenderProfile } from '@/types/sizing';

export default function TallesPage() {
  const [activeGender, setActiveGender] = useState<SizeGenderProfile>('female');

  const currentTable = IRAM_75300_TABLES[activeGender];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.25rem 5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(86, 130, 3, 0.08)',
            color: '#15803d',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <span>⚖️</span> Ley Nacional de Talles N° 27.521 · SUNITI · Norma IRAM 75300
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          Tabla de Talles Oficial Argentina
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
          En GLak Tienda todas nuestras prendas están estandarizadas bajo el Sistema Único Normalizado
          de Identificación de Talles de Indumentaria (SUNITI), garantizando correspondencia real entre
          medidas corporales y etiquetas.
        </p>
      </div>

      {/* Italian Fashion Manifesto Info */}
      <div
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #fdfbf7 0%, #f7f4ee 100%)',
          borderRadius: '16px',
          border: '1px solid #e7dfd5',
          marginBottom: '2.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🇮🇹</span>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#334155' }}>
            Nota sobre la Colección de Lino Italiano &quot;Talle Único&quot;
          </h2>
        </div>
        <div style={{ fontSize: '0.925rem', color: '#64748b', lineHeight: 1.75 }}>
          <p style={{ marginBottom: '0.75rem' }}>
            Fiel a su estética y caída natural europea, nuestra <strong>Colección de Lino Italiano se confecciona en &quot;Talle Único&quot; orgánico (U)</strong> con calce oversize / relajado.
          </p>
          <p style={{ margin: 0 }}>
            Gracias a la generosa amplitud de sisa (58 a 64 cm en plano) y la nobleza de la fibra de lino puro,
            la prenda tiene una caída fluida que estiliza y se adapta confortablemente a contornos corporales
            desde el talle S (38) hasta el XL (50), sin ajustar ni perder estructura.
          </p>
        </div>
      </div>

      {/* Gender Profile Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { id: 'female', label: 'Indumentaria Femenina (IRAM 75300-1)' },
          { id: 'male', label: 'Indumentaria Masculina (IRAM 75300-2)' },
          { id: 'unisex', label: 'Indumentaria Unisex' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveGender(tab.id as SizeGenderProfile)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: activeGender === tab.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: activeGender === tab.id ? '#f0fdf4' : '#ffffff',
              color: activeGender === tab.id ? '#15803d' : '#475569',
              fontWeight: activeGender === tab.id ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Size Table Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Talle GLak</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Equiv. Numérica AR</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Equiv. US</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Contorno Pecho/Busto</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Contorno Cintura</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Contorno Cadera</th>
              </tr>
            </thead>
            <tbody>
              {currentTable.map((row, idx) => (
                <tr
                  key={row.size}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#16a34a' }}>
                    {row.size}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                    {row.numericSize}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b' }}>
                    {row.jeansUsEquivalent}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#0f172a' }}>
                    {row.chestCm.min} – {row.chestCm.max} cm
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#0f172a' }}>
                    {row.waistCm.min} – {row.waistCm.max} cm
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#0f172a' }}>
                    {row.hipCm.min} – {row.hipCm.max} cm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide: Flat vs Body Contour & Calce */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '2.5rem',
        }}
      >
        {/* Card 1: Medidas en Plano vs Contorno */}
        <div
          style={{
            padding: '1.5rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📐</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Medida en Plano vs Contorno Corporal
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Las tablas oficiales expresan <strong>contorno corporal 360°</strong> (la circunferencia total de tu cuerpo).
            En cambio, en las fichas de producto también te mostramos las <strong>medidas en plano</strong> (la prenda apoyada en una mesa midiendo el ancho de costura a costura).
            Para prendas sin elasticidad, el contorno corporal equivale aproximadamente al doble del ancho en plano menos la holgura del corte.
          </p>
        </div>

        {/* Card 2: Cómo medirse */}
        <div
          style={{
            padding: '1.5rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📏</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              ¿Cómo tomarte las medidas?
            </h3>
          </div>
          <ul style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0, paddingLeft: '1.25rem' }}>
            <li><strong>Busto / Pecho:</strong> Pasá la cinta por la parte más prominente del torso sin apretar.</li>
            <li><strong>Cintura:</strong> Medí la parte más estrecha del abdomen natural.</li>
            <li><strong>Cadera:</strong> Parate con los talones juntos y medí la parte más ancha de los glúteos.</li>
          </ul>
        </div>
      </div>

      {/* Return button */}
      <div style={{ textAlign: 'center' }}>
        <Link
          href="/tienda"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#16a34a',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Explorar la Colección en la Tienda
        </Link>
      </div>
    </div>
  );
}
