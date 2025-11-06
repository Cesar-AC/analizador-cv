// Script para autenticación
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si ya está autenticado
  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');

  // Verificar modo desde URL
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'register') {
    showRegisterForm();
  }

  // Cambiar entre formularios
  showRegisterLink.addEventListener('click', function(e) {
    e.preventDefault();
    showRegisterForm();
  });

  showLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    showLoginForm();
  });

  // Manejar login
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('login-btn');
    const originalContent = btn.innerHTML;
    
    try {
      // Deshabilitar botón
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span> Iniciando sesión...';

      const formData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token y datos de usuario
        setAuthToken(data.session.access_token);
        setUserInfo(data.user);

        // Mostrar mensaje especial para admins
        const welcomeMsg = data.user.role === 'admin' 
          ? '¡Bienvenido Administrador! Redirigiendo...' 
          : '¡Bienvenido! Redirigiendo...';
        
        showAlert('success', welcomeMsg, 'alert-container');
        
        setTimeout(() => {
          // Redirigir a admin o dashboard según el role
          if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 1000);
      } else {
        showAlert('error', data.message || 'Error al iniciar sesión', 'alert-container');
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Error de conexión. Verifica que el servidor esté corriendo.', 'alert-container');
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  });

  // Manejar registro
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('register-btn');
    const originalContent = btn.innerHTML;
    
    try {
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm').value;

      // Validar contraseñas
      if (password !== confirmPassword) {
        showAlert('error', 'Las contraseñas no coinciden', 'register-alert-container');
        return;
      }

      if (password.length < 6) {
        showAlert('error', 'La contraseña debe tener al menos 6 caracteres', 'register-alert-container');
        return;
      }

      // Deshabilitar botón
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span> Creando cuenta...';

      const formData = {
        email: document.getElementById('register-email').value,
        password: password,
        fullName: document.getElementById('register-name').value
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsEmailConfirmation) {
          showAlert('success', 'Cuenta creada! Revisa tu email para confirmarla. Luego podrás iniciar sesión.', 'register-alert-container');
          
          setTimeout(() => {
            showLoginForm();
            document.getElementById('login-email').value = formData.email;
          }, 3000);
        } else {
          showAlert('success', '¡Cuenta creada! Ahora inicia sesión', 'register-alert-container');
          
          setTimeout(() => {
            showLoginForm();
            document.getElementById('login-email').value = formData.email;
          }, 2000);
        }
      } else {
        showAlert('error', data.message || 'Error al crear la cuenta', 'register-alert-container');
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Error de conexión. Verifica que el servidor esté corriendo.', 'register-alert-container');
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  });
});

function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('register-form').classList.add('hidden');
  clearAlerts();
}

function showRegisterForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
  clearAlerts();
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
}

function clearAlerts() {
  document.getElementById('alert-container').innerHTML = '';
  document.getElementById('register-alert-container').innerHTML = '';
}
