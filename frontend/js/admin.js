// Script para el panel de administración
document.addEventListener('DOMContentLoaded', async function() {
  // Verificar autenticación y permisos
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Verificar rol desde el servidor (no confiar solo en localStorage)
  const hasAccess = await verifyAdminAccess();
  
  if (!hasAccess) {
    alert('Acceso denegado. No tienes permisos de administrador.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Cargar información del usuario
  loadAdminInfo();

  // Cargar estadísticas
  loadStats();

  // Cargar usuarios
  loadUsers();

  // Responsive
  updateResponsiveElements();
  window.addEventListener('resize', updateResponsiveElements);
});

// Verificar acceso de admin desde el servidor
async function verifyAdminAccess() {
  try {
    const token = getAuthToken();
    
    // Intentar acceder a un endpoint de admin
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 403) {
      return false; // No es admin
    }

    if (response.ok) {
      return true; // Es admin
    }

    return false;
  } catch (error) {
    console.error('Error verificando acceso admin:', error);
    return false;
  }
}

function loadAdminInfo() {
  const userInfo = getUserInfo();
  document.getElementById('admin-email').textContent = userInfo.email;
}

function updateResponsiveElements() {
  const adminLabel = document.querySelector('.admin-label');
  const btnTexts = document.querySelectorAll('.btn-text');
  
  if (window.innerWidth <= 768) {
    if (adminLabel) adminLabel.style.display = 'none';
    btnTexts.forEach(el => el.style.display = 'none');
  } else {
    if (adminLabel) adminLabel.style.display = 'inline';
    btnTexts.forEach(el => el.style.display = 'inline');
  }
}

async function loadStats() {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      
      document.getElementById('total-users').textContent = stats.users.total;
      document.getElementById('new-users').textContent = `+${stats.users.newLast30Days} últimos 30 días`;
      document.getElementById('total-admins').textContent = stats.users.admins;
      document.getElementById('total-cvs').textContent = stats.curriculums.total;
      document.getElementById('new-cvs').textContent = `+${stats.curriculums.newLast30Days} últimos 30 días`;
      document.getElementById('completed-cvs').textContent = stats.curriculums.completed;
      document.getElementById('avg-score').textContent = stats.curriculums.averageScore || 0;
      document.getElementById('pending-cvs').textContent = stats.curriculums.pending;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

async function loadUsers() {
  try {
    const token = getAuthToken();
    const tbody = document.getElementById('users-table-body');

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success && data.users.length > 0) {
      tbody.innerHTML = data.users.map(user => `
        <tr>
          <td>${user.email}</td>
          <td>${user.full_name || '-'}</td>
          <td>
            <span class="role-badge ${user.role}">
              ${user.role === 'admin' ? '<i class="fas fa-shield-alt"></i>' : '<i class="fas fa-user"></i>'}
              ${user.role}
            </span>
          </td>
          <td>${user.cv_count || 0}</td>
          <td>${formatDate(user.created_at)}</td>
          <td>
            <button class="action-btn view" onclick="openEditModal('${user.id}', '${user.email}', '${user.full_name || ''}', '${user.avatar_url || ''}')">
              <i class="fas fa-edit"></i> Editar
            </button>
            ${user.role === 'user' ? `
              <button class="action-btn change-role" onclick="changeUserRole('${user.id}', 'admin')">
                <i class="fas fa-user-shield"></i> Hacer Admin
              </button>
            ` : `
              <button class="action-btn change-role" onclick="changeUserRole('${user.id}', 'user')">
                <i class="fas fa-user"></i> Hacer User
              </button>
            `}
            <button class="action-btn delete" onclick="deleteUser('${user.id}', '${user.email}')">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No hay usuarios registrados</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    document.getElementById('users-table-body').innerHTML = 
      '<tr><td colspan="6" class="loading-row"><i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios</td></tr>';
  }
}

async function loadCurriculums() {
  try {
    const token = getAuthToken();
    const tbody = document.getElementById('cvs-table-body');

    const response = await fetch(`${API_BASE_URL}/admin/curriculums`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success && data.curriculums.length > 0) {
      tbody.innerHTML = data.curriculums.map(cv => `
        <tr>
          <td>
            <strong>${cv.profiles?.full_name || 'Sin nombre'}</strong><br>
            <small style="color: #999;">${cv.profiles?.email}</small>
          </td>
          <td>
            <i class="fas fa-file-pdf"></i> ${cv.file_name}<br>
            <small style="color: #999;">${formatFileSize(cv.file_size)}</small>
          </td>
          <td>
            <span class="status-badge ${cv.status}">
              ${cv.status === 'completed' ? '<i class="fas fa-check"></i>' : 
                cv.status === 'processing' ? '<i class="fas fa-spinner fa-spin"></i>' :
                cv.status === 'failed' ? '<i class="fas fa-times"></i>' :
                '<i class="fas fa-clock"></i>'}
              ${cv.status}
            </span>
          </td>
          <td>
            ${cv.score ? `<span class="score-display"><i class="fas fa-star"></i> ${cv.score}/100</span>` : '-'}
          </td>
          <td>${formatDate(cv.uploaded_at)}</td>
          <td>
            <button class="action-btn view" onclick="viewCVDetails('${cv.id}')" title="${cv.status === 'completed' ? 'Ver análisis completo' : 'Ver PDF'}">
              <i class="fas ${cv.status === 'completed' ? 'fa-chart-line' : 'fa-eye'}"></i>
            </button>
            <button class="action-btn download" onclick="downloadCV('${cv.id}', '${cv.file_name}')" title="Descargar PDF">
              <i class="fas fa-download"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No hay currículums subidos</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar currículums:', error);
    document.getElementById('cvs-table-body').innerHTML = 
      '<tr><td colspan="6" class="loading-row"><i class="fas fa-exclamation-triangle"></i> Error al cargar currículums</td></tr>';
  }
}

function switchTab(tab) {
  // Actualizar botones
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.closest('.tab-btn').classList.add('active');

  // Actualizar contenido
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tab}-tab`).classList.add('active');

  // Cargar datos si es necesario
  if (tab === 'curriculums') {
    loadCurriculums();
  }
}

async function changeUserRole(userId, newRole) {
  const userInfo = getUserInfo();
  
  if (userId === userInfo.id) {
    alert('No puedes cambiar tu propio role.');
    return;
  }

  if (!confirm(`¿Estás seguro de que quieres cambiar el role a "${newRole}"?`)) {
    return;
  }

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message, 'users-alert');
      loadUsers();
      loadStats();
    } else {
      showAlert('error', data.message, 'users-alert');
    }
  } catch (error) {
    console.error('Error al cambiar role:', error);
    showAlert('error', 'Error al cambiar el role del usuario', 'users-alert');
  }
}

async function deleteUser(userId, email) {
  const userInfo = getUserInfo();
  
  if (userId === userInfo.id) {
    alert('No puedes eliminar tu propia cuenta.');
    return;
  }

  if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${email}"?\n\nEsta acción no se puede deshacer y eliminará también todos sus CVs.`)) {
    return;
  }

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message, 'users-alert');
      loadUsers();
      loadStats();
    } else {
      showAlert('error', data.message, 'users-alert');
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    showAlert('error', 'Error al eliminar el usuario', 'users-alert');
  }
}

