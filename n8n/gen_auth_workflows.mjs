// Genera los workflows de login y administración de usuarios de BPMN Studio.
// Importar con: n8n import:workflow --input=bpmn-auth.workflow.json
import { writeFileSync } from 'node:fs';

const PG = { postgres: { id: 'mavHpWO7fIkviTqC', name: 'Postgres INAP Progreso' } };
const RESP = { respondWith: 'json', responseBody: '={{ $json }}', options: { responseHeaders: { entries: [{ name: 'Access-Control-Allow-Origin', value: '*' }] } } };
const webhook = (path) => ({ id: 'w1', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0], webhookId: path,
  parameters: { httpMethod: 'POST', path, responseMode: 'responseNode', options: { allowedOrigins: '*' } } });
const pg = (query, replacement) => ({ id: 'p1', name: 'Postgres', type: 'n8n-nodes-base.postgres', typeVersion: 2.5, position: [240, 0], credentials: PG, alwaysOutputData: true,
  parameters: { operation: 'executeQuery', query, options: { queryReplacement: replacement } } });
const code = (jsCode) => ({ id: 'c1', name: 'Resultado', type: 'n8n-nodes-base.code', typeVersion: 2, position: [480, 0], parameters: { jsCode } });
const responder = { id: 'r1', name: 'Responder', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [720, 0], parameters: RESP };
const cadena = {
  Webhook: { main: [[{ node: 'Postgres', type: 'main', index: 0 }]] },
  Postgres: { main: [[{ node: 'Resultado', type: 'main', index: 0 }]] },
  Resultado: { main: [[{ node: 'Responder', type: 'main', index: 0 }]] }
};

// ---------- bpmn-auth: login | sesion | cambiar_clave | logout ----------
const sqlAuth = `WITH input AS (
  SELECT $1::text AS usuario, $2::text AS clave, $3::text AS token, $4::text AS accion, $5::text AS nueva
),
existing AS (
  SELECT u.* FROM bpmn_usuarios u, input i WHERE i.accion = 'login' AND u.usuario = i.usuario
),
checked AS (
  SELECT e.*, (e.bloqueado_hasta IS NOT NULL AND e.bloqueado_hasta > now()) AS esta_bloqueado,
         (e.clave_hash = crypt((SELECT clave FROM input), e.clave_hash)) AS clave_ok
  FROM existing e
),
login_ok AS (
  UPDATE bpmn_usuarios SET session_token = encode(gen_random_bytes(24),'hex'), token_creado_en = now(), intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id IN (SELECT id FROM checked WHERE clave_ok AND NOT esta_bloqueado AND activo)
  RETURNING id, usuario, nombre, rol, session_token, debe_cambiar_clave
),
login_fail AS (
  UPDATE bpmn_usuarios SET intentos_fallidos = intentos_fallidos + 1,
    bloqueado_hasta = CASE WHEN intentos_fallidos + 1 >= 5 THEN now() + interval '15 minutes' ELSE bloqueado_hasta END
  WHERE id IN (SELECT id FROM checked WHERE NOT clave_ok AND NOT esta_bloqueado)
  RETURNING id
),
sesion AS (
  SELECT u.id, u.usuario, u.nombre, u.rol, u.debe_cambiar_clave, u.clave_hash
  FROM bpmn_usuarios u, input i
  WHERE i.accion IN ('sesion','cambiar_clave') AND i.token <> '' AND u.session_token = i.token AND u.activo
    AND u.token_creado_en > now() - interval '12 hours'
),
cambio AS (
  UPDATE bpmn_usuarios SET clave_hash = crypt((SELECT nueva FROM input), gen_salt('bf')), debe_cambiar_clave = false
  WHERE id IN (SELECT id FROM sesion WHERE (SELECT accion FROM input) = 'cambiar_clave'
               AND length((SELECT nueva FROM input)) >= 8
               AND clave_hash = crypt((SELECT clave FROM input), clave_hash))
  RETURNING id
),
salida AS (
  UPDATE bpmn_usuarios SET session_token = NULL
  WHERE (SELECT accion FROM input) = 'logout' AND (SELECT token FROM input) <> '' AND session_token = (SELECT token FROM input)
  RETURNING id
)
SELECT 'ok'::text AS r, id, usuario, nombre, rol, session_token AS token, debe_cambiar_clave FROM login_ok
UNION ALL SELECT 'clave_incorrecta', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM login_fail
UNION ALL SELECT 'bloqueado', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM checked WHERE esta_bloqueado
UNION ALL SELECT 'inactivo', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM checked WHERE NOT activo AND clave_ok AND NOT esta_bloqueado
UNION ALL SELECT 'sesion', id, usuario, nombre, rol, NULL::text, debe_cambiar_clave FROM sesion WHERE (SELECT accion FROM input) = 'sesion'
UNION ALL SELECT 'clave_cambiada', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM cambio
UNION ALL SELECT 'clave_actual_incorrecta', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM sesion
  WHERE (SELECT accion FROM input) = 'cambiar_clave' AND id NOT IN (SELECT id FROM cambio)
UNION ALL SELECT 'logout', id, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean FROM salida`;

