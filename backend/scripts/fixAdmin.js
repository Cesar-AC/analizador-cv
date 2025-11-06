import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdmin() {
  const email = 'cacuna@unitru.edu.pe';
  
  console.log(`🔍 Buscando usuario: ${email}...\n`);

  try {
    // Primero, obtener el user_id desde auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listando usuarios:', authError.message);
      process.exit(1);
    }

    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      console.error('❌ Usuario no encontrado en auth.users');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado en auth:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}\n`);

    // Verificar si existe en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.log('⚠️  Perfil no encontrado, creando...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: 'Cesar Alexander Acuña Cisnero',
          role: 'admin'
        });

      if (insertError) {
        console.error('❌ Error creando perfil:', insertError.message);
        process.exit(1);
      }

      console.log('✅ ¡Perfil creado como administrador!\n');
    } else {
      console.log('✅ Perfil encontrado:');
      console.log(`   Nombre: ${profile.full_name || 'Sin nombre'}`);
      console.log(`   Role actual: ${profile.role}\n`);

      if (profile.role === 'admin') {
        console.log('ℹ️  Este usuario ya es administrador');
        process.exit(0);
      }

      // Actualizar a admin
      console.log('🔄 Actualizando role a admin...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('❌ Error al actualizar:', updateError.message);
        process.exit(1);
      }

      console.log('✅ ¡Usuario convertido en administrador!\n');
    }

    console.log('📝 Próximos pasos:');
    console.log('1. Ve a http://localhost:3000');
    console.log('2. Abre DevTools (F12) y en Console escribe: localStorage.clear()');
    console.log('3. Recarga la página (F5)');
    console.log('4. Vuelve a iniciar sesión');
    console.log('5. Serás redirigido al panel admin\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();
