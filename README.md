# BPMN Studio Pro 🚀

> **Estudio Web Profesional de Modelado, Auditoría y Automatización de Procesos BPMN 2.0 con Inteligencia Artificial y Casos Oficiales de la DGII de la República Dominicana.**

Diseñado e impulsado por el **Prof. Johan Tapia, PhD**, integrando las mejores prácticas de la iniciativa [BPMN.io](https://bpmn.io) (`bpmn-js`), el empaquetado moderno con [Vite](https://vitejs.dev/) y los fundamentos metodológicos del *Curso de BPM para la Transformación Digital de Procesos* (investigado vía NotebookLM).

---

## 🌟 Características Principales

1. **Modelador BPMN 2.0 Completo e Interactivo**:
   - Paleta oficial completa: Eventos (Inicio, Intermedios, Fin), Tareas (Usuario, Servicio, Script, Manual), Compuertas (Exclusiva XOR, Paralela AND, Inclusiva OR, Basada en Eventos), Carriles (*Pools & Lanes*), Artefactos y Objetos de Datos.
   - Atajos de teclado fluidos (`Ctrl+Z`, `Ctrl+Y`, `Espacio + Arrastrar` para desplazar el lienzo, `Ctrl + Rueda` para zoom).
   - Arrastrar y soltar (*Drag & Drop*) de archivos `.bpmn` o `.xml` directo al navegador.

2. **Casos Pre-cargados de la Dirección General de Impuestos Internos (DGII)**:
   - **Caso 1: Solicitud de Certificación de Cumplimiento Tributario**:
     - *Cliente:* **Nelson Miñoso**
     - *Flujo:* Ingreso por Oficina Virtual (OFV) $\rightarrow$ Validación automática de RNC y omisiones de IT-1/IR-2 $\rightarrow$ Bifurcación XOR $\rightarrow$ Emisión con código QR y firma digital o notificación de regularización.
   - **Caso 2: Facturación Electrónica e-CF**:
     - *Cliente:* **Nelson Miñoso**
     - *Flujo:* Validación de Certificado Digital Tributario $\rightarrow$ Set de pruebas API DGII $\rightarrow$ Asignación de rangos autorizados (E31, E32, E34) $\rightarrow$ Acreditación como emisor electrónico.
   - **Caso 3: Rectificativa de Declaración Jurada y Cruce 606/607**:
     - *Cliente:* **Nelson Miñoso**
     - *Flujo:* Auditoría de compras y ventas $\rightarrow$ Evaluación de justificaciones tributarias $\rightarrow$ Aprobación o emisión de pliego de reparo.

3. **Suite de Inteligencia Artificial (BPMN AI Suite)**:
   - **Generador de Procesos Text-to-BPMN**: Escribe un proceso en lenguaje natural y la IA construirá automáticamente el diagrama BPMN 2.0 con sus coordenadas visuales. Admite síntesis local instantánea y conexión opcional con Google Gemini API.
   - **Auditor de Calidad BPMN 2.0 (Reglas Unidades II y III)**:
     - Evaluación de nomenclatura estricta (*Verbo en infinitivo + Objeto*).
     - Validación de balanceo de compuertas y etiquetas en flujos condicionales.
     - Detección de nodos huérfanos o sin salida.
     - Identificación de desperdicios Lean (*Waiting, Retrabajo*) y sugerencias de *Quick Wins*.
     - Calificación numérica global (0 a 100%).
   - **Generador de Manuales y Fichas Técnicas**: Extrae en un clic la documentación formal del procedimiento en Markdown lista para imprimir en PDF.

4. **Exportación e Interoperabilidad**:
   - Descarga de archivos estándar BPMN 2.0 XML formateados.
   - Exportación de imágenes vectoriales SVG de alta resolución para informes y presentaciones.

---

## 🛠️ Tecnologías

- **Librería de Diagramación:** [`bpmn-js`](https://github.com/bpmn-io/bpmn-js) (v18.x)
- **Empaquetador:** [Vite](https://vitejs.dev/)
- **Despliegue Continuo:** GitHub Actions & GitHub Pages
- **Base Metodológica:** Curso de BPM y Transformación Digital (NotebookLM)

---

## 🚀 Instalación y Ejecución Local

Asegúrate de tener [Node.js](https://nodejs.org/) (versión 18 o superior) instalado:

```bash
# 1. Clonar el repositorio
git clone https://github.com/johantbueno/bpmn-js-studio.git
cd bpmn-js-studio

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
npm run dev

# 4. Compilar para producción
npm run build

# 5. Previsualizar compilación local
npm run preview
```

---

## 🌐 Despliegue en GitHub Pages

El proyecto incluye el workflow automatizado `.github/workflows/deploy.yml`. Cada vez que realices un `git push` a la rama `main`, GitHub Actions compilará los assets de Vite y publicará la última versión en:

`https://johantbueno.github.io/bpmn-js-studio/`

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Desarrollado con ❤️ para el ecosistema dominicano y la comunidad global de BPM.
