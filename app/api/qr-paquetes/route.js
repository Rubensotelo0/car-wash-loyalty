import { generateCamaroQRSvg } from '../../../lib/camaroQrGenerator';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customUrl = searchParams.get('url');

    let targetUrl;
    if (customUrl) {
      targetUrl = customUrl;
    } else {
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
      const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      targetUrl = `${proto}://${host}/paquetes`;
    }

    const svg = generateCamaroQRSvg(targetUrl);

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error generando QR de paquetes:', err);
    return new Response('Error al generar QR', { status: 500 });
  }
}
