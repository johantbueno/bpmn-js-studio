/**
 * Quick Wins (matriz impacto/esfuerzo) y Causa Raíz (Ishikawa + 5 Porqués) del proceso abierto.
 * La IA analiza el proceso real; si falla, se usan reglas locales basadas en los hallazgos del diagrama.
 */
import { llamarIA } from './webhook-ia.js';

const sinTildes = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function cuadrante(impacto, esfuerzo) {
  const alto = x => sinTildes(x) === 'alto';
  if (alto(impacto)) return alto(esfuerzo) ? 'estrategico' : 'quick-win';
  return alto(esfuerzo) ? 'descartar' : 'menor';
}

const CATEGORIAS = [
  { nombre: 'Personas', icono: '👥', clave: 'persona' },
  { nombre: 'Procesos', icono: '📋', clave: 'proceso' },
  { nombre: 'Tecnología', icono: '💻', clave: 'tecnolog' },
  { nombre: 'Materiales / Datos', icono: '📦', clave: 'material' },
  { nombre: 'Medición', icono: '📊', clave: 'medicion' },
  { nombre: 'Entorno / Normativa', icono: '⚖️', clave: 'entorno' }
];
const ALIAS = { dato: 'material', normativ: 'entorno', ambient: 'entorno' };

function categoriaConocida(nombre) {
  const n = sinTildes(nombre);
  return CATEGORIAS.find(c => n.startsWith(c.clave))
    || CATEGORIAS.find(c => c.clave === Object.entries(ALIAS).find(([k]) => n.startsWith(k))?.[1]);
}

// ---------------- Reglas locales (respaldo sin IA) ----------------

export function quickWinsLocales(modelo, analisis) {
  const h = Object.fromEntries(analisis.hallazgos.map(x => [x.id, x]));
  const nombres = ids => ids.map(id => modelo.pasos.find(p => p.id === id)?.nombre).filter(Boolean);
  const lista = [];
  const add = (titulo, descripcion, impacto, esfuerzo, pasos = []) =>
    lista.push({ titulo, descripcion, impacto, esfuerzo, cuadrante: cuadrante(impacto, esfuerzo), pasos });

  if (h.manuales_automatizables) {
    add('Automatizar tareas repetitivas',
      `Convertir en tareas de servicio o notificaciones automáticas: ${nombres(h.manuales_automatizables.pasos).slice(0, 4).join('; ')}.`,
      'Alto', 'Bajo', h.manuales_automatizables.pasos);
  }
  if (h.aprobaciones_encadenadas) {
    add('Consolidar aprobaciones y firmas', h.aprobaciones_encadenadas.detalle, 'Alto', 'Bajo', h.aprobaciones_encadenadas.pasos);
  }
  if (h.sin_roles) {
    add('Definir responsables de cada actividad (carriles y RACI)', h.sin_roles.detalle, 'Alto', 'Bajo', h.sin_roles.pasos);
  }
  if (h.sin_excepciones) {
    add('Modelar rutas de rechazo y reproceso', h.sin_excepciones.detalle, 'Alto', 'Bajo');
  }
  if (h.decision_sin_condicion) {
    add('Documentar el criterio de cada decisión', h.decision_sin_condicion.detalle, 'Bajo', 'Bajo', h.decision_sin_condicion.pasos);
  }
  if (h.traspasos_altos) {
    add('Reducir traspasos entre áreas', h.traspasos_altos.detalle + ' Evaluar reasignar o fusionar actividades contiguas.', 'Alto', 'Alto');
  }
  if (h.concentracion) {
    add('Redistribuir la carga del rol saturado', h.concentracion.detalle, 'Alto', 'Alto', h.concentracion.pasos);
  }
  if (h.camino_sin_paralelismo) {
    add('Paralelizar actividades independientes', h.camino_sin_paralelismo.detalle, 'Alto', 'Alto');
  }
  if (h.camino_largo) {
    add('Eliminar o fusionar pasos sin valor agregado', h.camino_largo.detalle, 'Alto', 'Alto');
  }
  add('Medir el tiempo de cada actividad',
    'Registrar tiempos de ciclo y espera por actividad para identificar cuellos de botella con datos reales.', 'Bajo', 'Bajo');
  return lista;
}

