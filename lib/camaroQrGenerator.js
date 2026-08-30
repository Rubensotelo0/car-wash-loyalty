import QRCode from 'qrcode';

export function generateCamaroQRSvg(url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const size = qr.modules.size;

  const margin = 4;
  const totalGrid = size + margin * 2;
  const cellSize = 20;
  const viewBoxSize = totalGrid * cellSize;

  const centerStartRow = Math.floor(size * 0.32);
  const centerEndRow = Math.floor(size * 0.68);
  const centerStartCol = Math.floor(size * 0.20);
  const centerEndCol = Math.floor(size * 0.80);

  function isFinderPattern(r, c) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  }

  function isCamaroCenter(r, c) {
    return r >= centerStartRow && r <= centerEndRow && c >= centerStartCol && c <= centerEndCol;
  }

  let dotsSvg = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinderPattern(r, c)) continue;
      if (isCamaroCenter(r, c)) continue;

      const isDark = qr.modules.get(r, c);
      if (isDark) {
        const x = (c + margin) * cellSize + cellSize / 2;
        const y = (r + margin) * cellSize + cellSize / 2;
        const radius = cellSize * 0.42;

        const distToCenter = Math.hypot(r - size / 2, c - size / 2);
        const isCamaroGlow = distToCenter < size * 0.42;
        const color = isCamaroGlow ? '#00D2FF' : '#071520';

        dotsSvg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" />\n`;
      }
    }
  }

  function renderFinder(col, row) {
    const x = (col + margin) * cellSize;
    const y = (row + margin) * cellSize;
    const s = 7 * cellSize;

    return `
      <!-- Finder Pattern -->
      <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${cellSize * 1.2}" fill="#00D2FF" />
      <rect x="${x + cellSize}" y="${y + cellSize}" width="${s - cellSize * 2}" height="${s - cellSize * 2}" rx="${cellSize}" fill="#FFFFFF" />
      <rect x="${x + cellSize * 2}" y="${y + cellSize * 2}" width="${s - cellSize * 4}" height="${s - cellSize * 4}" rx="${cellSize * 0.8}" fill="#04121C" />
      <circle cx="${x + s / 2}" cy="${y + s / 2}" r="${cellSize * 0.8}" fill="#00D2FF" />
    `;
  }

  const findersSvg = `
    ${renderFinder(0, 0)}
    ${renderFinder(size - 7, 0)}
    ${renderFinder(0, size - 7)}
  `;

  const carBoxX = (centerStartCol + margin - 0.5) * cellSize;
  const carBoxY = (centerStartRow + margin - 0.5) * cellSize;
  const carBoxW = (centerEndCol - centerStartCol + 2) * cellSize;
  const carBoxH = (centerEndRow - centerStartRow + 2) * cellSize;

  const camaroCenterSvg = `
    <!-- Fondo blanco de protección para el auto central -->
    <rect x="${carBoxX}" y="${carBoxY}" width="${carBoxW}" height="${carBoxH}" rx="${cellSize}" fill="#FFFFFF" stroke="#00D2FF" stroke-width="4" filter="url(#carGlow)" />
    
    <!-- Silueta e Ilustración del Chevrolet Camaro -->
    <g transform="translate(${carBoxX + carBoxW * 0.05}, ${carBoxY + carBoxH * 0.12}) scale(${carBoxW * 0.9 / 200})">
      <!-- Sombra inferior -->
      <ellipse cx="100" cy="98" rx="88" ry="8" fill="#E2E8F0" />
      
      <!-- Chasis y Carrocería del Camaro -->
      <path d="M 22 84 L 28 66 Q 34 54 48 50 L 76 46 L 98 32 Q 106 28 126 28 L 148 30 Q 162 33 170 42 L 184 48 Q 192 56 194 66 L 196 82 Q 192 88 184 88 L 168 88 Q 164 78 152 78 Q 140 78 136 88 L 68 88 Q 64 78 52 78 Q 40 78 36 88 Z" fill="#041522" stroke="#00D2FF" stroke-width="4" />
      
      <!-- Cabina / Parabrisas y Ventanas -->
      <path d="M 82 46 L 102 34 L 142 34 L 160 44 L 142 46 Z" fill="#00D2FF" opacity="0.85" />
      <path d="M 104 36 L 138 36 L 138 45 L 88 45 Z" fill="#FFFFFF" opacity="0.6" />
      
      <!-- Cofre con toma de aire (Cowl induction) -->
      <path d="M 46 54 L 84 50 L 80 56 L 44 58 Z" fill="#00D2FF" opacity="0.9" />
      <path d="M 44 58 L 78 56 L 76 60 L 42 62 Z" fill="#030C13" />

      <!-- Parrilla agresiva y faros LED -->
      <rect x="24" y="68" width="168" height="12" rx="4" fill="#03090F" />
      <path d="M 28 69 L 46 69 L 42 74 L 26 73 Z" fill="#00D2FF" />
      <circle cx="34" cy="71" r="2.5" fill="#FFFFFF" />
      <path d="M 172 69 L 154 69 L 158 74 L 174 73 Z" fill="#00D2FF" />
      <circle cx="166" cy="71" r="2.5" fill="#FFFFFF" />
      
      <!-- Logo Chevrolet Bowtie Dorado -->
      <path d="M 94 71 L 106 71 L 106 69 L 112 69 L 112 71 L 114 71 L 114 74 L 108 74 L 108 76 L 102 76 L 102 74 L 94 74 Z" fill="#F5C518" stroke="#D97706" stroke-width="0.8" />
      
      <!-- Ruedas y Rines Deportivos -->
      <circle cx="152" cy="86" r="14" fill="#03080C" stroke="#00D2FF" stroke-width="2" />
      <circle cx="152" cy="86" r="8" fill="#1E293B" stroke="#F1F5F9" stroke-width="1.5" />
      <circle cx="152" cy="86" r="3" fill="#00D2FF" />
      <circle cx="52" cy="86" r="14" fill="#03080C" stroke="#00D2FF" stroke-width="2" />
      <circle cx="52" cy="86" r="8" fill="#1E293B" stroke="#F1F5F9" stroke-width="1.5" />
      <circle cx="52" cy="86" r="3" fill="#00D2FF" />

      <!-- Texto Camaro debajo de la silueta -->
      <text x="100" y="112" font-family="system-ui, sans-serif" font-weight="900" font-size="14" letter-spacing="3" fill="#041522" text-anchor="middle">
        CAMARO
      </text>
    </g>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize + 70}" width="800" height="880">
  <defs>
    <filter id="carGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#00D2FF" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="${viewBoxSize}" height="${viewBoxSize + 70}" rx="24" fill="#FFFFFF" />

  <g transform="translate(${viewBoxSize / 2}, 36)">
    <text text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#04121C" letter-spacing="1.5">
      CAR WASH LA CARPITA
    </text>
  </g>

  <g transform="translate(0, 10)">
    ${findersSvg}
    ${dotsSvg}
    ${camaroCenterSvg}
  </g>

  <g transform="translate(${viewBoxSize / 2}, ${viewBoxSize + 48})">
    <text text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#0084C7" letter-spacing="1">
      ✨ ESCANEA PARA VER PAQUETES Y PROMOS ✨
    </text>
    <text text-anchor="middle" y="16" font-family="monospace" font-weight="600" font-size="11" fill="#64748B">
      ${url}
    </text>
  </g>
</svg>
`;
}
