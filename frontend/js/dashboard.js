// Script para el dashboard
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Cargar información del usuario
  loadUserInfo();

  // Cargar historial
  loadHistory();

  // Configurar área de carga
  setupUploadArea();

  // Responsive: ocultar texto del email en móviles
  updateResponsiveElements();
  window.addEventListener('resize', updateResponsiveElements);
});

function loadUserInfo() {
  const userInfo = getUserInfo();
  const emailElements = document.querySelectorAll('#user-email, .user-email-text');
  
  emailElements.forEach(el => {
    el.textContent = userInfo.email;
  });
  
  // Mostrar botón de admin si el usuario es admin
  if (userInfo && userInfo.role === 'admin') {
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
      adminBtn.style.display = 'inline-block';
    }
  }
}

function updateResponsiveElements() {
  const userEmailText = document.querySelectorAll('.user-email-text, .btn-text');
  
  if (window.innerWidth <= 768) {
    userEmailText.forEach(el => {
      if (el.classList.contains('user-email-text')) {
        el.style.display = 'none';
      }
      if (el.classList.contains('btn-text')) {
        el.style.display = 'none';
      }
    });
  } else {
    userEmailText.forEach(el => {
      el.style.display = 'inline';
    });
  }
}

function setupUploadArea() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');

  // Click para abrir selector
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = 'rgba(0, 123, 255, 0.1)';
    uploadArea.style.borderColor = 'var(--secondary-color)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '';
    uploadArea.style.borderColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = '';
    uploadArea.style.borderColor = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // Selección de archivo
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
}

function handleFileSelect(file) {
  // Validar tipo
  if (file.type !== 'application/pdf') {
    showAlert('error', 'Solo se permiten archivos PDF', 'upload-alert-container');
    return;
  }

  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('error', 'El archivo no debe superar 5MB', 'upload-alert-container');
    return;
  }

  selectedFile = file;

  // Mostrar información del archivo
  document.getElementById('selected-file-name').textContent = file.name;
  document.getElementById('selected-file-size').textContent = formatFileSize(file.size);
  document.getElementById('file-selected').classList.remove('hidden');
  document.getElementById('upload-btn').disabled = false;

  // Limpiar alertas
  document.getElementById('upload-alert-container').innerHTML = '';
}

function clearFile() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-selected').classList.add('hidden');
  document.getElementById('upload-btn').disabled = true;
}

async function uploadFile() {
  if (!selectedFile) {
    showAlert('error', 'Por favor selecciona un archivo', 'upload-alert-container');
    return;
  }

  const btn = document.getElementById('upload-btn');
  const originalContent = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Subiendo y analizando...';

    const formData = new FormData();
    formData.append('cv', selectedFile);

    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + (data.message || 'Tu currículum ha sido cargado y está siendo analizado por IA'), 'upload-alert-container');
      
      // Limpiar formulario
      clearFile();

      // Recargar historial inmediatamente
      loadHistory();

      // Iniciar polling para actualizar el estado del análisis
      if (data.file && data.file.status === 'processing') {
        startPollingForStatus(data.file.id);
      }
    } else {
      showAlert('error', data.message || 'Error al subir el archivo', 'upload-alert-container');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('error', 'Error de conexión. Verifica que el servidor esté corriendo.', 'upload-alert-container');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalContent;
  }
}

