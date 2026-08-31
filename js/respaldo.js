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

  function render(items) {
    var host = document.getElementById('respaldo-grid');
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<p class="muted">Estamos actualizando esta sección.</p>';
      return;
    }
    host.innerHTML = items.map(cardHtml).join('');
    bindPlayButtons(host);
    reveal(host);
  }

  async function loadRespaldo() {
    var host = document.getElementById('respaldo-grid');
    if (!host) return;
    try {
      var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var res = await client
        .from('marcas_respaldo')
        .select('marca,video_url,descripcion_corta')
        .eq('video_estado', 'cargado')
        .order('marca', { ascending: true });
      if (res.error) throw res.error;
      render(res.data || []);
    } catch (err) {
      host.innerHTML = '<p class="muted">No pudimos cargar esta sección ahora.</p>';
      console.error('marcas_respaldo:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadRespaldo);
})();
