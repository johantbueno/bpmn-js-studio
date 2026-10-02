import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarBPMNConIA, procesoLocal } from '../src/ai-generator.js';

const procesoOk = {
  titulo: 'Demo',
  pasos: [
    { id: 'ini', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
    { id: 't1', tipo: 'tarea', nombre: 'Registrar solicitud completa en el sistema', siguiente: [{ a: 'fin' }] },
    { id: 'fin', tipo: 'fin', nombre: 'Fin' }
  ]
};
const respuesta = (cuerpo) => async () => ({ ok: true, json: async () => cuerpo });

test('procesoLocal conserva 20 pasos completos, sin recortar ni "..."', () => {
  const texto = Array.from({ length: 20 }, (_, i) =>
    `${i + 1}. Revisar el expediente numero ${i + 1} con todos sus anexos legales, fiscales y contables completos`).join('\n');
  const p = procesoLocal(texto);
  const tareas = p.pasos.filter(x => x.tipo === 'tarea');
  assert.equal(tareas.length, 20);
  assert.ok(tareas[19].nombre.includes('numero 20 con todos sus anexos legales, fiscales y contables completos'));
  assert.ok(!JSON.stringify(p).includes('...'));
});

test('usa el webhook y devuelve XML con diagrama (BPMNDiagram)', async () => {
  const xml = await generarBPMNConIA('algo', { fetchFn: respuesta({ ok: true, proceso: procesoOk }) });
  assert.ok(xml.includes('Registrar solicitud completa en el sistema'));
  assert.ok(xml.includes('bpmndi:BPMNDiagram'));
});

test('si el proceso es inválido reintenta una vez enviando los errores', async () => {
  const malo = { titulo: 'x', pasos: [{ id: 'ini', tipo: 'inicio', nombre: 'I', siguiente: [{ a: 'zzz' }] }] };
  const cuerpos = [];
  let n = 0;
  const fetchFn = async (_url, init) => {
    cuerpos.push(JSON.parse(init.body).texto);
    return { ok: true, json: async () => ({ ok: true, proceso: n++ === 0 ? malo : procesoOk }) };
  };
  const xml = await generarBPMNConIA('mi proceso', { fetchFn });
  assert.equal(n, 2);
  assert.ok(cuerpos[1].includes('zzz'));
  assert.ok(xml.includes('Registrar solicitud completa'));
});

test('si el webhook falla usa el motor local sin lanzar error', async () => {
  const fetchFn = async () => { throw new Error('red caída'); };
  const xml = await generarBPMNConIA('1. Recibir solicitud\n2. Aprobar solicitud', { fetchFn });
  assert.ok(xml.includes('Aprobar solicitud'));
});

test('texto vacío lanza error', async () => {
  await assert.rejects(() => generarBPMNConIA('   ', { fetchFn: respuesta({}) }), /vac/i);
});

test('envía el token de sesión al webhook', async () => {
  let cuerpo;
  const fetchFn = async (_u, init) => { cuerpo = JSON.parse(init.body); return { ok: true, json: async () => ({ ok: true, proceso: procesoOk }) }; };
  await generarBPMNConIA('algo', { fetchFn, token: 'TOK' });
  assert.equal(cuerpo.token, 'TOK');
});

test('sesión vencida (no_autorizado) se propaga y NO usa el motor local', async () => {
  const fetchFn = async () => ({ ok: true, json: async () => ({ ok: false, error: 'no_autorizado' }) });
  await assert.rejects(() => generarBPMNConIA('algo', { fetchFn, token: 'viejo' }), e => e.code === 'no_autorizado');
});
