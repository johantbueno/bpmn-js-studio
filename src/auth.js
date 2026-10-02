/**
 * Autenticación de BPMN Studio. La validación real vive en n8n + Postgres
 * (webhooks bpmn-auth y bpmn-usuarios): contraseñas con bcrypt, token de sesión de 12 h,
 * bloqueo de 15 min tras 5 intentos fallidos. Aquí solo se guarda el token y se llama a la API.
 */

const BASE = import.meta.env?.VITE_N8N_BASE || 'https://n8n-inap.167.88.36.13.sslip.io/webhook';
const CLAVE_STORAGE = 'bpmn_sesion';
const ERROR_RED = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';

export function crearAuth({ fetchFn = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  let actual = leer();

  function leer() {
    try { return JSON.parse(storage.getItem(CLAVE_STORAGE)); } catch { return null; }
  }
  function guardar(sesion) {
    actual = sesion;
    try { sesion ? storage.setItem(CLAVE_STORAGE, JSON.stringify(sesion)) : storage.removeItem(CLAVE_STORAGE); } catch { /* sin storage */ }
  }
  async function llamar(ruta, cuerpo) {
    try {
      const resp = await fetchFn(`${BASE}/${ruta}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
      });
      return await resp.json();
    } catch {
      return { ok: false, error: ERROR_RED };
    }
  }

  return {
    sesion: () => actual,
    token: () => actual?.token || '',
    cerrarLocal: () => guardar(null),

    async login(usuario, clave) {
      const r = await llamar('bpmn-auth', { accion: 'login', usuario: usuario.trim().toLowerCase(), clave });
      if (!r.ok) return r;
      guardar({ token: r.token, usuario: r.usuario, nombre: r.nombre, rol: r.rol, debe_cambiar_clave: r.debe_cambiar_clave });
      return r;
    },

    async restaurarSesion() {
      if (!actual?.token) return { ok: false };
      const r = await llamar('bpmn-auth', { accion: 'sesion', token: actual.token });
      if (!r.ok) {
        // Si fue un fallo de red conservamos la sesión; si el servidor la rechazó, se borra.
        if (r.error === ERROR_RED) return r;
        guardar(null);
        return r;
      }
      guardar({ ...actual, nombre: r.nombre, rol: r.rol, debe_cambiar_clave: r.debe_cambiar_clave });
      return r;
    },

    async cambiarClave(claveActual, claveNueva) {
      const r = await llamar('bpmn-auth', { accion: 'cambiar_clave', token: actual?.token, clave: claveActual, nueva: claveNueva });
      if (r.ok && actual) guardar({ ...actual, debe_cambiar_clave: false });
      if (r.error === 'sesion_invalida') guardar(null);
      return r;
    },

    async logout() {
      const token = actual?.token;
      guardar(null);
      if (token) await llamar('bpmn-auth', { accion: 'logout', token });
    },

    /** Acciones de administración: listar | crear | reset | estado | eliminar */
    async admin(accion, datos = {}) {
      const r = await llamar('bpmn-usuarios', { accion, token: actual?.token, ...datos });
      if (r.error === 'no_autorizado') guardar(null);
      return r;
    }
  };
}

/** Clave aleatoria de 12 caracteres sin caracteres ambiguos (0/O, 1/l/I). */
export function generarClave() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, b => alfabeto[b % alfabeto.length]).join('');
}

export const auth = crearAuth();
