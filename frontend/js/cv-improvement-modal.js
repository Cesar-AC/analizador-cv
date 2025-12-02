/**
 * ============================================
 * CV Improvement Modal
 * Modal de preguntas para mejorar el CV
 * ============================================
 */

// Abrir modal de mejoramiento
function openImprovementModal() {
    // Cargar las preguntas desde el análisis del CV
    if (currentCvData && currentCvData.preguntas_por_seccion && currentCvData.preguntas_por_seccion.ordered) {
        improvementQuestions = currentCvData.preguntas_por_seccion.ordered.map(item => ({
            seccion: item.seccion,
            pregunta: item.pregunta,
            placeholder: 'Escribe una respuesta clara y detallada...'
        }));
    } else {
        // Fallback: preguntas por defecto si no hay análisis
        console.warn('⚠️ No se encontraron preguntas en el análisis, usando preguntas por defecto');
        improvementQuestions = [
            {
                seccion: 'GENERAL',
                pregunta: '¿A qué puesto o industria estás aplicando?',
                placeholder: 'Ej: Desarrollador Full Stack, Marketing Digital, etc.'
            },
            {
                seccion: 'GENERAL',
                pregunta: '¿Qué habilidades clave deseas destacar?',
                placeholder: 'Ej: Python, React, Gestión de proyectos, etc.'
            },
            {
                seccion: 'GENERAL',
                pregunta: '¿Cuáles son tus logros más importantes?',
                placeholder: 'Ej: Aumenté ventas en 30%, Lideré equipo de 10 personas, etc.'
            }
        ];
    }
    
    currentQuestionIndex = 0;
    answers = [];
    
    document.getElementById('improvementModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    showQuestion(currentQuestionIndex);
}

// Cerrar modal
function closeImprovementModal() {
    document.getElementById('improvementModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Mostrar pregunta actual
function showQuestion(index) {
    if (index >= improvementQuestions.length) {
        showCompletionMessage();
        return;
    }
    
    const question = improvementQuestions[index];
    const totalQuestions = improvementQuestions.length;
    const progressPercent = ((index + 1) / totalQuestions) * 100;
    
    // Actualizar elementos que existen en el HTML
    const progressText = document.getElementById('progressText');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    const questionNumber = document.getElementById('questionNumber');
    const questionSection = document.getElementById('questionSection');
    const progressBar = document.getElementById('progressBar');
    const questionText = document.getElementById('questionText');
    const answerInput = document.getElementById('answerInput');
    
    if (progressText) progressText.innerHTML = `Pregunta ${index + 1} de <span id="totalQuestions">${totalQuestions}</span>`;
    if (totalQuestionsSpan) totalQuestionsSpan.textContent = totalQuestions;
    if (questionNumber) questionNumber.textContent = index + 1;
    if (questionSection) questionSection.textContent = question.seccion || 'SECCIÓN';
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (questionText) questionText.textContent = question.pregunta;
    if (answerInput) {
        answerInput.placeholder = question.placeholder || 'Escribe una respuesta clara y detallada...';
        answerInput.value = answers[index] || '';
        answerInput.focus();
    }
    
    // Mostrar/ocultar botón anterior
    const prevButton = document.querySelector('.btn-prev-question');
    if (prevButton) {
        prevButton.style.display = index > 0 ? 'inline-flex' : 'none';
    }
}

// Siguiente pregunta
function nextQuestion() {
    const answer = document.getElementById('answerInput').value.trim();
    
    if (!answer) {
        alert('Por favor, responde la pregunta antes de continuar.');
        return;
    }
    
    answers[currentQuestionIndex] = answer;
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
}

// Pregunta anterior
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
}

// Saltar pregunta
function skipQuestion() {
    answers[currentQuestionIndex] = '';
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
}

// Mensaje de finalización y selección de plantilla
function showCompletionMessage() {
    const questionContainer = document.querySelector('.question-container');
    const progressSection = document.querySelector('.progress-bar');
    
    if (progressSection) progressSection.style.display = 'none';
    
    if (!questionContainer) return;
    
    questionContainer.innerHTML = `
        <div class="completion-message">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>¡Excelente! Has completado las preguntas</h3>
            <p class="subtitle-completion">Selecciona la plantilla que mejor se adapte a tu perfil</p>
            
            <div class="template-selection-wrapper">
                <div class="template-selection">
                    <div class="template-card template-card-harvard" onclick="selectTemplate('harvard')">
                        <div class="template-badge">
                            <i class="fas fa-briefcase"></i>
                            Profesional
                        </div>
                        <div class="template-preview">
                            <div class="template-mockup">
                                <div class="mockup-header"></div>
                                <div class="mockup-line"></div>
                                <div class="mockup-line short"></div>
                                <div class="mockup-section"></div>
                            </div>
                        </div>
                        <div class="template-info">
                            <h4>Harvard</h4>
                            <p class="template-category">Ejecutivo & Corporativo</p>
                        </div>
                    </div>
                    
                    <div class="template-card template-card-mit" onclick="selectTemplate('mit')">
                        <div class="template-badge badge-tech">
                            <i class="fas fa-laptop-code"></i>
                            Tech
                        </div>
                        <div class="template-preview">
                            <div class="template-mockup mockup-modern">
                                <div class="mockup-header modern"></div>
                                <div class="mockup-columns">
                                    <div class="mockup-col">
                                        <div class="mockup-line"></div>
                                        <div class="mockup-line short"></div>
                                    </div>
                                    <div class="mockup-col">
                                        <div class="mockup-section"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="template-info">
                            <h4>MIT</h4>
                            <p class="template-category">Tech & Startups</p>
                        </div>
                    </div>
                    
                    <div class="template-card template-card-oxford" onclick="selectTemplate('oxford')">
                        <div class="template-badge badge-academic">
                            <i class="fas fa-graduation-cap"></i>
                            Académico
                        </div>
                        <div class="template-preview">
                            <div class="template-mockup">
                                <div class="mockup-header classic"></div>
                                <div class="mockup-line"></div>
                                <div class="mockup-line"></div>
                                <div class="mockup-section small"></div>
                            </div>
                        </div>
                        <div class="template-info">
                            <h4>Oxford</h4>
                            <p class="template-category">Clásico & Formal</p>
                        </div>
                    </div>
                </div>
                <div class="scroll-hint">
                    <i class="fas fa-arrows-left-right"></i>
                    <span>Desliza para ver más</span>
                </div>
            </div>
            
            <button class="btn-continue-template" id="continueTemplateBtn" disabled onclick="confirmTemplateSelection()">
                <i class="fas fa-arrow-right"></i> Continuar
            </button>
        </div>
    `;
    
    // Ocultar hint de scroll en desktop
    const checkScrollHint = () => {
        const wrapper = document.querySelector('.template-selection-wrapper');
        const hint = document.querySelector('.scroll-hint');
        if (wrapper && hint) {
            hint.style.display = wrapper.scrollWidth > wrapper.clientWidth ? 'flex' : 'none';
        }
    };
    setTimeout(checkScrollHint, 100);
    window.addEventListener('resize', checkScrollHint);
}

// Seleccionar plantilla
function selectTemplate(template) {
    selectedTemplate = template;
    
    // Actualizar visualización
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    document.getElementById('continueTemplateBtn').disabled = false;
}

// Confirmar selección de plantilla
function confirmTemplateSelection() {
    if (!selectedTemplate) {
        alert('Por favor, selecciona una plantilla.');
        return;
    }
    
    // Mostrar modal de confirmación
    const questionContainer = document.querySelector('.question-container');
    questionContainer.innerHTML = `
        <div class="confirmation-modal">
            <i class="fas fa-check-circle confirmation-icon"></i>
            <h3>¿Confirmar plantilla ${selectedTemplate.toUpperCase()}?</h3>
            <p>Se generará tu CV mejorado con esta plantilla.</p>
            <div class="confirmation-buttons">
                <button class="btn-cancel" onclick="showCompletionMessage()">Cambiar</button>
                <button class="btn-confirm" onclick="startGeneration()">Confirmar</button>
            </div>
        </div>
    `;
}

// Iniciar generación del CV mejorado
async function startGeneration() {
    try {
        closeImprovementModal();
        showProgressModal();
        
        const token = getAuthToken();
        const cvId = getCvIdFromURL();
        
        if (!token) {
            throw new Error('No se encontró el token de autenticación');
        }
        
        // Preparar respuestas en el formato que espera el backend (igual al que se guarda en la BD)
        const answersArray = improvementQuestions.map((q, index) => ({
            seccion: q.seccion,
            pregunta: q.pregunta,
            respuesta: answers[index] || null,
            omitida: !answers[index] || answers[index].trim() === ''
        }));
        
        // Guardar respuestas
        const answersResponse = await fetch(`${API_BASE_URL}/files/${cvId}/improvement-answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: answersArray,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!answersResponse.ok) {
            const errorData = await answersResponse.json();
            console.error('❌ Error al guardar respuestas:', errorData);
            throw new Error(errorData.message || 'Error al guardar las respuestas');
        }
        
        const answersResult = await answersResponse.json();
        
        // Generar CV mejorado (el backend usa las respuestas ya guardadas + la plantilla)
        
        const generateResponse = await fetch(`${API_BASE_URL}/files/${cvId}/generate-improved`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                template: selectedTemplate
            })
        });
        
        if (!generateResponse.ok) {
            const errorData = await generateResponse.json();
            console.error('❌ Error al generar CV:', errorData);
            throw new Error(errorData.message || 'Error al iniciar la generación del CV');
        }
        
        const generateResult = await generateResponse.json();
        
        // Iniciar polling para verificar el estado
        startPolling();
        
    } catch (error) {
        console.error('❌ Error en generación:', error);
        alert('Error al generar el CV mejorado:\n\n' + error.message);
        closeProgressModal();
    }
}

// Mostrar modal de progreso
function showProgressModal() {
    document.getElementById('progressModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de progreso
function closeProgressModal() {
    document.getElementById('progressModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Iniciar polling para verificar estado
function startPolling() {
    pollingAttempts = 0;
    
    pollingInterval = setInterval(async () => {
        pollingAttempts++;
        
        if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
            clearInterval(pollingInterval);
            closeProgressModal();
            alert('El proceso está tomando más tiempo de lo esperado. Por favor, verifica el estado más tarde.');
            return;
        }
        
        try {
            const token = getAuthToken();
            const cvId = getCvIdFromURL();
            
            const response = await fetch(`${API_BASE_URL}/files/${cvId}/improved-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al verificar el estado');
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                clearInterval(pollingInterval);
                closeProgressModal();
                showSuccessModal(data);
            } else if (data.status === 'failed') {
                clearInterval(pollingInterval);
                closeProgressModal();
                alert('Error al generar el CV mejorado: ' + (data.error || 'Error desconocido'));
            }
            
        } catch (error) {
            console.error('Error en polling:', error);
        }
    }, 5000); // Cada 5 segundos
}

