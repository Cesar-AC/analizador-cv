# ✅ GUÍA COMPLETA: CONFIGURAR Y USAR EL SISTEMA

## 🎯 PASO A PASO - CONFIGURACIÓN COMPLETA

### PASO 1: Configurar Supabase (MUY IMPORTANTE) ⚠️

1. **Abre tu proyecto en Supabase**:
   👉 https://supabase.com/dashboard/project/qcpbeoqfyfocgxtfgvtc

2. **Ve al SQL Editor** (menú lateral izquierdo)

3. **Copia y pega TODO el SQL** del archivo `CONFIGURACION_SUPABASE.md` (sección 2.2)
   - Haz clic en "Run" o presiona `Ctrl+Enter`
   - Deberías ver: "Success. No rows returned"

4. **Configurar Authentication**:
   - Ve a **Authentication** → **Settings**
   - En "Email Auth" → "Enable email confirmations":
     - **OPCIÓN A (Desarrollo)**: DESACTIVAR para permitir login inmediato
     - **OPCIÓN B (Producción)**: MANTENER ACTIVO (más seguro)
   
5. **Crear el Bucket de Storage**:
   - Ve a **Storage** (menú lateral)
   - Clic en "Create bucket"
   - Nombre: `cv`
   - Public: ❌ NO (privado)
   - Allowed MIME types: `application/pdf`
   - File size limit: `5242880` (5MB)
   - Clic en "Create bucket"

6. **Configurar Políticas de Storage**:
   - Selecciona el bucket `cv`
   - Ve a "Policies"
   - Copia y pega las 4 políticas del archivo `CONFIGURACION_SUPABASE.md` (sección 3.2)

---

### PASO 2: Iniciar el Servidor

El servidor ya está corriendo en: **http://localhost:3000**

Si necesitas reiniciarlo:
```bash
cd "c:\Users\LENOVO\Desktop\X Ciclo\Proyecto de Investigacion\cv"
npm run dev
```

---

### PASO 3: Crear tu Primer Usuario

1. **Abre el navegador** en: http://localhost:3000

2. **Haz clic en "Registrarse"**

3. **Completa el formulario**:
   - Nombre: Tu nombre
   - Email: tu@email.com (usa uno real si habilitaste confirmación)
   - Contraseña: mínimo 6 caracteres
   - Confirmar contraseña

4. **Si deshabilitaste la confirmación de email**:
   - Verás "Cuenta creada! Ahora inicia sesión"
   - Inicia sesión con tu email y contraseña
   
5. **Si habilitaste la confirmación de email**:
   - Recibirás un email de Supabase
   - Haz clic en el enlace de confirmación
   - Luego podrás iniciar sesión

---

### PASO 4: Convertirte en Administrador

1. **Ve a Supabase** → **SQL Editor**

2. **Ejecuta este comando** (cambia el email por el tuyo):
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
   ```

3. **Verifica** que se haya actualizado:
   ```sql
   SELECT email, role FROM public.profiles WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
   ```
   Deberías ver: `role: admin`

4. **Cierra sesión** en la app y **vuelve a iniciar sesión**

5. **Serás redirigido al Panel de Administración** automáticamente

---

## 🎮 CÓMO USAR EL SISTEMA

### Para USUARIOS NORMALES (role: user):

1. **Login** → Redirige a `dashboard.html`
2. **Subir CV**:
   - Clic en área de carga o arrastra PDF
   - Solo PDF, máximo 5MB
   - Clic en "Subir y analizar"
3. **Ver historial** de CVs subidos
4. **Ver estado** de cada CV (pendiente/procesando/completado)
5. **Ver puntuación** (cuando esté disponible)

### Para ADMINISTRADORES (role: admin):

1. **Login** → Redirige a `admin.html`
2. **Ver estadísticas** generales:
   - Total de usuarios y admins
   - Total de CVs subidos
   - CVs analizados vs pendientes
   - Puntuación promedio
3. **Tab "Usuarios"**:
   - Ver todos los usuarios registrados
   - Cambiar roles (user ↔ admin)
   - Eliminar usuarios
4. **Tab "Currículums"**:
   - Ver todos los CVs de todos los usuarios
   - Ver estado y puntuación
   - Filtrar y buscar
5. **Acceso a su propio dashboard** (botón "Mi Dashboard")

---

## 🔐 SISTEMA DE ROLES - EXPLICACIÓN

### Role: `user`
✅ Puede hacer:
- Registrarse e iniciar sesión
- Subir sus propios CVs
- Ver solo SUS CVs
- Actualizar su perfil
- Ver su historial

❌ NO puede:
- Ver CVs de otros usuarios
- Acceder al panel de administración
- Ver estadísticas generales
- Cambiar roles
- Eliminar otros usuarios

### Role: `admin`
✅ Puede hacer TODO lo anterior MÁS:
- Ver TODOS los CVs de TODOS los usuarios
- Ver estadísticas completas del sistema
- Gestionar usuarios (cambiar roles, eliminar)
- Acceder al panel de administración
- Ver reportes detallados

---

## 📱 ENDPOINTS DE LA API

### Autenticación:
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/profile` - Obtener perfil

### Usuarios (CVs):
- `POST /api/upload` - Subir CV (requiere token)
- `GET /api/files` - Listar mis CVs (requiere token)
- `GET /api/files/:id` - Ver un CV específico
- `DELETE /api/files/:id` - Eliminar un CV

### Administración (solo admins):
- `GET /api/admin/stats` - Estadísticas generales
- `GET /api/admin/users` - Listar todos los usuarios
- `GET /api/admin/curriculums` - Listar todos los CVs
- `PATCH /api/admin/users/:userId/role` - Cambiar role
- `DELETE /api/admin/users/:userId` - Eliminar usuario
- `PATCH /api/admin/curriculums/:cvId/status` - Actualizar estado de CV

