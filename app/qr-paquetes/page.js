'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, DownloadSimple, QrCode, Storefront } from '@phosphor-icons/react';

export default function QrPaquetesPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/paquetes`);
    }
  }, []);

  function handleDownloadPNG() {
    if (typeof document === 'undefined') return;
    const canvas = document.getElementById('qr-paquetes-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'qr-paquetes-la-carpita.png';
    link.click();
  }

  function handleDownloadSVG() {
    if (typeof document === 'undefined') return;
    const svgElement = document.getElementById('qr-paquetes-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = 'qr-paquetes-la-carpita.svg';
    link.click();
  }

  if (!isMounted) return null;

  return (
    <div className="wrap qr-page">
      {/* Fondo con Burbujas */}
      <div className="bubbles-container" aria-hidden="true">
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
      </div>

      {/* Encabezado */}
      <div className="brand-header">
        <div className="brand-badge">
          <QrCode size={15} weight="bold" /> Código QR Oficial
        </div>
        <h1>QR de Paquetes</h1>
        <p className="sub" style={{ margin: '4px 0 18px' }}>
          Código QR limpio de alto contraste. Escanéalo con la cámara de cualquier iPhone o Android para abrir directamente tus paquetes y promociones.
        </p>
      </div>

      {/* Tarjeta con Código QR Limpio y Escaneable */}
      <div className="card card-glow" style={{ textAlign: 'center' }}>
        <div className="label" style={{ justifyContent: 'center' }}>
          <QrCode size={16} weight="bold" /> Listo para escanear
        </div>

        {/* Contenedor del QR en Blanco Puro para Lectura Inmediata */}
        <div style={{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#FFFFFF',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 0 28px rgba(0, 210, 255, 0.35)',
          border: '2px solid var(--aqua-neon)',
          margin: '10px auto 18px'
        }}>
          {url ? (
            <>
              {/* SVG para pantalla y descarga vectorial */}
              <QRCodeSVG
                id="qr-paquetes-svg"
                value={url}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
              {/* Canvas oculto para exportar a PNG de alta resolución */}
              <div style={{ display: 'none' }}>
                <QRCodeCanvas
                  id="qr-paquetes-canvas"
                  value={url}
                  size={600}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                  includeMargin={true}
                />
              </div>
            </>
          ) : (
            <p className="sub" style={{ margin: 20 }}>Generando código...</p>
          )}
        </div>

        {/* Campo de URL */}
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--aqua-neon)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            URL que abre el código QR:
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-proyecto.vercel.app/paquetes"
            style={{ fontSize: '13.5px', padding: '12px 14px' }}
          />
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: 2 }}>
            💡 En Vercel detecta automáticamente el dominio en vivo. Puedes cambiarlo aquí si deseas apuntar a otro enlace.
          </div>
        </div>

        {/* Botones de Descarga */}
        <div className="row" style={{ marginBottom: 8 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownloadPNG}
            disabled={!url}
          >
            <DownloadSimple size={18} weight="bold" /> Descargar PNG
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleDownloadSVG}
            disabled={!url}
          >
            <DownloadSimple size={18} weight="bold" /> Descargar SVG
          </button>
        </div>
      </div>

      {/* Botones de Navegación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 14 }}>
        <button
          type="button"
          className="btn-gold"
          onClick={() => router.push('/paquetes')}
        >
          <Storefront size={18} weight="bold" /> Abrir paquetes
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push('/operador')}
        >
          <ArrowLeft size={18} weight="bold" /> Panel de operador
        </button>
      </div>
    </div>
  );
}
