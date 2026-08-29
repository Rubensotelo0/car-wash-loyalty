import './globals.css';

export const metadata = {
  title: 'La Carpita · Lealtad',
  description: 'Programa de lealtad del autolavado a domicilio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'La Carpita',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09151d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
