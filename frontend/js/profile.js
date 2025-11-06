// Script para editar perfil de usuario
let currentAvatarFile = null;
let currentAvatarUrl = null;

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Cargar información del usuario
  loadUserInfo();
  loadProfile();

  // Manejar selección de archivo de avatar
  const avatarInput = document.getElementById('profile-avatar');
  if (avatarInput) {
    avatarInput.addEventListener('change', handleAvatarSelect);
  }

  // Manejar envío del formulario
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleSubmit);
  }

  // Responsive
  updateResponsiveElements();
  window.addEventListener('resize', updateResponsiveElements);
});

function loadUserInfo() {
  const userInfo = getUserInfo();
  const emailElements = document.querySelectorAll('.user-email-text');
  
  emailElements.forEach(el => {
    el.textContent = userInfo.email;
  });

  document.getElementById('profile-email').value = userInfo.email;
}

function updateResponsiveElements() {
  const emailTexts = document.querySelectorAll('.user-email-text');
  const btnTexts = document.querySelectorAll('.btn-text');
  
  if (window.innerWidth <= 768) {
    emailTexts.forEach(el => {
      if (el.closest('.user-menu')) {
        el.style.display = 'none';
      }
    });
    btnTexts.forEach(el => el.style.display = 'none');
  } else {
    emailTexts.forEach(el => el.style.display = 'inline');
    btnTexts.forEach(el => el.style.display = 'inline');
  }
}

async function loadProfile() {
  try {
    showLoading();
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success && data.profile) {
      const profile = data.profile;
      
      // Llenar formulario
      document.getElementById('profile-name').value = profile.full_name || '';
      
      // Actualizar sidebar
      document.getElementById('sidebar-name').textContent = profile.full_name || 'Usuario';
      document.getElementById('sidebar-email').textContent = profile.email;
      
      // Mostrar avatar si existe
      if (profile.avatar_url) {
        currentAvatarUrl = profile.avatar_url;
        const avatarSrc = profile.avatar_url.startsWith('http') ? profile.avatar_url : `http://localhost:3000${profile.avatar_url}`;
        document.getElementById('avatar-img').src = avatarSrc;
      } else {
        // Avatar por defecto con iniciales
        const initials = profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        document.getElementById('avatar-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=3498db&color=fff`;
      }

      // Mostrar rol en sidebar
      const sidebarRole = document.getElementById('sidebar-role');
      if (profile.role === 'admin') {
        sidebarRole.className = 'role-badge-large admin';
        sidebarRole.innerHTML = '<i class="fas fa-crown"></i> Administrador';
      } else {
        sidebarRole.className = 'role-badge-large user';
        sidebarRole.innerHTML = '<i class="fas fa-user"></i> Usuario';
      }

      // Fechas
      document.getElementById('created-at').textContent = formatDateShort(profile.created_at);
      document.getElementById('updated-at').textContent = formatDateShort(profile.updated_at);
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    showAlert('error', 'Error al cargar la información del perfil');
  } finally {
    hideLoading();
  }
}

function handleAvatarSelect(e) {
  const file = e.target.files[0];
  
  if (!file) return;

  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showAlert('error', 'Formato de imagen no válido. Usa JPG, PNG, GIF o WEBP');
    return;
  }

  // Validar tamaño (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('error', 'La imagen es muy grande. Máximo 5MB');
    return;
  }

  // Guardar archivo
  currentAvatarFile = file;

  // Mostrar vista previa
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('avatar-img').src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  showAlert('info', 'Imagen seleccionada. Haz clic en "Guardar Cambios" para subirla.');
}

function removeAvatar() {
  currentAvatarFile = null;
  currentAvatarUrl = null;
  
  // Restaurar avatar por defecto
  const name = document.getElementById('profile-name').value || 'Usuario';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('avatar-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=3498db&color=fff`;
  
  document.getElementById('profile-avatar').value = '';
}

function updateAvatarPreview() {
  // Función legacy - ya no se usa
}

async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('save-btn');
  const originalContent = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Guardando...';

    const fullName = document.getElementById('profile-name').value.trim();

    // Validar nombre
    if (!fullName) {
      showAlert('error', 'El nombre completo es requerido');
      btn.disabled = false;
      btn.innerHTML = originalContent;
      return;
    }

    const token = getAuthToken();
    let avatarUrl = currentAvatarUrl;

    // Si hay un archivo nuevo, subirlo primero
    if (currentAvatarFile) {
      showAlert('info', 'Subiendo imagen...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', currentAvatarFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Error al subir la imagen');
      }

      avatarUrl = uploadData.avatar_url;
    }

    // Actualizar perfil
    const profileData = {
      full_name: fullName,
      avatar_url: avatarUrl
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '¡Perfil actualizado exitosamente!');
      
      // Actualizar localStorage
      const userInfo = getUserInfo();
      userInfo.full_name = fullName;
      setUserInfo(userInfo);

      // Limpiar archivo temporal
      currentAvatarFile = null;
      currentAvatarUrl = avatarUrl;

      // Recargar perfil
      setTimeout(() => {
        loadProfile();
      }, 1000);
    } else {
      showAlert('error', data.message || 'Error al actualizar el perfil');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('error', error.message || 'Error de conexión. Verifica que el servidor esté corriendo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalContent;
  }
}

function logout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    clearAuthToken();
    window.location.href = '/';
  }
}

function showAlert(type, message) {
  const container = document.getElementById('alert-container');
  const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'warning' ? 'alert-warning' : 
                     type === 'info' ? 'alert-info' :
                     'alert-error';
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 
               type === 'info' ? 'fa-info-circle' :
               'fa-exclamation-circle';
  
  container.innerHTML = `
    <div class="alert ${alertClass}">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;

  // Auto-ocultar después de 5 segundos (excepto info)
  if (type !== 'info') {
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateShort(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('active');
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}
