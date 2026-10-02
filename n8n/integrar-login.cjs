// Script de una sola vez: integra login/admin en index.html, style.css y main.js
const fs = require('fs');
const raiz = require('path').resolve(__dirname, '..');
const leer = f => fs.readFileSync(`${raiz}/${f}`, 'utf8');
const escribir = (f, t) => fs.writeFileSync(`${raiz}/${f}`, t);

let h = leer('index.html');
if (h.includes('id="login-overlay"')) { console.log('ya integrado'); process.exit(0); }

h = h.replace('    </header>', `
      <div id="user-chip" class="user-chip" hidden>
        <span class="user-avatar" aria-hidden="true">👤</span>
        <span id="user-name" class="user-name"></span>
        <button type="button" id="btn-admin-users" class="btn" hidden title="Administrar usuarios y claves">👥 Usuarios</button>
        <button type="button" id="btn-change-pass" class="btn" title="Cambiar mi clave">🔑 Clave</button>
        <button type="button" id="btn-logout" class="btn" title="Cerrar sesión">Salir</button>
      </div>
    </header>`);

const overlays = `
  <!-- Acceso: login (bloquea la app hasta iniciar sesión) -->
  <div id="login-overlay" class="login-overlay open">
    <form id="login-form" class="login-card" autocomplete="on">
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
        </div>
        <div>
          <div class="brand-title">BPMN Studio</div>
          <div class="login-sub">Acceso restringido</div>
        </div>
      </div>
      <label for="login-usuario">Usuario</label>
      <input id="login-usuario" class="form-input" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>
      <label for="login-clave">Clave</label>
      <input id="login-clave" class="form-input" type="password" autocomplete="current-password" required>
      <p id="login-error" class="form-error" role="alert"></p>
      <button id="login-submit" class="btn btn-primary login-submit" type="submit">Iniciar sesión</button>
      <p class="login-help">¿Sin acceso o olvidaste tu clave? Solicítala al administrador.</p>
    </form>
  </div>

  <!-- Cambio de clave -->
  <div id="modal-clave" class="modal-backdrop" style="z-index: 2100;">
    <form id="clave-form" class="modal-box" style="max-width: 420px;">
      <div class="modal-header">
        <span style="font-weight: 700; font-size: 1.05rem;">🔑 Cambiar clave</span>
        <button type="button" class="btn-close" id="clave-cerrar" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">
        <p id="clave-aviso" class="form-aviso" hidden>Por seguridad debes cambiar la clave temporal antes de continuar.</p>
        <label for="clave-actual">Clave actual</label>
        <input id="clave-actual" class="form-input" type="password" autocomplete="current-password" required>
        <label for="clave-nueva">Clave nueva (mínimo 8 caracteres)</label>
        <input id="clave-nueva" class="form-input" type="password" autocomplete="new-password" minlength="8" required>
        <label for="clave-repetir">Repite la clave nueva</label>
        <input id="clave-repetir" class="form-input" type="password" autocomplete="new-password" minlength="8" required>
        <p id="clave-error" class="form-error" role="alert"></p>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary">Guardar clave</button>
      </div>
    </form>
  </div>

  <!-- Administración de usuarios (solo admin) -->
  <div id="modal-admin" class="modal-backdrop">
    <div class="modal-box modal-lg">
      <div class="modal-header">
        <span style="font-weight: 700; font-size: 1.1rem;">👥 Usuarios y claves</span>
        <button type="button" class="btn-close" id="btn-close-admin" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">
        <form id="admin-form" class="admin-form">
          <div><label for="admin-nombre">Nombre completo</label><input id="admin-nombre" class="form-input" required placeholder="Ej. María Pérez"></div>
          <div><label for="admin-usuario">Usuario</label><input id="admin-usuario" class="form-input" required pattern="[a-z0-9._-]{3,30}" autocapitalize="none" placeholder="mperez"></div>
          <div><label for="admin-clave">Clave temporal</label>
            <div class="admin-clave-fila">
              <input id="admin-clave" class="form-input" required minlength="8" autocomplete="off">
              <button type="button" class="btn" id="admin-generar" title="Generar clave aleatoria">🎲</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">➕ Crear usuario</button>
        </form>

        <div id="admin-resultado" class="admin-resultado" hidden>
          <p id="admin-resultado-texto"></p>
          <div class="admin-clave-fila"><code id="admin-clave-mostrada"></code><button type="button" class="btn" id="admin-copiar">Copiar</button></div>
        </div>

        <div class="admin-tabla-wrap">
          <table class="admin-tabla">
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="admin-lista"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;
h = h.replace('  <script type="module" src="/src/main.js"></script>', overlays + '\n  <script type="module" src="/src/main.js"></script>');
escribir('index.html', h);

fs.appendFileSync(`${raiz}/src/style.css`, `

