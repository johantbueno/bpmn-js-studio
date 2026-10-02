/**
 * Paneles que analizan el proceso abierto en el lienzo: RACI, Causa Raíz, Quick Wins y Dashboard.
 * Todo sale del diagrama actual; nada depende de otros proyectos.
 */
import { modeloDesdeElementos, analizarProceso, generarRACI } from './modelo-proceso.js';
import { analizarConIA } from './analisis-ia.js';
import { generarAppsScriptCode, tareasCSV, raciCSV, descargarCSV } from './exportar-proceso.js';
import { auth } from './auth.js';
import { reabrirLogin } from './auth-ui.js';

const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOMBRE_TIPO = {
  generica: 'Tarea', usuario: 'Usuario', manual: 'Manual', servicio: 'Servicio', script: 'Script',
  envio: 'Envío', recepcion: 'Recepción', regla: 'Regla de negocio', subproceso: 'Subproceso'
};
const huella = texto => { let h = 5381; for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0; return String(h); };

export function iniciarPaneles({ modeler, showToast }) {
  const cacheIA = new Map();
  const secuencia = { quickwins: 0, causaraiz: 0 };
  let raciActual = null;

  const abrir = id => $(id).classList.add('open');
  const cerrar = id => $(id).classList.remove('open');

  /** Devuelve { modelo, analisis } del diagrama abierto o avisa si no hay tareas. */
  function leerProceso() {
    const modelo = modeloDesdeElementos(modeler.get('elementRegistry').getAll());
    if (!modelo.pasos.some(p => p.tipo === 'tarea')) {
      showToast('Dibuja o genera un proceso con tareas primero', 'warning');
      return null;
    }
    return { modelo, analisis: analizarProceso(modelo.pasos) };
  }

  const manejarErrorIA = err => {
    ['modal-quickwins', 'modal-ishikawa'].forEach(cerrar);
    if (err.code === 'no_autorizado') reabrirLogin(err.message);
    else showToast('No se pudo analizar: ' + err.message, 'error');
  };

  async function analizar(modo, { modelo, analisis }, problema = '', forzar = false) {
    const llave = [modo, problema, huella(JSON.stringify(modelo.pasos))].join('|');
    if (!forzar && cacheIA.has(llave)) return cacheIA.get(llave);
    const r = await analizarConIA(modo, modelo, analisis, { token: auth.token(), problema });
    cacheIA.set(llave, r);
    return r;
  }

  const estadoFuente = (el, r, n) => {
    el.innerHTML = r.origen === 'ia'
      ? `<span class="fuente fuente-ia">IA</span>Análisis generado sobre las ${n} tareas de tu diagrama.`
      : '<span class="fuente fuente-reglas">Reglas locales</span>La IA no respondió; este análisis se basa en la estructura del diagrama. Son hipótesis a validar con el equipo.';
  };

  // ---------------- RACI ----------------
  $('btn-raci').addEventListener('click', () => {
    const p = leerProceso();
    if (!p) return;
    raciActual = generarRACI(p.modelo.pasos);
    $('raci-thead').innerHTML = `<tr><th>Actividad / Tarea del Proceso</th>${raciActual.roles.map(r => `<th style="text-align: center;">${esc(r.nombre)}</th>`).join('')}</tr>`;
    $('raci-tbody').innerHTML = raciActual.matriz.map(m => `<tr><td><strong>${esc(m.tarea)}</strong></td>${
      raciActual.roles.map(r => {
        const v = m.asignaciones[r.nombre];
        return `<td style="text-align: center;"><span class="raci-badge raci-${v === 'A/R' ? 'a' : v.toLowerCase()}">${v}</span></td>`;
      }).join('')}</tr>`).join('');
    abrir('modal-raci');
  });
  ['btn-close-raci', 'btn-close-raci-btn'].forEach(id => $(id).addEventListener('click', () => cerrar('modal-raci')));
  $('btn-export-raci-csv').addEventListener('click', () => {
    if (!raciActual) return;
    descargarCSV('matriz-raci', raciCSV(raciActual));
    showToast('Matriz RACI exportada en formato CSV', 'success');
  });

  // ---------------- Quick Wins ----------------
  const cuadrantes = { 'quick-win': 'quad-qw-list', estrategico: 'quad-est-list', menor: 'quad-menor-list', descartar: 'quad-des-list' };

  function pintarQuickWins(r) {
    Object.values(cuadrantes).forEach(id => { $(id).innerHTML = ''; });
    r.iniciativas.forEach(i => {
      $(cuadrantes[i.cuadrante]).insertAdjacentHTML('beforeend', `
        <div class="iniciativa-card">
          <div class="iniciativa-title">${esc(i.titulo)}</div>
          <div style="color: #64748b; font-size: 0.72rem;">${esc(i.descripcion)}</div>
        </div>`);
    });
    Object.values(cuadrantes).forEach(id => {
      if (!$(id).children.length) $(id).innerHTML = '<div class="sin-datos">Sin iniciativas en este cuadrante.</div>';
    });
  }

  async function cargarQuickWins(forzar = false) {
    const p = leerProceso();
    if (!p) return cerrar('modal-quickwins');
    $('qw-subtitulo').textContent = `Proceso: ${p.modelo.titulo}`;
    $('qw-estado').textContent = '⏳ Analizando el proceso con IA…';
    Object.values(cuadrantes).forEach(id => { $(id).innerHTML = ''; });
    const turno = ++secuencia.quickwins;
    try {
      const r = await analizar('quickwins', p, '', forzar);
      if (turno !== secuencia.quickwins) return;
      pintarQuickWins(r);
      estadoFuente($('qw-estado'), r, p.analisis.tareas);
    } catch (err) {
      if (turno === secuencia.quickwins) manejarErrorIA(err);
    }
  }

  $('btn-quickwins').addEventListener('click', () => { abrir('modal-quickwins'); cargarQuickWins(); });
  $('btn-qw-reanalizar').addEventListener('click', () => cargarQuickWins(true));
  ['btn-close-quickwins', 'btn-close-quickwins-btn'].forEach(id => $(id).addEventListener('click', () => cerrar('modal-quickwins')));

  // ---------------- Causa Raíz ----------------
  function pintarCausaRaiz(r) {
    $('ish-problema-banner').hidden = false;
    $('ish-problema-banner').innerHTML = `<strong>Problema focal:</strong> ${esc(r.problema)}`;
    $('ishikawa-cards-container').innerHTML = r.categorias.map(cat => `
      <div class="ishikawa-card">
        <div class="ishikawa-card-title"><span>${esc(cat.icono)}</span><span>${esc(cat.nombre)}</span></div>
        <ul class="ishikawa-list">${cat.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>`).join('');
    $('whys-container').innerHTML = r.cincoPorques.map((w, i, todos) => `
      <div class="why-row ${i === todos.length - 1 ? 'why-root' : ''}">
        <span class="why-badge">Por qué #${w.nivel}</span>
        <div class="why-content">
          <div><strong>Pregunta:</strong> ${esc(w.pregunta)}</div>
          <div style="color: #334155; margin-top: 2px;"><strong>Respuesta:</strong> ${esc(w.respuesta)}</div>
        </div>
      </div>`).join('');
  }

  async function cargarCausaRaiz(forzar = false) {
    const p = leerProceso();
    if (!p) return cerrar('modal-ishikawa');
    $('ish-subtitulo').textContent = `Proceso: ${p.modelo.titulo}`;
    $('ish-estado').textContent = '⏳ Analizando el proceso con IA…';
    $('ish-problema-banner').hidden = true;
    $('ishikawa-cards-container').innerHTML = '';
    $('whys-container').innerHTML = '';
    const turno = ++secuencia.causaraiz;
    try {
      const r = await analizar('causaraiz', p, $('ish-problema').value.trim(), forzar);
      if (turno !== secuencia.causaraiz) return;
      pintarCausaRaiz(r);
      estadoFuente($('ish-estado'), r, p.analisis.tareas);
    } catch (err) {
      if (turno === secuencia.causaraiz) manejarErrorIA(err);
    }
  }

  $('btn-ishikawa').addEventListener('click', () => { abrir('modal-ishikawa'); cargarCausaRaiz(); });
  $('btn-ish-analizar').addEventListener('click', () => cargarCausaRaiz(true));
  $('ish-problema').addEventListener('keydown', e => { if (e.key === 'Enter') cargarCausaRaiz(true); });
  ['btn-close-ishikawa', 'btn-close-ishikawa-btn'].forEach(id => $(id).addEventListener('click', () => cerrar('modal-ishikawa')));

  // ---------------- Dashboard ----------------
  const barra = (etiqueta, valor, maximo, color) => `
    <div class="status-bar-row">
      <span class="bar-label">${esc(etiqueta)}</span>
      <div class="bar-track"><div class="bar-fill ${color}" style="width: ${maximo ? Math.round((valor / maximo) * 100) : 0}%;"></div></div>
      <span class="bar-val">${valor}</span>
    </div>`;

  function pintarDashboard({ modelo, analisis: a }) {
    const nRoles = Object.keys(a.roles).length;
    const pctAuto = a.tareas ? Math.round((a.automatizadas / a.tareas) * 100) : 0;
    const clasePasos = a.complejidad <= 5 ? 'positive' : (a.complejidad > 10 ? 'warning' : '');
    $('dash-subtitulo').textContent = `Proceso: ${modelo.titulo} · ${a.tareas} tareas · ${nRoles} rol(es)`;
    $('dash-kpis').innerHTML = [
      ['Tareas', a.tareas, '', `${a.automatizadas} automatizadas (${pctAuto}%)`],
      ['Compuertas', a.compuertas + a.paralelas, '', `${a.compuertas} de decisión · ${a.paralelas} paralelas`],
      ['Roles', nRoles, a.sinRol ? 'warning' : 'positive', a.sinRol ? `${a.sinRol} tarea(s) sin responsable` : 'Todas las tareas tienen responsable'],
      ['Traspasos', a.traspasos, a.hallazgos.some(h => h.id === 'traspasos_altos') ? 'warning' : '', 'Cambios de responsable entre pasos'],
      ['Complejidad', a.complejidad, clasePasos, 'Caminos posibles = decisiones + 1'],
      ['Camino más largo', a.caminoMasLargo, '', 'Tareas de punta a punta']
    ].map(([t, v, c, s]) => `<div class="kpi-card"><div class="kpi-title">${t}</div><div class="kpi-value ${c}">${v}</div><div class="kpi-sub">${esc(s)}</div></div>`).join('');

    const filasRoles = Object.entries(a.roles).sort((x, y) => y[1] - x[1]);
    const maxRol = Math.max(1, ...filasRoles.map(f => f[1]));
    const colores = ['bar-blue', 'bar-green', 'bar-amber', 'bar-red'];
    $('dash-roles').innerHTML = (filasRoles.length
      ? filasRoles.map(([rol, n], i) => barra(rol, n, maxRol, colores[i % colores.length])).join('')
      : '<div class="sin-datos">El diagrama no define carriles ni roles. Agrega carriles o genera el proceso con IA.</div>')
      + (a.sinRol ? barra('Sin rol asignado', a.sinRol, maxRol, 'bar-red') : '');

    const comp = [
      ['Tareas no automatizadas', a.tareas - a.automatizadas, 'bar-amber'], ['Tareas automatizadas', a.automatizadas, 'bar-green'],
      ['Decisiones', a.compuertas, 'bar-blue'], ['Compuertas paralelas', a.paralelas, 'bar-blue']
    ];
    const maxComp = Math.max(1, ...comp.map(c => c[1]));
    $('dash-composicion').innerHTML = comp.map(([e, v, c]) => barra(e, v, maxComp, c)).join('');

    $('dash-hallazgos').innerHTML = a.hallazgos.length
      ? a.hallazgos.map(h => `<div class="hallazgo"><span class="hallazgo-sev sev-${h.severidad}">${h.severidad}</span><div><div class="hallazgo-titulo">${esc(h.titulo)}</div><div class="hallazgo-detalle">${esc(h.detalle)}</div></div></div>`).join('')
      : '<div class="sin-datos">✅ Sin hallazgos estructurales relevantes.</div>';

    $('dash-tareas-body').innerHTML = modelo.pasos.filter(p => p.tipo === 'tarea').map(p =>
      `<tr><td><span class="kbd">${esc(p.id)}</span></td><td><strong>${esc(p.nombre)}</strong></td><td>${esc(p.rol) || '<em>—</em>'}</td><td>${NOMBRE_TIPO[p.tipoTarea] || 'Tarea'}</td><td>${p.siguiente.length}</td></tr>`).join('');
    $('appscript-code').textContent = generarAppsScriptCode(modelo, a);
  }

  $('btn-dashboard').addEventListener('click', () => {
    const p = leerProceso();
    if (!p) return;
    pintarDashboard(p);
    abrir('modal-dashboard');
  });
  ['btn-close-dashboard', 'btn-footer-close-dashboard'].forEach(id => $(id).addEventListener('click', () => cerrar('modal-dashboard')));

  document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#modal-dashboard .tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      $(btn.getAttribute('data-tab')).classList.add('active');
    });
  });

  $('btn-export-csv').addEventListener('click', () => {
    const p = leerProceso();
    if (!p) return;
    descargarCSV('tareas', tareasCSV(p.modelo));
    showToast('Archivo CSV generado y descargado', 'success');
  });
  $('btn-copy-appscript').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('appscript-code').textContent);
      showToast('Código de Google Apps Script copiado al portapapeles', 'success');
    } catch (err) {
      showToast('Error al copiar el código: ' + err.message, 'error');
    }
  });
}
