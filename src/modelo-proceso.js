/**
 * Modelo común del proceso abierto: lo leen el Dashboard, Quick Wins, Causa Raíz y la matriz RACI.
 * Un "paso" tiene la misma forma que el JSON del generador de IA:
 *   { id, tipo, tipoTarea?, nombre, rol, descripcion, siguiente: [{ a, condicion? }] }
 */

const TIPO_ELEMENTO = {
  'bpmn:StartEvent': 'inicio',
  'bpmn:EndEvent': 'fin',
  'bpmn:IntermediateCatchEvent': 'evento',
  'bpmn:IntermediateThrowEvent': 'evento',
  'bpmn:BoundaryEvent': 'evento',
  'bpmn:ExclusiveGateway': 'compuerta',
  'bpmn:InclusiveGateway': 'compuerta',
  'bpmn:EventBasedGateway': 'compuerta',
  'bpmn:ComplexGateway': 'compuerta',
  'bpmn:ParallelGateway': 'compuerta_paralela',
  'bpmn:Task': 'tarea',
  'bpmn:UserTask': 'tarea',
  'bpmn:ManualTask': 'tarea',
  'bpmn:ServiceTask': 'tarea',
  'bpmn:ScriptTask': 'tarea',
  'bpmn:SendTask': 'tarea',
  'bpmn:ReceiveTask': 'tarea',
  'bpmn:BusinessRuleTask': 'tarea',
  'bpmn:SubProcess': 'tarea',
  'bpmn:CallActivity': 'tarea',
  'bpmn:Transaction': 'tarea'
};

const TIPO_TAREA = {
  'bpmn:Task': 'generica', 'bpmn:UserTask': 'usuario', 'bpmn:ManualTask': 'manual', 'bpmn:ServiceTask': 'servicio',
  'bpmn:ScriptTask': 'script', 'bpmn:SendTask': 'envio', 'bpmn:ReceiveTask': 'recepcion', 'bpmn:BusinessRuleTask': 'regla',
  'bpmn:SubProcess': 'subproceso', 'bpmn:CallActivity': 'subproceso', 'bpmn:Transaction': 'subproceso'
};
const AUTOMATIZADAS = new Set(['servicio', 'script', 'envio', 'regla']);

const REGEX_AUTOMATIZABLE = /^(registrar|enviar|notificar|digitar|imprimir|archivar|copiar|transcribir|reenviar|recordar|actualizar|generar|comunicar|capturar|ingresar|escanear|distribuir)\b/;
const REGEX_APROBACION = /^(aprobar|autorizar|firmar|visar|aprueba|autoriza|firma)\b/;

const sinTildes = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Convierte los elementos del elementRegistry de bpmn-js al modelo de pasos. */
export function modeloDesdeElementos(elementos) {
  const pasos = new Map();
  let titulo = '';
  let tituloProceso = '';

  for (const el of elementos) {
    if (el.type === 'bpmn:Participant' && !titulo) titulo = (el.businessObject?.name || '').trim();
    if (el.type === 'bpmn:Process' && !tituloProceso) tituloProceso = (el.businessObject?.name || '').trim();
    const tipo = TIPO_ELEMENTO[el.type];
    if (!tipo) continue;
    const bo = el.businessObject || {};
    const doc = (bo.documentation?.[0]?.text || '').trim();
    const rolDoc = doc.match(/^Rol:\s*(.+)$/m)?.[1]?.trim();
    const paso = {
      id: el.id,
      tipo,
      nombre: (bo.name || '').replace(/\s+/g, ' ').trim(),
      rol: (bo.lanes?.[0]?.name || rolDoc || '').trim(),
      descripcion: doc.replace(/^Rol:.*\n?/m, '').trim(),
      siguiente: []
    };
    if (tipo === 'tarea') paso.tipoTarea = TIPO_TAREA[el.type];
    pasos.set(el.id, paso);
  }

  for (const el of elementos) {
    if (el.type !== 'bpmn:SequenceFlow') continue;
    const origen = pasos.get(el.source?.id);
    if (!origen || !pasos.has(el.target?.id)) continue;
    const condicion = (el.businessObject?.name || '').trim();
    origen.siguiente.push(condicion ? { a: el.target.id, condicion } : { a: el.target.id });
  }

  return { titulo: titulo || tituloProceso || 'Proceso', pasos: [...pasos.values()] };
}

