/* =========================================================================
   SWRO Search — pure logic for the maintenance search centre (no DOM)
   · disciplines (برق / مکانیک / شیمی / ابزار دقیق …) with defaults from the
     equipment category, overridable per equipment and per record
   · one flat list of "events" built from inspections (PM), repairs (CM) and
     work orders (WO)
   · multi-word search, filters, per-person work record (کارنامه), summaries
   ========================================================================= */
(function (g) {
  'use strict';
  var DISC = [
    { k: 'mech', fa: 'مکانیک', en: 'Mechanical', c: '#1565c0' },
    { k: 'elec', fa: 'برق', en: 'Electrical', c: '#d98a00' },
    { k: 'chem', fa: 'شیمی و تزریق مواد', en: 'Chemical & dosing', c: '#7c5cff' },
    { k: 'inst', fa: 'ابزار دقیق و اتوماسیون', en: 'Instrumentation & automation', c: '#00a896' },
    { k: 'proc', fa: 'فرایند، غشا و فیلتراسیون', en: 'Process, membranes & filtration', c: '#0b7a75' },
    { k: 'pipe', fa: 'لوله‌کشی، شیرآلات و مخازن', en: 'Piping, valves & tanks', c: '#8a5a2b' },
    { k: 'gen', fa: 'عمومی / سایر', en: 'General / other', c: '#6b7c93' }
  ];
  var CAT_DISC = { hp: 'mech', ro: 'proc', pre: 'proc', dose: 'chem', tank: 'pipe', erd: 'mech', elec: 'elec', other: 'gen' };
  var KINDS = [
    { k: 'pm', fa: 'بازدید دوره‌ای', en: 'Inspection' },
    { k: 'cm', fa: 'تعمیر / خرابی', en: 'Repair / failure' },
    { k: 'wo', fa: 'دستورکار', en: 'Work order' }
  ];
  var STAT = [{ k: 'open', fa: 'باز / در جریان', en: 'Open / in progress' }, { k: 'done', fa: 'انجام‌شده', en: 'Done' }, { k: 'cancelled', fa: 'لغو‌شده', en: 'Cancelled' }];

  function discList() { return DISC.slice(); }
  function discInfo(k) { for (var i = 0; i < DISC.length; i++) if (DISC[i].k === k) return DISC[i]; return DISC[DISC.length - 1]; }
  function validDisc(k) { return DISC.some(function (d) { return d.k === k; }); }
  function discOfEq(eq) { if (!eq) return 'gen'; if (validDisc(eq.disc)) return eq.disc; return CAT_DISC[eq.category] || 'gen'; }
  function discOf(rec, eq) { return validDisc(rec && rec.disc) ? rec.disc : discOfEq(eq); }

  /* ---- text normalisation (Persian/Arabic letters & digits, spaces) ---- */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/[أإآ]/g, 'ا')
      .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/[‌‏‎ً-ٟ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function splitNames(s) {
    return String(s || '').split(/[،,;؛\/\n|]+|\s+و\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ---- flatten PM / CM / WO into events ----
     S: {equipment, pm, cm, wo}  */
  function events(S) {
    var eqBy = {}; (S.equipment || []).forEach(function (e) { eqBy[e.id] = e; });
    var out = [];
    (S.pm || []).forEach(function (p) {
      var eq = eqBy[p.equipmentId], done = {}, hl = Array.isArray(p.hlog) ? p.hlog : [];
      hl.forEach(function (h, i) {
        if (!h || !h.date) return; done[h.date] = true;
        out.push({ id: 'pm:' + p.id + ':' + h.date + ':' + i, kind: 'pm', date: h.date, eqId: p.equipmentId, title: p.title || '', detail: p.notes || '', action: h.note || '', by: splitNames(h.by), disc: validDisc(h.disc) ? h.disc : discOf(p, eq), st: 'done', stRaw: 'done', src: p.id, freq: p.freqDays, materials: '', no: '', hours: null, prio: '', type: '' });
      });
      (Array.isArray(p.history) ? p.history : []).forEach(function (d, i) {
        if (!d || done[d]) return; done[d] = true;
        out.push({ id: 'pm:' + p.id + ':' + d + ':h' + i, kind: 'pm', date: d, eqId: p.equipmentId, title: p.title || '', detail: p.notes || '', action: '', by: [], disc: discOf(p, eq), st: 'done', stRaw: 'done', src: p.id, freq: p.freqDays, materials: '', no: '', hours: null, prio: '', type: '' });
      });
      if (p.lastDone && !done[p.lastDone]) out.push({ id: 'pm:' + p.id + ':' + p.lastDone + ':l', kind: 'pm', date: p.lastDone, eqId: p.equipmentId, title: p.title || '', detail: p.notes || '', action: '', by: [], disc: discOf(p, eq), st: 'done', stRaw: 'done', src: p.id, freq: p.freqDays, materials: '', no: '', hours: null, prio: '', type: '' });
    });
    (S.cm || []).forEach(function (c) {
      var eq = eqBy[c.equipmentId];
      out.push({ id: 'cm:' + c.id, kind: 'cm', date: c.date || c.createdAt || '', eqId: c.equipmentId, title: c.issue || '', detail: c.issue || '', action: c.action || '', by: splitNames(c.technician), disc: discOf(c, eq), st: c.status === 'closed' ? 'done' : 'open', stRaw: c.status || 'open', src: c.id, materials: c.materials || '', closedAt: c.closedAt || '', no: '', hours: null, prio: '', type: '' });
    });
    (S.wo || []).forEach(function (w) {
      var eq = eqBy[w.equipmentId], st = w.status === 'done' ? 'done' : w.status === 'cancelled' ? 'cancelled' : 'open';
      var who = splitNames(w.doneBy); if (!who.length) who = splitNames(w.assignee);
      out.push({ id: 'wo:' + w.id, kind: 'wo', date: (st === 'done' && w.completedAt) ? w.completedAt : (w.date || w.createdAt || ''), issued: w.date || '', eqId: w.equipmentId, title: w.description || '', detail: w.description || '', action: w.completionNote || '', by: who, disc: discOf(w, eq), st: st, stRaw: w.status || 'new', src: w.id, materials: '', no: w.no || '', hours: w.hours == null ? null : Number(w.hours), prio: w.priority || '', type: w.type || '', due: w.dueDate || '', closedAt: w.completedAt || '' });
    });
    out.forEach(function (e) { var eq = eqBy[e.eqId]; e.eqName = eq ? eq.name : '—'; e.eqSerial = eq ? (eq.serial || '') : ''; e.eqLoc = eq ? (eq.location || '') : ''; });
    return out;
  }

  function haystack(e) { return norm([e.title, e.detail, e.action, e.by.join(' '), e.eqName, e.eqSerial, e.eqLoc, e.materials, e.no, e.type].join(' ')); }

  /* f: {q, kinds[], discs[], st, from, to, person, eqId}  — empty = no restriction */
  function filter(list, f) {
    f = f || {};
    var toks = norm(f.q || '').split(' ').filter(Boolean), pn = norm(f.person || '');
    var kinds = f.kinds && f.kinds.length ? f.kinds : null, discs = f.discs && f.discs.length ? f.discs : null;
    return list.filter(function (e) {
      if (kinds && kinds.indexOf(e.kind) < 0) return false;
      if (discs && discs.indexOf(e.disc) < 0) return false;
      if (f.st && e.st !== f.st) return false;
      if (f.eqId && e.eqId !== f.eqId) return false;
      if (f.from && String(e.date) < f.from) return false;
      if (f.to && String(e.date) > f.to) return false;
      if (pn && !e.by.some(function (n) { return norm(n).indexOf(pn) >= 0; })) return false;
      if (toks.length) { var h = haystack(e); for (var i = 0; i < toks.length; i++) if (h.indexOf(toks[i]) < 0) return false; }
      return true;
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)); });
  }

  /* every distinct person (case/letter-variant merged) with the number of jobs */
  function people(list) {
    var m = {};
    list.forEach(function (e) { e.by.forEach(function (n) { var k = norm(n); if (!k) return; var o = m[k] || (m[k] = { key: k, name: n, n: 0, pm: 0, cm: 0, wo: 0 }); o.n++; o[e.kind]++; }); });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name, 'fa'); });
  }

  function groupBy(list, keyFn) {
    var m = {}, order = [];
    list.forEach(function (e) { var ks = keyFn(e); (Array.isArray(ks) ? ks : [ks]).forEach(function (k) { if (!m[k]) { m[k] = []; order.push(k); } m[k].push(e); }); });
    return order.map(function (k) { return { key: k, items: m[k] }; });
  }

  function summary(list) {
    var s = { total: list.length, pm: 0, cm: 0, wo: 0, open: 0, done: 0, cancelled: 0, hours: 0, persons: 0, equipment: 0 }, pe = {}, eqs = {};
    list.forEach(function (e) { s[e.kind]++; s[e.st]++; if (e.hours) s.hours += e.hours; e.by.forEach(function (n) { pe[norm(n)] = 1; }); eqs[e.eqId] = 1; });
    s.persons = Object.keys(pe).length; s.equipment = Object.keys(eqs).length; s.hours = Math.round(s.hours * 10) / 10;
    return s;
  }

  g.SWRO_SEARCH = { DISC: DISC, KINDS: KINDS, STAT: STAT, CAT_DISC: CAT_DISC, discList: discList, discInfo: discInfo, validDisc: validDisc, discOfEq: discOfEq, discOf: discOf, norm: norm, splitNames: splitNames, events: events, filter: filter, people: people, groupBy: groupBy, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.SWRO_SEARCH;
})(typeof window !== 'undefined' ? window : globalThis);
