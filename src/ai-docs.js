/**
 * Generador de Ficha Técnica y Documentación Narrativa de Procesos
 * Basado en estándares de gestión por procesos y auditoría de la DGII.
 */

export function generarDocumentacionProceso(modeler) {
  const elementRegistry = modeler.get('elementRegistry');
  const elements = elementRegistry.getAll();

  const tareas = [];
  const compuertas = [];
  const eventosInicio = [];
  const eventosFin = [];
  let nombreProceso = 'Proceso de Gestión Empresarial / Tributaria';

  elements.forEach(el => {
    if (el.type === 'bpmn:Participant' && el.businessObject?.name) {
      nombreProceso = el.businessObject.name;
    }
    if (el.type.includes('Task') && el.businessObject?.name) {
      tareas.push(el.businessObject.name.trim());
    }
    if (el.type.includes('Gateway') && el.businessObject?.name) {
      compuertas.push(el.businessObject.name.trim());
    }
    if (el.type === 'bpmn:StartEvent' && el.businessObject?.name) {
      eventosInicio.push(el.businessObject.name.trim());
    }
    if (el.type === 'bpmn:EndEvent' && el.businessObject?.name) {
      eventosFin.push(el.businessObject.name.trim());
    }
  });

  const fechaHoy = new Date().toLocaleDateString('es-DO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const markdown = `# FICHA TÉCNICA Y MANUAL DE PROCEDIMIENTO

**Proceso:** ${nombreProceso}  
**Institución / Contexto:** Dirección General de Impuestos Internos (DGII) / Contribuyente Nelson Miñoso  
**Fecha de Generación:** ${fechaHoy}  
**Estándar:** BPMN 2.0 (OMG)  

---

## 1. Objetivo del Proceso
Asegurar la tramitación eficiente, transparente y oportuna de los requerimientos tributarios del contribuyente **Nelson Miñoso**, garantizando el cumplimiento de los plazos legales, la trazabilidad de los actos administrativos y la adecuada integración con los sistemas centrales de la **DGII**.

---

## 2. Alcance
- **Inicio:** ${eventosInicio.join('; ') || 'Activación por solicitud o requerimiento'}.
- **Término:** ${eventosFin.join('; ') || 'Conclusión y emisión de resolución o documento probatorio'}.

---

## 3. Matriz de Actividades y Pasos Secuenciales
${tareas.map((t, idx) => `${idx + 1}. **${t}**: Ejecución formal de la etapa de gestión conforme a las reglas operativas y validaciones de seguridad documental.`).join('\n')}

---

## 4. Reglas de Negocio y Puntos de Decisión (Compuertas)
${compuertas.length > 0 
  ? compuertas.map((c, idx) => `* **Criterio ${idx + 1} (${c}):** Bifurcación condicional que evalúa conformidad tributaria o suficiencia técnica antes de autorizar la emisión o pase a siguiente carril.`).join('\n')
  : '* Proceso lineal continuo sin compuertas divergentes registradas.'}

---

## 5. Indicadores Clave de Desempeño (KPIs Sugeridos - Unidad III BPM)
1. **Lead Time Total:** Tiempo promedio desde el inicio de la solicitud hasta la entrega del resultado al contribuyente.
2. **Cycle Time por Tarea:** Tiempo neto de ejecución de cada actividad en sistema.
3. **Tasa de Retrabajo / Observación:** Porcentaje de expedientes que requieren ajustes o subsanaciones documentales.
4. **Nivel de Servicio (SLA):** Cumplimiento de metas de atención dentro de los 3 a 5 días hábiles establecidos por la DGII.

---
*Documento generado automáticamente por BPMN Studio Pro con IA - Johan Tapia, PhD.*`;

  return markdown;
}
