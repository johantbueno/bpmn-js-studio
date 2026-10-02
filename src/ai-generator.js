/**
 * Generador de procesos BPMN con IA.
 * El texto va a un webhook de n8n (cascada Groq -> Nemotron -> Ollama, las claves viven en el servidor).
 * La IA devuelve un JSON de proceso; aquí se valida, se convierte a BPMN 2.0 y se diagrama.
 */
import { layoutProcess } from 'bpmn-auto-layout';
import { validarProceso, procesoABpmnXml } from './proceso-json.js';

const WEBHOOK_URL = import.meta.env?.VITE_BPMN_WEBHOOK
  || 'https://n8n-inap.167.88.36.13.sslip.io/webhook/bpmn-generar-proceso';
const TIMEOUT_MS = 150000;

export async function generarBPMNConIA(texto, { fetchFn = globalThis.fetch, onEstado = () => {}, token = '' } = {}) {
  const limpio = texto.trim();
  if (!limpio) throw new Error('El texto del proceso está vacío');

  let proceso = null;
  try {
    onEstado('Analizando el proceso con IA…');
    proceso = await pedirProceso(limpio, fetchFn, token);
    let { ok, errores } = validarProceso(proceso);
    if (!ok) {
      onEstado('Corrigiendo inconsistencias detectadas…');
      const correccion = `${limpio}\n\nCORRIGE ESTOS ERRORES de tu respuesta anterior y devuelve el JSON completo:\n- ${errores.join('\n- ')}`;
      proceso = await pedirProceso(correccion, fetchFn, token);
      ({ ok, errores } = validarProceso(proceso));
      if (!ok) throw new Error(`La IA devolvió un proceso inconsistente: ${errores.join('; ')}`);
    }
  } catch (err) {
    if (err.code === 'no_autorizado') throw err;
    console.warn('IA no disponible o respuesta inválida, usando motor local:', err);
    proceso = procesoLocal(limpio);
  }

  onEstado('Diagramando…');
  return layoutProcess(procesoABpmnXml(proceso));
}

async function pedirProceso(texto, fetchFn, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetchFn(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, token }),
      signal: ctrl.signal
    });
    if (!resp.ok) throw new Error(`Servidor de IA respondió ${resp.status}`);
    const datos = await resp.json();
    if (datos.error === 'no_autorizado') throw Object.assign(new Error('Tu sesión venció. Vuelve a iniciar sesión.'), { code: 'no_autorizado' });
    if (!datos.ok) throw new Error(`La IA no pudo generar el proceso (${datos.error || 'sin detalle'})`);
    return datos.proceso;
  } finally {
    clearTimeout(timer);
  }
}

/** Respaldo sin IA: un paso por línea/numeración/conector, flujo lineal. Sin límite de pasos ni recortes. */
export function procesoLocal(texto) {
  const pasos = texto
    .replace(/\b(luego|después|posteriormente|seguidamente)\b/gi, '\n')
    .split(/\n+|;|(?:^|\s)\d+[.)]\s+/)
    .map(p => p.replace(/^[-•*]\s*/, '').trim())
    .filter(p => p.length > 3);

  const tareas = pasos.length >= 1 ? pasos : ['Registrar solicitud del proceso'];
  const resultado = [{ id: 'inicio', tipo: 'inicio', nombre: 'Inicio del proceso', siguiente: [{ a: 't1' }] }];
  tareas.forEach((nombre, i) => resultado.push({
    id: `t${i + 1}`, tipo: 'tarea', nombre,
    siguiente: [{ a: i === tareas.length - 1 ? 'fin' : `t${i + 2}` }]
  }));
  resultado.push({ id: 'fin', tipo: 'fin', nombre: 'Proceso finalizado' });
  return { titulo: 'Proceso', pasos: resultado };
}
