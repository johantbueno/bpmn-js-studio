import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerArchivo } from '../src/lector-archivos.js';

test('lee txt y md como texto plano', async () => {
  assert.equal(await leerArchivo({ name: 'levantamiento.md', text: async () => '# Hola\n1. Paso' }), '# Hola\n1. Paso');
  assert.equal(await leerArchivo({ name: 'A.TXT', text: async () => 'texto' }), 'texto');
});

test('rechaza formatos no soportados con mensaje claro', async () => {
  await assert.rejects(() => leerArchivo({ name: 'foto.png' }), /no soportado/i);
});

test('rechaza archivos sin texto', async () => {
  await assert.rejects(() => leerArchivo({ name: 'vacio.txt', text: async () => '  ' }), /sin texto/i);
});
