'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QrPaquetesPage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState('vector'); // 'vector' | 'art'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(`${window.location.origin}/paquetes`);
    }
  }, []);

  return (
    <div className="wrap">
      {/* Fondo con Burbujas Flotantes */}
      <div className="bubbles-container" aria-hidden="true">
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
      </div>

      {/* Encabezado */}
      <div className="brand-header">
        <div className="brand-badge">
          <span>🚗</span> Código QR Exclusivo <span>✨</span>
        </div>
        <h1>QR Paquetes · Camaro</h1>
        <p className="sub" style={{ margin: '4px 0 16px' }}>
          Código QR estilizado con el Camaro de <strong>Car Wash La Carpita</strong> para imprimir en lonas, volantes o stickers.
        </p>
      </div>

      {/* Selector de Edición */}
      <div className="nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'vector' ? 'active' : ''}`}
          onClick={() => setActiveTab('vector')}
        >
          ⚡ QR Escaneable Vector
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'art' ? 'active' : ''}`}
          onClick={() => setActiveTab('art')}
        >
          🎨 Edición Arte de Puntos
        </button>
      </div>

      {activeTab === 'vector' ? (
        /* VISTA 1: QR VECTORIAL 100% ESCANEABLE */
        <div className="card card-glow" style={{ textAlign: 'center' }}>
          <div className="label" style={{ justifyContent: 'center' }}>
            <span>✅</span> 100% Funcional y Escaneable
          </div>

          <p className="sub" style={{ fontSize: '13px', marginBottom: 16 }}>
            Matriz de puntos aerodinámicos en cian neón y carbón, con silueta del Camaro y corrección de error de nivel H para lectura inmediata en cualquier celular.
          </p>

          {/* Vista Previa del SVG */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(0, 210, 255, 0.4)',
            border: '2.5px solid var(--aqua-neon)',
            margin: '0 auto 18px',
            maxWidth: '340px'
          }}>
            <img
              src="/images/qr-camaro-paquetes.svg"
              alt="Código QR Camaro Car Wash La Carpita"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* URL Destino */}
          <div style={{ textAlign: 'left', marginBottom: 14 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
              Enlace que abre este QR:
            </div>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://tu-dominio.com/paquetes"
              style={{ fontSize: '13px', padding: '10px 14px' }}
            />
          </div>

          <div className="row">
            <a
              href="/images/qr-camaro-paquetes.svg"
              download="qr-camaro-paquetes.svg"
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              📥 Descargar Vectorial (.SVG)
            </a>
          </div>
        </div>
      ) : (
        /* VISTA 2: EDICIÓN ARTE DE PUNTOS */
        <div className="card card-glow" style={{ textAlign: 'center' }}>
          <div className="label" style={{ justifyContent: 'center' }}>
            <span>🎨</span> Puntos Dibujando el Camaro
          </div>

          <p className="sub" style={{ fontSize: '13px', marginBottom: 16 }}>
            Diseño donde la cuadrícula de puntos y módulos de datos compone visualmente la silueta completa del Camaro en cian y blanco.
          </p>

          {/* Imagen de Arte */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '12px',
            boxShadow: '0 0 35px rgba(0, 210, 255, 0.4)',
            border: '2.5px solid var(--aqua-neon)',
            margin: '0 auto 18px',
            maxWidth: '340px'
          }}>
            <img
              src="/images/camaro-dots-qr.jpg"
              alt="Código QR de Arte con Puntos dibujando Camaro"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }}
            />
          </div>

          <div className="row">
            <a
              href="/images/camaro-dots-qr.jpg"
              download="camaro-dots-qr.jpg"
              className="btn-gold"
              style={{ textDecoration: 'none' }}
            >
              📥 Descargar Imagen (.JPG)
            </a>
          </div>
        </div>
      )}

      {/* Botones de Navegación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 16 }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push('/paquetes')}
        >
          ✨ Ir a Ver Página de Paquetes
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push('/operador')}
        >
          ⚙️ Ir al Panel de Operador
        </button>
      </div>
    </div>
  );
}
