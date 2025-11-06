# 🚀 GUÍA RÁPIDA: Configurar Supabase desde Código

## ⚡ Ventajas de Configurar desde Código

En lugar de hacer **100 clicks** en el dashboard de Supabase, puedes configurar todo en **2 minutos** con estos scripts.

### ❌ Forma Antigua (Dashboard Web):
1. Abrir Supabase Dashboard
2. Click en SQL Editor
3. Click en New Query
4. Copiar SQL
5. Pegar SQL
6. Click en Run
7. Esperar...
8. Repetir 20 veces para cada tabla/política
9. Ir a Storage
10. Click en Create Bucket
11. Configurar permisos...
12. Más clicks...

**⏱️ Tiempo total: ~30 minutos**

### ✅ Forma Nueva (Scripts):
1. Copiar tu SERVICE ROLE KEY
2. Ejecutar UN comando
3. ¡Listo!

**⏱️ Tiempo total: 2 minutos**

---

## 📋 PASO 1: Obtener SERVICE ROLE KEY

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/qcpbeoqfyfocgxtfgvtc
2. Click en **Settings** (⚙️ abajo a la izquierda)
3. Click en **API**
4. En la sección **Project API keys**, busca **`service_role`**
5. Click en el ícono de 👁️ para revelar la key
6. Click en el ícono de 📋 para copiarla

Se ve así:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0...
```

---

## 📋 PASO 2: Agregar al .env

Abre el archivo `.env` y reemplaza la línea:

```env
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI
```

Por:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (pega tu key aquí)
```

**Ejemplo completo del .env:**
```env
SUPABASE_URL=https://qcpbeoqfyfocgxtfgvtc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu key)
PORT=3000
```

---

## 📋 PASO 3: Ejecutar Script de Configuración

Abre la terminal en VS Code y ejecuta:

```bash
node backend/scripts/setupSupabase.js
```

Esto creará:
- ✅ Tabla `profiles` (usuarios con roles)
- ✅ Tabla `curriculums` (CVs subidos)
- ✅ Todas las políticas RLS (seguridad)
- ✅ Triggers automáticos
- ✅ Funciones para estadísticas

**Deberías ver:**
```
🚀 Iniciando configuración de Supabase...
📊 Creando tablas, políticas RLS, triggers y funciones...
✅ Base de datos configurada
🔍 Verificando configuración...
  ✅ Tabla profiles creada
  ✅ Tabla curriculums creada
✨ ¡Configuración completada!
```

---

## 📋 PASO 4: Crear Bucket de Storage (Solo 1 vez)

Este paso aún requiere el dashboard (30 segundos):

1. Ve a **Storage** en Supabase Dashboard
2. Click en **Create bucket**
3. Configura:
   - **Name**: `cv`
   - **Public**: ❌ OFF (privado)
   - **Allowed MIME types**: `application/pdf`
   - **File size limit**: `5242880` (5MB)
4. Click **Create bucket**
5. ¡Listo! (No necesitas crear políticas manualmente)

---

## 📋 PASO 5: Registrarte en la App

1. Abre: http://localhost:3000
2. Click en **Registrarse**
3. Completa el formulario con tu email (ejemplo: `cacuna@unitru.edu.pe`)
4. Click en **Registrarse**
5. Serás redirigido al dashboard

---

## 📋 PASO 6: Hacerte Administrador

En la terminal, ejecuta:

```bash
node backend/scripts/makeAdmin.js tu@email.com
```

**Ejemplo:**
```bash
node backend/scripts/makeAdmin.js cacuna@unitru.edu.pe
```

**Deberías ver:**
```
🔍 Buscando usuario: cacuna@unitru.edu.pe...
✅ Usuario encontrado:
   ID: da19272-0c7f-410f-8ea6-9ae38ec61a87
   Nombre: Cesar Alexander Acuña Cisneros
   Role actual: user

🔄 Actualizando role a admin...
✅ ¡Usuario convertido en administrador!
```

---

## 📋 PASO 7: Reiniciar Sesión

1. Click en **Salir** en la app
2. Vuelve a iniciar sesión
3. Ahora serás redirigido automáticamente a: http://localhost:3000/admin.html

---

## 🎉 ¡LISTO!

Ya tienes:
- ✅ Base de datos configurada
- ✅ Storage configurado
- ✅ Tu usuario con permisos de admin
- ✅ Panel de administración funcional

---

## 🛠️ Scripts Útiles

### Ver todos los usuarios:
```bash
node backend/scripts/listUsers.js
```

### Hacer admin a otro usuario:
```bash
node backend/scripts/makeAdmin.js otro@email.com
```

---

## 🆘 Solución de Problemas

### ❌ Error: "SUPABASE_SERVICE_ROLE_KEY no configuradas"
**Solución**: Revisa el PASO 2, asegúrate de copiar la key correcta

### ❌ Error: "Usuario no encontrado"
**Solución**: Primero regístrate en la app (PASO 5), luego ejecuta makeAdmin

### ❌ Error en el panel admin: "Acceso denegado"
**Solución**: 
1. Verifica que ejecutaste `makeAdmin.js`
2. Cierra sesión y vuelve a entrar
3. Recarga la página con Ctrl+F5

### ❌ Error al subir CV: "Row-level security policy"
**Solución**: Asegúrate de crear el bucket `cv` en Storage (PASO 4)

---

## 📊 Comparación Final

| Tarea | Dashboard | Scripts |
|-------|-----------|---------|
| Crear tablas | 10 min | 1 seg |
| Configurar RLS | 15 min | 1 seg |
| Crear triggers | 5 min | 1 seg |
| Hacer admin | 3 min | 5 seg |
| **TOTAL** | **30+ min** | **2 min** |

---

## 🎯 Siguiente Nivel

¿Quieres automatizar aún más? Puedes:
- 🔄 Agregar estos scripts a tu CI/CD
- 📦 Crear scripts para seed data (datos de prueba)
- 🔧 Crear scripts para migraciones
- 🧪 Crear scripts para testing

**¿Necesitas ayuda?** Revisa `backend/scripts/README.md`
