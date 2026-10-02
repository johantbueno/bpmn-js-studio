/**
 * Ficha técnica y manual de procedimiento del proceso abierto, generada a partir del modelo del diagrama.
 */
import { modeloDesdeElementos, analizarProceso } from './modelo-proceso.js';

export function generarDocumentacionProceso(modeler) {
  const modelo = modeloDesdeElementos(modeler.get('elementRegistry').getAll());
  const analisis = analizarProceso(modelo.pasos);
  const porId = new Map(modelo.pasos.map(p => [p.id, p]));
  const nombreDe = id => porId.get(id)?.nombre || id;

  const tareas = modelo.pasos.filter(p => p.tipo === 'tarea');
  const compuertas = modelo.pasos.filter(p => p.tipo === 'compuerta' || p.tipo === 'compuerta_paralela');
  const inicios = modelo.pasos.filter(p => p.tipo === 'inicio' && p.nombre).map(p => p.nombre);
  const fines = modelo.pasos.filter(p => p.tipo === 'fin' && p.nombre).map(p => p.nombre);
  const roles = Object.keys(analisis.roles);

  const fechaHoy = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });

  const actividades = tareas.map((t, i) => {
    const responsable = t.rol ? ` _(Responsable: ${t.rol})_` : '';
    return `${i + 1}. **${t.nombre || 'Actividad sin nombre'}**${responsable}: ${t.descripcion || 'Ejecución de la actividad conforme a las reglas operativas del proceso.'}`;
  }).join('\n');

  const decisiones = compuertas.length
    ? compuertas.map((g, i) => {
      const salidas = g.siguiente.map(s => `${s.condicion || 'Continúa'} → ${nombreDe(s.a)}`).join('; ');
      const tipo = g.tipo === 'compuerta_paralela' ? 'Actividades en paralelo' : 'Decisión';
      return `* **${tipo} ${i + 1}${g.nombre ? ` (${g.nombre})` : ''}:** ${salidas || 'sin salidas definidas'}.`;
    }).join('\n')
    : '* Proceso lineal continuo sin compuertas divergentes registradas.';

  const mejoras = analisis.hallazgos.length
    ? analisis.hallazgos.map(h => `* **${h.titulo}.** ${h.detalle}`).join('\n')
    : '* No se detectaron oportunidades de mejora estructurales en el diagrama.';

  return `# FICHA TÉCNICA Y MANUAL DE PROCEDIMIENTO

**Proceso:** ${modelo.titulo}
**Fecha de generación:** ${fechaHoy}
**Estándar:** BPMN 2.0 (OMG)
**Responsables identificados:** ${roles.length ? roles.join(', ') : 'No definidos en el diagrama'}

---

## 1. Objetivo del Proceso
Describir y estandarizar la ejecución del proceso «${modelo.titulo}», que comprende ${analisis.tareas} actividad(es) y ${analisis.compuertas + analisis.paralelas} punto(s) de decisión o paralelismo, garantizando trazabilidad y consistencia en cada instancia.

---

## 2. Alcance
- **Inicio:** ${inicios.join('; ') || 'Activación por solicitud o requerimiento'}.
- **Término:** ${fines.join('; ') || 'Conclusión del proceso y entrega del resultado'}.

---

## 3. Actividades y Pasos Secuenciales
${actividades || '_El diagrama no contiene actividades._'}

---

## 4. Reglas de Negocio y Puntos de Decisión
${decisiones}

---

## 5. Indicadores Clave de Desempeño (KPIs sugeridos)
1. **Lead Time total:** tiempo desde el inicio de la solicitud hasta la entrega del resultado.
2. **Cycle Time por tarea:** tiempo neto de ejecución de cada actividad.
3. **Tasa de retrabajo:** porcentaje de casos que requieren correcciones o devoluciones.
4. **Nivel de servicio (SLA):** cumplimiento de los plazos de atención definidos para el proceso.

---

## 6. Oportunidades de Mejora Detectadas
${mejoras}

---
*Documento generado automáticamente por BPMN Studio.*`;
}