---

## 🧪 PROBAR EL SISTEMA

### Test 1: Registro de Usuario
```
1. Ir a: http://localhost:3000
2. Clic en "Registrarse"
3. Llenar formulario
4. Verificar que se crea el perfil en Supabase:
   - Supabase → Authentication → Users (debe aparecer)
   - Supabase → Table Editor → profiles (debe aparecer con role: user)
```

### Test 2: Login
```
1. Iniciar sesión con el usuario creado
2. Verificar redirección a dashboard.html
3. Verificar que muestra el email en el header
```

### Test 3: Subir CV
```
1. En dashboard, seleccionar un PDF
2. Clic en "Subir y analizar"
3. Verificar mensaje de éxito
4. Verificar en Supabase:
   - Storage → cv → [tu-user-id] (debe aparecer el archivo)
   - Table Editor → curriculums (debe aparecer el registro)
```

### Test 4: Convertirse en Admin
```
1. En Supabase SQL Editor, ejecutar:
   UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
2. Cerrar sesión en la app
3. Volver a iniciar sesión
4. Verificar redirección a admin.html
5. Verificar estadísticas visibles
```

### Test 5: Gestión de Usuarios (Admin)
```
1. En admin.html, tab "Usuarios"
2. Crear otro usuario normal desde /register
3. En admin, verificar que aparece en la lista
4. Probar cambiar su role a admin
5. Verificar que se actualiza en Supabase
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### ❌ Error: "Credenciales inválidas"
**Causa**: El perfil no se creó en la tabla `profiles`
**Solución**:
1. Verifica que existe el trigger:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Si no existe, ejecuta TODO el SQL de nuevo del archivo `CONFIGURACION_SUPABASE.md`
3. Si ya existe, crea el perfil manualmente:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role)
   VALUES (
     'USER_ID_DE_AUTH_USERS',
     'tu@email.com',
     'Tu Nombre',
     'user'
   );
   ```

### ❌ Error al subir archivo: "Error al subir el archivo"
**Causa**: El bucket `cv` no existe o no tiene las políticas correctas
**Solución**:
1. Ve a Storage → Verifica que existe el bucket `cv`
2. Ve a Policies → Verifica las 4 políticas
3. Si faltan, créalas usando el SQL del archivo de configuración

### ❌ No aparecen los CVs en el historial
**Causa**: Las políticas RLS están bloqueando el acceso
**Solución**:
```sql
-- Verifica las políticas
SELECT * FROM pg_policies WHERE tablename = 'curriculums';

-- Si faltan, vuelve a ejecutar el SQL completo
```

### ❌ No puedo acceder al panel de admin
**Causa**: Tu role no está en 'admin'
**Solución**:
```sql
-- Verifica tu role
SELECT email, role FROM public.profiles WHERE email = 'tu@email.com';

-- Si no es admin, actualízalo
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### ❌ Error: "new row violates row-level security policy"
**Causa**: Las políticas RLS están mal configuradas
**Solución**:
1. Deshabilita temporalmente RLS (solo para debug):
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.curriculums DISABLE ROW LEVEL SECURITY;
   ```
2. Prueba de nuevo
3. Vuelve a habilitarlas y configura bien las políticas:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
   ```

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Tabla: `profiles`
```
id: UUID (PK, FK → auth.users)
email: TEXT (UNIQUE)
full_name: TEXT
role: TEXT ('user' o 'admin')
avatar_url: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Tabla: `curriculums`
```
id: UUID (PK)
user_id: UUID (FK → auth.users)
file_name: TEXT
file_path: TEXT
file_size: BIGINT
status: TEXT ('pending', 'processing', 'completed', 'failed')
analysis_result: JSONB
score: INTEGER (0-100)
uploaded_at: TIMESTAMP
analyzed_at: TIMESTAMP
```

---

## 🚀 PRÓXIMOS PASOS (MEJORAS FUTURAS)

1. **Análisis de CV con IA**:
   - Integrar OpenAI GPT-4 para analizar los PDFs
   - Extraer información (experiencia, educación, skills)
   - Generar sugerencias de mejora

2. **Reportes Detallados**:
   - PDF con análisis completo
   - Gráficos de fortalezas/debilidades
   - Comparación con CVs similares

3. **Notificaciones**:
   - Email cuando el análisis está completo
   - Notificaciones en tiempo real

4. **Dashboard Mejorado**:
   - Gráficos de progreso
   - Comparación de versiones de CV
   - Tips personalizados

5. **Panel Admin Avanzado**:
   - Gráficos de estadísticas
   - Exportar reportes
   - Logs de actividad

---

## 📞 RESUMEN RÁPIDO

### Para empezar YA:

1. ✅ **Ejecuta el SQL** en Supabase (archivo CONFIGURACION_SUPABASE.md)
2. ✅ **Crea el bucket** `cv` en Storage
3. ✅ **Abre** http://localhost:3000
4. ✅ **Regístrate** con tu email
5. ✅ **Conviértete en admin** con el comando SQL:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
   ```
6. ✅ **Cierra sesión y vuelve a entrar**
7. ✅ **¡Listo!** Ya tienes acceso al panel de administración

### Accesos Directos:
- Landing: http://localhost:3000
- Login: http://localhost:3000/login.html
- Dashboard Usuario: http://localhost:3000/dashboard.html
- Panel Admin: http://localhost:3000/admin.html

---

**¡Tu sistema está completo y funcionando! 🎉**
