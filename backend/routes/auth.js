import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para subida de avatares
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Por defecto, todos los nuevos usuarios son 'user'
    // Solo un admin puede crear otro admin
    const userRole = role || 'user';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          role: userRole
        },
        emailRedirectTo: process.env.FRONTEND_URL || 'http://localhost:3000' + '/dashboard.html'
      }
    });

    if (error) {
      console.error('Error en registro:', error);
      return res.status(400).json({
        success: false,
        message: error.message === 'User already registered'
          ? 'Este email ya está registrado'
          : error.message
      });
    }

    // El perfil se crea automáticamente con el trigger en Supabase
    res.json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      },
      needsEmailConfirmation: true
    });
  } catch (error) {
    console.error('Error en /register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error en login:', error);
      return res.status(401).json({
        success: false,
        message: error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : 'Error al iniciar sesión'
      });
    }

    // Obtener el perfil del usuario con su role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      // Si no existe el perfil, crear uno
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || '',
          role: 'user'
        });

      if (insertError) {
        console.error('Error al crear perfil:', insertError);
      }
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || '',
        role: profile?.role || 'user'
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar supabase regular con el token del usuario
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Error validando usuario:', error);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Obtener perfil con role usando supabaseAdmin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: data.user.email,
        full_name: profile?.full_name || '',
        role: profile?.role || 'user'
      }
    });
  } catch (error) {
    console.error('Error en /verify:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar supabase regular con el token del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('Error validando usuario:', userError);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Obtener perfil usando supabaseAdmin para bypasear RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('Error obteniendo perfil:', profileError);
      return res.status(404).json({
        success: false,
        message: 'Perfil no encontrado'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error en /profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Subir avatar del usuario
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar supabase regular con el token del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('Error validando usuario:', userError);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Generar URL del avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Opcional: eliminar avatar anterior si existe
    const { data: oldProfile } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (oldProfile?.avatar_url && oldProfile.avatar_url.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../..', oldProfile.avatar_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    res.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar subido exitosamente'
    });
  } catch (error) {
    console.error('Error en /upload-avatar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// Actualizar perfil del usuario actual
router.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar supabase regular con el token del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('Error validando usuario:', userError);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const { full_name, avatar_url } = req.body;

    // Preparar datos a actualizar (sin permitir cambiar role)
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error al actualizar perfil:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el perfil'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      profile
    });
  } catch (error) {
    console.error('Error en PATCH /profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener currículums del usuario actual
router.get('/curriculums', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('Error validando usuario:', userError);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Obtener curriculums del usuario usando supabaseAdmin
    const { data: curriculums, error: cvError } = await supabaseAdmin
      .from('curriculums')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (cvError) {
      console.error('Error obteniendo curriculums:', cvError);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener currículums',
        error: cvError.message
      });
    }

    res.json({
      success: true,
      curriculums: curriculums || []
    });
  } catch (error) {
    console.error('Error en /auth/curriculums:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener currículums',
      error: error.message
    });
  }
});

// Descargar curriculum del usuario
router.get('/curriculums/:id/download', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const { id } = req.params;

    // Obtener curriculum y verificar que pertenece al usuario
    const { data: curriculum, error } = await supabaseAdmin
      .from('curriculums')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum no encontrado'
      });
    }

    // Obtener el archivo desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('cv')
      .download(curriculum.file_url);

    if (downloadError || !fileData) {
      console.error('Error al descargar desde Storage:', downloadError);
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el almacenamiento'
      });
    }

    // Convertir el blob a buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Configurar headers para la descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${curriculum.file_name}"`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar el archivo
    res.send(buffer);
  } catch (error) {
    console.error('Error en /auth/curriculums/:id/download:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el curriculum'
    });
  }
});

export default router;
