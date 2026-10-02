import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearDictado } from '../src/dictado.js';

class FalsoReconocimiento {
  static ultimo;
  constructor() { FalsoReconocimiento.ultimo = this; }
  start() { this.activo = true; this.onstart?.(); }
  stop() { this.activo = false; this.onend?.(); }
}

function setup() {
  const eventos = { textos: [], estados: [], errores: [] };
  const d = crearDictado({
    Reconocimiento: FalsoReconocimiento,
    onTexto: t => eventos.textos.push(t),
    onEstado: a => eventos.estados.push(a),
    onError: e => eventos.errores.push(e)
  });
  return { d, eventos };
}

test('alternar inicia y detiene, configurado en español', () => {
  const { d, eventos } = setup();
  d.alternar();
  assert.equal(FalsoReconocimiento.ultimo.lang, 'es-DO');
  assert.equal(FalsoReconocimiento.ultimo.continuous, true);
  d.alternar();
  assert.deepEqual(eventos.estados, [true, false]);
});

test('entrega solo los resultados finales', () => {
  const { d, eventos } = setup();
  d.alternar();
  FalsoReconocimiento.ultimo.onresult({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'recibir solicitud' }], { isFinal: true }),
              Object.assign([{ transcript: 'parcial' }], { isFinal: false })]
  });
  assert.deepEqual(eventos.textos, ['recibir solicitud']);
});

test('traduce el error de permiso denegado', () => {
  const { d, eventos } = setup();
  d.alternar();
  FalsoReconocimiento.ultimo.onerror({ error: 'not-allowed' });
  assert.match(eventos.errores[0], /permiso/i);
});

test('sin soporte del navegador avisa en vez de fallar', () => {
  const errores = [];
  const d = crearDictado({ Reconocimiento: null, onTexto() {}, onEstado() {}, onError: e => errores.push(e) });
  d.alternar();
  assert.match(errores[0], /Chrome o Edge/);
});
