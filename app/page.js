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
  const [showAddCar, setShowAddCar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const qrScannerRef = useRef(null);

  // 1. Cargar teléfono guardado y procesar código desde la URL (?code=ABCD)
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
        setToast({ msg: `🎉 ¡Código detectado! Ingresa tu número de celular para reclamar tu sello.`, kind: 'warn' });
      }
    }
  }, [searchParams]);

  // 2. Si hay código pendiente y ya tenemos teléfono y carro seleccionado, procesar
  useEffect(() => {
    if (pendingCode && phone && selectedPlate) {
      const codeToRun = pendingCode;
      setPendingCode(null);
      procesarCodigo(codeToRun, phone, selectedPlate);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [pendingCode, phone, selectedPlate]);

  // 3. Manejo de escáner QR
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
              try { await html5QrCode.stop(); } catch (e) {}
              setIsScanning(false);
              let tokenToProcess = decodedText.trim();
              if (tokenToProcess.includes('code=')) {
                tokenToProcess = tokenToProcess.split('code=')[1].split('&')[0];
              }
              const activeCarPlate = selectedPlate || (cars.length > 0 ? cars[0].plate : '');
              if (!activeCarPlate) {
                setPendingCode(tokenToProcess.toUpperCase());
                setToast({ msg: '⚠️ Por favor registra el nombre de tu vehículo para asignarle el sello.', kind: 'warn' });
                return;
              }
              await procesarCodigo(tokenToProcess.toUpperCase(), phone, activeCarPlate);
            },
            () => {}
          );
        } catch (err) {
          console.error('Error cámara:', err);
          setToast({ msg: 'No se pudo abrir la cámara. Puedes escribir el código manualmente abajo.', kind: 'warn' });
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
  }, [isScanning, selectedPlate, cars, phone]);

  async function fetchTarjetas(telefono) {
    try {
      setLoading(true);
      const res = await fetch(`/api/tarjeta?phone=${telefono}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const carList = data.cars || [];
        setCars(carList);
        if (carList.length > 0) {
          setSelectedPlate((prev) => {
            const exists = carList.find((c) => c.plate === prev);
            return exists ? prev : carList[0].plate;
          });
        } else {
          setSelectedPlate('');
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
      setToast({ msg: 'Por favor ingresa los 10 dígitos de tu celular.', kind: 'err' });
      return;
    }
    setStoredPhone(digits);
    setPhone(digits);
    setToast(null);
    await fetchTarjetas(digits);
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
    setShowAddCar(false);
  }

  async function handleAgregarCarro(e) {
    e.preventDefault();
    if (!newPlate.trim()) return;
    const upperPlate = newPlate.trim().toUpperCase();

    if (cars.find((c) => c.plate === upperPlate)) {
      setToast({ msg: 'Ya tienes registrado un vehículo con ese nombre.', kind: 'warn' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/agregar-carro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, plate: upperPlate }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = [...cars, { phone, plate: upperPlate, stamps: 0 }];
        setCars(updated);
        setSelectedPlate(upperPlate);
        setNewPlate('');
        setShowAddCar(false);
        setToast({ msg: `✅ Vehículo "${upperPlate}" agregado con éxito.`, kind: '' });

        // Si había código pendiente, procesarlo ahora
        if (pendingCode) {
          const codeToRun = pendingCode;
          setPendingCode(null);
          await procesarCodigo(codeToRun, phone, upperPlate);
        }
      } else {
        setToast({ msg: data.error || 'Error al agregar vehículo', kind: 'err' });
      }
    } catch (err) {
      setToast({ msg: 'Error de conexión con el servidor.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  async function procesarCodigo(token, targetPhone, targetPlate) {
    if (!token) return;
    const activePhone = targetPhone || phone;
    const activePlate = targetPlate || selectedPlate;

    if (!activePhone) {
      setToast({ msg: 'Ingresa tu número celular antes de registrar el código.', kind: 'warn' });
      return;
    }

    if (!activePlate) {
      setPendingCode(token);
      setToast({ msg: '⚠️ Registra el nombre de tu vehículo primero para sumar tu sello.', kind: 'warn' });
      return;
    }

    try {
      setLoading(true);
      setToast(null);
      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: activePhone, plate: activePlate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || 'No se pudo validar el código.', kind: 'err' });
        return;
      }

      setManualCode('');
      setToast({
        msg: data.stamps >= MAX_STAMPS
          ? `🎉 ¡FELICIDADES! Tu vehículo "${activePlate}" completó la tarjeta. Tienes 1 lavado gratis.`
          : `✅ ¡Sello registrado para "${activePlate}"! Llevas ${data.stamps} de ${MAX_STAMPS} sellos.`,
        kind: '',
      });
      fetchTarjetas(activePhone);
    } catch (err) {
      console.error('Error al validar código:', err);
      setToast({ msg: 'Error al conectar con el servidor.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const activePlate = selectedPlate || (cars.length > 0 ? cars[0].plate : '');
    if (!activePlate) {
      setPendingCode(manualCode.trim().toUpperCase());
      setToast({ msg: '⚠️ Registra el nombre de tu vehículo arriba para sumarle el sello.', kind: 'warn' });
      return;
    }
    procesarCodigo(manualCode.trim().toUpperCase(), phone, activePlate);
  }

  if (!isMounted) return null;

  const activeCar = cars.find((c) => c.plate === selectedPlate) || (cars.length > 0 ? cars[0] : null);
  const stamps = activeCar ? activeCar.stamps : 0;

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
                <a className="link" onClick={() => fetchTarjetas(phone)}>🔄 Actualizar</a>
                <a className="link" onClick={handleCambiarTelefono}>Cambiar número ({phone.slice(-4)})</a>
              </div>
            </div>

            {/* Selector de vehículo o registro de primer vehículo */}
            {cars.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Vehículo actual:</span>
                  <a
                    className="link"
                    style={{ fontSize: '11.5px' }}
                    onClick={() => setShowAddCar(!showAddCar)}
                  >
                    {showAddCar ? '✕ Cancelar' : '+ Agregar otro vehículo'}
                  </a>
                </div>

                <select
                  value={activeCar ? activeCar.plate : ''}
                  onChange={(e) => {
                    setSelectedPlate(e.target.value);
                    setToast(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--ink)',
                    border: '1px solid var(--aqua)',
                    color: 'var(--foam)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: showAddCar ? '10px' : '0px'
                  }}
                >
                  {cars.map((c) => (
                    <option key={c.plate} value={c.plate}>
                      🚗 {c.plate} ({c.stamps}/{MAX_STAMPS} sellos)
                    </option>
                  ))}
                </select>

                {showAddCar && (
                  <form onSubmit={handleAgregarCarro} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nombre (Ej. Jetta Blanco, Moto, etc.)"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                      style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading || !newPlate.trim()}
                      style={{ width: 'auto', padding: '10px 16px', marginBottom: 0 }}
                    >
                      Guardar
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(47,199,255,0.06)', border: '1px solid var(--line)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--aqua)', marginBottom: '8px' }}>
                  Escribe el nombre de tu vehículo para empezar:
                </div>
                <form onSubmit={handleAgregarCarro} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ej. Jetta Blanco, Sentra, Camioneta"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !newPlate.trim()}
                    style={{ width: 'auto', padding: '10px 16px', marginBottom: 0 }}
                  >
                    Guardar
                  </button>
                </form>
              </div>
            )}

            {/* LAS GOTAS (WATER DROPS) */}
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
              <strong>{activeCar ? activeCar.plate : 'Tu vehículo'}:</strong> {stamps}/{MAX_STAMPS} sellos acumulados
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
            <div className="label">Registrar nuevo lavado {activeCar ? `para ${activeCar.plate}` : ''}</div>
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