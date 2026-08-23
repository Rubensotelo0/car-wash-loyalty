import './globals.css';

export const metadata = {
  title: 'La Carpita · Lealtad',
  description: 'Programa de lealtad del autolavado a domicilio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