const reemplazoAuth = `={{ [
  (($json.body.usuario)||'').toString().toLowerCase().trim(),
  (($json.body.clave)||'').toString(),
  (($json.body.token)||'').toString(),
  (($json.body.accion)||'').toString(),
  (($json.body.nueva)||'').toString()
] }}`;

const codeAuth = `const filas = $input.all().map(i => i.json);
const accion = (($('Webhook').first().json.body || {}).accion || '').toString();
const tiene = r => filas.some(x => x.r === r);
if (accion === 'login') {
  if (tiene('bloqueado')) return [{ json: { ok: false, error: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.' } }];
  if (tiene('inactivo')) return [{ json: { ok: false, error: 'Tu cuenta está desactivada. Contacta al administrador.' } }];
  const ok = filas.find(x => x.r === 'ok');
  if (ok) return [{ json: { ok: true, token: ok.token, usuario: ok.usuario, nombre: ok.nombre, rol: ok.rol, debe_cambiar_clave: ok.debe_cambiar_clave } }];
  return [{ json: { ok: false, error: 'Usuario o clave incorrectos.' } }];
}
if (accion === 'sesion') {
  const s = filas.find(x => x.r === 'sesion');
  if (s) return [{ json: { ok: true, usuario: s.usuario, nombre: s.nombre, rol: s.rol, debe_cambiar_clave: s.debe_cambiar_clave } }];
  return [{ json: { ok: false, error: 'sesion_invalida' } }];
}
if (accion === 'cambiar_clave') {
  if (tiene('clave_cambiada')) return [{ json: { ok: true } }];
  if (tiene('clave_actual_incorrecta')) return [{ json: { ok: false, error: 'La clave actual es incorrecta, o la nueva tiene menos de 8 caracteres.' } }];
  return [{ json: { ok: false, error: 'sesion_invalida' } }];
}
if (accion === 'logout') return [{ json: { ok: true } }];
return [{ json: { ok: false, error: 'accion_desconocida' } }];`;

