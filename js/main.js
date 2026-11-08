/*
 * Café de la Madeleine: interacción de la landing.
 * Depende de window.MadeleineSchedule (schedule.js) y window.MadeleineData (data.js).
 */
(function () {
  'use strict';

  var S = window.MadeleineSchedule;
  var D = window.MadeleineData;
  if (!S || !D) return;

  var root = document.documentElement;

  /* ---------- Utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'className') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  // Evita que "9:00 a. m." se parta entre líneas
  function nb(text) {
    return String(text)
      .replace(/(\d) ([ap])\. m\./g, '$1 $2. m.')
      .replace(/(\d) m\./g, '$1 m.');
  }

  function waUrl(message) {
    return 'https://wa.me/' + D.whatsapp + (message ? '?text=' + encodeURIComponent(message) : '');
  }

  // Escribe solo si cambió: evita que los lectores de pantalla repitan el texto cada minuto
  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  /**
   * Única fuente de los textos e imagen del especial para hoy (Bogotá).
   * Si el mes del especial ya pasó, devuelve textos genéricos: nunca se anuncia un plato vencido.
   */
  function specialView() {
    var sp = D.special;
    var today = S.todayKey(0);
    var day = 'Cada ' + sp.dayName;
    if (today >= sp.from && today <= sp.until) {
      return {
        dish: sp.name.toLowerCase(),
        kicker: 'Especial colombiano de ' + sp.month,
        name: sp.name, day: day, desc: sp.description,
        menuDesc: 'En ' + sp.month + ', ' + sp.name.toLowerCase() + ' todos los ' + sp.dayName + '.',
        cta: sp.cta, message: sp.message, img: sp.img, alt: sp.alt
      };
    }
    return {
      dish: 'especial colombiano',
      kicker: 'Especial colombiano',
      name: 'Un plato colombiano cada mes', day: day,
      desc: 'Cada mes la cocina prepara un plato tradicional colombiano al estilo de la casa. Pregunte cuál es el de este mes.',
      menuDesc: 'Un plato tradicional colombiano distinto cada mes, todos los ' + sp.dayName + '.',
      cta: 'Preguntar por el especial',
      message: 'Hola, ¿cuál es el especial colombiano de este mes?',
      img: sp.generic.img, alt: sp.generic.alt
    };
  }

  /** La carta con las piezas del especial resueltas (texto, etiqueta e imagen). */
  function resolveMenu() {
    var view = specialView();
    var dayTag = D.special.dayName.charAt(0).toUpperCase() + D.special.dayName.slice(1);
    return D.menu.map(function (section) {
      var out = Object.assign({}, section);
      if (section.specialImage) { out.img = view.img; out.alt = view.alt; }
      out.items = section.items.map(function (item) {
        return item.special
          ? Object.assign({}, item, { desc: view.menuDesc, tag: dayTag, img: view.img, alt: view.alt })
          : item;
      });
      return out;
    });
  }

  /* ---------- Enlaces de WhatsApp con mensaje ---------- */
  $all('[data-wa]').forEach(function (a) { a.href = waUrl(a.getAttribute('data-wa')); });

  /* ---------- Header y navegación móvil ---------- */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });

  /* ---------- Módulo "Ahora" ---------- */
  var nowBox = $('#now');
  var currentStatus = S.getStatus(new Date());

  var lastDayKey = null;

  function renderNow() {
    currentStatus = S.getStatus(new Date());
    nowBox.setAttribute('data-state', currentStatus.open ? 'open' : 'closed');
    setText($('[data-now="headline"]', nowBox), nb(currentStatus.headline));
    setText($('[data-now="detail"]', nowBox), nb(currentStatus.detail));

    var specialToday = currentStatus.open && currentStatus.weekday === D.special.weekday;
    var banner = $('[data-now="special"]', nowBox);
    banner.hidden = !specialToday;
    if (specialToday) {
      setText($('[data-now="special-text"]', nowBox),
        'Hoy es ' + S.DAY_NAMES[currentStatus.weekday] + ' de ' + specialView().dish + ' y hay unidades limitadas: ');
    }
    followMoment();
    markNowTab();
    markToday();

    // Al cambiar de día: fecha mínima del formulario, agenda y especial
    var dayKey = S.todayKey(0);
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      dateInput.min = S.todayKey(1);
      renderAgenda();
      renderSpecial();
    }
  }

  // Actualiza al cambiar el minuto
  function scheduleTick() {
    var ms = 60000 - (Date.now() % 60000) + 50;
    setTimeout(function () { renderNow(); scheduleTick(); }, ms);
  }

  /* ---------- Especial del mes ---------- */
  function renderSpecial() {
    var view = specialView();
    var cta = $('[data-special="cta"]');
    var img = $('[data-special="img"]');
    if (img.getAttribute('src') !== view.img) img.src = view.img;
    img.alt = view.alt;
    setText($('[data-special="kicker"]'), view.kicker);
    setText($('[data-special="name"]'), view.name);
    setText($('[data-special="day"]'), view.day);
    setText($('[data-special="description"]'), view.desc);
    setText(cta, view.cta);
    cta.href = waUrl(view.message);
  }

  /* ---------- Carta ---------- */
  var tabsBox = $('[data-menu="tabs"]');
  var panelsBox = $('[data-menu="panels"]');
  var photo = $('[data-menu="photo"]');
  var caption = $('[data-menu="caption"]');
  var tabs = [];
  var activeDish = null;
  var menu = resolveMenu(); // se arma al cargar; el especial vigente del día de apertura
  var userPickedTab = false; // si el visitante elige una pestaña, ya no la cambiamos solos
  var followedMoment = null;

  var photoRequest = 0;

  function setPhoto(src, alt) {
    var id = ++photoRequest; // solo la última petición puede pintar
    if (photo.getAttribute('src') === src) {
      photo.classList.remove('is-swapping');
      setText(caption, alt);
      return;
    }
    photo.classList.add('is-swapping');
    var pre = new Image();
    pre.onload = pre.onerror = function () {
      if (id !== photoRequest) return;
      photo.src = src;
      setText(caption, alt);
      requestAnimationFrame(function () { photo.classList.remove('is-swapping'); });
    };
    pre.src = src;
  }

  function selectTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.id === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#panel-' + t.dataset.id).hidden = !on;
      if (on && focus) t.focus();
    });
    var section = menu.filter(function (m) { return m.id === id; })[0];
    if (activeDish) activeDish.classList.remove('is-active');
    activeDish = null;
    setPhoto(section.img, section.alt);
  }

  menu.forEach(function (section) {
    var tab = el('button', {
      type: 'button',
      role: 'tab',
      id: 'tab-' + section.id,
      'aria-controls': 'panel-' + section.id,
      'aria-selected': 'false',
      tabindex: '-1',
      className: 'menu__tab'
    }, [
      el('span', { className: 'menu__tab-name', text: section.label }),
      el('span', { className: 'menu__tab-hours', text: nb(section.hours) })
    ]);
    tab.dataset.id = section.id;
    tab.addEventListener('click', function () { userPickedTab = true; selectTab(section.id, false); });
    tabsBox.appendChild(tab);
    tabs.push(tab);

    var list = el('ul', { className: 'menu__list' });
    section.items.forEach(function (item) {
      var top = el('span', { className: 'dish__top' }, [
        el('span', { className: 'dish__name', text: item.name }),
        item.tag ? el('span', { className: 'dish__tag', text: item.tag }) : null,
        item.price ? el('span', { className: 'dish__price', text: item.price }) : null
      ]);
      var desc = el('span', { className: 'dish__desc', text: item.desc });
      var li = el('li', { className: 'dish' });
      var inner;
      if (item.img) {
        inner = el('button', { type: 'button', className: 'dish__inner', 'aria-controls': 'menu-photo' }, [top, desc]);
        var show = function () {
          if (activeDish) activeDish.classList.remove('is-active');
          activeDish = li;
          li.classList.add('is-active');
          setPhoto(item.img, item.alt);
        };
        inner.addEventListener('mouseenter', show);
        inner.addEventListener('focus', show);
        inner.addEventListener('click', function () {
          show();
          // En móvil la foto queda arriba de la lista: la traemos a la vista
          if (window.matchMedia('(max-width: 960px)').matches) {
            photo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      } else {
        inner = el('div', { className: 'dish__inner' }, [top, desc]);
      }
      li.appendChild(inner);
      list.appendChild(li);
    });

    var panel = el('div', {
      role: 'tabpanel',
      id: 'panel-' + section.id,
      'aria-labelledby': 'tab-' + section.id,
      className: 'menu__panel'
    }, [list, section.note ? el('p', { className: 'menu__note', text: section.note }) : null]);
    panel.hidden = true;
    panelsBox.appendChild(panel);
  });

  // Teclado: flechas, Inicio y Fin entre pestañas
  tabsBox.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    userPickedTab = true;
    selectTab(tabs[next].dataset.id, true);
  });

  function markNowTab() {
    tabs.forEach(function (t) {
      var pill = $('.menu__now', t);
      var isNow = currentStatus.open && t.dataset.id === currentStatus.moment;
      if (isNow && !pill) $('.menu__tab-name', t).appendChild(el('span', { className: 'menu__now', text: 'Ahora' }));
      if (!isNow && pill) pill.remove();
    });
  }

  selectTab(currentStatus.open && currentStatus.moment ? currentStatus.moment : 'desayunos', false);
  followedMoment = currentStatus.moment;

  /** La pestaña sigue al momento del día (desayunos → petit → casa) mientras el visitante no elija otra. */
  function followMoment() {
    var m = currentStatus.open ? currentStatus.moment : null;
    if (userPickedTab || !m || m === followedMoment || !tabs.length) return;
    followedMoment = m;
    selectTab(m, false);
  }

  /* ---------- Agenda ---------- */
  function renderAgenda() {
    var list = $('[data-agenda="list"]');
    var today = S.todayKey(0);
    list.textContent = '';
    D.agenda
      .filter(function (ev) {
        if (ev.date && ev.date < today) return false;
        if (ev.until && ev.until < today) return false;
        return true;
      })
      .forEach(function (ev) {
        var title = el('h3', { className: 'agenda__title', text: ev.title });
        if (ev.with) title.appendChild(el('span', { className: 'agenda__with', text: ev.with }));
        var item = el('li', { className: 'agenda__item' }, [
          ev.date
            ? el('time', { className: 'agenda__when', datetime: ev.date, text: ev.when })
            : el('p', { className: 'agenda__when', text: ev.when }),
          el('div', null, [title, el('p', { className: 'agenda__desc', text: ev.desc })]),
          ev.cta
            ? el('a', { className: 'btn btn--line agenda__cta', href: waUrl(ev.message), target: '_blank', rel: 'noopener', text: ev.cta })
            : null
        ]);
        list.appendChild(item);
      });
  }

  /* ---------- Horario con hoy resaltado ---------- */
  var hoursBody = $('[data-hours="body"]');
  D.hours.forEach(function (h) {
    var row = el('tr', null, [
      el('th', { scope: 'row', text: h.day }),
      el('td', { text: nb(h.value) })
    ]);
    row.dataset.weekday = h.weekday;
    hoursBody.appendChild(row);
  });

  function markToday() {
    var todayWd = currentStatus.holiday ? 0 : currentStatus.weekday;
    $all('tr', hoursBody).forEach(function (row) {
      var isToday = Number(row.dataset.weekday) === todayWd;
      row.classList.toggle('is-today', isToday);
      var badge = $('.hours__today', row);
      if (isToday && !badge) $('th', row).appendChild(el('span', { className: 'hours__today', text: '(hoy)' }));
      if (!isToday && badge) badge.remove();
    });
  }

  /* ---------- Formulario de eventos → WhatsApp ---------- */
  var form = $('#event-form');
  var dateInput = $('#ev-date'); // su `min` (mañana) lo mantiene renderNow()

  function setError(input, show) {
    var msg = $('#' + input.id + '-error');
    input.setAttribute('aria-invalid', String(show));
    if (show) input.setAttribute('aria-describedby', msg.id);
    else input.removeAttribute('aria-describedby');
    msg.hidden = !show;
  }

  function validate() {
    var type = $('#ev-type');
    var people = $('#ev-people');
    var name = $('#ev-name');
    var n = Number(people.value);
    var checks = [
      [type, !type.value],
      [dateInput, !dateInput.value || dateInput.value < dateInput.min],
      [people, !people.value || !Number.isInteger(n) || n < 2 || n > 200],
      [name, !name.value.trim()]
    ];
    var firstBad = null;
    checks.forEach(function (c) {
      setError(c[0], c[1]);
      if (c[1] && !firstBad) firstBad = c[0];
    });
    return firstBad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); return; }
    var data = new FormData(form);
    var lines = [
      'Hola, soy ' + data.get('name').trim() + '. Quiero cotizar un evento en Café de la Madeleine.',
      'Tipo: ' + data.get('type'),
      'Fecha: ' + S.formatLongDate(data.get('date')),
      'Personas: ' + data.get('people')
    ];
    var notes = String(data.get('notes') || '').trim();
    if (notes) lines.push('Detalles: ' + notes);
    window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') validate();
  });

  /* ---------- Arranque ---------- */
  renderNow();
  scheduleTick();
  // Doble rAF: garantiza que el estado inicial se pinte antes de animar la entrada
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
  });
})();
