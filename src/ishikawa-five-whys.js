/**
 * Analizador de Causa Raíz: Diagrama de Ishikawa (Espina de Pescado) y 5 Porqués
 * Basado en la Unidad III (Análisis y Mejora de Procesos) del Curso de BPM (Prof. Johan Tapia, PhD)
 */

export const ISHIKAWA_CASO_DGII = {
  problema: "Demora en la tramitación y entrega de Certificaciones Tributarias a Nelson Miñoso",
  categorias: [
    {
      nombre: "Personas",
      icono: "👥",
      causas: [
        "Falta de capacitación en verificación ágil de omisiones",
        "Sobrecarga de expedientes manuales en el analista"
      ]
    },
    {
      nombre: "Procesos",
      icono: "📋",
      causas: [
        "Aprobaciones escalonadas redundantes sin valor agregado",
        "Falta de criterios claros para excepciones menores"
      ]
    },
    {
      nombre: "Tecnología",
      icono: "💻",
      causas: [
        "Ausencia de notificaciones push/email automáticas al contribuyente",
        "Intermitencia en la sincronización entre OFV y módulo de recaudación"
      ]
    },
    {
      nombre: "Materiales / Datos",
      icono: "📦",
      causas: [
        "Formatos 606 y 607 cargados con errores de RNC por terceros",
        "Inconsistencias en declaraciones informativas anteriores"
      ]
    },
    {
      nombre: "Medición",
      icono: "📊",
      causas: [
        "Ausencia de alarmas BAM cuando un expediente supera las 48 horas",
        "Métricas aisladas por departamento en lugar de Lead Time de punta a punta"
      ]
    },
    {
      nombre: "Entorno / Normativa",
      icono: "⚖️",
      causas: [
        "Picos de demanda en fechas límites de declaración mensual (día 20)",
        "Requisitos formales exigidos por la Ley 11-92 (Código Tributario)"
      ]
    }
  ],
  cincoPorques: [
    { nivel: 1, pregunta: "¿Por qué se retrasó la certificación de Nelson Miñoso?", respuesta: "Porque el expediente tardó 4 días hábiles en ser aprobado en la oficina local." },
    { nivel: 2, pregunta: "¿Por qué tardó tanto la revisión en la oficina?", respuesta: "Porque el fiscalizador no abrió el expediente hasta el tercer día de radicado." },
    { nivel: 3, pregunta: "¿Por qué no lo abrió de inmediato?", respuesta: "Porque no recibió ninguna notificación o alerta de solicitud entrante pendiente en su bandeja." },
    { nivel: 4, pregunta: "¿Por qué no hay notificaciones de alerta?", respuesta: "Porque la etapa de asignación actual es manual y dependía de una revisión periódica visual." },
    { nivel: 5, pregunta: "¿Por qué seguía siendo manual?", respuesta: "Causa Raíz Real: Falta de integración de una Tarea de Servicio (Service Task) de notificación automática en el BPMS." }
  ]
};
