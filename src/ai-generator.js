/**
 * Generador de procesos BPMN con IA.
 * El texto va a un webhook de n8n (cascada Groq -> Nemotron -> Ollama, las claves viven en el servidor).
 * La IA devuelve un JSON de proceso; aquí se valida, se convierte a BPMN 2.0 y se diagrama.
 */
import { layoutProcess } from 'bpmn-auto-layout';
import { llamarIA } from './webhook-ia.js';
import { validarProceso, procesoABpmnXml } from './proceso-json.js';


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
  const datos = await llamarIA({ texto, token }, fetchFn);
  return datos.proceso;
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
