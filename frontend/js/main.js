// Script para la página principal
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si el usuario ya está autenticado
  if (isAuthenticated()) {
    // Actualizar los botones del header
    updateHeaderForAuthUser();
  }

  // Animaciones suaves al scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observar las tarjetas de características
  document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
  });
});

function updateHeaderForAuthUser() {
  const authButtons = document.querySelector('.auth-buttons');
  const userInfo = getUserInfo();
  
  if (userInfo.email) {
    authButtons.innerHTML = `
      <span style="color: var(--primary-color); margin-right: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-user-circle"></i>
        <span class="user-email" style="display: none;">${userInfo.email}</span>
      </span>
      <a href="dashboard.html" class="btn btn-primary">
        <i class="fas fa-tachometer-alt"></i>
        Dashboard
      </a>
      <button onclick="logout()" class="btn btn-outline">
        <i class="fas fa-sign-out-alt"></i>
        Salir
      </button>
    `;

    // Mostrar email solo en pantallas grandes
    if (window.innerWidth > 768) {
      document.querySelector('.user-email').style.display = 'inline';
    }
  }
}

function logout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    clearAuthToken();
    window.location.href = '/';
  }
}

// Agregar efecto parallax suave al hero
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const hero = document.querySelector('.hero');
  
  if (hero && scrollY < window.innerHeight) {
    hero.style.transform = `translateY(${scrollY * 0.5}px)`;
  }
  
  lastScrollY = scrollY;
});
