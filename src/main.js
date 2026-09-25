import BpmnModeler from 'bpmn-js/lib/Modeler';
import './style.css';

import { initialDiagramXML, emptyDiagramXML } from './initial-diagram.js';
import { 
  dgiiCertificacionXML, 
  dgiiECFXML, 
  dgiiRectificativaXML 
} from './dgii-processes.js';

import { auditarDiagramaBPMN } from './ai-auditor.js';
import { generarBPMNConIA } from './ai-generator.js';
import { generarDocumentacionProceso } from './ai-docs.js';

// Inicializar el modelador de BPMN
const canvasElement = document.getElementById('canvas');
const modeler = new BpmnModeler({
  container: canvasElement,
  keyboard: {
    bindTo: document
  }
});

// Elementos de la UI
const btnNew = document.getElementById('btn-new');
const btnOpen = document.getElementById('btn-open');
const fileInput = document.getElementById('file-input');
const selectDgii = document.getElementById('select-dgii');
const btnExportXml = document.getElementById('btn-export-xml');
const btnExportSvg = document.getElementById('btn-export-svg');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');

const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomFit = document.getElementById('btn-zoom-fit');
const btnZoomReset = document.getElementById('btn-zoom-reset');

const btnAiGen = document.getElementById('btn-ai-gen');
const btnAiAudit = document.getElementById('btn-ai-audit');
const btnAiDoc = document.getElementById('btn-ai-doc');

const modalAiGen = document.getElementById('modal-ai-gen');
const btnCloseAi = document.getElementById('btn-close-ai');
const btnCancelAi = document.getElementById('btn-cancel-ai');
const btnSubmitAi = document.getElementById('btn-submit-ai');
const aiPromptInput = document.getElementById('ai-prompt-input');
const geminiApiKey = document.getElementById('gemini-api-key');

const auditDrawer = document.getElementById('audit-drawer');
const btnCloseAudit = document.getElementById('btn-close-audit');
const auditContent = document.getElementById('audit-content');

const modalDocs = document.getElementById('modal-docs');
const btnCloseDocs = document.getElementById('btn-close-docs');
const docsContent = document.getElementById('docs-content');
const btnCopyDocs = document.getElementById('btn-copy-docs');
const btnPrintDocs = document.getElementById('btn-print-docs');

const dragOverlay = document.getElementById('drag-overlay');
const statusElements = document.getElementById('status-elements');
const statusText = document.getElementById('status-text');
const toastContainer = document.getElementById('toast-container');

/**
 * Función para importar XML en el lienzo
 */
async function cargarDiagrama(xml, ajustarVista = true) {
  try {
    await modeler.importXML(xml);
    if (ajustarVista) {
      const canvas = modeler.get('canvas');
      canvas.zoom('fit-viewport');
    }
    actualizarEstado();
    showToast('Diagrama cargado exitosamente', 'success');
  } catch (err) {
    console.error('Error al importar diagrama BPMN:', err);
    showToast('Error al importar el diagrama XML: ' + err.message, 'error');
  }
}

/**
 * Notificaciones Toast
 */
function showToast(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * Actualizar la barra de estado
 */
function actualizarEstado() {
  try {
    const elementRegistry = modeler.get('elementRegistry');
    const total = elementRegistry.getAll().length;
    statusElements.textContent = `${total} elementos en lienzo`;
    statusText.textContent = 'Diagrama listo';
  } catch (e) {
    // Silencio si aún no inicializa
  }
}

// Cargar diagrama por defecto inicial
cargarDiagrama(dgiiCertificacionXML);

// Eventos de cambios en el modelo
modeler.on('commandStack.changed', () => {
  actualizarEstado();
});

// Botón Nuevo
btnNew.addEventListener('click', () => {
  if (confirm('¿Deseas iniciar un nuevo diagrama en blanco? Se limpiará el lienzo actual.')) {
    cargarDiagrama(emptyDiagramXML);
    selectDgii.value = '';
    showToast('Nuevo lienzo en blanco iniciado', 'info');
  }
});

// Botón Abrir archivo
btnOpen.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    cargarDiagrama(event.target.result);
  };
  reader.readAsText(file);
  fileInput.value = '';
});

