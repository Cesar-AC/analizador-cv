-- Script para hacer admin al usuario cacuna@unitru.edu.pe
-- Ejecuta esto en Supabase Dashboard → SQL Editor

-- Paso 1: Ver el usuario actual
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'cacuna@unitru.edu.pe';

-- Paso 2: Si el usuario existe, actualizar su role a 'admin'
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'cacuna@unitru.edu.pe';

-- Paso 3: Verificar que se actualizó correctamente
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'cacuna@unitru.edu.pe';

-- Si no aparece ningún resultado en Paso 1, ejecuta esto:
-- (Primero necesitas obtener el ID del usuario desde auth.users)
/*
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'admin' as role
FROM auth.users
WHERE email = 'cacuna@unitru.edu.pe'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';
*/
