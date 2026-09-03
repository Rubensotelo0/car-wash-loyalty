'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Drop, Gift } from '@phosphor-icons/react';

const MAX_STAMPS = 5;
const TTL_MS = 90 * 1000;

export default function OperadorPage() {
  const router = useRouter();
  // Autenticación de Operador
  const [authChecking, setAuthChecking] = useState(true);
  const [operator, setOperator] = useState(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados del Panel Operador
  const [token, setToken] = useState(null);
  const [issuedAt, setIssuedAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [opToast, setOpToast] = useState(null);
  const [origin, setOrigin] = useState('');
  const timerRef = useRef(null);

  const [phoneQuery, setPhoneQuery] = useState('');
  const [customerData, setCustomerData] = useState(null); // { phone, cars: [] }
  const [confirmingPlate, setConfirmingPlate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newPlate, setNewPlate] = useState('');

  // 1. Verificar sesión existente del operador
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/operador/verificar');
        const data = await res.json();
        if (data.authenticated && data.operator) {
          setOperator(data.operator);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!issuedAt) return;
      const remaining = Math.max(0, TTL_MS - (Date.now() - issuedAt));
      const secs = Math.ceil(remaining / 1000);
      setSecondsLeft(secs);

      if (remaining <= 0) {
        if (autoRotate) {
          generar(true);
        } else {
          setToken(null);
          setIssuedAt(null);
        }
      }
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [issuedAt, autoRotate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const clean = loginPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLoginError('Ingresa los 10 dígitos de tu número celular.');
      setLoginLoading(false);
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Ingresa tu contraseña de operador.');
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/operador/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Credenciales inválidas.');
        return;
      }

      setOperator(data.operator);
      setLoginPhone('');
      setLoginPassword('');
    } catch (err) {
      console.error('Error login:', err);
      setLoginError('Error de conexión con el servidor.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/operador/logout', { method: 'POST' });
      setOperator(null);
      setToken(null);
      setCustomerData(null);
    } catch (err) {
      console.error('Error logout:', err);
    }
  }

  async function generar(isAuto = false) {
    try {
      setActionLoading(true);
      setOpToast(null);
      const res = await fetch('/api/generar-codigo', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.token) {
        setOpToast({
          msg: data.error || 'No se pudo generar el código.',
          kind: 'err',
        });
        return;
      }

      setToken(data.token);
      setIssuedAt(Date.now());
      setSecondsLeft(90);
      if (!isAuto) {
        setOpToast({ msg: '✅ Código QR generado. Listo para que el cliente lo escanee.', kind: '' });
      }
    } catch (err) {
      console.error('Error al generar código:', err);
      setOpToast({ msg: 'Error de conexión con el servidor al generar código.', kind: 'err' });
    } finally {
      setActionLoading(false);
    }
  }

  async function anular() {
    if (!token) { setOpToast({ msg: 'No hay código activo.', kind: 'warn' }); return; }
    try {
      await fetch('/api/anular-codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      });
      setToken(null);
      setIssuedAt(null);
      setOpToast({ msg: 'Código anulado.', kind: 'warn' });
    } catch (err) {
      console.error('Error al anular:', err);
    }
  }

  async function buscarCliente() {
    const digits = phoneQuery.replace(/\D/g, '');
    if (digits.length < 10) {
      setOpToast({ msg: 'Escribe los 10 dígitos del número celular.', kind: 'err' });
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/tarjeta?phone=${digits}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      const data = await res.json();
      setCustomerData(data); // { phone, cars: [...] }
      setConfirmingPlate(null);
      setOpToast(null);
      setNewPlate('');
    } catch (err) {
      console.error('Error al buscar:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function sumarSelloManual(plate) {
    if (!customerData) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/sumar-sello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customerData.phone, plate }),
      });
      const data = await res.json();
      
      const updatedCars = customerData.cars.map(c => c.plate === plate ? { ...c, stamps: data.stamps } : c);
      setCustomerData({ ...customerData, cars: updatedCars });
      setOpToast({ msg: `✅ Sello manual sumado al vehículo "${plate}".`, kind: '' });
    } catch (err) {
      console.error('Error al sumar sello:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function deshacer(plate) {
    if (!customerData) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/deshacer-sello', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customerData.phone, plate }),
      });
      const data = await res.json();
      
      const updatedCars = customerData.cars.map(c => c.plate === plate ? { ...c, stamps: data.stamps } : c);
      setCustomerData({ ...customerData, cars: updatedCars });
      setOpToast({ msg: `Sello deshecho en vehículo "${plate}".`, kind: 'warn' });
    } catch (err) {
      console.error('Error al deshacer sello:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmarCanje(plate) {
    try {
      setActionLoading(true);
      const res = await fetch('/api/canjear-premio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customerData.phone, plate }),
      });
      const data = await res.json();
      
      const updatedCars = customerData.cars.map(c => c.plate === plate ? { ...c, stamps: data.stamps } : c);
      setCustomerData({ ...customerData, cars: updatedCars });
      setConfirmingPlate(null);
      setOpToast({ msg: `🎉 ¡Premio canjeado con éxito para "${plate}"! Tarjeta reseteada.`, kind: '' });
    } catch (err) {
      console.error('Error al canjear premio:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAgregarCarro(e) {
    e.preventDefault();
    if (!newPlate.trim() || !customerData) return;
    const upperPlate = newPlate.trim().toUpperCase();

    if (customerData.cars && customerData.cars.find(c => c.plate === upperPlate)) {
      setOpToast({ msg: 'Ese vehículo ya está registrado.', kind: 'warn' });
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/agregar-carro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customerData.phone, plate: upperPlate })
      });
      const data = await res.json();
      if (res.ok) {
        const updated = [...(customerData.cars || []), { phone: customerData.phone, plate: upperPlate, stamps: 0 }];
        setCustomerData({ ...customerData, cars: updated });
        setNewPlate('');
        setOpToast({ msg: `✅ Vehículo "${upperPlate}" agregado con éxito.`, kind: '' });
      } else {
        setOpToast({ msg: data.error || 'Error al agregar vehículo', kind: 'err' });
      }
    } catch(err) {
      console.error('Error al agregar carro:', err);
      setOpToast({ msg: 'Error al conectar con el servidor.', kind: 'err' });
    } finally {
      setActionLoading(false);
    }
  }

  const qrFullUrl = token && origin ? `${origin}/?code=${token}` : token || '';
  const progressPct = issuedAt ? Math.max(0, (secondsLeft / 90) * 100) : 0;

  // Estado de carga inicial
  if (authChecking) {
    return (
      <div className="wrap operator-page">
        <p className="sub" style={{ textAlign: 'center', marginTop: 40 }}>Verificando credenciales de operador...</p>
      </div>
    );
  }

  // PANTALLA 1: LOGIN DE OPERADOR (Si no está autenticado)
  if (!operator) {
    return (
      <div className="wrap operator-page">
        {/* Fondo con Burbujas Flotantes */}
        <div className="bubbles-container" aria-hidden="true">
          <div className="bubble" />
          <div className="bubble" />
          <div className="bubble" />
          <div className="bubble" />
          <div className="bubble" />
        </div>

        <div className="brand-header">
          <div className="brand-badge">
            <span>🔒</span> Acceso Restringido <span>⚙️</span>
          </div>
          <h1>La Carpita · Operador</h1>
          <p className="sub">Ingresa con tu número y clave de operador para acceder al panel.</p>
        </div>

        <div className="card card-glow">
          <div className="label">
            <span>🛡️</span> Identificación de Operador
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Número celular (10 dígitos)"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              disabled={loginLoading}
              autoFocus
            />
            <input
              type="password"
              placeholder="Contraseña de operador"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loginLoading}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loginLoading}
            >
              {loginLoading ? 'Verificando...' : '🔑 Iniciar Sesión en Panel'}
            </button>
          </form>

          {loginError && (
            <div className="toast err">
              {loginError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // PANTALLA 2: PANEL DE OPERADOR (Autenticado)
  return (
    <div className="wrap operator-page">
      {/* Fondo con Burbujas Flotantes */}
      <div className="bubbles-container" aria-hidden="true">
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
        <div className="bubble" />
      </div>

      {/* Barra Superior con datos de Operador y Cerrar Sesión */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5, 14, 21, 0.85)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>👤</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--aqua-neon)' }}>
              {operator.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Tel: {operator.phone}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost btn-danger"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', margin: 0 }}
        >
          Cerrar sesión
        </button>
      </div>

      <div className="brand-header">
        <h1>Panel del negocio</h1>
        <p className="sub" style={{ marginBottom: 16 }}>Genera un código QR dinámico para el cliente o busca su tarjeta por número telefónico.</p>
      </div>

      {/* Acceso Rápido al QR de Paquetes y Promociones */}
      <button
        type="button"
        className="btn-gold"
        onClick={() => router.push('/qr-paquetes')}
        style={{ marginBottom: 20 }}
      >
        📱 Ver y Descargar Código QR de Paquetes
      </button>

      {/* Sección Código QR (Sin marco blanco sobrante) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="label" style={{ margin: 0 }}>
            <span>⚡</span> Código de este lavado
          </div>
          <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => {
                setAutoRotate(e.target.checked);
                if (e.target.checked && !token) generar();
              }}
              style={{ width: 'auto', margin: 0 }}
            />
            Rotar cada 90s auto
          </label>
        </div>

        {token ? (
          <>
            {/* CONTENEDOR LIMPIO: Sin exceso de borde blanco alrededor */}
            <div className="qr-container-clean">
              <div className="qr-box">
                <QRCodeSVG value={qrFullUrl} size={190} bgColor="#FFFFFF" fgColor="#000000" level="M" />
              </div>
            </div>

            <div className="token">{token}</div>
            <div className="timer">
              Vence en <strong>{secondsLeft}s</strong>
              <div style={{
                height: '4px',
                background: 'rgba(143,226,255,0.15)',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: secondsLeft > 20 ? 'var(--aqua-neon)' : 'var(--coral)',
                  transition: 'width 0.25s linear'
                }} />
              </div>
            </div>
          </>
        ) : (
          <p className="sub" style={{ textAlign: 'center', padding: '16px 0' }}>
            Sin código activo. Toca el botón para generar el QR del lavado.
          </p>
        )}

        <button className="btn-primary" onClick={() => generar(false)}>
          {token ? '🔄 Generar nuevo código ahora' : '⚡ Generar código QR'}
        </button>

        {token && (
          <button className="btn-ghost btn-danger" onClick={anular}>
            Anular código actual
          </button>
        )}

        {opToast && <div className={`toast ${opToast.kind}`}>{opToast.msg}</div>}
      </div>

      {/* Sección Buscar Cliente */}
      <div className="card">
        <div className="label">
          <span>🔍</span> Buscar cliente por teléfono
        </div>
        <input
          inputMode="numeric"
          placeholder="Ej. 55 1234 5678"
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value)}
        />
        <button className="btn-primary" onClick={buscarCliente} disabled={actionLoading}>
          {actionLoading ? 'Buscando...' : 'Buscar tarjetas'}
        </button>

        {customerData && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 800, marginBottom: '14px', color: 'var(--aqua-neon)' }}>
              Vehículos registrados de: {customerData.phone}
            </div>

            {(!customerData.cars || customerData.cars.length === 0) && (
              <p className="sub">Este cliente aún no tiene vehículos registrados.</p>
            )}

            {customerData.cars && customerData.cars.map((car) => (
              <div
                key={car.plate}
                style={{
                  background: 'rgba(3, 7, 10, 0.75)',
                  border: '1.5px solid var(--line)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--aqua-neon)', fontSize: '16px' }}>
                    🚗 {car.plate}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: car.stamps >= MAX_STAMPS ? 'var(--gold-light)' : 'var(--aqua-soft)' }}>
                    {car.stamps >= MAX_STAMPS ? '🎉 ¡Lavado gratis listo!' : `${car.stamps}/${MAX_STAMPS} sellos`}
                  </div>
                </div>

                {/* 6 Casillas: 5 Gotas + 1 Casilla de Premio Especial */}
                <div className="stamp-meter" style={{ margin: '14px 0' }}>
                  {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                    <span key={i} className={`stamp ${i < car.stamps ? 'filled' : ''}`} title={`Sello ${i + 1}`}>
                      <Drop size={22} weight={i < car.stamps ? 'fill' : 'regular'} />
                    </span>
                  ))}
                  <span className={`stamp stamp-reward ${car.stamps >= MAX_STAMPS ? 'filled' : ''}`} title="6º Lavado Gratis">
                    <Gift size={20} weight={car.stamps >= MAX_STAMPS ? 'fill' : 'bold'} />
                  </span>
                </div>

                <div className="row" style={{ marginTop: '10px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => sumarSelloManual(car.plate)}
                    disabled={actionLoading || car.stamps >= MAX_STAMPS}
                  >
                    +1 Sello manual
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => deshacer(car.plate)}
                    disabled={actionLoading || car.stamps === 0}
                  >
                    -1 Deshacer
                  </button>
                </div>

                {car.stamps >= MAX_STAMPS && confirmingPlate !== car.plate && (
                  <div className="reward-banner" style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 900, color: 'var(--gold-light)' }}>
                      🎉 ¡Lavado gratis disponible!
                    </div>
                    <button
                      className="btn-gold"
                      style={{ marginTop: 10, marginBottom: 0 }}
                      onClick={() => setConfirmingPlate(car.plate)}
                    >
                      Canjear lavado gratis
                    </button>
                  </div>
                )}

                {confirmingPlate === car.plate && (
                  <div className="reward-banner" style={{ marginTop: 14 }}>
                    Confirma en voz alta con el cliente:
                    <br />
                    <strong>¿Canjear lavado gratis para "{car.plate}"?</strong>
                    <div className="row" style={{ marginTop: 12 }}>
                      <button
                        className="btn-gold"
                        onClick={() => confirmarCanje(car.plate)}
                        disabled={actionLoading}
                        style={{ marginBottom: 0 }}
                      >
                        Sí, entregar gratis
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => setConfirmingPlate(null)}
                        style={{ marginBottom: 0 }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Formulario para agregar nuevo vehículo al cliente */}
            <form onSubmit={handleAgregarCarro} style={{ marginTop: '16px' }}>
              <div className="label">
                <span>➕</span> Agregar nuevo vehículo al cliente
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nombre (Ej. Jetta Blanco, Moto...)"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 18px', marginBottom: 0 }}
                  disabled={actionLoading || !newPlate.trim()}
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
