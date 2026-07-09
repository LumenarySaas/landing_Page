/* ==========================================================================
   Lumenary — Treasury Simulator UI controller
   Wires inputs → LumSim data → headline, DeFi-vs-TradFi chart (gold gap),
   shares↔$ ledger, stat row, and the historical vault table.
   ========================================================================== */
(function () {
  'use strict';

  var FX = 1.37; // USD→CAD display only (approx); amounts compared in same currency
  var state = {
    currency: 'USD',
    months: 12,
    vaultIdx: 'avg',
    rate: 0.0225,
    rateLive: null
  };
  var cache = null; // last fetchAll result for current period
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chartRaf = null;

  var $ = function (id) { return document.getElementById(id); };

  function fmtMoney(n, cur) {
    cur = cur || state.currency;
    var sym = cur === 'CAD' ? 'C$' : '$';
    return sym + Math.round(n).toLocaleString('en-CA');
  }
  function fmtSigned(n) {
    return (n >= 0 ? '+' : '−') + fmtMoney(Math.abs(n));
  }
  function fmtPct(x) { return (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(2) + '%'; }
  function fmtNum(n, d) { return n.toLocaleString('en-CA', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  /* ---------- init ---------- */
  function init() {
    if (!window.LumSim) return;

    // custom vault dropdown (Lumenary-styled)
    buildVaultDropdown();

    // events
    $('in-amount').addEventListener('input', debounce(recompute, 220));
    $('in-rate').addEventListener('input', debounce(function () {
      var r = parseFloat($('in-rate').value); if (isFinite(r)) state.rate = r / 100; recompute();
    }, 220));
    $('btn-run').addEventListener('click', function () { loadPeriod(true); });

    // currency toggle
    $('cur-usd').addEventListener('click', function () { setCurrency('USD'); });
    $('cur-cad').addEventListener('click', function () { setCurrency('CAD'); });

    // period segmented
    Array.prototype.forEach.call($('seg-period').children, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call($('seg-period').children, function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        state.months = parseInt(b.dataset.months, 10);
        loadPeriod(false);
      });
    });

    // edu scroll-spy
    setupSpy();

    // live BoC rate then first load
    LumSim.fetchCanadaRate().then(function (r) {
      state.rate = r.rate; state.rateLive = r.rate;
      $('in-rate').value = (r.rate * 100).toFixed(2);
      if (r.sampled) {
        $('rate-meta').innerHTML = 'Bank of Canada policy rate (cached) — <a href="https://www.bankofcanada.ca/rates/" target="_blank" rel="noopener">source</a>';
        $('live-rate-pill').textContent = 'Bank of Canada policy rate';
      } else {
        var d = r.asOf ? (' · as of ' + r.asOf) : '';
        $('rate-meta').innerHTML = 'Bank of Canada policy rate' + d + ' — <a href="https://www.bankofcanada.ca/rates/" target="_blank" rel="noopener">source</a>';
        $('live-rate-pill').textContent = 'Live · Bank of Canada policy rate ' + (r.rate * 100).toFixed(2) + '%';
      }
      loadPeriod(false);
    });
  }

  function setCurrency(cur) {
    state.currency = cur;
    $('cur-usd').setAttribute('aria-pressed', String(cur === 'USD'));
    $('cur-cad').setAttribute('aria-pressed', String(cur === 'CAD'));
    $('cur-sym').textContent = cur === 'CAD' ? 'C$' : '$';
    render(false); // re-render with cached data (display-only conversion)
  }

  /* ---------- custom vault dropdown ---------- */
  var vaultOpts = [];
  function buildVaultDropdown() {
    var panel = $('vsel-panel');
    var items = [{ val: 'avg', name: 'Average of all MetaMorpho vaults', sub: 'all vaults · equal weight' }];
    LumSim.VAULTS.forEach(function (v, i) { items.push({ val: String(i), name: v.label, sub: v.curator + ' · ' + v.asset }); });
    panel.innerHTML = '';
    vaultOpts = [];
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'vsel-opt'; b.setAttribute('role', 'option');
      b.setAttribute('data-val', it.val);
      b.setAttribute('aria-selected', String(it.val === state.vaultIdx));
      b.innerHTML =
        '<span class="vsel-tick"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '<span class="vo-main"><span class="vo-name">' + escapeHtml(it.name) + '</span><span class="vo-sub">' + escapeHtml(it.sub) + '</span></span>' +
        '<span class="vo-apy"></span>';
      b.addEventListener('click', function () { selectVault(it.val); });
      panel.appendChild(b);
      vaultOpts.push({ val: it.val, el: b, apyEl: b.querySelector('.vo-apy') });
    });
    $('vsel-trigger').addEventListener('click', function (e) { e.stopPropagation(); toggleVsel(); });
    document.addEventListener('click', function (e) { if (!$('vsel').contains(e.target)) closeVsel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeVsel(); });
    updateVselLabel();
  }
  function toggleVsel() {
    var o = $('vsel').classList.toggle('open');
    $('vsel-trigger').setAttribute('aria-expanded', String(o));
  }
  function closeVsel() { $('vsel').classList.remove('open'); $('vsel-trigger').setAttribute('aria-expanded', 'false'); }
  function selectVault(val) {
    state.vaultIdx = val;
    vaultOpts.forEach(function (o) { o.el.setAttribute('aria-selected', String(o.val === val)); });
    updateVselLabel(); closeVsel(); render(true);
  }
  function updateVselLabel() {
    var cur = vaultOpts.filter(function (o) { return o.val === state.vaultIdx; })[0];
    if (cur) $('vsel-cur').textContent = cur.el.querySelector('.vo-name').textContent;
  }
  function updateVaultApys(res) {
    vaultOpts.forEach(function (o) {
      var apy;
      if (o.val === 'avg') {
        var list = res.vaults.map(function (v) { return v.netApy; }).filter(isFinite);
        apy = list.length ? list.reduce(function (s, x) { return s + x; }, 0) / list.length : NaN;
      } else {
        var v = res.vaults[parseInt(o.val, 10)];
        apy = v ? v.netApy : NaN;
      }
      o.apyEl.innerHTML = isFinite(apy) ? (apy * 100).toFixed(2) + '%<small>NET APY</small>' : '';
    });
  }

  /* ---------- data ---------- */
  function loadPeriod(force) {
    var now = Math.floor(Date.now() / 1000);
    var start = now - Math.round(state.months * 30.4375 * 86400);
    setLoading(true); clearError();
    LumSim.fetchAll(start, now).then(function (res) {
      cache = res; cache.startTs = start; cache.endTs = now;
      setLoading(false);
      $('sampled').classList.toggle('on', !!res.sampled);
      renderHistory(res);
      updateVaultApys(res);
      render(true);
    }).catch(function (e) {
      setLoading(false);
      showError('Could not load vault history — ' + (e.message || 'try again') + '.');
    });
  }

  function recompute() { if (cache) render(false); }

  /* Build the chosen DeFi series (portfolio $ over time) + shares meta. */
  function buildDefi(deposit) {
    var pts, sp0, spN, label, shares = null;
    if (state.vaultIdx === 'avg') {
      var avg = cache.average;
      sp0 = 1; spN = avg[avg.length - 1].idx;
      pts = avg.map(function (p) { return { ts: p.ts, value: deposit * p.idx }; });
      label = 'Average of MetaMorpho vaults';
    } else {
      var v = cache.vaults[parseInt(state.vaultIdx, 10)];
      var s = v.series;
      sp0 = s[0].sp; spN = s[s.length - 1].sp;
      shares = deposit / sp0;
      pts = s.map(function (p) { return { ts: p.ts, value: shares * p.sp }; });
      label = v.label;
    }
    return { pts: pts, sp0: sp0, spN: spN, shares: shares, label: label };
  }

  /* TradFi series compounding deposit at annual rate over same timestamps. */
  function buildBank(deposit, timeline) {
    var t0 = timeline[0].ts;
    return timeline.map(function (p) {
      var yrs = (p.ts - t0) / (365.25 * 86400);
      return { ts: p.ts, value: deposit * Math.pow(1 + state.rate, yrs) };
    });
  }

  /* ---------- render ---------- */
  function render(animate) {
    if (!cache) return;
    var depositInput = parseFloat($('in-amount').value) || 0;
    if (depositInput <= 0) { showError('Enter a balance greater than zero.'); return; }
    clearError();

    var defi = buildDefi(depositInput);
    var bank = buildBank(depositInput, defi.pts);

    var endDefi = defi.pts[defi.pts.length - 1].value;
    var endBank = bank[bank.length - 1].value;
    var yieldDefi = endDefi - depositInput;
    var yieldBank = endBank - depositInput;
    var gap = endDefi - endBank;
    var days = (cache.endTs - cache.startTs) / 86400;
    var periodPct = (endDefi - depositInput) / depositInput;

    // headline — grammatically and visually honest in BOTH directions:
    // Lumenary ahead of the bank, or (rare, but must never look broken) behind it.
    var defiWins = gap >= 0;
    var pLabel = periodLabel(state.months);
    var head = $('res-head');
    var gapClass = defiWins ? ' class="up"' : '';
    var gapPhrase = defiWins ? 'more' : 'less';
    head.innerHTML = 'Over the past ' + pLabel + ', <b>' + fmtMoney(depositInput) + '</b> in ' +
      escapeHtml(defi.label) + ' would be worth <b class="up">' + fmtMoney(endDefi) + '</b> — <b' + gapClass + '>' +
      fmtMoney(Math.abs(gap)) + '</b> ' + gapPhrase + ' than a Canadian bank account.';
    $('res-sub').textContent = 'Realised, net of fees · ' + fmtPct(periodPct) + ' over ' + Math.round(days) +
      ' days vs ' + (state.rate * 100).toFixed(2) + '% at the bank.';

    // stats
    $('st-value').textContent = fmtMoney(endDefi);
    $('st-defi').textContent = fmtSigned(yieldDefi);
    $('st-bank').textContent = fmtSigned(yieldBank);
    $('st-gap').textContent = fmtSigned(gap);
    // gold is reserved for genuinely good news — never force it on a loss
    $('stat-gap-box').classList.toggle('accent', defiWins);
    $('st-gap-label').textContent = defiWins ? 'Cost of idle cash' : 'Bank outperformed, this period';
    $('st-gap-label').title = defiWins
      ? 'Extra you would have captured with Lumenary versus the bank, over the period.'
      : 'Over this specific window, the bank rate happened to edge out this vault. Yields are variable in both directions.';

    // shares ledger
    if (defi.shares != null) {
      $('sh-deposit').textContent = fmtMoney(depositInput);
      $('sh-shares').textContent = fmtNum(defi.shares, 2);
      $('sh-price').textContent = '$' + defi.sp0.toFixed(4);
      $('sh-value').textContent = fmtMoney(endDefi);
      $('share-note').textContent = 'Your ' + fmtNum(defi.shares, 0) + ' shares are a direct onchain claim on the vault — Lumenary never holds your funds.';
    } else {
      // average: express as a blended index
      $('sh-deposit').textContent = fmtMoney(depositInput);
      $('sh-shares').textContent = '1.0000';
      $('sh-price').textContent = 'blended index';
      $('sh-value').textContent = (defi.spN).toFixed(4) + '×';
      $('share-note').textContent = 'Blended across all vaults; pick a single vault to see exact share counts.';
    }

    drawChart(defi.pts, bank, depositInput, animate);
  }

  /* ---------- chart ---------- */
  function drawChart(defi, bank, deposit, animate) {
    var W = 640, H = 300, P = { t: 16, r: 16, b: 30, l: 64 };
    var iW = W - P.l - P.r, iH = H - P.t - P.b;
    var n = defi.length;

    var all = defi.map(function (p) { return p.value; }).concat(bank.map(function (p) { return p.value; }));
    var minV = Math.min.apply(null, all), maxV = Math.max.apply(null, all);
    var pad = (maxV - minV) * 0.12 || maxV * 0.04;
    minV -= pad; maxV += pad;

    function cx(i) { return P.l + (i / (n - 1)) * iW; }
    function cy(v) { return P.t + (1 - (v - minV) / (maxV - minV)) * iH; }

    function path(arr) { return 'M' + arr.map(function (p, i) { return cx(i) + ',' + cy(p.value); }).join('L'); }
    var defiLine = path(defi), bankLine = path(bank);
    // gap band: defi top, back along bank
    var band = defiLine + 'L' + cx(n - 1) + ',' + cy(bank[n - 1].value) +
      bank.slice().reverse().map(function (p, j) { var i = n - 1 - j; return 'L' + cx(i) + ',' + cy(p.value); }).join('') + 'Z';
    var defiFill = defiLine + 'L' + cx(n - 1) + ',' + (P.t + iH) + 'L' + P.l + ',' + (P.t + iH) + 'Z';

    // axes
    var yTicks = [0, 0.5, 1].map(function (f) {
      var v = minV + f * (maxV - minV), y = P.t + iH - f * iH;
      return '<line x1="' + P.l + '" y1="' + y + '" x2="' + (W - P.r) + '" y2="' + y + '" stroke="var(--hair)" stroke-width="1"/>' +
        '<text x="' + (P.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="var(--muted)" font-size="11" font-family="var(--mono)">' + fmtMoney(v) + '</text>';
    }).join('');
    var xTicks = [0, 0.5, 1].map(function (f) {
      var i = Math.round(f * (n - 1)), d = new Date(defi[i].ts * 1000);
      var lbl = f === 0 ? 'Start' : (f === 1 ? 'Today' : d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }));
      return '<text x="' + cx(i) + '" y="' + (P.t + iH + 20) + '" text-anchor="' + (f === 0 ? 'start' : f === 1 ? 'end' : 'middle') + '" fill="var(--muted)" font-size="11" font-family="var(--mono)">' + lbl + '</text>';
    }).join('');

    var endX = cx(n - 1), endYd = cy(defi[n - 1].value), endYb = cy(bank[n - 1].value);

    $('chart').innerHTML = [
      '<defs><linearGradient id="defifill" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity=".16"/>',
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>',
      '<clipPath id="reveal"><rect id="reveal-rect" x="' + P.l + '" y="0" width="' + iW + '" height="' + H + '"/></clipPath></defs>',
      yTicks, xTicks,
      '<g clip-path="url(#reveal)">',
      '<path d="' + defiFill + '" fill="url(#defifill)"/>',
      '<path d="' + band + '" fill="color-mix(in srgb,var(--accent) 18%,transparent)"/>',
      '<path d="' + bankLine + '" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 5" stroke-linejoin="round" opacity=".62"/>',
      '<path d="' + defiLine + '" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round"/>',
      '<circle cx="' + endX + '" cy="' + endYb + '" r="3" fill="var(--ink)" opacity=".62"/>',
      '<circle cx="' + endX + '" cy="' + endYd + '" r="4.5" fill="var(--accent)"/>',
      '<circle cx="' + endX + '" cy="' + endYd + '" r="9" fill="none" stroke="var(--accent)" stroke-width="1" opacity=".4"/>',
      '</g>'
    ].join('');

    // progressive draw: wipe the plotted data left→right
    if (chartRaf) { cancelAnimationFrame(chartRaf); chartRaf = null; }
    var rect = document.getElementById('reveal-rect');
    if (rect && animate && !REDUCED) {
      rect.setAttribute('width', '0');
      var dur = 1050, t0 = performance.now();
      var step = function (now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        rect.setAttribute('width', (iW * e).toFixed(1));
        if (p < 1) chartRaf = requestAnimationFrame(step);
        else chartRaf = null;
      };
      chartRaf = requestAnimationFrame(step);
    }
  }

  /* ---------- historical table ---------- */
  function renderHistory(res) {
    var tbl = $('vault-table');
    // remove old rows except header
    Array.prototype.slice.call(tbl.querySelectorAll('.vault-row:not(.head)')).forEach(function (r) { r.remove(); });
    $('hist-period-lbl').textContent = periodLabel(state.months) + ' return';

    function periodReturn(series) {
      if (!series || series.length < 2) return 0;
      return series[series.length - 1].sp / series[0].sp - 1;
    }
    function spark(series, accent) {
      if (!series || series.length < 2) return '';
      var w = 120, h = 34, vals = series.map(function (p) { return p.sp; });
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rng = (mx - mn) || 1;
      var d = 'M' + series.map(function (p, i) {
        var x = (i / (series.length - 1)) * w, y = h - 4 - ((p.sp - mn) / rng) * (h - 8);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join('L');
      var col = accent ? 'var(--accent)' : 'var(--ink-soft)';
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    }

    res.vaults.forEach(function (v) {
      var row = document.createElement('div');
      row.className = 'vault-row';
      row.innerHTML =
        '<div class="v-name"><b>' + escapeHtml(v.label) + '</b><span>' + escapeHtml(v.curator) + ' · ' + v.asset + '</span></div>' +
        '<div class="v-cell apy text-r">' + (v.netApy != null ? (v.netApy * 100).toFixed(2) + '%' : '—') + '</div>' +
        '<div class="v-cell text-r hide-sm">' + (v.tvlUsd != null ? '$' + compact(v.tvlUsd) : '—') + '</div>' +
        '<div class="v-cell text-r hide-sm">$' + v.sharePriceNow.toFixed(4) + '</div>' +
        '<div class="v-cell text-r"><div class="v-spark">' + spark(v.series, true) + '</div><small>' + fmtPct(periodReturn(v.series)) + '</small></div>';
      tbl.appendChild(row);
    });

    // average row
    var avg = res.average;
    var avgApy = mean(res.vaults.map(function (v) { return v.netApy; }).filter(isFinite));
    var avgTvl = res.vaults.reduce(function (s, v) { return s + (v.tvlUsd || 0); }, 0);
    var avgRow = document.createElement('div');
    avgRow.className = 'vault-row avg';
    var avgSeries = avg.map(function (p) { return { ts: p.ts, sp: p.idx }; });
    avgRow.innerHTML =
      '<div class="v-name"><b>Blended average</b><span>all vaults · equal weight</span></div>' +
      '<div class="v-cell apy text-r">' + (isFinite(avgApy) ? (avgApy * 100).toFixed(2) + '%' : '—') + '</div>' +
      '<div class="v-cell text-r hide-sm">$' + compact(avgTvl) + '</div>' +
      '<div class="v-cell text-r hide-sm">—</div>' +
      '<div class="v-cell text-r"><div class="v-spark">' + spark(avgSeries.map(function (p) { return { sp: p.sp }; }), true) + '</div><small>' + fmtPct(avg[avg.length - 1].idx - 1) + '</small></div>';
    $('vault-table').appendChild(avgRow);

    $('hist-asof').textContent = res.sampled ? 'Illustrative sample · data feed unavailable' : 'Historical · Morpho, net of fees';
  }

  /* ---------- helpers ---------- */
  function periodLabel(m) { return m >= 24 ? (m / 12) + ' years' : (m >= 12 ? (m / 12 === 1 ? '12 months' : (m / 12) + ' years') : m + ' months'); }
  function compact(n) { if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'; return String(Math.round(n)); }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : NaN; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function setLoading(on) { $('loading').classList.toggle('on', on); var b = $('btn-run'); b.disabled = on; b.querySelector('.sim-btn-text').textContent = on ? 'Loading…' : 'Run the comparison'; }
  function showError(m) { var e = $('error'); e.textContent = m; e.style.display = 'block'; }
  function clearError() { $('error').style.display = 'none'; }

  function setupSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.edu-nav a'));
    var ids = links.map(function (a) { return a.getAttribute('href').slice(1); });
    window.addEventListener('scroll', debounce(function () {
      var y = window.scrollY + 140, cur = ids[0];
      ids.forEach(function (id) { var el = document.getElementById(id); if (el && el.offsetTop <= y) cur = id; });
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
    }, 60));
  }

  // nav scrolled state
  window.addEventListener('scroll', function () {
    var nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
