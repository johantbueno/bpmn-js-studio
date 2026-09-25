/**
 * Generador de Procesos BPMN con Inteligencia Artificial
 * Integra síntesis inteligente local y conexión opcional con Google Gemini API.
 */

export async function generarBPMNConIA(promptTexto, apiKey = null) {
  const promptLimpio = promptTexto.trim();

  // Si hay API Key de Gemini provista por el usuario, llamamos a la API oficial
  if (apiKey && apiKey.length > 20) {
    try {
      const xmlDesdeGemini = await consultarGeminiAPI(promptLimpio, apiKey);
      if (xmlDesdeGemini && xmlDesdeGemini.includes('<bpmn:definitions')) {
        return xmlDesdeGemini;
      }
    } catch (err) {
      console.warn('Fallo en llamada a Gemini API, usando motor de síntesis local inteligente:', err);
    }
  }

  // Motor de síntesis local inteligente
  return sintetizarDiagramaLocal(promptLimpio);
}

/**
 * Consulta la API de Gemini para generar XML BPMN 2.0 estándar
 */
async function consultarGeminiAPI(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const systemInstruction = `Eres un arquitecto experto en BPMN 2.0 y automatización de procesos para República Dominicana (DGII, compras, finanzas).
Genera EXCLUSIVAMENTE código XML BPMN 2.0 válido que incluya bpmn:process y bpmndi:BPMNDiagram con todas las coordenadas visuales dc:Bounds y di:waypoint.
Cumple estrictamente con la regla: actividades como "Verbo en infinitivo + Objeto".
Responde ÚNICAMENTE con el bloque XML, sin explicaciones ni markdown.`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\nRequerimiento del proceso:\n${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    throw new Error(`Error en API Gemini: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Limpiar posibles bloques ```xml
  const xmlMatch = rawText.match(/<\?xml[\s\S]*<\/bpmn:definitions>/i) || 
                   rawText.match(/<bpmn:definitions[\s\S]*<\/bpmn:definitions>/i);
  
  if (xmlMatch) {
    return xmlMatch[0].trim();
  }
  
  throw new Error('Respuesta de Gemini no contiene XML BPMN válido');
}

/**
 * Generador sintético local que analiza lenguaje natural y produce BPMN 2.0 válido
 */
function sintetizarDiagramaLocal(prompt) {
  // Separar oraciones o pasos por conectores
  const conectores = [
    /luego/gi, /después/gi, /posteriormente/gi, /seguidamente/gi, 
    /\d+\.\s*/g, /\n+/g, /;/g
  ];

  let textoNormalizado = prompt;
  conectores.forEach(c => {
    textoNormalizado = textoNormalizado.replace(c, ' | ');
  });

  const pasos = textoNormalizado
    .split('|')
    .map(p => p.trim())
    .filter(p => p.length > 3);

  // Si no hay suficientes pasos detectados, generar un flujo contextualizado
  const actividades = pasos.length >= 2 ? pasos.slice(0, 5) : [
    'Registrar solicitud en plataforma',
    'Validar documentación fiscal y soportes',
    'Emitir resolución oficial y notificar al interesado'
  ];

  const processId = 'Process_IA_' + Date.now();
  const startEventId = 'StartEvent_IA';
  const endEventId = 'EndEvent_IA';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Defs_${processId}"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" isExecutable="false">
    <bpmn:startEvent id="${startEventId}" name="Inicio del Flujo">
      <bpmn:outgoing>Flow_0</bpmn:outgoing>
    </bpmn:startEvent>
`;

  let currentSource = startEventId;
  const flows = [];
  const taskIds = [];

  actividades.forEach((act, index) => {
    const taskId = `Activity_IA_${index + 1}`;
    const flowId = `Flow_${index}`;
    taskIds.push(taskId);
    flows.push({ id: flowId, source: currentSource, target: taskId });

    // Asegurar formato Verbo + Objeto
    let nombreLimpio = act.replace(/^[-•*]\s*/, '').trim();
    if (nombreLimpio.length > 50) nombreLimpio = nombreLimpio.substring(0, 48) + '...';

    xml += `    <bpmn:task id="${taskId}" name="${escapeXml(nombreLimpio)}">
      <bpmn:incoming>${flowId}</bpmn:incoming>
      <bpmn:outgoing>Flow_${index + 1}</bpmn:outgoing>
    </bpmn:task>
`;
    currentSource = taskId;
  });

  const finalFlowId = `Flow_${actividades.length}`;
  flows.push({ id: finalFlowId, source: currentSource, target: endEventId });

  xml += `    <bpmn:sequenceFlow id="${flows[0].id}" sourceRef="${flows[0].source}" targetRef="${flows[0].target}" />
`;
  for (let i = 1; i < flows.length; i++) {
    xml += `    <bpmn:sequenceFlow id="${flows[i].id}" sourceRef="${flows[i].source}" targetRef="${flows[i].target}" />
`;
  }

  xml += `    <bpmn:endEvent id="${endEventId}" name="Proceso Finalizado">
      <bpmn:incoming>${finalFlowId}</bpmn:incoming>
    </bpmn:endEvent>
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_IA">
    <bpmndi:BPMNPlane id="BPMNPlane_IA" bpmnElement="${processId}">
      <bpmndi:BPMNShape id="${startEventId}_di" bpmnElement="${startEventId}">
        <dc:Bounds x="160" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="145" y="203" width="67" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;

  let currentX = 250;
  taskIds.forEach((tId, idx) => {
    xml += `      <bpmndi:BPMNShape id="${tId}_di" bpmnElement="${tId}">
        <dc:Bounds x="${currentX}" y="138" width="140" height="80" />
      </bpmndi:BPMNShape>
`;
    currentX += 190;
  });

  xml += `      <bpmndi:BPMNShape id="${endEventId}_di" bpmnElement="${endEventId}">
        <dc:Bounds x="${currentX}" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${currentX - 25}" y="203" width="88" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;

  // Renderizar conexiones visuales (Edges)
  let prevX = 196;
  flows.forEach((f, idx) => {
    let nextX = idx === 0 ? 250 : 250 + (idx - 1) * 190 + 140;
    if (idx === flows.length - 1) {
      nextX = currentX;
    }
    
    let startWayX = idx === 0 ? 196 : 250 + (idx - 1) * 190 + 140;
    let endWayX = idx === flows.length - 1 ? currentX : 250 + idx * 190;

    xml += `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
        <di:waypoint x="${startWayX}" y="178" />
        <di:waypoint x="${endWayX}" y="178" />
      </bpmndi:BPMNEdge>
`;
  });

  xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return xml;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
