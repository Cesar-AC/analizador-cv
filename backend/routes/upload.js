import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// Middleware para verificar autenticación
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(401).json({ 
      success: false, 
      message: 'No autorizado' 
    });
  }
};

// Subir archivo CV
router.post('/upload', verifyAuth, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionó ningún archivo' 
      });
    }

    const file = req.file;
    const userId = req.user.id;
    
    // Sanitizar el nombre del archivo (remover caracteres especiales y acentos)
    const sanitizedFileName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-zA-Z0-9._-]/g, '_'); // Reemplazar caracteres especiales con _
    
    const fileName = `${userId}/${Date.now()}-${sanitizedFileName}`;

    // Leer el archivo
    const fileBuffer = fs.readFileSync(file.path);

    // Subir a Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('cv')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    // Eliminar archivo temporal
    fs.unlinkSync(file.path);

    if (storageError) {
      console.error('Error al subir a Supabase Storage:', storageError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al subir el archivo: ' + storageError.message 
      });
    }

    // Obtener URL pública (si el bucket es público) o crear URL firmada
    const { data: urlData } = supabase.storage
      .from('cv')
      .getPublicUrl(fileName);

    // Guardar información en la base de datos con status 'processing'
    const { data: dbData, error: dbError } = await supabase
      .from('curriculums')
      .insert({
        user_id: userId,
        file_name: file.originalname,
        file_path: storageData.path,
        file_size: file.size,
        status: 'processing'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error al guardar en BD:', dbError);
      // Intentar eliminar el archivo del storage si falla la BD
      await supabase.storage.from('cv').remove([fileName]);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error al registrar el archivo en la base de datos' 
      });
    }

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Responder inmediatamente al frontend
    res.json({
      success: true,
      message: 'Tu currículum ha sido cargado y está siendo analizado',
      file: {
        id: dbData.id,
        name: file.originalname,
        size: file.size,
        uploadedAt: dbData.uploaded_at,
        path: storageData.path,
        url: urlData.publicUrl,
        status: 'processing'
      }
    });

    // Enviar a n8n en segundo plano
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      console.log('📤 Enviando CV a n8n webhook:', n8nWebhookUrl);
      
      // Preparar los datos para n8n usando FormData
      const formData = new FormData();
      
      // Agregar el action para routing en n8n
      formData.append('action', 'analyze');
      
      // Agregar el PDF como archivo
      formData.append('pdf', fileBuffer, {
        filename: sanitizedFileName,
        contentType: 'application/pdf'
      });
      
      // Agregar datos del usuario y del CV
      formData.append('cvId', dbData.id);
      formData.append('userId', userId);
      formData.append('userEmail', userData?.email || '');
      formData.append('userName', userData?.full_name || '');
      formData.append('fileName', sanitizedFileName);
      formData.append('fileSize', file.size.toString());

      // Enviar a n8n de forma asíncrona
      fetch(n8nWebhookUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      })
      .then(async (response) => {
        console.log('📥 Respuesta de n8n recibida (análisis):', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error en respuesta de n8n:', response.status, errorText);
          // Marcar como fallido
          await supabaseAdmin
            .from('curriculums')
            .update({ status: 'failed' })
            .eq('id', dbData.id);
          return;
        }
        
        // Parsear respuesta JSON
        let result;
        try {
          result = await response.json();
          console.log('✅ JSON parseado correctamente. Tipo:', Array.isArray(result) ? 'array' : 'object');
        } catch (e) {
          console.error('❌ Error al parsear JSON de n8n:', e.message);
          await supabaseAdmin
            .from('curriculums')
            .update({ status: 'failed' })
            .eq('id', dbData.id);
          return;
        }
        
        // Extraer datos del análisis
        let score = 0;
        let analysisData = result;
        
        // n8n envía un array con el resultado
        if (Array.isArray(result) && result.length > 0) {
          analysisData = result[0];
          score = analysisData?.meta?.puntaje_total || 0;
          console.log('📊 Datos extraídos del array:', {
            puntaje: score,
            secciones: analysisData?.meta?.secciones_detectadas?.length || 0
          });
        } else if (result.meta) {
          // O puede venir como objeto directo
          score = result.meta.puntaje_total || 0;
          console.log('📊 Datos extraídos del objeto:', { puntaje: score });
        } else {
          console.warn('⚠️ Formato inesperado de respuesta n8n');
        }
        
        console.log('💾 Actualizando BD con puntaje:', score);
        
        // Actualizar en BD
        const { error: updateError } = await supabaseAdmin
          .from('curriculums')
          .update({
            status: 'completed',
            score: score,
            analysis_result: analysisData,
            analyzed_at: new Date().toISOString()
          })
          .eq('id', dbData.id);
        
        if (updateError) {
          console.error('❌ Error al actualizar BD:', updateError);
        } else {
          console.log(`✅ CV ${dbData.id} completado. Puntaje: ${score}/100`);
        }
      })
      .catch(async (error) => {
        console.error('❌ Error fatal en análisis:', error.message);
        await supabaseAdmin
          .from('curriculums')
          .update({ status: 'failed' })
          .eq('id', dbData.id);
      });
    } else {
      console.warn('⚠️ N8N_WEBHOOK_URL no configurado');
      await supabaseAdmin
        .from('curriculums')
        .update({ status: 'pending' })
        .eq('id', dbData.id);
    }

  } catch (error) {
    console.error('Error en /upload:', error);
    
    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar el archivo' 
    });
  }
});

