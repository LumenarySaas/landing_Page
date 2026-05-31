/* ============================================================
   Lumenary — stablecoins, enlarged spin scene (monochrome)
   ============================================================ */
(function () {
  "use strict";
  var TAU = Math.PI * 2;
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function pal(dark) {
    return dark
      ? function (a) { return "rgba(241,237,224," + a + ")"; }
      : function (a) { return "rgba(27,26,22," + a + ")"; };
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeStreaks(R, n) {
    var s = [];
    for (var i = 0; i < (n || 7); i++) s.push({
      radius: R + 8 + Math.random() * 22, angle: Math.random() * TAU,
      speed: (0.8 + Math.random() * 1.5) * (Math.random() < 0.5 ? -1 : 1),
      span: 0.5 + Math.random() * 1.1, width: 0.6 + Math.random() * 1.4,
      alpha: 0.08 + Math.random() * 0.18
    });
    return s;
  }
  function whirl(ctx, t, cx, cy, streaks, ink, gain) {
    var SEG = 24; gain = gain == null ? 1 : gain;
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i], head = s.angle + s.speed * t;
      for (var k = 0; k < SEG; k++) {
        var f = k / SEG, a0 = head - s.span * f, a1 = head - s.span * (k + 1) / SEG, fade = Math.pow(1 - f, 1.6);
        ctx.beginPath(); ctx.arc(cx, cy, s.radius, -a0, -a1, true);
        ctx.strokeStyle = ink(1); ctx.globalAlpha = s.alpha * fade * gain;
        ctx.lineWidth = s.width * (0.5 + 0.5 * fade); ctx.lineCap = "round"; ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* one stablecoin, spun about its vertical axis by `angle` */
  function coin(ctx, cx, cy, r, angle, ink) {
    var fs = Math.abs(Math.cos(angle));   // face scale (1 = face, 0 = edge)
    var edge = 1 - fs;
    // reeded edge (visible near edge-on)
    if (edge > 0.02) {
      var E = r * 0.17;
      rr(ctx, cx - E / 2, cy - r * 0.985, E, r * 1.97, E / 2);
      ctx.globalAlpha = 0.07 * edge; ctx.fillStyle = ink(1); ctx.fill();
      ctx.globalAlpha = 0.5 * edge; ctx.strokeStyle = ink(1); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.globalAlpha = 0.45 * edge; ctx.lineWidth = 1;
      for (var yy = -r * 0.82; yy <= r * 0.82; yy += r * 0.13) {
        ctx.beginPath(); ctx.moveTo(cx - E / 2, cy + yy); ctx.lineTo(cx + E / 2, cy + yy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // face disc (ellipse foreshortened on x)
    var rx = Math.max(0.5, r * fs);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, r, 0, 0, TAU);
    ctx.fillStyle = ink(0.06); ctx.fill();
    ctx.strokeStyle = ink(0.55); ctx.lineWidth = 1.6; ctx.stroke();
    if (fs > 0.16) {
      var fa = (fs - 0.16) / 0.84;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(fs, 1);
      // inner ring
      ctx.globalAlpha = fa; ctx.strokeStyle = ink(0.25); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.stroke();
      // stud ring
      var studs = Math.max(16, Math.round(r * 0.5));
      for (var i = 0; i < studs; i++) {
        var a = i / studs * TAU;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, Math.max(0.8, r * 0.012), 0, TAU);
        ctx.fillStyle = ink(0.22); ctx.fill();
      }
      // $ glyph
      ctx.fillStyle = ink(0.9);
      ctx.font = "600 " + Math.round(r * 0.92) + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("$", 0, Math.round(r * 0.04));
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  function scene(dark) {
    var ink = pal(dark), cx, cy, R, streaks, sats;
    function geo(w, h) {
      cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.27;
      streaks = makeStreaks(R * 1.18, 7);
      sats = [];
      var n = 4;
      for (var i = 0; i < n; i++) sats.push({
        base: i / n * TAU, orbit: 0.18 + Math.random() * 0.06,
        spin: 1.6 + Math.random() * 1.4, phase: Math.random() * TAU,
        rad: R * 1.62, size: R * (0.34 + Math.random() * 0.06),
        squash: 0.78 + Math.random() * 0.08
      });
    }
    function drawSat(ctx, s, t) {
      var a = s.base + t * s.orbit;
      var x = cx + Math.cos(a) * s.rad, y = cy + Math.sin(a) * s.rad * s.squash;
      coin(ctx, x, y, s.size, t * s.spin + s.phase, ink);
      return { x: x, y: y, behind: Math.sin(a) < 0 };
    }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h) {
        // satellites behind
        for (var i = 0; i < sats.length; i++) { var a = sats[i].base + t * sats[i].orbit; if (Math.sin(a) < 0) drawSat(ctx, sats[i], t); }
        // souffle around the core
        whirl(ctx, t, cx, cy, streaks, ink, 1);
        // big central coin (the focal), spinning
        coin(ctx, cx, cy, R * (1 + 0.015 * Math.sin(t * 2)), t * 1.5, ink);
        // satellites in front
        for (i = 0; i < sats.length; i++) { var a2 = sats[i].base + t * sats[i].orbit; if (Math.sin(a2) >= 0) drawSat(ctx, sats[i], t); }
      }
    };
  }

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
    if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0.8, 0, w, h); }
    var io = new IntersectionObserver(function (e) { e[0].isIntersecting ? play() : stop(); }, { threshold: 0.04 });
    io.observe(canvas); play();
    var rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { size(); if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0.8, 0, w, h); } }, 120); });
  }

  function auto() {
    document.querySelectorAll("canvas[data-coins]").forEach(function (c) { mount(c, scene(c.hasAttribute("data-dark"))); });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", auto); else auto();
  window.LumCoins = { mount: mount, scene: scene };
})();
