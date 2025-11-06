# 🔐 CONFIGURACIÓN COMPLETA DE SUPABASE

## 📝 PASO 1: Configurar Autenticación

### 1.1 Ir a Authentication Settings
1. Abre tu proyecto en Supabase: https://supabase.com/dashboard/project/qcpbeoqfyfocgxtfgvtc
2. Ve a **Authentication** → **Settings**

### 1.2 Desactivar confirmación de email (opcional para desarrollo)
En la sección **Email Auth**:
- Encuentra "Enable email confirmations"
- **Desactívalo** si quieres permitir login inmediato sin confirmar email
- O **déjalo activado** para mayor seguridad (los usuarios recibirán un email)

### 1.3 Configurar URL del sitio
En **Site URL**, pon: `http://localhost:3000`

---

## 📊 PASO 2: Crear Tabla de Perfiles con Roles

### 2.1 Ir al SQL Editor
1. En el menú lateral, ve a **SQL Editor**
2. Haz clic en **"+ New query"**

### 2.2 Ejecutar este SQL (COPIA TODO Y PEGA):

```sql
-- ============================================
-- 1. CREAR TABLA DE PERFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREAR TABLA DE CURRÍCULUMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.curriculums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_result JSONB,
  score INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar Row Level Security
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS DE SEGURIDAD - PROFILES
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden actualizar su propio perfil (excepto role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Solo los administradores pueden cambiar roles
CREATE POLICY "Only admins can change roles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permitir inserción durante el registro (se maneja con trigger)
CREATE POLICY "Enable insert for authenticated users only"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. POLÍTICAS DE SEGURIDAD - CURRICULUMS
-- ============================================

-- Los usuarios pueden ver sus propios CVs
CREATE POLICY "Users can view own curriculums"
  ON public.curriculums
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los administradores pueden ver todos los CVs
CREATE POLICY "Admins can view all curriculums"
  ON public.curriculums
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden insertar sus propios CVs
CREATE POLICY "Users can insert own curriculums"
  ON public.curriculums
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios CVs
CREATE POLICY "Users can update own curriculums"
  ON public.curriculums
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios CVs
CREATE POLICY "Users can delete own curriculums"
  ON public.curriculums
  FOR DELETE
  USING (auth.uid() = user_id);

-- Los administradores pueden actualizar cualquier CV
CREATE POLICY "Admins can update all curriculums"
  ON public.curriculums
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGER PARA EJECUTAR LA FUNCIÓN
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGER PARA updated_at EN PROFILES
-- ============================================
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. CREAR PRIMER USUARIO ADMINISTRADOR
-- ============================================
-- NOTA: Después de registrarte en la app, ejecuta esto
-- cambiando 'tu@email.com' por tu email real:

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'tu@email.com';

-- ============================================
-- 10. FUNCIÓN PARA ESTADÍSTICAS (ADMINS)
-- ============================================
-- Las vistas no soportan RLS, así que usamos una función
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_admins BIGINT,
  total_cvs BIGINT,
  cvs_analyzed BIGINT,
  cvs_pending BIGINT,
  average_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado. Se requieren permisos de administrador.';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user')::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin')::BIGINT as total_admins,
    (SELECT COUNT(*) FROM public.curriculums)::BIGINT as total_cvs,
    (SELECT COUNT(*) FROM public.curriculums WHERE status = 'completed')::BIGINT as cvs_analyzed,
    (SELECT COUNT(*) FROM public.curriculums WHERE status = 'pending')::BIGINT as cvs_pending,
    (SELECT COALESCE(AVG(score), 0) FROM public.curriculums WHERE score IS NOT NULL)::NUMERIC as average_score;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
```

### 2.3 Ejecutar
- Haz clic en **"Run"** o presiona `Ctrl+Enter`
- Deberías ver: "Success. No rows returned"

---

## 🪣 PASO 3: Configurar Storage Bucket

### 3.1 Crear Bucket
1. Ve a **Storage** en el menú lateral
2. Haz clic en **"Create bucket"**
3. Configuración:
   - **Name**: `cv`
   - **Public**: ❌ Deshabilitado (privado)
   - **Allowed MIME types**: `application/pdf`
   - **File size limit**: `5242880` (5MB en bytes)

### 3.2 Configurar Políticas de Storage

**IMPORTANTE**: Las políticas de Storage se crean **UNA POR UNA** desde la interfaz de Supabase, NO desde SQL Editor.