export function causaRaizLocal(modelo, analisis, problema) {
  const h = Object.fromEntries(analisis.hallazgos.map(x => [x.id, x]));
  const texto = (...ids) => ids.filter(id => h[id]).map(id => `${h[id].titulo}. ${h[id].detalle}`);
  const porDefecto = (lista, msg) => (lista.length ? lista : [msg]);

  const causas = {
    Personas: porDefecto(texto('concentracion', 'sin_roles'), 'Sin evidencia en el diagrama; validar con el equipo la carga de trabajo y la capacitación.'),
    Procesos: porDefecto(texto('traspasos_altos', 'aprobaciones_encadenadas', 'camino_largo', 'camino_sin_paralelismo', 'sin_excepciones', 'decision_sin_condicion'),
      'La estructura del flujo no muestra problemas evidentes; validar con casos reales.'),
    Tecnología: porDefecto([
      ...texto('manuales_automatizables'),
      ...(analisis.automatizadas === 0 && analisis.tareas ? ['Ninguna tarea está modelada como servicio automatizado.'] : [])
    ], 'Sin evidencia en el diagrama; revisar los sistemas que soportan cada paso.'),
    'Materiales / Datos': ['El diagrama no modela documentos ni datos de entrada; validar la calidad y completitud de la información que recibe cada paso.'],
    Medición: [analisis.eventos === 0
      ? 'No hay eventos intermedios ni puntos de control que midan tiempos, SLA o alertas.'
      : 'Verificar que los eventos intermedios midan tiempos y generen alertas.'],
    'Entorno / Normativa': ['Requisitos legales, picos de demanda y dependencias externas no están modelados; validarlos con el dueño del proceso.']
  };

  const foco = problema?.trim() || `Demoras, reprocesos o pérdida de calidad en el proceso «${modelo.titulo}»`;
  const top = analisis.hallazgos[0];
  const segundo = analisis.hallazgos[1];
  const cincoPorques = [
    { nivel: 1, pregunta: `¿Por qué ocurre: ${foco}?`, respuesta: top ? `Porque el flujo presenta: ${top.titulo.toLowerCase()}.` : 'Porque no hay mediciones que identifiquen dónde se pierde el tiempo.' },
    { nivel: 2, pregunta: '¿Por qué se presenta esa situación?', respuesta: top ? top.detalle : 'Porque el proceso no registra tiempos ni causas de reproceso por actividad.' },
    { nivel: 3, pregunta: '¿Por qué no se ha corregido?', respuesta: segundo ? `Porque además existe otro hallazgo: ${segundo.titulo.toLowerCase()}.` : 'Porque el proceso no se revisa de punta a punta con indicadores.' },
    { nivel: 4, pregunta: '¿Por qué no se revisa de punta a punta?', respuesta: 'Porque las responsabilidades y las métricas están repartidas por área, sin un dueño del proceso que las integre.' },
    { nivel: 5, pregunta: '¿Cuál es entonces la causa raíz probable?', respuesta: 'Causa raíz probable (validar con el equipo): falta de un dueño del proceso con métricas de extremo a extremo y de automatización de las tareas repetitivas.' }
  ];

  return {
    problema: foco,
    categorias: CATEGORIAS.map(c => ({ nombre: c.nombre, icono: c.icono, causas: causas[c.nombre] })),
    cincoPorques,
    origen: 'reglas'
  };
}

// ---------------- IA ----------------

function resumenParaIA(modelo, analisis, problema) {
  const { hallazgos, ...metricas } = analisis;
  return {
    titulo: modelo.titulo,
    problema_focal: problema || undefined,
    pasos: modelo.pasos.map(p => ({ id: p.id, tipo: p.tipo, nombre: p.nombre, rol: p.rol || undefined, tipoTarea: p.tipoTarea, siguiente: p.siguiente })),
    metricas,
    hallazgos: hallazgos.map(x => ({ titulo: x.titulo, detalle: x.detalle }))
  };
}

