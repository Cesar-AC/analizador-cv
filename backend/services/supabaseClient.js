import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Verificando credenciales de Supabase...');
console.log('   URL:', supabaseUrl ? '✅' : '❌');
console.log('   ANON_KEY:', supabaseKey ? '✅' : '❌');
console.log('   SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las credenciales de Supabase en las variables de entorno');
}

if (!supabaseServiceKey) {
  throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
}

// Cliente normal (respeta RLS) - para usuarios normales
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente admin (bypass RLS) - para operaciones de administrador
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Clientes de Supabase inicializados correctamente');
