/**
 * Generador y Evaluador de Matriz RACI para Procesos BPMN
 * Basado en las directrices de Gobierno de Procesos y Gestión de Hand-offs
 * del Curso de BPM (Prof. Johan Tapia, PhD)
 */

export function generarMatrizRACI(modeler) {
  const elementRegistry = modeler.get('elementRegistry');
  const elements = elementRegistry.getAll();

  const tareas = [];
  elements.forEach(el => {
    if (el.type.includes('Task') && el.businessObject?.name) {
      tareas.push({
        id: el.id,
        nombre: el.businessObject.name.trim()
      });
    }
  });

  const roles = [
    { id: 'solicitante', nombre: 'Contribuyente (Nelson Miñoso)' },
    { id: 'analista', nombre: 'Analista Operativo DGII' },
    { id: 'owner', nombre: 'Dueño del Proceso (Process Owner)' },
    { id: 'ti', nombre: 'Oficina Virtual / TI DGII' }
  ];

  // Matriz predeterminada inteligente según el tipo de actividad
  const matriz = tareas.map((t, index) => {
    const n = t.nombre.toLowerCase();
    let r = 'analista';
    let a = 'owner';
    let c = 'ti';
    let i = 'solicitante';

    if (n.includes('formulario') || n.includes('solicita') || n.includes('presentar') || n.includes('descargar') || n.includes('ingresar')) {
      r = 'solicitante';
      a = 'solicitante';
      c = 'analista';
      i = 'owner';
    } else if (n.includes('validar') || n.includes('verificar') || n.includes('auditar') || n.includes('set de pruebas')) {
      r = 'ti';
      a = 'analista';
      c = 'owner';
      i = 'solicitante';
    } else if (n.includes('notificar') || n.includes('emitir') || n.includes('resolución') || n.includes('autorizar')) {
      r = 'analista';
      a = 'owner';
      c = 'ti';
      i = 'solicitante';
    }

    return {
      tarea: t.nombre,
      asignaciones: {
        solicitante: r === 'solicitante' ? 'R' : (a === 'solicitante' ? 'A' : (i === 'solicitante' ? 'I' : '-')),
        analista: r === 'analista' ? 'R' : (a === 'analista' ? 'A' : (c === 'analista' ? 'C' : '-')),
        owner: a === 'owner' ? 'A' : (c === 'owner' ? 'C' : '-'),
        ti: r === 'ti' ? 'R' : (c === 'ti' ? 'C' : '-')
      }
    };
  });

  return { roles, matriz };
}

export function exportarRACICSV(datosRACI) {
  const { roles, matriz } = datosRACI;
  const header = ['Actividad / Tarea', ...roles.map(r => `"${r.nombre}"`)];
  const rows = matriz.map(m => [
    `"${m.tarea}"`,
    m.asignaciones.solicitante,
    m.asignaciones.analista,
    m.asignaciones.owner,
    m.asignaciones.ti
  ]);

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `matriz-raci-dgii-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