async function viewCVDetails(cvId) {
  try {
    const token = getAuthToken();
    
    // Obtener información del CV usando el endpoint de admin
    const response = await fetch(`${API_BASE_URL}/admin/curriculums/${cvId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener información del CV');
    }

    const data = await response.json();
    const cv = data.file;

    // Si el CV está completado, mostrar los resultados
    if (cv.status === 'completed' && cv.analysis_result) {
      // Redirigir a la página de resultados
      window.open(`cv-results.html?id=${cvId}`, '_blank');
    } else if (cv.status === 'processing') {
      // Si está procesando, mostrar mensaje
      showAlert('info', 'Este CV está siendo analizado. Por favor espera unos momentos.', 'cvs-alert');
      
      // Opcionalmente, abrir el PDF mientras espera
      if (confirm('El análisis está en proceso. ¿Deseas ver el PDF mientras tanto?')) {
        const pdfResponse = await fetch(`${API_BASE_URL}/files/${cvId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
      }
    } else {
      // Si no está completado (pending o failed), abrir el PDF en una nueva pestaña
      const pdfResponse = await fetch(`${API_BASE_URL}/files/${cvId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!pdfResponse.ok) {
        throw new Error('Error al obtener el PDF');
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Limpiar el objeto URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('Error al ver detalles:', error);
    showAlert('error', error.message || 'Error al abrir el CV', 'cvs-alert');
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

  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Funciones del Modal de Edición
function openEditModal(userId, email, fullName, avatarUrl) {
  const modal = document.getElementById('edit-user-modal');
  const form = document.getElementById('edit-user-form');
  
  // Llenar formulario
  document.getElementById('edit-user-id').value = userId;
  document.getElementById('edit-user-email').value = email;
  document.getElementById('edit-user-name').value = fullName;
  document.getElementById('edit-user-avatar').value = avatarUrl;
  
  // Mostrar modal
  modal.style.display = 'flex';
  
  // Event listener para el formulario
  form.onsubmit = handleEditUser;
}

function closeEditModal() {
  document.getElementById('edit-user-modal').style.display = 'none';
  document.getElementById('edit-user-form').reset();
}

async function handleEditUser(e) {
  e.preventDefault();
  
  const btn = document.getElementById('save-user-btn');
  const originalContent = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Guardando...';
    
    const userId = document.getElementById('edit-user-id').value;
    const formData = {
      email: document.getElementById('edit-user-email').value.trim(),
      full_name: document.getElementById('edit-user-name').value.trim(),
      avatar_url: document.getElementById('edit-user-avatar').value.trim() || null
    };
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('success', 'Usuario actualizado exitosamente', 'users-alert');
      closeEditModal();
      loadUsers();
      loadStats();
    } else {
      alert(data.message || 'Error al actualizar el usuario');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión. Verifica que el servidor esté corriendo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalContent;
  }
}

// Descargar CV
async function downloadCV(cvId, fileName) {
  try {
    const token = getAuthToken();
    
    // Mostrar mensaje de descarga
    showAlert('info', 'Descargando archivo...', 'cvs-alert');
    
    const response = await fetch(`${API_BASE_URL}/files/${cvId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Error al descargar el archivo');
    }

    // Convertir la respuesta a blob
    const blob = await response.blob();
    
    // Crear un enlace temporal y hacer click en él
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
    
    showAlert('success', 'Archivo descargado exitosamente', 'cvs-alert');
  } catch (error) {
    console.error('Error al descargar CV:', error);
    showAlert('error', error.message || 'Error al descargar el archivo', 'cvs-alert');
  }
}

// Cerrar modal al hacer click fuera
document.addEventListener('click', function(e) {
  const modal = document.getElementById('edit-user-modal');
  if (e.target === modal) {
    closeEditModal();
  }
});
