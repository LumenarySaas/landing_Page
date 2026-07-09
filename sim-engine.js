/* ==========================================================================
   Lumenary — Treasury Simulator data engine
   Real data: Morpho GraphQL (MetaMorpho vault share-price history) +
   Bank of Canada Valet (live Canadian rate). Graceful baked fallback so the
   page always renders. Exposes window.LumSim.
   ========================================================================== */
(function () {
  'use strict';

  var MORPHO_API = 'https://api.morpho.org/graphql';
  var BOC_API = 'https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1';

  /* Verified, listed MetaMorpho stablecoin vaults (Ethereum mainnet).
     Addresses validated against the Morpho API: real stablecoin assets, sane
     share-price history, net-of-fee APYs spanning ~3.5%–7.7%. */
  var VAULTS = [
    { label: 'Steakhouse USDC',     address: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB', chainId: 1, asset: 'USDC', curator: 'Steakhouse' },
    { label: 'Smokehouse USDC',     address: '0xBEeFFF209270748ddd194831b3fa287a5386f5bC', chainId: 1, asset: 'USDC', curator: 'Smokehouse' },
    { label: 'Gauntlet USDC Prime', address: '0xdd0f28e19C1780eb6396170735D45153D261490d', chainId: 1, asset: 'USDC', curator: 'Gauntlet' },
    { label: 'Steakhouse USDT',     address: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa', chainId: 1, asset: 'USDT', curator: 'Steakhouse' },
    { label: 'Smokehouse USDT',     address: '0xA0804346780b4c2e3bE118ac957D1DB82F9d7484', chainId: 1, asset: 'USDT', curator: 'Smokehouse' }
  ];

  var QUERY = [
    'query V($a:String!,$c:Int!,$s:Int!,$e:Int!){',
    '  vaultByAddress(address:$a,chainId:$c){',
    '    name symbol asset{symbol}',
    '    state{apy netApy totalAssetsUsd sharePriceUsd}',
    '    historicalState{',
    '      sharePriceUsd(options:{startTimestamp:$s,endTimestamp:$e,interval:WEEK}){x y}',
    '    }',
    '  }',
    '}'
  ].join('\n');

  function fetchVault(v, startTs, endTs) {
    return fetch(MORPHO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { a: v.address, c: v.chainId, s: startTs, e: endTs } })
    })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.errors && j.errors.length) throw new Error(j.errors[0].message);
      var d = j.data && j.data.vaultByAddress;
      if (!d) throw new Error('vault not found');
      var raw = (d.historicalState && d.historicalState.sharePriceUsd) || [];
      var series = raw.map(function (p) { return { ts: p.x, sp: parseFloat(p.y) }; })
                      .filter(function (p) { return p.sp > 0; })
                      .sort(function (a, b) { return a.ts - b.ts; });
      if (series.length < 2) throw new Error('insufficient history');
      /* sanity: a stablecoin vault share price only grows modestly. Reject
         asset mismatches / bad data (e.g. a WETH vault) so they never poison
         the blended average. */
      var ratio = series[series.length - 1].sp / series[0].sp;
      if (!(ratio > 0.97 && ratio < 1.8)) throw new Error('implausible series');
      return {
        label: v.label, asset: v.asset, curator: v.curator,
        name: d.name, symbol: d.symbol,
        netApy: d.state ? d.state.netApy : null,
        tvlUsd: d.state ? d.state.totalAssetsUsd : null,
        sharePriceNow: d.state ? d.state.sharePriceUsd : series[series.length - 1].sp,
        series: series, sampled: false
      };
    });
  }

  /* Fetch every vault; resolve with whatever succeeds, fall back per-vault. */
  function fetchAll(startTs, endTs) {
    var jobs = VAULTS.map(function (v) {
      return fetchVault(v, startTs, endTs).catch(function () { return bakedVault(v, startTs, endTs); });
    });
    return Promise.all(jobs).then(function (vaults) {
      var anyReal = vaults.some(function (x) { return !x.sampled; });
      return { vaults: vaults, average: averageIndex(vaults, startTs, endTs), sampled: !anyReal };
    });
  }

  /* Build a normalized average index (start = 1.0) across vaults, resampled to
     a common K-point timeline spanning the window. */
  function averageIndex(vaults, startTs, endTs) {
    var K = 53;
    var pts = [];
    for (var k = 0; k < K; k++) {
      var f = k / (K - 1);
      var ts = Math.round(startTs + f * (endTs - startTs));
      var sum = 0, cnt = 0;
      vaults.forEach(function (v) {
        var s = v.series;
        if (s.length < 2) return;
        var sp = interp(s, ts);
        if (sp != null && s[0].sp > 0) { sum += sp / s[0].sp; cnt++; }
      });
      pts.push({ ts: ts, idx: cnt ? sum / cnt : 1 });
    }
    return pts;
  }

  function interp(series, ts) {
    if (ts <= series[0].ts) return series[0].sp;
    var n = series.length;
    if (ts >= series[n - 1].ts) return series[n - 1].sp;
    for (var i = 1; i < n; i++) {
      if (series[i].ts >= ts) {
        var a = series[i - 1], b = series[i];
        var f = (ts - a.ts) / (b.ts - a.ts);
        return a.sp + f * (b.sp - a.sp);
      }
    }
    return series[n - 1].sp;
  }

  /* Live Canadian rate (BoC target overnight). Fallback 2.25%. */
  function fetchCanadaRate() {
    return fetch(BOC_API).then(function (r) { return r.json(); }).then(function (j) {
      var obs = (j && j.observations) || [];
      var last = obs[obs.length - 1];
      var v = last && last.V39079 && parseFloat(last.V39079.v);
      if (!isFinite(v)) throw new Error('no rate');
      return { rate: v / 100, asOf: last.d, label: 'Bank of Canada policy rate', sampled: false };
    }).catch(function () {
      return { rate: 0.0225, asOf: null, label: 'Bank of Canada policy rate', sampled: true };
    });
  }

  /* ---- baked fallback: synthetic but plausible weekly share-price series ---- */
  function bakedVault(v, startTs, endTs) {
    var apyByLabel = {
      'Steakhouse USDC': 0.0353, 'Smokehouse USDC': 0.0751, 'Gauntlet USDC Prime': 0.0379,
      'Steakhouse USDT': 0.0750, 'Smokehouse USDT': 0.0770
    };
    var apy = apyByLabel[v.label] || 0.045;
    var K = 53, series = [], sp0 = 1.03 + (v.asset === 'USDT' ? 0.02 : 0.05);
    var seed = v.address.charCodeAt(4);
    for (var k = 0; k < K; k++) {
      var f = k / (K - 1);
      var ts = Math.round(startTs + f * (endTs - startTs));
      var yrs = (ts - startTs) / (365.25 * 86400);
      var drift = Math.pow(1 + apy, yrs);
      var wobble = 1 + 0.0009 * Math.sin((k + seed) * 0.9) + 0.0004 * Math.sin((k + seed) * 2.3);
      series.push({ ts: ts, sp: sp0 * drift * wobble });
    }
    return {
      label: v.label, asset: v.asset, curator: v.curator,
      name: v.label, symbol: v.label.replace(/\s+/g, ''),
      netApy: apy, tvlUsd: 60e6 + seed * 1e6,
      sharePriceNow: series[series.length - 1].sp, series: series, sampled: true
    };
  }

  window.LumSim = {
    VAULTS: VAULTS,
    fetchAll: fetchAll,
    fetchCanadaRate: fetchCanadaRate,
    interp: interp
  };
})();
