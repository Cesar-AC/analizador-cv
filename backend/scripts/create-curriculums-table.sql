-- Script para crear la tabla de currículums si no existe
-- Ejecuta esto en Supabase Dashboard → SQL Editor

-- Crear tabla curriculums si no existe
CREATE TABLE IF NOT EXISTS curriculums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'approved', 'rejected')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_curriculums_user_id ON curriculums(user_id);
CREATE INDEX IF NOT EXISTS idx_curriculums_status ON curriculums(status);
CREATE INDEX IF NOT EXISTS idx_curriculums_uploaded_at ON curriculums(uploaded_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propios CVs
CREATE POLICY "Users can view own curriculums"
  ON curriculums
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios CVs
CREATE POLICY "Users can insert own curriculums"
  ON curriculums
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios CVs
CREATE POLICY "Users can update own curriculums"
  ON curriculums
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios CVs
CREATE POLICY "Users can delete own curriculums"
  ON curriculums
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar que todo está correcto
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'curriculums';