/** La IA a veces cita ids internos (t2, t1→t2); se quitan para que el texto lea natural. */
function quitarIds(texto, ids) {
  const internos = ids.filter(id => /^(?:[a-z]{1,4}\d+|(?:Activity|Gateway|Event|StartEvent|EndEvent|Flow|SequenceFlow|Task|Lane|Participant)_\w+)$/i.test(id));
  if (!internos.length) return texto;
  const alt = internos.map(id => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const sep = '(?:\\s*(?:→|->|[,;/])+\\s*)*';
  return texto
    .replace(new RegExp('\\s*\\((?:\\s*(?:' + alt + ')' + sep + ')+\\)', 'g'), '')
    .replace(new RegExp('\\b(?:' + alt + ')\\b(?:\\s*(?:→|->|/)\\s*\\b(?:' + alt + ')\\b)*', 'g'), '')
    .replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
}

function normalizarQuickWins(r, ids) {
  const lista = Array.isArray(r?.iniciativas) ? r.iniciativas : [];
  const validas = lista.filter(i => typeof i?.titulo === 'string' && i.titulo.trim()).map(i => {
    const impacto = sinTildes(i.impacto) === 'alto' ? 'Alto' : 'Bajo';
    const esfuerzo = sinTildes(i.esfuerzo) === 'alto' ? 'Alto' : 'Bajo';
    return { titulo: quitarIds(i.titulo.trim(), ids), descripcion: quitarIds(String(i.descripcion || '').trim(), ids), impacto, esfuerzo, cuadrante: cuadrante(impacto, esfuerzo), pasos: Array.isArray(i.pasos) ? i.pasos : [] };
  });
  return validas.length >= 1 ? { iniciativas: validas } : null;
}

function normalizarCausaRaiz(r, ids) {
  const categorias = (Array.isArray(r?.categorias) ? r.categorias : []).map(c => {
    const conocida = categoriaConocida(c?.nombre);
    const causas = (Array.isArray(c?.causas) ? c.causas : []).map(x => quitarIds(String(x).trim(), ids)).filter(Boolean);
    return causas.length ? { nombre: conocida?.nombre || String(c.nombre || 'Otros'), icono: conocida?.icono || '🔹', causas } : null;
  }).filter(Boolean);
  const porques = (Array.isArray(r?.cincoPorques) ? r.cincoPorques : [])
    .filter(x => x?.pregunta && x?.respuesta)
    .map((x, i) => ({ nivel: i + 1, pregunta: quitarIds(String(x.pregunta), ids), respuesta: quitarIds(String(x.respuesta), ids) }));
  if (!categorias.length || porques.length < 3) return null;
  return { problema: quitarIds(String(r.problema || '').trim(), ids), categorias, cincoPorques: porques };
}

/** modo: 'quickwins' | 'causaraiz'. Siempre devuelve un resultado (IA o reglas) con `origen`. */
export async function analizarConIA(modo, modelo, analisis, { fetchFn = globalThis.fetch, token = '', problema = '' } = {}) {
  try {
    const datos = await llamarIA({ modo, token, texto: JSON.stringify(resumenParaIA(modelo, analisis, problema)), problema }, fetchFn);
    const ids = modelo.pasos.map(p => p.id);
    const normalizado = modo === 'quickwins' ? normalizarQuickWins(datos.resultado, ids) : normalizarCausaRaiz(datos.resultado, ids);
    if (normalizado) {
      if (modo === 'causaraiz' && !normalizado.problema) normalizado.problema = problema || causaRaizLocal(modelo, analisis, problema).problema;
      return { ...normalizado, origen: 'ia' };
    }
  } catch (err) {
    if (err.code === 'no_autorizado') throw err;
    console.warn('Análisis con IA no disponible, usando reglas locales:', err);
  }
  return modo === 'quickwins'
    ? { iniciativas: quickWinsLocales(modelo, analisis), origen: 'reglas' }
    : causaRaizLocal(modelo, analisis, problema);
}