// Selector de Casos DGII (Nelson Miñoso)
selectDgii.addEventListener('change', (e) => {
  const valor = e.target.value;
  switch (valor) {
    case 'dgii-cert':
      cargarDiagrama(dgiiCertificacionXML);
      break;
    case 'dgii-ecf':
      cargarDiagrama(dgiiECFXML);
      break;
    case 'dgii-rec':
      cargarDiagrama(dgiiRectificativaXML);
      break;
    case 'starter':
      cargarDiagrama(initialDiagramXML);
      break;
  }
});

// Descargar XML
btnExportXml.addEventListener('click', async () => {
  try {
    const { xml } = await modeler.saveXML({ format: true });
    const blob = new Blob([xml], { type: 'application/bpmn20-xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proceso-dgii-${Date.now()}.bpmn`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Archivo BPMN (XML) descargado correctamente', 'success');
  } catch (err) {
    showToast('Error al exportar XML: ' + err.message, 'error');
  }
});

// Descargar SVG
btnExportSvg.addEventListener('click', async () => {
  try {
    const { svg } = await modeler.saveSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama-dgii-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Imagen SVG exportada correctamente', 'success');
  } catch (err) {
    showToast('Error al exportar SVG: ' + err.message, 'error');
  }
});

// Undo / Redo
btnUndo.addEventListener('click', () => {
  try {
    modeler.get('commandStack').undo();
  } catch (e) {}
});

btnRedo.addEventListener('click', () => {
  try {
    modeler.get('commandStack').redo();
  } catch (e) {}
});

// Controles de Zoom
btnZoomIn.addEventListener('click', () => {
  const canvas = modeler.get('canvas');
  canvas.zoom(canvas.zoom() * 1.25);
});

btnZoomOut.addEventListener('click', () => {
  const canvas = modeler.get('canvas');
  canvas.zoom(canvas.zoom() * 0.8);
});

btnZoomFit.addEventListener('click', () => {
  const canvas = modeler.get('canvas');
  canvas.zoom('fit-viewport');
});

btnZoomReset.addEventListener('click', () => {
  const canvas = modeler.get('canvas');
  canvas.zoom(1.0);
});

// Drag & Drop de archivos BPMN
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragOverlay.classList.add('active');
});

dragOverlay.addEventListener('dragleave', (e) => {
  dragOverlay.classList.remove('active');
});

dragOverlay.addEventListener('drop', (e) => {
  e.preventDefault();
  dragOverlay.classList.remove('active');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => cargarDiagrama(event.target.result);
    reader.readAsText(file);
  }
});

// Modal Generador con IA
btnAiGen.addEventListener('click', () => {
  modalAiGen.classList.add('open');
  aiPromptInput.focus();
});

btnCloseAi.addEventListener('click', () => modalAiGen.classList.remove('open'));
btnCancelAi.addEventListener('click', () => modalAiGen.classList.remove('open'));

// Chips de sugerencia rápida
document.querySelectorAll('.prompt-chips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    aiPromptInput.value = chip.getAttribute('data-prompt');
  });
});

btnSubmitAi.addEventListener('click', async () => {
  const prompt = aiPromptInput.value.trim();
  if (!prompt) {
    showToast('Por favor describe el proceso a generar', 'warning');
    return;
  }

  btnSubmitAi.disabled = true;
  btnSubmitAi.innerHTML = '<span>⏳ Generando diagrama...</span>';

  try {
    const apiKey = geminiApiKey.value.trim() || null;
    const xml = await generarBPMNConIA(prompt, apiKey);
    await cargarDiagrama(xml);
    modalAiGen.classList.remove('open');
    showToast('¡Diagrama generado con IA exitosamente!', 'success');
  } catch (err) {
    console.error('Error al generar con IA:', err);
    showToast('Error al generar diagrama: ' + err.message, 'error');
  } finally {
    btnSubmitAi.disabled = false;
    btnSubmitAi.innerHTML = '<span>✨ Generar Diagrama</span>';
  }
});

