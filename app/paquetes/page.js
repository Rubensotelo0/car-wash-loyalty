'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, Check, Crown, Drop, GearSix, InstagramLogo, Phone, SealCheck, Sparkle, WhatsappLogo } from '@phosphor-icons/react';

const packages = [
  {
    name: 'Express',
    price: '$300',
    summary: 'El cuidado esencial para que tu auto vuelva a verse impecable.',
    sections: [
      {
        title: 'Exterior',
        Icon: Car,
        items: [
          'Limpieza y tallado de llantas y rines',
          'Espuma activa: lavado a mano para evitar rayones en carrocería',
          'Limpieza light en marcos de puertas',
          'Limpieza de cristales exteriores',
          'Secado sin rayar',
          'Acabado brillante en carrocería',
          'Prelavado: remueve suciedad sin contacto',
          'Lavado de tolvas',
        ],
      },
      {
        title: 'Interior',
        Icon: Sparkle,
        items: [
          'Aspirado completo: tapetes de tela, asientos y tapicería',
          'Limpieza de cristales interiores',
          'Tallado y limpieza de plásticos: tablero, puertas y tapetes',
          'Aroma a escoger (pregunta por las opciones)',
        ],
      },
    ],
    href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Express%20($300)%20a%20domicilio%20%F0%9F%9A%97',
  },
  {
    name: 'Premium',
    price: '$550',
    summary: 'Protección y detalle profundo para una presencia que se nota.',
    sections: [
      {
        title: 'Exterior',
        Icon: Car,
        items: [
          'Incluye el paquete Car Wash Express',
          'Abrillantado en plásticos',
          'Eliminación completa de insectos',
          'Limpieza completa de marcos en puertas y cajuela',
          'Cera rápida',
        ],
      },
      {
        title: 'Interior',
        Icon: Sparkle,
        items: [
          'Incluye el paquete Car Wash Express',
          'Limpieza y desinfección de tapetes',
          'Limpieza profunda de plásticos',
          'Hidratación para piel',
          'Aroma a escoger (pregunta por las opciones)',
        ],
      },
    ],
    href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Premium%20($550)%20a%20domicilio%20%E2%AD%90',
    featured: true,
  },
  {
    name: 'Premium Plus',
    price: '$950',
    summary: 'El servicio completo, incluido el detallado de motor.',
    sections: [
      {
        title: 'Paquetes incluidos',
        Icon: SealCheck,
        items: ['Paquete Car Wash Express', 'Paquete Car Wash Premium'],
      },
      {
        title: 'Lavado de motor',
        Icon: GearSix,
        items: [
          'Lavado de plásticos con agua a presión',
          'Desengrasante en plásticos y cofre, incluyendo la parte interior',
          'Secado',
          'Acabado brillante en plásticos del motor',
          'Eliminación completa de aceite y grasa',
        ],
      },
    ],
    href: 'https://wa.me/524421549668?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20detalles%20y%20agendar%20el%20paquete%20Premium%20Plus%20($950)%20con%20motor%20a%20domicilio%20%F0%9F%94%A5',
    premium: true,
  },
];

function ServiceList({ title, items, Icon }) {
  return <section className="package-detail"><h3><Icon size={18} weight="bold" /> {title}</h3><ul>{items.map((item) => <li key={item}><Check size={16} weight="bold" /> {item}</li>)}</ul></section>;
}

export default function PaquetesPage() {
  const router = useRouter();
  return <main className="catalog-page">
    <header className="catalog-hero">
      <div className="catalog-brand"><Drop size={18} weight="fill" /> La Carpita</div>
      <div className="catalog-hero-copy"><p>Lavado a domicilio</p><h1><span>Todo lo que tu auto necesita,</span><strong>en un solo servicio.</strong></h1><span>Dejamos tu auto como nuevo.</span><div className="catalog-actions"><a href="https://wa.me/524421549668" target="_blank" rel="noopener noreferrer" className="catalog-primary"><WhatsappLogo size={20} weight="fill" /> Cotizar por WhatsApp</a><button type="button" onClick={() => router.push('/')} className="catalog-secondary"><SealCheck size={20} weight="bold" /> Ver mis sellos</button></div></div>
      <div className="catalog-hero-image"><Image src="/images/acabado.jpg" alt="Camioneta con acabado brillante después del servicio" fill priority sizes="(max-width: 680px) 100vw, 680px" /></div>
    </header>
    <section className="catalog-intro"><p>Elige el nivel de cuidado</p><h2>Un servicio pensado alrededor de tu auto.</h2></section>
    <section className="package-menu" aria-label="Paquetes de lavado">{packages.map((service) => <article key={service.name} className={`service-sheet ${service.featured ? 'is-featured' : ''} ${service.premium ? 'is-premium' : ''}`}><div className="service-sheet-top"><div>{service.featured && <span className="service-mark"><Sparkle size={14} weight="fill" /> Recomendado</span>}{service.premium && <span className="service-mark"><Crown size={14} weight="fill" /> Servicio completo</span>}<h2>{service.name}</h2><p>{service.summary}</p></div><strong>{service.price}</strong></div><div className="service-columns">{service.sections.map((section) => <ServiceList key={section.title} title={section.title} items={section.items} Icon={section.Icon} />)}</div><a href={service.href} target="_blank" rel="noopener noreferrer" className="service-cta">Solicitar {service.name} <ArrowRight size={18} weight="bold" /></a></article>)}</section>
    <section className="image-story"><div className="image-story-copy"><p>Químicos profesionales</p><h2>Protección que se nota en cada acabado.</h2><span>Seleccionamos productos especializados para limpiar, proteger y devolver el brillo sin maltratar la pintura.</span></div><figure className="image-story-main"><Image src="/images/productos.jpg" alt="Productos profesionales utilizados para el cuidado del auto" fill sizes="(max-width: 680px) 100vw, 680px" /></figure></section>
    <footer className="catalog-footer"><h2>¿Listo para agendar?</h2><p>Escríbenos o llámanos. Vamos hasta donde esté tu auto.</p><div className="contact-grid"><a href="https://wa.me/524421549668" target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} weight="fill" /><span>WhatsApp<br /><strong>442 154 9668</strong></span></a><a href="https://wa.me/524427190950" target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} weight="fill" /><span>WhatsApp<br /><strong>442 719 0950</strong></span></a><a href="https://www.instagram.com/car_wash_la_carpita" target="_blank" rel="noopener noreferrer"><InstagramLogo size={20} weight="fill" /><span>Instagram<br /><strong>@car_wash_la_carpita</strong></span></a><a href="tel:4421549668"><Phone size={20} weight="fill" /><span>Llamar<br /><strong>442 154 9668</strong></span></a></div></footer>
  </main>;
}
