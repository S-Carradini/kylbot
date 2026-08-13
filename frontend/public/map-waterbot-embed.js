/**
 * map-waterbot-embed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone embed script for the Waterbot *map sidebar* widget — a pill
 * (Home + "Ask Blue", matching the pill already used on the main site's own
 * /map screen) that opens into the real, backend-connected Blue chat panel
 * docked as a sidebar. It renders NO map of its own — it's meant to sit on
 * top of a map that already exists on the host page (e.g. an ArcGIS
 * Experience embed).
 *
 * IMPORTANT — layout tradeoff: to keep the pill vertically centered
 * regardless of where it sits on the host page, this widget's iframe spans
 * the full page height (top:0 to bottom:0), right-anchored. That means the
 * iframe covers a full-height vertical strip along the host page's right
 * edge at all times (collapsed: just wide enough for the pill; expanded:
 * pill + a 360px chat sidebar). If the host's own map has controls (zoom,
 * legend, layer list) on the right edge, this widget will sit on top of and
 * block them — check your target page before relying on this in production.
 *
 * This is a separate, independent widget from waterbot-embed.js (the small
 * corner chat widget). Both can be included on the same page — see the
 * data-right notes below for how to avoid them overlapping.
 *
 * DEPLOYMENT STEPS FOR DRUPAL:
 *  1. Build the Waterbot React app and host it at a stable URL.
 *     The /map-widget route renders this widget in iframe mode.
 *  2. Copy this file to your static host as "map-waterbot-embed.js"
 *     (it is also served at /map-waterbot-embed.js by the Waterbot app itself).
 *  3. In each Drupal page (or in a global Drupal JS block), add:
 *
 *       <script
 *         src="https://YOUR-WATERBOT-DOMAIN/map-waterbot-embed.js"
 *         data-waterbot-url="https://YOUR-WATERBOT-DOMAIN/map-widget"
 *       ></script>
 *
 * OPTIONAL data attributes on the <script> tag:
 *   data-waterbot-url    Full URL to the /map-widget page (required for cross-origin)
 *   data-z-index         z-index for the iframe   (default: 999999)
 *   data-right           Right offset in px        (default: 24)
 *   data-allowed-origin  Restrict postMessage to this origin (default: '*')
 *                        Set to your widget origin for production, e.g.
 *                        "https://widget.waterbot.az.gov"
 *
 * postMessage protocol — widget → host:
 *   { type: 'waterbot:resize', state: 'collapsed' | 'expanded', width: number }
 *     Height is not part of the protocol — the iframe is always full page
 *     height via CSS (top:0;bottom:0), so only width changes.
 *   { type: 'waterbot:open',   url: string }
 *
 * postMessage protocol — host → widget:
 *   { type: 'waterbot:query-state' }   (host asks widget to re-emit its current size)
 */

