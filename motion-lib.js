/* ============================================================
   Lumenary — Monochrome Motion library
   One ink, many opacities. Time-based. Souffle signature.
   ============================================================ */
(function () {
  "use strict";

  /* ---- ink scale (rgb of #1B1A16) ---- */
  var INK = "27,26,22";
  function ink(a) { return "rgba(" + INK + "," + a + ")"; }
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TAU = Math.PI * 2;

  /* ---------- canvas manager ---------- */
  function mount(canvas, anim) {
    var w, h, ctx, raf, last = 0, running = false, hover = 0, hoverT = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      var dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (anim.resize) anim.resize(w, h);
    }
    function frame(now) {
      var t = now / 1000;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      hover += (hoverT - hover) * Math.min(1, dt * 6);
      ctx.clearRect(0, 0, w, h);
      anim.render(ctx, t, dt, w, h, hover, ink);
      raf = requestAnimationFrame(frame);
    }
    function play() { if (running || REDUCE) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    if (anim.init) anim.init(w, h);
    if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0, 0, w, h, 0, ink); }
    var io = new IntersectionObserver(function (e) { e[0].isIntersecting ? play() : stop(); }, { threshold: 0.04 });
    io.observe(canvas); play();
    var host = canvas.closest("[data-hoverable]") || canvas;
    host.addEventListener("pointerenter", function () { hoverT = 1; });
    host.addEventListener("pointerleave", function () { hoverT = 0; });
    var rz; addEventListener("resize", function () {
      clearTimeout(rz); rz = setTimeout(function () {
        size(); if (REDUCE) { ctx.clearRect(0, 0, w, h); anim.render(ctx, 0, 0, w, h, 0, ink); }
      }, 120);
    });
    return { play: play, stop: stop };
  }

  /* ---------- souffle: comet-trail whirl ---------- */
  function makeStreaks(R, n) {
    var s = [];
    for (var i = 0; i < (n || 7); i++) s.push({
      radius: R + 8 + Math.random() * 18,
      angle: Math.random() * TAU,
      speed: (0.9 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1),
      span: 0.5 + Math.random() * 1.1,
      width: 0.6 + Math.random() * 1.3,
      alpha: 0.10 + Math.random() * 0.22
    });
    return s;
  }
  function drawWhirl(ctx, t, cx, cy, streaks, gain) {
    var SEG = 24; gain = gain == null ? 1 : gain;
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i], head = s.angle + s.speed * t;
      for (var k = 0; k < SEG; k++) {
        var f = k / SEG;
        var a0 = head - s.span * f, a1 = head - s.span * (k + 1) / SEG;
        var fade = Math.pow(1 - f, 1.6);
        ctx.beginPath();
        ctx.arc(cx, cy, s.radius, -a0, -a1, true);
        ctx.strokeStyle = "rgba(" + INK + ",1)";
        ctx.globalAlpha = s.alpha * fade * gain;
        ctx.lineWidth = s.width * (0.5 + 0.5 * fade);
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 4-point Lumenary star */
  function star(ctx, cx, cy, r, a) {
    var inner = r * 0.36;
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var ang = i / 8 * TAU - Math.PI / 2;
      var rad = i % 2 === 0 ? r : inner;
      var x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = ink(a); ctx.fill();
  }

  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function money(v) { return "+$" + Math.round(v).toLocaleString("en-US"); }

  /* ======================================================
     COMPARATOR — DeFi (live, solid) vs TradFi (flat, dashed)
     ====================================================== */
  function compareChart() {
    var pad = { l: 52, r: 96, t: 28, b: 40 }, N = 120, t0 = null, streaks;
    var DEFI = 15720, TRAD = 3240, kD = 1.85, kT = 0.32;
    function valD(f) { return DEFI * (Math.exp(kD * f) - 1) / (Math.exp(kD) - 1); }
    function valT(f) { return TRAD * (Math.exp(kT * f) - 1) / (Math.exp(kT) - 1); }
    return {
      init: function () { streaks = makeStreaks(12, 5); t0 = null; },
      render: function (ctx, t, dt, w, h, hov) {
        if (t0 === null) t0 = t;
        var p = easeOut(Math.min(1, (t - t0) / 1.9));
        if (REDUCE) p = 1;
        var x0 = pad.l, x1 = w - pad.r, yb = h - pad.b, yt = pad.t, maxV = DEFI * 1.08;
        function X(f) { return x0 + (x1 - x0) * f; }
        function Y(v) { return yb - (v / maxV) * (yb - yt); }
        // y grid + labels
        ctx.font = "10px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        var ty = [0, 5000, 10000, 15000];
        for (var i = 0; i < ty.length; i++) {
          var gy = Y(ty[i]);
          ctx.strokeStyle = ink(0.08); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke();
          ctx.fillStyle = ink(0.25); ctx.fillText(ty[i] === 0 ? "$0" : "+$" + (ty[i] / 1000) + "k", x0 - 10, gy);
        }
        // x labels
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        var xl = ["M0", "M3", "M6", "M9", "M12"];
        for (i = 0; i < xl.length; i++) { ctx.fillStyle = ink(0.25); ctx.fillText(xl[i], X(i / 4), yb + 9); }
        var nP = Math.max(1, Math.round(N * p)), f;
        // gap shading (advantage area)
        ctx.beginPath();
        for (i = 0; i <= nP; i++) { f = i / N; ctx.lineTo(X(f), Y(valD(f))); }
        for (i = nP; i >= 0; i--) { f = i / N; ctx.lineTo(X(f), Y(valT(f))); }
        ctx.closePath(); ctx.fillStyle = ink(0.05); ctx.fill();
        // TradFi: dashed, faint, flat
        ctx.setLineDash([4, 5]); ctx.strokeStyle = ink(0.34); ctx.lineWidth = 1.4;
        ctx.beginPath(); for (i = 0; i <= nP; i++) { f = i / N; i ? ctx.lineTo(X(f), Y(valT(f))) : ctx.moveTo(X(f), Y(valT(f))); } ctx.stroke();
        ctx.setLineDash([]);
        // DeFi: solid, sharp ink
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.8; ctx.lineJoin = "round";
        ctx.beginPath(); for (i = 0; i <= nP; i++) { f = i / N; i ? ctx.lineTo(X(f), Y(valD(f))) : ctx.moveTo(X(f), Y(valD(f))); } ctx.stroke();
        var fp = nP / N, hxD = X(fp), hyD = Y(valD(fp)), hyT = Y(valT(fp));
        // gap connector + live delta
        ctx.setLineDash([2, 3]); ctx.strokeStyle = ink(0.4); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hxD, hyT); ctx.lineTo(hxD, hyD); ctx.stroke(); ctx.setLineDash([]);
        var dv = valD(fp) - valT(fp), my = (hyT + hyD) / 2;
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.font = "600 13px 'JetBrains Mono', ui-monospace, monospace"; ctx.fillStyle = ink(0.9);
        ctx.fillText(money(dv), hxD + 9, my - 1);
        ctx.font = "9px 'JetBrains Mono', ui-monospace, monospace"; ctx.fillStyle = ink(0.25);
        ctx.fillText("D'\u00c9CART", hxD + 9, my + 11);
        // TradFi end dot
        ctx.beginPath(); ctx.arc(hxD, hyT, 2.4, 0, TAU); ctx.fillStyle = ink(0.45); ctx.fill();
        // DeFi focal: souffle + comet head
        drawWhirl(ctx, t, hxD, hyD, streaks, 0.85 + hov * 1.0);
        ctx.beginPath(); ctx.arc(hxD, hyD, 3.2 + 0.3 * Math.sin(t * 1.6), 0, TAU); ctx.fillStyle = ink(0.9); ctx.fill();
      }
    };
  }

  /* spinning stablecoin (edge-on flip via x-scale) */
  function drawCoin(ctx, x, y, r, flip, alpha) {
    var sx = Math.abs(Math.cos(flip));
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.05, sx), 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = ink(0.55 * alpha); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.strokeStyle = ink(0.2 * alpha); ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    if (sx > 0.4) {
      var fa = alpha * ((sx - 0.4) / 0.6);
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
      ctx.fillStyle = ink(0.9 * fa);
      ctx.font = "600 " + Math.round(r * 1.15) + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("$", 0, Math.round(r * 0.06));
      ctx.restore();
    }
  }

  /* ======================================================
     HERO FOCAL — Option C: vault + stablecoins
     ====================================================== */
  function vault() {
    var cx, cy, R, streaks, coins;
    function geo(w, h) {
      cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.26;
      streaks = makeStreaks(R * 0.5, 7);
      coins = [];
      var n = 7;
      for (var i = 0; i < n; i++) coins.push({
        ang: i / n * TAU, orbit: 0.10 + Math.random() * 0.05,
        spin: 1.3 + Math.random() * 1.1, phase: Math.random() * TAU,
        rad: R * (1.30 + Math.random() * 0.14), size: R * 0.17
      });
    }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h, hov) {
        // ghost orbit ring (structure)
        ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.36, R * 1.12, 0, 0, TAU); ctx.stroke();
        // vault door frame
        ctx.strokeStyle = ink(0.25); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
        ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, TAU); ctx.stroke();
        // bolts around the door
        for (var b = 0; b < 16; b++) {
          var ba = b / 16 * TAU;
          ctx.beginPath(); ctx.arc(cx + Math.cos(ba) * R * 0.93, cy + Math.sin(ba) * R * 0.93, 1.3, 0, TAU);
          ctx.fillStyle = ink(0.25); ctx.fill();
        }
        // rotating lock wheel spokes
        var rot = t * 0.25;
        ctx.strokeStyle = ink(0.25); ctx.lineWidth = 1.4; ctx.lineCap = "round";
        for (var s = 0; s < 6; s++) {
          var sa = rot + s / 6 * TAU;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sa) * R * 0.66, cy + Math.sin(sa) * R * 0.66); ctx.stroke();
        }
        // souffle near the core
        drawWhirl(ctx, t, cx, cy, streaks, 1 + hov * 1.1);
        // hub + star
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, TAU); ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, TAU); ctx.strokeStyle = ink(0.55); ctx.lineWidth = 1; ctx.stroke();
        star(ctx, cx, cy, R * 0.1 * (1 + 0.04 * Math.sin(t * 1.4)), 0.9);
        // orbiting, flipping stablecoins (elliptical orbit for depth)
        for (var i = 0; i < coins.length; i++) {
          var c = coins[i];
          var a = c.ang + t * c.orbit * (1 + hov * 0.6);
          var x = cx + Math.cos(a) * c.rad, y = cy + Math.sin(a) * c.rad * 0.82;
          drawCoin(ctx, x, y, c.size, t * c.spin + c.phase, 1);
        }
      }
    };
  }

  /* ======================================================
     HERO FOCAL — Option A: rails network
     ====================================================== */
  function rails() {
    var labels = ["Morpho", "Arbitrum", "Interac", "FINTRAC", "Privy", "Chainlink"];
    var cx, cy, R, streaks;
    function geo(w, h) { cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.34; streaks = makeStreaks(Math.min(w, h) * 0.13, 7); }
    return {
      init: geo, resize: geo,
      render: function (ctx, t, dt, w, h, hov) {
        var N = labels.length, core = Math.min(w, h) * 0.105;
        ctx.font = "10px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        var pts = [];
        for (var i = 0; i < N; i++) {
          var a = -Math.PI / 2 + i / N * TAU;
          var rr = R * (1 + 0.02 * Math.sin(t * 0.7 + i));
          pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, a: a });
        }
        // ghost ring + spokes (structure, ink-12)
        ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
        for (i = 0; i < N; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
        // settlement pulses travelling inward (sharp ink)
        for (i = 0; i < N; i++) {
          var prog = (t * 0.32 + i / N) % 1;
          var px = pts[i].x + (cx - pts[i].x) * prog, py = pts[i].y + (cy - pts[i].y) * prog;
          ctx.beginPath(); ctx.arc(px, py, 2.1, 0, TAU); ctx.fillStyle = ink(0.9 * (1 - prog * 0.35)); ctx.fill();
        }
        // satellite nodes + labels (secondary, ink-25/55)
        for (i = 0; i < N; i++) {
          ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 3.4, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
          ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 8, 0, TAU); ctx.strokeStyle = ink(0.25); ctx.lineWidth = 1; ctx.stroke();
          var lx = cx + Math.cos(pts[i].a) * (R + 24), ly = cy + Math.sin(pts[i].a) * (R + 24);
          ctx.fillStyle = ink(0.32); ctx.fillText(labels[i], lx, ly);
        }
        // souffle around core (intensifies on hover)
        drawWhirl(ctx, t, cx, cy, streaks, 1 + hov * 1.3);
        // core fill + frame + star
        ctx.beginPath(); ctx.arc(cx, cy, core, 0, TAU); ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, core, 0, TAU); ctx.strokeStyle = ink(0.55); ctx.lineWidth = 1; ctx.stroke();
        star(ctx, cx, cy, core * 0.52 * (1 + 0.04 * Math.sin(t * 1.4)), 0.9);
      }
    };
  }

  /* ======================================================
     HERO FOCAL — Option B: breathing yield curve
     ====================================================== */
  function yieldCurve() {
    var streaks, N = 140;
    return {
      init: function () { streaks = makeStreaks(13, 5); },
      render: function (ctx, t, dt, w, h, hov) {
        var padX = 46, top = h * 0.20, base = h * 0.80;
        // grid (structure ink-08)
        ctx.strokeStyle = ink(0.08); ctx.lineWidth = 1;
        for (var g = 1; g < 4; g++) { var gy = top + (base - top) * g / 4; ctx.beginPath(); ctx.moveTo(padX, gy); ctx.lineTo(w - padX, gy); ctx.stroke(); }
        var path = [], i, f, x, y;
        for (i = 0; i < N; i++) {
          f = i / (N - 1);
          x = padX + (w - 2 * padX) * f;
          var rise = Math.pow(f, 1.45);
          var breath = 0.045 * Math.sin(t * 0.8 + f * 5.5) * f;
          y = base - (rise + breath) * (base - top);
          path.push({ x: x, y: y });
        }
        // area fill (ink-06)
        ctx.beginPath(); ctx.moveTo(path[0].x, base);
        for (i = 0; i < N; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.lineTo(path[N - 1].x, base); ctx.closePath(); ctx.fillStyle = ink(0.06); ctx.fill();
        // baseline (ink-12)
        ctx.strokeStyle = ink(0.12); ctx.beginPath(); ctx.moveTo(padX, base); ctx.lineTo(w - padX, base); ctx.stroke();
        // main curve (sharp ink-90)
        ctx.beginPath(); for (i = 0; i < N; i++) i ? ctx.lineTo(path[i].x, path[i].y) : ctx.moveTo(path[i].x, path[i].y);
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.stroke();
        // head comet + souffle
        var hp = path[N - 1];
        drawWhirl(ctx, t, hp.x, hp.y, streaks, 1 + hov * 1.2);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 3.2, 0, TAU); ctx.fillStyle = ink(0.9); ctx.fill();
      }
    };
  }

  /* ======================================================
     TILE 1 — Synthèse: live sparkline
     ====================================================== */
  function sparkline() {
    var streaks;
    return {
      init: function () { streaks = makeStreaks(7, 3); },
      render: function (ctx, t, dt, w, h, hov) {
        var padX = 16, base = h * 0.74, top = h * 0.26, N = 90, sp = 0.8 + hov * 0.9;
        var path = [], i, f, x, y;
        for (i = 0; i < N; i++) {
          f = i / (N - 1); x = padX + (w - 2 * padX) * f;
          var v = 0.5 + 0.30 * Math.sin(f * 6 + t * sp) + 0.16 * Math.sin(f * 13 - t * sp * 1.3) + 0.06 * Math.sin(f * 23 + t);
          v = v * 0.5 + f * 0.34; // gentle upward drift
          y = base - v * (base - top);
          path.push({ x: x, y: y });
        }
        ctx.beginPath(); ctx.moveTo(path[0].x, base);
        for (i = 0; i < N; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.lineTo(path[N - 1].x, base); ctx.closePath(); ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.beginPath(); for (i = 0; i < N; i++) i ? ctx.lineTo(path[i].x, path[i].y) : ctx.moveTo(path[i].x, path[i].y);
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.4; ctx.lineJoin = "round"; ctx.stroke();
        var hp = path[N - 1];
        drawWhirl(ctx, t, hp.x, hp.y, streaks, 0.7 + hov * 1.4);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 2.6, 0, TAU); ctx.fillStyle = ink(0.9); ctx.fill();
      }
    };
  }

  /* ======================================================
     TILE 2 — Centrale Fiscale: ledger cells filling
     ====================================================== */
  function ledger() {
    return {
      render: function (ctx, t, dt, w, h, hov) {
        var cols = 6, rows = 4, m = 16, gap = 6;
        var cw = (w - 2 * m - (cols - 1) * gap) / cols;
        var ch = (h - 2 * m - (rows - 1) * gap) / rows;
        var period = 4.2 / (1 + hov * 0.8);
        var phase = (t % period) / period; // 0..1
        var total = cols * rows;
        var lead = phase * (total + 6);
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var idx = r * cols + c;
          var x = m + c * (cw + gap), y = m + r * (ch + gap);
          ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cw, ch);
          var fillAmt = Math.max(0, Math.min(1, lead - idx));
          if (fillAmt > 0) {
            ctx.fillStyle = ink(0.06 + 0.05 * fillAmt); ctx.fillRect(x, y, cw, ch);
            // entry line
            ctx.strokeStyle = ink(0.55 * fillAmt); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 4, y + ch * 0.5); ctx.lineTo(x + cw * (0.3 + 0.5 * fillAmt), y + ch * 0.5); ctx.stroke();
          }
        }
        // sweeping check column head (sharp ink)
        var hc = Math.floor(lead) % cols, hr = Math.floor(Math.floor(lead) / cols);
        if (hr < rows) {
          var hx = m + hc * (cw + gap), hy = m + hr * (ch + gap);
          ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.4; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(hx + cw * 0.30, hy + ch * 0.52);
          ctx.lineTo(hx + cw * 0.44, hy + ch * 0.66);
          ctx.lineTo(hx + cw * 0.70, hy + ch * 0.36);
          ctx.stroke();
        }
      }
    };
  }

  /* ======================================================
     TILE 3 — Sécurité: radial waves + shield
     ====================================================== */
  function shield() {
    return {
      render: function (ctx, t, dt, w, h, hov) {
        var cx = w / 2, cy = h / 2, maxR = Math.min(w, h) * 0.46;
        var sp = 0.32 + hov * 0.22;
        // radial waves (souffle variant)
        for (var i = 0; i < 4; i++) {
          var ph = (t * sp + i / 4) % 1;
          var rr = ph * maxR;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU);
          ctx.strokeStyle = "rgba(" + INK + ",1)";
          ctx.globalAlpha = 0.28 * (1 - ph);
          ctx.lineWidth = 1 + (1 - ph);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // shield outline (sharp ink-90)
        var s = Math.min(w, h) * 0.20 * (1 + 0.03 * Math.sin(t * 1.6));
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s * 0.82, cy - s * 0.5);
        ctx.lineTo(cx + s * 0.82, cy + s * 0.18);
        ctx.quadraticCurveTo(cx + s * 0.82, cy + s * 0.86, cx, cy + s * 1.05);
        ctx.quadraticCurveTo(cx - s * 0.82, cy + s * 0.86, cx - s * 0.82, cy + s * 0.18);
        ctx.lineTo(cx - s * 0.82, cy - s * 0.5);
        ctx.closePath();
        ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.4; ctx.lineJoin = "round"; ctx.stroke();
        // check
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.34, cy + s * 0.05);
        ctx.lineTo(cx - s * 0.08, cy + s * 0.32);
        ctx.lineTo(cx + s * 0.40, cy - s * 0.30);
        ctx.stroke();
      }
    };
  }

  /* ======================================================
     TILE 4 — Paiements: two-way ramp flow
     ====================================================== */
  function flow() {
    return {
      render: function (ctx, t, dt, w, h, hov) {
        var m = 18, y1 = h * 0.38, y2 = h * 0.62, sp = 0.18 + hov * 0.16;
        // channels
        ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
        [y1, y2].forEach(function (yy) { ctx.beginPath(); ctx.moveTo(m, yy); ctx.lineTo(w - m, yy); ctx.stroke(); });
        // endpoints
        [[m, y1], [w - m, y1], [m, y2], [w - m, y2]].forEach(function (p) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
        });
        function edgeFade(f) { return Math.min(1, Math.min(f, 1 - f) * 6); }
        var dots = 5, i, f, x;
        // deposits L->R on top
        for (i = 0; i < dots; i++) {
          f = (t * sp + i / dots) % 1; x = m + (w - 2 * m) * f;
          ctx.beginPath(); ctx.arc(x, y1, 2.4, 0, TAU); ctx.fillStyle = ink(0.9 * edgeFade(f)); ctx.fill();
        }
        // withdrawals R->L on bottom
        for (i = 0; i < dots; i++) {
          f = (t * sp + i / dots + 0.1) % 1; x = (w - m) - (w - 2 * m) * f;
          ctx.beginPath(); ctx.arc(x, y2, 2.4, 0, TAU); ctx.fillStyle = ink(0.55 * edgeFade(f)); ctx.fill();
        }
      }
    };
  }

  /* ======================================================
     SEPARATOR — line + travelling comet
     ====================================================== */
  function separator() {
    return {
      render: function (ctx, t, dt, w, h) {
        var y = h / 2, m = 0;
        ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(w - m, y); ctx.stroke();
        var period = 5.5, ph = (t % period) / period;
        var hx = m + (w - 2 * m) * ph;
        var SEG = 40, len = w * 0.16;
        for (var k = 0; k < SEG; k++) {
          var f = k / SEG;
          var x0 = hx - len * f, x1 = hx - len * (k + 1) / SEG;
          var fade = Math.pow(1 - f, 1.8);
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y);
          ctx.strokeStyle = "rgba(" + INK + ",1)"; ctx.globalAlpha = 0.55 * fade;
          ctx.lineWidth = 1.4 * fade + 0.3; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(hx, y, 1.8, 0, TAU); ctx.fillStyle = ink(0.9); ctx.fill();
      }
    };
  }

  /* ======================================================
     AMBIENT — drifting ink field
     ====================================================== */
  function ambient() {
    var pts = [];
    function build(w, h) {
      pts = []; var n = Math.round(Math.min(64, w * h / 9000));
      for (var i = 0; i < n; i++) pts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4,
        len: 6 + Math.random() * 16, a: 0.04 + Math.random() * 0.08
      });
    }
    return {
      init: build, resize: build,
      render: function (ctx, t, dt, w, h) {
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
          var sp = Math.hypot(p.vx, p.vy) || 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx / sp * p.len, p.y - p.vy / sp * p.len);
          ctx.strokeStyle = ink(p.a); ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.stroke();
        }
      }
    };
  }

  /* ---------- count-up on viewport enter ---------- */
  function countUp(el) {
    var final = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (REDUCE) { el.textContent = final.toFixed(dec) + suffix; return; }
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return; io.disconnect();
      var s = performance.now(), dur = 1300;
      (function f(now) {
        var p = Math.min(1, (now - s) / dur), e2 = 1 - Math.pow(1 - p, 3);
        el.textContent = (final * e2).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(f); else el.textContent = final.toFixed(dec) + suffix;
      })(s);
    }, { threshold: 0.6 });
    io.observe(el);
  }

  /* ======================================================
     DASHBOARD — Synthèse treasury panel (monochrome)
     ====================================================== */
  function dashboard() {
    var t0 = null, spStreaks;
    function rrect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function commas(n) { return Math.round(n).toLocaleString("en-US"); }
    return {
      init: function () { t0 = null; spStreaks = makeStreaks(7, 3); },
      render: function (ctx, t, dt, w, h, hov, ink) {
        if (t0 === null) t0 = t;
        var tt = t - t0, ease = 1 - Math.pow(1 - Math.min(1, tt / 1.5), 3);
        if (REDUCE) { ease = 1; tt = 2; }
        var P = Math.max(16, Math.min(w, h) * 0.07);
        var x0 = P, y0 = P, cw = w - 2 * P;
        ctx.textBaseline = "alphabetic";

        // header row
        ctx.font = "500 " + Math.max(9, w * 0.0135) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "left"; ctx.fillStyle = ink(0.5);
        ctx.fillText("SYNTHÈSE · TREASURY", x0, y0 + 4);
        // sync indicator (subtle expanding ring, not a marketing dot)
        var sx = w - P, sphase = (t * 0.7) % 1;
        ctx.beginPath(); ctx.arc(sx - 5, y0, 2.4, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
        ctx.beginPath(); ctx.arc(sx - 5, y0, 2.4 + sphase * 6, 0, TAU);
        ctx.strokeStyle = ink(0.3 * (1 - sphase)); ctx.lineWidth = 1; ctx.stroke();
        ctx.textAlign = "right"; ctx.font = "500 " + Math.max(8, w * 0.011) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillStyle = ink(0.3); ctx.fillText("synced", sx - 14, y0 + 3);
        ctx.textAlign = "left";
        // divider
        var dy = y0 + P * 0.55;
        ctx.strokeStyle = ink(0.1); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, dy); ctx.lineTo(x0 + cw, dy); ctx.stroke();

        // balance label + big number
        var by = dy + P * 0.95;
        ctx.font = "500 " + Math.max(9, w * 0.0125) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillStyle = ink(0.4); ctx.fillText("TOTAL BALANCE", x0, by);
        var bal = 1284930 * ease + (tt > 1.5 ? (tt - 1.5) * 2.4 : 0);
        var big = Math.max(22, Math.min(w * 0.066, h * 0.15));
        ctx.font = "600 " + big + "px 'Hanken Grotesk', system-ui, sans-serif";
        ctx.fillStyle = ink(0.92);
        ctx.fillText("$" + commas(bal), x0, by + big * 0.96);
        // delta
        var ly = by + big * 0.96 + P * 0.92;
        ctx.font = "500 " + Math.max(10, w * 0.0135) + "px 'Hanken Grotesk', system-ui, sans-serif";
        var tri = x0 + 5;
        ctx.beginPath(); ctx.moveTo(tri, ly - 8); ctx.lineTo(tri + 5, ly); ctx.lineTo(tri - 5, ly); ctx.closePath();
        ctx.fillStyle = ink(0.55); ctx.fill();
        ctx.fillStyle = ink(0.55);
        ctx.fillText("+$" + commas(8420 * ease) + "  ·  yield 30d", x0 + 14, ly);

        // sparkline panel (right portion, under header) — flowing live line
        var spX = x0, spY = ly + P * 0.42, spW = cw, spH = Math.max(40, h - spY - (P + P * 1.45) - P * 0.42);
        ctx.strokeStyle = ink(0.1);
        ctx.strokeRect(spX, spY, spW, spH);
        ctx.save(); ctx.beginPath(); ctx.rect(spX, spY, spW, spH); ctx.clip();
        var N = 110, pts = [], i, f, x, y;
        var reveal = Math.min(1, tt / 1.8);
        for (i = 0; i < N; i++) {
          f = i / (N - 1); x = spX + spW * f;
          var v = 0.46 + 0.26 * Math.sin(f * 6 + t * 0.9) + 0.13 * Math.sin(f * 13 - t * 1.2) + 0.05 * Math.sin(f * 22 + t);
          v = v * 0.55 + f * 0.3;
          y = spY + spH - v * spH * 0.86 - spH * 0.06;
          pts.push({ x: x, y: y });
        }
        var nv = Math.max(1, Math.round(N * reveal));
        ctx.beginPath(); ctx.moveTo(pts[0].x, spY + spH);
        for (i = 0; i < nv; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[nv - 1].x, spY + spH); ctx.closePath();
        ctx.fillStyle = ink(0.05); ctx.fill();
        ctx.beginPath(); for (i = 0; i < nv; i++) i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = ink(0.85); ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.stroke();
        var hp = pts[nv - 1];
        drawWhirl(ctx, t, hp.x, hp.y, spStreaks, 0.6 + hov * 1.2);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 2.6, 0, TAU); ctx.fillStyle = ink(0.9); ctx.fill();
        ctx.restore();

        // two stat tiles at bottom
        var tH = P * 1.45, tY = h - P - tH, gap = P * 0.5, tW = (cw - gap) / 2;
        var apy = 7.02 * ease + (tt > 1.5 ? 0.01 * Math.sin(t * 2) : 0);
        var tiles = [["APY", apy.toFixed(2) + "%"], ["YIELD ACCOUNT", "Morpho · Arbitrum"]];
        for (i = 0; i < 2; i++) {
          var tx = x0 + i * (tW + gap);
          rrect(ctx, tx, tY, tW, tH, 6); ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1; ctx.stroke();
          ctx.font = "500 " + Math.max(8, w * 0.0105) + "px 'JetBrains Mono', ui-monospace, monospace";
          ctx.fillStyle = ink(0.4); ctx.textAlign = "left";
          ctx.fillText(tiles[i][0], tx + 14, tY + tH * 0.28);
          ctx.font = "600 " + Math.max(12, w * 0.0195) + "px 'Hanken Grotesk', system-ui, sans-serif";
          ctx.fillStyle = ink(0.9);
          ctx.fillText(tiles[i][1], tx + 14, tY + tH * 0.82);
        }
      }
    };
  }

  /* ======================================================
     TAX STACK — 4 forms stack up, then a validation check
     ====================================================== */
  function taxstack() {
    var streaks;
    var LABELS = ["T5", "PBR · ACB", "GRAND LIVRE", "T1135"];
    function rrose(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function sheet(ctx, x, y, sW, sH, ang, op, label, ink) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = op;
      var w2 = sW / 2, h2 = sH / 2, fold = sW * 0.16;
      ctx.beginPath();
      ctx.moveTo(-w2, -h2); ctx.lineTo(w2 - fold, -h2); ctx.lineTo(w2, -h2 + fold);
      ctx.lineTo(w2, h2); ctx.lineTo(-w2, h2); ctx.closePath();
      ctx.fillStyle = ink(0.05); ctx.fill();
      ctx.strokeStyle = ink(0.5); ctx.lineWidth = 1.3; ctx.lineJoin = "round"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w2 - fold, -h2); ctx.lineTo(w2 - fold, -h2 + fold); ctx.lineTo(w2, -h2 + fold);
      ctx.strokeStyle = ink(0.4); ctx.lineWidth = 1; ctx.stroke();
      var pad = sW * 0.11, lx = -w2 + pad, lw = sW - 2 * pad;
      ctx.fillStyle = ink(0.62); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.font = "600 " + Math.max(9, sW * 0.072) + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.fillText(label, lx, -h2 + sH * 0.135);
      ctx.strokeStyle = ink(0.18); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, -h2 + sH * 0.185); ctx.lineTo(-w2 + sW - pad, -h2 + sH * 0.185); ctx.stroke();
      ctx.lineCap = "round";
      for (var k = 0; k < 6; k++) {
        var ly = -h2 + sH * 0.30 + k * sH * 0.083;
        var ww = lw * (k % 3 === 2 ? 0.46 : (k % 2 ? 0.9 : 1));
        ctx.strokeStyle = ink(0.14); ctx.lineWidth = Math.max(2.5, sH * 0.016);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + ww, ly); ctx.stroke();
      }
      ctx.strokeStyle = ink(0.3); ctx.lineWidth = Math.max(3, sH * 0.02);
      ctx.beginPath(); ctx.moveTo(lx, -h2 + sH * 0.86); ctx.lineTo(lx + lw * 0.42, -h2 + sH * 0.86); ctx.stroke();
      ctx.restore();
    }
    function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
    function easeBack(p) { var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
    return {
      init: function () { streaks = makeStreaks(9, 5); },
      render: function (ctx, t, dt, w, h, hov, ink) {
        var LOOP = 7.6, lt = t % LOOP;
        var cx = w / 2, cy = h * 0.48;
        var sW = Math.min(w * 0.34, h * 0.52), sH = sW * 1.2;
        var gOut = lt > LOOP - 0.7 ? Math.max(0, 1 - (lt - (LOOP - 0.7)) / 0.7) : 1;
        if (REDUCE) { lt = 5; gOut = 1; }
        for (var i = 0; i < 4; i++) {
          var ti = i * 0.85;
          var p = Math.max(0, Math.min(1, (lt - ti) / 0.72));
          if (p <= 0) continue;
          var e = easeOut(p);
          var restX = (i - 1.5) * sW * 0.13, restY = (i - 1.5) * sH * 0.06, restA = (i - 1.5) * 0.045;
          var x = cx + restX + (1 - e) * (-sW * 0.2);
          var y = cy + restY + (1 - e) * (-sH * 0.55);
          var a = restA + (1 - e) * (-0.24);
          sheet(ctx, x, y, sW, sH, a, e * gOut, LABELS[i], ink);
        }
        // validation check — separate badge after the 4th lands
        var ct = Math.max(0, Math.min(1, (lt - 3.85) / 0.55));
        if (ct > 0) {
          var cb = easeBack(ct);
          var bx = cx + sW * 0.62, by = cy + sH * 0.5;
          var br = Math.min(w, h) * 0.082 * cb;
          drawWhirl(ctx, t, bx, by, streaks, (0.5 + hov) * Math.min(1, ct) * gOut);
          ctx.save(); ctx.globalAlpha = gOut;
          ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = ink(0.92); ctx.fill();
          // punch the checkmark out of the badge (reads as cream stamp)
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)"; ctx.lineWidth = Math.max(2.4, br * 0.16);
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(bx - br * 0.42, by + br * 0.02);
          ctx.lineTo(bx - br * 0.1, by + br * 0.34);
          ctx.lineTo(bx + br * 0.46, by - br * 0.34);
          ctx.stroke();
          ctx.restore();
        }
      }
    };
  }

  /* ======================================================
     SECURITY (rich, large-card) — shield + waves + co-signers
     ====================================================== */
  function security() {
    var streaks;
    return {
      init: function () { streaks = makeStreaks(10, 5); },
      render: function (ctx, t, dt, w, h, hov, ink) {
        var P = Math.max(16, Math.min(w, h) * 0.07);
        ctx.textBaseline = "alphabetic";
        ctx.font = "500 " + Math.max(9, w * 0.0135) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "left"; ctx.fillStyle = ink(0.5);
        ctx.fillText("SÉCURITÉ · NON-CUSTODIAL", P, P + 4);
        var sx = w - P, sp = (t * 0.7) % 1;
        ctx.beginPath(); ctx.arc(sx - 5, P, 2.4, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
        ctx.beginPath(); ctx.arc(sx - 5, P, 2.4 + sp * 6, 0, TAU); ctx.strokeStyle = ink(0.3 * (1 - sp)); ctx.lineWidth = 1; ctx.stroke();
        var dy = P + P * 0.55;
        ctx.strokeStyle = ink(0.1); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, dy); ctx.lineTo(w - P, dy); ctx.stroke();

        var availH = h - dy - P * 1.4;
        var cx = w / 2, cy = dy + availH / 2 + P * 0.2;
        var s = Math.max(20, availH * 0.34);
        var maxR = s * 2.1;
        // radial waves
        for (var i = 0; i < 5; i++) {
          var ph = (t * 0.32 + i / 5) % 1, rr2 = ph * maxR;
          ctx.beginPath(); ctx.arc(cx, cy, rr2, 0, TAU);
          ctx.strokeStyle = ink(0.26 * (1 - ph)); ctx.lineWidth = 1 + (1 - ph); ctx.stroke();
        }
        // co-signer nodes orbiting
        var labels = ["Passkey", "Co-sign", "KYB"];
        for (i = 0; i < 3; i++) {
          var a = -Math.PI / 2 + i / 3 * TAU + t * 0.16;
          var orad = s * 1.5;
          var nx = cx + Math.cos(a) * orad, ny = cy + Math.sin(a) * orad;
          ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
          ctx.beginPath(); ctx.arc(nx, ny, 3.2, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, 7.5, 0, TAU); ctx.strokeStyle = ink(0.22); ctx.lineWidth = 1; ctx.stroke();
          var lyy = ny - 13; if (lyy < dy + 10) lyy = ny + 20;
          ctx.font = "500 " + Math.max(8, w * 0.0108) + "px 'JetBrains Mono', ui-monospace, monospace";
          ctx.fillStyle = ink(0.42); ctx.textAlign = "center"; ctx.fillText(labels[i], nx, lyy);
        }
        drawWhirl(ctx, t, cx, cy, streaks, 0.6 + hov);
        // shield
        var sb = s * (1 + 0.03 * Math.sin(t * 1.6));
        ctx.beginPath();
        ctx.moveTo(cx, cy - sb);
        ctx.lineTo(cx + sb * 0.82, cy - sb * 0.5);
        ctx.lineTo(cx + sb * 0.82, cy + sb * 0.18);
        ctx.quadraticCurveTo(cx + sb * 0.82, cy + sb * 0.86, cx, cy + sb * 1.05);
        ctx.quadraticCurveTo(cx - sb * 0.82, cy + sb * 0.86, cx - sb * 0.82, cy + sb * 0.18);
        ctx.lineTo(cx - sb * 0.82, cy - sb * 0.5);
        ctx.closePath();
        ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.strokeStyle = ink(0.85); ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, sb * 0.58, 0, TAU); ctx.strokeStyle = ink(0.12); ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = Math.max(1.8, sb * 0.08); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(cx - sb * 0.34, cy + sb * 0.05); ctx.lineTo(cx - sb * 0.08, cy + sb * 0.32); ctx.lineTo(cx + sb * 0.4, cy - sb * 0.3); ctx.stroke();
        // bottom label
        ctx.font = "500 " + Math.max(8, w * 0.0108) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillStyle = ink(0.4); ctx.textAlign = "left"; ctx.fillText("2-OF-3 SIGNERS · IMMUTABLE AUDIT LOG", P, h - P + 2);
      }
    };
  }

  /* ======================================================
     PAYMENTS (rich, large-card) — two-way ramp through hub
     ====================================================== */
  function payments() {
    var streaks;
    function rrose(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    return {
      init: function () { streaks = makeStreaks(7, 4); },
      render: function (ctx, t, dt, w, h, hov, ink) {
        var P = Math.max(16, Math.min(w, h) * 0.07);
        ctx.textBaseline = "alphabetic";
        ctx.font = "500 " + Math.max(9, w * 0.0135) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "left"; ctx.fillStyle = ink(0.5);
        ctx.fillText("PAIEMENTS · ON/OFF-RAMP", P, P + 4);
        var sx = w - P, sp = (t * 0.7) % 1;
        ctx.beginPath(); ctx.arc(sx - 5, P, 2.4, 0, TAU); ctx.fillStyle = ink(0.55); ctx.fill();
        ctx.beginPath(); ctx.arc(sx - 5, P, 2.4 + sp * 6, 0, TAU); ctx.strokeStyle = ink(0.3 * (1 - sp)); ctx.lineWidth = 1; ctx.stroke();
        var dy = P + P * 0.55;
        ctx.strokeStyle = ink(0.1); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, dy); ctx.lineTo(w - P, dy); ctx.stroke();

        var midY = dy + (h - dy - P * 1.3 - dy) / 2 + (P * 0.4);
        var nodeW = Math.min(w * 0.2, 150), nodeH = Math.min((h - dy) * 0.5, 96);
        var lx = P + nodeW, rx = w - P - nodeW, cxm = w / 2;
        var depY = midY - Math.min(h * 0.12, 52), witY = midY + Math.min(h * 0.12, 52);
        // lanes
        ctx.strokeStyle = ink(0.1); ctx.lineWidth = 1;
        [depY, witY].forEach(function (yy) { ctx.beginPath(); ctx.moveTo(lx, yy); ctx.lineTo(rx, yy); ctx.stroke(); });
        // direction arrows (faint)
        function edge(f) { return Math.min(1, Math.min(f, 1 - f) * 5); }
        var dots = 7, i, f, x;
        for (i = 0; i < dots; i++) { f = (t * 0.16 + i / dots) % 1; x = lx + (rx - lx) * f; ctx.beginPath(); ctx.arc(x, depY, 2.6, 0, TAU); ctx.fillStyle = ink(0.85 * edge(f)); ctx.fill(); }
        for (i = 0; i < dots; i++) { f = (t * 0.16 + i / dots + 0.13) % 1; x = rx - (rx - lx) * f; ctx.beginPath(); ctx.arc(x, witY, 2.6, 0, TAU); ctx.fillStyle = ink(0.5 * edge(f)); ctx.fill(); }
        // lane labels
        ctx.font = "500 " + Math.max(8, w * 0.0095) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.fillStyle = ink(0.3);
        ctx.fillText("DEPOSIT →", cxm, depY - 9);
        ctx.fillText("← WITHDRAW", cxm, witY + 16);
        // center hub
        var hubR = Math.max(16, nodeH * 0.46 * (1 + 0.04 * Math.sin(t * 2)));
        drawWhirl(ctx, t, cxm, midY, streaks, 0.5 + hov);
        ctx.beginPath(); ctx.arc(cxm, midY, hubR, 0, TAU); ctx.fillStyle = ink(0.06); ctx.fill();
        ctx.beginPath(); ctx.arc(cxm, midY, hubR, 0, TAU); ctx.strokeStyle = ink(0.5); ctx.lineWidth = 1.2; ctx.stroke();
        star(ctx, cxm, midY, hubR * 0.5 * (1 + 0.05 * Math.sin(t * 1.6)), 0.9);
        // end nodes
        function node(nx, big, sub) {
          var x0 = nx - nodeW / 2, y0 = midY - nodeH / 2;
          rrose(ctx, x0, y0, nodeW, nodeH, 8); ctx.fillStyle = ink(0.04); ctx.fill();
          ctx.strokeStyle = ink(0.45); ctx.lineWidth = 1.2; ctx.stroke();
          ctx.textAlign = "center";
          ctx.font = "600 " + Math.max(13, w * 0.02) + "px 'Hanken Grotesk', system-ui, sans-serif";
          ctx.fillStyle = ink(0.9); ctx.fillText(big, nx, midY - 2);
          ctx.font = "500 " + Math.max(8, w * 0.0098) + "px 'JetBrains Mono', ui-monospace, monospace";
          ctx.fillStyle = ink(0.42); ctx.fillText(sub, nx, midY + nodeH * 0.28);
        }
        node(P + nodeW / 2, "CAD", "Interac");
        node(w - P - nodeW / 2, "USDC", "Vault");
        // bottom ledger ticks
        var ty = h - P + 2, tn = 18, tw = (w - 2 * P);
        ctx.strokeStyle = ink(0.14); ctx.lineWidth = 1;
        for (i = 0; i < tn; i++) {
          var txk = P + tw * (i / (tn - 1));
          var on = ((t * 2) % tn) > i;
          ctx.globalAlpha = on ? 0.5 : 0.18;
          ctx.beginPath(); ctx.moveTo(txk, ty); ctx.lineTo(txk, ty - (i % 4 === 0 ? 7 : 4)); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  var anims = { rails: rails, yieldCurve: yieldCurve, vault: vault, compareChart: compareChart, dashboard: dashboard, taxstack: taxstack, security: security, payments: payments, sparkline: sparkline, ledger: ledger, shield: shield, flow: flow, separator: separator, ambient: ambient };

  function auto() {
    document.querySelectorAll("canvas[data-anim]").forEach(function (c) {
      var f = anims[c.getAttribute("data-anim")];
      if (f) mount(c, f());
    });
    if (!window.__LUM_NO_MOTION_COUNT) document.querySelectorAll("[data-count]").forEach(countUp);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", auto); else auto();

  window.Motion = { mount: mount, anims: anims, countUp: countUp, ink: ink };
})();
