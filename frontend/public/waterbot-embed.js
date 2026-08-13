/**
 * waterbot-embed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone embed script for the Waterbot widget.
 * This file is plain JS (no build step) so it can be served as-is from any
 * static host for inclusion in Drupal CMS pages.
 *
 * DEPLOYMENT STEPS FOR DRUPAL:
 *  1. Build the Waterbot React app and host it at a stable URL.
 *     The /widget route renders the embeddable widget in iframe mode.
 *  2. Copy this file to your static host as "waterbot-embed.js"
 *     (it is also served at /waterbot-embed.js by the Waterbot app itself).
 *  3. In each Drupal page (or in a global Drupal JS block), add:
 *
 *       <script
 *         src="https://YOUR-WATERBOT-DOMAIN/waterbot-embed.js"
 *         data-waterbot-url="https://YOUR-WATERBOT-DOMAIN/widget"
 *       ></script>
 *
 * OPTIONAL data attributes on the <script> tag:
 *   data-waterbot-url    Full URL to the /widget page (required for cross-origin)
 *   data-z-index         z-index for the iframe   (default: 999999)
 *   data-bottom          Bottom offset in px      (default: 24)
 *   data-right           Right offset in px       (default: 24)
 *   data-allowed-origin  Restrict postMessage to this origin (default: '*')
 *                        Set to your widget origin for production, e.g.
 *                        "https://widget.waterbot.az.gov"
 *
 * postMessage protocol — widget → host:
 *   { type: 'waterbot:resize', state: 'mascot' | 'nudge' | 'expanded' | 'enlarged', width?: number, height?: number }
 *     width/height are the widget's own measured content size for the
 *     mascot/nudge states (content-driven, e.g. the "Ask Blue" label).
 *     They're omitted for 'expanded'/'enlarged', where the host picks a
 *     fixed, viewport-aware chat-window size instead — see DESKTOP_SIZES
 *     below. 'enlarged' is the reader-friendly bigger panel size (the
 *     Maximize2/Minimize2 toggle in the panel header).
 *   { type: 'waterbot:open',   url: string }
 *
 * postMessage protocol — host → widget:
 *   { type: 'waterbot:scroll',      scrollY: number }
 *   { type: 'waterbot:query-state' }   (host asks widget to re-emit its current size)
 */

