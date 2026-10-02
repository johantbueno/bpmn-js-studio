import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cuadrante, quickWinsLocales, causaRaizLocal, analizarConIA } from '../src/analisis-ia.js';
import { analizarProceso } from '../src/modelo-proceso.js';

const pasos = [
  { id: 'i', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
  { id: 't1', tipo: 'tarea', tipoTarea: 'generica', nombre: 'Registrar solicitud', rol: 'Oficial', siguiente: [{ a: 't2' }] },
  { id: 't2', tipo: 'tarea', tipoTarea: 'generica', nombre: 'Notificar al contribuyente', rol: '', siguiente: [{ a: 'f' }] },
  { id: 'f', tipo: 'fin', nombre: 'Fin' }
];
const modelo = { titulo: 'Devolución de ITBIS', pasos };
const analisis = analizarProceso(pasos);

test('cuadrante clasifica impacto/esfuerzo', () => {
  assert.equal(cuadrante('Alto', 'Bajo'), 'quick-win');
  assert.equal(cuadrante('Alto', 'Alto'), 'estrategico');
  assert.equal(cuadrante('Bajo', 'Bajo'), 'menor');
  assert.equal(cuadrante('Bajo', 'Alto'), 'descartar');
  assert.equal(cuadrante('alto', 'bajo'), 'quick-win');
});

test('quickWinsLocales sale del diagrama y no menciona otros proyectos', () => {
  const q = quickWinsLocales(modelo, analisis);
  assert.ok(q.length >= 2);
  assert.ok(q.some(i => i.titulo.toLowerCase().includes('automatizar') && i.cuadrante === 'quick-win'));
  assert.ok(q.every(i => i.cuadrante && i.titulo && i.descripcion));
  assert.ok(!JSON.stringify(q).includes('Nelson'));
});

test('causaRaizLocal produce las 6 categorías y 5 porqués sobre el proceso', () => {
  const c = causaRaizLocal(modelo, analisis, '');
  assert.equal(c.categorias.length, 6);
  assert.ok(c.categorias.every(x => x.causas.length >= 1));
  assert.equal(c.cincoPorques.length, 5);
  assert.ok(c.problema.includes('Devolución de ITBIS'));
  assert.ok(!JSON.stringify(c).includes('Nelson'));
});

test('causaRaizLocal respeta el problema focal escrito por el usuario', () => {
  assert.equal(causaRaizLocal(modelo, analisis, 'Se pierden expedientes').problema, 'Se pierden expedientes');
});

test('analizarConIA devuelve la respuesta de la IA validada y marca origen ia', async () => {
  let cuerpo;
  const fetchFn = async (_u, init) => {
    cuerpo = JSON.parse(init.body);
    return { ok: true, json: async () => ({ ok: true, proceso: undefined, resultado: { iniciativas: [
      { titulo: 'Automatizar notificaciones', descripcion: 'x', impacto: 'alto', esfuerzo: 'Bajo', pasos: ['t2'] }
    ] } }) };
  };
  const r = await analizarConIA('quickwins', modelo, analisis, { fetchFn, token: 'TOK' });
  assert.equal(r.origen, 'ia');
  assert.equal(r.iniciativas[0].cuadrante, 'quick-win');
  assert.equal(cuerpo.modo, 'quickwins');
  assert.equal(cuerpo.token, 'TOK');
  const resumen = JSON.parse(cuerpo.texto);
  assert.equal(resumen.titulo, 'Devolución de ITBIS');
  assert.equal(resumen.pasos.length, 4);
});

test('si la IA falla o responde mal usa reglas locales', async () => {
  const caida = async () => { throw new Error('x'); };
  const r1 = await analizarConIA('quickwins', modelo, analisis, { fetchFn: caida });
  assert.equal(r1.origen, 'reglas');
  assert.ok(r1.iniciativas.length >= 2);

  const mala = async () => ({ ok: true, json: async () => ({ ok: true, resultado: { cualquier: 'cosa' } }) });
  const r2 = await analizarConIA('causaraiz', modelo, analisis, { fetchFn: mala });
  assert.equal(r2.origen, 'reglas');
  assert.equal(r2.categorias.length, 6);
});

test('sesión vencida se propaga', async () => {
  const fetchFn = async () => ({ ok: true, json: async () => ({ ok: false, error: 'no_autorizado' }) });
  await assert.rejects(() => analizarConIA('quickwins', modelo, analisis, { fetchFn }), e => e.code === 'no_autorizado');
});

test('causaraiz de la IA: normaliza categorías y exige al menos 3 porqués', async () => {
  const fetchFn = async () => ({ ok: true, json: async () => ({ ok: true, resultado: {
    problema: 'Demoras', categorias: [{ nombre: 'Personas', causas: ['a'] }, { nombre: 'Tecnología', causas: ['b', 'c'] }],
    cincoPorques: [{ nivel: 1, pregunta: 'p1', respuesta: 'r1' }, { nivel: 2, pregunta: 'p2', respuesta: 'r2' }, { nivel: 3, pregunta: 'p3', respuesta: 'r3' }]
  } }) });
  const r = await analizarConIA('causaraiz', modelo, analisis, { fetchFn });
  assert.equal(r.origen, 'ia');
  assert.equal(r.categorias[0].icono, '👥');
  assert.equal(r.cincoPorques.length, 3);
});

test('limpia ids internos de los textos de la IA (t2, t1→t2)', async () => {
  const fetchFn = async () => ({ ok: true, json: async () => ({ ok: true, resultado: {
    problema: 'Demoras',
    categorias: [{ nombre: 'Procesos', causas: ['Tareas manuales (t1→t2, t2) sin automatizar', 'Revisión en t2 y t1 lenta'] }],
    cincoPorques: [
      { nivel: 1, pregunta: '¿Por qué?', respuesta: 'Por registrar la solicitud (t2) a mano' },
      { nivel: 2, pregunta: '¿Y?', respuesta: 'Porque sí' },
      { nivel: 3, pregunta: '¿Y luego?', respuesta: 'Causa raíz: falta integración' }
    ]
  } }) });
  const r = await analizarConIA('causaraiz', modelo, analisis, { fetchFn });
  const texto = JSON.stringify(r);
  assert.ok(!/\bt[12]\b/.test(texto), texto);
  assert.ok(r.categorias[0].causas[0].startsWith('Tareas manuales'));
  assert.equal(r.cincoPorques[0].respuesta, 'Por registrar la solicitud a mano');
});

test('limpia también ids de bpmn-js (Task_X, cadenas con → y /)', async () => {
  const modelo2 = { titulo: 'X', pasos: [
    { id: 'Task_Ingresar', tipo: 'tarea', nombre: 'A', siguiente: [] }, { id: 'Task_Validar', tipo: 'tarea', nombre: 'B', siguiente: [] },
    { id: 'Task_Notificar', tipo: 'tarea', nombre: 'C', siguiente: [] }
  ] };
  const fetchFn = async () => ({ ok: true, json: async () => ({ ok: true, resultado: {
    problema: 'Demoras',
    categorias: [{ nombre: 'Procesos', causas: ['Secuencia lineal con 3 hand-offs (Task_Ingresar → → Task_Validar/Task_Notificar) que genera esperas'] }],
    cincoPorques: [{ nivel: 1, pregunta: 'p', respuesta: 'Por la tarea Task_Validar lenta' }, { nivel: 2, pregunta: 'p', respuesta: 'r' }, { nivel: 3, pregunta: 'p', respuesta: 'r' }]
  } }) });
  const r = await analizarConIA('causaraiz', modelo2, analizarProceso(modelo2.pasos), { fetchFn });
  assert.equal(r.categorias[0].causas[0], 'Secuencia lineal con 3 hand-offs que genera esperas');
  assert.ok(!r.cincoPorques[0].respuesta.includes('Task_'));
});
