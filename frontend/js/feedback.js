document.addEventListener('DOMContentLoaded', function () {
    // Crear el modal de feedback si no existe
    if (!document.getElementById('feedback-modal')) {
        createFeedbackModal();
    }

    // Event listener para abrir el modal desde el footer o botones de contacto
    document.addEventListener('click', function (e) {
        if (e.target.closest('.open-feedback-modal') || (e.target.tagName === 'A' && e.target.textContent.includes('Contacto'))) {
            e.preventDefault();
            openFeedbackModal();
        }
    });
});

function createFeedbackModal() {
    const modalHTML = `
    <div id="feedback-modal" class="modal-overlay hidden">
        <div class="modal-content feedback-modal">
            <div class="modal-header">
                <h2><i class="fas fa-comment-dots"></i> Feedback y Contacto</h2>
                <button class="close-modal-btn" onclick="closeFeedbackModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="feedback-grid">
                    <div class="creator-info">
                        <h3>Sobre el Desarrollador</h3>
                        <div class="creator-profile">
                            <div class="creator-avatar">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="creator-details">
                                <h4>Cesar AC</h4>
                                <p>Desarrollador Full Stack</p>
                            </div>
                        </div>
                        <div class="contact-links">
                            <a href="mailto:cacuna@unitru.edu.pe" class="contact-link">
                                <i class="fas fa-envelope"></i> cacuna@unitru.edu.pe
                            </a>
                            <a href="https://wa.me/51962557528?text=Hola%20Cesar,%20vengo%20de%20AutoCV%20IA%20y%20me%20gustar%C3%ADa%20contactarme%20contigo." target="_blank" class="contact-link">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                            <a href="https://www.linkedin.com/in/cesar-ac10/" target="_blank" class="contact-link">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </a>
                            <a href="https://github.com/Cesar-AC" target="_blank" class="contact-link">
                                <i class="fab fa-github"></i> GitHub
                            </a>
                        </div>
                    </div>
                    
                    <div class="feedback-form-container">
                        <h3>Envíanos tus comentarios</h3>
                        <form id="feedback-form">
                            <div class="form-group">
                                <label for="feedback-type">Tipo de mensaje</label>
                                <select id="feedback-type" required>
                                    <option value="suggestion">Sugerencia</option>
                                    <option value="bug">Reportar error</option>
                                    <option value="contact">Contacto directo</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            
                            <!-- Campos adicionales para contacto directo -->
                            <div id="contact-fields" class="contact-extra-fields hidden">
                                <div class="form-group">
                                    <label for="contact-email">
                                        <i class="fas fa-envelope"></i> Correo electrónico
                                    </label>
                                    <input type="email" id="contact-email" placeholder="tu@email.com">
                                </div>
                                <div class="form-group">
                                    <label for="contact-whatsapp">
                                        <i class="fab fa-whatsapp"></i> WhatsApp (con código de país)
                                    </label>
                                    <div class="whatsapp-input-group">
                                        <span class="whatsapp-prefix">+</span>
                                        <input type="tel" id="contact-whatsapp" placeholder="51 987654321" pattern="[0-9\s]{7,15}">
                                    </div>
                                    <small class="input-hint">Ej: 51 987654321 (Perú), 1 2025551234 (USA)</small>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="feedback-message">Mensaje</label>
                                <textarea id="feedback-message" rows="4" placeholder="Escribe tu mensaje aquí..." required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fas fa-paper-plane"></i> Enviar Mensaje
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Toggle campos de contacto según el tipo seleccionado
    document.getElementById('feedback-type').addEventListener('change', function() {
        const contactFields = document.getElementById('contact-fields');
        const emailInput = document.getElementById('contact-email');
        const whatsappInput = document.getElementById('contact-whatsapp');
        
        if (this.value === 'contact') {
            contactFields.classList.remove('hidden');
            // Al menos uno de los campos debe estar lleno
            emailInput.required = false;
            whatsappInput.required = false;
        } else {
            contactFields.classList.add('hidden');
            emailInput.required = false;
            whatsappInput.required = false;
            emailInput.value = '';
            whatsappInput.value = '';
        }
    });

    // Manejar envío del formulario
    document.getElementById('feedback-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const type = document.getElementById('feedback-type').value;
        const message = document.getElementById('feedback-message').value;
        const email = document.getElementById('contact-email').value;
        const whatsapp = document.getElementById('contact-whatsapp').value;

        // Validar que si es contacto directo, tenga al menos un medio de contacto
        if (type === 'contact' && !email && !whatsapp) {
            if (typeof showAlert === 'function') {
                showAlert('warning', 'Por favor, proporciona al menos un medio de contacto (email o WhatsApp).', 'alert-container');
            } else {
                alert('Por favor, proporciona al menos un medio de contacto (email o WhatsApp).');
            }
            return;
        }

        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            // Enviar feedback al backend
            const response = await fetch(`${window.API_URL || ''}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    message,
                    email: email || null,
                    whatsapp: whatsapp || null
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                btn.innerHTML = '<i class="fas fa-check"></i> ¡Enviado!';
                btn.classList.add('btn-success');

                setTimeout(() => {
                    closeFeedbackModal();
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.classList.remove('btn-success');
                    document.getElementById('feedback-form').reset();
                    document.getElementById('contact-fields').classList.add('hidden');

                    if (typeof showAlert === 'function') {
                        showAlert('success', 'Gracias por tu feedback. Nos pondremos en contacto contigo pronto.', 'alert-container');
                    } else {
                        alert('Gracias por tu feedback. Nos pondremos en contacto contigo pronto.');
                    }
                }, 1500);
            } else {
                throw new Error(result.message || 'Error al enviar feedback');
            }
        } catch (error) {
            btn.innerHTML = '<i class="fas fa-times"></i> Error';
            btn.classList.add('btn-danger');

            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.remove('btn-danger');
            }, 2000);

            if (typeof showAlert === 'function') {
                showAlert('error', 'No se pudo enviar el mensaje. Por favor, intenta de nuevo.', 'alert-container');
            } else {
                alert('No se pudo enviar el mensaje. Por favor, intenta de nuevo.');
            }
        }
    });
}

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('hidden');
    // Animación de entrada
    modal.querySelector('.modal-content').style.animation = 'slideDown 0.3s ease-out forwards';
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('hidden');
}

// Cerrar al hacer clic fuera
window.addEventListener('click', function (e) {
    const modal = document.getElementById('feedback-modal');
    if (e.target === modal) {
        closeFeedbackModal();
    }
});
