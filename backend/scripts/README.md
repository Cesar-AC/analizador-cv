# 🛠️ Scripts de Administración Supabase

Esta carpeta contiene scripts útiles para configurar y administrar Supabase directamente desde código, sin necesidad de usar el dashboard web.

## 📋 Scripts Disponibles

### 1. `setupSupabase.js` - Configuración Automática

Configura toda la base de datos de Supabase automáticamente:
- ✅ Crea tablas `profiles` y `curriculums`
- ✅ Habilita Row Level Security (RLS)
- ✅ Crea políticas de seguridad
- ✅ Crea triggers automáticos
- ✅ Crea funciones para estadísticas

**Uso:**
```bash
node backend/scripts/setupSupabase.js
```

### 2. `makeAdmin.js` - Convertir Usuario en Admin

Convierte cualquier usuario registrado en administrador.

**Uso:**
```bash
node backend/scripts/makeAdmin.js tu@email.com
```

**Ejemplo:**
```bash
node backend/scripts/makeAdmin.js cacuna@unitru.edu.pe
```

### 3. `listUsers.js` - Listar Usuarios

Muestra todos los usuarios registrados con sus roles.

**Uso:**
```bash
node backend/scripts/listUsers.js
```

## ⚙️ Configuración Requerida

Para usar estos scripts necesitas la **SERVICE ROLE KEY** de Supabase.

### Obtener la SERVICE ROLE KEY:

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Settings** (⚙️) → **API**
3. En la sección **Project API keys**, copia el **`service_role`** secret
4. Agrégala a tu archivo `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu_key_aqui
```

⚠️ **IMPORTANTE**: La SERVICE ROLE KEY tiene **permisos totales** sobre tu proyecto. 
- ❌ **NUNCA** la subas a GitHub
- ❌ **NUNCA** la uses en el frontend
- ✅ Solo úsala en scripts del backend

## 🚀 Flujo de Trabajo Recomendado

### Primera Configuración:

1. **Configura la base de datos**:
   ```bash
   node backend/scripts/setupSupabase.js
   ```

2. **Regístrate en la app**: 
   - Abre http://localhost:3000
   - Regístrate con tu email

3. **Conviértete en admin**:
   ```bash
   node backend/scripts/makeAdmin.js tu@email.com
   ```

4. **Cierra sesión y vuelve a entrar**:
   - Serás redirigido automáticamente al panel admin

### Administración Diaria:

- **Ver usuarios**: `node backend/scripts/listUsers.js`
- **Hacer admin**: `node backend/scripts/makeAdmin.js email@ejemplo.com`

## 🔥 Ventajas de Usar Scripts vs Dashboard

| Aspecto | Scripts (Código) | Dashboard Web |
|---------|------------------|---------------|
| **Velocidad** | ⚡ Instantáneo | 🐌 Lento (muchos clics) |
| **Reproducible** | ✅ Sí (versionable) | ❌ Manual |
| **Automatizable** | ✅ Sí (CI/CD) | ❌ No |
| **Control** | ✅ Total | ⚠️ Limitado |
| **Backup** | ✅ En Git | ❌ No |

## 📦 Storage (Bucket de CVs)

**Nota**: El bucket de Storage (`cv`) aún debe crearse manualmente desde el dashboard porque Supabase no expone API pública para crear buckets desde código sin usar Management API.

**Pasos mínimos en Dashboard**:
1. Storage → Create bucket
2. Name: `cv`, Private, PDF only, 5MB limit
3. Listo (las políticas se manejan con RLS, no necesitas crearlas manualmente)

## 🆘 Solución de Problemas

### Error: "SUPABASE_SERVICE_ROLE_KEY no configurada"
✅ Agrega la key al archivo `.env`

### Error: "Usuario no encontrado"
✅ Asegúrate de que el usuario esté registrado primero en la app

### Error: "Table does not exist"
✅ Ejecuta primero `setupSupabase.js`

## 🎯 Beneficios de Este Enfoque

1. **No más clicks infinitos** en el dashboard
2. **Configuración versionada** en Git
3. **Fácil de replicar** en otros ambientes (dev/staging/prod)
4. **Automatizable** con scripts de CI/CD
5. **Más rápido** para desarrollo

## 📚 Referencias

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Management API](https://supabase.com/docs/reference/api)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
