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
  const [customer, setCustomer] = useState(null); // { phone, stamps }
  const [confirming, setConfirming] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      const res = await fetch('/api/generar-codigo', { method: 'POST' });
      const data = await res.json();
      setToken(data.token);
      setIssuedAt(Date.now());
      setSecondsLeft(90);
      if (!isAuto) {
        setOpToast({ msg: 'Código QR generado. Listo para que el cliente lo escanee.', kind: '' });
      }
    } catch (err) {
      console.error('Error al generar código:', err);
      setOpToast({ msg: 'Error al conectar con la base de datos.', kind: 'err' });
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
      const res = await fetch(`/api/tarjeta?phone=${digits}`);
      const data = await res.json();
      setCustomer(data);
      setConfirming(false);
      setOpToast(null);
    } catch (err) {
      console.error('Error al buscar:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function sumarSelloManual() {
    if (!customer || customer.stamps >= MAX_STAMPS) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/sumar-sello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone }),
      });
      const data = await res.json();
      setCustomer({ ...customer, stamps: data.stamps });
      setOpToast({ msg: `✅ Sello manual sumado. Cliente ahora tiene ${data.stamps}/${MAX_STAMPS}.`, kind: '' });
    } catch (err) {
      console.error('Error al sumar sello:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function deshacer() {
    if (!customer || customer.stamps === 0) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/deshacer-sello', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customer.phone }),
      });
      const data = await res.json();
      setCustomer({ ...customer, stamps: data.stamps });
      setOpToast({ msg: `Sello deshecho. Cliente tiene ${data.stamps}/${MAX_STAMPS}.`, kind: 'warn' });
    } catch (err) {
      console.error('Error al deshacer sello:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmarCanje() {
    try {
      setActionLoading(true);
      const res = await fetch('/api/canjear-premio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customer.phone }),
      });
      const data = await res.json();
      setCustomer({ ...customer, stamps: data.stamps });
      setConfirming(false);
      setOpToast({ msg: '🎉 ¡Premio canjeado con éxito! Tarjeta reseteada a 0 sellos.', kind: '' });
    } catch (err) {
      console.error('Error al canjear premio:', err);
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
              <QRCodeSVG value={qrFullUrl} size={180} />
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
          {actionLoading ? 'Buscando...' : 'Buscar tarjeta'}
        </button>

        {customer && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Cel: {customer.phone}</div>
              <div style={{ fontSize: '13px', color: 'var(--aqua)', fontWeight: 700 }}>
                {customer.stamps}/{MAX_STAMPS} sellos
              </div>
            </div>

            <div className="drops" style={{ margin: '14px 0' }}>
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <svg key={i} className={`drop ${i < customer.stamps ? 'filled' : ''}`} viewBox="0 0 24 28">
                  <path
                    d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z"
                    fill={i < customer.stamps ? 'var(--aqua)' : 'none'}
                    stroke={i < customer.stamps ? 'var(--aqua)' : 'rgba(143,226,255,0.35)'}
                    strokeWidth="1.6"
                  />
                </svg>
              ))}
            </div>

            <div className="row" style={{ marginTop: '10px' }}>
              <button
                className="btn-primary"
                onClick={sumarSelloManual}
                disabled={actionLoading || customer.stamps >= MAX_STAMPS}
              >
                +1 Sello manual
              </button>
              <button
                className="btn-ghost"
                onClick={deshacer}
                disabled={actionLoading || customer.stamps === 0}
              >
                -1 Deshacer
              </button>
            </div>

            {customer.stamps >= MAX_STAMPS && !confirming && (
              <div className="reward" style={{ marginTop: 14 }}>
                🎉 <strong>¡Lavado gratis disponible!</strong>
                <button
                  className="btn-amber"
                  style={{ marginTop: 10 }}
                  onClick={() => setConfirming(true)}
                >
                  Canjear lavado gratis
                </button>
              </div>
            )}

            {confirming && (
              <div className="reward" style={{ marginTop: 14 }}>
                Confirma en voz alta con el cliente:
                <br />
                <strong>¿Tu número termina en {customer.phone.slice(-4)}?</strong>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn-amber" onClick={confirmarCanje} disabled={actionLoading}>
                    Sí, entregar gratis
                  </button>
                  <button className="btn-ghost" onClick={() => setConfirming(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

