(function () {
  'use strict';

  var SUPABASE_URL = 'https://vvwnyszcfindtuvojqgs.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d255c3pjZmluZHR1dm9qcWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzQ0OTYsImV4cCI6MjA5NzA1MDQ5Nn0.m88xRQjifgPayIBY8Y98fP4jQ1AzyrBJidZDyTamWxE';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function videoId(url) {
    var m = /embed\/([^?/]+)/.exec(String(url || ''));
    return m ? m[1] : '';
  }

  function playIconSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<circle cx="12" cy="12" r="11" fill="rgba(11,19,43,.7)" stroke="var(--dorado)" stroke-width="1.2"/>'
      + '<path d="M10 8l6 4-6 4z" fill="var(--crema)"/></svg>';
  }

  // Tarjeta con relato + video -- para "Marcas insignia" y "Audio" (los dos
  // subgrupos). Nunca se usa para Infraestructura, que es solo texto/wordmark.
  function cardHtml(item) {
    var id = escapeHtml(videoId(item.video_url));
    var marca = escapeHtml(item.marca);
    var desc = escapeHtml(item.descripcion_corta);
    return ''
      + '<div class="brand-card rv">'
      + '  <div class="brand-thumb" data-video-id="' + id + '" data-marca="' + marca + '" role="button" tabindex="0" aria-label="Reproducir video de ' + marca + '">'
      + '    <img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy">'
      + '    <span class="play-btn">' + playIconSvg() + '</span>'
      + '  </div>'
      + '  <div class="brand-body">'
      + '    <h3>' + marca + '</h3>'
      + '    <p>' + desc + '</p>'
      + '  </div>'
      + '</div>';
  }

  // Tarjeta compacta sin video -- para "Infraestructura" (soporte, no protagonismo).
  function infraCardHtml(item) {
    var marca = escapeHtml(item.marca);
    var desc = escapeHtml(item.descripcion_corta);
    return ''
      + '<div class="infra-card rv">'
      + '  <h3>' + marca + '</h3>'
      + '  <p>' + desc + '</p>'
      + '</div>';
  }

  function playVideo(thumb) {
    var id = thumb.getAttribute('data-video-id');
    var marca = thumb.getAttribute('data-marca');
    if (!id) return;
    thumb.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" title="Video ' + marca + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  }

  function bindPlayButtons(host) {
    host.querySelectorAll('.brand-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () { playVideo(thumb); });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playVideo(thumb); }
      });
      var img = thumb.querySelector('img');
      if (!img) return;
      var hide = function () { img.style.display = 'none'; };
      img.addEventListener('error', hide, { once: true });
      // youtube-nocookie sirve un placeholder gris de 120x90 (en vez de 404 real) cuando el id de video es inválido
      img.addEventListener('load', function () {
        if (img.naturalWidth <= 120) hide();
      }, { once: true });
    });
  }

  function reveal(host) {
    var items = host.querySelectorAll('.rv');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { obs.observe(el); });
  }

  // Agrupacion de marcas por rol real con Nova Domus (no por rubro tecnico) --
  // ver nova-domus-jerarquia-marcas-dispositivos.md y la investigacion de
  // jerarquia de marcas (13/09/2026, Propuesta A). Cada marca cae en UNA sola
  // grilla:
  //  - INSIGNIA: las 6 marcas headline, tarjeta con relato + video.
  //  - AUDIO_PREMIUM / AUDIO_REVENTA: dos canales de audio explicitos. Sonos y
  //    Bose van SIEMPRE en "equipos que instalamos", nunca en Insignia ni en
  //    Credenciales -- sus propios lineamientos de marca (Sonos Platform ToS
  //    §5, politica de marca de Bose) prohiben sugerir dealer/partnership sin
  //    certificacion escrita, y esta seccion los trata como mencion de
  //    producto/servicio, no como credencial.
  //  - INFRA: soporte, tarjeta compacta sin video (grilla monocroma).
  var INSIGNIA = ['CONTROL4', 'HOME ASSISTANT', 'SHELLY', 'YALE', 'PHILIPS HUE', 'HIKVISION'];
  var AUDIO_PREMIUM = ['VSSL'];
  var AUDIO_REVENTA = ['SONOS', 'BOSE'];
  var INFRA = ['TP-LINK', 'EZVIZ', 'SENSIBO'];
  // Ubiquiti: Tier 5 "no publicar" (nova-domus-jerarquia-marcas-dispositivos.md) — 0
  // apariciones en inventario real, compite con TP-Link Omada que es la línea vigente.
  var NO_PUBLICAR = ['UBIQUITI'];

  function norm(marca) { return (marca || '').toUpperCase(); }

  function pick(items, list) {
    return items
      .filter(function (i) { return list.indexOf(norm(i.marca)) !== -1; })
      .sort(function (a, b) { return list.indexOf(norm(a.marca)) - list.indexOf(norm(b.marca)); });
  }

  function renderInto(hostId, items, builder) {
    var host = document.getElementById(hostId);
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<p class="muted">Estamos actualizando esta sección.</p>';
      return;
    }
    host.innerHTML = items.map(builder).join('');
    if (builder === cardHtml) bindPlayButtons(host);
    reveal(host);
  }

  var HOST_IDS = ['insignia-grid', 'audio-premium-grid', 'audio-reventa-grid', 'infra-grid'];

  async function loadRespaldo() {
    if (!HOST_IDS.some(function (id) { return document.getElementById(id); })) return;
    try {
      var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var res = await client
        .from('marcas_respaldo')
        .select('marca,video_url,descripcion_corta')
        .eq('video_estado', 'cargado');
        // El orden real de cada grilla lo define pick() más abajo, no esta consulta.
      if (res.error) throw res.error;
      var items = (res.data || []).filter(function (i) {
        return NO_PUBLICAR.indexOf(norm(i.marca)) === -1;
      });

      renderInto('insignia-grid', pick(items, INSIGNIA), cardHtml);
      renderInto('audio-premium-grid', pick(items, AUDIO_PREMIUM), cardHtml);
      renderInto('audio-reventa-grid', pick(items, AUDIO_REVENTA), cardHtml);
      renderInto('infra-grid', pick(items, INFRA), infraCardHtml);
    } catch (err) {
      HOST_IDS.forEach(function (id) {
        var host = document.getElementById(id);
        if (host) host.innerHTML = '<p class="muted">No pudimos cargar esta sección ahora.</p>';
      });
      console.error('marcas_respaldo:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadRespaldo);
})();
