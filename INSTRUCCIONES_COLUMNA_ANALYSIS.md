# Instrucciones para Agregar la Columna analysis_result

## Paso 1: Acceder a Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto

## Paso 2: Ejecutar el Script SQL

1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**
3. Copia y pega el contenido del archivo `add_analysis_column.sql`
4. Haz clic en **"Run"** o presiona `Ctrl + Enter`

## Paso 3: Verificar que se Creó Correctamente

1. Ve a **"Table Editor"** en el menú lateral
2. Selecciona la tabla **"curriculums"**
3. Verifica que aparezca la nueva columna **"analysis_result"** de tipo **JSONB**

## ¿Qué Hace Este Script?

Este script:
- ✅ Agrega la columna `analysis_result` tipo JSONB para guardar todo el análisis
- ✅ Crea un índice GIN para búsquedas rápidas en el JSON
- ✅ No borra datos existentes (usa `IF NOT EXISTS`)

## Estructura de Datos que se Guardará

La columna `analysis_result` guardará un JSON con:

```json
[
  {
    "meta": {
      "puntaje_total": 74,
      "detalle": {
        "estructura": 68,
        "contenido": 78,
        "formato": 73,
        "compatibilidad_ATS": 78
      },
      "secciones_detectadas": [...],
      "links": {
        "pdf_url": "https://..."
      }
    },
    "resumen": {
      "observaciones": [...],
      "debilidades": [...],
      "recomendaciones": [...]
    },
    "preguntas_por_seccion": {
      "ordered": [...]
    },
    "recomendaciones_por_seccion": {
      "ordered": [...]
    }
  }
]
```

## Funcionalidades Habilitadas

Después de ejecutar este script, el sistema podrá:
- 📊 Mostrar gráficos de puntuación por categoría
- 📋 Listar secciones detectadas del CV
- ⚠️ Mostrar debilidades identificadas
- 💡 Presentar recomendaciones detalladas
- ❓ Sugerir preguntas para entrevistas
- 📄 Enlazar al reporte PDF generado por n8n

## Paso 4: Reiniciar el Servidor

Después de ejecutar el script SQL:
```bash
# Detener el servidor
Ctrl + C

# Iniciar el servidor nuevamente
cd backend
node app.js
```

¡Listo! Ahora el sistema puede guardar y mostrar análisis completos de CVs.
