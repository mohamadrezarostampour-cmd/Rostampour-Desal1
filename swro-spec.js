/* =========================================================================
   Rostampour SWRO NV — equipment / valve / pipe specification catalog
   Source: contractor's "Appendix 1" (مشخصات آبشیرین‌کن و شرح کار اجرایی, 48 pp), page numbers in `src`.
   Rule: every number below was read from the document; anything the document does not state is shown as
   «در سند ذکر نشده» — nothing is invented. Known inconsistencies inside the document are kept visible (`note`).
   API: window.SWRO_SPEC = { forElement(id), forValve(id), forPipe(key), PIPES, ND }
   ========================================================================= */
(function () {
  'use strict';
  const ND = 'در سند ذکر نشده';
  const r = (fa, en, v) => [fa, en, v];

  /* ---------- equipment (key = element id without trailing digits) ---------- */
  const EL = {
    well: { fa: 'پمپ چاه', en: 'Well pump', src: 'ص ۱۰', rows: [
      r('تعداد در سند', 'Count in document', '۷ ایستگاه چاه (برای ۱۱ حلقه چاه توسعه‌پذیر)'),
      r('سازنده / نوع', 'Make / type', 'RITZ — U6616/2+1216 (طبق سند)'),
      r('ظرفیت هر پمپ', 'Capacity per pump', '208 m³/h'), r('ظرفیت کل ۷ ایستگاه', 'Total of 7 stations', '1107 m³/h'),
      r('توان نامی موتور', 'Motor rating', '37 kW'), r('سرعت', 'Speed', '2900 rpm'), r('راندمان', 'Efficiency', '≈ 74.4 %'),
      r('تغذیه برق / حفاظت', 'Supply / protection', '400 V, 50 Hz — IP68'), r('اتصال سر چاه', 'Wellhead connection', 'DN200 PN10'), r('کابل پمپ', 'Pump cable', '50 m')],
      note: ['در حال حاضر ۷ چاه فعال و ۴ چاه برای توسعه آینده غیرفعال‌اند؛ از «تنظیمات کارخانه» قابل فعال‌سازی است.', 'Currently 7 wells are active and 4 are reserved for expansion; activate them in Plant settings.'] },
    chlor: { fa: 'تزریق کلر اولیه (هیپوکلریت سدیم)', en: 'Primary chlorine dosing (sodium hypochlorite)', src: 'ص ۲۶', rows: [
      r('دوز طراحی', 'Design dose', '6 mg/L Cl₂ (بر پایه ۱۱۶۰ m³/h آب خام)'), r('دبی پمپ پیمانه', 'Dosing pump flow', '≈ 140 L/h (محلول ≈ 5 %)'),
      r('اتصال مکش/تخلیه', 'Suction / discharge', 'شیلنگ PVC 6×8 mm'), r('وظیفه', 'Duty', 'گندزدایی جزئی آب خام قبل از فیلتراسیون')] },
    filt: { fa: 'فیلتر شنی (مدیا افقی)', en: 'Multimedia pressure filter (horizontal)', src: 'ص ۱۱–۱۳', rows: [
      r('تعداد', 'Count', '6'), r('دبی طرح هر فیلتر', 'Design flow / filter', '≈ 193 m³/h (حداکثر 243 m³/h)'),
      r('سطح فیلتراسیون', 'Filter area', '≈ 18 m² هر فیلتر (کل ≈ 108 m²)'), r('سرعت فیلتراسیون', 'Filtration velocity', '≈ 10.7 m/h با ۶ فیلتر؛ ≈ 12.85 m/h با ۵ فیلتر'),
      r('مخزن', 'Vessel', 'استوانه افقی Ø2800 mm × 7600 mm (کل ≈ 9400 mm)، فولاد ST-37 با روکش اپوکسی'),
      r('فشار کاری / آزمایش', 'Working / test pressure', '2.5 bar / 4 bar'), r('نازل‌ها', 'Nozzles', 'پلی‌پروپیلن 75 pcs/m²'), r('آند محافظ', 'Anodes', 'منگنز (برابر آب دریا)'),
      r('پس‌شویی', 'Backwash', '≈ 35 m³/m²/h آب + ≈ 70 m³/m²/h هوا؛ مصرف آب ≈ 138 m³ در هر نوبت'),
      r('شیرهای هر فیلتر', 'Valves per filter', 'ورودی آب DN200 PN10 · خروجی آب DN200 PN10 · ورودی آب پس‌شویی DN300 PN10 · ورودی هوا DN150 · اولین صافی DN200 (پروانه‌ای واشردار)')] },
    raw: { fa: 'مخزن آب خام (مخزن واسط)', en: 'Raw / intermediate tank', src: 'ص ۱۵', rows: [
      r('ورودی آب تصفیه‌شده', 'Inlet', 'DN500 PN10'), r('خروجی‌ها', 'Outlets', '۲ خروجی DN800 PN10 (یکی برای توسعه آینده)'), r('سرریز', 'Overflow', 'DN800 PN10'),
      r('زهکشی', 'Drain', 'DN200 PN10'), r('کنترل سطح', 'Level control', 'اولتراسونیک ۱۰۰٪'), r('ظرفیت حجمی', 'Volume', ND)] },
    feed: { fa: 'پمپ تغذیه RO (خوراک)', en: 'RO feed pump', src: 'ص ۱۵', rows: [
      r('تعداد', 'Count', '2'), r('نوع', 'Type', 'سانتریفوژ عمودی — Ritz یا معادل (Norma)'), r('ظرفیت', 'Capacity', '630 m³/h'), r('ارتفاع', 'Head', '34 m'),
      r('سرعت', 'Speed', '1465 rpm'), r('توان در نقطه کار', 'Shaft power', '68.8 kW'), r('توان نامی موتور', 'Motor', '90 kW — 400 V / 50 Hz — IP55'),
      r('جنس', 'Material', 'پوسته برنز · محور 1.4401 · پروانه برنز · آب‌بندی مکانیکی'), r('مکش / تخلیه', 'Suction / discharge', 'DN250 PN10 / DN200 PN10'),
      r('کنترل', 'Control', 'مبدل فرکانس (راه‌اندازی نرم)')] },
    acid: { fa: 'تزریق اسید', en: 'Acid dosing', src: '—', rows: [r('مشخصات', 'Spec', ND), r('نقطه تزریق در PFD', 'Injection point in PFD', 'مخزن آب خام (طبق تصمیم کارفرما)')],
      note: ['در سند پیمانکار تزریق اسید توصیف نشده است؛ نقطه نمونه‌برداری ۲ (pH بعد از اسید) در برنامه حفظ شده است.', 'The contractor document does not describe acid dosing; sampling point 2 is retained.'] },
    as: { fa: 'تزریق ضدرسوب (آنتی‌اسکالانت)', en: 'Antiscalant dosing', src: 'ص ۲۸–۳۰', rows: [
      r('محصول', 'Product', 'RPI-3000A یا معادل'), r('دوز طراحی', 'Design dose', '4 mg/L (≈ 4.3 L/h)'), r('پمپ پیمانه', 'Dosing pump', '۱ دستگاه — GA…-P1M2، 230 V / 50 Hz'),
      r('فشار تخلیه', 'Discharge pressure', '10 bar'), r('اتصال', 'Connections', 'شیلنگ PVC 6×8 mm'), r('محل تزریق', 'Injection point', 'قبل از فیلتر فشنگی (کارتریج)')] },
    smbs: { fa: 'تزریق SMBS (بی‌سولفیت سدیم)', en: 'SMBS dosing', src: 'ص ۲۶', rows: [
      r('دوز طراحی', 'Design dose', '20 mg/L'), r('دبی پمپ پیمانه', 'Dosing pump flow', '≈ 232 L/h (برای ۱۱۶۰ m³/h)'), r('محلول', 'Solution', '≈ 10 % وزنی'),
      r('وظیفه', 'Duty', 'حذف کلر باقی‌مانده و محافظت از ممبران'), r('اتصال', 'Connections', 'شیلنگ PVC 6×8 mm')] },
    cart: { fa: 'فیلتر کارتریج (فشنگی) ۵ میکرون', en: 'Cartridge filter 5 µm', src: 'ص ۱۷', rows: [
      r('تعداد', 'Count', '5 (یکی برای هر خط RO)'), r('درجه فیلتراسیون', 'Rating', '5 µm'), r('فشار کاری / آزمایش', 'Working / test pressure', '3 bar / 4.5 bar'),
      r('مخزن', 'Vessel', 'استوانه عمودی فولاد کربنی با روکش اپوکسی'), r('نگهدارنده فشنگی', 'Cartridge holders', 'PE'),
      r('لوله‌کشی', 'Piping', 'PVC (ورودی و خروجی)'), r('افت فشار هشدار', 'ΔP alarm', 'تعویض بر پایه افزایش ΔP نسبت به حالت تمیز')] },
    hp: { fa: 'پمپ فشار قوی RO', en: 'HP pump', src: 'ص ۱۸–۱۹', rows: [
      r('تعداد', 'Count', '5 (هر RO یک پمپ)'), r('نوع / سازنده', 'Type / make', 'سانتریفوژ چندمرحله‌ای — Duechting یا معادل'),
      r('ظرفیت', 'Capacity', '231.5 m³/h'), r('ارتفاع', 'Head', '744 m'), r('سرعت', 'Speed', '2980 rpm'), r('توان در نقطه کار', 'Shaft power', '559 kW'),
      r('راندمان', 'Efficiency', '78.5 %'), r('موتور', 'Motor', '450 kW — 400 V / 50 Hz — IP55 (ABB M3… IMB3)'),
      r('جنس', 'Material', 'پوسته/پروانه/پخش‌کن 1.4468 · محور 1.4462'), r('مکش / تخلیه', 'Suction / discharge', 'DN100 PN10 / DN150 PN10'),
      r('کنترل', 'Control', 'همراه توربین پلتون روی یک فریم بتنی')] },
    ro: { fa: 'واحد اسمز معکوس (RO)', en: 'RO unit', src: 'ص ۲۰–۲۱', rows: [
      r('تعداد واحد در سند', 'Units in document', '5 (۵ خط موازی، یک مرحله‌ای)'), r('ظرفیت هر واحد', 'Capacity / unit', '104.2 m³/h = 2500 m³/day'), r('کل کارخانه', 'Plant total', '12 500 m³/day'),
      r('ریکاوری', 'Recovery', 'طرح ۴۰٪ (طبق سند)؛ نسبت دبی‌ها 104.2/231.5 ≈ ۴۵٪ — اپراتور: ۴۰ تا ۴۵٪ بسته به واحد'),
      r('دبی خوراک / پرمیت / آب شور', 'Feed / permeate / brine', '231.5 / 104.2 / 127.3 m³/h'),
      r('مخزن فشار', 'Pressure vessels', '۳۱ عدد BEKA PV 826K — PN85 (۸ اینچ)'), r('المان در هر ظرف', 'Elements per vessel', '7'),
      r('تعداد المان / واحد', 'Elements / unit', '217 (FILMTEC یا معادل)؛ توجه: جمع کل سند ۱۰۸۵ در برابر ۱۰۵۸ — ناسازگاری سند'),
      r('دمای کاری', 'Design temperature', '20–25 °C (طرح 22 °C)'), r('فشار خوراک (اولیه / پس از ۳ سال)', 'Feed pressure (initial / year 3)', '73.11 bar / 73.45 bar (طرح پمپ)'),
      r('افت فشار مانیفولد', 'Manifold ΔP', '1.52 bar'), r('فشار آب شور', 'Brine pressure', '71.93 bar'),
      r('جنس لوله فشار قوی', 'HP pipe', 'دوپلکس 1.4462'), r('pH کار / شست‌وشو', 'Working / cleaning pH', '≈ 7.8 / 1 تا 12')] },
    turb: { fa: 'توربین پلتون', en: 'Pelton turbine', src: 'ص ۱۹', rows: [
      r('تعداد', 'Count', '5 (هر RO یک توربین روی محور پمپ فشار قوی همان RO)'), r('نوع', 'Type', 'ROWA-RT 80-350-1'),
      r('دبی آب شور', 'Brine flow', '127.3 m³/h'), r('فشار ورودی', 'Inlet pressure', '≈ 69.2 bar'), r('راندمان', 'Efficiency', '87.5 %'),
      r('توان بازیابی', 'Recovered power', '220.6 kW (≈ ۳۸ تا ۴۲٪ توان مصرفی)'), r('وسیله', 'Fluid', 'آب شور RO — چگالی ≈ 1050 kg/m³')] },
    prod: { fa: 'مخزن آب تولیدی', en: 'Product water tank', src: 'ص ۲۳', rows: [
      r('تعداد / حجم', 'Count / volume', '1 — ≈ 1000 m³'), r('ساخت', 'Construction', 'بتنی با پوشش تأییدشده برای آب آشامیدنی'),
      r('ابعاد', 'Dimensions', 'طول ≈ 16 m · عمق ≈ 4.5 m · عرض ≈ 16 m'), r('اتصالات', 'Connections', 'ورودی DN350 PN10 · خروجی DN500 PN10 · سرریز DN400 · زهکشی DN200'),
      r('کنترل سطح', 'Level control', 'اولتراسونیک')] },
    lime: { fa: 'بستر سنگ آهک (سبد مرمر)', en: 'Limestone bed (marble basket)', src: 'ص ۲۶', rows: [
      r('هدف', 'Purpose', 'کاهش CO₂ و افزایش pH/سختی/قلیاییت پرمیت'), r('سبد', 'Basket', 'Ø800 mm × L2000 mm — 1.4404 (سوراخ‌های 5 mm، ضخامت 12 mm)'),
      r('حجم سنگ مرمر', 'Marble volume', '≈ 0.9 m³'), r('نگهداری', 'Maintenance', 'هر چند وقت یک بار پر شود')] },
    limep: { fa: 'تزریق پودر آهک (رزرو)', en: 'Lime-powder dosing (reserve)', src: '—', rows: [r('مشخصات', 'Spec', ND), r('وضعیت', 'Status', 'رزرو — در سند پیمانکار پیش‌بینی نشده')],
      note: ['در سند پیمانکار نیست؛ طبق درخواست اپراتور به‌عنوان رزرو کنار مخزن آب تولیدی در PFD آمده و قابل فعال/غیرفعال است.', 'Not in the contractor document; added as an operator-requested reserve.'] },
    co2: { fa: 'مخزن CO₂ (رزرو)', en: 'CO₂ tank (reserve)', src: '—', rows: [r('مشخصات', 'Spec', ND), r('وضعیت', 'Status', 'رزرو — در سند پیمانکار پیش‌بینی نشده')],
      note: ['در سند پیمانکار نیست؛ طبق درخواست اپراتور به‌عنوان رزرو در PFD آمده و قابل فعال/غیرفعال است.', 'Not in the contractor document; reserve added at operator request.'] },
    out: { fa: 'پمپ انتقال آب تصفیه‌شده (ارسال)', en: 'Transfer pump', src: 'ص ۲۳', rows: [
      r('تعداد در سند', 'Count in document', '4'), r('نوع', 'Type', 'سانتریفوژ افقی — Ritz یا معادل (Norma 200-500-200/4)'),
      r('ظرفیت', 'Capacity', '525 m³/h'), r('ارتفاع', 'Head', '85 m'), r('سرعت', 'Speed', '1490 rpm'), r('توان در نقطه کار', 'Shaft power', '182.8 kW'),
      r('موتور', 'Motor', '200 kW — 400 V / 50 Hz — IP55'), r('جنس', 'Material', 'پوسته GG25 · محور 1.4401 · پروانه برنز'), r('مکش / تخلیه', 'Suction / discharge', 'DN250 PN10 / DN200 PN10')],
      note: ['سند ۴ پمپ ذکر کرده ولی در PFD برنامه طبق تصمیم اپراتور ۳ پمپ رسم شده است.', 'Document says 4 pumps; the app PFD shows 3 by operator decision.'] },
    outchl: { fa: 'تزریق کلر نهایی', en: 'Final chlorine dosing', src: 'ص ۲۶', rows: [
      r('دوز طراحی', 'Design dose', '1.5 mg/L Cl₂ (بر پایه ۵۲۵ m³/h)'), r('دبی پمپ پیمانه', 'Dosing pump flow', '≈ 15.7 L/h'), r('اتصال', 'Connections', 'شیلنگ PVC 6×8 mm')] },
    cip: { fa: 'سیستم شست‌وشوی شیمیایی (CIP)', en: 'CIP system', src: 'ص ۲۱', rows: [
      r('مخزن', 'Tank', '۱ عدد — Ø2600 × 2600 mm — ≈ 12 m³'), r('اتصالات مخزن', 'Tank connections', 'ورودی DN80 PN10 · خروجی DN250 PN10'),
      r('پمپ‌ها', 'Pumps', '۲ پمپ: یکی مخلوط‌کن شیمیایی و یکی شست‌وشو'), r('فیلتر', 'Filter', 'فیلتر کارتریج 5 µm'), r('گرمکن', 'Heater', 'برقی — تا 35 °C'),
      r('کنترل سطح', 'Level switch', '۳ نقطه: بالا، پایین، خیلی پایین')] },
    bw: { fa: 'پمپ پس‌شویی فیلترهای شنی', en: 'Backwash pump', src: 'ص ۱۵', rows: [
      r('تعداد', 'Count', '1'), r('نوع', 'Type', 'سانتریفوژ عمودی — Ritz (Norma 200-330-t)'), r('ظرفیت', 'Capacity', '630 m³/h'), r('ارتفاع', 'Head', '20–22 m'),
      r('سرعت', 'Speed', '1465 rpm'), r('توان در نقطه کار', 'Shaft power', '47.5 kW'), r('موتور', 'Motor', '55 kW — 400 V / 50 Hz — IP55'), r('مکش / تخلیه', 'Suction / discharge', 'DN250 PN10 / DN200 PN10')] },
    comp: { fa: 'کمپرسور هوا', en: 'Air compressor', src: 'ص ۱۴–۱۶', rows: [
      r('تعداد', 'Count', '2 (به یک خط هوای مشترک و ۶ فیلتر شنی وصل‌اند)'), r('ظرفیت هر کمپرسور', 'Capacity each', '72 m³/h — 11 kW — 7–8 bar'),
      r('کاربرد', 'Use', 'هوای پس‌شویی فیلترها و هوای ابزار (شیرهای پنوماتیک)'), r('ورودی هوا به فیلتر', 'Air inlet at filter', 'DN150 PN10')] },
    dist: { fa: 'ایستگاه توزیع پارس', en: 'Pars distribution station', src: '—', rows: [r('خط انتقال', 'Transfer line', 'مخزن توزیع ≈ 5 km — جزئیات: ' + ND)] }
  };

  /* ---------- valves (by element key + suffix) ---------- */
  const VALVES = {
    'well': ['شیر قطع‌ووصل هر چاه', 'Well isolation valve', 'اتصال هر سرچاه DN200 PN10 (نوع شیر مشخص نشده)'],
    'filt.in': ['شیر پروانه‌ای ورودی آب فیلتر', 'Filter inlet butterfly valve', 'DN200 PN10 · واشردار · عملگر پنوماتیک'],
    'filt.out': ['شیر پروانه‌ای خروجی آب فیلتر', 'Filter outlet butterfly valve', 'DN200 PN10 · واشردار · عملگر پنوماتیک'],
    'raw.in': ['شیر ورودی مخزن آب خام', 'Raw tank inlet valve', 'DN500 PN10'],
    'raw.out': ['شیر خروجی مخزن آب خام', 'Raw tank outlet valve', 'DN800 PN10'],
    'feed.in': ['شیر مکش پمپ خوراک', 'Feed pump suction valve', 'DN250 PN10 · پروانه‌ای'],
    'feed.out': ['شیر تخلیه پمپ خوراک', 'Feed pump discharge valve', 'DN200 PN10 · پروانه‌ای + شیر یکطرفه خودکار'],
    'cart.in': ['شیر ورودی کارتریج', 'Cartridge inlet valve', 'DN150 PN10 · پروانه‌ای دستی'],
    'cart.out': ['شیر خروجی کارتریج', 'Cartridge outlet valve', 'DN150 PN10 · پروانه‌ای دستی'],
    'hp.in': ['شیر مکش پمپ فشار قوی', 'HP pump suction valve', 'DN100 PN10 · پروانه‌ای'],
    'hp.out': ['شیر تخلیه پمپ فشار قوی', 'HP pump discharge valve', 'DN150 PN10 · با نازل یکطرفه خودکار'],
    'prod.in': ['شیر ورودی مخزن آب تولیدی', 'Product tank inlet valve', 'DN350 PN10'],
    'prod.out': ['شیر خروجی مخزن آب تولیدی', 'Product tank outlet valve', 'DN500 PN4 · پروانه‌ای دستی'],
    'out.in': ['شیر مکش پمپ ارسال', 'Transfer pump suction valve', 'DN400 PN4 · پروانه‌ای دستی (ایستگاه پمپ)'],
    'out.out': ['شیر تخلیه پمپ ارسال', 'Transfer pump discharge valve', 'DN300 PN10 · دستی + شیر یکطرفه نازل خودکار DN300 PN10'],
    'chlor.v': ['شیر خط تزریق کلر', 'Chlorine dosing-line valve', 'شیلنگ/لوله PVC 6×8 mm (شیر ایزوله مشخص نشده)'],
    'acid.v': ['شیر خط تزریق اسید', 'Acid dosing-line valve', ND],
    'smbs.v': ['شیر خط تزریق SMBS', 'SMBS dosing-line valve', 'شیلنگ/لوله PVC 6×8 mm'],
    'outchl.v': ['شیر خط تزریق کلر نهایی', 'Final chlorine dosing-line valve', 'شیلنگ/لوله PVC 6×8 mm']
  };

  /* ---------- pipes (key from SWRO_PFD classifier) ---------- */
  const PIPES = {
    wellbr: ['خط اتصال هر چاه به هدر', 'Well branch pipe', [r('اندازه / فشار', 'Size / rating', 'DN200 PN10'), r('جنس', 'Material', 'PE یا PVC (لوله‌های ایستگاه تصفیه)')]],
    wellhdr: ['هدر ورودی چاه‌ها', 'Well inlet header', [r('اندازه / فشار', 'Size / rating', 'DN250 PN10 (۲ پمپ) و DN300 PN6 (۳ پمپ) → خط اصلی DN500 PN6'), r('جنس', 'Material', 'PE یا PVC'), r('دبی', 'Flow', '≈ 1107 m³/h (۷ ایستگاه)')]],
    filtfeed: ['خط تغذیه فیلتراسیون‌ها', 'Filtration feed line', [r('اندازه / فشار', 'Size / rating', 'DN500 PN6 (خط تغذیه اصلی)'), r('جنس', 'Material', 'PE یا PVC'), r('دبی', 'Flow', '≈ 1160 m³/h آب خام')]],
    filtin: ['ورودی فیلتر شنی', 'Filter inlet pipe', [r('اندازه / فشار', 'Size / rating', 'DN200 PN10'), r('جنس', 'Material', 'PE یا PVC'), r('دبی طرح', 'Design flow', '≈ 193 m³/h')]],
    filtout: ['خروجی فیلتر شنی', 'Filter outlet pipe', [r('اندازه / فشار', 'Size / rating', 'DN200 PN10'), r('جنس', 'Material', 'PE یا PVC'), r('دبی طرح', 'Design flow', '≈ 193 m³/h')]],
    filtcoll: ['جمع‌کننده آب فیلتر‌شده ← مخزن آب خام', 'Filtered-water collector → raw tank', [r('اندازه / فشار', 'Size / rating', 'DN500 PN10 (ورودی مخزن)'), r('جنس', 'Material', 'PE یا PVC')]],
    rawout: ['خروجی مخزن آب خام (مکش پمپ‌های خوراک)', 'Raw tank outlet / feed-pump suction', [r('اندازه / فشار', 'Size / rating', 'خروجی مخزن DN800 PN10 · مکش پمپ DN250 PN10'), r('جنس', 'Material', 'فولاد کربنی با روکش اپوکسی (سمت مکش و تخلیه پمپ)')]],
    feedline: ['خط خوراک (بعد از پمپ‌ها تا کارتریج‌ها)', 'Feed line (pumps → cartridges)', [r('اندازه / فشار', 'Size / rating', 'تخلیه هر پمپ DN200 PN10؛ قطر خط مشترک: ' + ND), r('جنس', 'Material', 'فولاد کربنی با روکش اپوکسی / PVC'), r('دبی', 'Flow', '≈ 1160 m³/h')]],
    cartin: ['ورودی کارتریج', 'Cartridge inlet pipe', [r('اندازه', 'Size', 'DN150'), r('جنس', 'Material', 'PVC'), r('دبی', 'Flow', '231.5 m³/h')]],
    cartout: ['خروجی کارتریج ← مکش پمپ فشار قوی', 'Cartridge outlet → HP pump suction', [r('اندازه / فشار', 'Size / rating', 'DN150 (مکش پمپ فشار قوی DN100 PN10)'), r('جنس', 'Material', 'PVC'), r('دبی', 'Flow', '231.5 m³/h')]],
    hpout: ['خط فشار قوی (پمپ فشار قوی ← RO)', 'High-pressure line (HP pump → RO)', [r('اندازه / فشار', 'Size / rating', 'تخلیه پمپ DN150 PN10؛ فشار کاری ≈ 73 bar'), r('جنس', 'Material', 'فولاد دوپلکس 1.4462'), r('دبی', 'Flow', '231.5 m³/h')]],
    perm: ['خروجی پرمیت هر RO', 'RO permeate line', [r('جنس', 'Material', 'PVC / PE (لوله‌های غیرفشار قوی)'), r('دبی طرح', 'Design flow', '104.2 m³/h'), r('اندازه', 'Size', ND)]],
    permhdr: ['هدر پرمیت RO ها', 'Permeate header', [r('جنس', 'Material', 'PVC / PE'), r('دبی طرح کل', 'Total design flow', '≈ 521–525 m³/h'), r('اندازه', 'Size', ND)]],
    prodin: ['ورودی مخزن آب تولیدی', 'Product tank inlet', [r('اندازه / فشار', 'Size / rating', 'DN350 PN10'), r('جنس', 'Material', 'PVC / PE')]],
    xfer: ['خط مکش/تخلیه پمپ‌های ارسال', 'Transfer pump suction / discharge', [r('اندازه / فشار', 'Size / rating', 'مکش DN250–DN400 · تخلیه DN200–DN300 PN10'), r('جنس', 'Material', 'فولاد کربنی با روکش اپوکسی'), r('دبی', 'Flow', '525 m³/h هر پمپ')]],
    distline: ['خط انتقال به ایستگاه توزیع پارس', 'Transmission line to Pars station', [r('طول', 'Length', '≈ 5 km تا مخزن توزیع'), r('قطر / جنس', 'Size / material', ND)]],
    brine: ['آب شور فشار قوی (RO ← توربین پلتون)', 'HP brine (RO → Pelton turbine)', [r('فشار', 'Pressure', '≈ 71.9 bar (قبل از شیر کنترل) · ورودی توربین ≈ 69.2 bar'), r('جنس', 'Material', 'فولاد دوپلکس 1.4462'), r('دبی', 'Flow', '127.3 m³/h')]],
    brinehdr: ['هدر آب شور ← تخلیه به دریا', 'Brine header → sea discharge', [r('فشار', 'Pressure', 'کم‌فشار پس از توربین'), r('جنس / اندازه', 'Material / size', ND), r('دبی کل', 'Total flow', '≈ 636 m³/h')]],
    chem_chlor: ['خط تزریق کلر اولیه', 'Primary chlorine line', [r('جنس', 'Material', 'شیلنگ/لوله PVC 6×8 mm'), r('دوز', 'Dose', '6 mg/L')]],
    chem_acid: ['خط تزریق اسید ← مخزن آب خام', 'Acid line → raw tank', [r('جنس / اندازه', 'Material / size', ND)]],
    chem_as: ['خط تزریق ضدرسوب', 'Antiscalant line', [r('جنس', 'Material', 'شیلنگ PVC 6×8 mm'), r('دوز', 'Dose', '4 mg/L')]],
    chem_smbs: ['خط تزریق SMBS', 'SMBS line', [r('جنس', 'Material', 'شیلنگ PVC 6×8 mm'), r('دوز', 'Dose', '20 mg/L')]],
    chem_outchl: ['خط تزریق کلر نهایی', 'Final chlorine line', [r('جنس', 'Material', 'شیلنگ PVC 6×8 mm'), r('دوز', 'Dose', '1.5 mg/L')]],
    chem_lime: ['خط تزریق پودر آهک / CO₂ (رزرو)', 'Lime-powder / CO₂ line (reserve)', [r('مشخصات', 'Spec', ND)]],
    chem_cip: ['خط شست‌وشوی شیمیایی (CIP)', 'CIP line', [r('اندازه / فشار', 'Size / rating', 'خروجی مخزن DN250 PN10'), r('جنس', 'Material', 'PVC / PE (CIP)')]],
    bwline: ['خط آب پس‌شویی ← فیلترها', 'Backwash water line', [r('اندازه / فشار', 'Size / rating', 'ورودی هر فیلتر DN300 PN10'), r('دبی', 'Flow', '≈ 630 m³/h')]],
    airline: ['خط هوای فشرده (کمپرسورها ← فیلترهای شنی)', 'Compressed air line', [r('اندازه / فشار', 'Size / rating', 'ورودی هوا DN150 PN10'), r('فشار', 'Pressure', '7–8 bar (کمپرسور)')]]
  };

  const elKey = (id) => /^turb/.test(id) ? 'turb' : String(id).replace(/\d+$/, '');
  const forElement = (id) => {
    const k = elKey(id), e = EL[k]; if (!e) return null;
    return { key: k, fa: e.fa, en: e.en, src: e.src, rows: e.rows, note: e.note || null };
  };
  const forValve = (vid) => {
    const m = String(vid).match(/^([a-z]+)(\d*)(?:\.(in|out|v))?$/); if (!m) return null;
    const k = m[1] + (m[3] ? '.' + m[3] : ''), v = VALVES[k] || (m[1] === 'well' ? VALVES.well : null); if (!v) return null;
    const elId = m[1] + m[2];
    return { id: vid, fa: v[0], en: v[1], rows: [r('مشخصات شیر', 'Valve data', v[2]), r('تجهیز مرتبط', 'Related equipment', elId)], elId, src: 'ص ۲۵' };
  };
  const forPipe = (key) => { const p = PIPES[key]; return p ? { key, fa: p[0], en: p[1], rows: p[2], src: 'ص ۱۱–۲۶' } : null; };

  window.SWRO_SPEC = { forElement, forValve, forPipe, PIPES, EL, VALVES, ND, elKey };
})();
