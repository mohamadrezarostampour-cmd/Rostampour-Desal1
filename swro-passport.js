/* =========================================================================
   SWRO Passport — secure, view-only "equipment dossier" viewer (opened by QR)
   Renders a paged, PDF-like document inside the page. Nothing is downloadable.
   Protection (best effort, a browser can never block a photo of the screen):
     · no download / print / save buttons, print and copy/select/context-menu blocked
     · visible watermark on every page: user name + date/time (traces any leak)
     · locks itself when the tab is hidden or after 2 minutes without activity
   model = { title, org, info:[[label,value]], kpis:[{label,value}],
             sections:[{ title, head:[..], rows:[[..]], empty }], notes }
   o     = { user, fa, labels:{...}, onClose }
   ========================================================================= */
(function (g) {
  'use strict';
  var W = 794, H = 1123, PAD = 34, IDLE_MS = 120000;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stamp() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function wmUrl(text) {
    var t = esc(text), svg = '<svg xmlns="http://www.w3.org/2000/svg" width="330" height="190"><text x="165" y="95" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="15" font-weight="700" fill="rgb(0,70,90)" fill-opacity="0.085" transform="rotate(-28 165 95)">' + t + '</text></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }

  function open(host, model, o) {
    o = o || {}; var fa = o.fa !== false, lb = o.labels || {};
    var user = o.user || '—', wmText = user + '  •  ' + stamp() + '  •  SWRO';
    var dir = fa ? 'rtl' : 'ltr';
    host.innerHTML = '';
    var root = el('div', 'pp-root'); root.setAttribute('dir', dir);
    root.innerHTML = '<div class="pp-bar"><div class="pp-bar-t">🔒 ' + esc(model.title) + '</div><div class="pp-bar-b"><span class="pp-timer" id="ppTimer"></span><button type="button" class="btn btn-sm" id="ppClose">' + esc(lb.close || 'بستن') + '</button></div></div>' +
      '<div class="pp-note">' + esc(lb.note || '') + '</div><div class="pp-wrap" id="ppWrap"><div class="pp-scaler" id="ppScaler"></div></div>' +
      '<div class="pp-lock" id="ppLock"><div class="pp-lock-box"><div style="font-size:34px">🔒</div><div style="font-weight:800;margin:6px 0">' + esc(lb.locked || 'نمایش قفل شد') + '</div><div style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px">' + esc(lb.lockedSub || '') + '</div><button type="button" class="btn btn-primary" id="ppUnlock">' + esc(lb.unlock || 'نمایش مجدد') + '</button></div></div>';
    host.appendChild(root);
    var scaler = root.querySelector('#ppScaler'), wrap = root.querySelector('#ppWrap');
    document.body.classList.add('pp-active');

    /* ---------- build pages ---------- */
    var pages = [], body = null;
    function newPage() {
      var p = el('div', 'pp-page'); p.style.width = W + 'px'; p.style.height = H + 'px'; p.style.padding = PAD + 'px';
      p.innerHTML = '<div class="pp-ph"><span>' + esc(model.org || '') + '</span><span>' + esc(model.title) + '</span></div><div class="pp-body"></div><div class="pp-pf"><span>' + esc(lb.viewOnly || '') + ' — ' + esc(user) + ' — ' + esc(stamp()) + '</span><span class="pp-pn"></span></div><div class="pp-wm"></div>';
      p.querySelector('.pp-wm').style.backgroundImage = wmUrl(wmText);
      scaler.appendChild(p); pages.push(p); body = p.querySelector('.pp-body'); return body;
    }
    function overflow() { return body.scrollHeight > body.clientHeight + 1; }
    function place(node) { body.appendChild(node); if (overflow() && body.children.length > 1) { body.removeChild(node); newPage(); body.appendChild(node); } }

    newPage();
    /* header */
    var hd = el('div', 'pp-head');
    hd.innerHTML = '<img class="pp-logo" src="banner-logo.png" alt=""><div><div class="pp-title">' + esc(model.title) + '</div><div class="pp-sub">' + esc(model.sub || '') + '</div></div>';
    place(hd);
    var info = el('div', 'pp-info'); info.innerHTML = (model.info || []).map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1] == null || r[1] === '' ? '—' : r[1]) + '</b></div>'; }).join('');
    place(info);
    if (model.kpis && model.kpis.length) { var k = el('div', 'pp-kpis'); k.innerHTML = model.kpis.map(function (x) { return '<div><b>' + esc(x.value) + '</b><span>' + esc(x.label) + '</span></div>'; }).join(''); place(k); }
    if (model.notes) { var nt = el('div', 'pp-notes'); nt.innerHTML = '<b>' + esc(lb.notes || '') + ':</b> ' + esc(model.notes); place(nt); }

    (model.sections || []).forEach(function (sec) {
      function skeleton(cont) {
        var box = el('div', 'pp-sec');
        box.innerHTML = '<h3>' + esc(sec.title) + (cont ? ' <small>' + esc(lb.cont || '(ادامه)') + '</small>' : '') + '</h3>';
        if (!sec.rows.length) { box.appendChild(el('div', 'pp-empty', esc(sec.empty || lb.empty || '—'))); return { box: box, tb: null }; }
        var t = el('table', 'pp-tbl'); t.innerHTML = '<thead><tr>' + sec.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody></tbody>';
        box.appendChild(t); return { box: box, tb: t.querySelector('tbody') };
      }
      var sk = skeleton(false); place(sk.box);
      if (!sk.tb) return;
      sec.rows.forEach(function (r) {
        var tr = el('tr'); tr.innerHTML = r.map(function (c) { return '<td>' + esc(c == null || c === '' ? '—' : c) + '</td>'; }).join('');
        sk.tb.appendChild(tr);
        if (overflow()) {
          sk.tb.removeChild(tr);
          if (!sk.tb.children.length) { body.removeChild(sk.box); newPage(); sk = skeleton(false); body.appendChild(sk.box); sk.tb.appendChild(tr); }
          else { newPage(); sk = skeleton(true); body.appendChild(sk.box); sk.tb.appendChild(tr); }
        }
      });
    });
    pages.forEach(function (p, i) { p.querySelector('.pp-pn').textContent = (i + 1) + ' / ' + pages.length; });

    /* ---------- fit to screen ---------- */
    function fit() {
      var avail = wrap.clientWidth - 8, k = Math.min(1, avail / W);
      scaler.style.transform = 'scale(' + k + ')'; scaler.style.width = W + 'px';
      wrap.style.height = Math.ceil(scaler.offsetHeight * k + 16) + 'px';
    }
    fit(); window.addEventListener('resize', fit); setTimeout(fit, 120);

    /* ---------- protection ---------- */
    var locked = false, idleAt = Date.now(), tmr;
    function lock() { if (locked) return; locked = true; root.classList.add('pp-locked'); }
    function unlock() { locked = false; idleAt = Date.now(); root.classList.remove('pp-locked'); fit(); }
    function touch() { if (!locked) idleAt = Date.now(); }
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); return false; };
    var evs = ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'];
    evs.forEach(function (n) { document.addEventListener(n, stop, true); });
    function onKey(e) {
      var k = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a', 'u', 'x'].indexOf(k) >= 0) return stop(e);
      if (k === 'printscreen') { try { navigator.clipboard.writeText(''); } catch (x) { } lock(); return stop(e); }
      touch();
    }
    document.addEventListener('keydown', onKey, true);
    function onVis() { if (document.hidden) lock(); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeprint', lock);
    ['pointerdown', 'pointermove', 'scroll', 'touchstart'].forEach(function (n) { window.addEventListener(n, touch, { passive: true, capture: true }); });
    tmr = setInterval(function () {
      var left = Math.max(0, IDLE_MS - (Date.now() - idleAt)), t = root.querySelector('#ppTimer');
      if (t && !locked) t.textContent = (lb.autoLock || '') + ' ' + Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0');
      if (left <= 0) lock();
    }, 1000);
    root.querySelector('#ppUnlock').onclick = unlock;
    root.querySelector('#ppClose').onclick = function () { destroy(); if (o.onClose) o.onClose(); };

    function destroy() {
      clearInterval(tmr); evs.forEach(function (n) { document.removeEventListener(n, stop, true); });
      document.removeEventListener('keydown', onKey, true); document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeprint', lock); window.removeEventListener('resize', fit);
      ['pointerdown', 'pointermove', 'scroll', 'touchstart'].forEach(function (n) { window.removeEventListener(n, touch, true); });
      document.body.classList.remove('pp-active'); host.innerHTML = '';
    }
    return { destroy: destroy, lock: lock, unlock: unlock, pages: pages.length, isLocked: function () { return locked; } };
  }
  g.SWRO_PASS = { open: open };
})(window);
