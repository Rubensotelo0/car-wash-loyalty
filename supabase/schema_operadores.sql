-- =================================================================
-- TABLA DE OPERADORES Y SEGURIDAD (Ejecutar en el SQL Editor de Supabase)
-- =================================================================

-- 1. Crear tabla de operadores
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT 'Operador',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (opcional si usas service_role_key)
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Política para permitir que el backend consulte operadores
CREATE POLICY "Permitir lectura interna de operadores" ON operators
  FOR SELECT USING (true);

-- 2. QUERY PARA INSERTAR TUS OPERADORES:
-- Cambia '5512345678' por el número celular del operador y 'mi_clave_secreta' por su contraseña.
-- Puedes ejecutar esta línea tantas veces como operadores quieras registrar:

INSERT INTO operators (phone, password, name)
VALUES ('5512345678', 'admin123', 'Operador Principal')
ON CONFLICT (phone) DO UPDATE 
SET password = EXCLUDED.password, is_active = true;

-- Consulta para verificar operadores registrados:
-- SELECT id, phone, name, is_active, created_at FROM operators;
