/**
 * ============================================
 * CV Results - Core JavaScript
 * Funcionalidad principal para visualizaciÃ³n de resultados
 * ============================================
 */

// Variables globales
const urlParams = new URLSearchParams(window.location.search);
const cvId = urlParams.get('id');
let categoryChart;
let currentCvData = null;
let improvementQuestions = [];
let currentQuestionIndex = 0;
let answers = [];
let selectedTemplate = null;
let pollingInterval = null;
let pollingAttempts = 0;
const MAX_POLLING_ATTEMPTS = 60;
let improvedCvData = null;

// ValidaciÃ³n inicial
if (!cvId) {
    alert('No se especificÃ³ un CV para mostrar');
    window.location.href = 'dashboard.html';
}

// Helper: Obtener ID del CV desde URL
function getCvIdFromURL() {
    // Intentar obtener del query string primero (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromQuery = urlParams.get('id');

    if (idFromQuery) {
        return idFromQuery;
    }

    // Si no estÃ¡ en query string, intentar obtener del path (/cv-results/uuid)
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1].replace('.html', '');

    // Validar que sea un UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idFromPath)) {
        return idFromPath;
    }

    return null;
}

// Helper: Formatear etiquetas
function formatLabel(key) {
    const labels = {
        'estructura': 'Estructura',
        'contenido': 'Contenido',
        'formato': 'Formato',
        'compatibilidad_ATS': 'Compatibilidad ATS'
    };
    return labels[key] || key;
}

// Helper: Formatear tiempo de procesamiento
function formatProcessingTime(seconds) {
    if (seconds > 31536000) {
        return 'Error en cÃ¡lculo';
    }

    if (seconds < 60) {
        return `${seconds} segundos`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0
            ? `${minutes} min ${remainingSeconds} seg`
            : `${minutes} minutos`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0
            ? `${hours}h ${minutes}min`
            : `${hours} horas`;
    }
}

// Cargar resultados del anÃ¡lisis
async function loadResults() {
    try {
        const token = getAuthToken();
        const userInfo = getUserInfo();

        if (!token) {
            alert('SesiÃ³n expirada. Por favor, inicia sesiÃ³n nuevamente.');
            window.location.href = '/';
            return;
        }

        const isAdmin = userInfo && userInfo.role === 'admin';
        const url = isAdmin
            ? `${API_BASE_URL}/admin/curriculums/${cvId}`
            : `${API_BASE_URL}/files/${cvId}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar resultados');
        }

        const data = await response.json();
        const cv = data.file;

        if (!cv.analysis_result || cv.analysis_result === null) {
            alert('Este CV aÃºn no ha sido analizado o estÃ¡ en proceso.');
            window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
            return;
        }

        displayResults(cv, isAdmin);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results-content').style.display = 'block';

        await checkImprovedCvStatus();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los resultados: ' + error.message);
        const userInfo = getUserInfo();
        const isAdmin = userInfo && userInfo.role === 'admin';
        window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
    }
}

// Mostrar resultados del anÃ¡lisis
function displayResults(cv, isAdmin) {
    try {
        // Configurar botones de navegaciÃ³n
        const backButton = document.getElementById('backButton');
        const switchViewButton = document.getElementById('switchViewButton');
        const backText = document.getElementById('backText');
        const switchViewText = document.getElementById('switchViewText');

        if (isAdmin) {
            if (backButton) backButton.href = 'admin.html';
            if (backText) backText.textContent = 'Volver a Admin';
            if (switchViewButton) {
                switchViewButton.style.display = 'inline-flex';
                switchViewButton.href = 'dashboard.html';
            }
            if (switchViewText) switchViewText.textContent = 'Ir a Dashboard Usuario';

            const improveCvButton = document.getElementById('improveCvButton');
            const ctaSection = document.getElementById('ctaSection');
            if (improveCvButton) improveCvButton.style.display = 'none';
            if (ctaSection) ctaSection.style.display = 'none';
        } else {
            if (backButton) backButton.href = 'dashboard.html';
            if (backText) backText.textContent = 'Volver al Dashboard';
            if (switchViewButton) switchViewButton.style.display = 'none';

            const improveCvButton = document.getElementById('improveCvButton');
            const ctaSection = document.getElementById('ctaSection');
            if (improveCvButton) improveCvButton.style.display = 'inline-flex';
            if (ctaSection) ctaSection.style.display = 'block';
        }

        const analysis = cv.analysis_result;
        currentCvData = analysis;
        window.cvAnalysisData = analysis;

        if (!analysis || !analysis.meta) {
            throw new Error('Formato de anÃ¡lisis invÃ¡lido');
        }

        // Puntaje total
        const totalScoreEl = document.getElementById('totalScore');
        if (totalScoreEl) totalScoreEl.textContent = analysis.meta.puntaje_total;

        // Link del PDF
        const pdfLink = document.getElementById('pdfLink');
        if (pdfLink) {
            if (analysis.meta.links?.pdf_url) {
                pdfLink.href = analysis.meta.links.pdf_url;
            } else {
                pdfLink.style.display = 'none';
            }
        }

        // Detalles de puntuaciÃ³n
        const detailScores = document.getElementById('detailScores');
        const details = analysis.meta.detalle;
        if (detailScores && details) {
            detailScores.innerHTML = Object.entries(details).map(([key, value]) => `
                <div class="detail-score">
                    <span class="detail-score-label">${formatLabel(key)}</span>
                    <span class="detail-score-value">${value}/100</span>
                </div>
            `).join('');
        }

        // Crear grÃ¡ficos
        if (details) {
            createCategoryChart(details);
            createDoughnutChart(details, analysis.meta.puntaje_total);
        }

        // Secciones detectadas
        const sectionsList = document.getElementById('sectionsList');
        if (sectionsList && analysis.meta.secciones_detectadas) {
            sectionsList.innerHTML = analysis.meta.secciones_detectadas.map(section => `
                <div class="section-item">
                    <i class="fas fa-check-circle"></i> ${section}
                </div>
            `).join('');
        }

        // Debilidades
        const weaknessesList = document.getElementById('weaknessesList');
        if (weaknessesList && analysis.resumen?.debilidades) {
            weaknessesList.innerHTML = analysis.resumen.debilidades.map(weakness => `
                <div class="weakness-item">
                    <i class="fas fa-exclamation-circle"></i> ${weakness}
                </div>
            `).join('');
        }

        // Recomendaciones generales
        const recommendationsList = document.getElementById('recommendationsList');
        if (recommendationsList && analysis.resumen?.recomendaciones) {
            recommendationsList.innerHTML = analysis.resumen.recomendaciones.map(rec => `
                <div class="recommendation-item">
                    <i class="fas fa-star"></i> ${rec}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error en displayResults:', error);
        alert('Error al mostrar los resultados: ' + error.message);
        window.location.href = 'dashboard.html';
    }
}

