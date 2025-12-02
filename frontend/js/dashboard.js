// Script para el dashboard
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function () {
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

  // Mostrar indicador de carga mientras se obtienen los datos
  historyList.innerHTML = `
    <div class="history-loading" role="status" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>Cargando historial…</p>
    </div>
  `;

  // Configuración de paginación responsive
  const ITEMS_PER_PAGE = window.innerWidth <= 480 ? 3 : 6;
  let currentPage = 1;
  let allFiles = [];

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
      allFiles = await Promise.all(
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

      // Función para renderizar la página actual
      function renderPage(page) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentFiles = allFiles.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allFiles.length / ITEMS_PER_PAGE);

        const filesHTML = currentFiles.map(file => {
          const statusLabels = {
            pending: 'Pendiente',
            processing: 'Procesando',
            completed: 'Completado',
            failed: 'Error'
          };

          return `
          <div class="history-item-card ${file.status === 'processing' ? 'processing-animation' : ''}">
            <div class="history-card-header">
              <div class="history-file-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="history-file-info">
                <div class="history-file-name">${file.name}</div>
                <div class="history-file-meta">
                  <span><i class="fas fa-calendar"></i> ${formatDate(file.uploadedAt)}</span>
                  <span><i class="fas fa-hdd"></i> ${formatFileSize(file.size)}</span>
                </div>
              </div>
              ${file.score ? `
                <div class="history-score">
                  <i class="fas fa-star"></i>
                  <div>
                    <div class="history-score-value">${file.score}</div>
                    <div class="history-score-label">/100</div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="history-card-body">
              <span class="history-status-badge ${file.status}"> 
                ${file.status === 'completed' ? '<i class="fas fa-check-circle"></i>' : ''}
                ${file.status === 'processing' ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
                ${file.status === 'failed' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
                ${file.status === 'pending' ? '<i class="fas fa-clock"></i>' : ''}
                ${statusLabels[file.status] || file.status}
              </span>
            </div>
            
            <div class="history-card-actions">
              <a href="#" onclick="downloadCV('${file.id}', '${file.name}'); return false;" class="history-action-btn tertiary">
                <i class="fas fa-download"></i>
                Descargar CV
              </a>
              ${file.status === 'completed' ? `
                <a href="#" onclick="viewResults('${file.id}'); return false;" class="history-action-btn secondary">
                  <i class="fas fa-chart-line"></i>
                  Ver Resultados
                </a>
              ` : ''}
              ${file.hasImprovedCV ? `
                <a href="#" onclick="openImprovedResultsModal('${file.id}'); return false;" class="history-action-btn primary">
                  <i class="fas fa-sparkles"></i>
                  CV Mejorado
                </a>
              ` : ''}
            </div>
          </div>
          `;
        }).join('');

        // Renderizar controles de paginación
        let paginationHTML = '';
        if (totalPages > 1) {
          paginationHTML = `
            <div class="pagination-controls">
              <button class="pagination-btn" onclick="changePage(${page - 1})" ${page === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <div class="pagination-info">
                Página ${page} de ${totalPages} (${allFiles.length} evaluaciones)
              </div>
              
              <button class="pagination-btn" onclick="changePage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          `;
        }

        historyList.innerHTML = `
          <div class="history-grid">
            ${filesHTML}
          </div>
          ${paginationHTML}
        `;
      }

      // Función global para cambiar de página
      window.changePage = function (page) {
        const totalPages = Math.ceil(allFiles.length / ITEMS_PER_PAGE);
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          renderPage(currentPage);
          // Scroll suave al inicio del historial
          document.getElementById('history-list').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };

      // Renderizar página inicial
      renderPage(currentPage);

    } else {
      historyList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Aún no hay evaluaciones</p>
          <small>Tus análisis aparecerán aquí</small>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar historial:', error);
    historyList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar el historial</p>
        <small>Por favor, recarga la página</small>
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

