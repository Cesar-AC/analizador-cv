// Configuración de Supabase para el frontend
// Configuración de Supabase para el frontend
// NOTA: El frontend no conecta directamente con Supabase, todo pasa por el backend.
// Estas variables se mantienen por compatibilidad si en el futuro se requiere acceso directo.
const SUPABASE_CONFIG = {
  url: '', // Se maneja en el backend
  anonKey: '' // Se maneja en el backend
};

// Detectar entorno automáticamente
function getEnvironment() {
  const hostname = window.location.hostname;

  // Si es localhost o 127.0.0.1, estamos en desarrollo
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }

  // Cualquier otro hostname es producción
  return 'production';
}

// Obtener URL base según el entorno
function getBaseUrl() {
  const env = getEnvironment();

  if (env === 'development') {
    return 'http://localhost:3000';
  }

  // En producción, usar la URL actual del navegador
  return window.location.origin;
}

// Obtener URL de la API
function getApiUrl() {
  return `${getBaseUrl()}/api`;
}

// URL base de la API (compatible con código existente)
const API_BASE_URL = getApiUrl();

// Función para obtener el token de sesión
function getAuthToken() {
  return localStorage.getItem('access_token');
}

// Función para establecer el token de sesión
function setAuthToken(token) {
  localStorage.setItem('access_token', token);
}

// Función para eliminar el token de sesión
function clearAuthToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_id');
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
  return !!getAuthToken();
}

// Función para guardar información del usuario
function setUserInfo(user) {
  localStorage.setItem('user_email', user.email);
  localStorage.setItem('user_id', user.id);
  localStorage.setItem('user_role', user.role || 'user');
  localStorage.setItem('user_full_name', user.full_name || '');
}

// Función para obtener información del usuario
function getUserInfo() {
  return {
    email: localStorage.getItem('user_email'),
    id: localStorage.getItem('user_id'),
    role: localStorage.getItem('user_role') || 'user',
    full_name: localStorage.getItem('user_full_name') || ''
  };
}

// Función para verificar si el usuario es admin
function isAdmin() {
  return getUserInfo().role === 'admin';
}

// Log del entorno actual (solo en desarrollo)
// if (getEnvironment() === 'development') {
//   Logs desactivados para producción
// }
