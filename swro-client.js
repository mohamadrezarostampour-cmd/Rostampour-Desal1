/* =========================================================================
   SWRO Client report — logic for the "گزارش تحویلی به کارفرما" section (no DOM)
   · default parameter list (all plant parameters), merged with the user's own list
     (add / remove / disable / rename / unit / decimals / aggregation)
   · builds the daily / monthly / yearly report object used by RK (PDF · Word · Excel)
   Record (collection ds_client, id = ISO date):
     { date, v:{paramId:number|null}, outageReason, outageNote, works:[text], note, by, updatedAt }
   ========================================================================= */
(function (g) {
  'use strict';
  var PREP = { fa: 'تهیه کننده: محمدرضا رستم پور', en: 'Prepared by: Mohammad Reza Rostampour' };
  var REASON = {
    power: ['قطع برق', 'Power cut'], client: ['درخواست کارفرما', 'Client request'],
    both: ['قطع برق و درخواست کارفرما', 'Power cut & client request'], other: ['سایر', 'Other']
  };
  var AGG = { avg: ['میانگین', 'Average'], sum: ['مجموع', 'Total'], last: ['آخرین مقدار', 'Last value'] };

  /* id, fa, en, unit, decimals, aggregation, source key in the plant's daily record, limits */
  function P(id, fa, en, unit, dec, agg, src, o) { return Object.assign({ id: id, fa: fa, en: en, unit: unit, dec: dec, agg: agg, src: src || null, on: true, builtin: true }, o || {}); }
  var DEFAULTS = [
    P('prod', 'حجم آب تولیدی روزانه', 'Daily water production', 'm³', 0, 'sum', 'prod', { min: 0 }),
    P('ec', 'EC', 'EC', 'µS/cm', 0, 'avg', 'oEc', { min: 0 }),
    P('ph', 'pH', 'pH', '', 2, 'avg', 'oPh', { min: 0, max: 14 }),
    P('th', 'TH (سختی کل)', 'TH (total hardness)', 'ppm', 1, 'avg', 'oTh', { min: 0 }),
    P('tss', 'TSS', 'TSS', 'ppm', 1, 'avg', null, { min: 0 }),
    P('orp', 'ORP', 'ORP', 'mV', 0, 'avg', null),
    P('ntu', 'NTU (کدورت)', 'NTU (turbidity)', 'NTU', 2, 'avg', 'oNtu', { min: 0 }),
    P('tds', 'TDS', 'TDS', 'ppm', 0, 'avg', 'oTds', { min: 0 }),
    P('rec', 'ریکاوری', 'Recovery', '%', 1, 'avg', 'rec', { min: 0, max: 100 }),
    P('outage', 'مدت زمان خاموشی', 'Shutdown duration', 'h', 1, 'sum', 'outage', { min: 0, max: 24 }),
    P('cl', 'کلر باقی‌مانده خروجی کارخانه', 'Plant outlet residual chlorine', 'ppm', 2, 'avg', 'oCl', { min: 0 }),
    P('tkRaw', 'تراز مخزن آب خام', 'Raw water tank level', 'm³', 0, 'avg', 'tkRaw', { min: 0 }),
    P('tkProd', 'تراز مخزن آب محصول', 'Product water tank level', 'm³', 0, 'avg', 'tkProd', { min: 0 }),
    P('acid', 'تزریق اسید سولفوریک', 'Sulfuric acid injection', 'L', 1, 'sum', 'acid', { min: 0 }),
    P('smbs', 'تزریق سدیم متابی‌سولفیت (SMBS)', 'Sodium metabisulfite (SMBS) injection', 'L', 1, 'sum', 'smbs', { min: 0 }),
    P('clPrim', 'تزریق کلر اولیه', 'Primary chlorine injection', 'L', 1, 'sum', 'cl', { min: 0 }),
    P('clf', 'تزریق کلر نهایی', 'Final chlorine injection', 'L', 1, 'sum', 'clf', { min: 0 }),
    P('cartDp', 'اختلاف فشار کارتریج‌ها (ΔP)', 'Cartridge differential pressure (ΔP)', 'bar', 2, 'avg', 'cartDp', { min: 0 }),
    P('roFeedP', 'فشار خوراک RO', 'RO feed pressure', 'bar', 1, 'avg', 'roFeedP', { min: 0 }),
    P('roConcP', 'فشار کنسانتره RO', 'RO concentrate pressure', 'bar', 1, 'avg', 'roConcP', { min: 0 }),
    P('roPermQ', 'دبی پرمیت RO', 'RO permeate flow', 'm³/h', 1, 'avg', 'roPermQ', { min: 0 }),
    P('roTemp', 'دمای آب خوراک', 'Feed water temperature', '°C', 1, 'avg', 'roTemp', { min: 0, max: 60 })
  ];

  /* saved list (order, on/off, names, custom parameters) + any default that is not in it yet */
  function merge(saved) {
    var out = [], seen = {};
    (saved || []).forEach(function (s) {
      if (!s || !s.id || seen[s.id]) return; seen[s.id] = 1;
      var d = null; DEFAULTS.forEach(function (x) { if (x.id === s.id) d = x; });
      var base = d ? Object.assign({}, d) : { builtin: false, agg: 'avg', dec: 2, unit: '', src: null };
      var m = Object.assign(base, s); m.builtin = !!d; if (!d) { delete m.min; delete m.max; }
      m.dec = isFinite(Number(m.dec)) ? Math.max(0, Math.min(6, Number(m.dec))) : 2;
      if (!AGG[m.agg]) m.agg = 'avg';
      out.push(m);
    });
    DEFAULTS.forEach(function (d) { if (!seen[d.id]) out.push(Object.assign({}, d)); });
    return out;
  }
  function defaults() { return DEFAULTS.map(function (d) { return Object.assign({}, d); }); }

  /* ---------- helpers ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function lab(p, fa) { return fa ? p.fa : (p.en || p.fa); }
  function head(p, fa) { return lab(p, fa) + (p.unit ? ' (' + p.unit + ')' : ''); }
  function dateOf(r) { return r.date || r.id; }
  function inRange(r, rg) { var d = dateOf(r); return d >= rg.from && d <= rg.to; }
  function sortDays(a) { return a.slice().sort(function (x, y) { return String(dateOf(x)).localeCompare(String(dateOf(y))); }); }
  function chunk(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
  function recVal(r, id) { var v = r && r.v ? r.v[id] : null; return (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v); }
  function aggStats(p, recs) {
    var vals = []; recs.forEach(function (r) { var v = recVal(r, p.id); if (v !== null) vals.push(v); });
    if (!vals.length) return null;
    var s = 0, mn = vals[0], mx = vals[0]; vals.forEach(function (v) { s += v; if (v < mn) mn = v; if (v > mx) mx = v; });
    var avg = s / vals.length, last = vals[vals.length - 1];
    return { n: vals.length, sum: s, avg: avg, min: mn, max: mx, last: last, v: p.agg === 'sum' ? s : p.agg === 'last' ? last : avg };
  }
  function round(v, dec) { if (v === null || v === undefined) return ''; var k = Math.pow(10, dec); return Math.round(v * k) / k; }
  function reasonText(r, H) { var t = REASON[r.outageReason], s = t ? (H.fa ? t[0] : t[1]) : ''; if (r.outageNote) s += (s ? ' — ' : '') + r.outageNote; return s; }
  function worksOf(recs) {
    var out = [];
    recs.forEach(function (r) { (r.works || []).forEach(function (w) { var t = String(w == null ? '' : w).trim(); if (t) out.push({ date: dateOf(r), text: t }); }); });
    return out;
  }
  function jl(H, iso) { var p = H.isoToJ(iso); return p.year + '/' + pad2(p.month) + '/' + pad2(p.day); }   // Latin digits (Excel)
  function sumRows(H, params, recs) {
    var L = H.L;
    return params.map(function (p) {
      var a = aggStats(p, recs), f = function (v) { return a ? H.num(v, p.dec) : '—'; };
      return [lab(p, H.fa), p.unit || '—', a && p.agg === 'sum' ? f(a.sum) : '—', f(a && a.avg), f(a && a.min), f(a && a.max), a ? H.D(a.n) : '—'];
    });
  }
  function sumHead(H) { var L = H.L; return [L('پارامتر', 'Parameter'), L('واحد', 'Unit'), L('مجموع', 'Total'), L('میانگین', 'Average'), L('کمینه', 'Min'), L('بیشینه', 'Max'), L('روز ثبت‌شده', 'Days recorded')]; }
  function sumXl(H, params, recs) {
    return params.map(function (p) { var a = aggStats(p, recs); return [lab(p, H.fa), p.unit || '', a && p.agg === 'sum' ? round(a.sum, p.dec) : '', a ? round(a.avg, p.dec) : '', a ? round(a.min, p.dec) : '', a ? round(a.max, p.dec) : '', a ? a.n : 0]; });
  }
  function kpisFor(H, params, recs, ids) {
    var out = [];
    ids.forEach(function (id) {
      var p = null; params.forEach(function (x) { if (x.id === id) p = x; }); if (!p) return;
      var a = aggStats(p, recs); if (!a) return;
      out.push({ label: lab(p, H.fa) + ' — ' + (p.agg === 'sum' ? H.L('مجموع', 'total') : H.L('میانگین', 'average')), value: H.num(p.agg === 'sum' ? a.sum : a.avg, p.dec), unit: p.unit || '' });
      if (p.agg === 'sum' && id === 'prod' && recs.length > 1) out.push({ label: lab(p, H.fa) + ' — ' + H.L('میانگین روزانه', 'daily average'), value: H.num(a.avg, p.dec), unit: p.unit || '' });
    });
    return out;
  }
  var CH = 6;   // parameters per table (keeps every table readable on a portrait page)
  function titleOf(H, kind) {
    var fa = { daily: 'روزانه', monthly: 'ماهانه', yearly: 'سالانه' }[kind], en = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' }[kind];
    return H.L('گزارش ' + fa + ' — ' + H.plant, en + ' report — ' + H.plant);
  }
  function xlTop(H, rep) { return [[rep.preparedBy], [rep.title], [rep.subtitle], []]; }

  /* ---------- the report ---------- */
  async function build(kind, rg, S, H) {
    var L = H.L, params = S.params || [], recs = sortDays((S.days || []).filter(function (r) { return inRange(r, rg); }));
    var rep = {
      title: titleOf(H, kind), subtitle: L('تحویل به کارفرما — ', 'Delivered to client — ') + rg.label,
      meta: [[L('بازه گزارش', 'Period'), rg.label]], preparedBy: H.fa ? PREP.fa : PREP.en, plain: true, sections: [], excelSheets: []
    };
    if (kind !== 'daily') rep.meta.push([L('تعداد روز دارای ثبت', 'Days with records'), H.D(recs.length)]);
    var outP = null, prodP = null, recP = null; params.forEach(function (p) { if (p.id === 'outage') outP = p; if (p.id === 'prod') prodP = p; if (p.id === 'rec') recP = p; });
    var works = worksOf(recs), remarks = String(S.remarks || '').trim();
    function finish() {
      if (remarks) {
        rep.sections.push({ title: L('توضیحات کلی', 'General remarks'), note: remarks });
        if (rep.excelSheets[0]) rep.excelSheets[0].rows = rep.excelSheets[0].rows.concat([[], [L('توضیحات کلی', 'General remarks')], [remarks]]);
      }
      return rep;
    }

    /* ===== daily ===== */
    if (kind === 'daily') {
      var r = recs[0] || null, rows = [], xl = [];
      params.forEach(function (p) {
        var v = recVal(r, p.id);
        rows.push([lab(p, H.fa), v === null ? '—' : H.num(v, p.dec), p.unit || '—']); xl.push([lab(p, H.fa), v === null ? '' : round(v, p.dec), p.unit || '']);
        if (p.id === 'outage' && r && (r.outageReason || r.outageNote) && (recVal(r, 'outage') || 0) > 0) { rows.push([L('علت خاموشی', 'Shutdown reason'), reasonText(r, H), '—']); xl.push([L('علت خاموشی', 'Shutdown reason'), reasonText(r, H), '']); }
      });
      var kp = r ? kpisFor(H, params, [r], ['prod', 'rec', 'outage']).map(function (k) { return { label: k.label.split(' — ')[0], value: k.value, unit: k.unit }; }).filter(function (k, i, a) { return a.findIndex(function (z) { return z.label === k.label; }) === i; }) : [];
      rep.sections.push({ title: L('پارامترهای تولید و کیفیت', 'Production & quality parameters'), kpis: kp, table: { head: [L('پارامتر', 'Parameter'), L('مقدار', 'Value'), L('واحد', 'Unit')], rows: rows }, note: r ? '' : L('برای این روز اطلاعاتی ثبت نشده است.', 'No data recorded for this day.') });
      rep.sections.push({ title: L('کارهای انجام‌شده', 'Work carried out'), table: { head: [L('ردیف', 'No.'), L('شرح کار', 'Description')], rows: works.map(function (w, i) { return [H.D(i + 1), w.text]; }) } });
      if (r && r.note) rep.sections.push({ title: L('توضیحات', 'Remarks'), note: r.note });
      rep.excelSheets.push({ name: L('گزارش روزانه', 'Daily report'), rows: xlTop(H, rep).concat([[L('پارامتر', 'Parameter'), L('مقدار', 'Value'), L('واحد', 'Unit')]], xl, [[], [L('کارهای انجام‌شده', 'Work carried out')], [L('ردیف', 'No.'), L('شرح کار', 'Description')]], works.map(function (w, i) { return [i + 1, w.text]; }), r && r.note ? [[], [L('توضیحات', 'Remarks'), r.note]] : []) });
      return finish();
    }

    /* ===== monthly / yearly ===== */
    var groups = chunk(params, CH), n = groups.length;
    var keyIds = ['prod', 'rec', 'ph', 'outage'];
    var kpis = kpisFor(H, params, recs, keyIds);
    var jy = rg.jy, jm = rg.jm;
    var sumNote = L('«مجموع» فقط برای پارامترهای تجمعی (مثل حجم تولید) محاسبه می‌شود؛ سایر پارامترها میانگین‌گیری می‌شوند.', 'Total is only calculated for cumulative parameters (e.g. production volume); the others are averaged.');
    var chartSec = null, ch = [];

    if (kind === 'monthly') {
      var nd = H.daysInJ(jy, jm), byDate = {}; recs.forEach(function (x) { byDate[dateOf(x)] = x; });
      var labels = [], pv = [], rv = [];
      for (var d = 1; d <= nd; d++) { var iso = H.jToISO(jy, jm, d), x = byDate[iso]; labels.push(H.D(d)); pv.push(x ? recVal(x, 'prod') : null); rv.push(x ? recVal(x, 'rec') : null); }
      if (prodP && pv.some(function (v) { return v !== null; })) { var u1 = await H.chart(H.barCfg(labels, lab(prodP, H.fa) + (prodP.unit ? ' (' + prodP.unit + ')' : ''), pv, '#1565c0')); if (u1) ch.push({ title: L('نمودار تولید روزانه', 'Daily production'), chart: u1 }); }
      if (recP && rv.some(function (v) { return v !== null; })) { var u2 = await H.chart(H.lineCfg(labels, lab(recP, H.fa) + ' (%)', rv, '#7c5cff')); if (u2) ch.push({ title: L('نمودار ریکاوری', 'Recovery'), chart: u2 }); }
      rep.sections.push({ title: L('خلاصه عملکرد ماه', 'Month summary'), kpis: kpis, note: sumNote, table: { head: sumHead(H), rows: sumRows(H, params, recs) } });
      ch.forEach(function (c) { rep.sections.push(c); });
      groups.forEach(function (grp, i) {
        rep.sections.push({ title: L('جدول روزانه', 'Daily table') + (n > 1 ? ' — ' + L('بخش ', 'part ') + H.D(i + 1) + '/' + H.D(n) : ''),
          table: { head: [L('تاریخ', 'Date')].concat(grp.map(function (p) { return head(p, H.fa); })), rows: recs.map(function (x) { return [H.jStr(dateOf(x))].concat(grp.map(function (p) { var v = recVal(x, p.id); return v === null ? '—' : H.num(v, p.dec); })); }) } });
      });
      if (outP) {
        var orows = recs.filter(function (x) { return (recVal(x, 'outage') || 0) > 0; }).map(function (x) { return [H.jStr(dateOf(x)), H.num(recVal(x, 'outage'), outP.dec) + ' ' + (outP.unit || ''), reasonText(x, H) || '—']; });
        rep.sections.push({ title: L('خاموشی‌ها (قطع برق / درخواست کارفرما)', 'Shutdowns (power cut / client request)'), table: { head: [L('تاریخ', 'Date'), L('مدت', 'Duration'), L('علت', 'Reason')], rows: orows }, note: orows.length ? '' : L('در این ماه خاموشی ثبت نشده است.', 'No shutdown recorded this month.') });
      }
      rep.sections.push({ title: L('کارهای انجام‌شده', 'Work carried out'), table: { head: [L('تاریخ', 'Date'), L('شرح کار', 'Description')], rows: works.map(function (w) { return [H.jStr(w.date), w.text]; }) } });
      var xd = recs.map(function (x) { return [jl(H, dateOf(x))].concat(params.map(function (p) { var v = recVal(x, p.id); return v === null ? '' : round(v, p.dec); }), [reasonText(x, H), x.note || '']); });
      rep.excelSheets.push({ name: L('جدول روزانه', 'Daily table'), rows: xlTop(H, rep).concat([[L('تاریخ', 'Date')].concat(params.map(function (p) { return head(p, H.fa); }), [L('علت خاموشی', 'Shutdown reason'), L('توضیحات', 'Remarks')])], xd) });
      rep.excelSheets.push({ name: L('خلاصه آماری', 'Statistics'), rows: xlTop(H, rep).concat([sumHead(H)], sumXl(H, params, recs)) });
      rep.excelSheets.push({ name: L('کارهای انجام‌شده', 'Work carried out'), rows: xlTop(H, rep).concat([[L('تاریخ', 'Date'), L('شرح کار', 'Description')]], works.map(function (w) { return [jl(H, w.date), w.text]; })) });
      return finish();
    }

    /* yearly */
    var months = [], mlab = [], mp = [], mr = [];
    for (var m = 1; m <= 12; m++) {
      var f = H.jToISO(jy, m, 1), t = H.jToISO(jy, m, H.daysInJ(jy, m)), mrecs = recs.filter(function (x) { var dd = dateOf(x); return dd >= f && dd <= t; });
      months.push({ m: m, recs: mrecs }); mlab.push(H.mName(m));
      var pa = prodP ? aggStats(prodP, mrecs) : null, ra = recP ? aggStats(recP, mrecs) : null; mp.push(pa ? pa.sum : null); mr.push(ra ? ra.avg : null);
    }
    if (prodP && mp.some(function (v) { return v !== null; })) { var u3 = await H.chart(H.barCfg(mlab, lab(prodP, H.fa) + (prodP.unit ? ' (' + prodP.unit + ')' : '') + ' — ' + L('مجموع ماهانه', 'monthly total'), mp, '#1565c0')); if (u3) ch.push({ title: L('نمودار تولید ماهانه', 'Monthly production'), chart: u3 }); }
    if (recP && mr.some(function (v) { return v !== null; })) { var u4 = await H.chart(H.lineCfg(mlab, lab(recP, H.fa) + ' (%) — ' + L('میانگین ماهانه', 'monthly average'), mr, '#7c5cff')); if (u4) ch.push({ title: L('نمودار ریکاوری', 'Recovery'), chart: u4 }); }
    rep.sections.push({ title: L('خلاصه عملکرد سال', 'Year summary'), kpis: kpis, note: sumNote, table: { head: sumHead(H), rows: sumRows(H, params, recs) } });
    ch.forEach(function (c) { rep.sections.push(c); });
    groups.forEach(function (grp, i) {
      var rows2 = months.map(function (o) { return [H.mName(o.m)].concat(grp.map(function (p) { var a = aggStats(p, o.recs); return a ? H.num(a.v, p.dec) : '—'; })); });
      rows2.push([L('کل سال', 'Whole year')].concat(grp.map(function (p) { var a = aggStats(p, recs); return a ? H.num(a.v, p.dec) : '—'; })));
      rep.sections.push({ title: L('جدول ماهانه', 'Monthly table') + (n > 1 ? ' — ' + L('بخش ', 'part ') + H.D(i + 1) + '/' + H.D(n) : ''), table: { head: [L('ماه', 'Month')].concat(grp.map(function (p) { return head(p, H.fa); })), rows: rows2 } });
    });
    if (outP) {
      var yr = months.map(function (o) { var a = aggStats(outP, o.recs), days = o.recs.filter(function (x) { return (recVal(x, 'outage') || 0) > 0; }).length; return [H.mName(o.m), a ? H.num(a.sum, outP.dec) + ' ' + (outP.unit || '') : '—', H.D(days)]; });
      rep.sections.push({ title: L('خاموشی‌ها به تفکیک ماه', 'Shutdowns by month'), table: { head: [L('ماه', 'Month'), L('مجموع مدت', 'Total duration'), L('تعداد روز دارای خاموشی', 'Days with shutdown')], rows: yr } });
    }
    rep.sections.push({ title: L('تعداد کارهای انجام‌شده به تفکیک ماه', 'Work items by month'), table: { head: [L('ماه', 'Month'), L('روز دارای ثبت', 'Days recorded'), L('تعداد کار ثبت‌شده', 'Work items')], rows: months.map(function (o) { return [H.mName(o.m), H.D(o.recs.length), H.D(worksOf(o.recs).length)]; }) } });
    rep.sections.push({ title: L('فهرست کارهای انجام‌شده', 'Work carried out — full list'), table: { head: [L('تاریخ', 'Date'), L('شرح کار', 'Description')], rows: works.map(function (w) { return [H.jStr(w.date), w.text]; }) } });
    var xm = months.map(function (o) { return [H.mName(o.m)].concat(params.map(function (p) { var a = aggStats(p, o.recs); return a ? round(a.v, p.dec) : ''; })); });
    xm.push([L('کل سال', 'Whole year')].concat(params.map(function (p) { var a = aggStats(p, recs); return a ? round(a.v, p.dec) : ''; })));
    rep.excelSheets.push({ name: L('جدول ماهانه', 'Monthly table'), rows: xlTop(H, rep).concat([[L('ماه', 'Month')].concat(params.map(function (p) { return head(p, H.fa); }))], xm) });
    rep.excelSheets.push({ name: L('خلاصه آماری', 'Statistics'), rows: xlTop(H, rep).concat([sumHead(H)], sumXl(H, params, recs)) });
    rep.excelSheets.push({ name: L('جدول روزانه', 'Daily table'), rows: xlTop(H, rep).concat([[L('تاریخ', 'Date')].concat(params.map(function (p) { return head(p, H.fa); }), [L('علت خاموشی', 'Shutdown reason'), L('توضیحات', 'Remarks')])], recs.map(function (x) { return [jl(H, dateOf(x))].concat(params.map(function (p) { var v = recVal(x, p.id); return v === null ? '' : round(v, p.dec); }), [reasonText(x, H), x.note || '']); })) });
    rep.excelSheets.push({ name: L('کارهای انجام‌شده', 'Work carried out'), rows: xlTop(H, rep).concat([[L('تاریخ', 'Date'), L('شرح کار', 'Description')]], works.map(function (w) { return [jl(H, w.date), w.text]; })) });
    return finish();
  }

  g.SWRO_CLIENT = { PREP: PREP, REASON: REASON, AGG: AGG, DEFAULTS: DEFAULTS, defaults: defaults, merge: merge, build: build, aggStats: aggStats, recVal: recVal, worksOf: worksOf, reasonText: reasonText };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.SWRO_CLIENT;
})(typeof window !== 'undefined' ? window : globalThis);
