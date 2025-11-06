# 🔧 Configuración n8n - Webhook Unificado

## 📊 Estructura del Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK (Entrada única)                      │
│  URL: /webhook-test/73c8c401-a338-42e3-a3a6-8c37b6cab273       │
│  Method: POST                                                   │
│  Recibe: { action: "analyze" | "improve", ... }                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SWITCH NODE (Router)                         │
│  Condición 1: {{ $json.action === "analyze" }}                 │
│  Condición 2: {{ $json.action === "improve" }}                 │
└───────┬─────────────────────────────────────────┬───────────────┘
        │                                         │
        │ ANALYZE                                 │ IMPROVE
        ▼                                         ▼
┌───────────────────┐                  ┌────────────────────────┐
│  RAMA ACTUAL      │                  │  RAMA NUEVA (TODO)     │
│  (ya existe)      │                  │                        │
├───────────────────┤                  ├────────────────────────┤
│ 1. Download PDF   │                  │ 1. Set Variables       │
│ 2. Parse PDF      │                  │ 2. Download Original   │
│ 3. AI Analysis    │                  │ 3. Extract Text        │
│ 4. Format JSON    │                  │ 4. Build AI Prompt     │
│ 5. Webhook        │                  │ 5. Call AI             │
│    Response       │                  │ 6. Generate HTML       │
│                   │                  │ 7. HTML to PDF         │
└───────────────────┘                  │ 8. Upload to Supabase  │
                                       │ 9. Callback Backend    │
                                       └────────────────────────┘
```

---

## 🎯 PASO A PASO: Configuración

### **1. Agregar Switch Node**

1. En n8n, abrir tu workflow actual
2. Después del nodo **Webhook**, agregar nodo **Switch**
3. Configurar Switch:

```
Mode: Rules

Rule 1 (Output 0):
  Condition: {{ $json.action === "analyze" }}
  
Rule 2 (Output 1):
  Condition: {{ $json.action === "improve" }}
```

4. Conectar:
   - `Webhook` → `Switch`
   - `Switch Output 0` → Tu flujo actual de análisis
   - `Switch Output 1` → Nuevo flujo de mejora (crear después)

---

### **2. Mantener Rama ANALYZE (ya existe)**

**No tocar esta rama**, solo asegurarte que recibe estos campos:

```json
{
  "action": "analyze",
  "cvId": "uuid",
  "userId": "uuid",
  "userEmail": "email@example.com",
  "fileName": "CV.pdf",
  "filePath": "uploads/123/CV.pdf",
  "fileUrl": "https://storage.supabase.co/...",
  "fileSize": 245678
}
```

---

### **3. Crear Rama IMPROVE (nueva)**

#### **Nodo 1: Set Variables**
```javascript
// Tipo: Code Node (JavaScript)
const template = $json.template; // 'harvard' | 'mit' | 'stanford'
const cvId = $json.cvId;
const answers = $json.improvementAnswers;
const originalAnalysis = $json.originalAnalysis;

return {
  json: {
    template,
    cvId,
    answers,
    originalAnalysis,
    originalFileUrl: $json.originalFileUrl
  }
};
```

#### **Nodo 2: Download Original PDF**
```javascript
// Tipo: HTTP Request
Method: GET
URL: {{ $json.originalFileUrl }}
Response Format: File
Binary Property: data
```

#### **Nodo 3: Extract Text from PDF**
```javascript
// Opción A: Usar PDF Parser (si n8n lo tiene)
// Opción B: Usar API externa (pdfparse.com)
// Opción C: Code node con pdf-parse

// Ejemplo con HTTP Request a API:
Method: POST
URL: https://api.pdfparse.com/parse
Body (Form):
  - file: {{ $binary.data }}
Headers:
  - Authorization: Bearer TU_API_KEY
```

#### **Nodo 4: Build AI Prompt**
```javascript
// Tipo: Code Node
const template = $json.template;
const answers = $json.answers;
const pdfText = $json.extractedText;
const analysis = $json.originalAnalysis;

