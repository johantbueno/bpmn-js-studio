/** Llamada única al webhook de IA de n8n (cascada Groq -> Nemotron -> Ollama; la clave vive en el servidor). */

export const WEBHOOK_URL = import.meta.env?.VITE_BPMN_WEBHOOK
  || 'https://n8n-inap.167.88.36.13.sslip.io/webhook/bpmn-generar-proceso';
const TIMEOUT_MS = 150000;

/** Devuelve el JSON del servidor. Lanza Error con code 'no_autorizado' si la sesión venció. */
export async function llamarIA(cuerpo, fetchFn = globalThis.fetch) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetchFn(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: ctrl.signal
    });
    if (!resp.ok) throw new Error(`Servidor de IA respondió ${resp.status}`);
    const datos = await resp.json();
    if (datos.error === 'no_autorizado') {
      throw Object.assign(new Error('Tu sesión venció. Vuelve a iniciar sesión.'), { code: 'no_autorizado' });
    }
    if (!datos.ok) throw new Error(`La IA no pudo responder (${datos.error || 'sin detalle'})`);
    return datos;
  } finally {
    clearTimeout(timer);
  }
}