// Obtener lista de CVs del usuario
router.get('/files', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Si es admin, obtener todos los CVs; si no, solo los suyos
    let query = supabase
      .from('curriculums')
      .select('*')
      .order('uploaded_at', { ascending: false });

    // Si NO es admin, filtrar solo por su user_id
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error('Error al listar archivos:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener archivos' 
      });
    }

    res.json({
      success: true,
      files: files.map(file => ({
        id: file.id,
        name: file.file_name,
        size: file.file_size,
        status: file.status,
        score: file.score,
        uploadedAt: file.uploaded_at,
        analyzedAt: file.analyzed_at
      }))
    });
  } catch (error) {
    console.error('Error en /files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener un CV específico
router.get('/files/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: file, error } = await supabase
      .from('curriculums')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !file) {
      return res.status(404).json({ 
        success: false, 
        message: 'Archivo no encontrado' 
      });
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error en /files/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Eliminar un CV
router.delete('/files/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Obtener información del archivo
    const { data: file, error: fetchError } = await supabase
      .from('curriculums')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ 
        success: false, 
        message: 'Archivo no encontrado' 
      });
    }

    // Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from('cv')
      .remove([file.file_path]);

    if (storageError) {
      console.error('Error al eliminar de storage:', storageError);
    }

    // Eliminar de BD
    const { error: deleteError } = await supabase
      .from('curriculums')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el archivo' 
      });
    }

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en DELETE /files/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Descargar un CV
router.get('/files/:id/download', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario es administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Usar supabaseAdmin para evitar problemas con RLS
    // Si es admin puede descargar cualquier archivo, si no solo los suyos
    let query = supabaseAdmin
      .from('curriculums')
      .select('*')
      .eq('id', id);

    // Si NO es admin, filtrar solo por su user_id
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: file, error: fetchError } = await query.single();

    if (fetchError || !file) {
      console.error('Error al obtener archivo:', fetchError);
      return res.status(404).json({ 
        success: false, 
        message: 'Archivo no encontrado' 
      });
    }

    // Descargar el archivo desde Supabase Storage usando supabaseAdmin
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('cv')
      .download(file.file_path);

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
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar el archivo
    res.send(buffer);
  } catch (error) {
    console.error('Error en GET /files/:id/download:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al descargar el archivo' 
    });
  }
});

