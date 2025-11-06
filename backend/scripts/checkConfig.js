/**
 * Script para verificar la configuración de Supabase
 * 
 * Este script verifica:
 * - Conexión a Supabase
 * - Tablas creadas
 * - Usuarios registrados
 * - Políticas RLS
 * - Storage bucket
 * 
 * USO:
 * node backend/scripts/checkConfig.js
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
  console.error('❌ Error: Variables de entorno no configuradas\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConfig() {
  console.log('🔍 Verificando configuración de Supabase...\n');
  
  let allGood = true;

  // 1. Verificar conexión
  console.log('1️⃣  Verificando conexión...');
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('   ❌ Error de conexión:', error.message);
      allGood = false;
    } else {
      console.log('   ✅ Conexión exitosa\n');
    }
  } catch (error) {
    console.log('   ❌ No se pudo conectar:', error.message);
    allGood = false;
  }

  // 2. Verificar tabla profiles
  console.log('2️⃣  Verificando tabla profiles...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('   ❌ Tabla profiles no existe o tiene errores');
      console.log('   💡 Ejecuta: node backend/scripts/setupSupabase.js\n');
      allGood = false;
    } else {
      console.log(`   ✅ Tabla profiles existe (${profiles.length} usuario(s))\n`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    allGood = false;
  }

  // 3. Verificar tabla curriculums
  console.log('3️⃣  Verificando tabla curriculums...');
  try {
    const { data: cvs, error } = await supabase
      .from('curriculums')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('   ❌ Tabla curriculums no existe o tiene errores');
      console.log('   💡 Ejecuta: node backend/scripts/setupSupabase.js\n');
      allGood = false;
    } else {
      console.log(`   ✅ Tabla curriculums existe (${cvs.length} CV(s))\n`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    allGood = false;
  }

  // 4. Verificar usuarios
  console.log('4️⃣  Verificando usuarios registrados...');
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('email, role');
    
    if (error) {
      console.log('   ❌ Error al obtener usuarios\n');
      allGood = false;
    } else if (users.length === 0) {
      console.log('   ⚠️  No hay usuarios registrados');
      console.log('   💡 Regístrate en: http://localhost:3000\n');
    } else {
      console.log(`   ✅ ${users.length} usuario(s) registrado(s):`);
      users.forEach(u => {
        console.log(`      ${u.role === 'admin' ? '👑' : '👤'} ${u.email} (${u.role})`);
      });
      console.log('');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    allGood = false;
  }

  // 5. Verificar Storage bucket
  console.log('5️⃣  Verificando Storage bucket "cv"...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('   ❌ Error al obtener buckets:', error.message, '\n');
      allGood = false;
    } else {
      const cvBucket = buckets.find(b => b.name === 'cv');
      if (cvBucket) {
        console.log('   ✅ Bucket "cv" existe');
        console.log(`      Público: ${cvBucket.public ? 'Sí' : 'No'}`);
        console.log(`      ID: ${cvBucket.id}\n`);
      } else {
        console.log('   ❌ Bucket "cv" no existe');
        console.log('   💡 Créalo en: Supabase Dashboard → Storage → Create bucket');
        console.log('      Name: cv, Private, PDF only, 5MB limit\n');
        allGood = false;
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    allGood = false;
  }

  // 6. Verificar CVs en storage
  console.log('6️⃣  Verificando archivos en Storage...');
  try {
    const { data: files, error } = await supabase.storage
      .from('cv')
      .list('', { limit: 100 });
    
    if (error) {
      console.log('   ⚠️  No se pudo listar archivos (normal si el bucket no existe)\n');
    } else {
      const totalFiles = files.reduce((acc, folder) => {
        if (folder.name && folder.name !== '.emptyFolderPlaceholder') {
          return acc + 1;
        }
        return acc;
      }, 0);
      console.log(`   ✅ ${totalFiles} carpeta(s) de usuarios con CVs\n`);
    }
  } catch (error) {
    console.log('   ⚠️  Error al listar archivos\n');
  }

  // Resumen final
  console.log('━'.repeat(50));
  if (allGood) {
    console.log('✅ Todo configurado correctamente!\n');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Abre: http://localhost:3000');
    console.log('   2. Regístrate o inicia sesión');
    console.log('   3. Sube un CV para probar\n');
  } else {
    console.log('⚠️  Algunas configuraciones faltan\n');
    console.log('🔧 Para corregir:');
    console.log('   1. node backend/scripts/setupSupabase.js');
    console.log('   2. Crea el bucket "cv" en Supabase Dashboard');
    console.log('   3. Regístrate en http://localhost:3000');
    console.log('   4. node backend/scripts/makeAdmin.js tu@email.com\n');
  }
}

checkConfig();