// Polling para verificar estado del análisis
function startPollingForStatus(cvId) {
  const pollInterval = setInterval(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/files/${cvId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.file) {
        const status = data.file.status;
        
        // Si ya no está processing, detener el polling y recargar
        if (status !== 'processing') {
          clearInterval(pollInterval);
          loadHistory();
          
          if (status === 'completed') {
            showAlert('success', `🎉 ¡Análisis completado! Puntuación: ${data.file.score || 'N/A'}/100`, 'upload-alert-container');
          } else if (status === 'failed') {
            showAlert('error', '❌ El análisis ha fallado. Por favor, intenta de nuevo.', 'upload-alert-container');
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  }, 3000); // Verificar cada 3 segundos

  // Detener después de 2 minutos (timeout)
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 120000);
}

async function loadHistory() {
  const historyList = document.getElementById('history-list');

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success && data.files && data.files.length > 0) {
      // Para cada archivo completado, verificar si tiene CV mejorado
      const filesWithImprovedStatus = await Promise.all(
        data.files.map(async (file) => {
          if (file.status === 'completed') {
            try {
              const improvedResponse = await fetch(`${API_BASE_URL}/files/${file.id}/improved-status`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const improvedData = await improvedResponse.json();
              file.hasImprovedCV = improvedData.success && improvedData.status === 'completed';
              file.improvedProcessingTime = improvedData.processing_time_seconds;
            } catch (error) {
              file.hasImprovedCV = false;
            }
          }
          return file;
        })
      );

      historyList.innerHTML = filesWithImprovedStatus.map(file => {
        const statusColors = {
          pending: '#ffa500',
          processing: '#2196f3',
          completed: '#4caf50',
          failed: '#f44336'
        };
        const statusLabels = {
          pending: 'Pendiente',
          processing: 'Analizando...',
          completed: 'Completado',
          failed: 'Error'
        };
        const statusIcons = {
          pending: '<i class="fas fa-clock"></i>',
          processing: '<i class="fas fa-spinner fa-spin"></i>',
          completed: '<i class="fas fa-check-circle"></i>',
          failed: '<i class="fas fa-exclamation-circle"></i>'
        };
        const statusColor = statusColors[file.status] || '#999';
        const statusLabel = statusLabels[file.status] || file.status;
        const statusIcon = statusIcons[file.status] || '';
        
        return `
        <div class="history-item ${file.status === 'processing' ? 'processing-animation' : ''}">
          <div class="item-header">
            <h4>
              <i class="fas fa-file-pdf"></i>
              ${file.name}
            </h4>
            <span class="date">
              <i class="fas fa-calendar-alt"></i>
              ${formatDate(file.uploadedAt)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem;">
            <p class="file-size" style="margin: 0;">
              <i class="fas fa-hdd"></i>
              Tamaño: ${formatFileSize(file.size)}
            </p>
            <span class="status-badge" style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
              ${statusIcon}
              ${statusLabel}
            </span>
            ${file.score ? `<span style="color: var(--primary-color); font-weight: 600;">
              <i class="fas fa-star"></i> Puntuación: ${file.score}/100
            </span>` : ''}
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button onclick="downloadCV('${file.id}', '${file.name}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
              <i class="fas fa-download"></i>
              Descargar PDF
            </button>
            ${file.status === 'completed' ? `
              <button onclick="viewResults('${file.id}')" class="btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <i class="fas fa-chart-line"></i>
                Ver Resultados
              </button>
            ` : ''}
            ${file.hasImprovedCV ? `
              <button onclick="openImprovedResultsModal('${file.id}')" class="btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; position: relative;">
                <i class="fas fa-sparkles"></i>
                CV Mejorado
              </button>
            ` : ''}
          </div>
        </div>
      `;
      }).join('');
    } else {
      historyList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>Aún no has subido ningún currículum</p>
          <small>Sube tu primer CV para comenzar el análisis</small>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar historial:', error);
    historyList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar el historial</p>
        <small>Por favor, intenta recargar la página</small>
      </div>
    `;
  }
}

function logout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    clearAuthToken();
    window.location.href = '/';
  }
}

function showAlert(type, message, containerId) {
  const container = document.getElementById(containerId);
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  container.innerHTML = `
    <div class="alert ${alertClass}">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Hoy';
  } else if (diffDays === 2) {
    return 'Ayer';
  } else if (diffDays <= 7) {
    return `Hace ${diffDays - 1} días`;
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Función para ver resultados del análisis
function viewResults(cvId) {
  window.location.href = `cv-results.html?id=${cvId}`;
}

// Función para ver resultados del CV mejorado (ahora abre el modal)
function viewImprovedResults(cvId) {
  // Abrir modal directamente en lugar de redirigir
  if (typeof openImprovedResultsModal === 'function') {
    openImprovedResultsModal(cvId);
  } else {
    console.error('❌ La función openImprovedResultsModal no está disponible');
    // Fallback: redirigir a cv-results
    window.location.href = `cv-results.html?id=${cvId}&openImproved=true`;
  }
}

// Función para formatear el tiempo de procesamiento
function formatProcessingTime(seconds) {
  // Si el valor parece ser un timestamp Unix (mayor a 1 año en segundos)
  if (seconds > 31536000) {
    return 'Error en cálculo';
  }
  
  if (seconds < 60) {
    return `${seconds} seg`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 
      ? `${hours}h ${minutes}m` 
      : `${hours} horas`;
  }
}

// Función para descargar CV
async function downloadCV(cvId, fileName) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/files/${cvId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al descargar el archivo');
    }

    // Convertir la respuesta a blob
    const blob = await response.blob();

    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showAlert('success', 'Archivo descargado correctamente', 'upload-alert-container');
  } catch (error) {
    console.error('Error al descargar:', error);
    showAlert('error', 'Error al descargar el archivo. Por favor, intenta de nuevo.', 'upload-alert-container');
  }
}

