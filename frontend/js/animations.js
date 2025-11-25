// Animaciones dinámicas para la landing page
document.addEventListener('DOMContentLoaded', function () {
    // Intersection Observer para animar elementos al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const fadeInObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar secciones para animaciones
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        fadeInObserver.observe(section);
    });

    // Animar tarjetas de pasos con delay escalonado
    document.querySelectorAll('.step-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        fadeInObserver.observe(card);
    });

    // Animar tarjetas de beneficios con delay escalonado
    document.querySelectorAll('.benefit-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        fadeInObserver.observe(card);
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
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.opacity = '1';

        let index = 0;
        function typeWriter() {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 30);
            }
        }

        setTimeout(typeWriter, 500);
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