// Crear grÃ¡fico de categorÃ­as
function createCategoryChart(details) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(details).map(formatLabel),
            datasets: [{
                label: 'PuntuaciÃ³n',
                data: Object.values(details),
                backgroundColor: [
                    'rgba(100, 255, 218, 0.8)',  // Green
                    'rgba(87, 203, 255, 0.8)',   // Blue
                    'rgba(189, 147, 249, 0.8)',  // Purple
                    'rgba(230, 241, 255, 0.8)'   // White
                ],
                borderColor: [
                    'rgba(100, 255, 218, 1)',
                    'rgba(87, 203, 255, 1)',
                    'rgba(189, 147, 249, 1)',
                    'rgba(230, 241, 255, 1)'
                ],
                borderWidth: 2,
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(136, 146, 176, 0.1)'
                    },
                    ticks: {
                        color: '#8892b0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#8892b0'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Crear grÃ¡fico circular
function createDoughnutChart(details, totalScore) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');

    if (window.doughnutChartInstance) {
        window.doughnutChartInstance.destroy();
    }

    const avgScore = Object.values(details).reduce((a, b) => a + b, 0) / Object.values(details).length;
    const remaining = 100 - avgScore;

    window.doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PuntuaciÃ³n Obtenida', 'Margen de Mejora'],
            datasets: [{
                data: [avgScore, remaining],
                backgroundColor: [
                    'rgba(100, 255, 218, 0.8)',
                    'rgba(17, 34, 64, 0.5)'
                ],
                borderColor: [
                    'rgba(100, 255, 218, 1)',
                    'rgba(17, 34, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        color: '#8892b0',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Verificar el estado del CV mejorado
async function checkImprovedCvStatus() {
    try {
        // Usar la variable global cvId definida al inicio del archivo
        if (!cvId) return;
        
        const token = getAuthToken();

        const response = await fetch(`${API_BASE_URL}/files/${cvId}/improved-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            if (data.status === 'completed' && data.improved_cv_url) {
                // Agregar notificaciÃ³n visual si existe la funciÃ³n
                if (typeof addImprovedNotification === 'function') {
                    addImprovedNotification();
                }
            }
        }
    } catch (error) {
        // Sin CV mejorado disponible
    }
}

// Cargar resultados al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadResults();

    // Verificar si se debe abrir el modal del CV mejorado automÃ¡ticamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openImproved') === 'true') {
        setTimeout(() => {
            if (typeof openImprovedResultsModal === 'function') {
                openImprovedResultsModal();
            }
        }, 1000);
    }

    // Event listener para Enter en textarea
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                nextQuestion();
            }
        });
    }
});

// Función de logout
function logout() {
    if (confirm('¿Estas seguro de que deseas cerrar sesion?')) {
        clearAuthToken();
        window.location.href = '/';
    }
}