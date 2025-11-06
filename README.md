# 🚀 AutoCV IA

Aplicación web para analizar y mejorar currículums con inteligencia artificial.

## 📋 Características

- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Subida de archivos PDF de currículums
- ✅ Diseño responsive optimizado para dispositivos móviles
- ✅ Interfaz moderna y profesional
- ✅ Almacenamiento seguro en Supabase Storage

## 🛠️ Tecnologías

**Frontend:**
- HTML5, CSS3 (Flexbox/Grid)
- JavaScript vanilla
- Font Awesome para iconos
- Google Fonts (Poppins)

**Backend:**
- Node.js + Express
- Supabase (Auth + Storage)
- Multer para manejo de archivos

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd cv
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   El archivo `.env` ya está incluido con las credenciales de Supabase:
   ```
   SUPABASE_URL=https://qcpbeoqfyfocgxtfgvtc.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PORT=3000
   ```

4. **Configurar Supabase Storage**
   
   Ve a tu proyecto en Supabase y crea un bucket llamado `cv`:
   - Dashboard de Supabase → Storage → Create bucket
   - Nombre: `cv`
   - Público: No (privado)

## 🚀 Uso

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📱 Estructura del Proyecto

```
/cv
  /backend
    app.js                 # Servidor Express principal
    /routes
      auth.js             # Rutas de autenticación
      upload.js           # Rutas de subida de archivos
    /services
      supabaseClient.js   # Cliente de Supabase
  /frontend
    index.html            # Landing page
    login.html            # Página de login/registro
    dashboard.html        # Dashboard del usuario
    /css
      styles.css          # Estilos principales (mobile-first)
    /js
      main.js             # Lógica de la landing page
      auth.js             # Lógica de autenticación
      dashboard.js        # Lógica del dashboard
      config.js           # Configuración de Supabase
  /uploads                # Carpeta temporal para archivos
  .env                    # Variables de entorno
  .gitignore
  package.json
  README.md
```

## 📖 Uso de la Aplicación

1. **Página principal**: Presenta la aplicación con diseño atractivo
2. **Registro/Login**: Crea una cuenta o inicia sesión
3. **Dashboard**: Sube tu currículum en formato PDF
4. **Análisis**: El sistema procesará tu CV y mostrará mejoras

## 🎨 Diseño

- **Colores principales**: 
  - Azul: #007bff
  - Verde: #00b894
  - Gradientes modernos
  
- **Tipografía**: Poppins (Google Fonts)
- **Responsive**: Mobile-first design
- **Iconos**: Font Awesome 6

## 🔒 Seguridad

- Autenticación mediante Supabase Auth
- Tokens JWT seguros
- Storage privado por defecto
- Variables de entorno para credenciales

## 📄 Licencia

ISC

## 👥 Contacto

© 2025 AutoCV IA – Mejora tu perfil profesional
