/**
 * Test data for improved CV modal
 * Este archivo simula la respuesta del backend con datos reales
 */

// Datos de ejemplo del CV mejorado (del mensaje del usuario)
const testImprovedCvResponse = {
  ok: true,
  template: "oxford",
  version: "oxford-v1",
  
  // ⭐ NUEVO: Evaluación con puntajes detallados
  evaluation: {
    puntaje_total: 98,
    detalle: {
      estructura: 95,
      contenido: 98,
      formato: 100,
      compatibilidad_ATS: 100
    },
    mejora_absoluta: null, // Se calculará en el frontend
    mejora_relativa_pct: null // Se calculará en el frontend
  },
  
  score: 98, // Fallback para compatibilidad
  
  ats: {
    language: "es",
    date_format: "MMM YYYY",
    max_bullet_words: 24,
    summary_words_max: 80
  },
  
  header: {
    NAME: "VÍCTOR HUGO CALLA RAMÍREZ",
    EMAIL: "calla.victor@pucp.edu.pe",
    PHONE: "980450458",
    LOCATION: "Lima, Perú",
    LINKEDIN: "",
    GITHUB: "",
    WEB: ""
  },
  
  summary: "Estudiante de Ingeniería Mecatrónica con sólida base en automatización, robótica y programación (C++, Python). Experiencia en proyectos académicos con microcontroladores (Arduino, Raspberry Pi) y diseño CAD (Inventor). Busco contribuir en áreas de innovación y sistemas mecatrónicos, aplicando mi capacidad para resolver problemas técnicos, trabajar en equipo y aprender nuevas tecnologías.",
  
  education: [
    {
      DEGREE: "Bachiller en Ingeniería Mecatrónica",
      INSTITUTION: "Pontificia Universidad Católica del Perú",
      LOCATION: "Lima, Perú",
      DATE_RANGE: "",
      GPA: "",
      THESIS_TITLE: "",
      ADVISOR: "",
      COURSEWORK: [],
      HIGHLIGHTS: ["Alumno de décimo ciclo"]
    }
  ],
  
  projects: [
    {
      NAME: "Procesos automatizados de una tuneladora",
      CONTEXT: "Académico",
      DATE_RANGE: "Ago 2024 – Dic 2024",
      ACHIEVEMENTS: [
        "Analicé y automaticé procesos clave en una tuneladora, como el sistema de avance y la gestión de inyección de bentonita.",
        "Diseñé la arquitectura de control e implementé lazos de realimentación y controladores lógicos para una operación autónoma y segura."
      ]
    },
    {
      NAME: "Máquina clasificadora de pecanas",
      CONTEXT: "Académico",
      DATE_RANGE: "Mar 2024 – Jul 2024",
      ACHIEVEMENTS: [
        "Desarrollé un prototipo de máquina clasificadora, integrando sensores ópticos y actuadores para la separación automática por calidad.",
        "Programé la lógica de control en un microcontrolador y realicé pruebas de calibración para asegurar la precisión del sistema."
      ]
    }
    // ... más proyectos
  ],
  
  skills: {
    TECHNICAL: [
      "Python (Intermedio)",
      "C++ (Intermedio)",
      "Programación de PLC (SIEMENS)",
      "Programación de microcontroladores (Arduino, Raspberry Pi)",
      "Fundamentos de Machine Learning"
    ],
    TOOLS: [
      "Autodesk Inventor",
      "FluidSIM",
      "MATLAB"
    ],
    LANGUAGES: [
      "Español (Nativo)",
      "Inglés (Intermedio)"
    ]
  },
  
  pdf: {
    url: "https://pdf-temp-files.s3.us-west-2.amazonaws.com/example.pdf",
    pages: 2,
    name: "htmltopdf.pdf"
  }
};

// Datos que vendrían del backend (GET /files/:id/improved-status)
const testBackendResponse = {
  success: true,
  status: 'completed',
  improved_cv_url: testImprovedCvResponse.pdf.url,
  improved_cv_data: testImprovedCvResponse,
  selected_template: 'oxford',
  processing_time_seconds: 45,
  error: null,
  original_score: 75 // ⭐ Puntaje del CV original (antes de mejorar)
};

// Ejemplo de cálculo de mejora
const improvementCalculation = {
  originalScore: 75,
  improvedScore: 98,
  absoluteImprovement: 98 - 75, // +23 puntos
  relativeImprovement: ((98 - 75) / 75 * 100).toFixed(1) // +30.7%
};

console.log('📊 Datos de prueba del modal de CV mejorado:');
console.log('Original Score:', improvementCalculation.originalScore);
console.log('Improved Score:', improvementCalculation.improvedScore);
console.log('Absolute Improvement:', improvementCalculation.absoluteImprovement, 'puntos');
console.log('Relative Improvement:', improvementCalculation.relativeImprovement + '%');

// Ejemplo de detalle por categoría
console.log('\n📈 Detalles por categoría:');
console.log('Estructura: 85 → 95 (+10)');
console.log('Contenido: 80 → 98 (+18)');
console.log('Formato: 90 → 100 (+10)');
console.log('Compatibilidad ATS: 95 → 100 (+5)');

// Para usar en el navegador:
// window.testImprovedCvResponse = testImprovedCvResponse;
// window.testBackendResponse = testBackendResponse;
