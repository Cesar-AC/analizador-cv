# 🚀 Analizador de CV con IA

Sistema completo de análisis y mejora de currículums vitae utilizando inteligencia artificial mediante n8n, con templates profesionales y seguimiento en tiempo real.

## 📋 Características Principales

### 🔐 Autenticación y Usuarios
- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Roles de usuario (Admin y Usuario regular)
- ✅ Panel administrativo para gestión de CVs

### 📄 Análisis de CV
- ✅ Subida de archivos PDF de currículums
- ✅ Análisis automático con IA mediante n8n
- ✅ Puntuación detallada (Estructura, Contenido, Formato, ATS)
- ✅ Preguntas personalizadas por sección del CV
- ✅ Recomendaciones específicas de mejora

### ✨ Mejora de CV
- ✅ Sistema de preguntas interactivo con skip/next
- ✅ Selección de 3 templates profesionales:
  - 📋 **Harvard Classic**: Formato tradicional y elegante
  - 💻 **MIT Technical**: Diseño moderno y técnico
  - 🚀 **Stanford Innovative**: Formato innovador y creativo
- ✅ Modal de confirmación con resumen
- ✅ Polling automático cada 5 segundos
- ✅ Generación de PDF mejorado con n8n
- ✅ Descarga directa del CV mejorado

### 🎨 Interfaz de Usuario
- ✅ Diseño responsive optimizado para móviles
- ✅ Interfaz moderna y profesional
- ✅ Modals animados con estados visuales
- ✅ Gráficos interactivos con Chart.js
- ✅ Sistema de progreso en tiempo real

## 🛠️ Tecnologías

**Frontend:**
- HTML5, CSS3, JavaScript ES6+
- Chart.js, Font Awesome, Google Fonts

**Backend:**
- Node.js + Express
- Supabase (Auth + Database + Storage)
- n8n para integración con IA

**Base de Datos:**
- PostgreSQL con JSONB
- Row Level Security (RLS)

## 📦 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone https://github.com/Cesar-AC/analizador-cv.git
cd analizador-cv

# 2. Instalar dependencias
npm install

# 3. Configurar .env (ver backend/.env.example)
# 4. Ejecutar scripts SQL en Supabase
# 5. Configurar n8n (ver N8N_CONFIGURACION.md)

# 6. Iniciar servidor
npm run dev
```

## 📚 Documentación

- [`GUIA_COMPLETA.md`](GUIA_COMPLETA.md) - Guía completa del sistema
- [`N8N_CONFIGURACION.md`](N8N_CONFIGURACION.md) - Configuración de n8n
- [`CONFIGURACION_SUPABASE.md`](CONFIGURACION_SUPABASE.md) - Setup de Supabase

## 📄 Licencia

ISC License

## 👥 Autor

**Cesar AC** - [@Cesar-AC](https://github.com/Cesar-AC)

---

**© 2024 Analizador de CV con IA** 🚀
