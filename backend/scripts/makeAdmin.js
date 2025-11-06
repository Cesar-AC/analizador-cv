/**
 * Script para convertir un usuario en administrador
 * 
 * USO:
 * node backend/scripts/makeAdmin.js tu@email.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la carpeta backend
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas');
  console.log('\n📝 Agrega a tu .env:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  console.log('\n💡 Encuéntrala en: Supabase Dashboard → Settings → API → Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Debes proporcionar un email');
  console.log('\n📝 Uso:');
  console.log('node backend/scripts/makeAdmin.js tu@email.com');
  process.exit(1);
}

async function makeAdmin() {
  console.log(`🔍 Buscando usuario: ${email}...\n`);

  try {
    // Buscar usuario
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error('❌ Usuario no encontrado');
      console.log('\n💡 Asegúrate de que:');
      console.log('1. El usuario esté registrado en la app');
      console.log('2. El email sea exactamente el mismo');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.full_name || 'Sin nombre'}`);
    console.log(`   Role actual: ${user.role}\n`);

    if (user.role === 'admin') {
      console.log('ℹ️  Este usuario ya es administrador');
      process.exit(0);
    }

    // Actualizar a admin
    console.log('🔄 Actualizando role a admin...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError.message);
      process.exit(1);
    }

    console.log('✅ ¡Usuario convertido en administrador!\n');
    console.log('📝 Próximos pasos:');
    console.log('1. Cierra sesión si estás logueado');
    console.log('2. Vuelve a iniciar sesión');
    console.log('3. Serás redirigido al panel admin: http://localhost:3000/admin.html\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
