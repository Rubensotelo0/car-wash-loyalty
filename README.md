# La Carpita · Programa de lealtad

Next.js + Supabase. Traduce a producción la lógica que ya probamos en el prototipo:
código de un solo uso con expiración de 90s, tarjeta por número de celular sin
verificación por SMS, deshacer sello y canje de premio con confirmación verbal.

## 1. Crea el proyecto en Supabase
1. Ve a https://supabase.com y crea un proyecto gratis.
2. En el panel, abre **SQL Editor -> New query**, pega el contenido de
   `supabase/schema.sql` y dale **Run**. Esto crea las tablas `customers` y `codes`.
3. Ve a **Settings -> API** y copia:
   - **Project URL**
   - **service_role key** (no la "anon" — esta clave solo se usa del lado del servidor)

## 2. Configura las variables de entorno
```bash
cp .env.local.example .env.local
```
Abre `.env.local` y pega ahí la URL y la service role key.

## 3. Instala y corre
```bash
npm install
npm run dev
```

- Pantalla del cliente: http://localhost:3000
- Pantalla del negocio: http://localhost:3000/operador

## Cómo probarlo
1. Abre `/operador` en una pestaña y `/` en otra (o en tu celular, una vez que
   lo subas a Vercel y tengas una URL real).
2. En `/operador`, da clic en **Generar código**.
3. En `/`, escribe un número de celular, confirma, y teclea el código que
   apareció en `/operador`.
4. Repite hasta 6 veces para ver aparecer el premio.
5. En `/operador`, sección "Buscar cliente", busca ese mismo número para ver
   su tarjeta, deshacer un sello, o canjear el premio con la confirmación verbal.

## Qué sigue (no incluido todavía)
- **Escaneo por cámara**: hoy el cliente teclea el código a mano. El siguiente
  paso natural es agregar la librería `html5-qrcode` para leerlo con la cámara
  directo — la lógica de validación (`/api/validar-codigo`) no cambia nada,
  solo cómo se captura el texto del código.
- **Deploy**: sube este proyecto a GitHub y conéctalo a Vercel (vercel.com) para
  tener una URL pública real, en vez de localhost.
- **PWA instalable**: agregar un `manifest.json` para que el cliente pueda
  hacer "Agregar a inicio" en su iPhone.