(function () {
  'use strict';

  /* ── Read config from <script> data attributes ── */
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var WIDGET_URL     = (currentScript && currentScript.getAttribute('data-waterbot-url'))    || (window.location.origin + '/map-widget');
  var Z_INDEX        = parseInt((currentScript && currentScript.getAttribute('data-z-index')) || '999999', 10);
  var RIGHT_PX       = parseInt((currentScript && currentScript.getAttribute('data-right'))   || '24',     10);
  /* A trailing slash here (e.g. "https://example.com/" instead of
     "https://example.com") silently breaks every postMessage check below —
     event.origin is never slash-terminated, so the comparison would just
     always fail with no error, no console warning, nothing — the widget
     would look "broken" (stuck at its initial fallback size) with zero clue
     why. Stripping a trailing slash defends against that easy-to-make typo. */
  var ALLOWED_ORIGIN = ((currentScript && currentScript.getAttribute('data-allowed-origin')) || '*').replace(/\/$/, '');

  /* Fallback widths — used for the very first paint, before the widget has
     measured itself and posted back a real number. */
  var FALLBACK_WIDTH = { collapsed: 150, expanded: 520 };

  /* ── Create the iframe ── */
  var iframe = document.createElement('iframe');
  iframe.id    = 'waterbot-map-widget-iframe';
  iframe.src   = WIDGET_URL;
  iframe.title = 'Waterbot — Arizona Water map assistant';
  iframe.setAttribute('aria-label', 'Waterbot map sidebar widget');
  iframe.setAttribute('scrolling', 'no');

  /*
   * Sandbox flags:
   *   allow-scripts      React app must run JS inside the iframe.
   *   allow-same-origin  Allows sessionStorage when widget and Drupal share origin.
   *                      Safe when cross-origin: flag has no effect across origins.
   *   allow-popups       Enables window.open() for the Home button and resource links.
   *   allow-forms        Enables the text input form inside the widget.
   *   allow-downloads    Enables the "Download transcript" button (blob download).
   */
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-downloads');
  /* Permissions Policy: grants the "Copy" button access to navigator.clipboard.writeText(). */
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('allowtransparency', 'true');

  iframe.style.cssText = [
    'position: fixed',
    'top: 0',
    /* height must be explicit — an absolutely/fixed-positioned iframe
       (a replaced element) with top+bottom but no height does NOT stretch
       to fill the gap the way a <div> would; it falls back to the browser's
       default intrinsic iframe size (300x150). 100vh is what actually spans
       the viewport. */
    'height: 100vh',
    'right: ' + RIGHT_PX + 'px',
    'z-index: ' + Z_INDEX,
    /* The widget opens with its chat panel already visible (see
       MapWidgetPage.tsx), so the first paint should start at the expanded
       width — otherwise there'd be a visible flash of a too-narrow iframe
       before the widget's own resize message corrects it. */
    'width: '   + FALLBACK_WIDTH.expanded + 'px',
    'border: none',
    'background: transparent',
    'pointer-events: auto',
    'transition: width 0.3s cubic-bezier(0.4,0,0.2,1)',
    'overflow: hidden',
  ].join('; ');

  /* Append immediately if body exists; otherwise wait for DOMContentLoaded */
  if (document.body) {
    document.body.appendChild(iframe);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(iframe);
    });
  }

  /* ── Receive messages from the widget iframe ──────────────────────────────
     event.source must be this exact iframe's window — without that check,
     this listener (registered on the shared parent window) would also react
     to messages from any *other* embedded widget on the same host page (e.g.
     waterbot-embed.js), since they use the same message type strings.
     ────────────────────────────────────────────────────────────────────────── */
  window.addEventListener('message', function (event) {
    if (event.source !== iframe.contentWindow) return;
    /* Origin guard — skip if sender doesn't match allowed origin */
    if (ALLOWED_ORIGIN !== '*' && event.origin !== ALLOWED_ORIGIN) return;

    var data = event.data;
    if (!data || typeof data !== 'object') return;

    /* Resize the iframe's width when widget state changes. Clamp to the
       viewport so a full-width mobile screen can't overflow horizontally. */
    if (data.type === 'waterbot:resize' && data.state) {
      var w = data.width || FALLBACK_WIDTH[data.state] || FALLBACK_WIDTH.collapsed;
      iframe.style.width = Math.min(w, window.innerWidth - 16) + 'px';
    }

    /* Open URLs in the host page's context (fallback when allow-popups is absent) */
    if (data.type === 'waterbot:open' && data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  });

  /* ── Recompute iframe size on viewport resize ─────────────────────────────
     We ask the widget to re-emit its current state; the resize handler above
     then applies the correct width for the new viewport size.
     ────────────────────────────────────────────────────────────────────────── */
  var resizeDebounce;
  window.addEventListener('resize', function () {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(function () {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'waterbot:query-state' }, ALLOWED_ORIGIN);
      }
    }, 120);
  });

})();
