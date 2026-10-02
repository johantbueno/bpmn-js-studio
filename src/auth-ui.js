/** Pantallas de acceso: login, cambio de clave y panel de usuarios (solo administrador). */
import { auth, generarClave } from './auth.js';

const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let avisar = () => {};
let alCambiarSesion = () => {};

/** Muestra el login hasta que haya una sesión válida y, si hace falta, obliga a cambiar la clave. */
export async function exigirSesion({ showToast, onSesion }) {
  avisar = showToast;
  alCambiarSesion = onSesion || (() => {});
  prepararEventos();

  await auth.restaurarSesion();
  if (!auth.sesion()) await pedirLogin();
  if (auth.sesion()?.debe_cambiar_clave) await pedirCambioClave(true);
  mostrarApp();
}

/** Para cuando el servidor rechaza el token (sesión vencida a mitad de trabajo). */
export async function reabrirLogin(mensaje) {
  auth.cerrarLocal();
  $('login-overlay').classList.add('open');
  $('login-error').textContent = mensaje || '';
  await pedirLogin();
  if (auth.sesion()?.debe_cambiar_clave) await pedirCambioClave(true);
  mostrarApp();
}

function mostrarApp() {
  $('login-overlay').classList.remove('open');
  const s = auth.sesion();
  $('user-name').textContent = s.nombre;
  $('btn-admin-users').hidden = s.rol !== 'admin';
  $('user-chip').hidden = false;
  alCambiarSesion(s);
}

function pedirLogin() {
  $('login-overlay').classList.add('open');
  $('login-usuario').focus();
  return new Promise(resolver => {
    const form = $('login-form');
    form.onsubmit = async e => {
      e.preventDefault();
      const boton = $('login-submit');
      boton.disabled = true;
      boton.textContent = 'Verificando…';
      const r = await auth.login($('login-usuario').value, $('login-clave').value);
      boton.disabled = false;
      boton.textContent = 'Iniciar sesión';
      if (!r.ok) {
        $('login-error').textContent = r.error;
        $('login-clave').value = '';
        $('login-clave').focus();
        return;
      }
      form.onsubmit = null;
      $('login-clave').value = '';
      $('login-error').textContent = '';
      resolver();
    };
  });
}

function pedirCambioClave(obligatorio) {
  const modal = $('modal-clave');
  modal.classList.add('open');
  $('clave-cerrar').hidden = obligatorio;
  $('clave-aviso').hidden = !obligatorio;
  $('clave-actual').focus();
  return new Promise(resolver => {
    $('clave-cerrar').onclick = () => { modal.classList.remove('open'); resolver(); };
    $('clave-form').onsubmit = async e => {
      e.preventDefault();
      const nueva = $('clave-nueva').value;
      const err = $('clave-error');
      if (nueva.length < 8) { err.textContent = 'La nueva clave debe tener al menos 8 caracteres.'; return; }
      if (nueva !== $('clave-repetir').value) { err.textContent = 'Las claves nuevas no coinciden.'; return; }
      const r = await auth.cambiarClave($('clave-actual').value, nueva);
      if (!r.ok) {
        err.textContent = r.error === 'sesion_invalida' ? 'Tu sesión venció.' : r.error;
        if (r.error === 'sesion_invalida') { modal.classList.remove('open'); await reabrirLogin(); resolver(); }
        return;
      }
      ['clave-actual', 'clave-nueva', 'clave-repetir'].forEach(id => { $(id).value = ''; });
      err.textContent = '';
      modal.classList.remove('open');
      avisar('Clave actualizada', 'success');
      resolver();
    };
  });
}

