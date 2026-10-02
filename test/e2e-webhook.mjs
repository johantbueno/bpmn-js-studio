// Prueba manual de extremo a extremo contra el webhook real: node test/e2e-webhook.mjs
import { validarProceso } from '../src/proceso-json.js';
const URL = 'https://n8n-inap.167.88.36.13.sslip.io/webhook/bpmn-generar-proceso';
const pasos = [
  'El contribuyente presenta la solicitud de devolución de ITBIS en la ventanilla de servicio',
  'El oficial de servicio recibe y registra la solicitud en el sistema',
  'El oficial verifica que los documentos estén completos',
  'Si faltan documentos, se devuelve la solicitud al contribuyente; si están completos continúa',
  'El sistema asigna un número de expediente',
  'El analista de recaudación revisa las declaraciones juradas del período',
  'El analista valida las facturas con el reporte 606',
  'El analista calcula el monto a devolver',
  'El fiscalizador revisa inconsistencias en los comprobantes fiscales',
  'Si hay inconsistencias graves, se abre una auditoría; si no, continúa',
  'El supervisor revisa el informe del analista',
  'El supervisor aprueba o rechaza la devolución',
  'El director de recaudación firma la resolución',
  'El oficial notifica la resolución al contribuyente',
  'El contribuyente puede presentar recurso de reconsideración',
  'Finanzas programa el pago de la devolución',
  'Finanzas emite la transferencia bancaria',
  'TI actualiza el estado de la cuenta del contribuyente',
  'El oficial genera el informe mensual de devoluciones',
  'Se archiva el expediente'
];
const texto = pasos.map((p, i) => `${i + 1}. ${p}.`).join('\n');
const t0 = Date.now();
const r = await (await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }) })).json();
console.log('ok:', r.ok, '| proveedor:', r.proveedor_usado, r.modelo_usado, '|', ((Date.now() - t0) / 1000).toFixed(1) + 's', r.error || '');
if (r.proceso) {
  const tareas = r.proceso.pasos.filter(p => p.tipo === 'tarea').length;
  const compuertas = r.proceso.pasos.filter(p => p.tipo.startsWith('compuerta')).length;
  console.log(`tareas=${tareas} compuertas=${compuertas} total=${r.proceso.pasos.length}`);
  console.log(JSON.stringify(validarProceso(r.proceso)));
  r.proceso.pasos.forEach(p => console.log(p.tipo.padEnd(18), p.id.padEnd(5), '|', p.nombre, '->', (p.siguiente || []).map(s => s.a + (s.condicion ? `[${s.condicion}]` : '')).join(',')));
}