const esTarea = p => p.tipo === 'tarea';

/** Métricas estructurales y hallazgos del proceso. */
const normalizar = lista => lista.map(p => ({ ...p, siguiente: p.siguiente || [] }));

export function analizarProceso(entrada) {
  const pasos = normalizar(entrada);
  const porId = new Map(pasos.map(p => [p.id, p]));
  const tareas = pasos.filter(esTarea);
  const compuertas = pasos.filter(p => p.tipo === 'compuerta');
  const paralelas = pasos.filter(p => p.tipo === 'compuerta_paralela');

  const roles = {};
  tareas.forEach(t => { if (t.rol) roles[t.rol] = (roles[t.rol] || 0) + 1; });
  const sinRol = tareas.filter(t => !t.rol).length;

  let traspasos = 0;
  pasos.forEach(p => p.siguiente.forEach(s => {
    const d = porId.get(s.a);
    if (p.rol && d?.rol && p.rol !== d.rol) traspasos++;
  }));

  const complejidad = 1 + compuertas.reduce((n, g) => n + Math.max(0, g.siguiente.length - 1), 0);
  const automatizadas = tareas.filter(t => AUTOMATIZADAS.has(t.tipoTarea)).length;

  const memo = new Map();
  const enPila = new Set();
  const largo = id => {
    if (memo.has(id)) return memo.get(id);
    if (enPila.has(id)) return 0;
    enPila.add(id);
    const p = porId.get(id);
    const mejor = p.siguiente.reduce((m, s) => (porId.has(s.a) ? Math.max(m, largo(s.a)) : m), 0);
    enPila.delete(id);
    const v = mejor + (esTarea(p) ? 1 : 0);
    memo.set(id, v);
    return v;
  };
  const entradas = new Set(pasos.flatMap(p => p.siguiente.map(s => s.a)));
  const raices = pasos.filter(p => p.tipo === 'inicio' || !entradas.has(p.id));
  const caminoMasLargo = raices.reduce((m, r) => Math.max(m, largo(r.id)), 0);

  const base = {
    tareas: tareas.length,
    compuertas: compuertas.length,
    paralelas: paralelas.length,
    inicios: pasos.filter(p => p.tipo === 'inicio').length,
    fines: pasos.filter(p => p.tipo === 'fin').length,
    eventos: pasos.filter(p => p.tipo === 'evento').length,
    roles, sinRol, traspasos, complejidad, automatizadas, caminoMasLargo
  };
  return { ...base, hallazgos: calcularHallazgos(pasos, tareas, compuertas, base) };
}

