/**
 * Proceso estructurado (JSON devuelto por la IA) -> BPMN 2.0 semántico.
 * El diagrama visual (coordenadas) lo agrega bpmn-auto-layout después.
 *
 * Formato esperado:
 * { titulo, pasos: [{ id, tipo: 'inicio'|'tarea'|'compuerta'|'compuerta_paralela'|'fin',
 *                     nombre, descripcion?, rol?, siguiente?: [{ a, condicion? }] }] }
 */

const ELEMENTO_POR_TIPO = {
  inicio: 'startEvent',
  tarea: 'task',
  compuerta: 'exclusiveGateway',
  compuerta_paralela: 'parallelGateway',
  fin: 'endEvent'
};

export function validarProceso(proceso) {
  const errores = [];
  const pasos = proceso?.pasos;
  if (!Array.isArray(pasos) || pasos.length === 0) {
    return { ok: false, errores: ['El proceso no contiene pasos'] };
  }

  const ids = new Set();
  for (const p of pasos) {
    if (ids.has(p.id)) errores.push(`Id duplicado: ${p.id}`);
    ids.add(p.id);
    if (!ELEMENTO_POR_TIPO[p.tipo]) errores.push(`Tipo desconocido en ${p.id}: ${p.tipo}`);
    if (/(\.\.\.|…)\s*$/.test(p.nombre || '')) errores.push(`Nombre truncado en ${p.id}: "${p.nombre}"`);
  }
  for (const p of pasos) {
    for (const s of p.siguiente || []) {
      if (!ids.has(s.a)) errores.push(`El paso ${p.id} apunta a un paso inexistente: ${s.a}`);
    }
  }
  if (!pasos.some(p => p.tipo === 'inicio')) errores.push('Falta el evento de inicio');
  if (!pasos.some(p => p.tipo === 'fin')) errores.push('Falta el evento de fin');

  for (const p of pasos) {
    if (p.tipo !== 'fin' && !(p.siguiente || []).length) errores.push(`El paso ${p.id} está sin salida`);
  }

  const porId = new Map(pasos.map(p => [p.id, p]));
  const visitados = new Set();
  const pila = pasos.filter(p => p.tipo === 'inicio').map(p => p.id);
  while (pila.length) {
    const id = pila.pop();
    if (visitados.has(id) || !porId.has(id)) continue;
    visitados.add(id);
    (porId.get(id).siguiente || []).forEach(s => pila.push(s.a));
  }
  for (const p of pasos) {
    if (!visitados.has(p.id)) errores.push(`El paso ${p.id} ("${p.nombre}") es inalcanzable desde el inicio`);
  }

  return { ok: errores.length === 0, errores };
}

function esc(texto) {
  return String(texto ?? '').replace(/[<>&'"]/g, c => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
  ));
}

export function procesoABpmnXml(proceso) {
  const pasos = proceso.pasos;
  const flujos = [];
  const entrantes = new Map(pasos.map(p => [p.id, []]));
  const salientes = new Map(pasos.map(p => [p.id, []]));

  pasos.forEach(p => (p.siguiente || []).forEach(s => {
    const id = `Flow_${flujos.length + 1}`;
    flujos.push({ id, de: p.id, a: s.a, condicion: s.condicion });
    salientes.get(p.id).push(id);
    entrantes.get(s.a)?.push(id);
  }));

  const elementos = pasos.map(p => {
    const el = ELEMENTO_POR_TIPO[p.tipo];
    const doc = [p.rol ? `Rol: ${p.rol}` : '', p.descripcion || ''].filter(Boolean).join('\n');
    const hijos = [
      doc ? `      <bpmn:documentation>${esc(doc)}</bpmn:documentation>` : '',
      ...entrantes.get(p.id).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`),
      ...salientes.get(p.id).map(f => `      <bpmn:outgoing>${f}</bpmn:outgoing>`)
    ].filter(Boolean).join('\n');
    return `    <bpmn:${el} id="${esc(p.id)}" name="${esc(p.nombre)}">\n${hijos}\n    </bpmn:${el}>`;
  });

  const secuencias = flujos.map(f => {
    const nombre = f.condicion ? ` name="${esc(f.condicion)}"` : '';
    return `    <bpmn:sequenceFlow id="${f.id}"${nombre} sourceRef="${esc(f.de)}" targetRef="${esc(f.a)}" />`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_IA" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_IA" name="${esc(proceso.titulo)}" isExecutable="false">
${elementos.join('\n')}
${secuencias.join('\n')}
  </bpmn:process>
</bpmn:definitions>`;
}
