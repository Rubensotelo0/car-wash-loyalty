'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

const MAX_STAMPS = 6;

function getStoredPhone() {
  if (typeof window === 'undefined') return '';
  try {
    // 1. Intentar desde localStorage
    const local = localStorage.getItem('carwash_phone');
    if (local && local.replace(/\D/g, '').length >= 10) {
      return local.replace(/\D/g, '');
    }
    // 2. Intentar desde cookies (útil en webviews de cámara en iOS/Android)
    const match = document.cookie.match(/(?:^|;\s*)carwash_phone=([^;]+)/);
    if (match && match[1] && match[1].replace(/\D/g, '').length >= 10) {
      const clean = match[1].replace(/\D/g, '');
      try { localStorage.setItem('carwash_phone', clean); } catch (e) {}
      return clean;
    }
  } catch (err) {
    console.error('Error al leer teléfono guardado:', err);
  }
  return '';
}

function setStoredPhone(num) {
  if (typeof window === 'undefined') return;
  const digits = num.replace(/\D/g, '');
  try {
    localStorage.setItem('carwash_phone', digits);
  } catch (e) {}
  try {
    document.cookie = `carwash_phone=${digits}; max-age=63072000; path=/; SameSite=Lax`;
  } catch (e) {}
}

function removeStoredPhone() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('carwash_phone');
  } catch (e) {}
  try {
    document.cookie = `carwash_phone=; max-age=0; path=/; SameSite=Lax`;
  } catch (e) {}
}

function ClientePageContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [stamps, setStamps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const qrScannerRef = useRef(null);

  // 1. Cargar teléfono guardado y procesar código desde la URL (?code=ABCD-1234)
  useEffect(() => {
    setIsMounted(true);
    const codeFromUrl = searchParams.get('code');
    const savedPhone = getStoredPhone();

    if (savedPhone) {
      setPhone(savedPhone);
      fetchTarjeta(savedPhone);
    }

    if (codeFromUrl) {
      const cleanCode = codeFromUrl.trim().toUpperCase();
      setPendingCode(cleanCode);

      if (savedPhone) {
        // Validar automáticamente si ya tenemos el teléfono guardado
        procesarCodigo(cleanCode, savedPhone);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else {
        setToast({
          msg: `🎉 ¡Código ${cleanCode} detectado! Ingresa tu número de celular para sumar tu sello.`,
          kind: 'warn',
        });
      }
    }
  }, [searchParams]);

  // 2. Manejador del escáner QR de cámara
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

              let tokenToProcess = decodedText.trim();
              if (tokenToProcess.includes('code=')) {
                const parts = tokenToProcess.split('code=');
                tokenToProcess = parts[1].split('&')[0];
              }
              await procesarCodigo(tokenToProcess.toUpperCase(), phone || getStoredPhone());
            },
            () => {
              // Frame no decodificado, ignorar
            }
          );
        } catch (err) {
          console.error('No se pudo iniciar la cámara:', err);
          setToast({
            msg: 'No se pudo acceder a la cámara. Puedes escribir el código manualmente abajo.',
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

  async function handleGuardarTelefono(e) {
    e.preventDefault();
    const digits = inputPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setToast({ msg: 'Por favor ingresa los 10 dígitos de tu número celular.', kind: 'err' });
      return;
    }
    setStoredPhone(digits);
    setPhone(digits);
    setToast(null);

    // Si había un código pendiente que vino por QR / URL, lo validamos de inmediato
    if (pendingCode) {
      const codeToRun = pendingCode;
      setPendingCode(null);
      await procesarCodigo(codeToRun, digits);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      fetchTarjeta(digits);
    }
  }

  function handleCambiarTelefono() {
    if (isScanning && qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
    removeStoredPhone();
    setPhone('');
    setInputPhone('');
    setStamps(0);
    setToast(null);
    setManualCode('');
    setPendingCode(null);
  }

  async function procesarCodigo(token, targetPhone) {
    const activePhone = targetPhone || phone;
    if (!token) return;
    if (!activePhone) {
      setToast({ msg: 'Ingresa tu número celular antes de registrar el código.', kind: 'warn' });
      return;
    }

    try {
      setLoading(true);
      setToast(null);

      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: activePhone }),
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
          ? '🎉 ¡FELICIDADES! Has completado tu tarjeta. Tienes 1 lavado gratis disponible.'
          : `✅ ¡Sello registrado con éxito! Llevas ${data.stamps} de ${MAX_STAMPS} sellos.`,
        kind: '',
      });
    } catch (err) {
      console.error('Error al validar código:', err);
      setToast({ msg: 'Error al conectar con el servidor. Intenta de nuevo.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    procesarCodigo(manualCode.trim().toUpperCase(), phone);
  }

  if (!isMounted) return null;

  return (
    <div className="wrap">
      <h1>La Carpita · Mi Tarjeta</h1>
      <p className="sub">Acumula 5 lavados y el 6to es totalmente gratis.</p>

      {!phone ? (
        <div className="card">
          <div className="label">Ingresa tu número de celular</div>
          <p className="sub" style={{ marginBottom: 14 }}>
            Tu número es tu tarjeta digital. No necesitas contraseña ni descargar apps.
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
              {pendingCode ? 'Guardar y reclamar mi sello' : 'Ver mi tarjeta'}
            </button>
          </form>
          {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
        </div>
      ) : (
        <>
          {/* Tarjeta de Lealtad */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label" style={{ margin: 0 }}>Tu Tarjeta</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a className="link" onClick={() => fetchTarjeta(phone)}>
                  🔄 Actualizar
                </a>
                <a className="link" onClick={handleCambiarTelefono}>
                  Cambiar número ({phone.slice(-4)})
                </a>
              </div>
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
                🎉 <strong>¡LAVADO GRATIS DISPONIBLE!</strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--amber)', opacity: 0.95 }}>
                  Muéstrale esta pantalla al operador para canjear tu premio en este lavado.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                Te faltan <strong>{MAX_STAMPS - stamps}</strong> {MAX_STAMPS - stamps === 1 ? 'lavado' : 'lavados'} para tu lavado gratis.
              </p>
            )}
          </div>

          {/* Registrar Sello */}
          <div className="card">
            <div className="label">Registrar nuevo lavado</div>
            <p className="sub" style={{ marginBottom: 14 }}>
              Escanea el código QR que te muestre el operador o ingresa el código.
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
                  Cerrar cámara
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

export default function ClientePage() {
  return (
    <Suspense fallback={<div className="wrap"><p className="sub">Cargando tarjeta...</p></div>}>
      <ClientePageContent />
    </Suspense>
  );
}