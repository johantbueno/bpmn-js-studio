// Prueba manual de extremo a extremo de Quick Wins y Causa Raíz con IA: node test/e2e-analisis.mjs
import { readFileSync } from 'node:fs';
import { analizarProceso } from '../src/modelo-proceso.js';
import { analizarConIA } from '../src/analisis-ia.js';

const BASE = 'https://n8n-inap.167.88.36.13.sslip.io/webhook';
const post = async (ruta, cuerpo) => (await fetch(`${BASE}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })).json();
const clave = readFileSync(new URL('../n8n/ADMIN_INICIAL.txt', import.meta.url), 'utf8').match(/Clave temporal: (\S+)/)[1];
const sesion = await post('bpmn-auth', { accion: 'login', usuario: 'nminoso', clave });

const t = (id, nombre, rol, sig, tipoTarea = 'generica') => ({ id, tipo: 'tarea', tipoTarea, nombre, rol, siguiente: sig.map(a => ({ a })) });
const pasos = [
  { id: 'ini', tipo: 'inicio', nombre: 'Solicitud recibida', siguiente: [{ a: 't1' }] },
  t('t1', 'Presentar solicitud de devolución de ITBIS', 'Contribuyente', ['t2']),
  t('t2', 'Registrar solicitud en el sistema', 'Oficial de servicio', ['t3']),
  t('t3', 'Verificar documentos completos', 'Oficial de servicio', ['g1']),
  { id: 'g1', tipo: 'compuerta', nombre: '¿Documentos completos?', rol: 'Oficial de servicio', siguiente: [{ a: 't4', condicion: 'Sí' }, { a: 'fin1', condicion: 'No' }] },
  t('t4', 'Revisar declaraciones juradas', 'Analista de recaudación', ['t5']),
  t('t5', 'Calcular monto a devolver', 'Analista de recaudación', ['t6']),
  t('t6', 'Aprobar devolución', 'Supervisor', ['t7']),
  t('t7', 'Firmar resolución', 'Director', ['t8']),
  t('t8', 'Notificar resolución al contribuyente', 'Oficial de servicio', ['t9']),
  t('t9', 'Archivar expediente', 'Oficial de servicio', ['fin2']),
  { id: 'fin1', tipo: 'fin', nombre: 'Solicitud devuelta' },
  { id: 'fin2', tipo: 'fin', nombre: 'Devolución concluida' }
];
const modelo = { titulo: 'Devolución de ITBIS', pasos };
const analisis = analizarProceso(pasos);

for (const modo of ['quickwins', 'causaraiz']) {
  const t0 = Date.now();
  const r = await analizarConIA(modo, modelo, analisis, { token: sesion.token });
  console.log(`\n== ${modo} | origen=${r.origen} | ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (modo === 'quickwins') r.iniciativas.forEach(i => console.log(`  [${i.cuadrante}] ${i.titulo} -> ${i.descripcion}`));
  else {
    console.log('  problema:', r.problema);
    r.categorias.forEach(c => console.log(`  ${c.icono} ${c.nombre}: ${c.causas.join(' | ')}`));
    r.cincoPorques.forEach(p => console.log(`  ${p.nivel}. ${p.pregunta} -> ${p.respuesta}`));
  }
}
await post('bpmn-auth', { accion: 'logout', token: sesion.token });
