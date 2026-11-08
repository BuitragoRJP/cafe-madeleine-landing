// Pruebas rápidas de la lógica de horario: `node landing/js/schedule.test.cjs`
const assert = require('node:assert/strict');
const S = require('./schedule.js');

// Hora de Bogotá → instante UTC (Bogotá = UTC-5)
const bog = (y, m, d, h, min = 0) => new Date(Date.UTC(y, m - 1, d, h + 5, min));

// Festivos oficiales 2026
const expected2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
  '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
  '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
];
assert.deepEqual(Object.keys(S.holidaysFor(2026)).sort(), expected2026);

// Miércoles 4 nov 2026, 10:00 → abierto, desayunos, especial
let s = S.getStatus(bog(2026, 11, 4, 10));
assert.equal(s.open, true);
assert.equal(s.moment, 'desayunos');
assert.equal(s.weekday, 3);

// Miércoles 12:30 → petit du jour
assert.equal(S.getStatus(bog(2026, 11, 4, 12, 30)).moment, 'petit');
// Jueves 15:00 → casa
assert.equal(S.getStatus(bog(2026, 11, 5, 15)).moment, 'casa');

// Domingo 8 nov 2026 → cerrado, abre mañana lunes 9 (no es festivo)
s = S.getStatus(bog(2026, 11, 8, 11));
assert.equal(s.open, false);
assert.equal(s.headline, 'Abrimos mañana a las 9:00 a. m.');

// Domingo 15 nov 2026 → lunes 16 es festivo → abre el martes
s = S.getStatus(bog(2026, 11, 15, 11));
assert.equal(s.headline, 'Abrimos el martes a las 9:00 a. m.');

// Lunes festivo 2 nov 2026
s = S.getStatus(bog(2026, 11, 2, 10));
assert.equal(s.open, false);
assert.equal(s.holiday, 'Todos los Santos');

// Sábado 7:30 → abre hoy
s = S.getStatus(bog(2026, 11, 7, 7, 30));
assert.equal(s.headline, 'Abrimos hoy a las 9:00 a. m.');

// Sábado 18:00 en punto → cerrado, abre el lunes
s = S.getStatus(bog(2026, 11, 7, 18));
assert.equal(s.open, false);
assert.equal(s.headline, 'Abrimos el lunes a las 9:00 a. m.');

// Pascua 2027 = 28 de marzo
assert.equal(S.easterSunday(2027).toISOString().slice(0, 10), '2027-03-28');

console.log('schedule: todas las pruebas pasaron');
