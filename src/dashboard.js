/**
 * Módulo de Dashboard Ejecutivo y Control de Gestión de Procesos BPMN
 * Basado en las directrices de la "Biblioteca de Dashboards - Plantillas e Ideas"
 * y las Unidades III y IV del Curso de BPM (NotebookLM - Prof. Johan Tapia, PhD)
 */

export const EXPEDIENTES_DGII_NELSON = [
  {
    id: "EXP-2026-0901",
    tramite: "Certificación de Cumplimiento Tributario",
    contribuyente: "Nelson Miñoso",
    rnc: "001-0892341-2",
    fechaIngreso: "2026-09-21",
    estado: "Emitido",
    tiempoCicloDias: 1.8,
    leadTimeDias: 2.3,
    slaStatus: "En Tiempo (98%)",
    oficina: "Oficina Virtual DGII",
    actividadActual: "Proceso Concluido (Firma Digital QR)"
  },
  {
    id: "EXP-2026-0904",
    tramite: "Habilitación Emisor Electrónico (e-CF)",
    contribuyente: "Nelson Miñoso",
    rnc: "001-0892341-2",
    fechaIngreso: "2026-09-22",
    estado: "En Pruebas",
    tiempoCicloDias: 2.5,
    leadTimeDias: 3.1,
    slaStatus: "En Tiempo (85%)",
    oficina: "Gerencia de Facturación Electrónica",
    actividadActual: "Ejecutar set de pruebas de integración API"
  },
  {
    id: "EXP-2026-0907",
    tramite: "Rectificativa de Declaración IT-1",
    contribuyente: "Nelson Miñoso",
    rnc: "001-0892341-2",
    fechaIngreso: "2026-09-23",
    estado: "En Revisión",
    tiempoCicloDias: 3.8,
    leadTimeDias: 4.2,
    slaStatus: "Atención Requerida (72%)",
    oficina: "Administración Local San Carlos",
    actividadActual: "Auditar cruces formatos compras 606"
  },
  {
    id: "EXP-2026-0895",
    tramite: "Certificación para Licitaciones Públicas",
    contribuyente: "Nelson Miñoso",
    rnc: "001-0892341-2",
    fechaIngreso: "2026-09-19",
    estado: "Emitido",
    tiempoCicloDias: 1.2,
    leadTimeDias: 1.9,
    slaStatus: "En Tiempo (100%)",
    oficina: "Oficina Virtual DGII",
    actividadActual: "Documento oficial descargado"
  },
  {
    id: "EXP-2026-0889",
    tramite: "Asignación Rango Secuencias e-CF (E31)",
    contribuyente: "Nelson Miñoso",
    rnc: "001-0892341-2",
    fechaIngreso: "2026-09-18",
    estado: "Emitido",
    tiempoCicloDias: 2.1,
    leadTimeDias: 2.8,
    slaStatus: "En Tiempo (95%)",
    oficina: "Gerencia de Facturación Electrónica",
    actividadActual: "Secuencias autorizadas e incorporadas"
  }
];

