/* ============ Lumenary — interactions ============ */
(function () {
  var nav = document.getElementById('nav');
  addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', scrollY > 14);
  }, { passive: true });

  /* reveal on scroll */
  var reveals = [].slice.call(document.querySelectorAll('.rv'));
  function reveal(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    setTimeout(function () { el.style.transition = 'none'; }, 1000);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(function (el) { io.observe(el); });
  /* fallback: IntersectionObserver may never fire in some embedded/iframe contexts.
     Reveal anything already in (or near) the viewport on load + scroll, and a safety net. */
  function revealInView() {
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      if (el.classList.contains('in')) continue;
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.96 && r.bottom > 0) reveal(el);
    }
  }
  addEventListener('scroll', revealInView, { passive: true });
  addEventListener('resize', revealInView);
  revealInView(); requestAnimationFrame(revealInView);
  setTimeout(function () { reveals.forEach(reveal); }, 1200);

  /* FAQ accordion */
  function setQA(qa, open) {
    var a = qa.querySelector('.qa-a');
    qa.classList.toggle('open', open);
    a.style.maxHeight = open ? (a.querySelector('.inner').offsetHeight + 'px') : '0px';
  }
  document.querySelectorAll('#faqlist .qa').forEach(function (qa) {
    var q = qa.querySelector('.qa-q');
    q.addEventListener('click', function () {
      var willOpen = !qa.classList.contains('open');
      document.querySelectorAll('#faqlist .qa').forEach(function (o) { if (o !== qa) setQA(o, false); });
      setQA(qa, willOpen);
    });
    if (qa.classList.contains('open')) requestAnimationFrame(function () { setQA(qa, true); });
  });

  /* time-filter pills (visual) */
  var tf = document.getElementById('tfilter');
  if (tf) tf.addEventListener('click', function (e) {
    if (e.target.tagName !== 'BUTTON') return;
    tf.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
    e.target.classList.add('on');
    var d = { '1M': '+$1,040', '3M': '+$3,180', 'YTD': '+$12,480', '1Y': '+$15,720', 'ALL': '+$34,910' };
    var dv = document.getElementById('deltaval');
    if (dv && d[e.target.textContent]) dv.textContent = d[e.target.textContent];
  });

  /* count-up */
  function countUp(el, final, dur, suffix) {
    var s = performance.now();
    function f(t) {
      var p = Math.min(1, (t - s) / dur), e = 1 - Math.pow(1 - p, 3);
      var v = final * e;
      el.textContent = (final % 1 === 0 ? Math.round(v) : v.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(f); else el.textContent = (final % 1 === 0 ? final : final.toFixed(1)) + suffix;
    }
    requestAnimationFrame(f);
  }

  /* chart draw */
  function drawChart() {
    var line = document.getElementById('defiline');
    if (!line) return;
    var len = line.getTotalLength();
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    line.getBoundingClientRect();
    line.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.7,.3,1)';
    line.style.strokeDashoffset = 0;
    var area = document.getElementById('defiarea');
    setTimeout(function () { area.style.transition = 'opacity 1s'; area.style.opacity = 1; }, 500);
    setTimeout(function () { line.style.transition = 'none'; }, 1800);
  }

  var once = {};
  function fireOnce(key, el, fn) {
    if (once[key]) return;
    var r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.85 && r.bottom > 0) { once[key] = true; fn(); }
  }
  function check() {
    var apy = document.getElementById('m-apy'), nc = document.getElementById('m-nc');
    if (apy) fireOnce('apy', apy.closest('.metrics'), function () {
      countUp(apy, 7.0, 1300, '%'); countUp(nc, 100, 1300, '%');
    });
    var ch = document.getElementById('cmpchart');
    if (ch) fireOnce('chart', ch, drawChart);
  }
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);
  check(); setTimeout(check, 200);

  /* CTA */
  var form = document.getElementById('ctaform');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var emailVal = document.getElementById('ctaemail').value;
    if (!emailVal) return;

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch('https://formsubmit.co/ajax/lumenarysaas@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: emailVal,
        _subject: 'New Lumenary beta signup',
        _autoresponse: 'Hi ' + emailVal.split('@')[0] + ',\n\nWelcome to Lumenary\'s private beta! You\'re on the list and we\'ll be in touch shortly.\n\nNo platform fee · no lock-up · always yours.\n\n— The Lumenary Team',
        _captcha: 'false'
      })
    })
    .finally(function () {
      form.style.display = 'none';
      document.getElementById('ctaok').classList.add('show');
    });
  });

  /* ---- jargon / variant API (used by Tweaks) ---- */
  window.LUM = {
    setJargon: function (level) {
      document.querySelectorAll('[data-vary]').forEach(function (el) {
        var v = el.getAttribute('data-' + level);
        if (v != null) el.textContent = v;
      });
    }
  };
})();
