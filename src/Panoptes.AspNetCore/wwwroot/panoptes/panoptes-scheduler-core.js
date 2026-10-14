/**
 * Panoptes Scheduler — Çekirdek
 * Tarih hesapları, kültür & yerelleştirme, saat dilimi dönüşümleri, yineleme (RRULE) motoru,
 * iCalendar içe/dışa aktarımı ve veri kaynağı (yerel, REST, özel fonksiyon, gerçek zamanlı SSE).
 * Dış bağımlılık yoktur; yalnızca yerel tarayıcı API'leri (Intl, fetch, EventSource) kullanılır.
 */
(function (window) {
    'use strict';

    const Panoptes = window.Panoptes = window.Panoptes || {};
    const MS_MIN = 60000, MS_HOUR = 3600000, MS_DAY = 86400000;

    // ------------------------------------------------------------------
    // Tarih yardımcıları
    // ------------------------------------------------------------------
    const D = {
        MS_MIN, MS_HOUR, MS_DAY,
        startOfDay(d) { const x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; },
        addDays(d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; },
        addMinutes(d, n) { return new Date(d.getTime() + n * MS_MIN); },
        addMonths(d, n) {
            const x = new Date(d.getTime()); const day = x.getDate();
            x.setDate(1); x.setMonth(x.getMonth() + n);
            x.setDate(Math.min(day, D.daysInMonth(x.getFullYear(), x.getMonth())));
            return x;
        },
        daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); },
        sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); },
        startOfWeek(d, firstDay) { const x = D.startOfDay(d); return D.addDays(x, -((x.getDay() - firstDay + 7) % 7)); },
        startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); },
        dayDiff(a, b) { return Math.round((D.startOfDay(b) - D.startOfDay(a)) / MS_DAY); },
        minutesOfDay(d) { return d.getHours() * 60 + d.getMinutes(); },
        atMinutes(day, minutes) { return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes, 0, 0); },
        isMidnight(d) { return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0; },
        parseTime(v, fallback) {
            if (v == null || v === '') return fallback;
            if (typeof v === 'number') return v;
            const m = /^(\d{1,2}):(\d{2})/.exec(String(v));
            return m ? (+m[1]) * 60 + (+m[2]) : fallback;
        },
        pad(n) { return String(n).padStart(2, '0'); },
        toLocalISO(d) {
            return `${d.getFullYear()}-${D.pad(d.getMonth() + 1)}-${D.pad(d.getDate())}T${D.pad(d.getHours())}:${D.pad(d.getMinutes())}:${D.pad(d.getSeconds())}`;
        },
        toDateKey(d) { return `${d.getFullYear()}-${D.pad(d.getMonth() + 1)}-${D.pad(d.getDate())}`; },
        toInput(d, dateOnly) { return dateOnly ? D.toDateKey(d) : D.toLocalISO(d).slice(0, 16); },
        /** Ofset içermeyen ISO metinleri yerel saat olarak, yalnızca tarih içerenleri yerel gece yarısı olarak çözer. */
        parse(v) {
            if (v == null || v === '') return null;
            if (v instanceof Date) return isNaN(v) ? null : new Date(v.getTime());
            if (typeof v === 'number') return new Date(v);
            const s = String(v).trim();
            const ms = /\/Date\((-?\d+)\)\//.exec(s);
            if (ms) return new Date(+ms[1]);
            const dOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
            if (dOnly) return new Date(+dOnly[1], +dOnly[2] - 1, +dOnly[3]);
            const d = new Date(s);
            return isNaN(d) ? null : d;
        },
        hasOffset(s) { return typeof s === 'string' && /(Z|[+-]\d{2}:?\d{2})$/i.test(s.trim()); },
        overlaps(aS, aE, bS, bE) { return aS < bE && aE > bS; },
        escape(s) {
            return s == null ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }
    };

    // ------------------------------------------------------------------
    // Saat dilimi (IANA) dönüşümleri — Intl.DateTimeFormat ile
    // ------------------------------------------------------------------
    const tzCache = new Map();
    function tzFormatter(tz) {
        let f = tzCache.get(tz);
        if (!f) {
            f = new Intl.DateTimeFormat('en-US', {
                timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            tzCache.set(tz, f);
        }
        return f;
    }
    function tzParts(date, tz) {
        const o = {};
        for (const p of tzFormatter(tz).formatToParts(date)) if (p.type !== 'literal') o[p.type] = +p.value;
        if (o.hour === 24) o.hour = 0;
        return o;
    }
    const TZ = {
        isValid(tz) { try { tzFormatter(tz); return true; } catch (e) { return false; } },
        /** Mutlak zamanı (UTC) verilen dilimin duvar saatine çevirir; sonuç yerel bileşenleri o dilimin saatini taşır. */
        toWall(date, tz) {
            if (!tz) return new Date(date.getTime());
            const p = tzParts(date, tz);
            return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
        },
        /** Duvar saatini (verilen dilimde) mutlak zamana çevirir. */
        fromWall(wall, tz) {
            if (!tz) return new Date(wall.getTime());
            const target = Date.UTC(wall.getFullYear(), wall.getMonth(), wall.getDate(), wall.getHours(), wall.getMinutes(), wall.getSeconds());
            let guess = target;
            for (let i = 0; i < 3; i++) {
                const p = tzParts(new Date(guess), tz);
                const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
                const diff = target - asUtc;
                if (!diff) break;
                guess += diff;
            }
            return new Date(guess);
        },
        offsetLabel(tz, at) {
            try {
                const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
                    .formatToParts(at || new Date()).find(x => x.type === 'timeZoneName');
                return part ? part.value.replace('GMT', 'UTC') : '';
            } catch (e) { return ''; }
        },
        list() {
            try { if (typeof Intl.supportedValuesOf === 'function') return Intl.supportedValuesOf('timeZone'); } catch (e) { /* yoksay */ }
            return ['UTC', 'Europe/Istanbul', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow', 'Asia/Dubai',
                'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
        },
        local() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; } }
    };

    // ------------------------------------------------------------------
    // Mesajlar (yerelleştirme)
    // ------------------------------------------------------------------
    const Messages = {
        tr: {
            today: 'Bugün', previous: 'Önceki', next: 'Sonraki', pickDate: 'Tarih seç', views_label: 'Görünüm',
            views: {
                day: 'Gün', week: 'Hafta', workWeek: 'İş Haftası', month: 'Ay', year: 'Yıl', agenda: 'Ajanda',
                timelineDay: 'Çizelge (Gün)', timelineWeek: 'Çizelge (Hafta)', timelineWorkWeek: 'Çizelge (İş Haftası)', timelineMonth: 'Çizelge (Ay)'
            },
            allDay: 'Tüm gün', showFullDay: 'Tam günü göster', showWorkDay: 'İş saatlerini göster',
            search: 'Etkinlik ara…', pdf: 'PDF', icalExport: 'iCal indir', icalImport: 'iCal yükle', refresh: 'Yenile',
            more: '+{0} daha', noEvents: 'Bu aralıkta etkinlik bulunmuyor.', date: 'Tarih', time: 'Saat', event: 'Etkinlik',
            goToDay: 'Güne git', close: 'Kapat', loading: 'Yükleniyor…', untitled: '(Başlıksız)', continued: 'devam',
            editor: {
                title: 'Başlık', start: 'Başlangıç', end: 'Bitiş', allDay: 'Tüm gün etkinliği', timezone: 'Saat dilimi',
                timezoneDefault: 'Takvim saat dilimi', description: 'Açıklama', save: 'Kaydet', cancel: 'İptal', destroy: 'Sil',
                newEvent: 'Yeni Etkinlik', editEvent: 'Etkinliği Düzenle', viewEvent: 'Etkinlik Detayı',
                readonly: 'Bu etkinlik salt okunurdur ve değiştirilemez.', invalidRange: 'Bitiş zamanı başlangıçtan sonra olmalıdır.'
            },
            recurrence: {
                repeat: 'Tekrar', never: 'Tekrarlanmaz', daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık',
                every: 'Her', units: { DAILY: 'günde bir', WEEKLY: 'haftada bir', MONTHLY: 'ayda bir', YEARLY: 'yılda bir' },
                onDays: 'Günler', dayOfMonth: 'Ayın şu günü', onThe: 'Şu sırada', month: 'Ay',
                ordinals: { '1': 'İlk', '2': 'İkinci', '3': 'Üçüncü', '4': 'Dördüncü', '-1': 'Son' },
                end: 'Bitiş', endNever: 'Hiçbir zaman', endAfter: 'Şu kadar tekrardan sonra', occurrences: 'tekrar', endOn: 'Şu tarihte',
                summary: {
                    DAILY: 'Her gün', DAILY_N: 'Her {0} günde bir', WEEKLY: 'Her hafta', WEEKLY_N: 'Her {0} haftada bir',
                    MONTHLY: 'Her ay', MONTHLY_N: 'Her {0} ayda bir', YEARLY: 'Her yıl', YEARLY_N: 'Her {0} yılda bir',
                    monthDay: 'ayın {0}. günü', count: '{0} kez', until: '{0} tarihine kadar'
                }
            },
            recurring: {
                title: 'Yinelenen Etkinlik', editText: 'Yalnızca bu tekrarı mı yoksa tüm seriyi mi düzenlemek istiyorsunuz?',
                deleteText: 'Yalnızca bu tekrarı mı yoksa tüm seriyi mi silmek istiyorsunuz?', occurrence: 'Yalnızca bu tekrar', series: 'Tüm seri'
            },
            deleteTitle: 'Etkinliği Sil', deleteConfirm: 'Bu etkinliği silmek istediğinizden emin misiniz?',
            a11y: { selected: 'Seçildi: {0}', region: 'Takvim' },
            errors: { load: 'Etkinlikler yüklenemedi.', save: 'Değişiklik kaydedilemedi.', ical: 'iCal dosyası okunamadı.' },
            imported: '{0} etkinlik içe aktarıldı.'
        },
        en: {
            today: 'Today', previous: 'Previous', next: 'Next', pickDate: 'Pick a date', views_label: 'View',
            views: {
                day: 'Day', week: 'Week', workWeek: 'Work Week', month: 'Month', year: 'Year', agenda: 'Agenda',
                timelineDay: 'Timeline Day', timelineWeek: 'Timeline Week', timelineWorkWeek: 'Timeline Work Week', timelineMonth: 'Timeline Month'
            },
            allDay: 'All day', showFullDay: 'Show full day', showWorkDay: 'Show business hours',
            search: 'Search events…', pdf: 'PDF', icalExport: 'Export iCal', icalImport: 'Import iCal', refresh: 'Refresh',
            more: '+{0} more', noEvents: 'There are no events in this range.', date: 'Date', time: 'Time', event: 'Event',
            goToDay: 'Go to day', close: 'Close', loading: 'Loading…', untitled: '(No title)', continued: 'cont.',
            editor: {
                title: 'Title', start: 'Start', end: 'End', allDay: 'All day event', timezone: 'Time zone',
                timezoneDefault: 'Scheduler time zone', description: 'Description', save: 'Save', cancel: 'Cancel', destroy: 'Delete',
                newEvent: 'New Event', editEvent: 'Edit Event', viewEvent: 'Event Details',
                readonly: 'This event is read-only and cannot be changed.', invalidRange: 'End time must be after the start time.'
            },
            recurrence: {
                repeat: 'Repeat', never: 'Never', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
                every: 'Every', units: { DAILY: 'day(s)', WEEKLY: 'week(s)', MONTHLY: 'month(s)', YEARLY: 'year(s)' },
                onDays: 'On', dayOfMonth: 'Day of month', onThe: 'On the', month: 'Month',
                ordinals: { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth', '-1': 'Last' },
                end: 'End', endNever: 'Never', endAfter: 'After', occurrences: 'occurrence(s)', endOn: 'On',
                summary: {
                    DAILY: 'Every day', DAILY_N: 'Every {0} days', WEEKLY: 'Every week', WEEKLY_N: 'Every {0} weeks',
                    MONTHLY: 'Every month', MONTHLY_N: 'Every {0} months', YEARLY: 'Every year', YEARLY_N: 'Every {0} years',
                    monthDay: 'on day {0}', count: '{0} times', until: 'until {0}'
                }
            },
            recurring: {
                title: 'Recurring Event', editText: 'Do you want to edit only this occurrence or the whole series?',
                deleteText: 'Do you want to delete only this occurrence or the whole series?', occurrence: 'This occurrence', series: 'The entire series'
            },
            deleteTitle: 'Delete Event', deleteConfirm: 'Are you sure you want to delete this event?',
            a11y: { selected: 'Selected: {0}', region: 'Scheduler' },
            errors: { load: 'Events could not be loaded.', save: 'The change could not be saved.', ical: 'The iCal file could not be read.' },
            imported: '{0} events imported.'
        },
        de: {
            today: 'Heute', previous: 'Zurück', next: 'Weiter', pickDate: 'Datum wählen', views_label: 'Ansicht',
            views: {
                day: 'Tag', week: 'Woche', workWeek: 'Arbeitswoche', month: 'Monat', year: 'Jahr', agenda: 'Agenda',
                timelineDay: 'Zeitleiste Tag', timelineWeek: 'Zeitleiste Woche', timelineWorkWeek: 'Zeitleiste Arbeitswoche', timelineMonth: 'Zeitleiste Monat'
            },
            allDay: 'Ganztägig', showFullDay: 'Ganzen Tag anzeigen', showWorkDay: 'Geschäftszeiten anzeigen',
            search: 'Termine suchen…', pdf: 'PDF', icalExport: 'iCal exportieren', icalImport: 'iCal importieren', refresh: 'Aktualisieren',
            more: '+{0} weitere', noEvents: 'Keine Termine in diesem Zeitraum.', date: 'Datum', time: 'Zeit', event: 'Termin',
            goToDay: 'Zum Tag', close: 'Schließen', loading: 'Wird geladen…', untitled: '(Ohne Titel)', continued: 'Forts.',
            editor: {
                title: 'Titel', start: 'Beginn', end: 'Ende', allDay: 'Ganztägiger Termin', timezone: 'Zeitzone',
                timezoneDefault: 'Zeitzone des Kalenders', description: 'Beschreibung', save: 'Speichern', cancel: 'Abbrechen', destroy: 'Löschen',
                newEvent: 'Neuer Termin', editEvent: 'Termin bearbeiten', viewEvent: 'Termindetails',
                readonly: 'Dieser Termin ist schreibgeschützt.', invalidRange: 'Das Ende muss nach dem Beginn liegen.'
            },
            recurrence: {
                repeat: 'Wiederholen', never: 'Nie', daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich', yearly: 'Jährlich',
                every: 'Alle', units: { DAILY: 'Tag(e)', WEEKLY: 'Woche(n)', MONTHLY: 'Monat(e)', YEARLY: 'Jahr(e)' },
                onDays: 'Am', dayOfMonth: 'Tag des Monats', onThe: 'Am', month: 'Monat',
                ordinals: { '1': 'Ersten', '2': 'Zweiten', '3': 'Dritten', '4': 'Vierten', '-1': 'Letzten' },
                end: 'Ende', endNever: 'Nie', endAfter: 'Nach', occurrences: 'Wiederholung(en)', endOn: 'Am',
                summary: {
                    DAILY: 'Täglich', DAILY_N: 'Alle {0} Tage', WEEKLY: 'Wöchentlich', WEEKLY_N: 'Alle {0} Wochen',
                    MONTHLY: 'Monatlich', MONTHLY_N: 'Alle {0} Monate', YEARLY: 'Jährlich', YEARLY_N: 'Alle {0} Jahre',
                    monthDay: 'am {0}.', count: '{0}-mal', until: 'bis {0}'
                }
            },
            recurring: {
                title: 'Serientermin', editText: 'Nur dieses Vorkommen oder die gesamte Serie bearbeiten?',
                deleteText: 'Nur dieses Vorkommen oder die gesamte Serie löschen?', occurrence: 'Nur dieses Vorkommen', series: 'Gesamte Serie'
            },
            deleteTitle: 'Termin löschen', deleteConfirm: 'Möchten Sie diesen Termin wirklich löschen?',
            a11y: { selected: 'Ausgewählt: {0}', region: 'Kalender' },
            errors: { load: 'Termine konnten nicht geladen werden.', save: 'Änderung konnte nicht gespeichert werden.', ical: 'iCal-Datei konnte nicht gelesen werden.' },
            imported: '{0} Termine importiert.'
        }
    };

    function deepMerge(target, src) {
        if (!src) return target;
        for (const k of Object.keys(src)) {
            const v = src[k];
            if (v && typeof v === 'object' && !Array.isArray(v)) target[k] = deepMerge(Object.assign({}, target[k] || {}), v);
            else target[k] = v;
        }
        return target;
    }
    function getMessages(lang, overrides) {
        const base = JSON.parse(JSON.stringify(Messages.en));
        return deepMerge(deepMerge(base, Messages[lang] || {}), overrides || {});
    }
    function format(str, ...args) { return String(str == null ? '' : str).replace(/\{(\d+)\}/g, (m, i) => (args[i] != null ? args[i] : '')); }

    // ------------------------------------------------------------------
    // Kültür (Intl tabanlı ay/gün adları, saat biçimi, haftanın ilk günü)
    // ------------------------------------------------------------------
    const SUNDAY_REGIONS = new Set(['US', 'CA', 'JP', 'BR', 'IL', 'SA', 'KR', 'TW', 'HK', 'PH', 'MX', 'IN', 'ZA', 'CN']);
    class Culture {
        constructor(locale) {
            let loc;
            try { loc = new Intl.Locale(locale || 'tr-TR'); this.locale = loc.toString(); }
            catch (e) { loc = new Intl.Locale('tr-TR'); this.locale = 'tr-TR'; }
            this.lang = loc.language;
            let fd = null;
            try {
                const wi = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
                if (wi && wi.firstDay) fd = wi.firstDay % 7;
            } catch (e) { /* yoksay */ }
            if (fd == null) {
                let region = loc.region;
                try { region = region || loc.maximize().region; } catch (e) { /* yoksay */ }
                fd = SUNDAY_REGIONS.has(region) ? 0 : 1;
            }
            this.firstDay = fd;
            this.rtl = ['ar', 'he', 'fa', 'ur'].includes(this.lang);

            const f = opts => new Intl.DateTimeFormat(this.locale, opts);
            const cap = s => s.charAt(0).toLocaleUpperCase(this.locale) + s.slice(1);
            const mLong = f({ month: 'long' }), mShort = f({ month: 'short' });
            this.monthNames = []; this.monthShort = [];
            for (let m = 0; m < 12; m++) {
                const d = new Date(2024, m, 1);
                this.monthNames.push(cap(mLong.format(d)));
                this.monthShort.push(cap(mShort.format(d)));
            }
            const dLong = f({ weekday: 'long' }), dShort = f({ weekday: 'short' }), dNarrow = f({ weekday: 'narrow' });
            this.dayNames = []; this.dayShort = []; this.dayNarrow = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(2024, 0, 7 + i); // 7 Ocak 2024 Pazar
                this.dayNames.push(cap(dLong.format(d)));
                this.dayShort.push(cap(dShort.format(d)));
                this.dayNarrow.push(dNarrow.format(d));
            }
            this._time = f({ hour: '2-digit', minute: '2-digit' });
            this._dateLong = f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            this._dateMed = f({ day: 'numeric', month: 'long', year: 'numeric' });
            this._dateShort = f({ day: 'numeric', month: 'short' });
            this._dateNum = f({ year: 'numeric', month: '2-digit', day: '2-digit' });
            this._num = new Intl.NumberFormat(this.locale);
        }
        time(d) { return this._time.format(d); }
        dateLong(d) { return this._dateLong.format(d); }
        dateMed(d) { return this._dateMed.format(d); }
        dateShort(d) { return this._dateShort.format(d); }
        dateNum(d) { return this._dateNum.format(d); }
        num(n) { return this._num.format(n); }
        monthYear(d) { return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`; }
        range(a, b) {
            try { if (typeof this._dateMed.formatRange === 'function') return this._dateMed.formatRange(a, b); } catch (e) { /* yoksay */ }
            return `${this.dateMed(a)} – ${this.dateMed(b)}`;
        }
        timeRange(a, b) { return `${this.time(a)} – ${this.time(b)}`; }
    }

    // ------------------------------------------------------------------
    // Yineleme motoru (RFC 5545 RRULE alt kümesi)
    // FREQ, INTERVAL, COUNT, UNTIL, BYDAY (sıra ile: 1MO, -1FR), BYMONTHDAY, BYMONTH, BYSETPOS, WKST
    // ------------------------------------------------------------------
    const WD = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const Recurrence = {
        WD,
        parseICalDate(v) {
            const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(v).trim());
            if (!m) return D.parse(v);
            const p = [+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)];
            return m[7] ? new Date(Date.UTC(...p)) : new Date(...p);
        },
        formatICalDate(d, utc, dateOnly) {
            if (dateOnly) return `${d.getFullYear()}${D.pad(d.getMonth() + 1)}${D.pad(d.getDate())}`;
            if (utc) return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            return `${d.getFullYear()}${D.pad(d.getMonth() + 1)}${D.pad(d.getDate())}T${D.pad(d.getHours())}${D.pad(d.getMinutes())}${D.pad(d.getSeconds())}`;
        },
        parse(str) {
            if (!str) return null;
            const rule = { freq: null, interval: 1, count: null, until: null, byDay: [], byMonthDay: [], byMonth: [], bySetPos: [], wkst: 1 };
            String(str).replace(/^RRULE:/i, '').split(';').forEach(part => {
                const i = part.indexOf('=');
                if (i < 0) return;
                const k = part.slice(0, i).trim().toUpperCase(), v = part.slice(i + 1).trim();
                switch (k) {
                    case 'FREQ': rule.freq = v.toUpperCase(); break;
                    case 'INTERVAL': rule.interval = Math.max(1, parseInt(v, 10) || 1); break;
                    case 'COUNT': rule.count = Math.max(1, parseInt(v, 10) || 1); break;
                    case 'UNTIL': rule.until = Recurrence.parseICalDate(v); break;
                    case 'BYDAY':
                        rule.byDay = v.split(',').map(x => {
                            const m = /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/i.exec(x.trim());
                            return m ? { n: m[1] ? parseInt(m[1], 10) : 0, day: WD.indexOf(m[2].toUpperCase()) } : null;
                        }).filter(Boolean);
                        break;
                    case 'BYMONTHDAY': rule.byMonthDay = v.split(',').map(Number).filter(n => n && Math.abs(n) <= 31); break;
                    case 'BYMONTH': rule.byMonth = v.split(',').map(Number).filter(n => n >= 1 && n <= 12); break;
                    case 'BYSETPOS': rule.bySetPos = v.split(',').map(Number).filter(n => n); break;
                    case 'WKST': rule.wkst = Math.max(0, WD.indexOf(v.toUpperCase())); break;
                }
            });
            return ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(rule.freq) ? rule : null;
        },
        serialize(rule) {
            if (!rule || !rule.freq) return '';
            const p = [`FREQ=${rule.freq}`];
            if (rule.interval > 1) p.push(`INTERVAL=${rule.interval}`);
            if (rule.byDay && rule.byDay.length) p.push('BYDAY=' + rule.byDay.map(x => (x.n ? x.n : '') + WD[x.day]).join(','));
            if (rule.byMonthDay && rule.byMonthDay.length) p.push('BYMONTHDAY=' + rule.byMonthDay.join(','));
            if (rule.byMonth && rule.byMonth.length) p.push('BYMONTH=' + rule.byMonth.join(','));
            if (rule.bySetPos && rule.bySetPos.length) p.push('BYSETPOS=' + rule.bySetPos.join(','));
            if (rule.count) p.push(`COUNT=${rule.count}`);
            else if (rule.until) p.push(`UNTIL=${Recurrence.formatICalDate(rule.until, true)}`);
            return p.join(';');
        },
        nthWeekday(y, m, day, n) {
            const dim = D.daysInMonth(y, m);
            if (n > 0) {
                const off = (day - new Date(y, m, 1).getDay() + 7) % 7;
                const date = 1 + off + (n - 1) * 7;
                return date <= dim ? new Date(y, m, date) : null;
            }
            const off = (new Date(y, m, dim).getDay() - day + 7) % 7;
            const date = dim - off + (n + 1) * 7;
            return date >= 1 ? new Date(y, m, date) : null;
        },
        /**
         * Serinin [rangeStart, rangeEnd) aralığına düşen tekrar başlangıçlarını üretir.
         * exceptions: hariç tutulacak tekrar başlangıçları (Date[]). durationMs: aralık başından taşan tekrarları yakalamak için.
         */
        expand(start, rule, rangeStart, rangeEnd, exceptions, durationMs) {
            const out = [];
            if (!rule || !start) return out;
            const excSet = new Set((exceptions || []).map(d => d.getTime()));
            const h = start.getHours(), mi = start.getMinutes(), s = start.getSeconds();
            const until = rule.until ? rule.until.getTime() : Infinity;
            const lower = rangeStart.getTime() - (durationMs || 0);
            const end = rangeEnd.getTime();
            let count = 0, guard = 0;
            const sortD = arr => arr.sort((a, b) => a - b);
            const uniq = arr => { const seen = new Set(); return arr.filter(d => { const t = d.getTime(); if (seen.has(t)) return false; seen.add(t); return true; }); };
            const byMonthOk = d => !rule.byMonth.length || rule.byMonth.includes(d.getMonth() + 1);
            const byDayOk = d => !rule.byDay.length || rule.byDay.some(x => x.day === d.getDay());
            const byMonthDayOk = d => !rule.byMonthDay.length || rule.byMonthDay.some(n => {
                const dim = D.daysInMonth(d.getFullYear(), d.getMonth());
                return d.getDate() === (n > 0 ? n : dim + n + 1);
            });
            const setPos = days => {
                if (!rule.bySetPos.length) return days;
                const len = days.length;
                return sortD(rule.bySetPos.map(p => days[p > 0 ? p - 1 : len + p]).filter(Boolean));
            };
            // false dönerse üretim biter (COUNT/UNTIL)
            const emit = day => {
                const occ = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, s);
                if (occ < start) return true;
                if (occ.getTime() > until) return false;
                if (rule.count && count >= rule.count) return false;
                count++;
                const t = occ.getTime();
                if (t >= lower && t < end && !excSet.has(t)) out.push(occ);
                return true;
            };
            const monthDays = (y, m) => {
                let days = [];
                const dim = D.daysInMonth(y, m);
                if (rule.byMonthDay.length) {
                    rule.byMonthDay.forEach(n => { const dd = n > 0 ? n : dim + n + 1; if (dd >= 1 && dd <= dim) days.push(new Date(y, m, dd)); });
                    if (rule.byDay.length) days = days.filter(byDayOk);
                } else if (rule.byDay.length) {
                    rule.byDay.forEach(x => {
                        if (x.n) { const d = Recurrence.nthWeekday(y, m, x.day, x.n); if (d) days.push(d); }
                        else for (let dd = 1; dd <= dim; dd++) { const d = new Date(y, m, dd); if (d.getDay() === x.day) days.push(d); }
                    });
                } else if (start.getDate() <= dim) {
                    days.push(new Date(y, m, start.getDate()));
                }
                return setPos(sortD(uniq(days)));
            };

            switch (rule.freq) {
                case 'DAILY': {
                    let d = D.startOfDay(start);
                    while (guard++ < 200000 && d.getTime() < end) {
                        if (byMonthOk(d) && byDayOk(d) && byMonthDayOk(d) && !emit(d)) break;
                        d = D.addDays(d, rule.interval);
                    }
                    break;
                }
                case 'WEEKLY': {
                    let ws = D.startOfWeek(start, rule.wkst);
                    const days = rule.byDay.length ? [...new Set(rule.byDay.map(x => x.day))] : [start.getDay()];
                    const offsets = days.map(dd => (dd - rule.wkst + 7) % 7).sort((a, b) => a - b);
                    outer: while (guard++ < 50000 && ws.getTime() < end) {
                        for (const off of offsets) {
                            const d = D.addDays(ws, off);
                            if (d.getTime() >= end) break outer;
                            if (!byMonthOk(d)) continue;
                            if (!emit(d)) break outer;
                        }
                        ws = D.addDays(ws, 7 * rule.interval);
                    }
                    break;
                }
                case 'MONTHLY': {
                    let y = start.getFullYear(), m = start.getMonth();
                    outer: while (guard++ < 10000 && new Date(y, m, 1).getTime() < end) {
                        if (byMonthOk(new Date(y, m, 1))) {
                            for (const d of monthDays(y, m)) {
                                if (d.getTime() >= end) break outer;
                                if (!emit(d)) break outer;
                            }
                        }
                        m += rule.interval; y += Math.floor(m / 12); m %= 12;
                    }
                    break;
                }
                case 'YEARLY': {
                    let y = start.getFullYear();
                    const months = rule.byMonth.length ? [...rule.byMonth].sort((a, b) => a - b).map(x => x - 1) : [start.getMonth()];
                    outer: while (guard++ < 1000 && new Date(y, 0, 1).getTime() < end) {
                        for (const m of months) {
                            for (const d of monthDays(y, m)) {
                                if (d.getTime() >= end) break outer;
                                if (!emit(d)) break outer;
                            }
                        }
                        y += rule.interval;
                    }
                    break;
                }
            }
            return out;
        },
        /** Kuralı insan tarafından okunabilir metne çevirir. */
        describe(rule, culture, msg) {
            if (!rule) return '';
            const s = msg.recurrence.summary;
            const parts = [rule.interval > 1 ? format(s[rule.freq + '_N'], rule.interval) : s[rule.freq]];
            const dayName = d => culture.dayShort[d];
            if (rule.byDay.length) {
                parts.push(rule.byDay.map(x => (x.n ? (msg.recurrence.ordinals[String(x.n)] || x.n) + ' ' : '') + (x.n ? culture.dayNames[x.day] : dayName(x.day))).join(', '));
            }
            if (rule.byMonth.length) parts.push(rule.byMonth.map(m => culture.monthNames[m - 1]).join(', '));
            if (rule.byMonthDay.length) parts.push(format(s.monthDay, rule.byMonthDay.join(', ')));
            if (rule.count) parts.push(format(s.count, rule.count));
            else if (rule.until) parts.push(format(s.until, culture.dateMed(rule.until)));
            return parts.join(' · ');
        }
    };

    // ------------------------------------------------------------------
    // iCalendar (RFC 5545) — dışa/içe aktarım
    // ------------------------------------------------------------------
    const ICal = {
        escape(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); },
        unescape(s) { return String(s).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); },
        fold(line) {
            if (line.length <= 74) return line;
            let out = line.slice(0, 74), rest = line.slice(74);
            while (rest.length) { out += '\r\n ' + rest.slice(0, 73); rest = rest.slice(73); }
            return out;
        },
        /**
         * items: { uid, title, description, location, start, end, isAllDay, rule, exdates[], recurrenceUid, recurrenceStart }
         * start/end/exdates: mutlak zaman (Date). Tüm gün etkinliklerinde yerel tarih kullanılır.
         */
        serialize(items, prodId) {
            const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${prodId || 'Panoptes//Scheduler'}//TR`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
            const stamp = Recurrence.formatICalDate(new Date(), true);
            const dt = (d, allDay) => allDay ? `;VALUE=DATE:${Recurrence.formatICalDate(d, false, true)}` : `:${Recurrence.formatICalDate(d, true)}`;
            items.forEach(it => {
                L.push('BEGIN:VEVENT', `UID:${it.recurrenceUid || it.uid}`, `DTSTAMP:${stamp}`);
                if (it.recurrenceUid && it.recurrenceStart) L.push('RECURRENCE-ID' + dt(it.recurrenceStart, it.isAllDay));
                L.push('DTSTART' + dt(it.start, it.isAllDay), 'DTEND' + dt(it.end, it.isAllDay));
                L.push('SUMMARY:' + ICal.escape(it.title));
                if (it.description) L.push('DESCRIPTION:' + ICal.escape(it.description));
                if (it.location) L.push('LOCATION:' + ICal.escape(it.location));
                if (it.rule) L.push('RRULE:' + it.rule);
                if (it.exdates && it.exdates.length) L.push('EXDATE' + (it.isAllDay ? ';VALUE=DATE:' + it.exdates.map(d => Recurrence.formatICalDate(d, false, true)).join(',') : ':' + it.exdates.map(d => Recurrence.formatICalDate(d, true)).join(',')));
                L.push('END:VEVENT');
            });
            L.push('END:VCALENDAR');
            return L.map(ICal.fold).join('\r\n') + '\r\n';
        },
        parseDuration(v) {
            const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v).trim());
            if (!m) return 0;
            const ms = ((+m[2] || 0) * 7 * 86400 + (+m[3] || 0) * 86400 + (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)) * 1000;
            return m[1] === '-' ? -ms : ms;
        },
        /** Döndürülen tarihler mutlak zamandır; TZID ile verilen duvar saatleri UTC'ye çevrilir. */
        parse(text) {
            const lines = String(text).replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
            const events = [];
            let cur = null;
            const readDate = (value, params) => {
                const allDay = params.VALUE === 'DATE' || /^\d{8}$/.test(value.trim());
                let d = Recurrence.parseICalDate(value);
                if (!allDay && params.TZID && !/Z$/i.test(value) && TZ.isValid(params.TZID)) d = TZ.fromWall(d, params.TZID);
                return { d, allDay };
            };
            for (const line of lines) {
                const upper = line.trim().toUpperCase();
                if (upper === 'BEGIN:VEVENT') { cur = {}; continue; }
                if (upper === 'END:VEVENT') { if (cur && cur.start) events.push(cur); cur = null; continue; }
                if (!cur) continue;
                const idx = line.indexOf(':');
                if (idx < 0) continue;
                const left = line.slice(0, idx), value = line.slice(idx + 1);
                const [nameRaw, ...paramParts] = left.split(';');
                const params = {};
                paramParts.forEach(x => { const j = x.indexOf('='); if (j > 0) params[x.slice(0, j).toUpperCase()] = x.slice(j + 1).replace(/^"|"$/g, ''); });
                switch (nameRaw.toUpperCase()) {
                    case 'UID': cur.uid = value.trim(); break;
                    case 'SUMMARY': cur.title = ICal.unescape(value); break;
                    case 'DESCRIPTION': cur.description = ICal.unescape(value); break;
                    case 'LOCATION': cur.location = ICal.unescape(value); break;
                    case 'DTSTART': { const r = readDate(value, params); cur.start = r.d; cur.isAllDay = r.allDay; break; }
                    case 'DTEND': cur.end = readDate(value, params).d; break;
                    case 'DURATION': cur.duration = ICal.parseDuration(value); break;
                    case 'RRULE': cur.rule = value.trim(); break;
                    case 'EXDATE': cur.exdates = (cur.exdates || []).concat(value.split(',').map(v => readDate(v, params).d)); break;
                    case 'RECURRENCE-ID': cur.recurrenceStart = readDate(value, params).d; break;
                }
            }
            events.forEach(ev => {
                if (!ev.end) ev.end = ev.duration ? new Date(ev.start.getTime() + ev.duration) : (ev.isAllDay ? D.addDays(ev.start, 1) : new Date(ev.start.getTime() + MS_HOUR));
            });
            return events;
        }
    };

    // ------------------------------------------------------------------
    // Veri kaynağı: yerel dizi, REST uç noktaları ({id} yer tutucusu), özel fonksiyonlar ve SSE ile canlı güncelleme
    // ------------------------------------------------------------------
    function resolveFn(v) {
        if (typeof v === 'function') return v;
        if (typeof v === 'string' && v && /^[A-Za-z_$][\w$.]*$/.test(v)) {
            const fn = v.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window);
            if (typeof fn === 'function') return fn;
        }
        return null;
    }
    function antiforgeryHeaders() {
        const input = document.querySelector('input[name="__RequestVerificationToken"]');
        const meta = document.querySelector('meta[name="request-verification-token"]');
        const token = (input && input.value) || (meta && meta.content);
        return token ? { RequestVerificationToken: token } : {};
    }

    class DataSource {
        constructor(cfg, hooks) {
            this.cfg = cfg || {};
            this.hooks = hooks || {};
            this._seq = 1;
        }
        get transport() { return this.cfg.transport || {}; }
        get isRemote() { return !!this.transport.read; }
        get serverFiltering() { return !!this.cfg.serverFiltering; }
        async read(range) {
            const t = this.transport;
            const fn = resolveFn(t.read);
            if (fn) {
                const res = await fn({ start: range.start, end: range.end });
                return Array.isArray(res) ? res : (res && (res.data || res.Data)) || [];
            }
            if (typeof t.read === 'string') {
                const url = new URL(t.read, window.location.href);
                if (this.serverFiltering) {
                    url.searchParams.set('start', this.hooks.formatDate(range.start));
                    url.searchParams.set('end', this.hooks.formatDate(range.end));
                }
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                return Array.isArray(json) ? json : (json.data || json.Data || []);
            }
            return Array.isArray(this.cfg.data) ? this.cfg.data : [];
        }
        async send(kind, payload) {
            const target = this.transport[kind];
            const fn = resolveFn(target);
            if (fn) {
                const res = await fn(payload);
                return res && typeof res === 'object' ? res : payload;
            }
            if (typeof target === 'string' && target) {
                const method = kind === 'create' ? 'POST' : kind === 'update' ? 'PUT' : 'DELETE';
                const hasId = target.includes('{id}');
                const url = target.replace('{id}', encodeURIComponent(payload.id));
                const res = await fetch(url, {
                    method, credentials: 'same-origin',
                    headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, antiforgeryHeaders()),
                    body: kind === 'destroy' && hasId ? undefined : JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const text = await res.text();
                if (!text) return payload;
                const json = JSON.parse(text);
                if (Array.isArray(json)) return json[0] || payload;
                if (json && json.data && !Array.isArray(json.data)) return json.data;
                return json && typeof json === 'object' ? json : payload;
            }
            if (kind === 'create' && (payload.id == null || payload.id === '')) {
                payload.id = 'ev_' + Date.now().toString(36) + '_' + (this._seq++);
            }
            return payload;
        }
        subscribe(onMessage) {
            const url = this.cfg.realtime;
            if (!url || typeof EventSource === 'undefined') return () => { };
            const es = new EventSource(url, { withCredentials: true });
            es.onmessage = e => { try { onMessage(JSON.parse(e.data)); } catch (err) { /* geçersiz mesaj */ } };
            if (this.hooks.onRealtimeState) {
                es.onopen = () => this.hooks.onRealtimeState('open');
                es.onerror = () => this.hooks.onRealtimeState(es.readyState === 2 ? 'closed' : 'reconnecting');
            }
            return () => es.close();
        }
    }

    Panoptes.SchedulerCore = { D, TZ, Culture, Messages, getMessages, deepMerge, format, Recurrence, ICal, DataSource, resolveFn };

})(window);