// Auditoría BPMN 2.0
btnAiAudit.addEventListener('click', () => {
  const resultado = auditarDiagramaBPMN(modeler);
  renderizarAuditoria(resultado);
  auditDrawer.classList.add('open');
});

btnCloseAudit.addEventListener('click', () => {
  auditDrawer.classList.remove('open');
});

function renderizarAuditoria(res) {
  let scoreClass = 'score-high';
  if (res.score < 50) scoreClass = 'score-low';
  else if (res.score < 80) scoreClass = 'score-med';

  let html = `
    <div class="score-card">
      <div class="score-circle ${scoreClass}">${res.score}%</div>
      <div>
        <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">Índice de Calidad BPMN</div>
        <div style="font-size: 0.78rem; color: #64748b;">${res.totalElementos} elementos evaluados</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
      <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; font-size: 0.76rem;">
        <strong>Tareas:</strong> ${res.estadisticas.tareas}
      </div>
      <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; font-size: 0.76rem;">
        <strong>Compuertas:</strong> ${res.estadisticas.compuertas}
      </div>
      <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; font-size: 0.76rem;">
        <strong>Eventos Inicio:</strong> ${res.estadisticas.eventosInicio}
      </div>
      <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; font-size: 0.76rem;">
        <strong>Eventos Fin:</strong> ${res.estadisticas.eventosFin}
      </div>
    </div>
  `;

  if (res.issues.length === 0) {
    html += `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px; font-size: 0.84rem; margin-bottom: 16px;">
        ✨ <strong>¡Excelente modelado!</strong> Cumple rigurosamente con las reglas sintácticas y nomenclatura de BPMN 2.0.
      </div>
    `;
  } else {
    html += `<h4 style="font-size: 0.86rem; margin-bottom: 8px; color: #1e293b;">Observaciones Detectadas (${res.issues.length}):</h4>`;
    res.issues.forEach(iss => {
      html += `
        <div class="issue-item issue-${iss.nivel}">
          <div style="font-weight: 700; font-size: 0.78rem; color: #0f172a; margin-bottom: 2px;">
            [${iss.tipo.toUpperCase()}] ${iss.mensaje}
          </div>
          <div style="color: #475569; font-size: 0.74rem;">💡 ${iss.sugerencia}</div>
        </div>
      `;
    });
  }

  html += `<h4 style="font-size: 0.86rem; margin: 16px 0 8px 0; color: #1e293b;">Recomendaciones de Mejora Lean (Unidad III):</h4>`;
  res.recomendaciones.forEach(rec => {
    html += `
      <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 0.76rem;">
        <div style="font-weight: 700; color: #1e40af;">${rec.titulo}</div>
        <div style="color: #334155; margin-top: 2px;">${rec.detalle}</div>
      </div>
    `;
  });

  auditContent.innerHTML = html;
}

// Modal Manual / Documentación
btnAiDoc.addEventListener('click', () => {
  const docMarkdown = generarDocumentacionProceso(modeler);
  docsContent.textContent = docMarkdown;
  modalDocs.classList.add('open');
});

btnCloseDocs.addEventListener('click', () => modalDocs.classList.remove('open'));

btnCopyDocs.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(docsContent.textContent);
    showToast('Ficha técnica copiada al portapapeles', 'success');
  } catch (err) {
    showToast('Error al copiar al portapapeles', 'error');
  }
});

btnPrintDocs.addEventListener('click', () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Ficha Técnica del Proceso - DGII</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; }
          h1, h2, h3 { color: #0f172a; }
          pre { background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <pre>${docsContent.textContent}</pre>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
});
