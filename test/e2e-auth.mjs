// Prueba manual de extremo a extremo del login: node test/e2e-auth.mjs
// Lee la clave temporal del admin desde n8n/ADMIN_INICIAL.txt (no se imprime).
import { readFileSync } from 'node:fs';
const BASE = 'https://n8n-inap.167.88.36.13.sslip.io/webhook';
const post = async (ruta, cuerpo) => (await fetch(`${BASE}/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })).json();
const claveAdmin = readFileSync(new URL('../n8n/ADMIN_INICIAL.txt', import.meta.url), 'utf8').match(/Clave temporal: (\S+)/)[1];

let fallos = 0;
const chequear = (nombre, cond, extra = '') => { console.log(cond ? '✔' : '✖', nombre, cond ? '' : extra); if (!cond) fallos++; };

const mala = await post('bpmn-auth', { accion: 'login', usuario: 'nminoso', clave: 'incorrecta123' });
chequear('clave incorrecta rechazada', mala.ok === false && /incorrectos/.test(mala.error), JSON.stringify(mala));
const noExiste = await post('bpmn-auth', { accion: 'login', usuario: 'fantasma', clave: 'xxxxxxxx' });
chequear('usuario inexistente da el mismo mensaje', noExiste.error === mala.error, JSON.stringify(noExiste));

const admin = await post('bpmn-auth', { accion: 'login', usuario: 'nminoso', clave: claveAdmin });
chequear('admin entra y debe cambiar clave', admin.ok && admin.rol === 'admin' && admin.debe_cambiar_clave === true, JSON.stringify({ ...admin, token: '' }));
const T = admin.token;

chequear('sesión válida', (await post('bpmn-auth', { accion: 'sesion', token: T })).ok === true);
chequear('sesión con token falso rechazada', (await post('bpmn-auth', { accion: 'sesion', token: 'abc' })).ok === false);

const u = 'prueba.tmp';
await post('bpmn-usuarios', { token: T, accion: 'eliminar', id: 0 });
chequear('crear colega con clave corta falla', (await post('bpmn-usuarios', { token: T, accion: 'crear', usuario: u, nombre: 'Prueba', clave: 'corta' })).ok === false);
chequear('crear colega', (await post('bpmn-usuarios', { token: T, accion: 'crear', usuario: u, nombre: 'Colega de Prueba', clave: 'ClaveTemporal1' })).ok === true);
chequear('no permite duplicados', (await post('bpmn-usuarios', { token: T, accion: 'crear', usuario: u, nombre: 'X', clave: 'ClaveTemporal1' })).ok === false);

const lista = await post('bpmn-usuarios', { token: T, accion: 'listar' });
const colega = lista.usuarios?.find(x => x.usuario === u);
chequear('listar muestra al colega sin exponer claves', !!colega && !JSON.stringify(lista).includes('clave_hash'));

const c = await post('bpmn-auth', { accion: 'login', usuario: u, clave: 'ClaveTemporal1' });
chequear('colega entra con rol usuario', c.ok && c.rol === 'usuario' && c.debe_cambiar_clave === true);
chequear('colega NO puede administrar', (await post('bpmn-usuarios', { token: c.token, accion: 'listar' })).error === 'no_autorizado');
chequear('sin token NO puede administrar', (await post('bpmn-usuarios', { accion: 'listar' })).error === 'no_autorizado');

chequear('cambio de clave exige la actual', (await post('bpmn-auth', { accion: 'cambiar_clave', token: c.token, clave: 'mala', nueva: 'NuevaClave123' })).ok === false);
chequear('colega cambia su clave', (await post('bpmn-auth', { accion: 'cambiar_clave', token: c.token, clave: 'ClaveTemporal1', nueva: 'NuevaClave123' })).ok === true);
chequear('clave nueva funciona', (await post('bpmn-auth', { accion: 'login', usuario: u, clave: 'NuevaClave123' })).ok === true);

chequear('admin resetea la clave del colega', (await post('bpmn-usuarios', { token: T, accion: 'reset', id: colega.id, clave: 'Reset12345' })).ok === true);
chequear('clave vieja ya no entra', (await post('bpmn-auth', { accion: 'login', usuario: u, clave: 'NuevaClave123' })).ok === false);
const c2 = await post('bpmn-auth', { accion: 'login', usuario: u, clave: 'Reset12345' });
chequear('clave reseteada entra', c2.ok === true);

const sinToken = await post('bpmn-generar-proceso', { texto: '1. Recibir solicitud' });
chequear('IA sin sesión rechazada', sinToken.error === 'no_autorizado', JSON.stringify(sinToken));
const conToken = await post('bpmn-generar-proceso', { token: c2.token, texto: '1. Recibir solicitud. 2. Aprobar solicitud. 3. Archivar expediente.' });
chequear('IA con sesión de colega responde', conToken.ok === true && conToken.proceso?.pasos?.length >= 3, JSON.stringify(conToken).slice(0, 200));

chequear('admin desactiva al colega', (await post('bpmn-usuarios', { token: T, accion: 'estado', id: colega.id, activo: 'false' })).ok === true);
chequear('desactivado no entra', /desactivada/.test((await post('bpmn-auth', { accion: 'login', usuario: u, clave: 'Reset12345' })).error || ''));
chequear('token del desactivado deja de servir', (await post('bpmn-auth', { accion: 'sesion', token: c2.token })).ok === false);
chequear('admin no puede desactivarse a sí mismo', (await post('bpmn-usuarios', { token: T, accion: 'estado', id: lista.usuarios.find(x => x.usuario === 'nminoso').id, activo: 'false' })).ok === false);

chequear('admin elimina al colega', (await post('bpmn-usuarios', { token: T, accion: 'eliminar', id: colega.id })).ok === true);
chequear('logout cierra la sesión', (await post('bpmn-auth', { accion: 'logout', token: T })).ok === true && (await post('bpmn-auth', { accion: 'sesion', token: T })).ok === false);

console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo correcto');
process.exit(fallos ? 1 : 0);
