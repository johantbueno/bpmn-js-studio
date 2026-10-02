/** Exportación del proceso abierto: CSV de tareas y script de Google Sheets. */

const csvCelda = v => {
  const t = String(v ?? '');
  return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};

const NOMBRE_TIPO = {
  generica: 'Tarea', usuario: 'Tarea de usuario', manual: 'Tarea manual', servicio: 'Tarea de servicio',
  script: 'Tarea de script', envio: 'Envío', recepcion: 'Recepción', regla: 'Regla de negocio', subproceso: 'Subproceso'
};

export function tareasCSV(modelo) {
  const filas = modelo.pasos.filter(p => p.tipo === 'tarea').map(p => [
    p.id, p.nombre, p.rol || '', NOMBRE_TIPO[p.tipoTarea] || 'Tarea', p.descripcion || '', p.siguiente.length
  ]);
  const cabecera = ['ID', 'Tarea', 'Rol', 'Tipo', 'Descripción', 'Salidas'];
  return [cabecera, ...filas].map(f => f.map(csvCelda).join(',')).join('\n');
}

export function descargarTareasCSV(modelo) {
  const blob = new Blob(['﻿' + tareasCSV(modelo)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tareas-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Script de Google Apps Script que crea la hoja "Proceso" con KPIs y tareas del proceso abierto. */
export function generarAppsScriptCode(modelo, analisis) {
  const { hallazgos, ...metricas } = analisis;
  const datos = {
    titulo: modelo.titulo,
    kpis: [
      ['Tareas', metricas.tareas], ['Compuertas de decisión', metricas.compuertas], ['Roles', Object.keys(metricas.roles).length],
      ['Traspasos entre áreas', metricas.traspasos], ['Complejidad ciclomática', metricas.complejidad], ['Camino más largo (tareas)', metricas.caminoMasLargo]
    ],
    tareas: modelo.pasos.filter(p => p.tipo === 'tarea').map(p => [p.id, p.nombre, p.rol || '', NOMBRE_TIPO[p.tipoTarea] || 'Tarea', p.descripcion || '']),
    hallazgos: hallazgos.map(h => [h.severidad, h.titulo, h.detalle])
  };
  return `/**
 * Google Apps Script: hoja "Proceso" con los indicadores y las tareas del proceso abierto en BPMN Studio.
 * 1. Abre una hoja de Google Sheets.  2. Extensiones > Apps Script.  3. Pega este código.
 * 4. Ejecuta "inicializarHojaProceso" y autoriza.
 */
var DATOS = ${JSON.stringify(datos, null, 2)};

function inicializarHojaProceso() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('Proceso') || ss.insertSheet('Proceso');
  hoja.clear();

  hoja.getRange('A1:E1').merge().setValue('PROCESO: ' + DATOS.titulo)
    .setBackground('#203864').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13);

  var fila = 3;
  DATOS.kpis.forEach(function (k) {
    hoja.getRange(fila, 1, 1, 2).setValues([k]);
    fila++;
  });
  hoja.getRange(3, 1, DATOS.kpis.length, 1).setFontWeight('bold').setBackground('#f1f5f9');

  fila += 1;
  hoja.getRange(fila, 1, 1, 5).setValues([['ID', 'Tarea', 'Rol', 'Tipo', 'Descripción']])
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  if (DATOS.tareas.length) hoja.getRange(fila + 1, 1, DATOS.tareas.length, 5).setValues(DATOS.tareas);
  fila += DATOS.tareas.length + 2;

  if (DATOS.hallazgos.length) {
    hoja.getRange(fila, 1, 1, 3).setValues([['Severidad', 'Hallazgo', 'Detalle']])
      .setBackground('#990000').setFontColor('#ffffff').setFontWeight('bold');
    hoja.getRange(fila + 1, 1, DATOS.hallazgos.length, 3).setValues(DATOS.hallazgos);
  }

  for (var c = 1; c <= 5; c++) hoja.autoResizeColumn(c);
  SpreadsheetApp.getUi().alert('Hoja "Proceso" lista.');
}
`;
}

export function raciCSV({ roles, matriz }) {
  const cabecera = ['Actividad / Tarea', ...roles.map(r => r.nombre)];
  const filas = matriz.map(m => [m.tarea, ...roles.map(r => m.asignaciones[r.nombre])]);
  return [cabecera, ...filas].map(f => f.map(csvCelda).join(',')).join('\n');
}

export function descargarCSV(nombre, texto) {
  const blob = new Blob(['\ufeff' + texto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
