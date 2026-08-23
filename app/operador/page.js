'use client';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const MAX_STAMPS = 6;
const TTL_MS = 90 * 1000;

export default function OperadorPage() {
  const [token, setToken] = useState(null);
  const [issuedAt, setIssuedAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [opToast, setOpToast] = useState(null);
  const timerRef = useRef(null);

  const [phoneQuery, setPhoneQuery] = useState('');
  const [customer, setCustomer] = useState(null); // { phone, stamps }
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!issuedAt) return;
      const remaining = Math.max(0, TTL_MS - (Date.now() - issuedAt));
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) { setToken(null); setIssuedAt(null); }
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [issuedAt]);

  async function generar() {
    const res = await fetch('/api/generar-codigo', { method: 'POST' });
    const data = await res.json();
    setToken(data.token);
    setIssuedAt(Date.now());
    setOpToast({ msg: 'Código listo. Pídele al cliente que lo escriba en su pantalla.', kind: '' });
  }

  async function anular() {
    if (!token) { setOpToast({ msg: 'No hay código activo.', kind: 'warn' }); return; }
    await fetch('/api/anular-codigo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    });
    setToken(null); setIssuedAt(null);
    setOpToast({ msg: 'Código anulado.', kind: 'warn' });
  }

  async function buscarCliente() {
    const digits = phoneQuery.replace(/\D/g, '');
    if (digits.length < 10) { alert('Escribe los 10 dígitos.'); return; }
    const res = await fetch(`/api/tarjeta?phone=${digits}`);
    const data = await res.json();
    setCustomer(data);
    setConfirming(false);
  }

  async function deshacer() {
    if (!customer || customer.stamps === 0) return;
    const res = await fetch('/api/deshacer-sello', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customer.phone }),
    });
    const data = await res.json();
    setCustomer({ ...customer, stamps: data.stamps });
  }

  async function confirmarCanje() {
    const res = await fetch('/api/canjear-premio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customer.phone }),
    });
    const data = await res.json();
    setCustomer({ ...customer, stamps: data.stamps });
    setConfirming(false);
  }

  return (
    <div className="wrap">
      <h1>Panel del negocio</h1>
      <p className="sub">Genera un código por cada lavado terminado, y busca a un cliente para corregir o canjear su premio.</p>

      <div className="card">
        <div className="label">Código de este lavado</div>
        {token ? (
          <>
            <div className="qr-box"><QRCodeSVG value={token} size={160} /></div>
            <div className="token">{token}</div>
            <div className="timer">vence en {secondsLeft}s</div>
          </>
        ) : (
          <p className="sub">Sin código activo. Genera uno cuando termine el lavado.</p>
        )}
        <button className="btn-primary" onClick={generar}>{token ? 'Generar nuevo código' : 'Generar código'}</button>
        <button className="btn-ghost btn-danger" onClick={anular}>Anular código actual</button>
        {opToast && <div className={`toast ${opToast.kind}`}>{opToast.msg}</div>}
      </div>

      <div className="card">
        <div className="label">Buscar cliente</div>
        <input inputMode="numeric" placeholder="55 1234 5678" value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value)} />
        <button className="btn-primary" onClick={buscarCliente}>Buscar tarjeta</button>

        {customer && (
          <>
            <div className="drops">
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <svg key={i} className={`drop ${i < customer.stamps ? 'filled' : ''}`} viewBox="0 0 24 28">
                  <path d="M12 1C12 1 3 12.5 3 18.5C3 23.7 7.3 27 12 27C16.7 27 21 23.7 21 18.5C21 12.5 12 1 12 1Z"
                    fill={i < customer.stamps ? 'var(--aqua)' : 'none'}
                    stroke={i < customer.stamps ? 'var(--aqua)' : 'rgba(143,226,255,0.35)'} strokeWidth="1.6" />
                </svg>
              ))}
            </div>
            <p className="sub" style={{ margin: '0 0 10px' }}>{customer.stamps}/{MAX_STAMPS} sellos</p>
            <button className="btn-ghost" onClick={deshacer}>Deshacer último sello</button>

            {customer.stamps >= MAX_STAMPS && !confirming && (
              <div className="reward">
                🎉 Lavado gratis disponible
                <button className="btn-amber" style={{ marginTop: 10 }} onClick={() => setConfirming(true)}>Canjear</button>
              </div>
            )}
            {confirming && (
              <div className="reward">
                Confirma en voz alta: ¿tu número termina en {customer.phone.slice(-4)}?
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn-amber" onClick={confirmarCanje}>Sí, entregar</button>
                  <button className="btn-ghost" onClick={() => setConfirming(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
