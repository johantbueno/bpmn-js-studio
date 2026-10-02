/** Dictado por voz (voz a texto) con el reconocimiento nativo del navegador, en español dominicano. */

const MENSAJES = {
  'not-allowed': 'Permiso de micrófono denegado. Habilítalo en el candado de la barra de direcciones.',
  'service-not-allowed': 'Permiso de micrófono denegado. Habilítalo en el candado de la barra de direcciones.',
  'no-speech': 'No se escuchó nada. Acércate al micrófono e inténtalo de nuevo.',
  'audio-capture': 'No se detectó ningún micrófono conectado.',
  'network': 'El dictado requiere conexión a internet.'
};

export function crearDictado({
  onTexto, onEstado, onError,
  Reconocimiento = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition
}) {
  let rec = null;

  function iniciar() {
    if (!Reconocimiento) {
      onError('Tu navegador no soporta dictado por voz. Usa Chrome o Edge.');
      return;
    }
    rec = new Reconocimiento();
    rec.lang = 'es-DO';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onstart = () => onEstado(true);
    rec.onend = () => { onEstado(false); rec = null; };
    rec.onerror = e => onError(MENSAJES[e.error] || `Error de dictado: ${e.error}`);
    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onTexto(e.results[i][0].transcript.trim());
      }
    };
    rec.start();
  }

  return { alternar: () => (rec ? rec.stop() : iniciar()) };
}
