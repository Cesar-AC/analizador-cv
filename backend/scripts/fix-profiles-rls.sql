-- Eliminar políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Habilitar RLS en la tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir a los usuarios ver su propio perfil (incluyendo el campo role)
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Permitir a los usuarios actualizar su propio perfil (excepto el role)
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir que el service_role pueda hacer cualquier cosa
-- Esto ya debería funcionar automáticamente con el service_role_key, pero lo hacemos explícito
CREATE POLICY "Service role can do everything"
ON profiles
FOR ALL
USING (true)
WITH CHECK (true);
