/**
 * Matriz 2x2 de Priorización: Impacto vs. Esfuerzo (Quick Wins)
 * Basado en la Unidad III del Curso de BPM (Prof. Johan Tapia, PhD)
 */

export const INICIATIVAS_MEJORA_DGII = [
  {
    id: 1,
    titulo: "Notificación Push/Email automática a Nelson Miñoso",
    cuadrante: "quick-win", // Alto Impacto, Bajo Esfuerzo
    impacto: "Alto",
    esfuerzo: "Bajo",
    descripcion: "Alertar al contribuyente y fiscalizador de inmediato para abatir tiempos muertos (Waiting waste)."
  },
  {
    id: 2,
    titulo: "Incorporar Código QR con Firma Digital Verificable",
    cuadrante: "quick-win",
    impacto: "Alto",
    esfuerzo: "Bajo",
    descripcion: "Eliminar el sello húmedo físico permitiendo validación inmediata en portal DGII."
  },
  {
    id: 3,
    titulo: "Integración de Motor BPMS con API de Facturación Electrónica e-CF",
    cuadrante: "estrategico", // Alto Impacto, Alto Esfuerzo
    impacto: "Alto",
    esfuerzo: "Alto",
    descripcion: "Conexión directa SOAP/REST para validación instantánea de esquemas XML de comprobantes."
  },
  {
    id: 4,
    titulo: "Actualización de Manuales en PDF estático",
    cuadrante: "menor", // Bajo Impacto, Bajo Esfuerzo
    impacto: "Bajo",
    esfuerzo: "Bajo",
    descripcion: "Ajuste cosmético de guías de usuario si sobra capacidad en el equipo."
  },
  {
    id: 5,
    titulo: "Rediseño completo de interfaz heredada sin modificar backend",
    cuadrante: "descartar", // Bajo Impacto, Alto Esfuerzo
    impacto: "Bajo",
    esfuerzo: "Alto",
    descripcion: "Genera fricción y alto costo sin resolver los cuellos de botella de la operación."
  }
];
