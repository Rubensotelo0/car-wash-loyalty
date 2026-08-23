"use client";
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ClientePage() {
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    // Configuramos el escáner para que busque el div con id "reader"
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        // Cuando escanea exitosamente, detenemos el escáner y guardamos el código
        setCodigo(decodedText);
        scanner.clear();
        validarCodigoEnBackend(decodedText);
      },
      (error) => {
        // Ignoramos los errores de lectura frame a frame
      }
    );

    // Limpiamos el escáner si el componente se desmonta
    return () => {
      scanner.clear().catch(error => console.error("Error al limpiar escáner", error));
    };
  }, []);

  const validarCodigoEnBackend = async (codigoEscaneado) => {
    // Aquí mandas a llamar tu endpoint /api/validar-codigo que ya tienes listo
    // usando fetch() con el codigoEscaneado
  };

  return (
    <main style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', color: 'var(--foam)' }}>
      <h1>Registrar Sello</h1>
      
      {/* Contenedor donde se montará la cámara */}
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      {/* Input de fallback manual por si falla la cámara */}
      <div>
        <input 
          type="text" 
          value={codigo} 
          onChange={(e) => setCodigo(e.target.value)} 
          placeholder="O ingresa el código manual"
        />
        <button onClick={() => validarCodigoEnBackend(codigo)}>Validar</button>
      </div>

      {mensaje && <p>{mensaje}</p>}
    </main>
  );
}