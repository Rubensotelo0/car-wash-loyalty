'use client';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const MAX_STAMPS = 6;
const TTL_MS = 90 * 1000;

export default function OperadorPage() {
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
        setOpToast({ msg: '✅ Código QR generado. Listo para escanear.', kind: '' });
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
      const res = await fetch(`/api/tarjeta?phone=${digits}&_t=${Date.now()}`);
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

  return (
    <div className="wrap">
      <h1>Panel del negocio</h1>
      <p className="sub">Genera un código QR dinámico para el cliente o busca su tarjeta por número telefónico.</p>

      {/* Sección Código QR */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="label" style={{ margin: 0 }}>Código de este lavado</div>
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
            Rotar cada 90s automático
          </label>
        </div>

        {token ? (
          <>
            <div className="qr-box">
              <QRCodeSVG value={qrFullUrl} size={180} bgColor="#FFFFFF" fgColor="#000000" level="M" />
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
                  background: secondsLeft > 20 ? 'var(--aqua)' : 'var(--coral)',
                  transition: 'width 0.25s linear'
                }} />
              </div>
            </div>
          </>
        ) : (
          <p className="sub">Sin código activo. Genera uno cuando termine el lavado.</p>
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
        <div className="label">Buscar cliente por teléfono</div>
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
            <div style={{ fontWeight: 600, marginBottom: '14px' }}>Vehículos de: {customerData.phone}</div>

            {(!customerData.cars || customerData.cars.length === 0) && (
              <p className="sub">Este cliente aún no tiene vehículos registrados.</p>
            )}

            {customerData.cars && customerData.cars.map((car) => (
              <div
                key={car.plate}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--aqua)', fontSize: '15px' }}>
                    🚗 {car.plate}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--aqua)' }}>
                    {car.stamps}/{MAX_STAMPS} sellos
                  </div>
                </div>

                {/* Gotas del vehículo */}
                <div className="drops" style={{ margin: '14px 0' }}>
                  {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                    <svg
                      key={i}
                      className={`drop ${i < car.stamps ? 'filled' : ''}`}
                      viewBox="0 0 24 28"
                    >
                      <path
                        d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z"
                        fill={i < car.stamps ? 'var(--aqua)' : 'none'}
                        stroke={i < car.stamps ? 'var(--aqua)' : 'rgba(143,226,255,0.35)'}
                        strokeWidth="1.6"
                      />
                    </svg>
                  ))}
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
                  <div className="reward" style={{ marginTop: 14 }}>
                    🎉 <strong>¡Lavado gratis disponible!</strong>
                    <button
                      className="btn-amber"
                      style={{ marginTop: 10 }}
                      onClick={() => setConfirmingPlate(car.plate)}
                    >
                      Canjear lavado gratis
                    </button>
                  </div>
                )}

                {confirmingPlate === car.plate && (
                  <div className="reward" style={{ marginTop: 14 }}>
                    Confirma en voz alta con el cliente:
                    <br />
                    <strong>¿Canjear lavado gratis para el vehículo "{car.plate}"?</strong>
                    <div className="row" style={{ marginTop: 10 }}>
                      <button
                        className="btn-amber"
                        onClick={() => confirmarCanje(car.plate)}
                        disabled={actionLoading}
                      >
                        Sí, entregar gratis
                      </button>
                      <button className="btn-ghost" onClick={() => setConfirmingPlate(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Formulario para agregar nuevo vehículo al cliente */}
            <form onSubmit={handleAgregarCarro} style={{ marginTop: '16px' }}>
              <div className="label">Agregar nuevo vehículo al cliente</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nombre (Ej. Jetta Blanco, Moto, etc.)"
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
