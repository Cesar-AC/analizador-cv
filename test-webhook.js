// Script de prueba para enviar datos a n8n
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testN8nWebhook() {
  const webhookUrl = 'http://localhost:5678/webhook-test/73c8c401-a338-42e3-a3a6-8c37b6cab273';
  
  console.log('🔵 Iniciando prueba de webhook n8n...');
  console.log('📍 URL:', webhookUrl);
  
  const formData = new FormData();
  
  // Simular datos sin PDF primero para probar
  formData.append('cvId', 'test-123');
  formData.append('userId', 'user-test');
  formData.append('userEmail', 'test@ejemplo.com');
  formData.append('userName', 'Usuario Test');
  formData.append('fileName', 'test.pdf');
  formData.append('fileSize', '12345');
  
  try {
    console.log('📤 Enviando datos a n8n...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log('📥 Respuesta recibida:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Respuesta exitosa:', text);
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con n8n:', error.message);
  }
}

testN8nWebhook();