const templatePrompts = {
  harvard: `Crea un CV en formato Harvard Classic (profesional, corporativo).
Características:
- Formato cronológico inverso
- Tipografía serif elegante
- Colores: Negro, gris, azul oscuro
- Secciones: Contacto, Resumen Ejecutivo, Experiencia, Educación, Skills
- Estilo formal y conservador`,

  mit: `Crea un CV en formato MIT Technical (técnico, moderno).
Características:
- Enfoque en proyectos y habilidades técnicas
- Tipografía sans-serif moderna
- Colores: Azul tech, verde código, gris
- Secciones: Header, Skills Técnicos, Proyectos, Experiencia, Educación
- Incluye links a GitHub/portfolio`,

  stanford: `Crea un CV en formato Stanford Innovative (innovador, creativo).
Características:
- Storytelling y logros visuales
- Tipografía moderna y limpia
- Colores vibrantes con gradientes
- Secciones: Pitch Personal, Impacto, Experiencia, Skills, Educación
- Énfasis en resultados cuantificables`
};

const prompt = `
${templatePrompts[template]}

ANÁLISIS PREVIO DEL CV:
${JSON.stringify(analysis, null, 2)}

RESPUESTAS DEL USUARIO:
${answers.map(a => `P: ${a.question}\nR: ${a.answer || 'Sin respuesta'}`).join('\n\n')}

CONTENIDO ORIGINAL:
${pdfText}

INSTRUCCIONES:
1. Mejora el contenido basándote en el análisis y las respuestas
2. Aplica el formato ${template.toUpperCase()}
3. Devuelve HTML completo con estilos CSS inline
4. Estructura responsive y lista para PDF
5. Incluye toda la información relevante del CV original
6. Mejora la redacción y presenta logros con métricas

IMPORTANTE: 
- Mantén la veracidad de la información
- Solo mejora la presentación y redacción
- No inventes experiencias o skills
- Resalta logros y cuantifícalos cuando sea posible

Devuelve SOLO el HTML completo (desde <!DOCTYPE> hasta </html>).
`;

return {
  json: {
    ...($json),
    aiPrompt: prompt
  }
};
```

#### **Nodo 5: Call AI (OpenAI/Claude)**
```javascript
// Tipo: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions
// O Claude: https://api.anthropic.com/v1/messages

Headers:
  - Authorization: Bearer TU_OPENAI_API_KEY
  - Content-Type: application/json

Body (JSON):
{
  "model": "gpt-4-turbo-preview",
  "messages": [
    {
      "role": "system",
      "content": "Eres un experto en redacción de CVs profesionales. Generas HTML válido y bien estructurado."
    },
    {
      "role": "user",
      "content": "{{ $json.aiPrompt }}"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

#### **Nodo 6: Extract HTML**
```javascript
// Tipo: Code Node
const aiResponse = $json.choices[0].message.content;

// Limpiar y extraer HTML puro
let html = aiResponse.trim();

// Si la AI envolvió en markdown code blocks, removerlos
if (html.startsWith('```html')) {
  html = html.replace(/```html\n?/g, '').replace(/```\n?$/g, '');
}

return {
  json: {
    cvId: $json.cvId,
    template: $json.template,
    improvedHtml: html
  }
};
```

#### **Nodo 7: HTML to PDF**

**Opción A: API Externa (Recomendado)**
```javascript
// Usar PDFMonkey, DocRaptor, etc.
Method: POST
URL: https://api.pdfmonkey.io/api/v1/documents
Headers:
  - Authorization: Bearer TU_PDF_API_KEY
Body:
{
  "document": {
    "template_id": "tu_template_id",
    "payload": {
      "html": "{{ $json.improvedHtml }}"
    }
  }
}

// La API retorna URL del PDF generado
```

**Opción B: Puppeteer (si tienes servidor con Chromium)**
```javascript
// Code Node con puppeteer
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent($json.improvedHtml);

const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
});

