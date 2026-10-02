// Genera n8n/bpmn-generar-proceso.workflow.json (importar con: n8n import:workflow)
import { writeFileSync } from 'node:fs';

const SYSTEM = `Eres un analista senior de procesos de negocio experto en BPMN 2.0 para instituciones públicas de República Dominicana (DGII, finanzas, compras).
Recibes un levantamiento de proceso (texto libre, lista de pasos o contenido de un documento) y devuelves EXCLUSIVAMENTE un objeto JSON válido, sin markdown ni comentarios, con esta forma exacta:
{
  "titulo": "nombre del proceso",
  "pasos": [
    { "id": "inicio", "tipo": "inicio", "nombre": "...", "siguiente": [{ "a": "t1" }] },
    { "id": "t1", "tipo": "tarea", "nombre": "Verbo en infinitivo + objeto", "descripcion": "descripción completa de la tarea", "rol": "área o cargo responsable", "siguiente": [{ "a": "g1" }] },
    { "id": "g1", "tipo": "compuerta", "nombre": "¿Pregunta de decisión?", "rol": "...", "siguiente": [{ "a": "t2", "condicion": "Sí" }, { "a": "t3", "condicion": "No" }] },
    { "id": "fin", "tipo": "fin", "nombre": "Proceso finalizado" }
  ]
}
REGLAS OBLIGATORIAS:
1. Incluye TODOS los pasos del levantamiento, en su orden. NUNCA resumas, fusiones ni omitas pasos: si el texto trae 20 pasos, el JSON trae 20 tareas.
2. Nombres COMPLETOS. Prohibido abreviar, cortar o usar puntos suspensivos. Cada tarea: "Verbo en infinitivo + objeto" (ej. "Verificar historial crediticio del contribuyente").
3. "tipo" solo puede ser: inicio, tarea, compuerta (decisión exclusiva XOR), compuerta_paralela (actividades simultáneas), fin.
4. Toda decisión (si, cuando, de lo contrario, aprueba/rechaza) es una compuerta con una salida por cada alternativa y su "condicion" en cada salida.
5. Compuerta paralela: úsala para actividades que ocurren al mismo tiempo y únelas con otra compuerta_paralela.
6. "rol" en cada tarea y compuerta: quien la ejecuta según el texto (solicitante, analista, supervisor, TI, etc.). Si no se indica, deduce el más lógico.
7. Un solo inicio y al menos un fin. Todo paso, excepto los de tipo fin, tiene "siguiente"; las ramas deben converger o terminar en un fin. Cada "a" debe ser el id de un paso que existe.
8. "descripcion" completa pero concisa (1 a 3 oraciones) para cada tarea.
9. El evento de inicio solo marca el disparador con un nombre corto (ej. "Solicitud recibida"); la primera acción del levantamiento (ej. "Presentar solicitud en ventanilla") es una TAREA que viene después del inicio. No pongas acciones dentro del evento de inicio ni del fin.
10. Cuando dos ramas de una compuerta de decisión (XOR) se reúnen, usa otra compuerta tipo "compuerta" (exclusiva) para unirlas, nunca compuerta_paralela. compuerta_paralela solo para actividades simultáneas reales.
11. El nombre de toda compuerta de decisión es una pregunta cerrada entre signos de interrogación (ej. "¿Historial de pagos favorable?"). Una compuerta que solo une ramas puede llamarse "Unión de ramas".
12. Todos los nombres de tarea empiezan con verbo en infinitivo (Aprobar, no Aprueba).`;