function calcularHallazgos(pasos, tareas, compuertas, m) {
  const hs = [];
  const nombres = ids => ids.map(id => pasos.find(p => p.id === id)?.nombre).filter(Boolean);

  if (m.sinRol > 0) {
    const ids = tareas.filter(t => !t.rol).map(t => t.id);
    hs.push({ id: 'sin_roles', severidad: 'media', pasos: ids,
      titulo: m.sinRol === tareas.length ? 'El proceso no define responsables' : `${m.sinRol} tarea(s) sin responsable`,
      detalle: 'Sin carriles (lanes) o rol definido no se puede saber quién ejecuta cada actividad ni medir traspasos.' });
  }

  if (m.traspasos >= 3 && tareas.length && m.traspasos / tareas.length > 0.4) {
    hs.push({ id: 'traspasos_altos', severidad: 'alta', pasos: [],
      titulo: `${m.traspasos} traspasos entre áreas para ${tareas.length} tareas`,
      detalle: 'Cada cambio de responsable (hand-off) agrega esperas y riesgo de pérdida de información.' });
  }

  const [rolTop, nTop] = Object.entries(m.roles).sort((a, b) => b[1] - a[1])[0] || [];
  if (rolTop && tareas.length >= 6 && nTop / tareas.length > 0.5) {
    hs.push({ id: 'concentracion', severidad: 'media', pasos: tareas.filter(t => t.rol === rolTop).map(t => t.id),
      titulo: `"${rolTop}" concentra ${nTop} de ${tareas.length} tareas`,
      detalle: 'Un solo rol con más de la mitad del trabajo es un riesgo de cuello de botella y de dependencia de personas.' });
  }

  const manuales = tareas.filter(t => ['generica', 'manual', 'usuario'].includes(t.tipoTarea) && REGEX_AUTOMATIZABLE.test(sinTildes(t.nombre)));
  if (manuales.length) {
    hs.push({ id: 'manuales_automatizables', severidad: 'media', pasos: manuales.map(t => t.id),
      titulo: `${manuales.length} tarea(s) manuales candidatas a automatizar`,
      detalle: `Actividades repetitivas (registrar, enviar, notificar, archivar…): ${nombres(manuales.map(t => t.id)).join('; ')}.` });
  }

  const aprobaciones = tareas.filter(t => REGEX_APROBACION.test(sinTildes(t.nombre)));
  if (aprobaciones.length >= 3) {
    hs.push({ id: 'aprobaciones_encadenadas', severidad: 'media', pasos: aprobaciones.map(t => t.id),
      titulo: `${aprobaciones.length} aprobaciones/firmas en el mismo proceso`,
      detalle: 'Las aprobaciones escalonadas sin valor agregado alargan el tiempo de ciclo; conviene consolidarlas.' });
  }

  const sinCond = compuertas.filter(g => g.siguiente.length > 1 && g.siguiente.some(s => !s.condicion));
  if (sinCond.length) {
    hs.push({ id: 'decision_sin_condicion', severidad: 'baja', pasos: sinCond.map(g => g.id),
      titulo: `${sinCond.length} decisión(es) con salidas sin condición`,
      detalle: 'Cada salida de una compuerta debe indicar el criterio (Sí/No, monto, resultado) para evitar ambigüedad.' });
  }

  if (m.caminoMasLargo >= 12) {
    hs.push({ id: 'camino_largo', severidad: 'media', pasos: [],
      titulo: `Secuencia de ${m.caminoMasLargo} tareas de punta a punta`,
      detalle: 'Un flujo tan largo suele esconder esperas; revisar qué pasos pueden eliminarse o fusionarse.' });
  }

  if (tareas.length >= 8 && m.paralelas === 0) {
    hs.push({ id: 'camino_sin_paralelismo', severidad: 'baja', pasos: [],
      titulo: 'Todo el flujo es secuencial',
      detalle: 'Hay oportunidad de ejecutar en paralelo actividades independientes y reducir el tiempo total.' });
  }

  if (compuertas.length === 0 && tareas.length >= 5) {
    hs.push({ id: 'sin_excepciones', severidad: 'baja', pasos: [],
      titulo: 'No hay decisiones ni rutas de excepción',
      detalle: 'Ningún rechazo, observación o reproceso modelado: el flujo solo cubre el camino ideal.' });
  }

  const orden = { alta: 0, media: 1, baja: 2 };
  return hs.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}

/** Matriz RACI con los roles del propio diagrama. */
export function generarRACI(entrada) {
  const pasos = normalizar(entrada);
  const DUENO = 'Dueño del proceso';
  const SIN_ROL = 'Sin rol asignado';
  const porId = new Map(pasos.map(p => [p.id, p]));
  const tareas = pasos.filter(esTarea);

  const nombres = [];
  const agregar = r => { if (r && !nombres.includes(r)) nombres.push(r); };
  tareas.forEach(t => agregar(t.rol));
  if (tareas.some(t => !t.rol)) agregar(SIN_ROL);
  agregar(DUENO);

  const anteriores = id => pasos.filter(p => p.siguiente.some(s => s.a === id));
  const matriz = tareas.map(t => {
    const r = t.rol || SIN_ROL;
    const asig = Object.fromEntries(nombres.map(n => [n, '-']));
    asig[r] = 'R';
    asig[DUENO] = r === DUENO ? 'A/R' : 'A';
    const roles = lista => lista.map(p => p.rol).filter(x => x && x !== r);
    roles(anteriores(t.id)).forEach(x => { if (asig[x] === '-') asig[x] = 'C'; });
    roles(t.siguiente.map(s => porId.get(s.a)).filter(Boolean)).forEach(x => { if (asig[x] === '-') asig[x] = 'I'; });
    return { id: t.id, tarea: t.nombre, asignaciones: asig };
  });

  return { roles: nombres.map(n => ({ id: n, nombre: n })), matriz };
}
