import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tareasCSV, generarAppsScriptCode } from '../src/exportar-proceso.js';
import { analizarProceso } from '../src/modelo-proceso.js';

const modelo = {
  titulo: 'Devolución "ITBIS"',
  pasos: [
    { id: 'i', tipo: 'inicio', nombre: 'Inicio', siguiente: [{ a: 't1' }] },
    { id: 't1', tipo: 'tarea', tipoTarea: 'usuario', nombre: 'Presentar solicitud, con anexos', rol: 'Contribuyente', descripcion: 'Dice "hola"', siguiente: [{ a: 'f' }] },
    { id: 'f', tipo: 'fin', nombre: 'Fin' }
  ]
};

test('tareasCSV escapa comas y comillas y solo incluye tareas', () => {
  const csv = tareasCSV(modelo);
  const filas = csv.split('\n');
  assert.equal(filas.length, 2);
  assert.ok(filas[0].startsWith('ID,Tarea,Rol'));
  assert.ok(filas[1].includes('"Presentar solicitud, con anexos"'));
  assert.ok(filas[1].includes('"Dice ""hola"""'));
});

test('generarAppsScriptCode es JavaScript válido y contiene el proceso abierto', () => {
  const codigo = generarAppsScriptCode(modelo, analizarProceso(modelo.pasos));
  assert.doesNotThrow(() => new Function(codigo));
  assert.ok(codigo.includes('Presentar solicitud, con anexos'));
  assert.ok(codigo.includes('function inicializarHojaProceso'));
  assert.ok(!codigo.includes('Nelson'));
});

test('raciCSV usa los roles del diagrama como columnas', async () => {
  const { raciCSV } = await import('../src/exportar-proceso.js');
  const csv = raciCSV({
    roles: [{ nombre: 'Oficial' }, { nombre: 'Dueño del proceso' }],
    matriz: [{ tarea: 'Registrar, validar', asignaciones: { Oficial: 'R', 'Dueño del proceso': 'A' } }]
  });
  assert.equal(csv, 'Actividad / Tarea,Oficial,Dueño del proceso\n"Registrar, validar",R,A');
});