const SYSTEM_QW = `Eres un consultor senior de mejora de procesos (BPM, Lean, Six Sigma) para instituciones públicas de República Dominicana.
Recibes el JSON de un proceso REAL ya modelado (titulo, pasos con rol y tipo, metricas y hallazgos estructurales) y devuelves EXCLUSIVAMENTE un objeto JSON válido, sin markdown, con esta forma exacta:
{ "iniciativas": [ { "titulo": "acción concreta", "descripcion": "1 a 2 oraciones: qué hacer, en qué pasos y qué mejora", "impacto": "Alto" | "Bajo", "esfuerzo": "Alto" | "Bajo", "pasos": ["id de pasos relacionados"] } ] }
REGLAS:
1. Entre 6 y 10 iniciativas ESPECÍFICAS para este proceso; cita los pasos por su nombre. Nada genérico ni copiado de otros procesos.
2. Basa las ideas en desperdicios Lean (esperas, traspasos, reprocesos, sobreprocesamiento, movimientos), automatización de tareas repetitivas, consolidación de aprobaciones, paralelización y claridad de responsables.
3. "impacto" y "esfuerzo" solo pueden ser "Alto" o "Bajo". Distribuye las iniciativas en los cuatro cuadrantes cuando tenga sentido (quick wins = impacto Alto y esfuerzo Bajo).
4. Sé crítico al estimar el esfuerzo: integraciones entre sistemas, firma digital con validez legal, portales nuevos, cambios de normativa o de estructura organizacional son esfuerzo "Alto". Como máximo la mitad de las iniciativas pueden ser impacto Alto con esfuerzo Bajo; incluye también iniciativas de impacto Bajo.
5. Nunca cites ids internos de pasos (t1, g2, fin1…) en "titulo" ni "descripcion": usa los nombres de los pasos. Los ids solo van en el arreglo "pasos".
6. No inventes sistemas, cifras ni áreas que no aparezcan en el JSON.`;

const SYSTEM_CR = `Eres un consultor senior de mejora de procesos (BPM, Lean, Six Sigma) para instituciones públicas de República Dominicana.
Recibes el JSON de un proceso REAL ya modelado (titulo, problema_focal opcional, pasos con rol y tipo, metricas y hallazgos estructurales) y devuelves EXCLUSIVAMENTE un objeto JSON válido, sin markdown, con esta forma exacta:
{ "problema": "problema focal en una oración",
  "categorias": [ { "nombre": "Personas", "causas": ["..."] }, { "nombre": "Procesos", "causas": ["..."] }, { "nombre": "Tecnología", "causas": ["..."] }, { "nombre": "Materiales / Datos", "causas": ["..."] }, { "nombre": "Medición", "causas": ["..."] }, { "nombre": "Entorno / Normativa", "causas": ["..."] } ],
  "cincoPorques": [ { "nivel": 1, "pregunta": "...", "respuesta": "..." } ] }
REGLAS:
1. Si viene "problema_focal", úsalo tal cual; si no, deduce el problema más probable a partir de los hallazgos (cuellos de botella, traspasos, reprocesos).
2. Exactamente las 6 categorías indicadas, con 1 a 3 causas cada una, específicas de ESTE proceso citando los pasos por su nombre. Si el diagrama no da evidencia para una categoría, escribe "Hipótesis a validar: ..." en lugar de inventar hechos.
3. "cincoPorques": exactamente 5 objetos encadenados (la respuesta de uno origina la pregunta del siguiente), que parten del problema y terminan en una causa raíz accionable; el nivel 5 tiene la pregunta "¿Cuál es entonces la causa raíz?" y su respuesta empieza con "Causa raíz:".
4. Nunca cites ids internos de pasos (t1, g2, fin1…): usa los nombres de los pasos.
5. No inventes cifras, sistemas ni áreas que no aparezcan en el JSON.`;

const armarPrompt = `const body = $('Webhook BPMN').first().json.body || {};
const texto = (body.texto || '').toString().trim();
if (!texto) throw new Error('texto_vacio');
const prompts = ${JSON.stringify({ generar: SYSTEM, quickwins: SYSTEM_QW, causaraiz: SYSTEM_CR })};
const modo = prompts[body.modo] ? body.modo : 'generar';
const system_prompt = prompts[modo];
const titulo = modo === 'generar' ? 'Levantamiento del proceso:' : 'Datos del proceso (JSON):';
return [{ json: {
  system_prompt,
  prompt: [titulo, '', texto.slice(0, 40000)].join(String.fromCharCode(10)),
  temperature: 0.2,
  json_mode: true,
  ollama_model: 'qwen2.5:7b'
} }];`;

const formatear = `const r = $json || {};
let texto = (r.respuesta || '').toString().trim();
if (!texto) return [{ json: { ok: false, error: 'sin_respuesta' } }];
texto = texto.replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/, '').replace(/\`\`\`\s*$/, '').trim();
const ini = texto.indexOf('{'), fin = texto.lastIndexOf('}');
if (ini > 0 && fin > ini) texto = texto.slice(ini, fin + 1);
try {
  const obj = JSON.parse(texto);
  const modo = (($('Webhook BPMN').first().json.body || {}).modo) || 'generar';
  if (modo === 'generar') {
    if (!Array.isArray(obj.pasos) || obj.pasos.length === 0) throw new Error('sin_pasos');
    return [{ json: { ok: true, proceso: obj, proveedor_usado: r.proveedor_usado || '', modelo_usado: r.modelo_usado || '' } }];
  }
  return [{ json: { ok: true, resultado: obj, proveedor_usado: r.proveedor_usado || '', modelo_usado: r.modelo_usado || '' } }];
} catch (e) {
  return [{ json: { ok: false, error: 'json_invalido', detalle: String(e.message), proveedor_usado: r.proveedor_usado || '' } }];
}`;

