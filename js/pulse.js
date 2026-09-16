// pulse.js
// Minimal, dependency-free traffic pulse for nova-domus.com.ar. Sends pageview/
// whatsapp/form events to the site-pulse Edge Function so Agustin can see traffic
// in his personal panel. Never blocks rendering and never breaks a link or the
// contact form if the request fails.
(function () {
  'use strict';

  var HOSTS = ['nova-domus.com.ar', 'www.nova-domus.com.ar'];
  var ENDPOINT = 'https://vvwnyszcfindtuvojqgs.supabase.co/functions/v1/site-pulse';
  var FLAG_KEY = 'nd_interno';

  // Local/dev guard: only runs on the real production hostnames.
  if (HOSTS.indexOf(location.hostname) === -1) return;

  // Internal-traffic opt-out. ?nd_interno=1 sets the flag for this browser
  // (persists across pages/sessions via localStorage), ?nd_interno=0 clears it.
  var params = new URLSearchParams(location.search);
  if (params.has('nd_interno')) {
    try {
      if (params.get('nd_interno') === '0') localStorage.removeItem(FLAG_KEY);
      else localStorage.setItem(FLAG_KEY, '1');
    } catch (e) { /* localStorage unavailable: nothing to persist, continue as external visitor */ }
  }

  var isInternal = false;
  try { isInternal = localStorage.getItem(FLAG_KEY) === '1'; } catch (e) { /* default to false */ }
  if (isInternal) return;

  function referrerHost() {
    if (!document.referrer) return null;
    try { return new URL(document.referrer).host || null; } catch (e) { return null; }
  }

  function send(kind) {
    try {
      var body = JSON.stringify({
        kind: kind,
        path: location.pathname,
        referrer_host: referrerHost()
      });
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () { /* never surface a network error to the visitor */ });
    } catch (e) { /* guard: this script must never break the page */ }
  }

  function sendPageview() {
    send('pageview');
  }

  function schedulePageview() {
    if ('requestIdleCallback' in window) requestIdleCallback(sendPageview);
    else setTimeout(sendPageview, 1);
  }

  if (document.readyState === 'complete') schedulePageview();
  else window.addEventListener('load', schedulePageview);

  // Delegated click listener: fires on any real <a href="https://wa.me/...">
  // click (nav CTA, floating button, inline links). Does not intercept the
  // click, the link still opens WhatsApp normally.
  document.addEventListener('click', function (e) {
    var target = e.target;
    var link = target && target.closest ? target.closest('a[href*="wa.me"]') : null;
    if (link) send('whatsapp');
  });

  // Contact form: sends 'form' only, never 'whatsapp', even though the form's
  // own submit handler opens wa.me afterwards (window.open, not an <a> click,
  // so it does not also trigger the listener above -- no double counting).
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function () { send('form'); });
})();