await browser.close();

return {
  json: $json,
  binary: {
    data: pdfBuffer
  }
};
```

#### **Nodo 8: Upload to Supabase Storage**
```javascript
// Tipo: HTTP Request
Method: POST
URL: https://qcpbeoqfyfocgxtfgvtc.supabase.co/storage/v1/object/improved/{{ $json.cvId }}_{{ $json.template }}.pdf

Headers:
  - Authorization: Bearer TU_SUPABASE_SERVICE_ROLE_KEY
  - Content-Type: application/pdf

Body: Binary
  - Binary Property: data

// Respuesta incluye URL del archivo subido
```

#### **Nodo 9: Callback to Backend**
```javascript
// Tipo: HTTP Request
Method: PATCH
URL: http://tu-backend.com/api/files/{{ $json.cvId }}/update-improved

Headers:
  - Content-Type: application/json

Body (JSON):
{
  "improved_cv_url": "{{ $json.uploadedFileUrl }}",
  "status": "completed"
}

// Si hay error en cualquier paso anterior:
{
  "status": "failed",
  "error": "{{ $json.errorMessage }}"
}
```

---

## 🔄 Manejo de Errores

En cada nodo crítico, agregar **Error Workflow**:

```javascript
// On Error → Continue To Next Node
→ Set Node
   {
     "status": "failed",
     "error": "{{ $json.error.message }}",
     "cvId": "{{ $json.cvId }}"
   }
→ HTTP Request (Callback con status=failed)
```

---

## 🧪 Testing

### **1. Test Analyze (ya funciona)**
```bash
curl -X POST http://localhost:5678/webhook-test/73c8c401-a338-42e3-a3a6-8c37b6cab273 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "cvId": "test-123",
    "fileName": "test.pdf"
  }'
```

### **2. Test Improve (nuevo)**
```bash
curl -X POST http://localhost:5678/webhook-test/73c8c401-a338-42e3-a3a6-8c37b6cab273 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "improve",
    "cvId": "test-123",
    "template": "harvard",
    "originalFileUrl": "https://storage.supabase.co/test.pdf",
    "improvementAnswers": [],
    "originalAnalysis": {}
  }'
```

---

## 📋 Variables de Entorno Necesarias

En n8n, agregar estas variables:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://qcpbeoqfyfocgxtfgvtc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PDF_API_KEY=tu_api_key_pdf_generator
BACKEND_URL=http://localhost:3000/api
```

---

## ✅ Checklist n8n

- [ ] Switch node agregado después del webhook
- [ ] Rama ANALYZE conectada a Switch Output 0
- [ ] Rama IMPROVE creada con 9 nodos
- [ ] Variables de entorno configuradas
- [ ] Test analyze funciona (acción existente)
- [ ] Test improve funciona (nueva acción)
- [ ] Callback llega al backend correctamente
- [ ] PDF se genera y sube a Supabase Storage

---

## 🚀 Quick Start

1. **Agregar Switch Node** → 5 minutos
2. **Conectar rama analyze existente** → 2 minutos
3. **Crear nodos 1-3 (variables + download + extract)** → 15 minutos
4. **Crear nodos 4-5 (AI prompt + call)** → 20 minutos
5. **Crear nodos 6-9 (HTML + PDF + upload + callback)** → 30 minutos

**Total estimado: ~1.5 horas de configuración**

---

## 💡 Tips

- Usa el **Sticky Note** node para documentar cada sección
- **Deshabilita nodos** mientras pruebas (click derecho → Disable)
- Usa **Execute Workflow** para tests sin webhook real
- Revisa **Executions** tab para ver logs de errores
- Guarda **versiones** del workflow antes de cambios grandes

---

**¿Dudas? Consulta la documentación de n8n:** https://docs.n8n.io
