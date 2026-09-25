/**
 * Simulador Visual de Ejecución de Procesos (Token Simulation)
 * Mueve un token virtual a lo largo de las secuencias del diagrama BPMN
 * para validar la lógica operativa, compuertas y tiempos de ciclo.
 */

export class ProcessSimulator {
  constructor(modeler, onLogUpdate, onStepChange) {
    this.modeler = modeler;
    this.onLogUpdate = onLogUpdate;
    this.onStepChange = onStepChange;
    this.isRunning = false;
    this.currentNodeId = null;
    this.currentTimer = null;
    this.history = [];
    this.speed = 1200; // ms por paso
  }

  iniciarSimulacion() {
    this.detener();
    this.history = [];

    const elementRegistry = this.modeler.get('elementRegistry');
    const startEvents = elementRegistry.filter(el => el.type === 'bpmn:StartEvent');

    if (startEvents.length === 0) {
      if (this.onLogUpdate) this.onLogUpdate('⚠️ No se encontró un Evento de Inicio en el proceso para simular.');
      return;
    }

    const startNode = startEvents[0];
    this.isRunning = true;
    this.currentNodeId = startNode.id;
    this.log(`🚀 [SIMULADOR ACTIVADO] Iniciando nueva instancia de proceso para Nelson Miñoso en nodo: "${startNode.businessObject.name || startNode.id}"`);
    this.resaltarElemento(startNode.id);

    this.programarSiguientePaso();
  }

  programarSiguientePaso() {
    if (!this.isRunning) return;
    this.currentTimer = setTimeout(() => {
      this.avanzarPaso();
    }, this.speed);
  }

  avanzarPaso() {
    if (!this.isRunning || !this.currentNodeId) return;

    const elementRegistry = this.modeler.get('elementRegistry');
    const currentNode = elementRegistry.get(this.currentNodeId);
    if (!currentNode) {
      this.detener();
      return;
    }

    const bo = currentNode.businessObject;
    const outgoing = bo.outgoing || [];

    if (outgoing.length === 0 || currentNode.type === 'bpmn:EndEvent') {
      this.log(`🏁 [FIN DE PROCESO] Instancia concluida exitosamente en "${bo.name || currentNode.id}".`);
      this.resaltarElemento(currentNode.id, 'success');
      this.isRunning = false;
      if (this.onStepChange) this.onStepChange(false);
      return;
    }

    // Si es compuerta exclusiva, seleccionar una rama válida
    let selectedFlow = outgoing[0];
    if (outgoing.length > 1) {
      const idx = Math.floor(Math.random() * outgoing.length);
      selectedFlow = outgoing[idx];
      this.log(`🔀 [COMPUERTA EVALUADA] "${bo.name || currentNode.id}" tomó la decisión: "${selectedFlow.name || 'Rama ' + (idx + 1)}"`);
    }

    const targetRef = selectedFlow.targetRef;
    if (!targetRef) {
      this.log(`⚠️ Flujo de secuencia sin destino conectado.`);
      this.detener();
      return;
    }

    const nextNode = elementRegistry.get(targetRef.id);
    if (!nextNode) {
      this.detener();
      return;
    }

    this.removerResaltado(this.currentNodeId);
    this.currentNodeId = nextNode.id;
    this.history.push(nextNode.id);

    const nombre = nextNode.businessObject.name || nextNode.id;
    const tipo = nextNode.type.replace('bpmn:', '');
    this.log(`▶ Ejecutando [${tipo}]: "${nombre}"`);
    this.resaltarElemento(nextNode.id, 'active');

    this.programarSiguientePaso();
  }

  pausar() {
    this.isRunning = false;
    clearTimeout(this.currentTimer);
    this.log('⏸ Simulación pausada');
    if (this.onStepChange) this.onStepChange(false);
  }

  reanudar() {
    if (!this.currentNodeId) {
      this.iniciarSimulacion();
      return;
    }
    this.isRunning = true;
    this.log('▶ Reanudando simulación');
    if (this.onStepChange) this.onStepChange(true);
    this.programarSiguientePaso();
  }

  detener() {
    this.isRunning = false;
    clearTimeout(this.currentTimer);
    if (this.currentNodeId) {
      this.removerResaltado(this.currentNodeId);
      this.currentNodeId = null;
    }
    if (this.onStepChange) this.onStepChange(false);
  }

  log(msg) {
    if (this.onLogUpdate) {
      const hora = new Date().toLocaleTimeString();
      this.onLogUpdate(`[${hora}] ${msg}`);
    }
  }

  resaltarElemento(elementId, status = 'active') {
    const canvas = this.modeler.get('canvas');
    this.removerResaltado(elementId);
    canvas.addMarker(elementId, status === 'success' ? 'highlight-success' : 'highlight-active');
  }

  removerResaltado(elementId) {
    try {
      const canvas = this.modeler.get('canvas');
      canvas.removeMarker(elementId, 'highlight-active');
      canvas.removeMarker(elementId, 'highlight-success');
    } catch(e) {}
  }
}
