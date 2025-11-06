/**
 * Script para configurar Supabase automáticamente desde código
 * 
 * Este script:
 * 1. Crea las tablas profiles y curriculums
 * 2. Configura RLS (Row Level Security) y políticas
 * 3. Crea triggers automáticos
 * 4. Crea funciones para estadísticas
 * 
 * USO:
 * node backend/scripts/setupSupabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas la SERVICE ROLE KEY, no la anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas');
  console.log('\n📝 Agrega estas variables a tu archivo .env:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui');
  console.log('\n💡 La SERVICE ROLE KEY la encuentras en:');
  console.log('Supabase Dashboard → Settings → API → Service Role Key');
  process.exit(1);
}

// Cliente con permisos de admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL para crear todo
const setupSQL = `
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

ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS RLS - PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Only admins can change roles" ON public.profiles;
CREATE POLICY "Only admins can change roles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. POLÍTICAS RLS - CURRICULUMS
-- ============================================
DROP POLICY IF EXISTS "Users can view own curriculums" ON public.curriculums;
CREATE POLICY "Users can view own curriculums"
  ON public.curriculums FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all curriculums" ON public.curriculums;
CREATE POLICY "Admins can view all curriculums"
  ON public.curriculums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own curriculums" ON public.curriculums;
CREATE POLICY "Users can insert own curriculums"
  ON public.curriculums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own curriculums" ON public.curriculums;
CREATE POLICY "Users can update own curriculums"
  ON public.curriculums FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own curriculums" ON public.curriculums;
CREATE POLICY "Users can delete own curriculums"
  ON public.curriculums FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all curriculums" ON public.curriculums;
CREATE POLICY "Admins can update all curriculums"
  ON public.curriculums FOR UPDATE
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
-- 8. TRIGGER PARA updated_at
-- ============================================
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. FUNCIÓN PARA ESTADÍSTICAS (ADMINS)
-- ============================================
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

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
`;

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de Supabase...\n');

  try {
    // Ejecutar SQL
    console.log('📊 Creando tablas, políticas RLS, triggers y funciones...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });

    if (error) {
      // Si exec_sql no existe, intentar con la API de management
      console.log('⚠️  exec_sql no disponible, usando método alternativo...');
      
      // Dividir el SQL en bloques
      const statements = setupSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        console.log(`  Ejecutando ${i + 1}/${statements.length}...`);
        const { error: stmtError } = await supabase.rpc('exec', { 
          statement: statements[i] + ';' 
        });
        
        if (stmtError) {
          console.error(`  ❌ Error en statement ${i + 1}:`, stmtError.message);
        }
      }
    }

    console.log('✅ Base de datos configurada\n');

    // Verificar tablas creadas
    console.log('🔍 Verificando configuración...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count');
    
    const { data: curriculums, error: curriculumsError } = await supabase
      .from('curriculums')
      .select('count');

    if (!profilesError) {
      console.log('  ✅ Tabla profiles creada');
    } else {
      console.log('  ❌ Error verificando profiles:', profilesError.message);
    }

    if (!curriculumsError) {
      console.log('  ✅ Tabla curriculums creada');
    } else {
      console.log('  ❌ Error verificando curriculums:', curriculumsError.message);
    }

    console.log('\n✨ ¡Configuración completada!\n');
    console.log('📝 Próximos pasos:');
    console.log('1. Regístrate en la app: http://localhost:3000');
    console.log('2. Ejecuta este comando para hacerte admin:');
    console.log('   node backend/scripts/makeAdmin.js tu@email.com\n');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar setup
setupDatabase();