// Endpoint para guardar respuestas del modal de mejora
router.post('/files/:id/improvement-answers', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timestamp } = req.body;
    const userId = req.user.id;

    console.log('📝 Guardando respuestas de mejora para CV:', id);
    console.log('Usuario:', userId);
    console.log('Cantidad de respuestas:', answers?.length);
    console.log('Datos recibidos:', JSON.stringify({ answers, timestamp }, null, 2));

    // Verificar que el CV pertenece al usuario
    const { data: cv, error: cvError } = await supabase
      .from('curriculums')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (cvError || !cv) {
      console.error('CV no encontrado:', cvError);
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }

    // Calcular respuestas contestadas y omitidas
    const answered_count = answers.filter(a => a.respuesta && a.respuesta.trim() !== '').length;
    const skipped_count = answers.filter(a => a.omitida === true || !a.respuesta || a.respuesta.trim() === '').length;

    // Guardar las respuestas en una columna JSONB
    const improvementData = {
      answers: answers,
      timestamp: timestamp,
      answered_count: answered_count,
      skipped_count: skipped_count
    };

    console.log('Datos a guardar:', JSON.stringify(improvementData, null, 2));

    const { data: updated, error: updateError } = await supabase
      .from('curriculums')
      .update({
        improvement_answers: improvementData
      })
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('❌ Error al actualizar respuestas:', updateError);
      console.error('Detalles del error:', JSON.stringify(updateError, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Error al guardar respuestas',
        error: updateError.message
      });
    }

    console.log('✅ Respuestas guardadas exitosamente');
    console.log('Datos actualizados:', JSON.stringify(updated, null, 2));

    res.json({
      success: true,
      message: 'Respuestas guardadas correctamente',
      data: updated
    });

  } catch (error) {
    console.error('❌ Error en POST /files/:id/improvement-answers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar respuestas',
      error: error.message
    });
  }
});

