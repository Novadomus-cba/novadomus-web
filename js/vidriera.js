(function () {
  'use strict';

  var SUPABASE_URL = 'https://vvwnyszcfindtuvojqgs.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d255c3pjZmluZHR1dm9qcWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzQ0OTYsImV4cCI6MjA5NzA1MDQ5Nn0.m88xRQjifgPayIBY8Y98fP4jQ1AzyrBJidZDyTamWxE';

  // mismo orden que marcas.html — así la Vidriera y Marcas siempre coinciden visualmente
  var FAMILY_ORDER = [
    'Iluminación', 'Accesos', 'Seguridad', 'Redes', 'Control · Domótica',
    'Audio & Video', 'Clima', 'Obra Eléctrica', 'Accesorios'
  ];

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(n) {
    var rounded = Math.ceil(Number(n));
    return '$ ' + rounded.toLocaleString('es-AR');
  }

  function waLink(nombre) {
    var text = 'Hola Nova Domus, quiero consultar por el ' + nombre;
    return 'https://wa.me/543516747513?text=' + encodeURIComponent(text);
  }

  function cardHtml(item) {
    var nombre = escapeHtml(item.nombre);
    var marca = escapeHtml(item.marca);
    var grupo = escapeHtml(item.grupo);
    var img = item.imagen_url
      ? '<img src="' + escapeHtml(item.imagen_url) + '" alt="' + nombre + '">'
      : '<span class="muted" style="font-size:.75rem;text-align:center;padding:0 12px;">Foto pendiente</span>';
    return ''
      + '<div class="prod-card rv">'
      + '  <div class="prod-photo">' + img + '</div>'
      + '  <div class="prod-body">'
      + '    <span class="fam">' + grupo + '</span>'
      + '    <h3>' + nombre + '</h3>'
      + '    <span class="brand">' + marca + '</span>'
      + '    <span class="price">' + formatPrice(item.precio_publico) + '</span>'
      + '    <a class="btn btn-primary" href="' + waLink(item.nombre) + '" target="_blank" rel="noopener">Consultar por WhatsApp</a>'
      + '  </div>'
      + '</div>';
  }

  function groupByFamily(items) {
    var groups = {};
    items.forEach(function (item) {
      var key = item.grupo || 'Otros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }

  function render(items) {
    var host = document.getElementById('vidriera-grid');
    if (!items.length) {
      host.innerHTML = '<div class="notice">Estamos actualizando el catálogo — volvé en un rato o <a href="contacto.html" style="color:var(--dorado);">escribinos directamente</a>.</div>';
      return;
    }
    var groups = groupByFamily(items);
    var order = FAMILY_ORDER.filter(function (f) { return groups[f]; })
      .concat(Object.keys(groups).filter(function (f) { return FAMILY_ORDER.indexOf(f) === -1; }));

    var html = '';
    order.forEach(function (family) {
      html += '<h2 class="rv" style="margin:0 0 18px;font-size:1.1rem;">' + escapeHtml(family) + '</h2>';
      html += '<div class="prod-grid" style="margin-bottom:48px;">';
      groups[family].forEach(function (item) { html += cardHtml(item); });
      html += '</div>';
    });
    host.innerHTML = html;

    // reengancha el reveal-on-scroll del site.js para las cards nuevas
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      host.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    } else if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.15 });
      host.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
    }
  }

  async function loadVidriera() {
    var host = document.getElementById('vidriera-grid');
    try {
      var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var res = await client
        .from('vidriera_publica')
        .select('id,nombre,marca,grupo,imagen_url,precio_publico,updated_at')
        .order('grupo', { ascending: true })
        .order('nombre', { ascending: true });
      if (res.error) throw res.error;
      render(res.data || []);
    } catch (err) {
      host.innerHTML = '<div class="notice">No pudimos cargar el catálogo ahora. <a href="contacto.html" style="color:var(--dorado);">Escribinos</a> y te contamos qué tenemos disponible.</div>';
      console.error('vidriera_publica:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadVidriera);
})();