export function generarAppsScriptCode() {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Conector Dashboard BPMN DGII (Nelson Miñoso)
 * Desarrollado para Johan Tapia, PhD | Plataforma de Inteligencia de Procesos
 * =========================================================================
 * Instrucciones:
 * 1. Abre tu hoja de Google Sheets.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Pega este código completo y haz clic en "Ejecutar > inicializarHojaDashboard".
 * 4. Opcional: Publica como Web App para recibir actualizaciones automáticas.
 */

function inicializarHojaDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Dashboard_DGII") || ss.insertSheet("Dashboard_DGII");
  sheet.clear();

  // Encabezado Principal
  sheet.getRange("A1:H1").merge();
  var title = sheet.getRange("A1");
  title.setValue("DGII - PANEL DE CONTROL Y SEGUIMIENTO DE PROCESOS (Nelson Miñoso)");
  title.setBackground("#1e3a8a").setFontColor("#ffffff").setFontSize(14).setFontWeight("bold").setHorizontalAlignment("center");

  // Tarjetas KPI (Nivel 1: Resumen Ejecutivo)
  sheet.getRange("A3:B3").merge().setValue("Lead Time Promedio");
  sheet.getRange("A4:B4").merge().setValue("2.8 Días").setFontSize(18).setFontWeight("bold").setFontColor("#16a34a");

  sheet.getRange("C3:D3").merge().setValue("Cumplimiento SLA");
  sheet.getRange("C4:D4").merge().setValue("96.2%").setFontSize(18).setFontWeight("bold").setFontColor("#16a34a");

  sheet.getRange("E3:F3").merge().setValue("Tasa de Retrabajo");
  sheet.getRange("E4:F4").merge().setValue("6.5%").setFontSize(18).setFontWeight("bold").setFontColor("#2563eb");

  sheet.getRange("G3:H3").merge().setValue("Expedientes Nelson Miñoso");
  sheet.getRange("G4:H4").merge().setValue("28 Casos").setFontSize(18).setFontWeight("bold").setFontColor("#1e293b");

  sheet.getRange("A3:H3").setBackground("#f1f5f9").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A4:H4").setBackground("#ffffff").setHorizontalAlignment("center");

  // Tabla Transaccional (Nivel 3: Detalle)
  var headers = [
    ["No. Expediente", "Trámite DGII", "Contribuyente", "RNC", "Fecha", "Estado", "Lead Time (Días)", "Cumplimiento SLA"]
  ];
  sheet.getRange("A6:H6").setValues(headers).setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");

  var data = [
    ["EXP-2026-0901", "Certificación Tributaria", "Nelson Miñoso", "001-0892341-2", "2026-09-21", "Emitido", 2.3, "98%"],
    ["EXP-2026-0904", "Facturación Electrónica e-CF", "Nelson Miñoso", "001-0892341-2", "2026-09-22", "En Pruebas", 3.1, "85%"],
    ["EXP-2026-0907", "Rectificativa IT-1", "Nelson Miñoso", "001-0892341-2", "2026-09-23", "En Revisión", 4.2, "72%"],
    ["EXP-2026-0895", "Certificación Licitación", "Nelson Miñoso", "001-0892341-2", "2026-09-19", "Emitido", 1.9, "100%"],
    ["EXP-2026-0889", "Secuencias e-CF (E31)", "Nelson Miñoso", "001-0892341-2", "2026-09-18", "Emitido", 2.8, "95%"]
  ];
  sheet.getRange(7, 1, data.length, 8).setValues(data);

  // Formato automático de columnas
  for (var col = 1; col <= 8; col++) {
    sheet.autoResizeColumn(col);
  }

  SpreadsheetApp.getUi().alert("¡Dashboard de Procesos DGII inicializado con éxito!");
}

/**
 * Webhook para recibir eventos en tiempo real desde BPMN Studio
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Dashboard_DGII");
    if (sheet) {
      sheet.appendRow([
        payload.id || ("EXP-" + Date.now()),
        payload.tramite || "Trámite General",
        payload.contribuyente || "Nelson Miñoso",
        payload.rnc || "001-0892341-2",
        new Date().toISOString().slice(0, 10),
        payload.estado || "En Trámite",
        payload.leadTime || 1.5,
        payload.sla || "100%"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
}

export function exportarDatosCSV(expedientes) {
  const encabezados = ["ID Expediente", "Tramite", "Contribuyente", "RNC", "Fecha Ingreso", "Estado", "Tiempo Ciclo (Dias)", "Lead Time (Dias)", "SLA", "Oficina", "Actividad Actual"];
  const filas = expedientes.map(e => [
    `"${e.id}"`,
    `"${e.tramite}"`,
    `"${e.contribuyente}"`,
    `"${e.rnc}"`,
    `"${e.fechaIngreso}"`,
    `"${e.estado}"`,
    e.tiempoCicloDias,
    e.leadTimeDias,
    `"${e.slaStatus}"`,
    `"${e.oficina}"`,
    `"${e.actividadActual}"`
  ]);

  const csv = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dgii-dashboard-nelson-minoso-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