// ---------- bpmn-usuarios: solo admin ----------
const sqlUsuarios = `WITH input AS (
  SELECT $1::text AS token, $2::text AS accion, $3::text AS usuario, $4::text AS nombre, $5::text AS clave, $6::text AS activo, $7::int AS uid
),
admin AS (
  SELECT u.id FROM bpmn_usuarios u, input i
  WHERE i.token <> '' AND u.session_token = i.token AND u.rol = 'admin' AND u.activo
    AND u.token_creado_en > now() - interval '12 hours'
),
crear AS (
  INSERT INTO bpmn_usuarios (usuario, nombre, clave_hash, rol, debe_cambiar_clave)
  SELECT i.usuario, i.nombre, crypt(i.clave, gen_salt('bf')), 'usuario', true FROM input i
  WHERE i.accion = 'crear' AND EXISTS (SELECT 1 FROM admin)
    AND i.usuario ~ '^[a-z0-9._-]{3,30}$' AND length(trim(i.nombre)) > 0 AND length(i.clave) >= 8
  ON CONFLICT (usuario) DO NOTHING
  RETURNING id
),
reset AS (
  UPDATE bpmn_usuarios SET clave_hash = crypt((SELECT clave FROM input), gen_salt('bf')), debe_cambiar_clave = true,
    session_token = NULL, intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id = (SELECT uid FROM input) AND (SELECT accion FROM input) = 'reset' AND EXISTS (SELECT 1 FROM admin)
    AND length((SELECT clave FROM input)) >= 8
  RETURNING id
),
estado AS (
  UPDATE bpmn_usuarios SET activo = ((SELECT activo FROM input) = 'true'),
    session_token = CASE WHEN (SELECT activo FROM input) = 'true' THEN session_token ELSE NULL END,
    intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id = (SELECT uid FROM input) AND (SELECT accion FROM input) = 'estado' AND EXISTS (SELECT 1 FROM admin)
    AND id NOT IN (SELECT id FROM admin)
  RETURNING id
),
eliminar AS (
  DELETE FROM bpmn_usuarios
  WHERE id = (SELECT uid FROM input) AND (SELECT accion FROM input) = 'eliminar' AND EXISTS (SELECT 1 FROM admin)
    AND id NOT IN (SELECT id FROM admin) AND rol <> 'admin'
  RETURNING id
)
SELECT (SELECT count(*) FROM admin)::int AS admin_ok,
       (SELECT count(*) FROM crear)::int AS creado,
       (SELECT count(*) FROM reset)::int AS reseteado,
       (SELECT count(*) FROM estado)::int AS estado_ok,
       (SELECT count(*) FROM eliminar)::int AS eliminado,
       COALESCE((SELECT json_agg(json_build_object('id', u.id, 'usuario', u.usuario, 'nombre', u.nombre, 'rol', u.rol,
                  'activo', u.activo, 'debe_cambiar_clave', u.debe_cambiar_clave, 'creado_en', u.creado_en,
                  'bloqueado', (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > now())) ORDER BY u.id)
                 FROM bpmn_usuarios u WHERE (SELECT accion FROM input) = 'listar' AND EXISTS (SELECT 1 FROM admin)), '[]'::json) AS usuarios`;

const reemplazoUsuarios = `={{ [
  (($json.body.token)||'').toString(),
  (($json.body.accion)||'').toString(),
  (($json.body.usuario)||'').toString().toLowerCase().trim(),
  (($json.body.nombre)||'').toString().trim(),
  (($json.body.clave)||'').toString(),
  (($json.body.activo)||'').toString(),
  String(parseInt($json.body.id) || 0)
] }}`;

const codeUsuarios = `const r = $input.first().json;
const b = $('Webhook').first().json.body || {};
if (!r.admin_ok) return [{ json: { ok: false, error: 'no_autorizado' } }];
switch (b.accion) {
  case 'listar': return [{ json: { ok: true, usuarios: r.usuarios } }];
  case 'crear':
    return [{ json: r.creado ? { ok: true } : { ok: false, error: 'No se pudo crear: el usuario ya existe, es inválido (3-30 letras minúsculas, números . _ -), el nombre está vacío o la clave tiene menos de 8 caracteres.' } }];
  case 'reset':
    return [{ json: r.reseteado ? { ok: true } : { ok: false, error: 'No se pudo cambiar la clave (mínimo 8 caracteres).' } }];
  case 'estado':
    return [{ json: r.estado_ok ? { ok: true } : { ok: false, error: 'No se puede cambiar el estado de esa cuenta.' } }];
  case 'eliminar':
    return [{ json: r.eliminado ? { ok: true } : { ok: false, error: 'No se puede eliminar esa cuenta.' } }];
}
return [{ json: { ok: false, error: 'accion_desconocida' } }];`;

const wf = (id, name, path, sql, repl, js) => ({
  id, active: false, name,
  nodes: [webhook(path), pg(sql, repl), code(js), responder], connections: cadena, settings: { executionOrder: 'v1' }
});

writeFileSync(new URL('./bpmn-auth.workflow.json', import.meta.url), JSON.stringify([
  wf('bpmnAuth01', 'BPMN Studio - Login y sesión', 'bpmn-auth', sqlAuth, reemplazoAuth, codeAuth),
  wf('bpmnUsuarios01', 'BPMN Studio - Administrar usuarios (admin)', 'bpmn-usuarios', sqlUsuarios, reemplazoUsuarios, codeUsuarios)
], null, 2));
console.log('ok');
