'use client';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function PaquetesPage() {
  const router = useRouter();

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
          Todo lo que tu auto necesita, en un solo servicio. Dejamos tu auto como nuevo.
        </p>
      </div>

      {/* Barra de Navegación Rápida */}
      <nav className="nav-tabs">
        <button
          type="button"
          className="nav-tab-btn"
          onClick={() => router.push('/')}
        >
          💧 Mi Tarjeta Digital
        </button>
        <button
          type="button"
          className="nav-tab-btn active"
        >
          ✨ Paquetes y Promos
        </button>
      </nav>

      {/* BANNER PROMOCIÓN ESTRELLA */}
      <div className="reward-banner" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>🎁</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--gold-light)', textShadow: '0 0 12px rgba(245,197,24,0.6)' }}>
              ¡TU 6ª LAVADA ES GRATIS!
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--foam)', marginTop: 2, opacity: 0.9 }}>
              Acumula 5 lavados en cualquiera de tus autos y el 6to te lo regalamos.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-gold"
          onClick={() => router.push('/')}
          style={{ marginTop: 14, marginBottom: 0, padding: '10px 16px', fontSize: '13px' }}
        >
          💧 Ver mis sellos acumulados
        </button>
      </div>

      {/* LISTADO DE PAQUETES */}

      {/* 1. PAQUETE EXPRESS ($300) */}
      <div className="package-card">
        <div className="package-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--aqua-neon)', letterSpacing: '0.1em' }}>
              ESENCIAL Y DETALLADO
            </span>
            <div className="package-title">CAR WASH EXPRESS</div>
          </div>
          <div className="package-price">$300</div>
        </div>

        {/* Sección Exterior */}
        <div className="service-section-title">
          <span>🚗</span> Exterior
        </div>
        <ul className="service-list">
          <li className="service-item"><span>🔹</span> Limpieza y tallado de llantas y rines</li>
          <li className="service-item"><span>🔹</span> Espuma activa (lavado a mano para evitar rayones en carrocería)</li>
          <li className="service-item"><span>🔹</span> Limpieza light en marcos de puertas</li>
          <li className="service-item"><span>🔹</span> Limpieza de cristales exteriores</li>
          <li className="service-item"><span>🔹</span> Secado sin rayar</li>
          <li className="service-item"><span>🔹</span> Acabado brillante en carrocería</li>
          <li className="service-item star"><span>⭐</span> <strong>NUEVO SERVICIO:</strong> Prelavado (remueve suciedad sin contacto)</li>
          <li className="service-item star"><span>⭐</span> Lavado de tolvas</li>
        </ul>

        {/* Sección Interior */}
        <div className="service-section-title" style={{ marginTop: 16 }}>
          <span>💺</span> Interior
        </div>
        <ul className="service-list">
          <li className="service-item"><span>🔹</span> Aspirado completo (tapetes de tela, asientos y tapicería)</li>
          <li className="service-item"><span>🔹</span> Limpieza de cristales interiores</li>
          <li className="service-item"><span>🔹</span> Tallado y limpieza en plásticos (tablero, puertas y tapetes)</li>
          <li className="service-item"><span>🌸</span> Aroma a escoger (preguntar opciones)</li>
        </ul>
      </div>

      {/* 2. PAQUETE PREMIUM ($550) - DESTACADO */}
      <div className="package-card highlight">
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'linear-gradient(135deg, var(--aqua-neon), #0284c7)',
          color: '#041724',
          fontSize: '10px',
          fontWeight: 900,
          letterSpacing: '0.08em',
          padding: '4px 14px',
          borderBottomLeftRadius: '12px',
          textTransform: 'uppercase',
          boxShadow: '0 0 14px rgba(0,210,255,0.6)'
        }}>
          Más Popular ⭐
        </div>

        <div className="package-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--aqua-neon)', letterSpacing: '0.1em' }}>
              PROTECCIÓN Y BRILLO
            </span>
            <div className="package-title">CAR WASH PREMIUM</div>
          </div>
          <div className="package-price">$550</div>
        </div>

        {/* Sección Exterior */}
        <div className="service-section-title">
          <span>🚗</span> Exterior
        </div>
        <ul className="service-list">
          <li className="service-item star"><span>⭐</span> <strong>TODO EL PAQUETE EXPRESS COMPLETO</strong></li>
          <li className="service-item"><span>✨</span> + Abrillantado en plásticos exteriores</li>
          <li className="service-item"><span>✨</span> + Eliminación de insectos por completo</li>
          <li className="service-item"><span>✨</span> + Limpieza profunda de marcos en puertas y cajuela</li>
          <li className="service-item star"><span>⭐</span> + Cera rápida de alta protección</li>
        </ul>

        {/* Sección Interior */}
        <div className="service-section-title" style={{ marginTop: 16 }}>
          <span>💺</span> Interior
        </div>
        <ul className="service-list">
          <li className="service-item star"><span>⭐</span> <strong>TODO EL PAQUETE EXPRESS COMPLETO</strong></li>
          <li className="service-item"><span>✨</span> + Limpieza y desinfección de tapetes</li>
          <li className="service-item"><span>✨</span> + Limpieza profunda y detallado de plásticos</li>
          <li className="service-item star"><span>⭐</span> + Hidratación y protección para piel</li>
          <li className="service-item"><span>🌸</span> + Aroma premium a escoger</li>
        </ul>
      </div>

      {/* 3. PAQUETE PREMIUM PLUS ($950) */}
      <div className="package-card premium-plus">
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'linear-gradient(135deg, var(--gold-light), var(--amber))',
          color: '#241400',
          fontSize: '10px',
          fontWeight: 900,
          letterSpacing: '0.08em',
          padding: '4px 14px',
          borderBottomLeftRadius: '12px',
          textTransform: 'uppercase',
          boxShadow: '0 0 14px rgba(245,197,24,0.6)'
        }}>
          Servicio Completo VIP 🔥
        </div>

        <div className="package-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold-light)', letterSpacing: '0.1em' }}>
              EXPERIENCIA TOTAL + MOTOR
            </span>
            <div className="package-title">PREMIUM PLUS</div>
          </div>
          <div className="package-price gold">$950</div>
        </div>

        <div className="service-section-title" style={{ color: 'var(--gold-light)' }}>
          <span>👑</span> Incluye Todo lo Anterior:
        </div>
        <ul className="service-list">
          <li className="service-item star"><span>⭐</span> <strong>TODO EL PAQUETE EXPRESS</strong></li>
          <li className="service-item star"><span>⭐</span> <strong>TODO EL PAQUETE PREMIUM COMPLETO</strong></li>
        </ul>

        {/* Sección Lavado de Motor */}
        <div className="service-section-title" style={{ marginTop: 16, color: 'var(--gold-light)' }}>
          <span>⚙️</span> Lavado Detallado de Motor:
        </div>
        <ul className="service-list">
          <li className="service-item"><span>⚡</span> Lavado de plásticos con agua a presión controlada</li>
          <li className="service-item"><span>⚡</span> Desengrasante especial en plásticos y cofre (por dentro)</li>
          <li className="service-item"><span>⚡</span> Secado minucioso de componentes</li>
          <li className="service-item star"><span>⭐</span> Acabado brillante en plásticos del motor</li>
          <li className="service-item star"><span>⭐</span> Eliminación completa de aceite y grasa acumulada</li>
        </ul>
      </div>

      {/* Botón inferior de retorno a tarjeta */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push('/')}
        >
          💧 Ir a mi Tarjeta de Lealtad
        </button>
      </div>
    </div>
  );
}
