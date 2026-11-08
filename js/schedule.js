/*
 * Horario de Café de la Madeleine.
 * Funciones puras: no tocan el DOM. Funcionan en el navegador (window.MadeleineSchedule)
 * y en Node (module.exports) para poder probarlas.
 *
 * Bogotá está en UTC-5 todo el año (sin horario de verano), así que la hora local
 * se obtiene restando 5 h al instante UTC y leyendo los campos getUTC*.
 */
(function (root) {
  'use strict';

  var BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;
  var OPEN_MIN = 9 * 60;    // 9:00 a. m.
  var CLOSE_MIN = 18 * 60;  // 6:00 p. m.

  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // Momentos del día. `tab` coincide con el id de la pestaña de la carta.
  var MOMENTS = [
    { id: 'desayunos', from: OPEN_MIN, to: 12 * 60, label: 'Sirviendo desayunos hasta las ' + formatTime(12 * 60) },
    { id: 'petit', from: 12 * 60, to: 14 * 60, label: 'Petit du Jour hasta las ' + formatTime(14 * 60) + ', mientras haya unidades.' },
    { id: 'casa', from: 14 * 60, to: CLOSE_MIN, label: 'Carta de la casa, pastelería y café hasta las ' + formatTime(CLOSE_MIN) }
  ];

  /** Fecha "de pared" en Bogotá: un objeto con año, mes (1-12), día, día de semana y minutos. */
  function bogotaParts(date) {
    var d = new Date(date.getTime() + BOGOTA_OFFSET_MS);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      weekday: d.getUTCDay(),
      minutes: d.getUTCHours() * 60 + d.getUTCMinutes()
    };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  /** Clave YYYY-MM-DD del día en Bogotá, desplazada `offsetDays` días. */
  function todayKey(offsetDays, now) {
    var p = bogotaParts(new Date((now ? now.getTime() : Date.now()) + (offsetDays || 0) * 86400000));
    return key(p.year, p.month, p.day);
  }

  /** '2026-12-04' → 'viernes 4 de diciembre de 2026' */
  function formatLongDate(iso) {
    var parts = iso.split('-').map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return DAY_NAMES[d.getUTCDay()] + ' ' + parts[2] + ' de ' + MONTH_NAMES[parts[1] - 1] + ' de ' + parts[0];
  }

  /** Domingo de Pascua (algoritmo gregoriano anónimo). Devuelve Date en UTC a medianoche. */
  function easterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function addDays(utcDate, n) {
    return new Date(utcDate.getTime() + n * 86400000);
  }

  /** Si la fecha no es lunes, la corre al lunes siguiente (Ley Emiliani). */
  function toNextMonday(utcDate) {
    var wd = utcDate.getUTCDay();
    var shift = wd === 1 ? 0 : (8 - wd) % 7;
    return addDays(utcDate, shift);
  }

  function utcKey(d) { return key(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }

  var holidayCache = {};

  /** Festivos de Colombia para un año: { 'YYYY-MM-DD': 'Nombre' }. */
  function holidaysFor(year) {
    if (holidayCache[year]) return holidayCache[year];
    var list = {};
    function fixed(m, d, name) { list[key(year, m, d)] = name; }
    function moved(m, d, name) { list[utcKey(toNextMonday(new Date(Date.UTC(year, m - 1, d))))] = name; }

    fixed(1, 1, 'Año Nuevo');
    moved(1, 6, 'Reyes Magos');
    moved(3, 19, 'San José');
    fixed(5, 1, 'Día del Trabajo');
    moved(6, 29, 'San Pedro y San Pablo');
    fixed(7, 20, 'Independencia');
    fixed(8, 7, 'Batalla de Boyacá');
    moved(8, 15, 'Asunción de la Virgen');
    moved(10, 12, 'Día de la Raza');
    moved(11, 1, 'Todos los Santos');
    moved(11, 11, 'Independencia de Cartagena');
    fixed(12, 8, 'Inmaculada Concepción');
    fixed(12, 25, 'Navidad');

    var easter = easterSunday(year);
    list[utcKey(addDays(easter, -3))] = 'Jueves Santo';
    list[utcKey(addDays(easter, -2))] = 'Viernes Santo';
    list[utcKey(addDays(easter, 43))] = 'Ascensión del Señor';
    list[utcKey(addDays(easter, 64))] = 'Corpus Christi';
    list[utcKey(addDays(easter, 71))] = 'Sagrado Corazón';

    holidayCache[year] = list;
    return list;
  }

  function holidayName(parts) {
    return holidaysFor(parts.year)[key(parts.year, parts.month, parts.day)] || null;
  }

  function isOpenDay(parts) {
    return parts.weekday !== 0 && !holidayName(parts);
  }

  /** Próxima apertura a partir de `date` (exclusiva si ya está abierto). */
  function nextOpening(date) {
    var p = bogotaParts(date);
    if (isOpenDay(p) && p.minutes < OPEN_MIN) {
      return { parts: p, today: true, tomorrow: false };
    }
    for (var i = 1; i <= 14; i++) {
      var q = bogotaParts(new Date(date.getTime() + i * 86400000));
      if (isOpenDay(q)) return { parts: q, today: false, tomorrow: i === 1 };
    }
    return null;
  }

  function formatTime(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h === 12 && m === 0) return '12:00 m.';
    var suffix = h < 12 ? 'a. m.' : 'p. m.';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + pad(m) + ' ' + suffix;
  }

  /**
   * Estado del café en un instante.
   * @returns {{open:boolean, headline:string, detail:string, moment:string|null,
   *            holiday:string|null, weekday:number}}
   */
  function getStatus(date) {
    var p = bogotaParts(date || new Date());
    var holiday = holidayName(p);
    var openDay = isOpenDay(p);
    var open = openDay && p.minutes >= OPEN_MIN && p.minutes < CLOSE_MIN;

    var moment = null;
    for (var i = 0; i < MOMENTS.length; i++) {
      if (p.minutes >= MOMENTS[i].from && p.minutes < MOMENTS[i].to) moment = MOMENTS[i];
    }

    if (open) {
      return {
        open: true,
        headline: 'Abierto hasta las ' + formatTime(CLOSE_MIN),
        detail: moment.label,
        moment: moment.id,
        holiday: null,
        weekday: p.weekday
      };
    }

    var next = nextOpening(date || new Date());
    var at = ' a las ' + formatTime(OPEN_MIN);
    var when;
    if (!next) when = 'pronto';
    else if (next.today) when = 'hoy' + at;
    else if (next.tomorrow) when = 'mañana' + at;
    else when = 'el ' + DAY_NAMES[next.parts.weekday] + at;

    var reason;
    if (holiday) reason = 'Hoy es festivo (' + holiday + ').';
    else if (p.weekday === 0) reason = 'Los domingos el jardín descansa.';
    else if (p.minutes < OPEN_MIN) reason = 'Todavía estamos horneando.';
    else reason = 'Ya cerramos la cocina por hoy.';

    return {
      open: false,
      headline: 'Abrimos ' + when,
      detail: reason,
      moment: null,
      holiday: holiday,
      weekday: p.weekday
    };
  }

  var api = {
    getStatus: getStatus,
    holidaysFor: holidaysFor,
    easterSunday: easterSunday,
    bogotaParts: bogotaParts,
    formatTime: formatTime,
    todayKey: todayKey,
    formatLongDate: formatLongDate,
    MOMENTS: MOMENTS,
    DAY_NAMES: DAY_NAMES,
    MONTH_NAMES: MONTH_NAMES
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MadeleineSchedule = api;
})(typeof window !== 'undefined' ? window : globalThis);
