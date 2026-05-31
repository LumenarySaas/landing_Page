/* ============================================================
   Lumenary — logo mark geometry + animated loaders
   Self-contained. Star = 4-point "luminary". Ink + gold.
   ============================================================ */
(function () {
  "use strict";
  var TAU = Math.PI * 2;
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pal(dark) {
    return {
      ink: function (a) { return dark ? "rgba(241,237,224," + a + ")" : "rgba(27,26,22," + a + ")"; },
      gold: function (a) { return dark ? "rgba(216,184,104," + a + ")" : "rgba(154,122,51," + a + ")"; }
    };
  }

  /* 4-point star path (points: top/right/bottom/left, inner ratio 0.38) */
  function starPath(ctx, cx, cy, r, rot) {
    var inner = r * 0.38;
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = (rot || 0) - Math.PI / 2 + i / 8 * TAU;
      var rad = i % 2 === 0 ? r : inner;
      var x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function makeStreaks(R, n) {
    var s = [];
    for (var i = 0; i < (n || 6); i++) s.push({
      radius: R + 6 + Math.random() * 14, angle: Math.random() * TAU,
      speed: (1.0 + Math.random() * 1.5) * (Math.random() < 0.5 ? -1 : 1),
      span: 0.5 + Math.random() * 1.0, width: 0.6 + Math.random() * 1.1,
      alpha: 0.10 + Math.random() * 0.20
    });
    return s;
  }
  function whirl(ctx, t, cx, cy, streaks, inkFn, gain) {
    var SEG = 22; gain = gain == null ? 1 : gain;
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i], head = s.angle + s.speed * t;
      for (var k = 0; k < SEG; k++) {
        var f = k / SEG, a0 = head - s.span * f, a1 = head - s.span * (k + 1) / SEG;
        var fade = Math.pow(1 - f, 1.6);
        ctx.beginPath(); ctx.arc(cx, cy, s.radius, -a0, -a1, true);
        ctx.strokeStyle = inkFn(1); ctx.globalAlpha = s.alpha * fade * gain;
        ctx.lineWidth = s.width * (0.5 + 0.5 * fade); ctx.lineCap = "round"; ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- canvas manager ---- */
  function mount(canvas, anim) {
    var w, h, ctx, raf, last = 0, running = false;
    function size() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      var dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (anim.resize) anim.resize(w, h);
    }
    function frame(now) {
      var t = now / 1000, dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      ctx.clearRect(0, 0, w, h); anim.render(ctx, t, dt, w, h); raf = requestAnimationFrame(frame);
    }
    function play() { if (running || REDUCE) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size(); if (anim.init) anim.init(w, h);
    if (canvas.hasAttribute("data-frozen")) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 7.4, 0, w, h); return; }
    if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0, 0, w, h); }
    var io = new IntersectionObserver(function (e) { e[0].isIntersecting ? play() : stop(); }, { threshold: 0.04 });
    io.observe(canvas); play();
    var rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { size(); if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0, 0, w, h); } }, 120); });
  }

  /* ======================================================
     LOADER — hero: star breathes/rotates, souffle, gold arc
     ====================================================== */
  function hero(dark) {
    var P = pal(dark), streaks, cx, cy, R;
    function geo(w, h) { cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.20; streaks = makeStreaks(R * 1.3, 7); }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h) {
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.62, 0, TAU); ctx.strokeStyle = P.ink(0.10); ctx.lineWidth = 1.5; ctx.stroke();
        var a0 = t * 1.7, sweep = Math.PI * 0.5 + (Math.sin(t * 1.1) * 0.5 + 0.5) * Math.PI * 0.55;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.62, a0, a0 + sweep); ctx.strokeStyle = P.gold(0.95); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.stroke();
        whirl(ctx, t, cx, cy, streaks, P.ink, 1);
        var br = 1 + 0.05 * Math.sin(t * 1.8), rot = t * 0.5;
        starPath(ctx, cx, cy, R * br, rot); ctx.fillStyle = P.ink(0.06); ctx.fill();
        starPath(ctx, cx, cy, R * br, rot); ctx.fillStyle = P.ink(0.92); ctx.fill();
      }
    };
  }

  /* ======================================================
     LOADER — inline spinner (small): star + souffle, spins
     ====================================================== */
  function spinner(dark) {
    var P = pal(dark), streaks, cx, cy, R;
    function geo(w, h) { cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.30; streaks = makeStreaks(R * 1.05, 5); }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h) {
        whirl(ctx, t, cx, cy, streaks, P.ink, 1.15);
        starPath(ctx, cx, cy, R * (1 + 0.04 * Math.sin(t * 3)), t * 1.5);
        ctx.fillStyle = P.ink(0.92); ctx.fill();
      }
    };
  }

  /* ======================================================
     LOADER — determinate ring: gold arc fills, % readout
     ====================================================== */
  function progress(dark) {
    var P = pal(dark), cx, cy, R;
    function geo(w, h) { cx = w / 2; cy = h * 0.44; R = Math.min(w, h) * 0.19; }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h) {
        var cycle = (t % 3.4) / 3.4, pp = cycle < 0.82 ? cycle / 0.82 : 1;
        pp = 1 - Math.pow(1 - pp, 2);
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.66, 0, TAU); ctx.strokeStyle = P.ink(0.10); ctx.lineWidth = 2.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.66, -Math.PI / 2, -Math.PI / 2 + TAU * pp); ctx.strokeStyle = P.gold(0.95); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.stroke();
        starPath(ctx, cx, cy, R, 0); ctx.fillStyle = P.ink(0.92); ctx.fill();
        ctx.fillStyle = P.ink(0.45); ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(Math.round(pp * 100) + "%", cx, cy + R * 2.5);
      }
    };
  }

  var V = { hero: hero, spinner: spinner, progress: progress };

  function auto() {
    document.querySelectorAll("canvas[data-logo]").forEach(function (c) {
      var f = V[c.getAttribute("data-logo")];
      if (f) mount(c, f(c.hasAttribute("data-dark")));
    });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", auto); else auto();

  window.LumLogo = { mount: mount, variants: V, starPath: starPath };
})();
