import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAuth, generarClave } from '../src/auth.js';

function memoria() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
}
function servidor(respuestas) {
  const llamadas = [];
  const fetchFn = async (url, init) => {
    const cuerpo = JSON.parse(init.body);
    llamadas.push({ ruta: url.split('/').pop(), cuerpo });
    const r = respuestas[cuerpo.accion];
    return { ok: true, json: async () => (typeof r === 'function' ? r(cuerpo) : r) };
  };
  return { fetchFn, llamadas };
}

test('login correcto guarda la sesión y devuelve el usuario', async () => {
  const s = servidor({ login: { ok: true, token: 'T1', usuario: 'nminoso', nombre: 'Nelson Miñoso', rol: 'admin', debe_cambiar_clave: false } });
  const auth = crearAuth({ fetchFn: s.fetchFn, storage: memoria() });
  const r = await auth.login(' NMinoso ', 'secreta123');
  assert.equal(r.ok, true);
  assert.equal(auth.sesion().nombre, 'Nelson Miñoso');
  assert.equal(auth.token(), 'T1');
  assert.equal(s.llamadas[0].ruta, 'bpmn-auth');
  assert.equal(s.llamadas[0].cuerpo.usuario, 'nminoso');
});

test('login fallido no guarda sesión y devuelve el mensaje', async () => {
  const s = servidor({ login: { ok: false, error: 'Usuario o clave incorrectos.' } });
  const auth = crearAuth({ fetchFn: s.fetchFn, storage: memoria() });
  const r = await auth.login('x', 'y');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'Usuario o clave incorrectos.');
  assert.equal(auth.sesion(), null);
});

test('un fallo de red se informa sin lanzar excepción', async () => {
  const auth = crearAuth({ fetchFn: async () => { throw new Error('x'); }, storage: memoria() });
  const r = await auth.login('a', 'b');
  assert.equal(r.ok, false);
  assert.match(r.error, /conexi/i);
});

test('restaurarSesion valida el token guardado en el servidor', async () => {
  const storage = memoria();
  storage.setItem('bpmn_sesion', JSON.stringify({ token: 'T1', usuario: 'ana', nombre: 'Ana', rol: 'usuario' }));
  const s = servidor({ sesion: { ok: true, usuario: 'ana', nombre: 'Ana', rol: 'usuario', debe_cambiar_clave: false } });
  const auth = crearAuth({ fetchFn: s.fetchFn, storage });
  assert.equal((await auth.restaurarSesion()).ok, true);
  assert.equal(s.llamadas[0].cuerpo.token, 'T1');
});

test('restaurarSesion borra la sesión si el servidor la rechaza', async () => {
  const storage = memoria();
  storage.setItem('bpmn_sesion', JSON.stringify({ token: 'viejo', usuario: 'ana', nombre: 'Ana', rol: 'usuario' }));
  const auth = crearAuth({ fetchFn: servidor({ sesion: { ok: false, error: 'sesion_invalida' } }).fetchFn, storage });
  assert.equal((await auth.restaurarSesion()).ok, false);
  assert.equal(auth.sesion(), null);
  assert.equal(storage.getItem('bpmn_sesion'), null);
});

test('restaurarSesion sin sesión guardada no llama al servidor', async () => {
  const s = servidor({});
  const auth = crearAuth({ fetchFn: s.fetchFn, storage: memoria() });
  assert.equal((await auth.restaurarSesion()).ok, false);
  assert.equal(s.llamadas.length, 0);
});

test('admin: las acciones de usuarios envían el token y la acción', async () => {
  const s = servidor({ listar: { ok: true, usuarios: [] }, crear: { ok: true } });
  const storage = memoria();
  storage.setItem('bpmn_sesion', JSON.stringify({ token: 'TA', usuario: 'nminoso', nombre: 'N', rol: 'admin' }));
  const auth = crearAuth({ fetchFn: s.fetchFn, storage });
  await auth.admin('listar');
  await auth.admin('crear', { usuario: 'ana', nombre: 'Ana', clave: 'Abcdefgh1' });
  assert.deepEqual(s.llamadas.map(l => [l.ruta, l.cuerpo.accion, l.cuerpo.token]), [
    ['bpmn-usuarios', 'listar', 'TA'], ['bpmn-usuarios', 'crear', 'TA']
  ]);
  assert.equal(s.llamadas[1].cuerpo.usuario, 'ana');
});

test('si el servidor responde no_autorizado se cierra la sesión local', async () => {
  const storage = memoria();
  storage.setItem('bpmn_sesion', JSON.stringify({ token: 'TA', usuario: 'a', nombre: 'A', rol: 'admin' }));
  const auth = crearAuth({ fetchFn: servidor({ listar: { ok: false, error: 'no_autorizado' } }).fetchFn, storage });
  await auth.admin('listar');
  assert.equal(auth.sesion(), null);
});

test('logout avisa al servidor y limpia la sesión', async () => {
  const s = servidor({ logout: { ok: true } });
  const storage = memoria();
  storage.setItem('bpmn_sesion', JSON.stringify({ token: 'TA', usuario: 'a', nombre: 'A', rol: 'usuario' }));
  const auth = crearAuth({ fetchFn: s.fetchFn, storage });
  await auth.logout();
  assert.equal(s.llamadas[0].cuerpo.token, 'TA');
  assert.equal(auth.sesion(), null);
});

test('generarClave produce 12 caracteres sin ambiguos y distintos en cada llamada', () => {
  const a = generarClave(), b = generarClave();
  assert.equal(a.length, 12);
  assert.match(a, /^[abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  assert.notEqual(a, b);
});
