// Crea (o elimina) un colega temporal para probar la interfaz sin tocar la cuenta del admin.
//   node test/sesion-temporal.mjs crear   -> imprime la sesión (JSON) para inyectarla en localStorage
//   node test/sesion-temporal.mjs borrar
import { readFileSync } from 'node:fs';
const BASE = 'https://n8n-inap.167.88.36.13.sslip.io/webhook';
const post = async (ruta, cuerpo) => (await fetch(`${BASE}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })).json();
const claveAdmin = readFileSync(new URL('../n8n/ADMIN_INICIAL.txt', import.meta.url), 'utf8').match(/Clave temporal: (\S+)/)[1];
const USUARIO = 'prueba.ui';

const admin = await post('bpmn-auth', { accion: 'login', usuario: 'nminoso', clave: claveAdmin });
const lista = await post('bpmn-usuarios', { token: admin.token, accion: 'listar' });
const existente = lista.usuarios.find(u => u.usuario === USUARIO);

if (process.argv[2] === 'borrar') {
  if (existente) await post('bpmn-usuarios', { token: admin.token, accion: 'eliminar', id: existente.id });
  console.log('borrado');
} else {
  if (existente) await post('bpmn-usuarios', { token: admin.token, accion: 'eliminar', id: existente.id });
  const inicial = 'Temp' + Math.random().toString(36).slice(2, 10) + '1';
  const final = 'Final' + Math.random().toString(36).slice(2, 10) + '9';
  await post('bpmn-usuarios', { token: admin.token, accion: 'crear', usuario: USUARIO, nombre: 'Colega de Prueba', clave: inicial });
  const c = await post('bpmn-auth', { accion: 'login', usuario: USUARIO, clave: inicial });
  await post('bpmn-auth', { accion: 'cambiar_clave', token: c.token, clave: inicial, nueva: final });
  console.log(JSON.stringify({ token: c.token, usuario: c.usuario, nombre: c.nombre, rol: c.rol, debe_cambiar_clave: false }));
}
await post('bpmn-auth', { accion: 'logout', token: admin.token });