// ============================================================================
// ENDPOINT 2: Iniciar generación de CV mejorado
// ============================================================================
router.post('/files/:id/generate-improved', verifyAuth, async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { template } = req.body;

    // Validar que el template sea válido
    const validTemplates = ['harvard', 'mit', 'oxford'];
    if (!template || !validTemplates.includes(template)) {
      return res.status(400).json({
        success: false,
        message: 'Template inválido. Debe ser: harvard, mit u oxford'
      });
    }

    // Obtener CV de la base de datos
    const { data: cv, error: fetchError } = await supabase
      .from('curriculums')
      .select('*')
      .eq('id', cvId)
      .single();

    if (fetchError || !cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario
    if (cv.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para mejorar este CV'
      });
    }

    // Verificar que el CV tenga análisis completado
    if (cv.status !== 'completed' || !cv.analysis_result) {
      return res.status(400).json({
        success: false,
        message: 'El CV debe tener análisis completado antes de mejorar'
      });
    }

    // Verificar que tenga respuestas de mejora
    if (!cv.improvement_answers) {
      return res.status(400).json({
        success: false,
        message: 'Debes responder las preguntas de mejora primero'
      });
    }

    // Actualizar estado a 'pending'
    const { error: updateError } = await supabase
      .from('curriculums')
      .update({
        improvement_status: 'pending',
        selected_template: template,
        improvement_requested_at: new Date().toISOString()
      })
      .eq('id', cvId);

    if (updateError) {
      throw updateError;
    }

    // Preparar payload para n8n
    const n8nPayload = {
      action: 'improve',
      cvId: cvId,
      userId: userId,
      userEmail: userEmail,
      template: template,
      originalFileName: cv.file_name,
      originalFilePath: cv.file_path,
      originalFileUrl: cv.file_url,
      originalAnalysis: cv.analysis_result,
      improvementAnswers: cv.improvement_answers
    };

    // Enviar a n8n (webhook unificado)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL no configurada');
    }

    console.log('📤 Enviando CV a n8n para mejora:', webhookUrl);

    // Responder inmediatamente al frontend
    res.json({
      success: true,
      message: 'Generación de CV mejorado iniciada',
      estimated_time: '2-3 minutos',
      template: template
    });

    // Enviar a n8n y procesar respuesta en segundo plano (IGUAL QUE ANÁLISIS)
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nPayload)
    })
    .then(async (response) => {
      console.log('📥 Respuesta de n8n recibida (mejora):', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta de n8n (mejora):', response.status, errorText);
        await supabaseAdmin
          .from('curriculums')
          .update({ 
            improvement_status: 'failed',
            improvement_error: `Error de n8n: ${response.status} - ${errorText}`
          })
          .eq('id', cvId);
        return;
      }
      
      // Parsear respuesta JSON
      let result;
      try {
        result = await response.json();
        console.log('✅ JSON parseado correctamente (mejora). Tipo:', Array.isArray(result) ? 'array' : 'object');
      } catch (e) {
        console.error('❌ Error al parsear JSON de n8n (mejora):', e.message);
        await supabaseAdmin
          .from('curriculums')
          .update({ 
            improvement_status: 'failed',
            improvement_error: `Error al parsear JSON: ${e.message}`
          })
          .eq('id', cvId);
        return;
      }
      
      // Extraer datos del CV mejorado
      let improvedData = result;
      
      // n8n envía un array con el resultado
      if (Array.isArray(result) && result.length > 0) {
        improvedData = result[0];
        console.log('📊 Datos del CV mejorado (array):', {
          ok: improvedData.ok,
          template: improvedData.template,
          hasPDF: !!improvedData.pdf?.url,
          hasHeader: !!improvedData.header,
          hasSummary: !!improvedData.summary
        });
      } else {
        console.log('📊 Datos del CV mejorado (objeto):', {
          ok: improvedData.ok,
          template: improvedData.template,
          hasPDF: !!improvedData.pdf?.url
        });
      }
      
      // Calcular tiempo de procesamiento
      const startTime = new Date(cv.improvement_requested_at);
      const endTime = new Date();
      const processingTime = Math.floor((endTime - startTime) / 1000);
      
      console.log('💾 Guardando CV mejorado en BD...');
      
      // Actualizar en BD
      const { error: updateError } = await supabaseAdmin
        .from('curriculums')
        .update({
          improvement_status: 'completed',
          improved_cv_url: improvedData.pdf?.url || null,
          improved_cv_data: improvedData,
          improved_at: new Date().toISOString(),
          improvement_processing_time_seconds: processingTime
        })
        .eq('id', cvId);
      
      if (updateError) {
        console.error('❌ Error al actualizar BD (mejora):', updateError);
      } else {
        console.log(`✅ CV mejorado ${cvId} guardado. Template: ${improvedData.template}, Tiempo: ${processingTime}s`);
      }
    })
    .catch(async (error) => {
      console.error('❌ Error fatal en mejora:', error.message);
      await supabaseAdmin
        .from('curriculums')
        .update({ 
          improvement_status: 'failed',
          improvement_error: error.message
        })
        .eq('id', cvId);
    });

  } catch (error) {
    console.error('❌ Error en POST /files/:id/generate-improved:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar generación de CV mejorado',
      error: error.message
    });
  }
});

