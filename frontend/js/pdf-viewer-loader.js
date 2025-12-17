// ============================================
// PDF VIEWER FUNCTIONALITY
// ============================================

// Cargar PDF en el visor usando iframe
async function loadPdfViewer() {
    const pdfFrame = document.getElementById('pdfFrame');
    const pdfLoading = document.querySelector('.pdf-loading');

    try {
        const cvId = getCvIdFromURL();
        const token = getAuthToken();

        if (!cvId || !token) {
            throw new Error('No se encontró el ID del CV o el token de autenticación');
        }

        const response = await fetch(`${API_BASE_URL}/files/${cvId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el archivo PDF');
        }

        const blob = await response.blob();
        const pdfUrl = window.URL.createObjectURL(blob);

        pdfFrame.src = pdfUrl;

        pdfFrame.onload = function () {
            if (pdfLoading) pdfLoading.style.display = 'none';
            pdfFrame.style.display = 'block';
        };

        pdfFrame.onerror = function () {
            if (pdfLoading) {
                pdfLoading.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i><p>No se pudo mostrar el PDF</p>';
            }
        };

        setTimeout(() => {
            if (pdfLoading && pdfLoading.style.display !== 'none') {
                pdfLoading.style.display = 'none';
                pdfFrame.style.display = 'block';
            }
        }, 3000);

    } catch (error) {
        if (pdfLoading) {
            pdfLoading.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i><p>Error: ${error.message}</p>`;
        }
    }
}

// Helper function para obtener CV ID desde URL
function getCvIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}
