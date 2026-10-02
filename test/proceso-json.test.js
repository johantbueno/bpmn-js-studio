import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarProceso, procesoABpmnXml } from '../src/proceso-json.js';

function procesoLineal(n) {
  const pasos = [{ id: 'ini', tipo: 'inicio', nombre: 'Solicitud recibida', siguiente: [{ a: 't1' }] }];
  for (let i = 1; i <= n; i++) {
    pasos.push({
      id: `t${i}`, tipo: 'tarea', rol: i % 2 ? 'Analista' : 'Supervisor',
      nombre: `Revisar expediente número ${i} con todos sus anexos legales y fiscales completos`,
      descripcion: `Descripción completa del paso ${i}.`,
      siguiente: [{ a: i === n ? 'fin' : `t${i + 1}` }]
    });
  }
  pasos.push({ id: 'fin', tipo: 'fin', nombre: 'Proceso finalizado' });
  return { titulo: 'Proceso largo', pasos };
}

test('conserva 20 tareas sin truncar nombres ni agregar puntos suspensivos', () => {
  const xml = procesoABpmnXml(procesoLineal(20));
  assert.equal((xml.match(/<bpmn:task /g) || []).length, 20);
  assert.ok(xml.includes('Revisar expediente número 20 con todos sus anexos legales y fiscales completos'));
  assert.ok(!xml.includes('...'));
});

test('una compuerta con dos salidas genera exclusiveGateway y flujos con condición', () => {
  const xml = procesoABpmnXml({
    titulo: 'X',
    pasos: [
      { id: 'ini', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 'g' }] },
      { id: 'g', tipo: 'compuerta', nombre: '¿Califica?', siguiente: [{ a: 'ok', condicion: 'Sí' }, { a: 'no', condicion: 'No' }] },
      { id: 'ok', tipo: 'tarea', nombre: 'Emitir plástico', siguiente: [{ a: 'fin' }] },
      { id: 'no', tipo: 'tarea', nombre: 'Notificar rechazo', siguiente: [{ a: 'fin' }] },
      { id: 'fin', tipo: 'fin', nombre: 'Fin' }
    ]
  });
  assert.ok(xml.includes('<bpmn:exclusiveGateway id="g"'));
  assert.ok(xml.includes('name="Sí"'));
  assert.ok(xml.includes('name="No"'));
  assert.equal((xml.match(/<bpmn:sequenceFlow /g) || []).length, 5);
});

test('la descripción y el rol van en documentation y se escapan caracteres XML', () => {
  const p = procesoLineal(1);
  p.pasos[1].descripcion = 'Validar "RNC" & <anexos>';
  const xml = procesoABpmnXml(p);
  assert.ok(xml.includes('<bpmn:documentation>'));
  assert.ok(xml.includes('Validar &quot;RNC&quot; &amp; &lt;anexos&gt;'));
  assert.ok(xml.includes('Rol: Analista'));
});

test('validarProceso detecta referencias rotas, ids duplicados y nombres truncados', () => {
  const r = validarProceso({
    pasos: [
      { id: 'a', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 'zzz' }] },
      { id: 'a', tipo: 'tarea', nombre: 'Verificar datos del contri...' }
    ]
  });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some(e => e.includes('zzz')));
  assert.ok(r.errores.some(e => e.includes('duplicado')));
  assert.ok(r.errores.some(e => e.includes('truncado')));
});

test('validarProceso acepta un proceso correcto', () => {
  assert.deepEqual(validarProceso(procesoLineal(3)), { ok: true, errores: [] });
});

test('validarProceso detecta pasos inalcanzables desde el inicio', () => {
  const r = validarProceso({
    pasos: [
      { id: 'ini', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
      { id: 't1', tipo: 'tarea', nombre: 'Hacer algo', siguiente: [{ a: 'fin' }] },
      { id: 't2', tipo: 'tarea', nombre: 'Paso huérfano', siguiente: [{ a: 'fin' }] },
      { id: 'fin', tipo: 'fin', nombre: 'Fin' }
    ]
  });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some(e => e.includes('inalcanzable') && e.includes('t2')));
});

test('validarProceso exige que las tareas no-fin tengan salida', () => {
  const r = validarProceso({
    pasos: [
      { id: 'ini', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
      { id: 't1', tipo: 'tarea', nombre: 'Sin salida' },
      { id: 'fin', tipo: 'fin', nombre: 'Fin' }
    ]
  });
  assert.ok(r.errores.some(e => e.includes('sin salida') && e.includes('t1')));
});