// ============================================================================
// ENDPOINT 3: Callback de n8n cuando el CV mejorado está listo
// ============================================================================
router.patch('/files/:id/update-improved', async (req, res) => {
  try {
    const cvId = req.params.id;
    const { 
      improved_cv_url, 
      improved_cv_data,
      status, 
      error: errorMessage,
      processing_time_seconds 
    } = req.body;

    console.log('📥 Callback de n8n - CV mejorado:', {
      cvId,
      status,
      hasUrl: !!improved_cv_url,
      hasData: !!improved_cv_data,
      template: improved_cv_data?.template,
      processingTime: processing_time_seconds
    });

    // Validar status
    if (!status || !['completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Debe ser: completed o failed'
      });
    }

    // Obtener CV para calcular tiempo de procesamiento
    const { data: cv, error: fetchError } = await supabase
      .from('curriculums')
      .select('improvement_requested_at')
      .eq('id', cvId)
      .single();

    if (fetchError || !cv) {
      console.error('❌ CV no encontrado:', cvId);
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }

    // Calcular tiempo de procesamiento en segundos
    let processingTime = processing_time_seconds;
    if (!processingTime && cv.improvement_requested_at) {
      const startTime = new Date(cv.improvement_requested_at);
      const endTime = new Date();
      processingTime = Math.floor((endTime - startTime) / 1000);
    }

    // Preparar datos de actualización
    const updateData = {
      improvement_status: status,
      improved_at: new Date().toISOString(),
      improvement_processing_time_seconds: processingTime
    };

    // Si fue exitoso, guardar URL y datos completos
    if (status === 'completed') {
      if (improved_cv_url) {
        updateData.improved_cv_url = improved_cv_url;
      }
      
      if (improved_cv_data) {
        // Guardar el JSON completo del CV mejorado
        updateData.improved_cv_data = improved_cv_data;
        
        console.log('💾 Guardando datos del CV mejorado:', {
          template: improved_cv_data.template,
          version: improved_cv_data.version,
          hasHeader: !!improved_cv_data.header,
          hasSummary: !!improved_cv_data.summary,
          educationCount: improved_cv_data.education?.length || 0,
          experienceCount: improved_cv_data.experience?.length || 0,
          skillsCategories: Object.keys(improved_cv_data.skills || {}),
          warningsCount: improved_cv_data.warnings?.length || 0
        });
      }
    }

    // Si falló, guardar mensaje de error
    if (status === 'failed') {
      updateData.improvement_error = errorMessage || 'Error desconocido en n8n';
      console.error('⚠️ Mejora de CV falló:', errorMessage);
    }

    // Actualizar en base de datos
    const { error: updateError } = await supabase
      .from('curriculums')
      .update(updateData)
      .eq('id', cvId);

    if (updateError) {
      console.error('❌ Error al actualizar BD:', updateError);
      throw updateError;
    }

    const successMessage = status === 'completed' 
      ? '✅ CV mejorado guardado exitosamente' 
      : '⚠️ Mejora de CV marcada como fallida';
    
    console.log(successMessage, {
      cvId,
      processingTime: `${processingTime}s`,
      template: improved_cv_data?.template
    });

    res.json({
      success: true,
      message: successMessage,
      data: {
        cvId,
        status,
        processing_time_seconds: processingTime,
        improved_cv_url: improved_cv_url || null,
        template: improved_cv_data?.template || null
      }
    });

  } catch (error) {
    console.error('❌ Error en PATCH /files/:id/update-improved:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de CV mejorado',
      error: error.message
    });
  }
});

// ============================================================================
// ENDPOINT 4: Verificar estado del CV mejorado (polling)
// ============================================================================
router.get('/files/:id/improved-status', verifyAuth, async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Obtener CV de la base de datos con datos completos
    const { data: cv, error: fetchError } = await supabase
      .from('curriculums')
      .select('user_id, improvement_status, improved_cv_url, improved_cv_data, selected_template, improvement_processing_time_seconds, improvement_error')
      .eq('id', cvId)
      .single();

    if (fetchError || !cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }

    // Verificar permisos (propietario o admin)
    if (cv.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este CV'
      });
    }

    // Responder con estado actual y datos completos
    res.json({
      success: true,
      status: cv.improvement_status || 'not_started',
      improved_cv_url: cv.improved_cv_url || null,
      improved_cv_data: cv.improved_cv_data || null,
      selected_template: cv.selected_template || null,
      processing_time_seconds: cv.improvement_processing_time_seconds || null,
      error: cv.improvement_error || null
    });

  } catch (error) {
    console.error('❌ Error en GET /files/:id/improved-status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de CV mejorado',
      error: error.message
    });
  }
});

export default router;
