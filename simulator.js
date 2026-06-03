(function () {
  'use strict';

  var MORPHO_API = 'https://api.morpho.org/graphql';

  /* Update addresses from Morpho API explorer → vaultByAddress */
  var VAULTS = [
    { label: 'Steakhouse USDC',    address: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB', chainId: 1 },
    { label: 'Steakhouse USDT',    address: '0xbEEf005b8B69c3bCA9D5AF6D36E1E5EA84A61623', chainId: 1 },
    { label: 'Gauntlet USDC Core', address: '0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458', chainId: 1 },
    { label: 'Re7 USDC',           address: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0', chainId: 1 }
  ];

  var QUERY = [
    'query VaultHistory($address:String!,$chainId:Int!,$startTs:Int!,$endTs:Int!){',
    '  vaultByAddress(address:$address,chainId:$chainId){',
    '    symbol',
    '    historicalState{',
    '      totalAssets(options:{startTimestamp:$startTs,endTimestamp:$endTs,interval:DAY}){x y}',
    '      totalSupply(options:{startTimestamp:$startTs,endTimestamp:$endTs,interval:DAY}){x y}',
    '    }',
    '  }',
    '}'
  ].join('\n');

  function init() {
    var sel = document.getElementById('sim-vault');
    if (!sel) return;

    VAULTS.forEach(function (v, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = v.label;
      sel.appendChild(opt);
    });

    /* default date range: last 12 months */
    var today = new Date();
    var yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    var endEl   = document.getElementById('sim-end');
    var startEl = document.getElementById('sim-start');
    endEl.value   = toISODate(today);
    endEl.max     = toISODate(today);
    startEl.value = toISODate(yearAgo);
    startEl.max   = toISODate(today);

    /* "Run your numbers" reveals the section then scrolls to it */
    var openBtn = document.getElementById('open-sim');
    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var section = document.getElementById('simulator');
        section.classList.add('sim-open');
        setTimeout(function () {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      });
    }

    document.getElementById('sim-run').addEventListener('click', runSim);
  }

  function toISODate(d) {
    return d.toISOString().slice(0, 10);
  }

  function runSim() {
    var amount   = parseFloat(document.getElementById('sim-amount').value);
    var vaultIdx = parseInt(document.getElementById('sim-vault').value, 10);
    var startVal = document.getElementById('sim-start').value;
    var endVal   = document.getElementById('sim-end').value;

    if (!amount || amount <= 0) { showError('Enter a deposit amount greater than zero.'); return; }
    if (!startVal || !endVal)   { showError('Select both a start and end date.'); return; }
    if (startVal >= endVal)     { showError('Start date must be before end date.'); return; }

    var vault   = VAULTS[vaultIdx];
    var startTs = Math.floor(new Date(startVal + 'T00:00:00Z').getTime() / 1000);
    var endTs   = Math.floor(new Date(endVal   + 'T00:00:00Z').getTime() / 1000);

    setLoading(true);
    clearError();
    document.getElementById('sim-results').style.display = 'none';

    fetch(MORPHO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { address: vault.address, chainId: vault.chainId, startTs: startTs, endTs: endTs }
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.errors && json.errors.length) throw new Error(json.errors[0].message);

      var vData = json.data && json.data.vaultByAddress;
      if (!vData) throw new Error('Vault not found — verify the address for "' + vault.label + '".');

      var assets = (vData.historicalState && vData.historicalState.totalAssets) || [];
      var supply = (vData.historicalState && vData.historicalState.totalSupply) || [];

      if (assets.length < 2) {
        throw new Error('No data for this date range. Try a wider range or a different vault.');
      }

      /* build share-price series aligned by timestamp, oldest → newest */
      var supplyMap = {};
      supply.forEach(function (pt) { supplyMap[pt.x] = parseFloat(pt.y); });

      var series = [];
      assets.forEach(function (pt) {
        var s = supplyMap[pt.x];
        if (s && s > 0) series.push({ ts: pt.x, sp: parseFloat(pt.y) / s });
      });
      series.sort(function (a, b) { return a.ts - b.ts; });

      if (series.length < 2) throw new Error('Share price data incomplete for this range.');

      var sharesHeld = amount / series[0].sp;
      var portfolio  = series.map(function (pt) {
        return { ts: pt.ts, value: sharesHeld * pt.sp };
      });

      setLoading(false);
      renderResults(portfolio, amount);
    })
    .catch(function (err) {
      setLoading(false);
      showError(err.message || 'Could not reach the Morpho API — check your connection.');
    });
  }

  function renderResults(portfolio, deposit) {
    var last    = portfolio[portfolio.length - 1].value;
    var gainAbs = last - deposit;
    var gainPct = (gainAbs / deposit) * 100;
    var days    = (portfolio[portfolio.length - 1].ts - portfolio[0].ts) / 86400;
    var apy     = days > 1 ? (Math.pow(last / deposit, 365 / days) - 1) * 100 : 0;

    function fmt(n) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function sign(n) { return n >= 0 ? '+' : ''; }

    document.getElementById('sim-final').textContent = sign(gainAbs) + '$' + fmt(gainAbs);
    document.getElementById('sim-gain').textContent  = '$' + fmt(last);
    document.getElementById('sim-pct').textContent   = sign(gainPct) + gainPct.toFixed(2) + '%';
    document.getElementById('sim-apy').textContent   = apy.toFixed(2) + '%';

    drawChart(portfolio, deposit);
    document.getElementById('sim-results').style.display = '';
  }

  function drawChart(portfolio, deposit) {
    var W = 560, H = 240;
    var P = { t: 20, r: 20, b: 32, l: 60 };
    var iW = W - P.l - P.r;
    var iH = H - P.t - P.b;
    var n  = portfolio.length;

    var vals = portfolio.map(function (p) { return p.value; });
    var minV = Math.min.apply(null, vals) * 0.997;
    var maxV = Math.max.apply(null, vals) * 1.003;

    function cx(i) { return P.l + (i / (n - 1)) * iW; }
    function cy(v) { return P.t + (1 - (v - minV) / (maxV - minV)) * iH; }

    var pts     = portfolio.map(function (p, i) { return cx(i) + ',' + cy(p.value); }).join('L');
    var linePth = 'M' + pts;
    var areaPth = linePth + 'L' + cx(n - 1) + ',' + (P.t + iH) + 'L' + P.l + ',' + (P.t + iH) + 'Z';
    var entY    = Math.max(P.t, Math.min(P.t + iH, cy(deposit)));

    var dateLabels = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
      var idx = Math.round(f * (n - 1));
      var d   = new Date(portfolio[idx].ts * 1000);
      var lbl = d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
      return '<text x="' + cx(idx) + '" y="' + (P.t + iH + 22) + '" fill="var(--muted)" font-size="11" text-anchor="middle" font-family="var(--sans)">' + lbl + '</text>';
    }).join('');

    var yLabels = [0, 0.5, 1].map(function (f) {
      var v = minV + f * (maxV - minV);
      return '<text x="' + (P.l - 6) + '" y="' + (P.t + iH - f * iH + 4) + '" fill="var(--muted)" font-size="11" text-anchor="end" font-family="var(--sans)">$' + Math.round(v).toLocaleString('en-CA') + '</text>';
    }).join('');

    document.getElementById('sim-chart').innerHTML = [
      '<defs><linearGradient id="sgfill" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity=".28"/>',
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity=".02"/>',
      '</linearGradient></defs>',
      [0.33, 0.67].map(function (f) {
        return '<line x1="' + P.l + '" y1="' + (P.t + f * iH) + '" x2="' + (W - P.r) + '" y2="' + (P.t + f * iH) + '" stroke="var(--hair)" stroke-width="1"/>';
      }).join(''),
      '<line x1="' + P.l + '" y1="' + entY + '" x2="' + (W - P.r) + '" y2="' + entY + '" stroke="var(--accent)" stroke-width="1" stroke-opacity=".4" stroke-dasharray="4 5"/>',
      '<path d="' + areaPth + '" fill="url(#sgfill)"/>',
      '<path d="' + linePth + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>',
      dateLabels,
      yLabels
    ].join('');
  }

  function setLoading(on) {
    var btn  = document.getElementById('sim-run');
    var span = btn.querySelector('.sim-btn-text');
    btn.disabled    = on;
    span.textContent = on ? 'Loading…' : 'Simulate';
  }

  function showError(msg) {
    var el = document.getElementById('sim-error');
    el.textContent = msg;
    el.style.display = '';
  }

  function clearError() {
    document.getElementById('sim-error').style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
