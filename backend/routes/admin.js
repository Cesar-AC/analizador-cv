import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Middleware para verificar que el usuario es administrador
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar el token con el cliente normal
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }

    // Verificar role en la tabla profiles - SIMPLE QUERY
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al verificar permisos' 
      });
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Se requieren permisos de administrador.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en verificación de admin:', error);
    res.status(401).json({ 
      success: false, 
      message: 'No autorizado' 
    });
  }
};

// Obtener estadísticas generales
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    // Usar supabaseAdmin para bypass RLS
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    const { count: totalAdmins } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    const { count: totalCVs } = await supabaseAdmin
      .from('curriculums')
      .select('*', { count: 'exact', head: true });

    const { data: cvsByStatus } = await supabaseAdmin
      .from('curriculums')
      .select('status')
      .then(result => {
        if (result.error) return { data: [] };
        const counts = {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        };
        result.data.forEach(cv => {
          counts[cv.status] = (counts[cv.status] || 0) + 1;
        });
        return { data: counts };
      });

    const { data: avgScore } = await supabaseAdmin
      .from('curriculums')
      .select('score')
      .not('score', 'is', null)
      .then(result => {
        if (result.error || !result.data.length) return { data: 0 };
        const sum = result.data.reduce((acc, cv) => acc + (cv.score || 0), 0);
        return { data: Math.round(sum / result.data.length) };
      });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: newUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Últimos 30 días - nuevos CVs
    const { count: newCVs } = await supabaseAdmin
      .from('curriculums')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', thirtyDaysAgo.toISOString());

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          admins: totalAdmins || 0,
          newLast30Days: newUsers || 0
        },
        curriculums: {
          total: totalCVs || 0,
          pending: cvsByStatus?.pending || 0,
          processing: cvsByStatus?.processing || 0,
          completed: cvsByStatus?.completed || 0,
          failed: cvsByStatus?.failed || 0,
          newLast30Days: newCVs || 0,
          averageScore: avgScore || 0
        }
      }
    });
  } catch (error) {
    console.error('Error en /admin/stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
});

// Obtener lista de todos los usuarios
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener usuarios' 
      });
    }

    // Obtener cantidad de CVs por usuario
    const usersWithCVCount = await Promise.all(
      users.map(async (user) => {
        const { count } = await supabaseAdmin
          .from('curriculums')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          ...user,
          cv_count: count || 0
        };
      })
    );

    res.json({
      success: true,
      users: usersWithCVCount
    });
  } catch (error) {
    console.error('Error en /admin/users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios' 
    });
  }
});

// Obtener todos los CVs (de todos los usuarios)
router.get('/curriculums', verifyAdmin, async (req, res) => {
  try {
    // Primero obtener los curriculums
    const { data: curriculums, error: cvError } = await supabaseAdmin
      .from('curriculums')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (cvError) {
      console.error('Error obteniendo curriculums:', cvError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener currículums',
        error: cvError.message
      });
    }

    // Si no hay curriculums, devolver array vacío
    if (!curriculums || curriculums.length === 0) {
      return res.json({
        success: true,
        curriculums: []
      });
    }

    // Obtener información de usuarios para cada curriculum
    const curriculumsWithUsers = await Promise.all(
      curriculums.map(async (cv) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', cv.user_id)
          .single();

        return {
          ...cv,
          profiles: profile || { email: 'Desconocido', full_name: 'Desconocido' }
        };
      })
    );

    res.json({
      success: true,
      curriculums: curriculumsWithUsers
    });
  } catch (error) {
    console.error('Error en /admin/curriculums:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener currículums',
      error: error.message
    });
  }
});

// Obtener información de un CV específico (admin puede ver cualquier CV)
router.get('/curriculums/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: curriculum, error } = await supabaseAdmin
      .from('curriculums')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !curriculum) {
      return res.status(404).json({ 
        success: false, 
        message: 'Archivo no encontrado' 
      });
    }

    res.json({
      success: true,
      file: curriculum
    });
  } catch (error) {
    console.error('Error en /admin/curriculums/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener información del CV' 
    });
  }
});

// Descargar PDF de curriculum
router.get('/curriculums/:id/download', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del curriculum
    const { data: curriculum, error } = await supabaseAdmin
      .from('curriculums')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !curriculum) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curriculum no encontrado' 
      });
    }

    // Verificar que el archivo existe
    const filePath = path.join(__dirname, '../..', curriculum.file_url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Archivo no encontrado' 
      });
    }

    // Enviar archivo para descarga
    res.download(filePath, curriculum.file_name, (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: 'Error al descargar el archivo' 
          });
        }
      }
    });
  } catch (error) {
    console.error('Error en /admin/curriculums/:id/download:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al descargar el curriculum' 
    });
  }
});

// Cambiar role de un usuario
router.patch('/users/:userId/role', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role inválido. Debe ser "user" o "admin"' 
      });
    }

    // No permitir que el admin se quite sus propios permisos
    if (userId === req.user.id && role === 'user') {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes quitarte tus propios permisos de administrador' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el role' 
      });
    }

    res.json({
      success: true,
      message: `Role actualizado a ${role}`,
      user: data
    });
  } catch (error) {
    console.error('Error en PATCH /admin/users/:userId/role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar role' 
    });
  }
});

// Actualizar información de un usuario (solo admins)
router.patch('/users/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, avatar_url, email } = req.body;

    // Preparar datos a actualizar
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar usuario:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el usuario' 
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: data
    });
  } catch (error) {
    console.error('Error en PATCH /admin/users/:userId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar usuario' 
    });
  }
});

// Eliminar usuario (solo admins)
router.delete('/users/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Primero eliminar todos los CVs del usuario (storage y BD)
    const { data: cvs } = await supabaseAdmin
      .from('curriculums')
      .select('file_path')
      .eq('user_id', userId);

    if (cvs && cvs.length > 0) {
      const filePaths = cvs.map(cv => cv.file_path);
      await supabaseAdmin.storage.from('cv').remove(filePaths);
    }

    // Eliminar perfil (los CVs se eliminan en cascada)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar usuario' 
      });
    }

    // Nota: Para eliminar completamente el usuario de auth.users,
    // necesitarías usar la Admin API de Supabase o hacerlo desde el dashboard

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en DELETE /admin/users/:userId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar usuario' 
    });
  }
});

// Actualizar estado de un CV
router.patch('/curriculums/:cvId/status', verifyAdmin, async (req, res) => {
  try {
    const { cvId } = req.params;
    const { status, score, analysis_result } = req.body;

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado inválido' 
      });
    }

    const updateData = { status };
    
    if (score !== undefined) {
      updateData.score = score;
    }
    
    if (analysis_result !== undefined) {
      updateData.analysis_result = analysis_result;
    }

    if (status === 'completed') {
      updateData.analyzed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('curriculums')
      .update(updateData)
      .eq('id', cvId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el currículum' 
      });
    }

    res.json({
      success: true,
      message: 'Currículum actualizado',
      curriculum: data
    });
  } catch (error) {
    console.error('Error en PATCH /admin/curriculums/:cvId/status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar currículum' 
    });
  }
});

export default router;
