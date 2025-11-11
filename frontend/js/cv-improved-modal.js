/**
 * ============================================
 * CV Improved Results Modal - Versión Minimalista
 * Modal independiente que funciona en dashboard y cv-results
 * ============================================
 */

// Abrir modal de resultados mejorados
function openImprovedResultsModal(cvId = null) {
    console.log('🎯 Abriendo modal minimalista de CV mejorado...');
    
    // Si no se pasa cvId, intentar obtenerlo de la URL
    if (!cvId) {
        cvId = getCvIdFromURL();
    }
    
    console.log('📋 CV ID:', cvId);
    
    // Crear el modal si no existe
    createImprovedModalIfNotExists();
    
    // Mostrar el modal con animación
    const modal = document.getElementById('improvedResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Pequeño delay para la animación
        setTimeout(() => {
            loadImprovedCvDataMinimal(cvId);
        }, 100);
    }
}

// Crear el modal en el DOM si no existe (para dashboard)
function createImprovedModalIfNotExists() {
    // Verificar si ya existe
    if (document.getElementById('improvedResultsModal')) {
        console.log('✅ Modal ya existe en el DOM');
        return;
    }
    
    console.log('🔨 Creando modal de CV mejorado...');
    
    // Crear el modal
    const modalHTML = `
        <div id="improvedResultsModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="closeImprovedResultsModal()"></div>
            <div class="improved-modal-minimalist">
                <!-- Botón cerrar minimalista -->
                <button class="btn-close-modal-minimal" onclick="closeImprovedResultsModal()">
                    <i class="fas fa-times"></i>
                </button>
                
                <!-- Encabezado con mensaje principal -->
                <div class="improved-modal-header">
                    <div class="success-icon-minimal">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="improved-modal-title">¡Tu CV ha sido mejorado!</h2>
                    <p class="improved-modal-subtitle" id="improvedModalSubtitle">
                        Formato: <span id="templateName">HARVARD</span>
                    </p>
                </div>

                <!-- Contenido minimalista con aspectos clave -->
                <div id="improvedContentMinimal" class="improved-content-minimal">
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea;"></i>
                        <p style="color: #6b7280; margin-top: 1rem;">Cargando datos del CV mejorado...</p>
                    </div>
                </div>

                <!-- Botón de descarga -->
                <div class="improved-modal-actions">
                    <button id="downloadPdfBtn" class="btn-download-minimal" onclick="downloadImprovedCVFromModal()">
                        <i class="fas fa-download"></i>
                        Descargar CV en PDF
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Modal creado exitosamente');
}

// Cerrar modal de resultados mejorados
function closeImprovedResultsModal() {
    const modal = document.getElementById('improvedResultsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Cargar datos del CV mejorado
async function loadImprovedCvDataMinimal(cvId) {
    try {
        const token = getAuthToken();
        
        // Si no se pasa cvId, intentar obtenerlo de la URL
        if (!cvId) {
            cvId = getCvIdFromURL();
        }
        
        console.log('📥 Cargando datos del CV mejorado para ID:', cvId);
        
        if (!cvId) {
            showError('No se pudo obtener el ID del CV');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/files/${cvId}/improved-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.message || 'Error al cargar datos del CV mejorado');
        }
        
        const data = await response.json();
        console.log('📊 Datos completos recibidos:', data);
        console.log('📊 Status:', data.status);
        console.log('📊 improved_cv_data:', data.improved_cv_data);
        console.log('📊 improved_cv_url:', data.improved_cv_url);
        console.log('⭐ original_score:', data.original_score); // ⭐ NUEVO LOG
        
        // Verificar si hay datos
        if (!data) {
            showError('No se recibieron datos del servidor');
            return;
        }
        
        // Verificar status
        if (data.status === 'pending') {
            showError('El CV mejorado aún está siendo procesado. Por favor, espera unos momentos e intenta nuevamente.');
            return;
        }
        
        if (data.status === 'failed') {
            showError('Hubo un error al generar el CV mejorado. Por favor, intenta generar uno nuevo.');
            return;
        }
        
        // Verificar que tenga datos del CV
        if (!data.improved_cv_data && !data.improved_cv_url) {
            showError('El CV mejorado no tiene datos disponibles. Por favor, genera uno nuevo.');
            return;
        }
        
        // Si tiene URL pero no data, mostrar solo opción de descarga
        if (data.improved_cv_url && !data.improved_cv_data) {
            renderPdfOnlyContent(data, cvId);
            return;
        }
        
        // Renderizar contenido completo
        if (data.status === 'completed' && data.improved_cv_data) {
            renderMinimalContent(data, cvId);
        } else {
            showError('No se encontraron datos del CV mejorado');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar CV mejorado:', error);
        showError('Error al cargar el CV mejorado: ' + error.message);
    }
}

// Renderizar contenido minimalista
function renderMinimalContent(data, cvId) {
    const cvData = data.improved_cv_data;
    const template = data.template || data.selected_template || 'HARVARD';
    const pdfUrl = data.improved_cv_url;
    
    console.log('🎨 Renderizando contenido:', { template, pdfUrl, cvData });
    
    // Guardar la URL del PDF globalmente para la descarga
    window.currentImprovedPdfUrl = pdfUrl;
    window.currentImprovedCvId = cvId;
    
    // Actualizar nombre de plantilla
    const templateNameEl = document.getElementById('templateName');
    if (templateNameEl) {
        templateNameEl.textContent = template.toUpperCase();
    }
    
    // Extraer aspectos clave
    const highlights = extractKeyHighlights(cvData);
    
    // Renderizar contenido
    const content = document.getElementById('improvedContentMinimal');
    if (!content) {
        console.error('❌ No se encontró el elemento improvedContentMinimal');
        return;
    }
    
    content.innerHTML = `
        <!-- Métricas comparativas -->
        ${renderSimpleMetrics(data)}
        
        <!-- Aspectos clave mejorados -->
        <div class="key-highlights">
            <h3>✨ Aspectos Clave de tu CV Mejorado</h3>
            <ul class="highlights-list">
                ${highlights.map(h => `
                    <li>
                        <i class="${h.icon}"></i>
                        <span>${h.text}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    // Mostrar el botón de descarga
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'inline-flex';
    }
}

// Renderizar contenido solo con PDF (cuando no hay improved_cv_data)
function renderPdfOnlyContent(data, cvId) {
    const template = data.template || data.selected_template || 'HARVARD';
    const pdfUrl = data.improved_cv_url;
    
    // Guardar la URL del PDF globalmente para la descarga
    window.currentImprovedPdfUrl = pdfUrl;
    window.currentImprovedCvId = cvId;
    
    // Actualizar nombre de plantilla
    document.getElementById('templateName').textContent = template.toUpperCase();
    
    // Renderizar contenido simple
    const content = document.getElementById('improvedContentMinimal');
    content.innerHTML = `
        <div class="key-highlights">
            <h3>✨ Tu CV Mejorado está Listo</h3>
            <ul class="highlights-list">
                <li>
                    <i class="fas fa-check-circle"></i>
                    <span>CV generado exitosamente con formato ${template.toUpperCase()}</span>
                </li>
                <li>
                    <i class="fas fa-file-pdf"></i>
                    <span>Formato profesional optimizado para ATS</span>
                </li>
                <li>
                    <i class="fas fa-download"></i>
                    <span>Listo para descargar y usar en tus aplicaciones</span>
                </li>
            </ul>
        </div>
    `;
}

// Extraer aspectos clave del CV
function extractKeyHighlights(cvData) {
    const highlights = [];
    
    // Header con información de contacto
    const header = cvData.header || cvData.HEADER || {};
    const name = header.NAME || header.name || 'Tu nombre';
    if (name && name !== 'Tu nombre') {
        highlights.push({
            icon: 'fas fa-user-circle',
            text: `Información personal profesional de ${name}`
        });
    }
    
    // Resumen profesional
    const summary = cvData.summary || cvData.SUMMARY || '';
    if (summary) {
        const wordCount = summary.split(' ').length;
        highlights.push({
            icon: 'fas fa-align-left',
            text: `Resumen profesional optimizado (${wordCount} palabras)`
        });
    }
    
    // Educación
    const education = cvData.education || cvData.EDUCATION || [];
    if (education.length > 0) {
        highlights.push({
            icon: 'fas fa-graduation-cap',
            text: `${education.length} registro${education.length > 1 ? 's' : ''} de educación formateado${education.length > 1 ? 's' : ''}`
        });
    }
    
    // Proyectos
    const projects = cvData.projects || cvData.PROJECTS || [];
    if (projects.length > 0) {
        highlights.push({
            icon: 'fas fa-project-diagram',
            text: `${projects.length} proyecto${projects.length > 1 ? 's' : ''} destacado${projects.length > 1 ? 's' : ''}`
        });
    }
    
    // Experiencia
    const experience = cvData.experience || cvData.EXPERIENCE || [];
    if (experience.length > 0) {
        highlights.push({
            icon: 'fas fa-briefcase',
            text: `${experience.length} experiencia${experience.length > 1 ? 's' : ''} laboral${experience.length > 1 ? 'es' : ''}`
        });
    }
    
    // Habilidades técnicas
    const skills = cvData.skills || cvData.SKILLS || {};
    const technical = skills.TECHNICAL || skills.technical || [];
    if (technical.length > 0) {
        highlights.push({
            icon: 'fas fa-code',
            text: `${technical.length} habilidad${technical.length > 1 ? 'es' : ''} técnica${technical.length > 1 ? 's' : ''} organizada${technical.length > 1 ? 's' : ''}`
        });
    }
    
    // Idiomas
    const languages = skills.LANGUAGES || skills.languages || [];
    if (languages.length > 0) {
        highlights.push({
            icon: 'fas fa-language',
            text: `${languages.length} idioma${languages.length > 1 ? 's' : ''} incluido${languages.length > 1 ? 's' : ''}`
        });
    }
    
    // Formato optimizado
    highlights.push({
        icon: 'fas fa-file-pdf',
        text: `Formato profesional optimizado para ATS`
    });
    
    // Si no hay highlights, agregar uno genérico
    if (highlights.length === 0) {
        highlights.push({
            icon: 'fas fa-check',
            text: 'CV mejorado y optimizado profesionalmente'
        });
    }
    
    return highlights;
}

// Renderizar métricas simples con comparación antes/después
function renderSimpleMetrics(data) {
    console.log('📊 renderSimpleMetrics - data recibida:', data);
    console.log('📊 data.original_score:', data.original_score);
    
    // Intentar obtener puntajes de diferentes fuentes
    // 1. Puntaje ORIGINAL: desde la variable global currentCvData (si está en cv-results) o desde data.original_score
    // 2. Puntaje MEJORADO: desde evaluation.puntaje_total (nuevo formato del backend)
    
    let originalScore = 0;
    let improvedScore = 0;
    let detailsOriginal = null;
    let detailsImproved = null;
    
    // ===== PUNTAJE ORIGINAL =====
    // Opción 1: Desde la BD (data.original_score) - PRIORIDAD
    if (data.original_score) {
        originalScore = data.original_score;
        console.log('✅ Puntaje original desde BD:', originalScore);
        
        // Si data incluye analysis_result, extraer detalles originales
        if (data.analysis_result?.meta?.detalle) {
            detailsOriginal = data.analysis_result.meta.detalle;
            console.log('✅ Detalles originales desde BD:', detailsOriginal);
        }
    }
    
    // Opción 2: Desde la variable global currentCvData (solo en cv-results) - FALLBACK
    if (!originalScore && typeof currentCvData !== 'undefined' && currentCvData) {
        originalScore = currentCvData.meta?.puntaje_total || 0;
        detailsOriginal = currentCvData.meta?.detalle || null;
        console.log('✅ Puntaje original desde currentCvData:', originalScore);
    }
    
    console.log('📊 Puntaje original final:', originalScore);
    
    // ===== PUNTAJE MEJORADO =====
    // Obtener desde evaluation.puntaje_total (nuevo formato del backend)
    if (data.improved_cv_data) {
        const cvData = data.improved_cv_data;
        
        // Nuevo formato: evaluation.puntaje_total
        if (cvData.evaluation && cvData.evaluation.puntaje_total) {
            improvedScore = cvData.evaluation.puntaje_total;
            detailsImproved = cvData.evaluation.detalle || null;
        }
        // Fallback: formatos anteriores
        else if (cvData.score) {
            improvedScore = cvData.score;
        } else if (cvData.ats && cvData.ats.score) {
            improvedScore = cvData.ats.score;
        }
    }
    
    console.log('📊 Métricas:', { originalScore, improvedScore, detailsOriginal, detailsImproved });
    
    // Solo mostrar métricas si tenemos al menos el puntaje mejorado
    if (improvedScore > 0) {
        // Calcular mejora
        const improvement = improvedScore - originalScore;
        const improvementPercent = originalScore > 0 ? ((improvement / originalScore) * 100).toFixed(1) : 0;
        
        // HTML para las métricas principales
        let metricsHTML = `
            <div class="simple-metrics">
                <div class="metric-card ${originalScore > 0 ? '' : 'single'}">
                    <div class="metric-label">Puntaje Original</div>
                    <div class="metric-value original">${originalScore > 0 ? originalScore : 'N/A'}</div>
                </div>
                <div class="metric-arrow">
                    <i class="fas fa-arrow-right"></i>
                </div>
                <div class="metric-card highlight">
                    <div class="metric-label">Puntaje Mejorado</div>
                    <div class="metric-value improved">${improvedScore}</div>
                    ${originalScore > 0 && improvement > 0 ? `
                        <div class="metric-improvement">
                            <i class="fas fa-arrow-up"></i>
                            +${improvement} puntos (${improvementPercent}%)
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Si tenemos detalles del puntaje mejorado, mostrar comparación detallada
        if (detailsImproved) {
            metricsHTML += `
                <div class="detailed-metrics">
                    <h4 class="detailed-title">📈 Mejoras por Categoría</h4>
                    <div class="detailed-grid">
                        ${renderDetailedComparison('Estructura', detailsOriginal?.estructura, detailsImproved.estructura)}
                        ${renderDetailedComparison('Contenido', detailsOriginal?.contenido, detailsImproved.contenido)}
                        ${renderDetailedComparison('Formato', detailsOriginal?.formato, detailsImproved.formato)}
                        ${renderDetailedComparison('ATS', detailsOriginal?.compatibilidad_ATS, detailsImproved.compatibilidad_ATS)}
                    </div>
                </div>
            `;
        }
        
        return metricsHTML;
    }
    
    // Si no hay puntajes, no mostrar nada
    return '';
}

// Renderizar comparación detallada de una categoría
function renderDetailedComparison(label, originalValue, improvedValue) {
    const original = originalValue || 0;
    const improved = improvedValue || 0;
    const diff = improved - original;
    const hasImprovement = diff > 0;
    
    return `
        <div class="detail-item ${hasImprovement ? 'improved' : ''}">
            <div class="detail-label">${label}</div>
            <div class="detail-values">
                <span class="detail-original">${original}</span>
                <i class="fas fa-arrow-right detail-arrow"></i>
                <span class="detail-improved">${improved}</span>
                ${hasImprovement ? `
                    <span class="detail-diff">+${diff}</span>
                ` : ''}
            </div>
        </div>
    `;
}

// Mostrar error
function showError(message) {
    const content = document.getElementById('improvedContentMinimal');
    content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <p style="color: #1f2937; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${message}</p>
            <p style="color: #6b7280; font-size: 0.9rem;">Por favor, intenta lo siguiente:</p>
            <ul style="list-style: none; padding: 0; margin: 1rem 0; color: #6b7280; font-size: 0.9rem;">
                <li style="margin: 0.5rem 0;">• Recarga la página</li>
                <li style="margin: 0.5rem 0;">• Verifica tu conexión a internet</li>
                <li style="margin: 0.5rem 0;">• Si el problema persiste, contacta soporte</li>
            </ul>
            <button onclick="closeImprovedResultsModal()" style="
                margin-top: 1rem;
                padding: 0.75rem 1.5rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            ">
                Cerrar
            </button>
        </div>
    `;
    
    // Ocultar el botón de descarga si hay error
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
}

// Función para obtener el ID del CV desde la URL
function getCvIdFromURL() {
    // Intentar obtener del query string primero (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromQuery = urlParams.get('id');
    
    if (idFromQuery) {
        console.log('✅ CV ID obtenido del query string:', idFromQuery);
        return idFromQuery;
    }
    
    // Si no está en query string, intentar obtener del path
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1].replace('.html', '');
    
    // Validar que sea un UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idFromPath)) {
        console.log('✅ CV ID obtenido del path:', idFromPath);
        return idFromPath;
    }
    
    console.error('❌ No se pudo obtener un CV ID válido de la URL');
    return null;
}

// Función para descargar el PDF del CV mejorado desde el modal
async function downloadImprovedCVFromModal() {
    try {
        console.log('📥 Descargando CV mejorado...');
        
        // Obtener la URL del PDF guardada globalmente
        const pdfUrl = window.currentImprovedPdfUrl;
        
        if (!pdfUrl) {
            // Si no hay URL guardada, intentar obtenerla del backend
            const cvId = window.currentImprovedCvId || getCvIdFromURL();
            const token = getAuthToken();
            
            const response = await fetch(`${API_BASE_URL}/files/${cvId}/improved-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener la URL del PDF');
            }
            
            const data = await response.json();
            
            if (!data.improved_cv_url) {
                throw new Error('No se encontró la URL del PDF mejorado');
            }
            
            // Abrir el PDF en una nueva pestaña
            window.open(data.improved_cv_url, '_blank');
            showToast('CV descargado exitosamente', 'success');
        } else {
            // Usar la URL guardada
            window.open(pdfUrl, '_blank');
            showToast('CV descargado exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al descargar CV:', error);
        showToast('Error al descargar el CV', 'error');
    }
}

// Mostrar notificación toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s ease-out forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Agregar notificación de CV mejorado
function addImprovedNotification() {
    const ctaSection = document.getElementById('ctaSection');
    if (!ctaSection) return;
    
    const existingNotification = document.querySelector('.improved-notification');
    if (existingNotification) return;
    
    const notification = document.createElement('div');
    notification.className = 'improved-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Tu CV mejorado está listo</span>
        <button onclick="openImprovedResultsModal()" class="btn-view-improved">
            Ver ahora
        </button>
    `;
    
    ctaSection.insertBefore(notification, ctaSection.firstChild);
}

// ============================================
// Exportar funciones globales
// ============================================
window.openImprovedResultsModal = openImprovedResultsModal;
window.closeImprovedResultsModal = closeImprovedResultsModal;
window.addImprovedNotification = addImprovedNotification;
window.downloadImprovedCVFromModal = downloadImprovedCVFromModal;
window.createImprovedModalIfNotExists = createImprovedModalIfNotExists;

console.log('✅ Módulo cv-improved-modal (minimalista e independiente) cargado correctamente');
