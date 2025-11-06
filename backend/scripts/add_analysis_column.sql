-- Agregar columna para guardar el análisis completo del CV
-- Esta columna guardará toda la respuesta JSON de n8n con:
-- - Puntuaciones detalladas por categoría
-- - Secciones detectadas
-- - Debilidades
-- - Recomendaciones
-- - Preguntas sugeridas
-- - Link al PDF del reporte

ALTER TABLE curriculums 
ADD COLUMN IF NOT EXISTS analysis_result JSONB;

-- Crear índice para búsquedas rápidas en el JSON
CREATE INDEX IF NOT EXISTS idx_curriculums_analysis_result 
ON curriculums USING GIN (analysis_result);

-- Comentario sobre la columna
COMMENT ON COLUMN curriculums.analysis_result IS 'Resultado completo del análisis del CV en formato JSON';
