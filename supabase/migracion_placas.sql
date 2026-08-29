-- 1. Eliminar la foreign key de codes (si existe)
ALTER TABLE codes DROP CONSTRAINT IF EXISTS codes_used_by_fkey;

-- 2. Eliminar la primary key de customers
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_pkey CASCADE;

-- 3. Agregar la columna plate a customers (con valor por defecto 'GENERAL' para no perder datos)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS plate text NOT NULL DEFAULT 'GENERAL';

-- 4. Establecer la nueva primary key compuesta por teléfono y placa
ALTER TABLE customers ADD PRIMARY KEY (phone, plate);

-- 5. Agregar la columna para la placa en la tabla codes
ALTER TABLE codes ADD COLUMN IF NOT EXISTS used_by_plate text;

-- 6. Actualizar los códigos ya usados para que apunten a la placa 'GENERAL'
UPDATE codes SET used_by_plate = 'GENERAL' WHERE used_by IS NOT NULL;

-- 7. Restaurar la relación (foreign key)
ALTER TABLE codes ADD CONSTRAINT codes_used_by_fkey FOREIGN KEY (used_by, used_by_plate) REFERENCES customers(phone, plate);
