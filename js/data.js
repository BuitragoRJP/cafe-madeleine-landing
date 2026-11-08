/*
 * Contenido editable de la página. Para cambiar el especial del mes o la agenda,
 * se edita solo este archivo.
 * Fuente: publicaciones de @cafedelamadeleine (nov 2026). Solo se muestran los precios
 * que el café ha publicado.
 */
(function (root) {
  'use strict';

  var WHATSAPP = '573242423145';

  // Especial colombiano: se sirve cada semana el día `weekday` (0 = domingo … 3 = miércoles).
  // `from`/`until` (YYYY-MM-DD) delimitan el mes: fuera de ese rango la página habla del
  // "especial del mes" sin nombrar el plato, para no anunciar algo vencido.
  var special = {
    from: '2026-11-01',
    until: '2026-11-30',
    month: 'noviembre',
    weekday: 3,
    dayName: 'miércoles', // nombre del día `weekday`; lunes a viernes no cambian en plural
    name: 'Ajiaco santafereño',
    description:
      'La sopa bogotana al estilo de la casa: pollo desmechado, mazorca, aguacate y arroz blanco, con crema de leche, alcaparras y picadillo de cebolla y cilantro.',
    img: 'assets/img/ajiaco.jpg',
    alt: 'Ajiaco servido en olla negra con mazorca, acompañado de arroz, crema de leche, alcaparras y picadillo',
    cta: 'Reservar ajiaco del miércoles',
    message: 'Hola, quiero reservar ajiaco para este miércoles. Somos __ personas.',
    // Imagen y textos cuando el mes del especial ya pasó: un plato colombiano de la casa, sin anunciar el vencido
    generic: {
      img: 'assets/img/tamal-posta.jpg',
      alt: 'Tamal de posta cartagenera, uno de los platos colombianos de la casa'
    }
  };

  // Pestañas de la carta. `id` coincide con los momentos de schedule.js.
  var menu = [
    {
      id: 'desayunos',
      label: 'Desayunos',
      hours: '9:00 a. m. a 12:00 m.',
      img: 'assets/img/waffles-pandeyuca.jpg',
      alt: 'Waffles de pandeyuca con fresas, arándanos y salsa de frutos rojos',
      items: [
        { name: 'Petit Déjeuner', desc: 'Huevos batidos, pericos o fritos; pan de masa madre o arepitas de tres maíces; americano y jugo natural.', price: '$28.000' },
        { name: 'Waffles de pandeyuca', desc: 'Con frutos rojos.', img: 'assets/img/waffles-pandeyuca.jpg', alt: 'Waffles de pandeyuca con fresas, arándanos y salsa de frutos rojos' },
        { name: 'Huevos shakshuka', desc: 'Horneados en salsa de tomate, con pan de masa madre.', img: 'assets/img/shakshuka.jpg', alt: 'Shakshuka en sartén de hierro con albahaca y una tajada de pan de masa madre' },
        { name: 'Huevos fritos con hogao', desc: 'Con pan de masa madre.', img: 'assets/img/huevos-hogao.jpg', alt: 'Dos huevos fritos en sartén pequeña con hogao y pan tostado' },
        { name: 'Arepitas de tres maíces', desc: 'Cariaco, negrito y azul, con huevos pericos.' },
        { name: 'Tamal de posta cartagenera', desc: 'Receta de la costa caribe, envuelto en hoja de plátano.', tag: 'Favorito del equipo', img: 'assets/img/tamal-posta.jpg', alt: 'Tamal de posta cartagenera sobre hoja de plátano en plato negro' }
      ]
    },
    {
      id: 'petit',
      label: 'Petit du Jour',
      hours: '12:00 m. a 2:00 p. m.',
      specialImage: true, // la foto del tab es la del especial vigente
      items: [
        { name: 'Petit du Jour', desc: 'El plato del día de la cocina. Cambia a diario y hay unidades limitadas.', tag: 'Unidades limitadas' },
        { name: 'Especial colombiano del mes', special: true } // textos e imagen salen de `special`
      ]
    },
    {
      id: 'casa',
      label: 'De la casa',
      hours: 'Jornada continua',
      img: 'assets/img/falafel.jpg',
      alt: 'Plato de falafel con ensalada, tzatziki y pan pita frente a helechos del jardín',
      items: [
        { name: 'Hamburguesa Madeleine', desc: 'La hamburguesa de la casa.', tag: 'Favorito del equipo' },
        { name: 'Pollo achiotado', desc: 'Marinado en achiote.', tag: 'Favorito del equipo' },
        { name: 'Costillas BBQ', desc: 'Costillas de cerdo en salsa barbecue.', tag: 'Favorito del equipo' },
        { name: 'Entrecot', desc: 'El corte clásico del bistró francés.', tag: 'Favorito del equipo' },
        { name: 'Mejillones al vino', desc: 'Cocinados en vino blanco.', tag: 'Favorito del equipo' },
        { name: 'Chorizo con arepas de tres maíces', desc: 'Chorizo artesanal hecho y ahumado en casa.', tag: 'Favorito del equipo' },
        { name: 'Encocado del Pacífico', desc: 'Con leche de coco, al estilo de la costa pacífica colombiana.' },
        { name: 'Falafel', desc: 'Crocante por fuera y suave por dentro, con ensalada y tzatziki de guatila.', tag: 'Vegetariano', img: 'assets/img/falafel.jpg', alt: 'Plato de falafel con ensalada, tzatziki y pan pita' }
      ]
    },
    {
      id: 'pasteleria',
      label: 'Pastelería',
      hours: 'Todo el día',
      img: 'assets/img/madeleines-pistacho.jpg',
      alt: 'Madeleines de pistacho con brillo dorado',
      items: [
        { name: 'Madeleines de pistacho', desc: 'Nuestro postre insignia, bañado en chocolate.', img: 'assets/img/madeleines-pistacho.jpg', alt: 'Madeleines de pistacho con brillo dorado' },
        { name: 'Madeleines de temporada', desc: 'Chocolate blanco y frambuesa, chocolate y arándanos, y ahora de Navidad.', img: 'assets/img/madeleines-navidad.jpg', alt: 'Bandeja de madeleines bañadas en chocolate con decoración navideña' },
        { name: 'Torta de chocolate y frutos del bosque', desc: 'Mermelada de frutos del bosque, ganache semiamargo y nibs de cacao.', img: 'assets/img/torta-chocolate-frutos.jpg', alt: 'Torta de chocolate con ganache en espiral y frutos rojos deshidratados' },
        { name: 'Torta de chocolate', desc: 'La clásica de la casa, en capas.', img: 'assets/img/torta-chocolate.jpg', alt: 'Porción de torta de chocolate de tres capas en plato de porcelana' },
        { name: 'Torta de zanahoria', desc: 'Frosting de suero costeño y granola hecha en casa.', img: 'assets/img/torta-zanahoria.jpg', alt: 'Torta de zanahoria entera con frosting y granola' },
        { name: 'Crème brûlée', desc: 'Con arequipe o mermelada de frutos rojos de Miss Mor.', img: 'assets/img/creme-brulee.jpg', alt: 'Varias crème brûlée con fresas vistas desde arriba' }
      ],
      note: 'Para acompañar: café colombiano en prensa, té, chai, chocolate, aromáticas y vino por copa.'
    }
  ];

  // Agenda. `date` (evento de un día) o `until` (temporada), en YYYY-MM-DD: se ocultan cuando pasan.
  var agenda = [
    {
      date: '2026-11-22',
      when: 'Domingo 22 de noviembre',
      title: 'Brunch con Causa',
      with: 'con Pazósfera',
      desc: 'Un menú preparado por personas que recuperaron la libertad y se formaron en los talleres de Cocina Viva: mimosa Madeleine, caldo de sobrebarriga con pandebonos, mini croque monsieur, chorizo ahumado en casa y crepes con frutos rojos.',
      cta: 'Reservar puesto',
      message: 'Hola, quiero reservar puesto para el Brunch con Causa del domingo 22 de noviembre. Somos __ personas.'
    },
    {
      until: special.until,
      when: 'Todos los ' + special.dayName + ' de ' + special.month,
      title: special.name,
      desc: 'El especial colombiano del mes. Hay unidades limitadas, así que conviene reservar.',
      cta: 'Reservar',
      message: special.message
    },
    {
      when: 'Una vez al mes',
      title: 'SABERES',
      with: 'con @gabbyluescobar',
      desc: 'Conversatorio en el jardín: un tema distinto cada mes, con panelistas y asistentes intercambiando ideas de manera libre y respetuosa.',
      cta: 'Preguntar fecha',
      message: 'Hola, ¿cuándo es el próximo SABERES en el jardín?'
    },
    {
      when: 'En el jardín',
      title: 'Los Vinilos',
      desc: 'Música en vinilo para acompañar la tarde, el café y la copa.',
      cta: 'Preguntar fecha',
      message: 'Hola, ¿cuándo es la próxima sesión de Los Vinilos?'
    },
    {
      when: 'Mientras dure el álbum',
      title: 'Álbum de Teusaquillo',
      desc: 'Somos una de las historias del álbum de la Alcaldía Local. Trae tus monitas para intercambiar y quédate a un café.'
    }
  ];

  var hours = [
    { day: 'Lunes', weekday: 1, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Martes', weekday: 2, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Miércoles', weekday: 3, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Jueves', weekday: 4, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Viernes', weekday: 5, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Sábado', weekday: 6, value: '9:00 a. m. a 6:00 p. m.' },
    { day: 'Domingo y festivos', weekday: 0, value: 'Cerrado' }
  ];

  root.MadeleineData = {
    whatsapp: WHATSAPP,
    special: special,
    menu: menu,
    agenda: agenda,
    hours: hours
  };
})(window);
