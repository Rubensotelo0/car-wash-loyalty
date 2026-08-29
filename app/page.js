'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { persistPhone, getStoredPhoneSync, getIndexedDBPhone, clearPersistedPhone } from '../lib/storage';

const MAX_STAMPS = 6;

function ClientePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  
  const [cars, setCars] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [showAddCarModal, setShowAddCarModal] = useState(false);

  // Código pendiente por asignar a un carro
  const [activeCodeToClaim, setActiveCodeToClaim] = useState(null);
  const [newCarForCode, setNewCarForCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualInputCode, setManualInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const qrScannerRef = useRef(null);

  // 1. Cargar teléfono guardado y procesar código QR desde URL (?code=ABCD)
  useEffect(() => {
    setIsMounted(true);
    const codeFromUrl = searchParams.get('code');

    async function initSession() {
      let savedPhone = getStoredPhoneSync();
      if (!savedPhone) {
        savedPhone = await getIndexedDBPhone();
      }

      if (savedPhone) {
        setPhone(savedPhone);
        persistPhone(savedPhone);
        fetchTarjetas(savedPhone);
      }

      if (codeFromUrl) {
        const cleanCode = codeFromUrl.trim().toUpperCase();
        setActiveCodeToClaim(cleanCode);
        if (!savedPhone) {
          setToast({ msg: `🎉 ¡Código detectado! Ingresa tu número celular para continuar.`, kind: 'warn' });
        }
      }
    }

    initSession();
  }, [searchParams]);

  // 2. Manejo de escáner QR con cámara
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
              const cleanToken = tokenToProcess.toUpperCase();
              setActiveCodeToClaim(cleanToken);
              setToast({ msg: `Código ${cleanToken} leído. Selecciona a qué vehículo asignarlo.`, kind: '' });
            },
            () => {}
          );
        } catch (err) {
          console.error('Error cámara:', err);
          setToast({ msg: 'No se pudo abrir la cámara. Escribe el código manualmente abajo.', kind: 'warn' });
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
  }, [isScanning]);

  async function fetchTarjetas(telefono) {
    if (!telefono) return;
    try {
      setLoading(true);
      const cleanPhone = String(telefono).replace(/\D/g, '');
      const res = await fetch(`/api/tarjeta?phone=${cleanPhone}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        const carList = data.cars || [];
        setCars(carList);
        if (carList.length > 0) {
          setSelectedPlate((prev) => {
            const exists = carList.find((c) => c.plate === prev);
            return exists ? prev : carList[0].plate;
          });
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
    persistPhone(digits);
    setPhone(digits);
    setToast(null);
    await fetchTarjetas(digits);
  }

  function handleCambiarTelefono() {
    if (isScanning && qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
    clearPersistedPhone();
    setPhone('');
    setInputPhone('');
    setCars([]);
    setSelectedPlate('');
    setToast(null);
    setManualInputCode('');
    setActiveCodeToClaim(null);
    setShowAddCarModal(false);
  }

  // Registrar un vehículo nuevo
  async function handleCrearVehiculo(e) {
    e.preventDefault();
    if (!newPlate.trim()) return;
    const upperPlate = newPlate.trim().toUpperCase();

    if (cars.find((c) => c.plate === upperPlate)) {
      setToast({ msg: 'Ya tienes un vehículo con ese nombre.', kind: 'warn' });
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
        setShowAddCarModal(false);
        setToast({ msg: `✅ Vehículo "${upperPlate}" registrado con éxito.`, kind: '' });
        await fetchTarjetas(phone);
      } else {
        setToast({ msg: data.error || 'Error al agregar vehículo', kind: 'err' });
      }
    } catch (err) {
      setToast({ msg: 'Error de conexión con el servidor.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  // Asignar el código a un vehículo específico
  async function handleAsignarSelloACarro(targetPlate) {
    if (!activeCodeToClaim || !phone || !targetPlate) return;
    const cleanPlate = targetPlate.trim().toUpperCase();

    try {
      setLoading(true);
      setToast(null);

      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeCodeToClaim, phone, plate: cleanPlate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ msg: data.error || 'No se pudo registrar el código.', kind: 'err' });
        return;
      }

      // 1. Limpiar estado de código
      setActiveCodeToClaim(null);
      setManualInputCode('');
      setNewCarForCode('');

      // 2. ACTUALIZACIÓN VISUAL INMEDIATA EN PANTALLA
      setSelectedPlate(cleanPlate);
      setCars((prevCars) => {
        const exists = prevCars.some((c) => c.plate === cleanPlate);
        if (exists) {
          return prevCars.map((c) =>
            c.plate === cleanPlate ? { ...c, stamps: data.stamps } : c
          );
        }
        return [...prevCars, { phone, plate: cleanPlate, stamps: data.stamps }];
      });

      setToast({
        msg: data.stamps >= MAX_STAMPS
          ? `🎉 ¡FELICIDADES! Tu vehículo "${cleanPlate}" completó los 6 sellos. ¡Tu próximo lavado es GRATIS!`
          : `✅ ¡Sello sumado a "${cleanPlate}"! Ahora tiene ${data.stamps} de ${MAX_STAMPS} sellos.`,
        kind: '',
      });

      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // 3. Sincronizar en segundo plano
      await fetchTarjetas(phone);
    } catch (err) {
      console.error('Error al validar:', err);
      setToast({ msg: 'Error de conexión al registrar sello.', kind: 'err' });
    } finally {
      setLoading(false);
    }
  }

  // Asignar código a un nuevo vehículo escrito en el formulario
  async function handleAsignarSelloANuevoCarro(e) {
    e.preventDefault();
    if (!newCarForCode.trim()) return;
    const upper = newCarForCode.trim().toUpperCase();
    await handleAsignarSelloACarro(upper);
  }

  function handleIniciarCodigoManual(e) {
    e.preventDefault();
    if (!manualInputCode.trim()) return;
    const clean = manualInputCode.trim().toUpperCase();
    setActiveCodeToClaim(clean);
  }

  if (!isMounted) return null;

  const activeCar = cars.find((c) => c.plate === selectedPlate) || (cars.length > 0 ? cars[0] : null);
  const currentStamps = activeCar ? activeCar.stamps : 0;

  return (
    <div className="wrap">
      {/* Fondo con Burbujas Flotantes */}
      <div className="bubbles-container" aria-hidden="true">
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
      </div>

      {/* Encabezado Principal de Marca */}
      <div className="brand-header">
        <div className="brand-badge">
          <span>🏠</span> Servicio a Domicilio <span>✨</span>
        </div>
        <h1>La Carpita · Detailing</h1>
        <p className="sub" style={{ margin: '4px 0 16px' }}>
          Acumula 5 lavados y el 6to es totalmente <strong>GRATIS</strong>.
        </p>
      </div>

      {/* Barra de Navegación de Pestañas */}
      <nav className="nav-tabs">
        <button
          type="button"
          className="nav-tab-btn active"
        >
          💧 Mi Tarjeta Digital
        </button>
        <button
          type="button"
          className="nav-tab-btn"
          onClick={() => router.push('/paquetes')}
        >
          ✨ Paquetes y Promos
        </button>
      </nav>

      {!phone ? (
        /* Pantalla 1: Ingreso de Teléfono */
        <div className="card card-glow">
          <div className="label">
            <span>📱</span> Ingresa tu número de celular
          </div>
          <p className="sub" style={{ marginBottom: 16 }}>
            Tu número es tu cuenta digital para consultar tus sellos y canjear tu lavado gratis.
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
              {activeCodeToClaim ? '⚡ Guardar y reclamar mi sello' : '💧 Ver mi tarjeta digital'}
            </button>
          </form>

          {/* Botón rápido para consultar promociones */}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => router.push('/paquetes')}
            style={{ marginTop: 4 }}
          >
            ✨ Conocer Paquetes (Express, Premium, Plus)
          </button>

          {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
        </div>
      ) : (
        /* Pantalla 2: Vista Principal del Cliente */
        <>
          {/* MODAL / SECCIÓN DE PREGUNTA: ¿A QUÉ CARRO SUMAR EL CÓDIGO? */}
          {activeCodeToClaim && (
            <div
              className="card"
              style={{
                border: '2px solid var(--aqua-neon)',
                background: 'linear-gradient(180deg, rgba(0,210,255,0.22), rgba(5,14,21,0.96))',
                boxShadow: '0 0 28px rgba(0,210,255,0.35)',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: 'var(--aqua-neon)', letterSpacing: '0.1em' }}>
                  ⚡ CÓDIGO LISTO: {activeCodeToClaim}
                </span>
                <a
                  className="link"
                  style={{ fontSize: '12.5px', color: 'var(--coral)', fontWeight: 700 }}
                  onClick={() => setActiveCodeToClaim(null)}
                >
                  ✕ Cancelar
                </a>
              </div>

              <h2 style={{ fontSize: '18px', margin: '0 0 6px', color: '#fff', fontWeight: 800 }}>
                ¿A cuál de tus autos le sumamos este sello?
              </h2>
              <p className="sub" style={{ fontSize: '13px', marginBottom: 14 }}>
                Toca tu vehículo registrado o ingresa uno nuevo:
              </p>

              {/* Botones de selección de vehículos existentes */}
              {cars.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 14 }}>
                  {cars.map((car) => (
                    <button
                      key={car.plate}
                      type="button"
                      onClick={() => handleAsignarSelloACarro(car.plate)}
                      disabled={loading || car.stamps >= MAX_STAMPS}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(3,7,10,0.85)',
                        border: '1.5px solid var(--aqua-neon)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        color: 'var(--foam)',
                        textAlign: 'left',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: car.stamps >= MAX_STAMPS ? 'not-allowed' : 'pointer',
                        opacity: car.stamps >= MAX_STAMPS ? 0.5 : 1,
                        marginBottom: 0
                      }}
                    >
                      <span>🚗 {car.plate}</span>
                      <span style={{ color: 'var(--aqua-neon)', fontSize: '13px' }}>
                        {car.stamps >= MAX_STAMPS ? '¡Premio disponible!' : `${car.stamps}/${MAX_STAMPS} sellos ➔`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Opción de asignar a un vehículo nuevo */}
              <div style={{ borderTop: cars.length > 0 ? '1px solid var(--line)' : 'none', paddingTop: cars.length > 0 ? 12 : 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>
                  {cars.length > 0 ? '— O sumar a un nuevo vehículo: —' : 'Escribe el nombre de tu vehículo para sumarle el sello:'}
                </div>
                <form onSubmit={handleAsignarSelloANuevoCarro} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ej. Jetta, Sentra, Moto..."
                    value={newCarForCode}
                    onChange={(e) => setNewCarForCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !newCarForCode.trim()}
                    style={{ width: 'auto', padding: '10px 18px', marginBottom: 0 }}
                  >
                    Sumar sello
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TARJETA DE LEALTAD Y GOTAS */}
          <div className="card">
            {/* Header de la tarjeta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="label" style={{ margin: 0 }}>
                <span>💧</span> Mi Tarjeta de Lealtad
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a className="link" onClick={() => fetchTarjetas(phone)}>🔄 Actualizar</a>
                <a className="link" onClick={handleCambiarTelefono}>Cambiar tel. ({phone.slice(-4)})</a>
              </div>
            </div>

            {/* Selector visual de vehículos (Pills con borde neón) */}
            {cars.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>
                  Tus vehículos registrados:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {cars.map((car) => {
                    const isSelected = (activeCar && activeCar.plate === car.plate);
                    return (
                      <button
                        key={car.plate}
                        type="button"
                        onClick={() => {
                          setSelectedPlate(car.plate);
                          setToast(null);
                        }}
                        style={{
                          width: 'auto',
                          flex: '0 0 auto',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 800,
                          background: isSelected ? 'linear-gradient(135deg, var(--aqua-neon), #0284c7)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#03141f' : 'var(--foam)',
                          border: isSelected ? '1.5px solid var(--aqua-neon)' : '1px solid var(--line)',
                          boxShadow: isSelected ? '0 0 14px rgba(0,210,255,0.45)' : 'none',
                          cursor: 'pointer',
                          marginBottom: 0
                        }}
                      >
                        🚗 {car.plate} ({car.stamps}/{MAX_STAMPS})
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowAddCarModal(!showAddCarModal)}
                    style={{
                      width: 'auto',
                      flex: '0 0 auto',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'transparent',
                      color: 'var(--aqua-soft)',
                      border: '1px dashed var(--aqua-neon)',
                      cursor: 'pointer',
                      marginBottom: 0
                    }}
                  >
                    + Nuevo auto
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,210,255,0.06)', border: '1px solid var(--line)', borderRadius: '14px', padding: '16px', marginBottom: 16 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--aqua-neon)', marginBottom: 6 }}>
                  ¡Bienvenido! Registra tu primer auto para tus sellos:
                </div>
                <form onSubmit={handleCrearVehiculo} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ej. Jetta Blanco, Sentra, Moto..."
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !newPlate.trim()}
                    style={{ width: 'auto', padding: '10px 16px', marginBottom: 0 }}
                  >
                    Registrar
                  </button>
                </form>
              </div>
            )}

            {/* Formulario desplegable para agregar nuevo vehículo */}
            {showAddCarModal && cars.length > 0 && (
              <form onSubmit={handleCrearVehiculo} style={{ display: 'flex', gap: '8px', marginBottom: 16, background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 12, border: '1px solid var(--line)' }}>
                <input
                  type="text"
                  placeholder="Nombre de otro vehículo (ej. Camioneta)"
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
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowAddCarModal(false)}
                  style={{ width: 'auto', padding: '10px 12px', marginBottom: 0 }}
                >
                  ✕
                </button>
              </form>
            )}

            {/* Nombre del vehículo seleccionado actualmente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--aqua-neon)' }}>
                {activeCar ? `🚗 ${activeCar.plate}` : 'Vehículo'}
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--gold-light)' }}>
                {currentStamps} de {MAX_STAMPS} sellos
              </span>
            </div>

            {/* LAS 6 GOTAS VISUALES CON EFECTO AGUA NEÓN */}
            <div className="drops" style={{ margin: '14px 0' }}>
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <svg
                  key={i}
                  className={`drop ${i < currentStamps ? 'filled' : ''}`}
                  viewBox="0 0 24 28"
                >
                  <defs>
                    <linearGradient id={`dropGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8FE2FF" />
                      <stop offset="60%" stopColor="#00D2FF" />
                      <stop offset="100%" stopColor="#0284C7" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z"
                    fill={i < currentStamps ? `url(#dropGrad-${i})` : 'rgba(0, 210, 255, 0.04)'}
                    stroke={i < currentStamps ? 'var(--aqua-neon)' : 'rgba(143,226,255,0.25)'}
                    strokeWidth="1.8"
                  />
                  {i < currentStamps && (
                    <circle cx="9" cy="14" r="2.2" fill="#FFFFFF" opacity="0.75" />
                  )}
                </svg>
              ))}
            </div>

            {/* Mensaje de estado / Premio */}
            {currentStamps >= MAX_STAMPS ? (
              <div className="reward-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>🎉</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--gold-light)' }}>
                      ¡LAVADO TOTALMENTE GRATIS!
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--foam)', marginTop: 2 }}>
                      Muéstrale esta pantalla al operador para canjear tu premio en este lavado.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: '4px 0 0' }}>
                Te faltan <strong>{MAX_STAMPS - currentStamps}</strong> {MAX_STAMPS - currentStamps === 1 ? 'lavado' : 'lavados'} para tu lavado gratis en este vehículo.
              </p>
            )}
          </div>

          {/* SEGUNDA TARJETA: REGISTRAR NUEVO LAVADO (Con botón hacia Promociones) */}
          <div className="card">
            <div className="label">
              <span>📷</span> Registrar nuevo lavado
            </div>
            <p className="sub" style={{ marginBottom: 14 }}>
              Escanea el código QR que te muestre el operador o escribe el código de 8 caracteres.
            </p>

            {/* BOTÓN PROMINENTE PARA IR A PROMOCIONES Y PAQUETES */}
            <button
              type="button"
              className="btn-gold"
              onClick={() => router.push('/paquetes')}
              style={{ marginBottom: 14 }}
            >
              ✨ Ver Paquetes y Promociones (¡6ª Lavada Gratis!)
            </button>

            {isScanning ? (
              <div style={{ marginBottom: 14 }}>
                <div
                  id="reader"
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: 'var(--ink)',
                    marginBottom: 10,
                    border: '1.5px solid var(--aqua-neon)'
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsScanning(false)}
                >
                  ✕ Cerrar cámara
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
                📷 Escanear código QR de lavado
              </button>
            )}

            <div style={{ margin: '14px 0 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700 }}>
              — O ingresa el código manual —
            </div>

            <form onSubmit={handleIniciarCodigoManual}>
              <input
                type="text"
                placeholder="Ej. ABCD-1234"
                value={manualInputCode}
                onChange={(e) => setManualInputCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-ghost"
                disabled={loading || !manualInputCode.trim()}
              >
                Registrar sello manual
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