function prepararEventos() {
  if (prepararEventos.listo) return;
  prepararEventos.listo = true;

  $('btn-logout').addEventListener('click', async () => {
    await auth.logout();
    location.reload();
  });
  $('btn-change-pass').addEventListener('click', () => pedirCambioClave(false));
  $('btn-admin-users').addEventListener('click', abrirPanelAdmin);
  $('btn-close-admin').addEventListener('click', () => $('modal-admin').classList.remove('open'));
  $('admin-generar').addEventListener('click', () => { $('admin-clave').value = generarClave(); });
  $('admin-form').addEventListener('submit', crearUsuario);
  $('admin-copiar').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('admin-clave-mostrada').textContent); avisar('Clave copiada', 'success'); }
    catch { avisar('No se pudo copiar; selecciónala y cópiala a mano', 'warning'); }
  });
  $('admin-lista').addEventListener('click', accionFila);
}

// ---------- Panel de administración ----------

async function abrirPanelAdmin() {
  $('modal-admin').classList.add('open');
  $('admin-clave').value = generarClave();
  $('admin-resultado').hidden = true;
  await refrescarLista();
}

async function refrescarLista() {
  const r = await auth.admin('listar');
  if (!r.ok) {
    if (r.error === 'no_autorizado') { $('modal-admin').classList.remove('open'); await reabrirLogin('Tu sesión venció.'); return; }
    avisar(r.error, 'error');
    return;
  }
  $('admin-lista').innerHTML = r.usuarios.map(u => {
    const esAdmin = u.rol === 'admin';
    const estado = !u.activo ? '<span class="pill pill-off">Desactivado</span>'
      : u.bloqueado ? '<span class="pill pill-warn">Bloqueado</span>'
      : u.debe_cambiar_clave ? '<span class="pill pill-warn">Clave pendiente</span>'
      : '<span class="pill pill-ok">Activo</span>';
    const acciones = esAdmin ? '<em class="admin-hint">Administrador</em>' : `
      <button class="btn" data-accion="reset" data-id="${u.id}" data-nombre="${esc(u.nombre)}">Nueva clave</button>
      <button class="btn" data-accion="estado" data-id="${u.id}" data-activo="${u.activo}">${u.activo ? 'Desactivar' : 'Activar'}</button>
      <button class="btn btn-danger-outline" data-accion="eliminar" data-id="${u.id}" data-nombre="${esc(u.nombre)}">Eliminar</button>`;
    return `<tr><td>${esc(u.nombre)}</td><td><code>${esc(u.usuario)}</code></td><td>${estado}</td><td class="admin-acciones">${acciones}</td></tr>`;
  }).join('');
}

function mostrarClave(nombre, usuario, clave) {
  $('admin-resultado').hidden = false;
  $('admin-resultado-texto').textContent = `Clave temporal de ${nombre}${usuario ? ` (usuario: ${usuario})` : ''}. Entrégala por un canal seguro; no se vuelve a mostrar. Se le pedirá cambiarla al entrar.`;
  $('admin-clave-mostrada').textContent = clave;
}

async function crearUsuario(e) {
  e.preventDefault();
  const datos = { nombre: $('admin-nombre').value.trim(), usuario: $('admin-usuario').value.trim().toLowerCase(), clave: $('admin-clave').value };
  const r = await auth.admin('crear', datos);
  if (!r.ok) { avisar(r.error, 'error'); return; }
  mostrarClave(datos.nombre, datos.usuario, datos.clave);
  $('admin-nombre').value = '';
  $('admin-usuario').value = '';
  $('admin-clave').value = generarClave();
  avisar('Usuario creado', 'success');
  await refrescarLista();
}

async function accionFila(e) {
  const b = e.target.closest('button[data-accion]');
  if (!b) return;
  const { accion, id, nombre } = b.dataset;
  let r;
  if (accion === 'reset') {
    const clave = generarClave();
    r = await auth.admin('reset', { id, clave });
    if (r.ok) mostrarClave(nombre, '', clave);
  } else if (accion === 'estado') {
    r = await auth.admin('estado', { id, activo: b.dataset.activo === 'true' ? 'false' : 'true' });
  } else if (accion === 'eliminar') {
    if (!window.confirm(`¿Eliminar definitivamente a ${nombre}? Esta acción no se puede deshacer.`)) return;
    r = await auth.admin('eliminar', { id });
  }
  if (!r.ok) { avisar(r.error, 'error'); return; }
  await refrescarLista();
}
