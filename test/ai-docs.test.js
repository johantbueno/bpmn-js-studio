import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarDocumentacionProceso } from '../src/ai-docs.js';

const nodo = (id, type, name, rol, doc) => ({ id, type, businessObject: { name, lanes: rol ? [{ name: rol }] : [], documentation: doc ? [{ text: doc }] : [] } });
const flujo = (id, a, b, name) => ({ id, type: 'bpmn:SequenceFlow', source: { id: a }, target: { id: b }, businessObject: { name } });
const modeler = { get: () => ({ getAll: () => [
  nodo('P', 'bpmn:Participant', 'Compras menores'),
  nodo('i', 'bpmn:StartEvent', 'Requisición recibida'),
  nodo('t1', 'bpmn:Task', 'Evaluar requisición', 'Analista', 'Verifica presupuesto disponible.'),
  nodo('g', 'bpmn:ExclusiveGateway', '¿Hay presupuesto?', 'Analista'),
  nodo('t2', 'bpmn:Task', 'Emitir orden de compra', 'Compras'),
  nodo('f', 'bpmn:EndEvent', 'Orden emitida'),
  flujo('a', 'i', 't1'), flujo('b', 't1', 'g'), flujo('c', 'g', 't2', 'Sí'), flujo('d', 'g', 'f', 'No'), flujo('e', 't2', 'f')
] }) };

test('la ficha técnica sale del diagrama y no menciona otros proyectos', () => {
  const md = generarDocumentacionProceso(modeler);
  assert.ok(md.includes('**Proceso:** Compras menores'));
  assert.ok(md.includes('Evaluar requisición'));
  assert.ok(md.includes('Analista'));
  assert.ok(md.includes('Verifica presupuesto disponible.'));
  assert.ok(md.includes('Sí → Emitir orden de compra'));
  assert.ok(md.includes('Requisición recibida'));
  assert.ok(!/Nelson|DGII|contribuyente/i.test(md), md);
});
