import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeloDesdeElementos, analizarProceso, generarRACI } from '../src/modelo-proceso.js';

// ---- helpers para simular el elementRegistry de bpmn-js ----
const nodo = (id, type, name, { rol, doc } = {}) => ({
  id, type,
  businessObject: { name, lanes: rol ? [{ name: rol }] : [], documentation: doc ? [{ text: doc }] : [] }
});
const flujo = (id, a, b, name) => ({ id, type: 'bpmn:SequenceFlow', source: { id: a }, target: { id: b }, businessObject: { name } });

function elementosEjemplo() {
  return [
    nodo('P1', 'bpmn:Participant', 'Devolución de ITBIS'),
    nodo('L1', 'bpmn:Lane', 'Contribuyente'),
    nodo('ini', 'bpmn:StartEvent', 'Solicitud recibida', { rol: 'Contribuyente' }),
    nodo('t1', 'bpmn:UserTask', 'Presentar solicitud', { rol: 'Contribuyente' }),
    nodo('t2', 'bpmn:Task', 'Registrar solicitud en el sistema', { rol: 'Oficial' }),
    nodo('g1', 'bpmn:ExclusiveGateway', '¿Documentos completos?', { rol: 'Oficial' }),
    nodo('t3', 'bpmn:Task', 'Aprobar devolución', { doc: 'Rol: Supervisor\nRevisión final.' }),
    nodo('t4', 'bpmn:ServiceTask', 'Notificar resultado', { rol: 'Oficial' }),
    nodo('fin', 'bpmn:EndEvent', 'Fin', { rol: 'Oficial' }),
    flujo('f1', 'ini', 't1'), flujo('f2', 't1', 't2'), flujo('f3', 't2', 'g1'),
    flujo('f4', 'g1', 't3', 'Sí'), flujo('f5', 'g1', 't1', 'No'),
    flujo('f6', 't3', 't4'), flujo('f7', 't4', 'fin'),
    { id: 'lbl', type: 'label', businessObject: {} },
    { id: 'mf', type: 'bpmn:MessageFlow', source: { id: 't1' }, target: { id: 't2' }, businessObject: {} }
  ];
}

test('modeloDesdeElementos normaliza tipos, roles (carril o documentación) y flujos', () => {
  const m = modeloDesdeElementos(elementosEjemplo());
  assert.equal(m.titulo, 'Devolución de ITBIS');
  const porId = Object.fromEntries(m.pasos.map(p => [p.id, p]));
  assert.equal(m.pasos.length, 7);
  assert.equal(porId.ini.tipo, 'inicio');
  assert.equal(porId.t1.tipo, 'tarea');
  assert.equal(porId.t1.tipoTarea, 'usuario');
  assert.equal(porId.t4.tipoTarea, 'servicio');
  assert.equal(porId.g1.tipo, 'compuerta');
  assert.equal(porId.t2.rol, 'Oficial');
  assert.equal(porId.t3.rol, 'Supervisor');
  assert.deepEqual(porId.g1.siguiente, [{ a: 't3', condicion: 'Sí' }, { a: 't1', condicion: 'No' }]);
});

test('ignora flujos de mensaje, etiquetas y contenedores', () => {
  const m = modeloDesdeElementos(elementosEjemplo());
  assert.ok(!m.pasos.some(p => ['P1', 'L1', 'lbl', 'mf'].includes(p.id)));
  assert.deepEqual(m.pasos.find(p => p.id === 't1').siguiente, [{ a: 't2' }]);
});

test('analizarProceso calcula métricas del diagrama', () => {
  const a = analizarProceso(modeloDesdeElementos(elementosEjemplo()).pasos);
  assert.equal(a.tareas, 4);
  assert.equal(a.compuertas, 1);
  assert.equal(a.inicios, 1);
  assert.equal(a.fines, 1);
  assert.deepEqual(a.roles, { Contribuyente: 1, Oficial: 2, Supervisor: 1 });
  assert.equal(a.sinRol, 0);
  assert.equal(a.complejidad, 2); // 1 + (2 salidas - 1)
  assert.equal(a.traspasos, 4);   // Contrib->Oficial, Oficial->Supervisor, Oficial->Contrib (rechazo), Supervisor->Oficial
  assert.equal(a.automatizadas, 1);
  assert.equal(a.caminoMasLargo, 4); // t1,t2,t3,t4 (el retorno t1 no se cuenta dos veces)
});