#### Política 1: Permitir subir archivos (INSERT)
1. Selecciona el bucket `cv`
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New Policy"**
4. Selecciona **"For full customization"** (o "Custom")
5. Configura:
   - **Policy name**: `Users can upload own CVs`
   - **Allowed operation**: ✅ Marcar solo **INSERT**
   - **Target roles**: `authenticated` (debe aparecer por defecto)
   - **Policy definition**: Pega este código:
   ```sql
   bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
6. Haz clic en **"Save"** o **"Create policy"**

#### Política 2: Permitir ver propios archivos (SELECT)
1. Haz clic en **"New Policy"** de nuevo
2. Configura:
   - **Policy name**: `Users can view own CVs`
   - **Allowed operation**: ✅ Marcar solo **SELECT**
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
3. Guardar

#### Política 3: Permitir a admins ver todos los archivos (SELECT)
1. **New Policy**
2. Configura:
   - **Policy name**: `Admins can view all CVs`
   - **Allowed operation**: ✅ Marcar solo **SELECT**
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'cv' AND EXISTS (
     SELECT 1 FROM public.profiles
     WHERE id = auth.uid() AND role = 'admin'
   )
   ```
3. Guardar

#### Política 4: Permitir eliminar propios archivos (DELETE)
1. **New Policy**
2. Configura:
   - **Policy name**: `Users can delete own CVs`
   - **Allowed operation**: ✅ Marcar solo **DELETE**
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
3. Guardar

#### Política 5: Permitir actualizar propios archivos (UPDATE) - Opcional
1. **New Policy**
2. Configura:
   - **Policy name**: `Users can update own CVs`
   - **Allowed operation**: ✅ Marcar solo **UPDATE**
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
3. Guardar

---

## ✅ PASO 4: Verificar Configuración

### 4.1 Verificar Tablas
En SQL Editor, ejecuta:
```sql
SELECT * FROM public.profiles;
SELECT * FROM public.curriculums;
```

### 4.2 Verificar Políticas
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 👤 PASO 5: Crear tu Usuario Administrador

1. **Regístrate en la app** usando tu email
2. Ve a **SQL Editor** en Supabase
3. Ejecuta (cambia el email):
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```
4. Cierra sesión y vuelve a entrar en la app

---

## 🔍 VERIFICACIÓN FINAL

### Tabla Profiles debe tener:
- ✅ Columna `id` (UUID, PK)
- ✅ Columna `email` (TEXT, UNIQUE)
- ✅ Columna `full_name` (TEXT)
- ✅ Columna `role` (TEXT, DEFAULT 'user')
- ✅ RLS habilitado

### Tabla Curriculums debe tener:
- ✅ Columna `id` (UUID, PK)
- ✅ Columna `user_id` (UUID, FK)
- ✅ Columna `file_name`, `file_path`, `status`
- ✅ RLS habilitado

### Storage Bucket `cv`:
- ✅ Creado y privado
- ✅ Políticas configuradas

---

## 🎯 RESUMEN DE ROLES

### Role: `user` (Usuario Normal)
- ✅ Puede registrarse e iniciar sesión
- ✅ Puede subir sus CVs
- ✅ Puede ver solo SUS propios CVs
- ✅ Puede actualizar su perfil (excepto role)
- ❌ NO puede ver CVs de otros
- ❌ NO puede acceder al panel admin

### Role: `admin` (Administrador)
- ✅ Todo lo que puede hacer un user
- ✅ Puede ver TODOS los CVs de todos los usuarios
- ✅ Puede ver estadísticas generales
- ✅ Puede acceder al panel de administración
- ✅ Puede cambiar roles de usuarios
- ✅ Puede ver reportes completos

---

## 🐛 Solución de Problemas

### Error: "Credenciales inválidas"
**Causa**: No se creó el perfil automáticamente
**Solución**: Verifica que el trigger `on_auth_user_created` exista

### Error: "new row violates row-level security policy"
**Causa**: Las políticas RLS están muy restrictivas
**Solución**: Revisa las políticas con:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'curriculums');
```

### No se crea el perfil al registrarse
**Solución**: Ejecuta esto para verificar el trigger:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 📞 Siguiente Paso

Una vez ejecutes todo esto, **actualiza tu código backend** para:
1. Guardar los CVs en la tabla `curriculums`
2. Verificar roles antes de permitir acciones
3. Crear endpoints para administradores

¿Quieres que actualice el código backend ahora?