(function () {
  'use strict';

  /* ── Read config from <script> data attributes ── */
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var WIDGET_URL     = (currentScript && currentScript.getAttribute('data-waterbot-url'))    || (window.location.origin + '/widget');
  var Z_INDEX        = parseInt((currentScript && currentScript.getAttribute('data-z-index')) || '999999', 10);
  var BOTTOM_PX      = parseInt((currentScript && currentScript.getAttribute('data-bottom'))  || '24',     10);
  var RIGHT_PX       = parseInt((currentScript && currentScript.getAttribute('data-right'))   || '24',     10);
  /* A trailing slash here (e.g. "https://example.com/" instead of
     "https://example.com") silently breaks every postMessage check below —
     event.origin is never slash-terminated, so the comparison would just
     always fail with no error, no console warning, nothing — the widget
     would look "broken" (stuck at its initial fallback size) with zero clue
     why. Stripping a trailing slash defends against that easy-to-make typo. */
  var ALLOWED_ORIGIN = ((currentScript && currentScript.getAttribute('data-allowed-origin')) || '*').replace(/\/$/, '');

  /* ── Fallback iframe dimensions ────────────────────────────────────────────
     Used for the very first paint (before the widget has measured itself and
     posted back real numbers) and for the 'expanded' state, which is a fixed
     chat-window footprint rather than something the widget measures — it
     picks a size using the *host's* real viewport, which the widget (stuck
     inside its own, currently-tiny iframe) has no way to know.
     ────────────────────────────────────────────────────────────────────────── */
  var DESKTOP_SIZES = {
    mascot:   { w: 260, h: 300 },
    nudge:    { w: 260, h: 300 },
    expanded: { w: 380, h: 560 },
  };

  function isMobile() { return window.innerWidth < 600; }

  function getDimensions(state) {
    /* 'enlarged' mirrors the non-embedded panel's own CSS exactly (580px
       capped by calc(100vw - 3rem), height calc(100vh - 3rem)) — it's
       viewport-relative on every screen size, not just mobile, so it's
       computed here rather than living in DESKTOP_SIZES. */
    if (state === 'enlarged') {
      return {
        w: Math.min(window.innerWidth - 48, 580),
        h: window.innerHeight - 48,
      };
    }
    if (isMobile()) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      if (state === 'mascot')   return { w: 260, h: 300 };
      if (state === 'nudge')    return { w: Math.min(vw - 16, 280), h: 300 };
      if (state === 'expanded') return { w: Math.min(vw - 16, 380), h: Math.min(vh - 40, 560) };
    }
    return DESKTOP_SIZES[state] || DESKTOP_SIZES.mascot;
  }

  /* ── Create the iframe ── */
  var iframe = document.createElement('iframe');
  iframe.id    = 'waterbot-widget-iframe';
  iframe.src   = WIDGET_URL;
  iframe.title = 'Waterbot — Arizona Water Assistant';
  iframe.setAttribute('aria-label', 'Waterbot chat widget');
  iframe.setAttribute('scrolling', 'no');

  /*
   * Sandbox flags:
   *   allow-scripts      React app must run JS inside the iframe.
   *   allow-same-origin  Allows sessionStorage when widget and Drupal share origin.
   *                      Safe when cross-origin: flag has no effect across origins.
   *   allow-popups       Enables window.open() for "View on map" and resource links.
   *   allow-forms        Enables the text input form inside the widget.
   *   allow-downloads    Enables the "Download transcript" button (blob download).
   */
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-downloads');
  /* Permissions Policy: grants the "Copy" button access to navigator.clipboard.writeText(). */
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('allowtransparency', 'true');

  var initSize = getDimensions('mascot');
  iframe.style.cssText = [
    'position: fixed',
    'bottom: ' + BOTTOM_PX + 'px',
    'right: '  + RIGHT_PX  + 'px',
    'z-index: ' + Z_INDEX,
    'width: '   + initSize.w + 'px',
    'height: '  + initSize.h + 'px',
    'border: none',
    'background: transparent',
    'pointer-events: auto',
    'transition: width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1)',
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

  /* ── Scroll relay: host page → widget ──────────────────────────────────────
     RAF throttled so we never send more than one message per animation frame.
     ────────────────────────────────────────────────────────────────────────── */
  var rafPending = false;
  window.addEventListener('scroll', function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'waterbot:scroll', scrollY: window.scrollY || window.pageYOffset },
          ALLOWED_ORIGIN
        );
      }
      rafPending = false;
    });
  }, { passive: true });

  /* ── Receive messages from the widget iframe ──────────────────────────────
     event.source must be this exact iframe's window — without that check,
     this listener (registered on the shared parent window) would also react
     to messages from any *other* embedded widget on the same host page (e.g.
     map-waterbot-embed.js), since they use the same message type strings.
     ────────────────────────────────────────────────────────────────────────── */
  window.addEventListener('message', function (event) {
    if (event.source !== iframe.contentWindow) return;
    /* Origin guard — skip if sender doesn't match allowed origin */
    if (ALLOWED_ORIGIN !== '*' && event.origin !== ALLOWED_ORIGIN) return;

    var data = event.data;
    if (!data || typeof data !== 'object') return;

    /* Resize the iframe when widget state changes */
    if (data.type === 'waterbot:resize' && data.state) {
      /* mascot/nudge: trust the widget's own measured size over any guess.
         expanded/enlarged: the widget doesn't report a size (see protocol
         note above) — always fall through to the host's viewport-aware
         default for those. */
      var isMeasured = (data.state === 'mascot' || data.state === 'nudge') && data.width && data.height;
      var dim = isMeasured
        ? { w: data.width, h: data.height }
        : getDimensions(data.state);
      iframe.style.width  = dim.w + 'px';
      iframe.style.height = dim.h + 'px';

      /* On mobile, pull the iframe closer to the edge for nudge/expanded/enlarged states */
      iframe.style.right = (isMobile() && data.state !== 'mascot')
        ? '8px'
        : RIGHT_PX + 'px';
    }

    /* Open URLs in the host page's context (fallback when allow-popups is absent) */
    if (data.type === 'waterbot:open' && data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  });

  /* ── Recompute iframe size on viewport resize ─────────────────────────────
     We ask the widget to re-emit its current state; the resize handler above
     then applies the correct dimensions for the new viewport size.
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
