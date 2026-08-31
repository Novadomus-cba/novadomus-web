(function () {
  'use strict';

  var SUPABASE_URL = 'https://vvwnyszcfindtuvojqgs.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d255c3pjZmluZHR1dm9qcWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzQ0OTYsImV4cCI6MjA5NzA1MDQ5Nn0.m88xRQjifgPayIBY8Y98fP4jQ1AzyrBJidZDyTamWxE';
  var WA_NUMBER = '543516747513';
  var CONSULTA_KEY = 'nd_vidriera_consulta';

  var allItems = [];
  var activeFamily = 'Todas';
  var searchQuery = '';
  var sortMode = 'nombre-asc';
  var consulta = [];

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

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

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
    } catch (e) {
      return '';
    }
  }

  // El dato viene en MAYÚSCULA cruda ("RELE BICANAL SHELLY..."). CSS text-transform:capitalize
  // no sirve acá: solo afecta la primera letra de cada palabra y no toca el resto, que ya está
  // en mayúscula — sobre un string 100% en mayúsculas no cambia nada visible. Se normaliza el
  // casing acá, solo para mostrar (nunca se pisa item.caracteristicas_principales ni se manda
  // nada distinto a ningún lado).
  function toDisplayCase(str) {
    return String(str || '').toLowerCase().replace(/(^|\s|\/|\()([a-záéíóúñ0-9])/g, function (m, sep, ch) {
      return sep + ch.toUpperCase();
    });
  }

  function featuresList(raw) {
    if (!raw) return [];
    return String(raw).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // ---------- localStorage: carrito de consulta ----------

  function loadConsulta() {
    try {
      var raw = localStorage.getItem(CONSULTA_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveConsulta() {
    try { localStorage.setItem(CONSULTA_KEY, JSON.stringify(consulta)); } catch (e) { /* storage full/blocked: cart just won't persist across reloads */ }
    updateCartFloatLabel();
    renderDrawer();
  }

  function addToConsulta(item) {
    if (consulta.some(function (c) { return c.id === item.id; })) return false;
    consulta.push({ id: item.id, nombre: item.nombre, marca: item.marca, precio_publico: item.precio_publico });
    saveConsulta();
    return true;
  }

  function removeFromConsulta(id) {
    consulta = consulta.filter(function (c) { return c.id !== id; });
    saveConsulta();
  }

  function clearConsulta() {
    consulta = [];
    saveConsulta();
  }

  function updateCartFloatLabel() {
    var el = document.getElementById('cart-float-label');
    if (el) el.textContent = 'Mi consulta (' + consulta.length + ')';
  }

  // ---------- focus trap (modal + drawer) ----------

  function trapFocus(container) {
    var selector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    function handler(e) {
      if (e.key !== 'Tab') return;
      var focusables = Array.prototype.filter.call(container.querySelectorAll(selector), function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handler);
    return function () { container.removeEventListener('keydown', handler); };
  }

  // ---------- ficha técnica (modal) ----------

  var pdOverlay, pdClose, pdAdd, pdWa, pdRemoveTrap, pdTrigger, pdCurrentItem;

  function openProductModal(item, triggerEl) {
    pdCurrentItem = item;
    pdTrigger = triggerEl || document.activeElement;

    document.getElementById('pd-photo').innerHTML = item.imagen_url
      ? '<a href="' + escapeHtml(item.imagen_url) + '" class="glightbox"><img src="' + escapeHtml(item.imagen_url) + '" alt="' + escapeHtml(item.nombre) + '"></a>'
      : '<span class="muted" style="font-size:.8rem;">Foto pendiente</span>';
    if (window.pdLightbox) window.pdLightbox.reload();
    document.getElementById('pd-fam').textContent = item.grupo || 'Otros';
    document.getElementById('pd-title').textContent = item.nombre || '';
    document.getElementById('pd-brand').textContent = item.marca || '';
    document.getElementById('pd-price').textContent = formatPrice(item.precio_publico);

    var featEl = document.getElementById('pd-features');
    var feats = featuresList(item.caracteristicas_principales);
    featEl.innerHTML = feats.map(function (f) { return '<li>' + escapeHtml(toDisplayCase(f)) + '</li>'; }).join('');

    var updated = formatDate(item.updated_at);
    document.getElementById('pd-updated').textContent = updated ? 'Precio actualizado: ' + updated : '';

    pdAdd.disabled = false;
    pdAdd.textContent = consulta.some(function (c) { return c.id === item.id; }) ? 'Ya está en tu consulta' : 'Agregar a consulta';
    pdWa.href = waLink('Hola Nova Domus, quiero consultar por el ' + item.nombre);

    pdOverlay.hidden = false;
    void pdOverlay.offsetWidth;
    pdOverlay.classList.add('open');
    document.body.classList.add('scroll-lock');
    pdRemoveTrap = trapFocus(document.getElementById('pd-dialog'));
    pdClose.focus();
    document.addEventListener('keydown', onPdKeydown, true);
  }

  function closeProductModal() {
    pdOverlay.classList.remove('open');
    document.body.classList.remove('scroll-lock');
    document.removeEventListener('keydown', onPdKeydown, true);
    if (pdRemoveTrap) { pdRemoveTrap(); pdRemoveTrap = null; }
    setTimeout(function () { pdOverlay.hidden = true; }, reducedMotion() ? 0 : 260);
    if (pdTrigger && typeof pdTrigger.focus === 'function') pdTrigger.focus();
  }

  function onPdKeydown(e) {
    if (e.key === 'Escape') closeProductModal();
  }

  function flashAdded(btn, originalLabel) {
    btn.disabled = true;
    btn.textContent = 'Agregado ✓';
    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }, 1400);
  }

  // ---------- drawer de consulta ----------

  var drawerOverlay, drawerEl, drawerRemoveTrap, drawerTrigger;

  function drawerItemHtml(c) {
    var full = allItems.find(function (i) { return i.id === c.id; });
    var img = full && full.imagen_url
      ? '<img src="' + escapeHtml(full.imagen_url) + '" alt="">'
      : '';
    return ''
      + '<div class="drawer-item">'
      + '  <div class="thumb">' + img + '</div>'
      + '  <div class="info"><b>' + escapeHtml(c.nombre) + '</b><span>' + escapeHtml(c.marca) + ' · ' + formatPrice(c.precio_publico) + '</span></div>'
      + '  <button class="remove" data-remove-id="' + c.id + '">Quitar</button>'
      + '</div>';
  }

  function renderDrawer() {
    var body = document.getElementById('drawer-body');
    var totalEl = document.getElementById('drawer-total-amount');
    var sendBtn = document.getElementById('drawer-send');
    var clearBtn = document.getElementById('drawer-clear');

    if (!consulta.length) {
      body.innerHTML = '<div class="drawer-empty">Todavía no agregaste productos. Explorá el catálogo y tocá "Agregar a consulta" en lo que te interese.</div>';
    } else {
      body.innerHTML = consulta.map(drawerItemHtml).join('');
    }
    var total = consulta.reduce(function (sum, c) { return sum + (Number(c.precio_publico) || 0); }, 0);
    totalEl.textContent = formatPrice(total);
    sendBtn.setAttribute('aria-disabled', consulta.length ? 'false' : 'true');
    clearBtn.disabled = !consulta.length;

    var lines = ['Hola Nova Domus, quiero consultar por estos productos:', ''];
    consulta.forEach(function (c) { lines.push(c.nombre + ' — ' + formatPrice(c.precio_publico)); });
    lines.push('', 'Gracias!');
    sendBtn.href = consulta.length ? waLink(lines.join('\n')) : waLink('Hola Nova Domus, quiero hacer una consulta');
  }

  function openDrawer(triggerEl) {
    drawerTrigger = triggerEl || document.activeElement;
    drawerOverlay.hidden = false;
    drawerEl.hidden = false;
    void drawerEl.offsetWidth;
    drawerOverlay.classList.add('open');
    drawerEl.classList.add('open');
    document.body.classList.add('scroll-lock');
    renderDrawer();
    drawerRemoveTrap = trapFocus(drawerEl);
    document.getElementById('drawer-close').focus();
    document.addEventListener('keydown', onDrawerKeydown, true);
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('open');
    drawerEl.classList.remove('open');
    document.body.classList.remove('scroll-lock');
    document.removeEventListener('keydown', onDrawerKeydown, true);
    if (drawerRemoveTrap) { drawerRemoveTrap(); drawerRemoveTrap = null; }
    var delay = reducedMotion() ? 0 : 320;
    setTimeout(function () { drawerOverlay.hidden = true; drawerEl.hidden = true; }, delay);
    if (drawerTrigger && typeof drawerTrigger.focus === 'function') drawerTrigger.focus();
  }

  function onDrawerKeydown(e) {
    if (e.key === 'Escape') closeDrawer();
  }

  // ---------- grilla plana: búsqueda, chips, orden ----------

  function cardHtml(item) {
    var nombre = escapeHtml(item.nombre);
    var marca = escapeHtml(item.marca);
    var grupo = escapeHtml(item.grupo || 'Otros');
    var img = item.imagen_url
      ? '<img src="' + escapeHtml(item.imagen_url) + '" alt="' + nombre + '">'
      : '<span class="muted" style="font-size:.75rem;text-align:center;padding:0 12px;">Foto pendiente</span>';
    var yaAgregado = consulta.some(function (c) { return c.id === item.id; });
    return ''
      + '<div class="prod-card" data-item-id="' + item.id + '" role="button" tabindex="0" aria-label="Ver ficha técnica de ' + nombre + '">'
      + '  <div class="prod-photo">' + img + '</div>'
      + '  <div class="prod-body">'
      + '    <span class="fam">' + grupo + '</span>'
      + '    <h3>' + nombre + '</h3>'
      + '    <span class="brand">' + marca + '</span>'
      + '    <span class="price">' + formatPrice(item.precio_publico) + '</span>'
      + '    <div class="prod-actions">'
      + '      <button type="button" class="btn btn-outline" data-view-id="' + item.id + '">Ver ficha técnica</button>'
      + '      <button type="button" class="btn btn-primary" data-add-id="' + item.id + '">' + (yaAgregado ? 'Agregado ✓' : 'Agregar a consulta') + '</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';
  }

  function getFilteredSorted() {
    var q = searchQuery.trim().toLowerCase();
    var list = allItems.filter(function (item) {
      if (activeFamily !== 'Todas' && (item.grupo || 'Otros') !== activeFamily) return false;
      if (!q) return true;
      return (item.nombre || '').toLowerCase().indexOf(q) !== -1 || (item.marca || '').toLowerCase().indexOf(q) !== -1;
    });
    list.sort(function (a, b) {
      switch (sortMode) {
        case 'marca-asc':
          return (a.marca || '').localeCompare(b.marca || '') || (a.nombre || '').localeCompare(b.nombre || '');
        case 'precio-asc':
          return (Number(a.precio_publico) || 0) - (Number(b.precio_publico) || 0);
        case 'precio-desc':
          return (Number(b.precio_publico) || 0) - (Number(a.precio_publico) || 0);
        default:
          return (a.nombre || '').localeCompare(b.nombre || '');
      }
    });
    return list;
  }

  function renderGrid() {
    var host = document.getElementById('vidriera-grid');
    var list = getFilteredSorted();
    if (!allItems.length) {
      host.innerHTML = '<div class="notice">Estamos actualizando el catálogo — volvé en un rato o <a href="contacto.html" style="color:var(--dorado);">escribinos directamente</a>.</div>';
      return;
    }
    if (!list.length) {
      host.innerHTML = '<div class="vid-empty">No encontramos productos con ese filtro. Probá otra búsqueda o <a href="contacto.html" style="color:var(--dorado);">consultanos directamente</a>.</div>';
      return;
    }
    host.innerHTML = '<div class="prod-grid">' + list.map(cardHtml).join('') + '</div>';
  }

  function renderChips() {
    var host = document.getElementById('vid-chips');
    var famSet = new Set();
    allItems.forEach(function (i) { famSet.add(i.grupo || 'Otros'); });
    var families = Array.from(famSet).sort(function (a, b) { return a.localeCompare(b); });
    var html = '<button type="button" class="vid-chip" data-fam="Todas" aria-pressed="' + (activeFamily === 'Todas') + '">Todas</button>';
    families.forEach(function (f) {
      html += '<button type="button" class="vid-chip" data-fam="' + escapeHtml(f) + '" aria-pressed="' + (activeFamily === f) + '">' + escapeHtml(f) + '</button>';
    });
    host.innerHTML = html;
  }

  // ---------- carga inicial ----------

  async function loadVidriera() {
    var host = document.getElementById('vidriera-grid');
    try {
      var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var res = await client
        .from('vidriera_publica')
        .select('id,nombre,marca,grupo,imagen_url,precio_publico,updated_at,caracteristicas_principales')
        .order('grupo', { ascending: true })
        .order('nombre', { ascending: true });
      if (res.error) throw res.error;
      allItems = res.data || [];
      renderChips();
      renderGrid();
    } catch (err) {
      host.innerHTML = '<div class="notice">No pudimos cargar el catálogo ahora. <a href="contacto.html" style="color:var(--dorado);">Escribinos</a> y te contamos qué tenemos disponible.</div>';
      console.error('vidriera_publica:', err);
    }
  }

  // ---------- wiring ----------

  function init() {
    consulta = loadConsulta();
    updateCartFloatLabel();

    if (window.GLightbox) window.pdLightbox = GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });

    pdOverlay = document.getElementById('pd-overlay');
    pdClose = document.getElementById('pd-close');
    pdAdd = document.getElementById('pd-add');
    pdWa = document.getElementById('pd-wa');
    drawerOverlay = document.getElementById('drawer-overlay');
    drawerEl = document.getElementById('drawer');

    document.getElementById('vid-search').addEventListener('input', function (e) {
      searchQuery = e.target.value;
      renderGrid();
    });
    document.getElementById('vid-sort').addEventListener('change', function (e) {
      sortMode = e.target.value;
      renderGrid();
    });
    document.getElementById('vid-chips').addEventListener('click', function (e) {
      var chip = e.target.closest('[data-fam]');
      if (!chip) return;
      var fam = chip.getAttribute('data-fam');
      activeFamily = activeFamily === fam ? 'Todas' : fam;
      renderChips();
      renderGrid();
    });

    var grid = document.getElementById('vidriera-grid');
    grid.addEventListener('click', function (e) {
      var addBtn = e.target.closest('[data-add-id]');
      if (addBtn) {
        var id = Number(addBtn.getAttribute('data-add-id'));
        var item = allItems.find(function (i) { return i.id === id; });
        if (item && addToConsulta(item)) flashAdded(addBtn, 'Agregar a consulta');
        else if (item) flashAdded(addBtn, 'Agregado ✓');
        return;
      }
      var viewBtn = e.target.closest('[data-view-id]');
      var card = e.target.closest('[data-item-id]');
      if (viewBtn || card) {
        var itemId = Number((viewBtn || card).getAttribute(viewBtn ? 'data-view-id' : 'data-item-id'));
        var full = allItems.find(function (i) { return i.id === itemId; });
        if (full) openProductModal(full, viewBtn || card || e.target);
      }
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('[data-item-id]');
      if (!card || e.target !== card) return;
      e.preventDefault();
      var itemId = Number(card.getAttribute('data-item-id'));
      var full = allItems.find(function (i) { return i.id === itemId; });
      if (full) openProductModal(full, card);
    });

    pdClose.addEventListener('click', closeProductModal);
    pdOverlay.addEventListener('click', function (e) { if (e.target === pdOverlay) closeProductModal(); });
    pdAdd.addEventListener('click', function () {
      if (!pdCurrentItem) return;
      if (addToConsulta(pdCurrentItem)) {
        pdAdd.disabled = true;
        pdAdd.textContent = 'Agregado ✓';
      }
    });

    document.getElementById('cart-float').addEventListener('click', function (e) { openDrawer(e.currentTarget); });
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', function (e) { if (e.target === drawerOverlay) closeDrawer(); });
    document.getElementById('drawer-body').addEventListener('click', function (e) {
      var removeBtn = e.target.closest('[data-remove-id]');
      if (!removeBtn) return;
      removeFromConsulta(Number(removeBtn.getAttribute('data-remove-id')));
    });
    document.getElementById('drawer-send').addEventListener('click', function (e) {
      if (!consulta.length) e.preventDefault();
    });
    document.getElementById('drawer-clear').addEventListener('click', function () {
      if (!consulta.length) return;
      if (window.confirm('¿Vaciar tu consulta? Vas a perder los ' + consulta.length + ' producto(s) agregados.')) clearConsulta();
    });

    loadVidriera();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
