/** Extrae el texto de un archivo de levantamiento (.docx, .pdf, .txt, .md) en el navegador. */

export async function leerArchivo(archivo) {
  const ext = archivo.name.split('.').pop().toLowerCase();
  let texto;

  if (ext === 'txt' || ext === 'md') {
    texto = await archivo.text();
  } else if (ext === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser.js');
    texto = (await mammoth.extractRawText({ arrayBuffer: await archivo.arrayBuffer() })).value;
  } else if (ext === 'pdf') {
    texto = await leerPdf(archivo);
  } else {
    throw new Error(`Formato no soportado (.${ext}). Usa Word (.docx), PDF, .txt o .md`);
  }

  if (!texto.trim()) throw new Error('El archivo está sin texto legible (¿PDF escaneado como imagen?)');
  return texto.trim();
}

async function leerPdf(archivo) {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;

  const pdf = await pdfjs.getDocument({ data: await archivo.arrayBuffer() }).promise;
  const paginas = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const contenido = await (await pdf.getPage(i)).getTextContent();
    paginas.push(contenido.items.map(it => it.str).join(' '));
  }
  return paginas.join('\n');
}
