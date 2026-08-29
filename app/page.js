'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const MAX_STAMPS = 6;

export default function ClientePage() {
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [stamps, setStamps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const qrScannerRef = useRef(null);

  // Cargar teléfono de localStorage al montar
  useEffect(() => {
    setIsMounted(true);
    const savedPhone = localStorage.getItem('carwash_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      fetchTarjeta(savedPhone);
    }
  }, []);

  // Manejador del escáner QR
  useEffect(() => {
    let html5QrCode = null;

    if (isScanning) {
      const timer = setTimeout(async () => {
        try {
          html5QrCode = new Html5Qrcode('reader');
          qrScannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            async (decodedText) => {
              try {
                await html5QrCode.stop();
              } catch (e) {
                console.error('Error al detener escáner:', e);
              }
              setIsScanning(false);
              await procesarCodigo(decodedText.trim().toUpperCase());
            },
            () => {
              // Frame no decodificado, ignorar
            }
          );
        } catch (err) {
          console.error('No se pudo iniciar la cámara:', err);
          setToast({
            msg: 'No se pudo acceder a la cámara. Puedes escribir el código manualmente.',
            kind: 'warn',
          });
          setIsScanning(false);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current && qrScannerRef.current.isScanning) {
          qrScannerRef.current
            .stop()
            .catch((e) => console.error('Error al limpiar escáner:', e));
        }
      };
    }
  }, [isScanning, phone]);

  async function fetchTarjeta(telefono) {
    try {
      setLoading(true);
      const res = await fetch(`/api/tarjeta?phone=${telefono}`);
      if (res.ok) {
        const data = await res.json();
        setStamps(data.stamps || 0);
      }
    } catch (err) {
      console.error('Error al obtener tarjeta:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleGuardarTelefono(e) {
    e.preventDefault();
    const digits = inputPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setToast({ msg: 'Por favor ingresa los 10 dígitos de tu número celular.', kind: 'err' });
      return;
    }
    localStorage.setItem('carwash_phone', digits);
    setPhone(digits);
    setToast(null);
    fetchTarjeta(digits);
  }

  function handleCambiarTelefono() {
    if (isScanning && qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
    localStorage.removeItem('carwash_phone');
    setPhone('');
    setInputPhone('');
    setStamps(0);
    setToast(null);
    setManualCode('');
  }

  async function procesarCodigo(token) {
    if (!token) return;
    if (!phone) {
      setToast({ msg: 'Identifícate con tu número antes de ingresar el código.', kind: 'warn' });
      return;
    }

    try {
      setLoading(true);
      setToast(null);

      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ msg: data.error || 'No se pudo validar el código.', kind: 'err' });
        return;
      }

      setStamps(data.stamps);
      setManualCode('');
      setToast({
        msg: data.stamps >= MAX_STAMPS
          ? '🎉 ¡Felicidades! Has completado tu tarjeta. Tienes un lavado gratis.'
          : `✅ ¡Sello registrado con éxito! Llevas ${data.stamps} de ${MAX_STAMPS}.`,
        kind: '',
      });
    } catch (err) {
      console.error('Error al validar código:', err);
      setToast({ msg: 'Error de conexión. Intenta de nuevo.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    procesarCodigo(manualCode.trim().toUpperCase());
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="wrap">
      <h1>La Carpita · Mi Tarjeta</h1>
      <p className="sub">Acumula 5 lavados y el 6to es totalmente gratis.</p>

      {!phone ? (
        <div className="card">
          <div className="label">Ingresa tu número</div>
          <p className="sub" style={{ marginBottom: 14 }}>
            Tu número celular es tu tarjeta digital. No requiere contraseñas ni SMS.
          </p>
          <form onSubmit={handleGuardarTelefono}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Ej. 55 1234 5678"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              Ver mi tarjeta
            </button>
          </form>
          {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label" style={{ margin: 0 }}>Tu Tarjeta</div>
              <a className="link" onClick={handleCambiarTelefono}>
                Cambiar número ({phone.slice(-4)})
              </a>
            </div>

            <div className="drops">
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <svg
                  key={i}
                  className={`drop ${i < stamps ? 'filled' : ''}`}
                  viewBox="0 0 24 28"
                >
                  <path
                    d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z"
                    fill={i < stamps ? 'var(--aqua)' : 'none'}
                    stroke={i < stamps ? 'var(--aqua)' : 'rgba(143,226,255,0.35)'}
                    strokeWidth="1.6"
                  />
                </svg>
              ))}
            </div>

            <p className="sub" style={{ margin: '8px 0 14px' }}>
              {stamps}/{MAX_STAMPS} sellos acumulados
            </p>

            {stamps >= MAX_STAMPS ? (
              <div className="reward">
                🎉 <strong>¡Lavado gratis disponible!</strong>
                <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--amber)', opacity: 0.9 }}>
                  Muéstrale esta pantalla al operador para canjear tu premio en este lavado.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                Te faltan <strong>{MAX_STAMPS - stamps}</strong> {MAX_STAMPS - stamps === 1 ? 'lavado' : 'lavados'} para tu lavado gratis.
              </p>
            )}
          </div>

          <div className="card">
            <div className="label">Registrar nuevo lavado</div>
            <p className="sub" style={{ marginBottom: 14 }}>
              Escanea el código QR que te muestre el operador o escríbelo abajo.
            </p>

            {isScanning ? (
              <div style={{ marginBottom: 14 }}>
                <div
                  id="reader"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--ink)',
                    marginBottom: 10,
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsScanning(false)}
                >
                  Cancelar escáner
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setToast(null);
                  setIsScanning(true);
                }}
                disabled={loading}
              >
                📷 Escanear código QR
              </button>
            )}

            <div style={{ margin: '14px 0 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
              — O ingresa el código manual —
            </div>

            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                placeholder="Ej. ABCD-1234"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-ghost"
                disabled={loading || !manualCode.trim()}
              >
                {loading ? 'Validando...' : 'Registrar sello manual'}
              </button>
            </form>

            {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
          </div>
        </>
      )}
    </div>
  );
}