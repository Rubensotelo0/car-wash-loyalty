'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, Check, Crown, Drop, InstagramLogo, Phone, SealCheck, Sparkle, Star, WhatsappLogo } from '@phosphor-icons/react';

const packages = [
  { name: 'Express', price: '$300', summary: 'El cuidado esencial para que tu auto vuelva a verse impecable.', exterior: ['Limpieza y tallado de llantas y rines', 'Espuma activa aplicada a mano', 'Limpieza de marcos y cristales', 'Secado sin rayar', 'Acabado brillante en carrocería'], interior: ['Aspirado completo', 'Limpieza de cristales interiores', 'Tallado de plásticos, tablero y tapetes', 'Aroma a escoger'], href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Express%20($300)%20a%20domicilio%20%F0%9F%9A%97' },
  { name: 'Premium', price: '$550', summary: 'Protección y detalle profundo para una presencia que se nota.', exterior: ['Incluye todo Express', 'Abrillantado en plásticos exteriores', 'Eliminación de insectos', 'Limpieza profunda de marcos y cajuela', 'Cera rápida de alta protección'], interior: ['Incluye todo Express', 'Desinfección de tapetes', 'Detallado profundo de plásticos', 'Hidratación y protección para piel', 'Aroma premium a escoger'], href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Premium%20($550)%20a%20domicilio%20%E2%AD%90', featured: true },
  { name: 'Premium Plus', price: '$950', summary: 'El servicio completo, incluido el detallado de motor.', exterior: ['Incluye todo Express y Premium', 'Lavado de plásticos con presión controlada', 'Desengrasante especializado en cofre y plásticos', 'Secado minucioso de componentes', 'Eliminación de aceite y grasa acumulada'], interior: ['Incluye todo Premium', 'Acabado brillante en plásticos del motor'], href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Premium%20Plus%20($950)%20con%20motor%20a%20domicilio%20%F0%9F%94%A5', premium: true },
];

function ServiceList({ title, items, Icon }) {
  return <section className="package-detail"><h3><Icon size={18} weight="bold" /> {title}</h3><ul>{items.map((item) => <li key={item}><Check size={16} weight="bold" /> {item}</li>)}</ul></section>;
}

export default function PaquetesPage() {
  const router = useRouter();
  return <main className="catalog-page">
    <header className="catalog-hero">
      <div className="catalog-brand"><Drop size={18} weight="fill" /> La Carpita</div>
      <div className="catalog-hero-copy"><p>Lavado a domicilio</p><h1>El brillo llega a tu puerta.</h1><span>Lavado profesional a domicilio, sin mover un solo auto.</span><div className="catalog-actions"><a href="https://wa.me/524421549668" target="_blank" rel="noopener noreferrer" className="catalog-primary"><WhatsappLogo size={20} weight="fill" /> Cotizar por WhatsApp</a><button type="button" onClick={() => router.push('/')} className="catalog-secondary"><SealCheck size={20} weight="bold" /> Ver mis sellos</button></div></div>
      <div className="catalog-hero-image"><Image src="/images/acabado.jpg" alt="Camioneta con acabado brillante después del servicio" fill priority sizes="(max-width: 680px) 100vw, 680px" /></div>
    </header>
    <section className="loyalty-strip"><Star size={22} weight="fill" /><div><strong>El sexto lavado va por nuestra cuenta.</strong><span>Acumula 5 servicios en tu tarjeta digital.</span></div><button type="button" onClick={() => router.push('/')} aria-label="Abrir tarjeta de lealtad"><ArrowRight size={20} weight="bold" /></button></section>
    <section className="catalog-intro"><p>Elige el nivel de cuidado</p><h2>Un servicio pensado alrededor de tu auto.</h2></section>
    <section className="package-menu" aria-label="Paquetes de lavado">{packages.map((service) => <article key={service.name} className={`service-sheet ${service.featured ? 'is-featured' : ''} ${service.premium ? 'is-premium' : ''}`}><div className="service-sheet-top"><div>{service.featured && <span className="service-mark"><Sparkle size={14} weight="fill" /> Recomendado</span>}{service.premium && <span className="service-mark"><Crown size={14} weight="fill" /> Servicio completo</span>}<h2>{service.name}</h2><p>{service.summary}</p></div><strong>{service.price}</strong></div><div className="service-columns"><ServiceList title="Exterior" items={service.exterior} Icon={Car} /><ServiceList title="Interior" items={service.interior} Icon={Sparkle} /></div><a href={service.href} target="_blank" rel="noopener noreferrer" className="service-cta">Solicitar {service.name} <ArrowRight size={18} weight="bold" /></a></article>)}</section>
    <section className="image-story"><div className="image-story-copy"><p>Hecho a domicilio</p><h2>Todo lo que tu auto necesita, en un solo servicio.</h2><span>Dejamos tu auto como nuevo.</span></div><figure className="image-story-main"><Image src="/images/espuma.jpg" alt="Espuma activa aplicada a una camioneta durante el servicio" fill sizes="(max-width: 680px) 100vw, 680px" /></figure><figure className="image-story-detail"><Image src="/images/productos.jpg" alt="Productos profesionales utilizados para el cuidado del auto" fill sizes="(max-width: 680px) 56vw, 360px" /></figure></section>
    <footer className="catalog-footer"><h2>¿Listo para agendar?</h2><p>Escríbenos o llámanos. Vamos hasta donde esté tu auto.</p><div className="contact-grid"><a href="https://wa.me/524421549668" target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} weight="fill" /><span>WhatsApp<br /><strong>442 154 9668</strong></span></a><a href="https://wa.me/524427190950" target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} weight="fill" /><span>WhatsApp<br /><strong>442 719 0950</strong></span></a><a href="https://www.instagram.com/car_wash_la_carpita" target="_blank" rel="noopener noreferrer"><InstagramLogo size={20} weight="fill" /><span>Instagram<br /><strong>@car_wash_la_carpita</strong></span></a><a href="tel:4421549668"><Phone size={20} weight="fill" /><span>Llamar<br /><strong>442 154 9668</strong></span></a></div></footer>
  </main>;
}