test('caminoMasLargo no se cuelga con ciclos', () => {
  const pasos = [
    { id: 'a', tipo: 'inicio', nombre: 'I', siguiente: [{ a: 'b' }] },
    { id: 'b', tipo: 'tarea', nombre: 'B', siguiente: [{ a: 'c' }] },
    { id: 'c', tipo: 'compuerta', nombre: '¿?', siguiente: [{ a: 'b' }, { a: 'f' }] },
    { id: 'f', tipo: 'fin', nombre: 'F' }
  ];
  assert.equal(analizarProceso(pasos).caminoMasLargo, 1);
});

test('hallazgos: sin roles, manuales automatizables y decisión sin condiciones', () => {
  const pasos = [
    { id: 'i', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
    { id: 't1', tipo: 'tarea', tipoTarea: 'generica', nombre: 'Enviar correo al contribuyente', rol: '', siguiente: [{ a: 'g' }] },
    { id: 'g', tipo: 'compuerta', nombre: '¿Procede?', siguiente: [{ a: 't2' }, { a: 'f' }] },
    { id: 't2', tipo: 'tarea', tipoTarea: 'generica', nombre: 'Archivar expediente', rol: '', siguiente: [{ a: 'f' }] },
    { id: 'f', tipo: 'fin', nombre: 'Fin' }
  ];
  const ids = analizarProceso(pasos).hallazgos.map(h => h.id);
  assert.ok(ids.includes('sin_roles'));
  assert.ok(ids.includes('manuales_automatizables'));
  assert.ok(ids.includes('decision_sin_condicion'));
  const h = analizarProceso(pasos).hallazgos.find(x => x.id === 'manuales_automatizables');
  assert.deepEqual(h.pasos.sort(), ['t1', 't2']);
});

test('hallazgos: traspasos altos y concentración en un rol', () => {
  const pasos = [{ id: 'i', tipo: 'inicio', nombre: 'I', siguiente: [{ a: 't1' }] }];
  for (let k = 1; k <= 8; k++) {
    pasos.push({ id: `t${k}`, tipo: 'tarea', tipoTarea: 'usuario', nombre: `Paso ${k}`, rol: k % 2 ? 'Área A' : 'Área B',
      siguiente: [{ a: k === 8 ? 'f' : `t${k + 1}` }] });
  }
  pasos.push({ id: 'f', tipo: 'fin', nombre: 'F' });
  const ids = analizarProceso(pasos).hallazgos.map(h => h.id);
  assert.ok(ids.includes('traspasos_altos'));
  assert.ok(ids.includes('camino_sin_paralelismo'));
});

test('generarRACI deriva roles del propio diagrama (sin roles fijos de la DGII)', () => {
  const raci = generarRACI(modeloDesdeElementos(elementosEjemplo()).pasos);
  const nombres = raci.roles.map(r => r.nombre);
  assert.deepEqual(nombres.sort(), ['Contribuyente', 'Dueño del proceso', 'Oficial', 'Supervisor']);
  assert.ok(!JSON.stringify(raci).includes('Nelson'));
  const fila = raci.matriz.find(m => m.id === 't2'); // Registrar solicitud: R=Oficial
  assert.equal(fila.asignaciones.Oficial, 'R');
  assert.equal(fila.asignaciones['Dueño del proceso'], 'A');
  assert.equal(fila.asignaciones.Contribuyente, 'C'); // viene de t1 (otro rol)
  assert.equal(fila.asignaciones.Supervisor, '-');
});

test('generarRACI sin roles definidos usa una columna "Sin rol asignado"', () => {
  const raci = generarRACI([
    { id: 'i', tipo: 'inicio', nombre: 'I', siguiente: [{ a: 't1' }] },
    { id: 't1', tipo: 'tarea', nombre: 'Hacer algo', rol: '', siguiente: [{ a: 'f' }] },
    { id: 'f', tipo: 'fin', nombre: 'F' }
  ]);
  assert.ok(raci.roles.some(r => r.nombre === 'Sin rol asignado'));
  assert.equal(raci.matriz[0].asignaciones['Sin rol asignado'], 'R');
});

test('el título usa el nombre del proceso si no hay pool (participante)', () => {
  const m = modeloDesdeElementos([nodo('Process_1', 'bpmn:Process', 'Devolución de ITBIS'), nodo('t', 'bpmn:Task', 'Hacer')]);
  assert.equal(m.titulo, 'Devolución de ITBIS');
});
