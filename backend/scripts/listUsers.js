/**
 * Script para listar todos los usuarios registrados
 * 
 * USO:
 * node backend/scripts/listUsers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  console.log('📋 Listando usuarios registrados...\n');

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No hay usuarios registrados\n');
      process.exit(0);
    }

    console.log(`✅ ${users.length} usuario(s) encontrado(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.full_name || 'Sin nombre'}`);
      console.log(`   Role: ${user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}`);
      console.log(`   Registrado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
      console.log('');
    });

    console.log('💡 Para hacer admin a un usuario, ejecuta:');
    console.log('node backend/scripts/makeAdmin.js EMAIL_DEL_USUARIO\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();