const wf = {
  name: 'BPMN Studio - Generar proceso desde texto (Groq/Nemotron/Ollama)',
  nodes: [
    { id: 'n1', name: 'Webhook BPMN', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
      webhookId: 'bpmn-generar-proceso',
      parameters: { httpMethod: 'POST', path: 'bpmn-generar-proceso', responseMode: 'responseNode', options: { allowedOrigins: '*' } } },
    { id: 'n6', name: 'Validar sesion', type: 'n8n-nodes-base.postgres', typeVersion: 2.5, position: [120, 0], credentials: { postgres: { id: 'mavHpWO7fIkviTqC', name: 'Postgres INAP Progreso' } },
      parameters: { operation: 'executeQuery', query: "SELECT count(*)::int AS autorizado FROM bpmn_usuarios WHERE $1::text <> '' AND session_token = $1::text AND activo AND token_creado_en > now() - interval '12 hours'",
        options: { queryReplacement: "={{ [ (($json.body.token)||'').toString() ] }}" } } },
    { id: 'n7', name: 'Sesion valida?', type: 'n8n-nodes-base.if', typeVersion: 2, position: [180, 0],
      parameters: { conditions: { options: { leftValue: '', caseSensitive: true, typeValidation: 'strict' }, combinator: 'and', conditions: [{ id: 'c1', operator: { type: 'number', operation: 'equals' }, leftValue: '={{ $json.autorizado }}', rightValue: 1 }] } } },
    { id: 'n8', name: 'No autorizado', type: 'n8n-nodes-base.code', typeVersion: 2, position: [420, 200], parameters: { jsCode: "return [{ json: { ok: false, error: 'no_autorizado' } }];" } },
    { id: 'n2', name: 'Armar Prompt', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 0], parameters: { jsCode: armarPrompt } },
    { id: 'n3', name: 'Failover LLM', type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2, position: [480, 0],
      parameters: { source: 'database', workflowId: { __rl: true, value: 'CqQQjEhkBUpCY7WB', mode: 'list', cachedResultName: 'Sub-Workflow: LLM 3-Tier Failover (Groq + Nemotron + Ollama)' },
        workflowInputs: { mappingMode: 'passthrough', value: {}, matchingColumns: [], schema: [] }, options: {} } },
    { id: 'n4', name: 'Formatear', type: 'n8n-nodes-base.code', typeVersion: 2, position: [720, 0], parameters: { jsCode: formatear } },
    { id: 'n5', name: 'Responder', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [960, 0],
      parameters: { respondWith: 'json', responseBody: '={{ $json }}', options: { responseHeaders: { entries: [{ name: 'Access-Control-Allow-Origin', value: '*' }] } } } }
  ],
  connections: {
    'Webhook BPMN': { main: [[{ node: 'Validar sesion', type: 'main', index: 0 }]] },
    'Validar sesion': { main: [[{ node: 'Sesion valida?', type: 'main', index: 0 }]] },
    'Sesion valida?': { main: [[{ node: 'Armar Prompt', type: 'main', index: 0 }], [{ node: 'No autorizado', type: 'main', index: 0 }]] },
    'No autorizado': { main: [[{ node: 'Responder', type: 'main', index: 0 }]] },
    'Armar Prompt': { main: [[{ node: 'Failover LLM', type: 'main', index: 0 }]] },
    'Failover LLM': { main: [[{ node: 'Formatear', type: 'main', index: 0 }]] },
    'Formatear': { main: [[{ node: 'Responder', type: 'main', index: 0 }]] }
  },
  settings: { executionOrder: 'v1' }
};
writeFileSync(new URL('./bpmn-generar-proceso.workflow.json', import.meta.url), JSON.stringify([{ id: 'bpmnGenerarProc01', active: false, ...wf }], null, 2));
console.log('ok');