/* ===== Acceso, usuarios y claves ===== */
.login-overlay { display: none; position: fixed; inset: 0; z-index: 2000; align-items: center; justify-content: center; padding: 16px;
  background: linear-gradient(135deg, #203864 0%, #0f172a 100%); }
.login-overlay.open { display: flex; }
.login-card { background: var(--surface); width: 100%; max-width: 380px; padding: 28px 26px; border-radius: 14px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; gap: 6px; }
.login-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.login-sub { font-size: 0.78rem; color: var(--text-muted); }
.login-card label, .modal-body label { font-size: 0.8rem; font-weight: 600; margin-top: 8px; display: block; }
.login-card .form-input, #modal-clave .form-input { font-size: 16px; }
.login-submit { margin-top: 14px; justify-content: center; min-height: 42px; }
.login-help { font-size: 0.74rem; color: var(--text-muted); text-align: center; margin-top: 10px; }
.form-error { color: var(--danger); font-size: 0.8rem; min-height: 1.2em; margin-top: 6px; }
.form-aviso { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 8px 10px; border-radius: 8px; font-size: 0.8rem; }
.user-chip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.user-chip[hidden], .user-chip [hidden] { display: none; }
.user-name { font-size: 0.82rem; font-weight: 600; }
.admin-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; align-items: end; margin-bottom: 14px; }
.admin-clave-fila { display: flex; gap: 6px; align-items: center; }
.admin-resultado { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.82rem; }
.admin-resultado code, #admin-clave-mostrada { font-size: 1rem; font-weight: 700; letter-spacing: 0.5px; user-select: all; }
.admin-tabla-wrap { overflow-x: auto; }
.admin-tabla { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.admin-tabla th, .admin-tabla td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.admin-acciones { display: flex; gap: 6px; flex-wrap: wrap; }
.admin-hint { color: var(--text-muted); font-size: 0.78rem; }
.pill { font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
.pill-ok { background: #dcfce7; color: #166534; }
.pill-warn { background: #fef3c7; color: #92400e; }
.pill-off { background: #fee2e2; color: #991b1b; }
.btn-danger-outline { color: var(--danger); border-color: #fecaca; }
.ai-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.ai-file-name { font-size: 0.78rem; color: var(--text-muted); }
.ai-hint { display: block; margin-top: 6px; color: var(--text-muted); }
#btn-ai-mic[aria-pressed="true"] { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
`);

let m = leer('src/main.js');
m = m.replace("import { leerArchivo }", "import { auth } from './auth.js';\nimport { exigirSesion, reabrirLogin } from './auth-ui.js';\nimport { leerArchivo }");
m = m.replace(`      onEstado: msg => { btnSubmitAi.innerHTML = '<span>⏳ ' + msg + '</span>'; }
    });`, `      token: auth.token(),
      onEstado: msg => { btnSubmitAi.innerHTML = '<span>⏳ ' + msg + '</span>'; }
    });`);
m = m.replace("    console.error('Error al generar con IA:', err);",
  "    if (err.code === 'no_autorizado') { modalAiGen.classList.remove('open'); reabrirLogin(err.message); return; }\n    console.error('Error al generar con IA:', err);");
m += `

// Acceso: nada de la app es utilizable hasta iniciar sesión
exigirSesion({ showToast });
`;
escribir('src/main.js', m);
console.log('integrado');