// Mostrar modal de éxito
function showSuccessModal(result) {
    const processingTime = formatProcessingTime(result.processing_time || result.improvement_processing_time_seconds || 0);
    const template = (result.selected_template || result.template || 'Estándar').toUpperCase();
    
    const successHTML = `
        <div class="success-modal-overlay" id="successModalOverlay" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div class="success-modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 3rem;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <div class="success-header">
                    <i class="fas fa-check-circle" style="font-size: 5rem; color: #10b981; margin-bottom: 1.5rem;"></i>
                    <h2 style="color: #1f2937; font-size: 1.8rem; margin-bottom: 1rem;">¡CV Mejorado Generado con Éxito!</h2>
                </div>
                
                <div class="success-body" style="margin: 2rem 0;">
                    <div class="success-info" style="background: #f3f4f6; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">

                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fas fa-file-pdf" style="color: #667eea;"></i>
                            <span style="color: #4b5563;"><strong>Plantilla:</strong> ${template}</span>
                        </div>
                    </div>
                    
                    <div class="success-actions" style="display: flex; flex-direction: column; gap: 1rem;">
                        <button onclick="downloadImprovedCV()" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 1rem 2rem;
                            border-radius: 8px;
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-download"></i>
                            Descargar CV Mejorado
                        </button>
                        <button onclick="viewImprovedData()" style="
                            background: white;
                            color: #667eea;
                            border: 2px solid #667eea;
                            padding: 1rem 2rem;
                            border-radius: 8px;
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='#f3f4f6';" onmouseout="this.style.background='white';">
                            <i class="fas fa-eye"></i>
                            Ver Detalles
                        </button>
                    </div>
                </div>
                
                <button onclick="closeSuccessModal()" style="
                    background: #e5e7eb;
                    color: #6b7280;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    margin-top: 1rem;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#d1d5db';" onmouseout="this.style.background='#e5e7eb';">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
}

// Cerrar modal de éxito
function closeSuccessModal() {
    const modal = document.getElementById('successModalOverlay');
    if (modal) {
        modal.remove();
    }
    closeProgressModal();
    closeImprovementModal();
}

// Descargar CV mejorado
async function downloadImprovedCV() {
    try {
        const token = getAuthToken();
        const cvId = getCvIdFromURL();
        
        const response = await fetch(`${API_BASE_URL}/files/${cvId}/improved-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del CV mejorado');
        }
        
        const data = await response.json();
        
        if (data.improved_cv_url) {
            window.open(data.improved_cv_url, '_blank');
        } else {
            alert('No se encontró el archivo del CV mejorado');
        }
    } catch (error) {
        console.error('Error al descargar:', error);
        alert('Error al descargar el CV: ' + error.message);
    }
}

// Ver datos del CV mejorado
function viewImprovedData() {
    closeSuccessModal();
    
    // Llamar a la función del módulo cv-improved-modal
    if (typeof window.openImprovedResultsModal === 'function') {
        window.openImprovedResultsModal();
    } else {
        console.error('❌ La función openImprovedResultsModal no está disponible');
        alert('Error: No se puede abrir el modal de resultados. Por favor, recargue la página.');
    }
}

// Hacer funciones globales
window.closeSuccessModal = closeSuccessModal;
window.downloadImprovedCV = downloadImprovedCV;
window.viewImprovedData = viewImprovedData;

// ============================================
// Función auxiliar para obtener CV ID
// ============================================
function getCvIdFromURL() {
    // Intentar obtener del query string primero (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromQuery = urlParams.get('id');
    
    if (idFromQuery) {
        return idFromQuery;
    }
    
    // Si no está en query string, intentar obtener del path
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1].replace('.html', '');
    
    // Validar que sea un UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idFromPath)) {
        return idFromPath;
    }
    
    return null;
}
