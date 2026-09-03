'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Html5Qrcode } from 'html5-qrcode';
import { persistPhone, getStoredPhoneSync, getIndexedDBPhone, clearPersistedPhone } from '../lib/storage';
import { ArrowClockwise, ArrowRight, Camera, Car, CheckCircle, Drop, Gift, HouseLine, Keyboard, Phone, Plus, SealCheck, Storefront, X } from '@phosphor-icons/react';

const MAX_STAMPS = 5;

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
          setToast({ msg: 'Código detectado. Ingresa tu número celular para continuar.', kind: 'warn' });
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
        setToast({ msg: `Vehículo "${upperPlate}" registrado con éxito.`, kind: '' });
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
          ? `¡Tu vehículo "${cleanPlate}" completó los 5 sellos! Tu 6º lavado es totalmente gratis.`
          : `Sello sumado a "${cleanPlate}". Ahora tiene ${data.stamps} de ${MAX_STAMPS} sellos.`,
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
    <div className="wrap customer-page">
      <header className="loyalty-hero">
        <Image
          src="/images/espuma.jpg"
          alt="Camioneta cubierta de espuma durante un lavado a domicilio"
          fill
          priority
          sizes="(max-width: 520px) 100vw, 520px"
        />
        <div className="loyalty-hero-content">
          <div className="loyalty-wordmark">
            <Drop size={20} weight="fill" />
            <span>Car Wash <strong>La Carpita</strong></span>
          </div>
          <h1>
            <span>5 lavados.</span>
            <strong>El sexto es gratis.</strong>
          </h1>
          <span className="hero-home"><HouseLine size={17} weight="bold" /> Servicio a domicilio</span>
        </div>
      </header>

      {/* Barra de Navegación de Pestañas */}
      <nav className="nav-tabs">
        <button
          type="button"
          className="nav-tab-btn active"
        >
          <SealCheck size={18} weight="bold" /> Mi tarjeta
        </button>
        <button
          type="button"
          className="nav-tab-btn"
          onClick={() => router.push('/paquetes')}
        >
          <Storefront size={18} weight="bold" /> Paquetes
        </button>
      </nav>

      {!phone ? (
        /* Pantalla 1: Ingreso de Teléfono */
        <div className="card card-glow access-panel">
          <div className="section-title"><div><Drop size={22} weight="fill" /><span>Consulta tus sellos</span></div><p>Tu número es tu cuenta digital.</p></div>
          <form onSubmit={handleGuardarTelefono}>
            <label htmlFor="customer-phone">Número celular</label>
            <input
              id="customer-phone"
              type="tel"
              inputMode="numeric"
              placeholder="Ej. 55 1234 5678"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {activeCodeToClaim ? <><SealCheck size={19} weight="bold" /> Guardar y reclamar sello</> : <><ArrowRight size={19} weight="bold" /> Abrir mi tarjeta</>}
            </button>
          </form>

          {/* Botón rápido para consultar promociones */}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => router.push('/paquetes')}
          >
            <Storefront size={18} weight="bold" /> Consultar paquetes
          </button>

          {toast && <div className={`toast ${toast.kind}`} role="status">{toast.msg}</div>}
        </div>
      ) : (
        /* Pantalla 2: Vista Principal del Cliente */
        <>
          {/* MODAL / SECCIÓN DE PREGUNTA: ¿A QUÉ CARRO SUMAR EL CÓDIGO? */}
          {activeCodeToClaim && (
            <div className="card claim-panel">
              <div className="claim-bar">
                <span><CheckCircle size={17} weight="fill" /> Código listo: {activeCodeToClaim}</span>
                <button type="button" className="icon-button" onClick={() => setActiveCodeToClaim(null)} aria-label="Cancelar código">
                  <X size={18} weight="bold" />
                </button>
              </div>

              <h2>
                ¿A cuál de tus autos le sumamos este sello?
              </h2>
              <p className="sub">
                Elige un vehículo registrado o añade uno nuevo.
              </p>

              {/* Botones de selección de vehículos existentes */}
              {cars.length > 0 && (
                <div className="claim-vehicles">
                  {cars.map((car) => (
                    <button
                      key={car.plate}
                      type="button"
                      onClick={() => handleAsignarSelloACarro(car.plate)}
                      disabled={loading || car.stamps >= MAX_STAMPS}
                      className="claim-vehicle"
                    >
                      <span><Car size={18} weight="bold" /> {car.plate}</span>
                      <span>
                        {car.stamps >= MAX_STAMPS ? 'Premio disponible' : `${car.stamps}/${MAX_STAMPS} sellos`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Opción de asignar a un vehículo nuevo */}
              <div className={`claim-new-vehicle ${cars.length > 0 ? 'has-vehicles' : ''}`}>
                <div className="field-hint">
                  {cars.length > 0 ? 'También puedes sumar a un vehículo nuevo' : 'Escribe el nombre de tu vehículo para sumarle el sello:'}
                </div>
                <form onSubmit={handleAsignarSelloANuevoCarro} className="inline-form">
                  <input
                    type="text"
                    placeholder="Ej. Jetta, Sentra, Moto..."
                    value={newCarForCode}
                    onChange={(e) => setNewCarForCode(e.target.value.toUpperCase())}
                    className="uppercase-input"
                    aria-label="Nombre del vehículo nuevo"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !newCarForCode.trim()}
                  >
                    Sumar sello
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TARJETA DE LEALTAD Y GOTAS */}
          <div className="card loyalty-panel">
            <div className="account-actions">
              <button type="button" onClick={() => fetchTarjetas(phone)} className={loading ? 'is-loading' : ''} disabled={loading}>
                <ArrowClockwise size={20} weight="bold" />
                <span>{loading ? 'Actualizando...' : 'Actualizar sellos'}</span>
              </button>
              <button type="button" onClick={handleCambiarTelefono}>
                <Phone size={20} weight="bold" />
                <span>Cambiar número</span>
              </button>
            </div>

            {/* Selector visual de vehículos (Pills con borde neón) */}
            {cars.length > 0 ? (
              <div className="vehicle-area">
                <div className="field-hint">
                  Tus vehículos
                </div>
                <div className="vehicle-selector">
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
                        className={`vehicle-chip ${isSelected ? 'active' : ''}`}
                      >
                        <Car size={17} weight="bold" /> {car.plate} <span>{car.stamps >= MAX_STAMPS ? '🎁 Gratis' : `${car.stamps}/${MAX_STAMPS}`}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowAddCarModal(!showAddCarModal)}
                    className="vehicle-chip add"
                  >
                    <Plus size={17} weight="bold" /> Nuevo auto
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-vehicle">
                <Car size={27} weight="duotone" />
                <div><strong>Registra tu primer vehículo</strong><span>Así podremos guardar sus lavados por separado.</span></div>
                <form onSubmit={handleCrearVehiculo} className="inline-form">
                  <input
                    type="text"
                    placeholder="Ej. Jetta Blanco, Sentra, Moto..."
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    className="uppercase-input"
                    aria-label="Nombre de tu vehículo"
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !newPlate.trim()}
                  >
                    Registrar
                  </button>
                </form>
              </div>
            )}

            {/* Formulario desplegable para agregar nuevo vehículo */}
            {showAddCarModal && cars.length > 0 && (
              <form onSubmit={handleCrearVehiculo} className="inline-form add-vehicle-form">
                <input
                  type="text"
                  placeholder="Nombre de otro vehículo (ej. Camioneta)"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  className="uppercase-input"
                  aria-label="Nombre del nuevo vehículo"
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !newPlate.trim()}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowAddCarModal(false)}
                  aria-label="Cerrar formulario"
                >
                  <X size={18} weight="bold" />
                </button>
              </form>
            )}

            <div className="loyalty-summary">
              <span><Car size={20} weight="bold" /> {activeCar ? activeCar.plate : 'Vehículo'}</span>
              <strong>{currentStamps >= MAX_STAMPS ? '¡Premio listo!' : `${currentStamps}/${MAX_STAMPS} sellos`}</strong>
            </div>

            <div className="drops stamp-meter" aria-label={`${currentStamps} de ${MAX_STAMPS} sellos`}>
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <span key={i} className={`stamp ${i < currentStamps ? 'filled' : ''}`} title={`Sello ${i + 1}`}>
                  <Drop size={26} weight={i < currentStamps ? 'fill' : 'regular'} />
                </span>
              ))}
              <span className={`stamp stamp-reward ${currentStamps >= MAX_STAMPS ? 'filled' : ''}`} title="6º Lavado Gratis">
                <Gift size={24} weight={currentStamps >= MAX_STAMPS ? 'fill' : 'bold'} />
              </span>
            </div>

            {currentStamps >= MAX_STAMPS ? (
              <div className="reward-banner reward-content">
                <div>
                  <Gift size={29} weight="fill" />
                  <div>
                    <strong>6º Lavado totalmente gratis</strong>
                    <span>Tu sexto lavado va por nuestra cuenta. Muéstrale esta pantalla al operador para canjearlo.</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="progress-copy">Faltan <strong>{MAX_STAMPS - currentStamps}</strong> {MAX_STAMPS - currentStamps === 1 ? 'lavado' : 'lavados'} para tu lavado gratis.</p>
            )}
          </div>

          {/* Registro de lavado: el escáner es la acción principal de la sección. */}
          <div className="card wash-panel">
            <div className="section-title">
              <div><Camera size={21} weight="bold" /><span>Registrar lavado</span></div>
            </div>

            {isScanning ? (
              <div className="scanner-frame">
                <div id="reader" />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsScanning(false)}
                >
                  <X size={18} weight="bold" /> Cerrar cámara
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
                <Camera size={20} weight="bold" /> Escanear código QR
              </button>
            )}

            <div className="manual-divider">
              <Keyboard size={17} weight="bold" />
              <span>O usar código</span>
            </div>

            <form onSubmit={handleIniciarCodigoManual} className="manual-entry">
              <label htmlFor="manual-wash-code">Código de lavado</label>
              <input
                id="manual-wash-code"
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
                <SealCheck size={18} weight="bold" /> Registrar sello
              </button>
            </form>

            {toast && <div className={`toast ${toast.kind}`} role="status">{toast.msg}</div>}

            <button type="button" className="packages-link" onClick={() => router.push('/paquetes')}>
              <Storefront size={22} weight="bold" />
              <strong>Ver paquetes</strong>
              <ArrowRight size={19} weight="bold" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientePage() {
  return (
    <Suspense fallback={<div className="wrap customer-page"><p className="sub">Cargando tarjeta...</p></div>}>
      <ClientePageContent />
    </Suspense>
  );
}
