# BPMN Studio Miñoso 🚀

> **Suite Web Profesional de Modelado, Simulación, Auditoría y Automatización de Procesos BPMN 2.0 con Inteligencia Artificial, Dashboard Ejecutivo y Casos Oficiales de la DGII de la República Dominicana.**

Diseñado e impulsado por el **Prof. Johan Tapia, PhD**, integrando las mejores prácticas de la iniciativa [BPMN.io](https://bpmn.io) (`bpmn-js`), el empaquetado moderno con [Vite](https://vitejs.dev/) y los fundamentos metodológicos del *Curso de BPM para la Transformación Digital de Procesos* (investigado vía NotebookLM).

---

## 🌟 Suite de Funcionalidades Profesionales

### 1. Modelador Interactivo BPMN 2.0
- **Paleta Oficial Completa:** Eventos (Inicio, Intermedios, Fin con disparadores de mensaje, temporizador, error y terminación), Tareas (Usuario, Servicio, Script, Manual, Regla de Negocio), Compuertas (Exclusiva XOR, Paralela AND, Inclusiva OR, Basada en Eventos), Carriles (*Pools & Lanes*), Artefactos y Objetos de Datos.
- **Buscador de Nodos en Tiempo Real:** Localiza cualquier actividad o compuerta por nombre y enfoca el lienzo con zoom y resaltado automático.
- **Atajos de Teclado y Controles Fluidos:** Deshacer (`Ctrl+Z`), Rehacer (`Ctrl+Y`), Zoom dinámico (`+`, `-`, 100%, ajustar al viewport) y arrastre panorámico (`Espacio + Arrastrar`).
- **Drag & Drop:** Carga directa arrastrando archivos `.bpmn` o `.xml` al navegador.
- **Exportación:** Descarga de archivos estándar BPMN 2.0 XML y exportación de imágenes vectoriales SVG de alta definición.

---

### 2. Simulador Visual de Procesos (Token Simulation)
- **Ejecución en Vivo de Instancias:** Anima visualmente el recorrido de una ficha o token a través de las ramas del proceso activo.
- **Evaluación de Compuertas:** Resuelve bifurcaciones condicionales y destaca los nodos activos en azul brillante y los eventos terminales en verde.
- **Consola de Auditoría en Tiempo Real:** Registra paso a paso los eventos con marcas de tiempo (Play, Pausa, Siguiente Paso, Detener).

---

### 3. Matriz RACI Automática (Gobierno de Procesos)
- **Generación Dinámica:** Analiza los participantes y tareas del diagrama en pantalla y construye la matriz formal de responsabilidades:
  - **Responsible (R):** Ejecutor operativo.
  - **Accountable (A):** Dueño del proceso (*Process Owner*) con autoridad de punta a punta.
  - **Consulted (C):** Expertos técnicos o normativos.
  - **Informed (I):** Actores notificados (ej. Nelson Miñoso).
- **Exportación:** Descarga directa de la matriz en formato CSV para hojas de cálculo.

---

### 4. Analizador de Causa Raíz (Ishikawa & 5 Porqués)
- **Diagrama de Espina de Pescado (6 Dimensiones):** Estructurado bajo el ciclo DMAIC (Unidad III) en los 6 ejes clave:
  1. *Personas* (capacitación, resistencia)
  2. *Procesos* (secuencias redundantes, aprobaciones innecesarias)
  3. *Tecnología* (ausencia de notificaciones push, integraciones faltantes)
  4. *Materiales / Datos* (calidad de formatos 606/607)
  5. *Medición* (ausencia de alarmas BAM)
  6. *Entorno* (fechas pico de vencimiento tributario)
- **Técnica de los 5 Porqués:** Desmonta síntomas superficiales (ej. "¿el jefe es lento?") hasta revelar la causa raíz estructural (**falta de alertas automatizadas**).

---

### 5. Matriz 2x2 Impacto vs. Esfuerzo (Quick Wins)
- Herramienta visual de priorización para el portafolio de mejoras:
  - 🟢 **Quick Wins:** Alto Impacto / Bajo Esfuerzo (Notificaciones automáticas a Nelson Miñoso, validación QR).
  - 🟡 **Proyectos Estratégicos:** Alto Impacto / Alto Esfuerzo (Integración con API de facturación electrónica e-CF).
  - 🔵 **Tareas Rápidas:** Bajo Impacto / Bajo Esfuerzo.
  - 🔴 **Descartar:** Bajo Impacto / Alto Esfuerzo.

---

### 6. Casos Oficiales de la DGII (República Dominicana) - Cliente: Nelson Miñoso
- **1. Certificación de Cumplimiento Tributario:** Oficina Virtual (OFV) $\rightarrow$ Verificación de estatus tributario y omisiones de ITBIS (IT-1)/IR-2 $\rightarrow$ Decisión XOR $\rightarrow$ Emisión con código QR y firma digital o notificación de regularización.
- **2. Facturación Electrónica e-CF:** Presentación de Certificado Digital Tributario vigente $\rightarrow$ Set de pruebas API DGII $\rightarrow$ Asignación de secuencias autorizadas (E31, E32, E34) $\rightarrow$ Acreditación como emisor electrónico activo.
- **3. Rectificativa de Declaración Jurada y Cruce 606/607:** Auditoría de compras y ventas $\rightarrow$ Evaluación de variaciones tributarias $\rightarrow$ Aprobación o acta de reparo provisional.

---

### 7. Dashboard Ejecutivo & Conector Google Apps Script
- **Panel Ejecutivo (Regla 3-30-300):**
  - *Lead Time Promedio:* `2.8 Días` (Meta: $\le$ 5.0 d).
  - *Tiempo de Ciclo Activo:* `1.4 Días` (Tiempo neto de valor agregado).
  - *Cumplimiento de SLA:* `96.2%` (Meta: $\ge$ 90%).
  - *Tasa de Retrabajo:* `6.5%`.
  - *Expedientes Nelson Miñoso:* 28 casos en seguimiento.
- **Distribución y Cuellos de Botella:** Gráficos de embudo de estados y análisis de demoras por actividad en horas promedio.
- **Simulador de Casos:** Generación y procesamiento de nuevos expedientes en tiempo real.
- **Google Apps Script:** Código completo para crear tableros automáticos en Google Sheets y recibir webhooks en tiempo real.

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/johantbueno/bpmn-js-studio.git
cd bpmn-js-studio

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🌐 Despliegue en GitHub Pages

Disponible y actualizado en:  
**[https://johantbueno.github.io/bpmn-js-studio/](https://johantbueno.github.io/bpmn-js-studio/)**

---

## 📄 Licencia

MIT License. Desarrollado con excelencia técnica por Johan Manuel Tapia, PhD.
