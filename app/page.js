'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

const MAX_STAMPS = 6;

function getStoredPhone() {
  if (typeof window === 'undefined') return '';
  try {
    const local = localStorage.getItem('carwash_phone');
    if (local && local.replace(/\D/g, '').length >= 10) return local.replace(/\D/g, '');
    const match = document.cookie.match(/(?:^|;\s*)carwash_phone=([^;]+)/);
    if (match && match[1] && match[1].replace(/\D/g, '').length >= 10) {
      const clean = match[1].replace(/\D/g, '');
      try { localStorage.setItem('carwash_phone', clean); } catch (e) {}
      return clean;
    }
  } catch (err) {}
  return '';
}

function setStoredPhone(num) {
  if (typeof window === 'undefined') return;
  const digits = num.replace(/\D/g, '');
  try { localStorage.setItem('carwash_phone', digits); } catch (e) {}
  try { document.cookie = `carwash_phone=${digits}; max-age=63072000; path=/; SameSite=Lax`; } catch (e) {}
}

function removeStoredPhone() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('carwash_phone'); } catch (e) {}
  try { document.cookie = `carwash_phone=; max-age=0; path=/; SameSite=Lax`; } catch (e) {}
}

function ClientePageContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  
  const [cars, setCars] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const qrScannerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const codeFromUrl = searchParams.get('code');
    const savedPhone = getStoredPhone();

    if (savedPhone) {
      setPhone(savedPhone);
      fetchTarjetas(savedPhone);
    }

    if (codeFromUrl) {
      const cleanCode = codeFromUrl.trim().toUpperCase();
      setPendingCode(cleanCode);
      if (!savedPhone) {
        setToast({ msg: `🎉 ¡Código detectado! Ingresa tu número de celular para sumar tu sello.`, kind: 'warn' });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // Si hay código pendiente y tenemos un carro seleccionado, lo procesamos.
    if (pendingCode && phone) {
      const codeToRun = pendingCode;
      const plateToUse = selectedPlate || 'GENERAL';
      setPendingCode(null);
      procesarCodigo(codeToRun, phone, plateToUse);
      if (typeof window !== 'undefined') window.history.replaceState({}, '', window.location.pathname);
    }
  }, [pendingCode, phone, selectedPlate]);

  useEffect(() => {
    let html5QrCode = null;
    const plateToUse = selectedPlate || 'GENERAL';
    if (isScanning) {
      const timer = setTimeout(async () => {
        try {
          html5QrCode = new Html5Qrcode('reader');
          qrScannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            async (decodedText) => {
              try { await html5QrCode.stop(); } catch (e) {}
              setIsScanning(false);
              let tokenToProcess = decodedText.trim();
              if (tokenToProcess.includes('code=')) tokenToProcess = tokenToProcess.split('code=')[1].split('&')[0];
              await procesarCodigo(tokenToProcess.toUpperCase(), phone, plateToUse);
            },
            () => {}
          );
        } catch (err) {
          setToast({ msg: 'No se pudo acceder a la cámara. Usa el código manual.', kind: 'warn' });
          setIsScanning(false);
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current && qrScannerRef.current.isScanning) {
          qrScannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [isScanning, selectedPlate, phone]);

  async function fetchTarjetas(telefono) {
    try {
      setLoading(true);
      const res = await fetch(`/api/tarjeta?phone=${telefono}`);
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars || []);
        if (data.cars && data.cars.length > 0) {
          if (!selectedPlate) setSelectedPlate(data.cars[0].plate);
        }
      }
    } catch (err) {
      console.error('Error al obtener tarjetas:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarTelefono(e) {
    e.preventDefault();
    const digits = inputPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setToast({ msg: 'Por favor ingresa los 10 dígitos de tu celular.', kind: 'err' }); return;
    }
    setStoredPhone(digits);
    setPhone(digits);
    setToast(null);
    fetchTarjetas(digits);
  }

  function handleCambiarTelefono() {
    if (isScanning && qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
    removeStoredPhone();
    setPhone('');
    setInputPhone('');
    setCars([]);
    setSelectedPlate('');
    setToast(null);
    setManualCode('');
    setPendingCode(null);
  }

  async function handleAgregarCarro(e) {
    e.preventDefault();
    if (!newPlate.trim()) return;
    const upperPlate = newPlate.trim().toUpperCase();
    try {
      setLoading(true);
      const res = await fetch('/api/agregar-carro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, plate: upperPlate })
      });
      if (res.ok) {
        await fetchTarjetas(phone);
        setSelectedPlate(upperPlate);
        setNewPlate('');
        setToast({ msg: `✅ Placa ${upperPlate} agregada con éxito.`, kind: '' });
      } else {
        const data = await res.json();
        setToast({ msg: data.error || 'Error al agregar placa', kind: 'err' });
      }
    } catch (err) {
      setToast({ msg: 'Error de conexión', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  async function procesarCodigo(token, targetPhone, targetPlate) {
    if (!token || !targetPhone || !targetPlate) return;
    try {
      setLoading(true);
      setToast(null);
      const res = await fetch('/api/validar-codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: targetPhone, plate: targetPlate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || 'No se pudo validar el código.', kind: 'err' }); return;
      }
      setManualCode('');
      setToast({
        msg: data.stamps >= MAX_STAMPS ? '🎉 ¡FELICIDADES! Tarjeta completa. 1 lavado gratis.' : `✅ ¡Sello registrado para ${targetPlate}! Llevas ${data.stamps}/${MAX_STAMPS}.`,
        kind: '',
      });
      fetchTarjetas(targetPhone);
    } catch (err) {
      setToast({ msg: 'Error al conectar con el servidor.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const plateToUse = selectedPlate || 'GENERAL';
    procesarCodigo(manualCode.trim().toUpperCase(), phone, plateToUse);
  }

  if (!isMounted) return null;

  const activeCar = cars.find(c => c.plate === selectedPlate);

  return (
    <div className="wrap">
      <h1>La Carpita · Mi Tarjeta</h1>
      <p className="sub">Acumula 5 lavados y el 6to es totalmente gratis.</p>

      {!phone ? (
        <div className="card">
          <div className="label">Ingresa tu número de celular</div>
          <form onSubmit={handleGuardarTelefono}>
            <input type="tel" inputMode="numeric" placeholder="Ej. 55 1234 5678" value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} autoFocus />
            <button type="submit" className="btn-primary" disabled={loading}>
              {pendingCode ? 'Guardar y continuar' : 'Ver mis tarjetas'}
            </button>
          </form>
          {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label" style={{ margin: 0 }}>Mis Carros (Cel: {phone.slice(-4)})</div>
              <a className="link" onClick={handleCambiarTelefono}>Cambiar número</a>
            </div>

            {cars.length > 0 ? (
              <div style={{ marginTop: '14px' }}>
                <select 
                  value={selectedPlate} 
                  onChange={(e) => { setSelectedPlate(e.target.value); setToast(null); }}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--ink)', border: '1px solid var(--line)', color: 'white', marginBottom: '12px' }}
                >
                  {cars.map(c => (
                    <option key={c.plate} value={c.plate}>Carro: {c.plate} ({c.stamps} sellos)</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="sub" style={{ marginTop: '10px' }}>No tienes carros registrados.</p>
            )}

            <form onSubmit={handleAgregarCarro} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input type="text" placeholder="Nueva Placa (Ej. ABC-123)" value={newPlate} onChange={e => setNewPlate(e.target.value.toUpperCase())} style={{ flex: 1, textTransform: 'uppercase', padding: '10px' }} />
              <button type="submit" className="btn-ghost" disabled={loading || !newPlate.trim()} style={{ width: 'auto', padding: '10px 16px' }}>Agregar</button>
            </form>
          </div>

          {activeCar ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="label" style={{ margin: 0 }}>Sellos de {activeCar.plate}</div>
                  <a className="link" onClick={() => fetchTarjetas(phone)}>🔄 Actualizar</a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '18px 0' }}>
                  {Array.from({ length: MAX_STAMPS }).map((_, i) => {
                    const isFilled = i < Number(activeCar.stamps);
                    const isRewardSlot = i === MAX_STAMPS - 1;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 8px', borderRadius: '14px', background: isFilled ? 'linear-gradient(180deg, rgba(47,199,255,0.22), rgba(14,143,214,0.12))' : 'rgba(255,255,255,0.03)', border: isFilled ? '1.5px solid #2FC7FF' : '1.5px dashed rgba(143,226,255,0.25)', boxShadow: isFilled ? '0 0 16px rgba(47,199,255,0.25)' : 'none', transition: 'all 0.3s ease' }}>
                        <svg viewBox="0 0 24 28" style={{ width: '32px', height: '38px', marginBottom: '6px', filter: isFilled ? 'drop-shadow(0 2px 6px rgba(47,199,255,0.4))' : 'none' }}>
                          <path d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z" fill={isFilled ? (isRewardSlot ? '#FFC24D' : '#2FC7FF') : 'transparent'} stroke={isFilled ? (isRewardSlot ? '#FFC24D' : '#2FC7FF') : 'rgba(143,226,255,0.4)'} strokeWidth="1.8" />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isFilled ? (isRewardSlot ? '#FFC24D' : '#2FC7FF') : 'rgba(234,246,255,0.4)' }}>
                          {isFilled ? '✓ SELLO ' + (i + 1) : (isRewardSlot ? '🎁 GRATIS' : 'LAVADO ' + (i + 1))}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="sub" style={{ margin: '8px 0 14px' }}>
                  {activeCar.stamps}/{MAX_STAMPS} sellos acumulados
                </p>

                {activeCar.stamps >= MAX_STAMPS ? (
                  <div className="reward">
                    🎉 <strong>¡LAVADO GRATIS DISPONIBLE!</strong>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--amber)', opacity: 0.95 }}>
                      Muéstrale esta pantalla al operador para canjear tu premio.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                    Te faltan <strong>{MAX_STAMPS - activeCar.stamps}</strong> lavados para tu premio.
                  </p>
                )}
              </div>
            </>
          ) : (
             <div className="card">
                <p className="sub">Agrega un carro o escanea un código para empezar.</p>
             </div>
          )}

          {(!activeCar || activeCar.stamps < MAX_STAMPS) && (
            <div className="card">
              <div className="label">Registrar lavado para {activeCar ? activeCar.plate : 'GENERAL'}</div>
              
              {isScanning ? (
                <div style={{ marginBottom: 14 }}>
                  <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: 'var(--ink)', marginBottom: 10 }} />
                  <button type="button" className="btn-ghost" onClick={() => setIsScanning(false)}>Cerrar cámara</button>
                </div>
              ) : (
                <button type="button" className="btn-primary" onClick={() => { setToast(null); setIsScanning(true); }} disabled={loading}>
                  📷 Escanear código QR
                </button>
              )}

              <div style={{ margin: '14px 0 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
                — O ingresa el código manual —
              </div>

              <form onSubmit={handleManualSubmit}>
                <input type="text" placeholder="Ej. ABCD-1234" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} disabled={loading} />
                <button type="submit" className="btn-ghost" disabled={loading || !manualCode.trim()}>
                  Registrar sello manual
                </button>
              </form>
            </div>
          )}
          {toast && <div className={`toast ${toast.kind}`} style={{ marginTop: '16px' }}>{toast.msg}</div>}
        </>
      )}
    </div>
  );
}

export default function ClientePage() {
  return (
    <Suspense fallback={<div className="wrap"><p className="sub">Cargando...</p></div>}>
      <ClientePageContent />
    </Suspense>
  );
}