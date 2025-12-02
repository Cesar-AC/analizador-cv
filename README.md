# 🚀 AutoCV IA - Analizador y Generador de CV con IA

Sistema completo de análisis y mejora de currículums vitae utilizando inteligencia artificial mediante n8n, con templates profesionales y seguimiento en tiempo real.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

## 📋 Características Principales

### 🔐 Autenticación y Usuarios
- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Roles de usuario (Admin y Usuario regular)
- ✅ Panel administrativo para gestión de CVs
- ✅ Perfiles de usuario personalizables

### 📄 Análisis de CV
- ✅ Subida de archivos PDF de currículums
- ✅ Análisis automático con IA mediante n8n
- ✅ Puntuación detallada (Estructura, Contenido, Formato, ATS)
- ✅ Preguntas personalizadas por sección del CV
- ✅ Recomendaciones específicas de mejora
- ✅ Visualización de resultados con gráficos interactivos

### ✨ Mejora de CV
- ✅ Sistema de preguntas interactivo con skip/next
- ✅ Selección de 3 templates profesionales:
  - 📋 **Harvard**: Formato ejecutivo y corporativo
  - 💻 **MIT**: Diseño moderno para Tech & Startups
  - 🎓 **Oxford**: Estilo clásico y académico
- ✅ Vista previa compacta de plantillas (3 en fila)
- ✅ Scroll horizontal en móviles para selección de templates
- ✅ Modal de confirmación con resumen
- ✅ Polling automático cada 5 segundos
- ✅ Generación de PDF mejorado con n8n
- ✅ Comparación de puntajes (antes/después)
- ✅ Descarga directa del CV mejorado

### 🎨 Interfaz de Usuario
- ✅ Diseño responsive optimizado para móviles y tablets
- ✅ Dark theme moderno con paleta Navy/Green
- ✅ Landing page atractiva con animaciones
- ✅ Modals animados con estados visuales
- ✅ Gráficos interactivos con Chart.js
- ✅ Sistema de progreso en tiempo real
- ✅ Loading spinner en historial de CVs
- ✅ Modal de feedback y contacto integrado

### 📱 Optimizaciones Móviles
- ✅ Formularios adaptados (evita zoom en iOS)
- ✅ Scroll horizontal para selección de templates
- ✅ Modals responsivos con altura máxima
- ✅ Navegación táctil optimizada

## 🛠️ Tecnologías

**Frontend:**
- HTML5, CSS3 (Custom Properties, Flexbox, Grid)
- JavaScript ES6+ (Vanilla)
- Chart.js para visualizaciones
- Font Awesome 6.5.1 para iconos
- Google Fonts (Inter, Poppins)

**Backend:**
- Node.js 18+ con Express
- Supabase (Auth + Database + Storage)
- n8n para workflows de IA

**Base de Datos:**
- PostgreSQL con JSONB
- Row Level Security (RLS)
- Triggers automáticos

## 📁 Estructura del Proyecto

```
cv/
├── backend/
│   ├── app.js                 # Servidor Express principal
│   ├── routes/
│   │   ├── admin.js           # Rutas administrativas
│   │   ├── auth.js            # Autenticación
│   │   └── upload.js          # Subida y análisis de CVs
│   ├── services/
│   │   └── supabaseClient.js  # Cliente de Supabase
│   └── scripts/               # Scripts de utilidad
├── frontend/
│   ├── index.html             # Landing page
│   ├── login.html             # Página de login
│   ├── dashboard.html         # Panel de usuario
│   ├── cv-results.html        # Resultados del análisis
│   ├── admin.html             # Panel administrativo
│   ├── profile.html           # Perfil de usuario
│   ├── css/
│   │   ├── styles.css         # Estilos principales
│   │   ├── cv-results.css     # Estilos de resultados
│   │   └── ...
│   └── js/
│       ├── config.js          # Configuración y API
│       ├── auth.js            # Lógica de autenticación
│       ├── dashboard.js       # Lógica del dashboard
│       ├── cv-results-core.js # Visualización de resultados
│       ├── cv-improvement-modal.js  # Modal de preguntas
│       ├── cv-improved-modal.js     # Modal de CV mejorado
│       └── feedback.js        # Modal de feedback
└── uploads/                   # Archivos temporales
```

## 📦 Instalación

### Prerrequisitos
- Node.js 18 o superior
- Cuenta en Supabase
- Instancia de n8n configurada

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/Cesar-AC/analizador-cv.git
cd analizador-cv

# 2. Instalar dependencias
npm install

# 3. Crear archivo de configuración
cp backend/.env.example backend/.env

# 4. Configurar variables de entorno en .env:@
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - N8N_WEBHOOK_URL
#    - N8N_IMPROVE_WEBHOOK_URL@

# 5. Ejecutar scripts SQL en Supabase (ver /backend/scripts/)

# 6. Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🔧 Variables de Entorno

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# n8n Webhooks
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/analyze-cv
N8N_IMPROVE_WEBHOOK_URL=https://tu-n8n.com/webhook/improve-cv

# Servidor
PORT=3000
```


Para producción, asegúrate de:
1. Configurar las variables de entorno
2. Usar HTTPS
3. Configurar CORS apropiadamente

## 📝 Changelog v2.0.0

## 📄 Licencia

ISC License - Ver archivo [LICENSE](LICENSE)

## 👥 Autor

**Cesar AC** - Desarrollador Full Stack

- 📧 Email: cacuna@unitru.edu.pe
- 💼 LinkedIn: [@cesar-ac10](https://www.linkedin.com/in/cesar-ac10/)
- 🐙 GitHub: [@Cesar-AC](https://github.com/Cesar-AC)

---

<p align="center">
  <strong>© 2024-2025 AutoCV IA</strong> 🚀
  <br>
  <em>Potencia tu carrera con un CV profesional</em>
</p>
