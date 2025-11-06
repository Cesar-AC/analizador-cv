# 🎯 INSTRUCCIONES DE USO - AutoCV IA

## ✅ Estado del Proyecto

El servidor está **corriendo exitosamente** en: http://localhost:3000

## 📝 Pasos Completados

✅ Estructura del proyecto creada
✅ Backend configurado con Express y Supabase
✅ Frontend responsive mobile-first desarrollado
✅ Dependencias instaladas
✅ Servidor en ejecución

## 🚀 Cómo Usar la Aplicación

### 1. Accede a la aplicación
Abre tu navegador en: **http://localhost:3000**

### 2. Registro
- Haz clic en "Registrarse"
- Completa el formulario con:
  - Nombre completo
  - Email
  - Contraseña (mínimo 6 caracteres)
- Haz clic en "Crear cuenta"

### 3. Iniciar Sesión
- Ingresa tu email y contraseña
- Haz clic en "Iniciar sesión"

### 4. Subir tu CV
- En el dashboard, haz clic en el área de carga o arrastra tu archivo PDF
- El archivo debe ser PDF y máximo 5MB
- Haz clic en "Subir y analizar"
- Verás un mensaje de éxito

### 5. Ver Historial
- Todos tus CVs subidos aparecerán en la sección "Historial de Evaluaciones"
- Puedes ver la fecha de carga y el tamaño del archivo

## 📱 Características Responsive

La aplicación está optimizada para:
- 📱 **Móviles** (320px - 767px): Diseño vertical, botones grandes, textos legibles
- 📱 **Tablets** (768px - 1023px): Layout mejorado, más espacio
- 💻 **Desktop** (1024px+): Vista completa con todas las características

### Elementos Responsive:
- ✅ Header adaptable (logo + botones)
- ✅ Formularios optimizados para touch
- ✅ Cards de características en grid flexible
- ✅ Dashboard con layout adaptativo
- ✅ Navegación simplificada en móvil

## 🎨 Paleta de Colores

- **Azul primario**: #007bff
- **Verde secundario**: #00b894
- **Gradientes**: Degradados modernos púrpura-azul
- **Tipografía**: Poppins (Google Fonts)

## ⚙️ Configuración de Supabase

### ⚠️ IMPORTANTE: Configurar el Bucket de Storage

Antes de subir archivos, debes crear el bucket en Supabase:

1. Ve a: https://supabase.com/dashboard/project/qcpbeoqfyfocgxtfgvtc
2. En el menú lateral, selecciona **Storage**
3. Haz clic en **"Create bucket"**
4. Configura:
   - **Name**: `cv`
   - **Public**: ❌ Desmarcado (privado)
   - **File size limit**: 5MB
5. Haz clic en **"Create bucket"**

### Políticas de Seguridad (Opcional)

Para permitir que los usuarios accedan solo a sus archivos:

```sql
-- Permitir subida solo para usuarios autenticados
CREATE POLICY "Users can upload their own CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir lectura solo de archivos propios
CREATE POLICY "Users can view their own CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cv' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 🔧 Comandos Útiles

### Iniciar el servidor (ya está corriendo):
```bash
npm run dev
```

### Detener el servidor:
Presiona `Ctrl + C` en la terminal donde está corriendo

### Reiniciar el servidor:
Escribe `rs` en la terminal y presiona Enter (con nodemon)

### Instalar nuevas dependencias:
```bash
npm install nombre-paquete
```

## 🐛 Solución de Problemas

### Error: "No se puede subir el archivo"
✅ **Solución**: Asegúrate de haber creado el bucket `cv` en Supabase

### Error: "Token inválido"
✅ **Solución**: Cierra sesión y vuelve a iniciar sesión

### Error: "Error de conexión"
✅ **Solución**: Verifica que el servidor esté corriendo en http://localhost:3000

### Error en el puerto 3000
✅ **Solución**: Si el puerto está ocupado, cambia el puerto en `.env`:
```
PORT=3001
```

### Errores de CORS
✅ **Solución**: El servidor ya tiene CORS configurado, pero si hay problemas:
- Verifica que el frontend acceda a `http://localhost:3000`
- No uses `file://` en el navegador

## 📂 Estructura de Archivos

```
/cv
├── backend/
│   ├── app.js                    # Servidor Express
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   └── upload.js            # Rutas de subida
│   └── services/
│       └── supabaseClient.js    # Cliente Supabase
├── frontend/
│   ├── index.html               # Landing page
│   ├── login.html               # Login/Registro
│   ├── dashboard.html           # Dashboard
│   ├── css/
│   │   └── styles.css           # Estilos (mobile-first)
│   └── js/
│       ├── config.js            # Configuración
│       ├── main.js              # Script landing
│       ├── auth.js              # Script autenticación
│       └── dashboard.js         # Script dashboard
├── uploads/                      # Archivos temporales
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Seguridad

- ✅ Las contraseñas se guardan hasheadas en Supabase
- ✅ Los archivos se almacenan en un bucket privado
- ✅ Los tokens JWT se validan en cada petición
- ✅ Las credenciales están en `.env` (no subir a git)

## 📱 Pruebas en Dispositivos Móviles

### Opción 1: DevTools de Chrome
1. Abre http://localhost:3000
2. Presiona F12 (DevTools)
3. Haz clic en el ícono de dispositivos móviles (Ctrl+Shift+M)
4. Selecciona diferentes dispositivos para probar

### Opción 2: Dispositivo Real
1. Asegúrate de que tu móvil y PC estén en la misma red WiFi
2. Encuentra tu IP local:
   ```bash
   ipconfig
   ```
3. Busca "IPv4 Address" (ej: 192.168.1.100)
4. En tu móvil, accede a: http://TU_IP:3000

## 🎓 Próximos Pasos (Mejoras Futuras)

- [ ] Implementar análisis real con IA (OpenAI, GPT)
- [ ] Agregar vista previa de PDFs
- [ ] Implementar sistema de calificación del CV
- [ ] Agregar sugerencias de mejora específicas
- [ ] Exportar reportes en PDF
- [ ] Agregar comparación de CVs
- [ ] Sistema de notificaciones
- [ ] Modo oscuro

## 📧 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Revisa la terminal del servidor
3. Verifica la configuración de Supabase

---

**¡Tu aplicación está lista y funcionando! 🎉**

Accede a: **http://localhost:3000**
