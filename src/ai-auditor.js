/**
 * Auditor de Procesos BPMN 2.0 basado en los estándares del
 * "Curso de BPM para la Transformación Digital de Procesos" (Unidades II y III)
 * Facilitador: Johan Tapia, PhD.
 */

const VERBOS_INFINITIVO = [
  'revisar', 'validar', 'notificar', 'emitir', 'consultar', 'generar', 'enviar',
  'recibir', 'aprobar', 'rechazar', 'actualizar', 'completar', 'descargar',
  'ingresar', 'auditar', 'verificar', 'registrar', 'autorizar', 'configurar',
  'ejecutar', 'presentar', 'analizar', 'adjuntar', 'firmar', 'liquidar', 'formular',
  'solicitar', 'procesar', 'gestionar', 'calcular', 'evaluar', 'elaborar'
];

export function auditarDiagramaBPMN(modeler) {
  const elementRegistry = modeler.get('elementRegistry');
  const elements = elementRegistry.getAll();

  const issues = [];
  const recomendaciones = [];
  let score = 100;

  const tareas = [];
  const compuertas = [];
  const eventosInicio = [];
  const eventosFin = [];
  const flujos = [];
  const pools = [];
  const lanes = [];

  elements.forEach(el => {
    const type = el.type;
    const bo = el.businessObject;
    if (!bo) return;

    if (type.includes('Task') || type === 'bpmn:Task' || type === 'bpmn:UserTask' || type === 'bpmn:ServiceTask') {
      tareas.push(el);
    } else if (type.includes('Gateway')) {
      compuertas.push(el);
    } else if (type === 'bpmn:StartEvent') {
      eventosInicio.push(el);
    } else if (type === 'bpmn:EndEvent') {
      eventosFin.push(el);
    } else if (type === 'bpmn:SequenceFlow') {
      flujos.push(el);
    } else if (type === 'bpmn:Participant') {
      pools.push(el);
    } else if (type === 'bpmn:Lane') {
      lanes.push(el);
    }
  });

  // 1. Verificación de Eventos de Inicio
  if (eventosInicio.length === 0) {
    issues.push({
      nivel: 'critico',
      tipo: 'Estructura',
      mensaje: 'Falta un Evento de Inicio. Todo proceso debe comenzar con al menos un evento disparador.',
      sugerencia: 'Agrega un StartEvent indicando la condición que dispara el proceso.'
    });
    score -= 25;
  } else if (eventosInicio.length > 1 && pools.length <= 1) {
    issues.push({
      nivel: 'advertencia',
      tipo: 'Estructura',
      mensaje: `Se detectaron ${eventosInicio.length} eventos de inicio en el mismo flujo.`,
      sugerencia: 'Verifica si corresponden a disparadores alternativos o a procesos independientes.'
    });
    score -= 10;
  }

  // 2. Verificación de Eventos de Fin
  if (eventosFin.length === 0) {
    issues.push({
      nivel: 'critico',
      tipo: 'Estructura',
      mensaje: 'Falta un Evento de Fin. El proceso no tiene un cierre definido (riesgo de bucle infinito).',
      sugerencia: 'Agrega uno o varios EndEvent para cada resultado posible (ej. Exitoso, Rechazado).'
    });
    score -= 25;
  }

  // 3. Verificación de Nomenclatura en Tareas (Regla: Verbo en Infinitivo + Objeto)
  tareas.forEach(t => {
    const nombre = (t.businessObject.name || '').trim();
    if (!nombre) {
      issues.push({
        nivel: 'critico',
        tipo: 'Nomenclatura',
        elemento: t.id,
        mensaje: `La tarea [${t.id}] no tiene nombre asignado.`,
        sugerencia: 'Asigna un nombre explícito con la estructura: Verbo en infinitivo + Objeto.'
      });
      score -= 10;
      return;
    }

    const primeraPalabra = nombre.split(' ')[0].toLowerCase().replace(/[^a-záéíóúñ]/g, '');
    const esInfinitivo = VERBOS_INFINITIVO.some(v => v === primeraPalabra) || 
                         primeraPalabra.endsWith('ar') || 
                         primeraPalabra.endsWith('er') || 
                         primeraPalabra.endsWith('ir');

    if (!esInfinitivo) {
      issues.push({
        nivel: 'advertencia',
        tipo: 'Nomenclatura (Unidad II)',
        elemento: nombre,
        mensaje: `La tarea "${nombre}" no parece iniciar con un verbo en infinitivo.`,
        sugerencia: `Reformular como "Verbo + Objeto" (ejemplo: en vez de "Revisión", usar "Revisar solicitud").`
      });
      score -= 5;
    }
  });

  // 4. Verificación de Nodos Desconectados (Huérfanos)
  const nodosDeFlujo = [...tareas, ...compuertas];
  nodosDeFlujo.forEach(n => {
    const bo = n.businessObject;
    const incoming = bo.incoming || [];
    const outgoing = bo.outgoing || [];

    if (incoming.length === 0) {
      issues.push({
        nivel: 'critico',
        tipo: 'Conectividad',
        elemento: bo.name || n.id,
        mensaje: `El elemento "${bo.name || n.id}" no tiene flujo entrante (es inaccesible).`,
        sugerencia: 'Conecta un flujo de secuencia desde el paso anterior hacia esta actividad.'
      });
      score -= 15;
    }

    if (outgoing.length === 0) {
      issues.push({
        nivel: 'critico',
        tipo: 'Conectividad',
        elemento: bo.name || n.id,
        mensaje: `El elemento "${bo.name || n.id}" no tiene flujo saliente (punto muerto).`,
        sugerencia: 'Conecta el flujo hacia el siguiente paso o hacia un Evento de Fin.'
      });
      score -= 15;
    }
  });

  // 5. Verificación de Compuertas Exclusivas y Etiquetas de Salida
  compuertas.forEach(g => {
    const bo = g.businessObject;
    const outgoing = bo.outgoing || [];
    if (outgoing.length > 1) {
      const sinEtiqueta = outgoing.filter(flow => !(flow.name || '').trim());
      if (sinEtiqueta.length > 0) {
        issues.push({
          nivel: 'advertencia',
          tipo: 'Legibilidad de Compuertas',
          elemento: bo.name || g.id,
          mensaje: `La compuerta "${bo.name || g.id}" tiene ${sinEtiqueta.length} rama(s) sin condición visible.`,
          sugerencia: 'Nombra cada flujo saliente con la condición correspondiente (ej. "Sí / No", "Al día / Deuda").'
        });
        score -= 5;
      }
    }
  });

  // 6. Recomendaciones de Optimización Lean & Quick Wins (Unidad III)
  recomendaciones.push({
    tipo: 'Quick Win (Unidad III)',
    titulo: 'Notificaciones Automáticas y Trazabilidad',
    detalle: 'Incorpora tareas de servicio automatizadas para notificar al contribuyente (Nelson Miñoso) en los puntos de decisión o rechazo para reducir tiempos de espera muertos (Waiting waste).'
  });

  if (compuertas.length > 0) {
    recomendaciones.push({
      tipo: 'Mejora TO-BE',
      titulo: 'Registro de Causa Raíz en Rechazos',
      detalle: 'Asegura que las ramas de rechazo o inconsistencia generen un objeto de datos con el motivo específico para alimentar análisis de Pareto y reducir la tasa de retrabajo.'
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    totalElementos: elements.length,
    estadisticas: {
      tareas: tareas.length,
      compuertas: compuertas.length,
      eventosInicio: eventosInicio.length,
      eventosFin: eventosFin.length,
      pools: pools.length,
      lanes: lanes.length
    },
    issues,
    recomendaciones
  };
}
