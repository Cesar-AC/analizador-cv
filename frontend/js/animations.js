// Animaciones dinámicas para la landing page
document.addEventListener('DOMContentLoaded', function () {
    // Intersection Observer para animar elementos al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elementos a animar
    const animatedElements = [
        ...document.querySelectorAll('.section'),
        ...document.querySelectorAll('.step-card'),
        ...document.querySelectorAll('.benefit-card'),
        ...document.querySelectorAll('.feature-card')
    ];

    // Configurar estado inicial
    animatedElements.forEach((el, index) => {
        // Verificar si ya está visible en el viewport para evitar flash
        const rect = el.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (isVisible) {
            // Si ya es visible, mostrar inmediatamente sin animación de entrada
            el.classList.add('animate-in');
            el.style.opacity = '1';
            el.style.transform = 'none';
        } else {
            // Si no, preparar para animación
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

            // Añadir delay escalonado si es una tarjeta
            if (el.classList.contains('step-card') || el.classList.contains('benefit-card') || el.classList.contains('feature-card')) {
                // Calcular índice relativo al contenedor padre para el delay
                const parent = el.parentElement;
                const siblings = Array.from(parent.children);
                const relativeIndex = siblings.indexOf(el);
                el.style.transitionDelay = `${relativeIndex * 0.1}s`;
            }

            fadeInObserver.observe(el);
        }
    });

    // Añadir clase para animación
    const style = document.createElement('style');
    style.textContent = `
    .animate-in {
      opacity: 1 !important;
      transform: translateY(0) translateX(0) !important;
    }
  `;
    document.head.appendChild(style);

    // Efecto parallax suave en el hero
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                const scrolled = window.pageYOffset;
                const hero = document.querySelector('.hero');

                if (hero && scrolled < window.innerHeight) {
                    hero.style.transform = `translateY(${scrolled * 0.4}px)`;
                    hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
                }

                ticking = false;
            });

            ticking = true;
        }
    });

    // Animación de hover en iconos de beneficios
    document.querySelectorAll('.benefit-icon').forEach(icon => {
        icon.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.1) rotate(5deg)';
        });

        icon.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Animación de números en step-number
    document.querySelectorAll('.step-number').forEach(number => {
        number.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.2) rotate(360deg)';
        });

        number.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Efecto de typing en el título del hero (sutil)
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        // Solo animar si no se ha animado antes (usando sessionStorage)
        if (!sessionStorage.getItem('heroAnimated')) {
            const text = heroTitle.textContent;
            heroTitle.textContent = '';
            heroTitle.style.opacity = '1';

            let index = 0;
            function typeWriter() {
                if (index < text.length) {
                    heroTitle.textContent += text.charAt(index);
                    index++;
                    setTimeout(typeWriter, 30);
                } else {
                    sessionStorage.setItem('heroAnimated', 'true');
                }
            }
            setTimeout(typeWriter, 500);
        }
    }

    // Animación de flotación en las feature cards
    document.querySelectorAll('.feature-card i').forEach((icon, index) => {
        icon.style.animation = `float 3s ease-in-out ${index * 0.5}s infinite`;
    });

    const floatStyle = document.createElement('style');
    floatStyle.textContent = `
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `;
    document.head.appendChild(floatStyle);
});
