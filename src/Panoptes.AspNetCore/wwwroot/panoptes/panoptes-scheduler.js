/**
 * Panoptes Scheduler — Ana bileşen
 * Görünümler: Gün, Hafta, İş Haftası, Ay, Yıl, Ajanda, Zaman Çizelgesi (Gün/Hafta/İş Haftası/Ay, gece vardiyası destekli)
 * Kaynaklar & gruplama (yatay, dikey, hiyerarşik, tarihe göre, sanal dikey), şablonlar, seçim, klavye navigasyonu,
 * arama, mevcut zaman göstergesi, devam eden etkinlik vurgusu, "+N daha" açılır listesi, uyarlanabilir görünüm, RTL.
 * Bağımlılık: panoptes-scheduler-core.js (önce), panoptes-scheduler-editing.js (sonra, düzenleme yetenekleri için).
 */
(function (window, document) {
    'use strict';

    const P = window.Panoptes = window.Panoptes || {};
    const Core = P.SchedulerCore;
    if (!Core) { console.error('[Panoptes.Scheduler] Önce panoptes-scheduler-core.js yüklenmelidir.'); return; }
    const { D, TZ, Culture, getMessages, format, Recurrence, DataSource, resolveFn } = Core;
    const { MS_MIN, MS_DAY } = D;
    const esc = D.escape;

    const VIEW_TYPES = ['day', 'week', 'workWeek', 'month', 'year', 'agenda', 'timelineDay', 'timelineWeek', 'timelineWorkWeek', 'timelineMonth'];
    const VIEW_MAP = {};
    VIEW_TYPES.forEach(v => { VIEW_MAP[v.toLowerCase()] = v; });
    const canonView = v => VIEW_MAP[String(v || '').replace(/[\s_-]/g, '').toLowerCase()] || null;
    const isTimeView = v => v === 'day' || v === 'week' || v === 'workWeek';
    const isTimeline = v => typeof v === 'string' && v.indexOf('timeline') === 0;
    const MONTH_HEAD = 26;

    const ICONS = {
        prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
        next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
        cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
        search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
        recur: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/></svg>',
        exc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M4 4l16 16"/></svg>',
        lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
        download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
        upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>',
        pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
    };

    const DEFAULTS = {
        date: null, view: null, views: ['day', 'week', 'workWeek', 'month', 'agenda'],
        height: 640, startTime: '00:00', endTime: '00:00', workDayStart: '08:00', workDayEnd: '17:00', workDays: [1, 2, 3, 4, 5],
        showWorkHours: false, scrollTime: null, majorTick: 60, minorTickCount: 2, slotHeight: 26, allDaySlot: true,
        culture: 'tr-TR', messages: null, firstDay: null, timezone: null, rtl: null,
        editable: true, selectable: false, resources: [], group: null,
        dataSource: null, events: null,
        eventTemplate: null, allDayEventTemplate: null, dateHeaderTemplate: null, groupHeaderTemplate: null, majorTimeHeaderTemplate: null,
        agendaDays: 7, toolbar: null, footer: true, search: false,
        autoEventHeight: false, adaptiveSlotHeight: false, currentTimeMarker: true, ongoingEvents: false, moreEventsPopover: true,
        virtual: false, columnWidth: 110, timelineColumnWidth: 64, monthColumnWidth: 46, resourceColumnWidth: 160,
        eventHeight: 22, timelineEventHeight: 36, rowHeight: 58, mobile: 'auto', handlers: null
    };

    // ---------------------------------------------------------------------------------
    // Yardımcılar
    // ---------------------------------------------------------------------------------
    function normalizeEditable(e) {
        const base = { create: true, update: true, destroy: true, move: true, resize: true, confirmation: true, editRecurringMode: 'dialog', template: null, timezone: false };
        if (e === false) return Object.assign(base, { create: false, update: false, destroy: false, move: false, resize: false });
        if (e && typeof e === 'object') return Object.assign(base, e);
        return base;
    }
    function normalizeViews(views) {
        let list = views;
        if (typeof list === 'string') list = list.split(',');
        if (!Array.isArray(list) || !list.length) list = DEFAULTS.views;
        const out = []; let selected = null;
        list.forEach(v => {
            const type = canonView(typeof v === 'string' ? v.trim() : (v && (v.type || v.name)));
            if (!type || out.some(x => x.type === type)) return;
            out.push({ type, title: v && typeof v === 'object' ? v.title : null });
            if (v && typeof v === 'object' && v.selected) selected = type;
        });
        if (!out.length) out.push({ type: 'week', title: null });
        return { list: out, selected };
    }
    function compileTemplate(t) {
        if (!t) return null;
        if (typeof t === 'function') return t;
        const fn = resolveFn(t);
        if (fn) return fn;
        let src = String(t);
        if (src.charAt(0) === '#') {
            const el = document.getElementById(src.slice(1));
            if (!el) { console.warn('[Panoptes.Scheduler] Şablon bulunamadı:', src); return null; }
            src = el.innerHTML;
        }
        return data => src.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g, (m, raw, escaped) => {
            const v = (raw || escaped).split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
            const s = v == null ? '' : String(v);
            return raw ? s : esc(s);
        });
    }
    function safeColor(c) {
        if (!c || typeof c !== 'string') return null;
        const s = c.trim();
        return /^#[0-9a-f]{3,8}$/i.test(s) || /^[a-z]{3,20}$/i.test(s) || /^(rgb|rgba|hsl|hsla|oklch)\([\d\s.,%/-]+\)$/i.test(s) ? s : null;
    }
    function luminance(c) {
        const m = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c);
        if (!m) return null;
        let hex = m[1];
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function safeClasses(s) { return String(s || '').split(/\s+/).filter(x => /^[\w:/.[\]#%-]+$/.test(x)); }
    function valueMatches(evVal, v) {
        if (Array.isArray(evVal)) return evVal.some(x => String(x) === String(v));
        return evVal != null && evVal !== '' && String(evVal) === String(v);
    }
    function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
    function camelize(obj) {
        const out = {};
        Object.keys(obj || {}).forEach(k => {
            const c = k.length > 1 && /^[A-Z]/.test(k) && !/^[A-Z0-9_]+$/.test(k) ? k.charAt(0).toLowerCase() + k.slice(1) : k;
            if (!(c in out) || c === k) out[c] = obj[k];
        });
        return out;
    }

    // ---------------------------------------------------------------------------------
    // Bileşen
    // ---------------------------------------------------------------------------------
    class PanoptesScheduler {
        constructor(element, options) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) throw new Error('[Panoptes.Scheduler] Element bulunamadı.');
            if (this.element._panoptesScheduler) return this.element._panoptesScheduler;
            this.element._panoptesScheduler = this;
            this.id = this.element.id || ('psch_' + Math.random().toString(36).slice(2));

            const cfgEl = this.element.querySelector(':scope > script.panoptes-scheduler-config');
            let markup = {};
            if (cfgEl) {
                try { markup = JSON.parse(cfgEl.textContent || '{}'); } catch (e) { console.warn('[Panoptes.Scheduler] Yapılandırma okunamadı', e); }
            }
            this._handlers = {};
            this.events = [];
            this._occ = [];
            this._occByUid = new Map();
            this._selection = { events: new Set(), range: null, anchor: null };
            this._query = '';
            this._filter = null;
            this._resFilter = null;
            this._compact = false;
            this._rawOptions = Object.assign({}, markup, options || {});
            this._setOptions(this._rawOptions, true);
            this._build();
            if (typeof this._initEditing === 'function') this._initEditing();
            this._initData();
            P.Scheduler.instances.set(this.id, this);
        }

        // ------------------------------------------------------------ seçenekler
        _setOptions(raw, initial, delta) {
            const o = Object.assign({}, DEFAULTS, raw);
            const dl = delta || raw;
            o.editable = normalizeEditable(raw.editable);
            const views = normalizeViews(o.views);
            o.views = views.list;
            let view = (initial || 'view' in dl ? canonView(raw.view) : null) || (initial ? views.selected : this._view);
            if (!view || !o.views.some(v => v.type === view)) {
                if (view && canonView(view)) o.views.push({ type: view, title: null });
                else view = o.views.some(v => v.type === 'week') ? 'week' : o.views[0].type;
            }
            if (Array.isArray(o.workDays) === false && typeof o.workDays === 'string') o.workDays = o.workDays.split(',').map(Number);
            if (o.group && typeof o.group.resources === 'string') o.group.resources = o.group.resources.split(',').map(s => s.trim()).filter(Boolean);
            if (o.timezone && !TZ.isValid(o.timezone)) { console.warn('[Panoptes.Scheduler] Geçersiz saat dilimi:', o.timezone); o.timezone = null; }
            this.options = o;
            this.culture = new Culture(o.culture);
            this.msg = getMessages(this.culture.lang, this._resolveMessages(o.messages));
            this.firstDay = o.firstDay != null ? +o.firstDay : this.culture.firstDay;
            this.rtl = o.rtl != null ? !!o.rtl : this.culture.rtl;
            this._resources = this._normalizeResources(o.resources);
            this._tpl = {
                event: compileTemplate(o.eventTemplate), allDayEvent: compileTemplate(o.allDayEventTemplate),
                dateHeader: compileTemplate(o.dateHeaderTemplate), groupHeader: compileTemplate(o.groupHeaderTemplate),
                majorTime: compileTemplate(o.majorTimeHeaderTemplate)
            };
            if (initial) {
                this._view = view;
                this._date = D.startOfDay(D.parse(o.date) || new Date());
                this._showWorkHours = !!o.showWorkHours;
            } else {
                this._view = view;
                if (dl.date) this._date = D.startOfDay(D.parse(dl.date));
                if ('showWorkHours' in dl) this._showWorkHours = !!dl.showWorkHours;
            }
            this._optHandlers = {};
            const addOpt = (k, fn) => { const f = this._mkHandler(fn); if (f) (this._optHandlers[k] = this._optHandlers[k] || []).push(f); };
            const h = o.handlers || {};
            Object.keys(h).forEach(k => addOpt(k, h[k]));
            Object.keys(raw).forEach(k => { if (/^on[A-Z]/.test(k) && raw[k]) addOpt(k.charAt(2).toLowerCase() + k.slice(3), raw[k]); });
        }
        _resolveMessages(m) {
            if (typeof m === 'string' && /^[A-Za-z_$][\w$.]*$/.test(m)) {
                const v = m.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window);
                return typeof v === 'function' ? v(this) : (v && typeof v === 'object' ? v : null);
            }
            return m && typeof m === 'object' ? m : null;
        }
        _normalizeResources(list) {
            return (Array.isArray(list) ? list : []).map(r0 => {
                const r = camelize(r0);
                const tf = r.dataTextField || 'text', vf = r.dataValueField || 'value', cf = r.dataColorField || 'color';
                const items = (r.dataSource || r.items || r.data || []).map(it0 => {
                    const it = camelize(it0);
                    const value = it[vf] !== undefined ? it[vf] : it0[vf];
                    return { value, text: String(it[tf] !== undefined ? it[tf] : (it0[tf] !== undefined ? it0[tf] : value)), color: safeColor(it[cf] || it0[cf]), raw: it0 };
                });
                const field = r.field || r.name;
                return { name: r.name || field, field, title: r.title || r.name || field, multiple: !!r.multiple, items };
            }).filter(r => r.field);
        }
        _applyCssVars() {
            const o = this.options, s = this.element.style;
            s.setProperty('--psch-slot-h', o.slotHeight + 'px');
            s.setProperty('--psch-ev-h', o.eventHeight + 'px');
            s.setProperty('--psch-col-min', o.columnWidth + 'px');
            s.setProperty('--psch-res-w', o.resourceColumnWidth + 'px');
            if (o.height != null && o.height !== '' && o.height !== 'auto') s.height = typeof o.height === 'number' || /^\d+$/.test(o.height) ? o.height + 'px' : o.height;
            this.element.setAttribute('dir', this.rtl ? 'rtl' : 'ltr');
            this.element.setAttribute('lang', this.culture.locale);
        }

        // ------------------------------------------------------------ iskelet
        _build() {
            const el = this.element;
            el.classList.add('psch');
            Array.from(el.children).forEach(ch => { if (ch.tagName !== 'TEMPLATE') ch.remove(); });
            el.insertAdjacentHTML('beforeend',
                '<div class="psch-toolbar" role="toolbar"></div>' +
                `<div class="psch-body" tabindex="0" role="group" aria-roledescription="scheduler"></div>` +
                '<div class="psch-footer"></div>' +
                '<div class="psch-live psch-sr" aria-live="polite"></div>' +
                '<div class="psch-loading" hidden><span class="psch-spinner"></span></div>' +
                '<div class="psch-toasts" aria-live="assertive"></div>');
            this._toolbar = el.querySelector(':scope > .psch-toolbar');
            this._body = el.querySelector(':scope > .psch-body');
            this._footer = el.querySelector(':scope > .psch-footer');
            this._live = el.querySelector(':scope > .psch-live');
            this._loading = el.querySelector(':scope > .psch-loading');
            this._toasts = el.querySelector(':scope > .psch-toasts');
            this._applyCssVars();
            this._buildToolbar();

            this._toolbar.addEventListener('click', e => this._onToolbarClick(e));
            this._toolbar.addEventListener('change', e => this._onToolbarChange(e));
            this._toolbar.addEventListener('input', e => {
                if (!e.target.matches('.psch-search input')) return;
                clearTimeout(this._searchTimer);
                this._searchTimer = setTimeout(() => this.search(e.target.value), 160);
            });
            this._footer.addEventListener('click', e => { if (e.target.closest('[data-cmd="workhours"]')) this.toggleWorkHours(); });
            this._body.addEventListener('click', e => this._onClick(e));
            this._body.addEventListener('dblclick', e => this._onDblClick(e));
            this._body.addEventListener('keydown', e => this._onKeyDown(e));

            if (typeof ResizeObserver !== 'undefined') {
                this._ro = new ResizeObserver(entries => this._onResize(entries[0].contentRect.width));
                this._ro.observe(el);
            } else {
                this._onResize(el.clientWidth);
            }
            const ong = this.options.ongoingEvents;
            const interval = (ong && typeof ong === 'object' && ong.updateInterval) || 60000;
            this._nowTimer = setInterval(() => this._updateNow(), Math.max(1000, interval));
        }
        _onResize(width) {
            const m = this.options.mobile;
            const compact = m === true || m === 'phone' || (m !== false && width > 0 && width < 640);
            if (compact !== this._compact) {
                this._compact = compact;
                this.element.classList.toggle('psch-compact', compact);
                this._buildToolbar();
                this._updateToolbar();
            }
            if (this._view === 'month' && this._scroll) this._layoutMonth();
            if (this._virtual) this._renderVirtualRows(true);
        }

        // ------------------------------------------------------------ araç çubuğu
        _toolbarItems() {
            const o = this.options;
            if (Array.isArray(o.toolbar) && o.toolbar.length) return o.toolbar;
            if (typeof o.toolbar === 'string' && o.toolbar.trim()) return o.toolbar.split(',').map(s => s.trim()).filter(Boolean);
            const items = ['today', 'nav', 'title', 'spacer'];
            if (o.search) items.push('search');
            items.push('views');
            return items;
        }
        _buildToolbar() {
            const m = this.msg;
            const html = this._toolbarItems().map(item => {
                const name = typeof item === 'string' ? item : (item.name || item.type);
                switch (name) {
                    case 'today': return `<button type="button" class="psch-btn" data-cmd="today">${esc(m.today)}</button>`;
                    case 'nav': return `<div class="psch-btngroup"><button type="button" class="psch-btn psch-icon-btn" data-cmd="prev" aria-label="${esc(m.previous)}" title="${esc(m.previous)}">${ICONS.prev}</button><button type="button" class="psch-btn psch-icon-btn" data-cmd="next" aria-label="${esc(m.next)}" title="${esc(m.next)}">${ICONS.next}</button></div>`;
                    case 'previous': return `<button type="button" class="psch-btn psch-icon-btn" data-cmd="prev" aria-label="${esc(m.previous)}">${ICONS.prev}</button>`;
                    case 'next': return `<button type="button" class="psch-btn psch-icon-btn" data-cmd="next" aria-label="${esc(m.next)}">${ICONS.next}</button>`;
                    case 'title': return `<div class="psch-titlewrap"><button type="button" class="psch-title" data-cmd="pickdate" aria-label="${esc(m.pickDate)}"><span class="psch-title-text"></span>${ICONS.cal}</button><input type="date" class="psch-datepick" tabindex="-1" aria-hidden="true"></div>`;
                    case 'spacer': return '<div class="psch-spacer"></div>';
                    case 'search': return `<label class="psch-search">${ICONS.search}<input type="search" placeholder="${esc(m.search)}" aria-label="${esc(m.search)}" value="${esc(this._query)}"></label>`;
                    case 'refresh': return `<button type="button" class="psch-btn psch-icon-btn" data-cmd="refresh" aria-label="${esc(m.refresh)}" title="${esc(m.refresh)}">${ICONS.refresh}</button>`;
                    case 'pdf': return `<button type="button" class="psch-btn" data-cmd="pdf">${ICONS.pdf}<span>${esc(m.pdf)}</span></button>`;
                    case 'ical': return `<button type="button" class="psch-btn" data-cmd="ical-export">${ICONS.download}<span>${esc(m.icalExport)}</span></button><button type="button" class="psch-btn" data-cmd="ical-import">${ICONS.upload}<span>${esc(m.icalImport)}</span></button><input type="file" class="psch-icalfile" accept=".ics,text/calendar" hidden>`;
                    case 'icalExport': return `<button type="button" class="psch-btn" data-cmd="ical-export">${ICONS.download}<span>${esc(m.icalExport)}</span></button>`;
                    case 'views': {
                        if (this.options.views.length < 2) return '';
                        if (this._compact) {
                            return `<select class="psch-viewselect" aria-label="${esc(m.views_label)}">${this.options.views.map(v => `<option value="${v.type}">${esc(this._viewTitle(v))}</option>`).join('')}</select>`;
                        }
                        return `<div class="psch-views" role="group" aria-label="${esc(m.views_label)}">${this.options.views.map(v => `<button type="button" class="psch-view-btn" data-view="${v.type}" aria-pressed="false">${esc(this._viewTitle(v))}</button>`).join('')}</div>`;
                    }
                    default: {
                        const tpl = typeof item === 'object' ? item.template : null;
                        const fn = resolveFn(tpl) || resolveFn(name);
                        if (fn) { const r = fn(this); return typeof r === 'string' ? `<div class="psch-custom">${r}</div>` : ''; }
                        if (tpl) return `<div class="psch-custom">${compileTemplate(tpl)(this) || ''}</div>`;
                        return '';
                    }
                }
            }).join('');
            this._toolbar.innerHTML = html;
            this._toolbar.hidden = !html;
        }
        _viewTitle(v) { return v.title || this.msg.views[v.type] || v.type; }
        _updateToolbar() {
            const t = this._toolbar.querySelector('.psch-title-text');
            if (t) t.textContent = this._titleText();
            const dp = this._toolbar.querySelector('.psch-datepick');
            if (dp) dp.value = D.toDateKey(this._date);
            this._toolbar.querySelectorAll('.psch-view-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === this._view)));
            const sel = this._toolbar.querySelector('.psch-viewselect');
            if (sel) sel.value = this._view;
        }
        _titleText() {
            const v = this._view, c = this.culture, days = this._days || [this._date];
            if (v === 'day' || v === 'timelineDay') return c.dateLong(this._date);
            if (v === 'month' || v === 'timelineMonth') return `${c.monthNames[this._date.getMonth()]} ${this._date.getFullYear()}`;
            if (v === 'year') return String(this._date.getFullYear());
            return c.range(days[0], days[days.length - 1]);
        }
        _onToolbarClick(e) {
            const b = e.target.closest('[data-cmd],[data-view]');
            if (!b || !this._toolbar.contains(b)) return;
            if (b.dataset.view) { this.view(b.dataset.view, 'changeView'); return; }
            switch (b.dataset.cmd) {
                case 'today': this._navigate('today', new Date()); break;
                case 'prev': this._navigate('previous', this._step(-1)); break;
                case 'next': this._navigate('next', this._step(1)); break;
                case 'refresh': this.read(); break;
                case 'pdf': if (this.saveAsPDF) this.saveAsPDF(); break;
                case 'ical-export': if (this.saveAsICal) this.saveAsICal(); break;
                case 'ical-import': { const f = this._toolbar.querySelector('.psch-icalfile'); if (f) f.click(); break; }
                case 'pickdate': {
                    const dp = this._toolbar.querySelector('.psch-datepick');
                    if (!dp) break;
                    try { if (typeof dp.showPicker === 'function') { dp.showPicker(); break; } } catch (err) { /* desteklenmiyor */ }
                    dp.focus(); dp.click();
                    break;
                }
            }
        }
        _onToolbarChange(e) {
            const t = e.target;
            if (t.matches('.psch-viewselect')) this.view(t.value, 'changeView');
            else if (t.matches('.psch-datepick') && t.value) this._navigate('changeDate', D.parse(t.value));
            else if (t.matches('.psch-icalfile') && t.files && t.files[0]) {
                const file = t.files[0];
                file.text().then(txt => this.importICal && this.importICal(txt)).finally(() => { t.value = ''; });
            }
        }

        // ------------------------------------------------------------ veri
        _initData() {
            const o = this.options;
            const ds = o.dataSource || {};
            if (!ds.data && Array.isArray(o.events)) ds.data = o.events;
            this.dataSource = new DataSource(ds, {
                formatDate: d => this._dateOut(d),
                onRealtimeState: s => this._trigger('realtimeState', { state: s })
            });
            if (this._unsubscribe) this._unsubscribe();
            this._unsubscribe = this.dataSource.subscribe(m => this._onRealtime(m));
            this._readOnce = false;
            this.read();
        }
        async read() {
            this._computeRange();
            const range = this._fetchRange();
            if (this._trigger('dataBinding', { range })) return;
            const remote = this.dataSource.isRemote || !!resolveFn((this.dataSource.transport || {}).read);
            if (remote) this._setLoading(true);
            try {
                const raw = await this.dataSource.read(range);
                this.events = raw.map(r => this._normalize(r)).filter(Boolean);
                this._readOnce = true;
            } catch (err) {
                console.error('[Panoptes.Scheduler] Okuma hatası', err);
                this._trigger('error', { error: err, operation: 'read' });
                this._toast(this.msg.errors.load, 'error');
            } finally {
                this._setLoading(false);
            }
            this.refresh();
        }
        _fetchRange() { return { start: this._range.start, end: this._range.end }; }
        _setLoading(on) { if (this._loading) this._loading.hidden = !on; this.element.toggleAttribute('aria-busy', !!on); }
        _onRealtime(m) {
            if (!m || !m.action) return;
            const raw = m.event || m.data;
            if (m.action === 'destroy') {
                const id = raw && raw.id != null ? raw.id : m.id;
                this.events = this.events.filter(e => String(e.id) !== String(id));
            } else if (raw) {
                const ev = this._normalize(raw);
                const i = this.events.findIndex(e => String(e.id) === String(ev.id));
                if (i >= 0) this.events[i] = ev; else this.events.push(ev);
            }
            this.refresh();
            this._trigger('realtime', { action: m.action, event: raw });
        }

        /** Sunucu/yerel kaydı iç modele çevirir (PascalCase alanlar desteklenir). */
        _normalize(raw0) {
            if (!raw0) return null;
            const raw = camelize(raw0);
            const ev = Object.assign({}, raw);
            ev.isAllDay = !!raw.isAllDay;
            ev.start = this._dateIn(raw.start, ev.isAllDay);
            if (!ev.start) return null;
            ev.end = this._dateIn(raw.end, ev.isAllDay);
            if (ev.isAllDay) {
                ev.start = D.startOfDay(ev.start);
                ev.end = ev.end ? D.addDays(D.startOfDay(ev.end), 1) : D.addDays(ev.start, 1);
                if (ev.end <= ev.start) ev.end = D.addDays(ev.start, 1);
            } else if (!ev.end || ev.end < ev.start) {
                ev.end = D.addMinutes(ev.start, 60);
            }
            ev.title = raw.title == null ? '' : String(raw.title);
            ev.recurrenceRule = raw.recurrenceRule || '';
            ev.recurrenceId = raw.recurrenceId == null || raw.recurrenceId === '' ? null : raw.recurrenceId;
            ev.recurrenceException = this._parseExceptions(raw.recurrenceException);
            ev.isReadonly = !!raw.isReadonly;
            if (ev.id == null || ev.id === '') ev.id = 'tmp_' + Math.random().toString(36).slice(2);
            delete ev._rule; delete ev._ruleSrc;
            return ev;
        }
        _parseExceptions(v) {
            if (!v) return [];
            const arr = Array.isArray(v) ? v : String(v).split(/[;,]/);
            return arr.map(x => (x instanceof Date ? new Date(x.getTime()) : (/^\d{8}(T\d{6}Z?)?$/.test(String(x).trim()) ? this._absToWall(Recurrence.parseICalDate(x)) : this._dateIn(x, false)))).filter(Boolean);
        }
        /** Veri tarihini takvim duvar saatine çevirir. Saat dilimi tanımlıysa ofsetsiz metinler UTC kabul edilir. */
        _dateIn(v, allDay) {
            if (v == null || v === '') return null;
            const tz = this.options.timezone;
            if (!tz || allDay) {
                const d = D.parse(v);
                return d && allDay && tz && D.hasOffset(v) ? TZ.toWall(d, tz) : d;
            }
            let s = v;
            if (typeof s === 'string' && !D.hasOffset(s) && /T\d/.test(s)) s += 'Z';
            const d = D.parse(s);
            return d ? TZ.toWall(d, tz) : null;
        }
        /** Takvim duvar saatini veri biçimine çevirir. */
        _dateOut(d, dateOnly) {
            const tz = this.options.timezone;
            if (tz && !dateOnly) return TZ.fromWall(d, tz).toISOString().replace(/\.\d{3}Z$/, 'Z');
            return D.toLocalISO(dateOnly ? D.startOfDay(d) : d);
        }
        _absToWall(d) { return this.options.timezone ? TZ.toWall(d, this.options.timezone) : new Date(d.getTime()); }
        _wallToAbs(d) { return this.options.timezone ? TZ.fromWall(d, this.options.timezone) : new Date(d.getTime()); }
        /** İç modeli sunucuya gönderilecek düz nesneye çevirir. */
        _serialize(ev) {
            const out = {};
            Object.keys(ev).forEach(k => { if (k.charAt(0) !== '_' && typeof ev[k] !== 'function') out[k] = ev[k]; });
            out.start = this._dateOut(ev.start, ev.isAllDay);
            out.end = ev.isAllDay ? this._dateOut(D.addDays(ev.end, -1), true) : this._dateOut(ev.end);
            out.recurrenceException = (ev.recurrenceException || []).map(d => this._dateOut(d)).join(';');
            if (typeof out.id === 'string' && out.id.indexOf('tmp_') === 0) out.id = null;
            return out;
        }
        data() { return this.events.map(e => this._serialize(e)); }

        // ------------------------------------------------------------ aralık & tekrar açılımı
        _slotMinutes() { return Math.max(5, Math.round(this.options.majorTick / Math.max(1, this.options.minorTickCount))); }
        _dayRange() {
            const o = this.options;
            let s, e;
            if (this._showWorkHours) { s = D.parseTime(o.workDayStart, 480); e = D.parseTime(o.workDayEnd, 1020); }
            else { s = D.parseTime(o.startTime, 0); e = D.parseTime(o.endTime, 0); }
            if (e <= s) e += 1440;
            return { s, e };
        }
        _isWorkDay(d) { return (this.options.workDays || []).map(Number).includes(d.getDay()); }
        _isWorkMinute(m) {
            const ws = D.parseTime(this.options.workDayStart, 480), we = D.parseTime(this.options.workDayEnd, 1020);
            return we > ws ? (m >= ws && m < we) : (m >= ws || m < we);
        }
        _weekDays(date, workOnly) {
            const start = D.startOfWeek(date, this.firstDay);
            const days = [];
            for (let i = 0; i < 7; i++) { const d = D.addDays(start, i); if (!workOnly || this._isWorkDay(d)) days.push(d); }
            return days.length ? days : [start];
        }
        _computeRange() {
            const v = this._view, d = this._date;
            let days = [];
            switch (v) {
                case 'day': case 'timelineDay': days = [d]; break;
                case 'week': case 'timelineWeek': days = this._weekDays(d, false); break;
                case 'workWeek': case 'timelineWorkWeek': days = this._weekDays(d, true); break;
                case 'month': {
                    const first = D.startOfWeek(D.startOfMonth(d), this.firstDay);
                    for (let i = 0; i < 42; i++) days.push(D.addDays(first, i));
                    break;
                }
                case 'timelineMonth': {
                    const dim = D.daysInMonth(d.getFullYear(), d.getMonth());
                    for (let i = 1; i <= dim; i++) days.push(new Date(d.getFullYear(), d.getMonth(), i));
                    break;
                }
                case 'year': days = [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear(), 11, 31)]; break;
                case 'agenda': for (let i = 0; i < Math.max(1, this.options.agendaDays); i++) days.push(D.addDays(d, i)); break;
            }
            this._days = days;
            const last = days[days.length - 1];
            let end = D.addDays(last, 1);
            if (isTimeView(v) || isTimeline(v)) {
                const { e } = this._dayRange();
                if (e > 1440) end = D.atMinutes(last, e);
            }
            this._range = { start: D.startOfDay(days[0]), end };
        }
        _step(dir) {
            const v = this._view, d = this._date;
            if (v === 'month' || v === 'timelineMonth') return D.addMonths(D.startOfMonth(d), dir);
            if (v === 'year') return new Date(d.getFullYear() + dir, d.getMonth(), 1);
            if (v === 'agenda') return D.addDays(d, dir * Math.max(1, this.options.agendaDays));
            if (v === 'day' || v === 'timelineDay') return D.addDays(d, dir);
            return D.addDays(d, dir * 7);
        }
        _ruleOf(ev) {
            if (!ev.recurrenceRule || ev.recurrenceId != null) return null;
            if (ev._ruleSrc !== ev.recurrenceRule) { ev._rule = Recurrence.parse(ev.recurrenceRule); ev._ruleSrc = ev.recurrenceRule; }
            return ev._rule;
        }
        /** Verilen aralığa düşen tüm etkinlik ve tekrarları üretir. */
        _expandRange(start, end, ignoreFilters) {
            const out = [];
            for (const ev of this.events) {
                const dur = ev.end - ev.start;
                const rule = this._ruleOf(ev);
                if (rule) {
                    const days = ev.isAllDay ? Math.max(1, Math.round(dur / MS_DAY)) : 0;
                    Recurrence.expand(ev.start, rule, start, end, ev.recurrenceException, dur).forEach(st => {
                        const en = ev.isAllDay ? D.addDays(st, days) : new Date(st.getTime() + dur);
                        if (en > start || +en === +st) out.push(this._mkOcc(ev, st, en, true));
                    });
                } else if (D.overlaps(ev.start, ev.end, start, end) || (+ev.start === +ev.end && ev.start >= start && ev.start < end)) {
                    out.push(this._mkOcc(ev, ev.start, ev.end, false));
                }
            }
            const list = ignoreFilters ? out : out.filter(x => this._passesFilters(x));
            return list.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
        }
        _mkOcc(ev, s, e, rec) {
            return { uid: rec ? `${ev.id}@${s.getTime()}` : String(ev.id), event: ev, start: s, end: e, isRecurring: rec, isException: ev.recurrenceId != null, isAllDay: !!ev.isAllDay };
        }
        _passesFilters(occ) {
            if (this._query) {
                const q = this._query, ev = occ.event, loc = this.culture.locale;
                const hay = [ev.title, ev.description, ev.location, ev.organizer].filter(Boolean).join(' ').toLocaleLowerCase(loc);
                if (!hay.includes(q)) return false;
            }
            if (this._filter && !this._filter(occ.event, occ)) return false;
            return true;
        }
        _isAllDayLike(occ) { return occ.isAllDay || (occ.end - occ.start) >= MS_DAY; }

        // ------------------------------------------------------------ gruplama
        _computeLeaves() {
            const g = this.options.group;
            const names = g && Array.isArray(g.resources) ? g.resources : [];
            this._groupRes = names.map(n => this._resources.find(r => r.name === n || r.field === n)).filter(Boolean);
            if (!this._groupRes.length) { this._leaves = []; return; }
            let leaves = [{ path: [] }];
            this._groupRes.forEach(r => {
                const items = r.items.filter(it => !this._resFilter || this._resFilter(r, it));
                const next = [];
                leaves.forEach(l => items.forEach(it => next.push({ path: l.path.concat([{ res: r, item: it }]) })));
                leaves = next;
            });
            leaves.forEach((l, i) => { l.index = i; l.values = {}; l.path.forEach(p => { l.values[p.res.field] = p.item.value; }); });
            this._leaves = leaves;
        }
        _matchLeaf(ev, leaf) { return !leaf || leaf.path.every(p => valueMatches(ev[p.res.field], p.item.value)); }
        _leafByIndex(i) { return i >= 0 && this._leaves ? this._leaves[i] : null; }
        _columns(days, leaves, g) {
            const cols = [];
            if (!leaves.length) days.forEach(d => cols.push({ date: d, leaf: null }));
            else if (g && g.date) days.forEach(d => leaves.forEach(l => cols.push({ date: d, leaf: l })));
            else leaves.forEach(l => days.forEach(d => cols.push({ date: d, leaf: l })));
            return cols;
        }
        _groupHeaderContent(path) {
            const last = path[path.length - 1];
            if (!last) return '';
            if (this._tpl.groupHeader) return this._tpl.groupHeader({ resource: last.res.name, field: last.res.field, title: last.res.title, text: last.item.text, value: last.item.value, color: last.item.color || '', item: last.item.raw });
            return `${last.item.color ? `<span class="psch-gdot" style="background:${last.item.color}"></span>` : ''}<span class="psch-gtext">${esc(last.item.text)}</span>`;
        }
        _resLevels(groupRes) {
            return groupRes.map((r, L) => ({
                key: c => (c.leaf ? c.leaf.path.slice(0, L + 1).map(p => String(p.item.value)).join('|') : ''),
                html: c => (c.leaf ? this._groupHeaderContent(c.leaf.path.slice(0, L + 1)) : ''),
                cls: 'psch-ghead'
            }));
        }
        _headerRowsHTML(cols, levels, corner) {
            const today = new Date();
            return levels.map((lv, L) => {
                const fullKey = c => levels.slice(0, L + 1).map(x => x.key(c)).join('#');
                let row = `<div class="psch-row psch-hrow">${corner}`, i = 0;
                while (i < cols.length) {
                    const k = fullKey(cols[i]);
                    let j = i;
                    while (j + 1 < cols.length && fullKey(cols[j + 1]) === k) j++;
                    const isToday = lv.today && D.sameDay(cols[i].date, today);
                    row += `<div class="${lv.cls}${isToday ? ' psch-is-today' : ''}" style="grid-column:span ${j - i + 1}">${lv.html(cols[i])}</div>`;
                    i = j + 1;
                }
                return row + '</div>';
            }).join('');
        }
        _dateHeaderContent(date, mode) {
            if (this._tpl.dateHeader) return this._tpl.dateHeader({ date, view: this._view, text: this.culture.dateShort(date) });
            const c = this.culture;
            if (mode === 'timeline') return `<button type="button" class="psch-dbtn" data-goto="${+date}" tabindex="-1"><span class="psch-dname">${esc(c.dayShort[date.getDay()])}</span> <span class="psch-dnum-sm">${esc(c.dateShort(date))}</span></button>`;
            if (mode === 'timelineMonth') return `<span class="psch-dname">${esc(c.dayNarrow[date.getDay()])}</span><span class="psch-dnum-sm">${date.getDate()}</span>`;
            return `<button type="button" class="psch-dbtn" data-goto="${+date}" tabindex="-1"><span class="psch-dname">${esc(c.dayShort[date.getDay()])}</span><span class="psch-dnum">${date.getDate()}</span></button>`;
        }

        // ------------------------------------------------------------ yaşam döngüsü
        refresh() {
            this._computeRange();
            this._computeLeaves();
            this._occ = this._expandRange(this._range.start, this._range.end);
            this._occByUid = new Map(this._occ.map(o => [o.uid, o]));
            for (const uid of Array.from(this._selection.events)) if (!this._occByUid.has(uid)) this._selection.events.delete(uid);
            this.element.classList.remove(...VIEW_TYPES.map(v => 'psch-v-' + v));
            this.element.classList.add('psch-v-' + this._view);
            this._updateToolbar();
            this._renderView();
            this._renderFooter();
            this._afterRender();
            this._trigger('dataBound', { view: this._view, start: this._range.start, end: this._range.end, occurrences: this._occ.length });
        }
        _renderFooter() {
            const show = this.options.footer !== false && (isTimeView(this._view) || (isTimeline(this._view) && this._view !== 'timelineMonth'));
            this._footer.hidden = !show;
            if (show) this._footer.innerHTML = `<button type="button" class="psch-link" data-cmd="workhours">${ICONS.cal}<span>${esc(this._showWorkHours ? this.msg.showFullDay : this.msg.showWorkDay)}</span></button>`;
        }
        _renderView() {
            const v = this._view;
            let html;
            this._virtual = false;
            if (isTimeView(v)) html = this._renderTime();
            else if (v === 'month') html = this._renderMonth();
            else if (v === 'year') html = this._renderYear();
            else if (v === 'agenda') html = this._renderAgenda();
            else html = this._renderTimeline();

            const prev = this._scroll ? { top: this._scroll.scrollTop, left: this._scroll.scrollLeft, view: this._renderedView, key: this._renderedKey } : null;
            this._body.innerHTML = `<div class="psch-scroll">${html}</div>`;
            this._scroll = this._body.firstElementChild;
            const key = `${v}|${+this._range.start}|${this._showWorkHours}`;
            if (prev && prev.view === v && prev.key === key) { this._scroll.scrollTop = prev.top; this._scroll.scrollLeft = prev.left; }
            else if (prev && prev.view === v && isTimeView(v) && prev.key.split('|')[2] === String(this._showWorkHours)) this._scroll.scrollTop = prev.top;
            else this._scrollToTime();
            this._renderedView = v; this._renderedKey = key;
            if (this._virtual) {
                this._scroll.addEventListener('scroll', () => {
                    if (this._vRaf) return;
                    this._vRaf = requestAnimationFrame(() => { this._vRaf = 0; this._renderVirtualRows(); });
                }, { passive: true });
                this._renderVirtualRows(true);
            }
        }
        _scrollToTime() {
            const v = this._view, o = this.options;
            if (!this._scroll || !(isTimeView(v) || (isTimeline(v) && v !== 'timelineMonth'))) return;
            const { s } = this._dayRange();
            let t = D.parseTime(o.scrollTime, this._showWorkHours ? s : D.parseTime(o.workDayStart, 480));
            if (t < s) t += 1440;
            const units = Math.max(0, (t - s) / this._slotMinutes());
            if (isTimeView(v)) { this._scroll.scrollTop = units * o.slotHeight; return; }
            const view = this._scroll.firstElementChild;
            const M = this._tl ? this._tl.cols.length : 1;
            const colW = (view.offsetWidth - o.resourceColumnWidth) / M;
            const x = Math.max(0, units * colW - colW);
            this._scroll.scrollLeft = this.rtl ? -x : x;
        }
        _afterRender() {
            if (this._view === 'month') this._layoutMonth();
            if (isTimeline(this._view) && this.options.autoEventHeight) this._layoutTimelineAuto();
            this._applySelection();
            this._updateNow();
        }

        // ------------------------------------------------------------ etkinlik çipi
        _eventColor(ev) {
            const own = safeColor(ev.color);
            if (own) return own;
            for (const r of this._resources) {
                const v = ev[r.field];
                const first = Array.isArray(v) ? v[0] : v;
                if (first == null) continue;
                const it = r.items.find(i => String(i.value) === String(first));
                if (it && it.color) return it.color;
            }
            return null;
        }
        _colorStyle(color) {
            if (!color) return '';
            const lum = luminance(color);
            if (lum != null && lum > 0.7) return `--ev-bg:${color};--ev-fg:#1e293b;--ev-accent:color-mix(in srgb, ${color} 45%, #334155);--ev-bd:color-mix(in srgb, ${color} 60%, #94a3b8);`;
            return `--ev-bg:color-mix(in srgb, ${color} 16%, #fff);--ev-fg:color-mix(in srgb, ${color} 72%, #000);--ev-accent:${color};--ev-bd:color-mix(in srgb, ${color} 32%, transparent);`;
        }
        _resourceTexts(ev) {
            const res = {};
            this._resources.forEach(r => {
                const v = ev[r.field];
                const vals = Array.isArray(v) ? v : (v != null && v !== '' ? [v] : []);
                const items = vals.map(x => r.items.find(i => String(i.value) === String(x))).filter(Boolean);
                res[r.field] = { title: r.title, text: items.map(i => i.text).join(', '), color: items.length ? items[0].color || '' : '', items: items.map(i => i.raw) };
            });
            return res;
        }
        _tplData(occ) {
            const ev = occ.event, c = this.culture;
            return Object.assign({}, ev, {
                start: occ.start, end: occ.end, title: ev.title || this.msg.untitled,
                startTime: c.time(occ.start), endTime: c.time(occ.end),
                timeRange: occ.isAllDay ? this.msg.allDay : c.timeRange(occ.start, occ.end),
                date: c.dateMed(occ.start), isRecurring: occ.isRecurring, isException: occ.isException,
                resources: this._resourceTexts(ev), color: this._eventColor(ev) || '', uid: occ.uid
            });
        }
        _eventHTML(occ, o) {
            const ev = occ.event, ed = this.options.editable, m = this.msg, c = this.culture;
            const ro = !!ev.isReadonly;
            const color = this._eventColor(ev);
            const cls = ['psch-event', 'psch-ev-' + o.kind];
            if (o.kind !== 'time') cls.push('psch-h');
            if (!color && ev.colorClass) cls.push('psch-cls', ...safeClasses(ev.colorClass));
            if (ro) cls.push('psch-readonly');
            if (occ.isRecurring) cls.push('psch-recurring');
            if (o.contBefore) cls.push('psch-cont-before');
            if (o.contAfter) cls.push('psch-cont-after');
            if (this._selection.events.has(occ.uid)) cls.push('psch-selected');
            if (!ro && ed.move) cls.push('psch-movable');
            if (o.auto) cls.push('psch-auto');
            const title = ev.title || m.untitled;
            const tpl = (o.kind === 'bar' && this._tpl.allDayEvent) || this._tpl.event;
            const icon = occ.isRecurring ? `<span class="psch-ev-icon" title="${esc(this._ruleText(ev))}">${ICONS.recur}</span>` : (occ.isException ? `<span class="psch-ev-icon">${ICONS.exc}</span>` : '') + (ro ? `<span class="psch-ev-icon">${ICONS.lock}</span>` : '');
            let inner;
            if (tpl) inner = `<div class="psch-ev-tpl">${tpl(this._tplData(occ))}</div>`;
            else if (o.kind === 'bar') {
                const time = !occ.isAllDay && !o.contBefore && !this._isAllDayLike(occ) ? `<span class="psch-ev-when">${esc(c.time(occ.start))}</span>` : '';
                inner = `<div class="psch-ev-line">${time}<span class="psch-ev-title">${esc(title)}</span>${icon}</div>`;
            } else {
                const time = occ.isAllDay ? m.allDay : c.timeRange(occ.start, occ.end);
                const desc = o.auto && ev.description ? `<div class="psch-ev-desc">${esc(ev.description)}</div>` : '';
                inner = `<div class="psch-ev-line"><span class="psch-ev-title">${esc(title)}</span>${icon}</div><div class="psch-ev-when">${esc(time)}</div>${desc}`;
            }
            const del = !ro && ed.destroy ? `<button type="button" class="psch-del" tabindex="-1" aria-label="${esc(m.editor.destroy)}">&times;</button>` : '';
            let rh = '';
            if (!ro && ed.resize) {
                if (!o.contBefore) rh += '<span class="psch-rh psch-rh-start" aria-hidden="true"></span>';
                if (!o.contAfter) rh += '<span class="psch-rh psch-rh-end" aria-hidden="true"></span>';
            }
            const label = `${title}, ${c.dateMed(occ.start)} ${occ.isAllDay ? m.allDay : c.timeRange(occ.start, occ.end)}`;
            return `<div class="${cls.join(' ')}" data-uid="${esc(occ.uid)}" ${o.extra || ''} style="${o.style || ''}${this._colorStyle(color)}" role="button" tabindex="-1" aria-label="${esc(label)}">${inner}${del}${rh}</div>`;
        }
        _ruleText(ev) { const r = this._ruleOf(ev); return r ? Recurrence.describe(r, this.culture, this.msg) : ''; }

        // ------------------------------------------------------------ yerleşim algoritmaları
        _layoutColumns(items) {
            items.sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
            let cluster = [], clusterEnd = -Infinity;
            const flush = () => {
                const ends = [];
                cluster.forEach(it => {
                    let c = ends.findIndex(end => end <= it.s);
                    if (c < 0) { c = ends.length; ends.push(it.e); } else ends[c] = it.e;
                    it.col = c;
                });
                cluster.forEach(it => { it.cols = ends.length; });
                cluster = [];
            };
            items.forEach(it => {
                const e = Math.max(it.e, it.s + 1);
                if (it.s >= clusterEnd) { flush(); clusterEnd = e; } else clusterEnd = Math.max(clusterEnd, e);
                cluster.push(it);
            });
            flush();
            return items;
        }
        _segments(cols, occs, colRange) {
            const segs = [];
            occs.forEach(occ => {
                let run = null;
                cols.forEach((col, i) => {
                    const [cs, ce] = colRange(col);
                    const hit = this._matchLeaf(occ.event, col.leaf) && (D.overlaps(occ.start, occ.end, cs, ce) || (+occ.start === +occ.end && occ.start >= cs && occ.start < ce));
                    if (hit) {
                        if (run && run.c1 === i - 1) run.c1 = i;
                        else { run = { occ, c0: i, c1: i }; segs.push(run); }
                    }
                });
            });
            segs.forEach(sg => {
                sg.contBefore = occsStartsBefore(sg.occ, colRange(cols[sg.c0])[0]);
                sg.contAfter = sg.occ.end > colRange(cols[sg.c1])[1];
            });
            function occsStartsBefore(occ, t) { return occ.start < t; }
            return segs;
        }
        _assignLanes(segs) {
            segs.sort((a, b) => a.c0 - b.c0 || (b.c1 - b.c0) - (a.c1 - a.c0) || a.occ.start - b.occ.start);
            const ends = [];
            segs.forEach(s => {
                let l = ends.findIndex(end => end < s.c0);
                if (l < 0) { l = ends.length; ends.push(s.c1); } else ends[l] = s.c1;
                s.lane = l;
            });
            return ends.length;
        }

        // ------------------------------------------------------------ Gün / Hafta / İş haftası
        _renderTime() {
            const o = this.options, m = this.msg, days = this._days, leaves = this._leaves, g = o.group || {};
            const vertical = leaves.length > 0 && g.orientation === 'vertical';
            const { s, e } = this._dayRange();
            const slotMin = this._slotMinutes();
            const nSlots = Math.max(1, Math.ceil((e - s) / slotMin));
            const cols = vertical ? days.map(d => ({ date: d, leaf: null })) : this._columns(days, leaves, g);
            const N = cols.length;
            const tmpl = `${vertical ? 'var(--psch-res-w) ' : ''}var(--psch-gutter-w) repeat(${N}, minmax(0, 1fr))`;
            const minW = `calc(${vertical ? 'var(--psch-res-w) + ' : ''}var(--psch-gutter-w) + ${N} * var(--psch-col-min))`;
            const corner = vertical ? '<div class="psch-corner psch-sticky-0"></div><div class="psch-corner psch-sticky-1"></div>' : '<div class="psch-corner psch-sticky-0"></div>';
            const gutterSticky = vertical ? 'psch-sticky-1' : 'psch-sticky-0';
            const dateLevel = { key: c => D.toDateKey(c.date), html: c => this._dateHeaderContent(c.date, 'time'), cls: 'psch-dhead', today: true };
            const resLevels = vertical ? [] : this._resLevels(this._groupRes);
            const levels = g.date ? [dateLevel, ...resLevels] : [...resLevels, dateLevel];
            const allDayOccs = o.allDaySlot ? this._occ.filter(x => this._isAllDayLike(x)) : [];
            const timed = this._occ.filter(x => !o.allDaySlot || !this._isAllDayLike(x));
            const adLabel = cls => `<div class="psch-corner psch-adlabel ${cls}">${esc(m.allDay)}</div>`;

            let head = `<div class="psch-thead">${this._headerRowsHTML(cols, levels, corner)}`;
            if (!vertical && o.allDaySlot) head += `<div class="psch-row psch-adrow">${this._allDayCells(cols, allDayOccs, adLabel('psch-sticky-0'))}</div>`;
            head += '</div>';

            const gutter = this._gutterHTML(s, e, slotMin, nSlots, gutterSticky);
            let body;
            if (vertical) {
                body = leaves.map(leaf => {
                    const lcols = days.map(d => ({ date: d, leaf }));
                    const label = `<div class="psch-reslabel psch-sticky-0" style="grid-row:span ${o.allDaySlot ? 2 : 1}">${this._groupHeaderContent(leaf.path)}</div>`;
                    const ad = o.allDaySlot ? this._allDayCells(lcols, allDayOccs, adLabel('psch-sticky-1')) : '';
                    return `<div class="psch-vblock">${label}${ad}${gutter}${lcols.map((c, i) => this._timeColHTML(c, i, s, e, slotMin, nSlots, timed)).join('')}</div>`;
                }).join('');
            } else {
                body = `<div class="psch-row psch-tbody">${gutter}${cols.map((c, i) => this._timeColHTML(c, i, s, e, slotMin, nSlots, timed)).join('')}</div>`;
            }
            return `<div class="psch-view psch-timeview" style="--psch-cols:${tmpl};width:max(100%, ${minW})">${head}${body}</div>`;
        }
        _gutterHTML(s, e, slotMin, nSlots, sticky) {
            const o = this.options;
            let labels = '';
            for (let mm = s; mm < e; mm += o.majorTick) {
                const top = (mm - s) / slotMin * o.slotHeight;
                const d = D.atMinutes(this._date, mm);
                const txt = this._tpl.majorTime ? this._tpl.majorTime({ date: d, text: this.culture.time(d) }) : esc(this.culture.time(d));
                labels += `<div class="psch-glabel${mm === s ? ' psch-first' : ''}" style="top:${top}px">${txt}</div>`;
            }
            return `<div class="psch-gutter ${sticky}" style="height:${nSlots * o.slotHeight}px">${labels}</div>`;
        }
        _timeColHTML(col, ci, s, e, slotMin, nSlots, occs) {
            const o = this.options;
            const ds = D.atMinutes(col.date, s), de = D.atMinutes(col.date, e);
            const g = col.leaf ? col.leaf.index : -1;
            const workDay = this._isWorkDay(col.date);
            let slots = '';
            for (let i = 0; i < nSlots; i++) {
                const m0 = s + i * slotMin, m1 = Math.min(m0 + slotMin, e);
                const work = workDay && this._isWorkMinute(m0 % 1440);
                slots += `<div class="psch-slot psch-tslot${m0 % o.majorTick === 0 ? ' psch-major' : ''}${work ? '' : ' psch-nonwork'}" data-s="${+D.atMinutes(col.date, m0)}" data-e="${+D.atMinutes(col.date, m1)}" data-k="time" data-g="${g}"></div>`;
            }
            const items = occs
                .filter(x => (D.overlaps(x.start, x.end, ds, de) || (+x.start === +x.end && x.start >= ds && x.start < de)) && this._matchLeaf(x.event, col.leaf))
                .map(x => ({ occ: x, s: Math.max(+x.start, +ds), e: Math.min(+x.end, +de) }));
            this._layoutColumns(items);
            const pxPerMs = o.slotHeight / (slotMin * MS_MIN);
            const evs = items.map(it => {
                const top = (it.s - ds) * pxPerMs;
                const h = Math.max((it.e - it.s) * pxPerMs, Math.min(20, o.slotHeight));
                const w = 100 / it.cols;
                const style = `top:${top.toFixed(1)}px;height:${(h - 2).toFixed(1)}px;inset-inline-start:calc(${(it.col * w).toFixed(3)}% + 2px);width:calc(${w.toFixed(3)}% - 6px);`;
                return this._eventHTML(it.occ, { kind: 'time', style, contBefore: it.occ.start < ds, contAfter: it.occ.end > de, auto: h > 64 });
            }).join('');
            const today = D.sameDay(col.date, new Date());
            return `<div class="psch-col${today ? ' psch-today' : ''}${workDay ? '' : ' psch-weekend'}" data-col="${ci}" data-s="${+ds}" data-e="${+de}" data-g="${g}">${slots}<div class="psch-evlayer">${evs}</div></div>`;
        }
        _allDayCells(cols, occs, prefix) {
            const o = this.options, N = cols.length, evH = o.eventHeight;
            const range = c => { const st = D.startOfDay(c.date); return [st, D.addDays(st, 1)]; };
            const segs = this._segments(cols, occs, range);
            const lanes = this._assignLanes(segs);
            const h = Math.max(1, lanes) * (evH + 3) + 6;
            const today = new Date();
            const cells = cols.map(c => {
                const [st, en] = range(c);
                return `<div class="psch-slot psch-adcell${D.sameDay(c.date, today) ? ' psch-today' : ''}" data-s="${+st}" data-e="${+en}" data-k="allday" data-g="${c.leaf ? c.leaf.index : -1}"></div>`;
            }).join('');
            const bars = segs.map(sg => {
                const style = `top:${3 + sg.lane * (evH + 3)}px;height:${evH}px;inset-inline-start:calc(${(sg.c0 / N * 100).toFixed(3)}% + 2px);width:calc(${((sg.c1 - sg.c0 + 1) / N * 100).toFixed(3)}% - 5px);`;
                return this._eventHTML(sg.occ, { kind: 'bar', style, contBefore: sg.contBefore, contAfter: sg.contAfter });
            }).join('');
            return `${prefix}<div class="psch-adcells" style="grid-column:span ${N};height:${h}px;grid-template-columns:repeat(${N}, minmax(0, 1fr))">${cells}<div class="psch-evlayer">${bars}</div></div>`;
        }

        // ------------------------------------------------------------ Ay
        _renderMonth() {
            const o = this.options, leaves = this._leaves, g = o.group || {};
            const vertical = leaves.length > 0 && g.orientation === 'vertical';
            const weeks = [];
            for (let i = 0; i < this._days.length; i += 7) weeks.push(this._days.slice(i, i + 7));
            const monthIdx = this._date.getMonth();
            const headCols = this._columns(weeks[0], vertical ? [] : leaves, g);
            const N = headCols.length;
            const tmpl = `${vertical ? 'var(--psch-res-w) ' : ''}repeat(${N}, minmax(0, 1fr))`;
            const corner = vertical ? '<div class="psch-corner psch-sticky-0"></div>' : '';
            const dayLevel = { key: c => 'w' + c.date.getDay(), html: c => `<span class="psch-wname">${esc(this.culture[this._compact ? 'dayShort' : 'dayNames'][c.date.getDay()])}</span>`, cls: 'psch-dhead psch-mdhead' };
            const resLevels = vertical ? [] : this._resLevels(this._groupRes);
            const levels = g.date ? [dayLevel, ...resLevels] : [...resLevels, dayLevel];
            const head = `<div class="psch-thead">${this._headerRowsHTML(headCols, levels, corner)}</div>`;
            const blocks = (vertical ? leaves : [null]).map(leaf => {
                const label = leaf ? `<div class="psch-reslabel psch-sticky-0" style="grid-row:span ${weeks.length}">${this._groupHeaderContent(leaf.path)}</div>` : '';
                const rows = weeks.map((wk, wi) => {
                    const cols = vertical ? wk.map(d => ({ date: d, leaf })) : this._columns(wk, leaves, g);
                    return this._monthWeekHTML(cols, wi, monthIdx);
                }).join('');
                return `<div class="psch-mblock" style="grid-template-columns:${tmpl}">${label}${rows}</div>`;
            }).join('');
            const minW = vertical ? `calc(var(--psch-res-w) + ${N} * 90px)` : `${N * (leaves.length ? 70 : 0)}px`;
            return `<div class="psch-view psch-monthview" style="--psch-cols:${tmpl};width:max(100%, ${minW})">${head}${blocks}</div>`;
        }
        _monthWeekHTML(cols, wi, monthIdx) {
            const o = this.options, N = cols.length, evH = o.eventHeight, today = new Date();
            const range = c => { const st = D.startOfDay(c.date); return [st, D.addDays(st, 1)]; };
            const cells = cols.map(c => {
                const [st, en] = range(c);
                const other = c.date.getMonth() !== monthIdx;
                const num = c.date.getDate() === 1 ? `${c.date.getDate()} ${this.culture.monthShort[c.date.getMonth()]}` : c.date.getDate();
                return `<div class="psch-slot psch-mcell${other ? ' psch-other' : ''}${D.sameDay(c.date, today) ? ' psch-today' : ''}${this._isWorkDay(c.date) ? '' : ' psch-weekend'}" data-s="${+st}" data-e="${+en}" data-k="day" data-g="${c.leaf ? c.leaf.index : -1}"><div class="psch-mhead"><button type="button" class="psch-mday" data-goto="${+st}" tabindex="-1">${num}</button></div><button type="button" class="psch-more" hidden tabindex="-1"></button></div>`;
            }).join('');
            const segs = this._segments(cols, this._occ, range);
            const lanes = this._assignLanes(segs);
            const auto = !!o.autoEventHeight;
            const bars = segs.map(sg => {
                const style = `top:${MONTH_HEAD + sg.lane * (evH + 3)}px;${auto ? '' : `height:${evH}px;`}inset-inline-start:calc(${(sg.c0 / N * 100).toFixed(3)}% + 3px);width:calc(${((sg.c1 - sg.c0 + 1) / N * 100).toFixed(3)}% - 7px);`;
                return this._eventHTML(sg.occ, { kind: 'bar', style, contBefore: sg.contBefore, contAfter: sg.contAfter, auto, extra: `data-lane="${sg.lane}" data-c0="${sg.c0}" data-c1="${sg.c1}"` });
            }).join('');
            const minH = o.adaptiveSlotHeight ? `min-height:${MONTH_HEAD + lanes * (evH + 3) + 8}px;` : '';
            return `<div class="psch-mweek" data-week="${wi}" data-lanes="${lanes}" style="grid-column:span ${N};grid-template-columns:repeat(${N}, minmax(0, 1fr));${minH}">${cells}<div class="psch-evlayer">${bars}</div></div>`;
        }
        _layoutMonth() {
            const o = this.options, evH = o.eventHeight;
            if (!this._scroll) return;
            this._scroll.querySelectorAll('.psch-mweek').forEach(row => {
                const chips = Array.from(row.querySelectorAll(':scope > .psch-evlayer > .psch-event'));
                const cells = Array.from(row.querySelectorAll(':scope > .psch-mcell'));
                cells.forEach(c => { c.querySelector('.psch-more').hidden = true; });
                chips.forEach(ch => { ch.hidden = false; });
                if (o.autoEventHeight) {
                    const sky = new Array(cells.length).fill(MONTH_HEAD);
                    chips.forEach(ch => {
                        const c0 = +ch.dataset.c0, c1 = +ch.dataset.c1;
                        const top = Math.max(...sky.slice(c0, c1 + 1));
                        ch.style.top = top + 'px';
                        const h = ch.offsetHeight;
                        for (let c = c0; c <= c1; c++) sky[c] = top + h + 3;
                    });
                    row.style.minHeight = (Math.max(...sky) + 8) + 'px';
                    return;
                }
                if (o.adaptiveSlotHeight) return;
                const lanes = +row.dataset.lanes;
                const avail = row.clientHeight - MONTH_HEAD - 4;
                if (lanes * (evH + 3) <= avail) return;
                const maxLanes = Math.max(0, Math.floor((avail - 18) / (evH + 3)));
                const hidden = new Array(cells.length).fill(0);
                chips.forEach(ch => {
                    if (+ch.dataset.lane >= maxLanes) {
                        ch.hidden = true;
                        for (let c = +ch.dataset.c0; c <= +ch.dataset.c1; c++) hidden[c]++;
                    }
                });
                cells.forEach((cell, i) => {
                    if (!hidden[i]) return;
                    const b = cell.querySelector('.psch-more');
                    b.hidden = false;
                    b.textContent = format(this.msg.more, hidden[i]);
                });
            });
        }

        // ------------------------------------------------------------ Yıl
        _renderYear() {
            const y = this._date.getFullYear(), c = this.culture, today = new Date();
            const counts = new Map();
            this._occ.forEach(occ => {
                let d = D.startOfDay(occ.start), guard = 0;
                const end = occ.end > occ.start ? occ.end : D.addMinutes(occ.start, 1);
                while (d < end && guard++ < 400) { const k = D.toDateKey(d); counts.set(k, (counts.get(k) || 0) + 1); d = D.addDays(d, 1); }
            });
            const order = [0, 1, 2, 3, 4, 5, 6].map(i => (i + this.firstDay) % 7);
            let html = '';
            for (let mo = 0; mo < 12; mo++) {
                const first = new Date(y, mo, 1);
                const lead = (first.getDay() - this.firstDay + 7) % 7;
                const dim = D.daysInMonth(y, mo);
                let cells = '<span class="psch-yblank"></span>'.repeat(lead);
                for (let d = 1; d <= dim; d++) {
                    const date = new Date(y, mo, d);
                    const n = counts.get(D.toDateKey(date)) || 0;
                    const label = `${c.dateLong(date)}${n ? ` — ${n} ${this.msg.event.toLocaleLowerCase(c.locale)}` : ''}`;
                    cells += `<button type="button" tabindex="-1" class="psch-slot psch-yday${n ? ' psch-has' : ''}${D.sameDay(date, today) ? ' psch-today' : ''}${this._isWorkDay(date) ? '' : ' psch-weekend'}" style="--psch-heat:${Math.min(n, 4)}" data-s="${+date}" data-e="${+D.addDays(date, 1)}" data-k="day" data-g="-1" aria-label="${esc(label)}" title="${esc(label)}">${d}</button>`;
                }
                html += `<section class="psch-ymonth${mo === today.getMonth() && y === today.getFullYear() ? ' psch-current' : ''}"><button type="button" class="psch-ytitle" data-gomonth="${+first}" tabindex="-1">${esc(c.monthNames[mo])}</button><div class="psch-ygrid-days">${order.map(i => `<span class="psch-ywd">${esc(c.dayNarrow[i])}</span>`).join('')}${cells}</div></section>`;
            }
            return `<div class="psch-view psch-yearview"><div class="psch-ygrid">${html}</div></div>`;
        }

        // ------------------------------------------------------------ Ajanda
        _renderAgenda() {
            const m = this.msg, c = this.culture, today = new Date();
            const groups = this._leaves.length ? this._leaves : [null];
            let rows = '';
            groups.forEach(leaf => {
                let groupRows = '';
                this._days.forEach(day => {
                    const ds = D.startOfDay(day), de = D.addDays(ds, 1);
                    const list = this._occ.filter(x => this._matchLeaf(x.event, leaf) && (D.overlaps(x.start, x.end, ds, de) || (+x.start === +x.end && D.sameDay(x.start, day))));
                    list.forEach((occ, i) => {
                        const full = occ.isAllDay || (occ.start <= ds && occ.end >= de);
                        const time = full ? m.allDay : c.timeRange(occ.start < ds ? ds : occ.start, occ.end > de ? de : occ.end);
                        const dateCell = i === 0 ? `<td class="psch-ag-date" rowspan="${list.length}"><span class="psch-ag-dnum">${day.getDate()}</span><span class="psch-ag-dname">${esc(c.dayNames[day.getDay()])}<br><small>${esc(c.monthNames[day.getMonth()])} ${day.getFullYear()}</small></span></td>` : '';
                        groupRows += `<tr class="psch-ag-row${D.sameDay(day, today) ? ' psch-today' : ''}">${dateCell}<td class="psch-ag-time">${esc(time)}${occ.start < ds ? ` <span class="psch-ag-cont">(${esc(m.continued)})</span>` : ''}</td><td class="psch-ag-cell">${this._agendaEventHTML(occ)}</td></tr>`;
                    });
                });
                if (leaf) rows += `<tr class="psch-ag-group"><th colspan="3" scope="rowgroup">${this._groupHeaderContent(leaf.path)}</th></tr>`;
                rows += groupRows || (leaf ? `<tr><td colspan="3" class="psch-ag-empty">${esc(m.noEvents)}</td></tr>` : '');
            });
            if (!rows) rows = `<tr><td colspan="3" class="psch-ag-empty">${esc(m.noEvents)}</td></tr>`;
            return `<div class="psch-view psch-agendaview"><table class="psch-ag"><thead><tr><th scope="col">${esc(m.date)}</th><th scope="col">${esc(m.time)}</th><th scope="col">${esc(m.event)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        _agendaEventHTML(occ) {
            const ev = occ.event, ed = this.options.editable, m = this.msg;
            const color = this._eventColor(ev);
            const res = this._resourceTexts(ev);
            const badges = Object.keys(res).filter(k => res[k].text).map(k => `<span class="psch-ag-badge">${res[k].color ? `<i style="background:${res[k].color}"></i>` : ''}${esc(res[k].text)}</span>`).join('');
            const tpl = this._tpl.event;
            const body = tpl ? `<div class="psch-ev-tpl">${tpl(this._tplData(occ))}</div>` : `<div class="psch-ag-title">${esc(ev.title || m.untitled)}${occ.isRecurring ? `<span class="psch-ev-icon" title="${esc(this._ruleText(ev))}">${ICONS.recur}</span>` : ''}${ev.isReadonly ? `<span class="psch-ev-icon">${ICONS.lock}</span>` : ''}</div>${ev.description ? `<div class="psch-ag-desc">${esc(ev.description)}</div>` : ''}${badges ? `<div class="psch-ag-badges">${badges}</div>` : ''}`;
            const del = !ev.isReadonly && ed.destroy ? `<button type="button" class="psch-del" tabindex="-1" aria-label="${esc(m.editor.destroy)}">&times;</button>` : '';
            const cls = `psch-event psch-ev-agenda${this._selection.events.has(occ.uid) ? ' psch-selected' : ''}${ev.isReadonly ? ' psch-readonly' : ''}${!color && ev.colorClass ? ' psch-cls ' + safeClasses(ev.colorClass).join(' ') : ''}`;
            return `<div class="${cls}" data-uid="${esc(occ.uid)}" role="button" tabindex="-1" style="${this._colorStyle(color)}"><span class="psch-ag-dot"></span><div class="psch-ag-main">${body}</div>${del}</div>`;
        }

        // ------------------------------------------------------------ Zaman çizelgesi
        _renderTimeline() {
            const o = this.options, view = this._view, isMonth = view === 'timelineMonth';
            const { s, e } = this._dayRange();
            const slotMin = this._slotMinutes();
            const days = this._days, leaves = this._leaves, g = o.group || {};
            const horizontal = leaves.length > 0 && g.orientation === 'horizontal';
            const daySlots = d => {
                if (isMonth) { const st = D.startOfDay(d); return [{ s: +st, e: +D.addDays(st, 1), major: true, m0: 0, work: this._isWorkDay(d) }]; }
                const arr = [];
                const wd = this._isWorkDay(d);
                for (let mm = s; mm < e; mm += slotMin) arr.push({ s: +D.atMinutes(d, mm), e: +D.atMinutes(d, Math.min(mm + slotMin, e)), major: mm % o.majorTick === 0, m0: mm, work: wd && this._isWorkMinute(mm % 1440) });
                return arr;
            };
            const cols = [];
            if (horizontal && g.date) days.forEach(d => leaves.forEach(leaf => daySlots(d).forEach(sl => cols.push(Object.assign({ date: d, leaf }, sl)))));
            else (horizontal ? leaves : [null]).forEach(leaf => days.forEach(d => daySlots(d).forEach(sl => cols.push(Object.assign({ date: d, leaf }, sl)))));
            const M = cols.length;
            const colW = isMonth ? o.monthColumnWidth : o.timelineColumnWidth;
            const tmpl = `var(--psch-res-w) repeat(${M}, minmax(0, 1fr))`;
            const minW = `calc(var(--psch-res-w) + ${M * colW}px)`;
            const dateLevel = { key: c => D.toDateKey(c.date), html: c => this._dateHeaderContent(c.date, isMonth ? 'timelineMonth' : 'timeline'), cls: 'psch-dhead', today: true };
            const resLevels = horizontal ? this._resLevels(this._groupRes) : [];
            const levels = g.date ? [dateLevel, ...resLevels] : [...resLevels, dateLevel];
            if (!isMonth) {
                levels.push({
                    key: c => Math.floor(c.m0 / o.majorTick) + '',
                    html: c => { const d = new Date(c.s); return this._tpl.majorTime ? this._tpl.majorTime({ date: d, text: this.culture.time(d) }) : esc(this.culture.time(d)); },
                    cls: 'psch-tlhead'
                });
            }
            const head = `<div class="psch-thead">${this._headerRowsHTML(cols, levels, '<div class="psch-corner psch-sticky-0"></div>')}</div>`;
            const rows = horizontal || !leaves.length ? [{ leaf: null }] : leaves.map(l => ({ leaf: l }));
            this._tl = { cols, rows, M, isMonth };
            let body;
            if (o.virtual && rows.length > 1) {
                this._virtual = true;
                this._vRange = null;
                body = `<div class="psch-vrows" style="height:${rows.length * o.rowHeight}px"></div>`;
            } else {
                body = rows.map((r, ri) => this._tlRowHTML(r, ri)).join('');
            }
            return `<div class="psch-view psch-timeline" style="--psch-cols:${tmpl};width:max(100%, ${minW})">${head}<div class="psch-tlbody">${body}</div></div>`;
        }
        _tlRowHTML(row, ri, fixedTop) {
            const o = this.options, { cols, M, isMonth } = this._tl, today = new Date();
            const evH = o.timelineEventHeight;
            const label = `<div class="psch-reslabel psch-sticky-0">${row.leaf ? this._groupHeaderContent(row.leaf.path) : ''}</div>`;
            const cells = cols.map(c => {
                const leaf = row.leaf || c.leaf;
                return `<div class="psch-slot psch-tlslot${c.major ? ' psch-major' : ''}${c.work ? '' : ' psch-nonwork'}${D.sameDay(c.date, today) ? ' psch-today' : ''}" data-s="${c.s}" data-e="${c.e}" data-k="${isMonth ? 'day' : 'time'}" data-g="${leaf ? leaf.index : -1}"></div>`;
            }).join('');
            const segs = [];
            this._occ.forEach(occ => {
                let run = null;
                const os = +occ.start, oe = +occ.end;
                cols.forEach((c, i) => {
                    const leaf = row.leaf || c.leaf;
                    const a = Math.max(os, c.s), b = Math.min(oe, c.e);
                    const hit = this._matchLeaf(occ.event, leaf) && (b > a || (os === oe && os >= c.s && os < c.e));
                    if (!hit) { run = null; return; }
                    const x0 = i + (a - c.s) / (c.e - c.s), x1 = i + (b - c.s) / (c.e - c.s);
                    if (run && run.last === i - 1) { run.x1 = x1; run.last = i; }
                    else { run = { occ, x0, x1, first: i, last: i }; segs.push(run); }
                });
            });
            segs.sort((a, b) => a.x0 - b.x0 || (b.x1 - b.x0) - (a.x1 - a.x0));
            const ends = [];
            segs.forEach(sg => {
                sg.x1 = Math.max(sg.x1, sg.x0 + 0.35);
                let l = ends.findIndex(end => end <= sg.x0 + 1e-6);
                if (l < 0) { l = ends.length; ends.push(sg.x1); } else ends[l] = sg.x1;
                sg.lane = l;
            });
            const fixed = this._virtual;
            const capacity = fixed ? Math.max(1, Math.floor((o.rowHeight - 8) / (evH + 4))) : Infinity;
            let overflow = 0;
            const auto = !!o.autoEventHeight;
            const chips = segs.map(sg => {
                if (sg.lane >= capacity) { overflow++; return ''; }
                const style = `top:${4 + sg.lane * (evH + 4)}px;${auto ? '' : `height:${evH}px;`}inset-inline-start:calc(${(sg.x0 / M * 100).toFixed(4)}% + 1px);width:calc(${((sg.x1 - sg.x0) / M * 100).toFixed(4)}% - 3px);`;
                return this._eventHTML(sg.occ, { kind: 'tl', style, auto, contBefore: +sg.occ.start < cols[sg.first].s, contAfter: +sg.occ.end > cols[sg.last].e, extra: `data-x0="${sg.x0}" data-x1="${sg.x1}"` });
            }).join('');
            const h = fixed ? o.rowHeight : Math.max(o.rowHeight, 8 + ends.length * (evH + 4));
            const pos = fixedTop != null ? `position:absolute;inset-inline:0;top:${fixedTop}px;` : '';
            const more = overflow ? `<span class="psch-tl-more">${esc(format(this.msg.more, overflow))}</span>` : '';
            return `<div class="psch-row psch-tlrow" data-row="${ri}" style="${pos}height:${h}px">${label}<div class="psch-tlcells" style="grid-column:span ${M};grid-template-columns:repeat(${M}, minmax(0, 1fr))">${cells}<div class="psch-evlayer">${chips}${more}</div></div></div>`;
        }
        _renderVirtualRows(force) {
            if (!this._virtual || !this._scroll) return;
            const host = this._scroll.querySelector('.psch-vrows');
            if (!host) return;
            const rowH = this.options.rowHeight, rows = this._tl.rows;
            const top = this._scroll.scrollTop - host.offsetTop;
            const first = Math.max(0, Math.floor(top / rowH) - 4);
            const last = Math.min(rows.length - 1, Math.ceil((top + this._scroll.clientHeight) / rowH) + 4);
            const key = first + ':' + last;
            if (!force && this._vRange === key) return;
            this._vRange = key;
            let html = '';
            for (let i = first; i <= last; i++) html += this._tlRowHTML(rows[i], i, i * rowH);
            host.innerHTML = html;
            this._applySelection();
            this._updateNow();
        }
        _layoutTimelineAuto() {
            this._scroll.querySelectorAll('.psch-tlrow').forEach(row => {
                const chips = Array.from(row.querySelectorAll('.psch-tlcells > .psch-evlayer > .psch-event'));
                const placed = [];
                let bottom = 0;
                chips.forEach(ch => {
                    const x0 = +ch.dataset.x0, x1 = +ch.dataset.x1;
                    const h = ch.offsetHeight;
                    let top = 4;
                    placed.filter(p => p.x0 < x1 - 1e-6 && p.x1 > x0 + 1e-6).sort((a, b) => a.top - b.top).forEach(p => { if (top + h > p.top && top < p.top + p.h + 4) top = p.top + p.h + 4; });
                    ch.style.top = top + 'px';
                    placed.push({ x0, x1, top, h });
                    bottom = Math.max(bottom, top + h);
                });
                row.style.height = Math.max(this.options.rowHeight, bottom + 8) + 'px';
            });
        }

        // ------------------------------------------------------------ mevcut zaman & devam eden etkinlikler
        _updateNow() {
            if (!this._scroll) return;
            const o = this.options, now = Date.now();
            this._scroll.querySelectorAll('.psch-now').forEach(n => n.remove());
            if (o.currentTimeMarker !== false) {
                if (isTimeView(this._view)) {
                    const slotMs = this._slotMinutes() * MS_MIN;
                    this._scroll.querySelectorAll('.psch-col').forEach(col => {
                        const s = +col.dataset.s, e = +col.dataset.e;
                        if (now >= s && now < e) col.querySelector('.psch-evlayer').insertAdjacentHTML('beforeend', `<div class="psch-now" style="top:${((now - s) / slotMs * o.slotHeight).toFixed(1)}px"></div>`);
                    });
                } else if (isTimeline(this._view) && this._tl) {
                    const xs = [];
                    this._tl.cols.forEach((c, i) => { if (now >= c.s && now < c.e) xs.push(i + (now - c.s) / (c.e - c.s)); });
                    if (xs.length) {
                        const marks = xs.map(x => `<div class="psch-now psch-now-v" style="inset-inline-start:${(x / this._tl.M * 100).toFixed(4)}%"></div>`).join('');
                        this._scroll.querySelectorAll('.psch-tlcells > .psch-evlayer').forEach(l => l.insertAdjacentHTML('beforeend', marks));
                    }
                }
            }
            const ong = o.ongoingEvents;
            if (ong) {
                const cls = (typeof ong === 'object' && ong.cssClass) || 'psch-ongoing';
                this._scroll.querySelectorAll('.psch-event[data-uid]').forEach(el => {
                    const occ = this._occByUid.get(el.dataset.uid);
                    el.classList.toggle(cls, !!occ && now >= occ.start && now < occ.end);
                });
            }
        }

        // ------------------------------------------------------------ seçim
        _slotInfo(el) { return el ? { s: +el.dataset.s, e: +el.dataset.e, k: el.dataset.k, g: +el.dataset.g, el } : null; }
        _applySelection() {
            if (!this._scroll) return;
            const sel = this._selection;
            this._scroll.querySelectorAll('.psch-selected').forEach(n => n.classList.remove('psch-selected'));
            sel.events.forEach(uid => this._scroll.querySelectorAll(`.psch-event[data-uid="${cssEsc(uid)}"]`).forEach(el => el.classList.add('psch-selected')));
            if (sel.range) {
                const r = sel.range;
                this._scroll.querySelectorAll(`.psch-slot[data-k="${r.k}"][data-g="${r.g}"]`).forEach(el => {
                    if (+el.dataset.s >= r.s && +el.dataset.e <= r.e) el.classList.add('psch-selected');
                });
            }
        }
        _selectSlot(info, extend) {
            const sel = this._selection;
            sel.events.clear();
            if (extend && sel.anchor && sel.anchor.k === info.k && sel.anchor.g === info.g) {
                sel.range = { s: Math.min(sel.anchor.s, info.s), e: Math.max(sel.anchor.e, info.e), k: info.k, g: info.g };
            } else {
                sel.anchor = { s: info.s, e: info.e, k: info.k, g: info.g };
                sel.range = Object.assign({}, sel.anchor);
            }
            this._applySelection();
            this._announceRange(sel.range);
            this._fireChange();
        }
        _selectEvent(uid, toggle) {
            const sel = this._selection;
            sel.range = null;
            if (toggle) { if (sel.events.has(uid)) sel.events.delete(uid); else sel.events.add(uid); }
            else { sel.events.clear(); sel.events.add(uid); }
            this._applySelection();
            const occ = this._occByUid.get(uid);
            if (occ) this._announce(format(this.msg.a11y.selected, `${occ.event.title || this.msg.untitled}, ${this.culture.dateMed(occ.start)} ${occ.isAllDay ? this.msg.allDay : this.culture.timeRange(occ.start, occ.end)}`));
            this._fireChange();
        }
        _fireChange() {
            if (!this.options.selectable) return;
            const sel = this._selection;
            const events = Array.from(sel.events).map(u => this._occByUid.get(u)).filter(Boolean);
            const leaf = sel.range ? this._leafByIndex(sel.range.g) : null;
            this._trigger('change', {
                start: sel.range ? new Date(sel.range.s) : (events[0] ? events[0].start : null),
                end: sel.range ? new Date(sel.range.e) : (events[0] ? events[0].end : null),
                isAllDay: sel.range ? sel.range.k !== 'time' : false,
                events: events.map(x => x.event), occurrences: events, resources: leaf ? Object.assign({}, leaf.values) : {}
            });
        }
        clearSelection() { this._selection.events.clear(); this._selection.range = null; this._selection.anchor = null; this._applySelection(); }
        _announce(text) { if (this._live) { this._live.textContent = ''; requestAnimationFrame(() => { this._live.textContent = text; }); } }
        _announceRange(r) {
            if (!r) return;
            const s = new Date(r.s), e = new Date(r.e);
            const txt = r.k === 'time' ? `${this.culture.dateLong(s)} ${this.culture.timeRange(s, e)}` : this.culture.range(s, D.addDays(e, -1));
            this._announce(format(this.msg.a11y.selected, txt));
        }

        // ------------------------------------------------------------ fare & klavye
        _onClick(e) {
            if (this._suppressClick) { this._suppressClick = false; return; }
            const t = e.target;
            const del = t.closest('.psch-del');
            if (del) {
                e.stopPropagation();
                const evEl = del.closest('.psch-event');
                if (evEl && this.removeEvent) this.removeEvent(evEl.dataset.uid);
                return;
            }
            const more = t.closest('.psch-more');
            if (more) { const cell = more.closest('.psch-slot'); this._openDayPopover(cell, this._slotInfo(cell)); return; }
            const goto = t.closest('[data-goto]');
            if (goto) { const target = this.options.views.some(v => v.type === 'day') ? 'day' : null; if (target) { this._date = D.startOfDay(new Date(+goto.dataset.goto)); this.view(target, 'changeView'); } return; }
            const gm = t.closest('[data-gomonth]');
            if (gm) { this._date = new Date(+gm.dataset.gomonth); if (this.options.views.some(v => v.type === 'month')) this.view('month', 'changeView'); else this.refresh(); return; }
            const evEl = t.closest('.psch-event');
            if (evEl && evEl.dataset.uid) {
                const occ = this._occByUid.get(evEl.dataset.uid);
                this._selectEvent(evEl.dataset.uid, this.options.selectable === 'multiple' || this.options.selectable === true ? (e.ctrlKey || e.metaKey) : false);
                if (occ) this._trigger('eventClick', { event: occ.event, occurrence: occ, element: evEl, originalEvent: e });
                this._body.focus({ preventScroll: true });
                return;
            }
            const yday = t.closest('.psch-yday');
            if (yday) { this._selectSlot(this._slotInfo(yday), false); this._openDayPopover(yday, this._slotInfo(yday)); return; }
            const slot = t.closest('.psch-slot');
            if (slot) {
                const info = this._slotInfo(slot);
                this._selectSlot(info, e.shiftKey);
                this._trigger('slotClick', { start: new Date(info.s), end: new Date(info.e), isAllDay: info.k !== 'time', resources: this._leafValues(info.g), element: slot });
                this._body.focus({ preventScroll: true });
            }
        }
        _onDblClick(e) {
            const t = e.target;
            if (t.closest('.psch-del, .psch-more, [data-goto], [data-gomonth]')) return;
            const evEl = t.closest('.psch-event');
            if (evEl && evEl.dataset.uid) { if (this.editEvent) this.editEvent(evEl.dataset.uid); return; }
            const yday = t.closest('.psch-yday');
            if (yday) { this._date = D.startOfDay(new Date(+yday.dataset.s)); if (this.options.views.some(v => v.type === 'day')) this.view('day', 'changeView'); return; }
            const slot = t.closest('.psch-slot');
            if (slot && this.addEvent && this.options.editable.create) {
                const info = this._slotInfo(slot);
                const r = this._selection.range;
                const use = r && r.k === info.k && r.g === info.g && info.s >= r.s && info.e <= r.e ? r : info;
                this.addEvent(Object.assign({ start: new Date(use.s), end: new Date(use.e), isAllDay: use.k !== 'time' }, this._leafValues(use.g)));
            }
        }
        _leafValues(g) { const l = this._leafByIndex(g); return l ? Object.assign({}, l.values) : {}; }
        _onKeyDown(e) {
            if (e.target !== this._body) return;
            const k = e.key, sel = this._selection;
            const arrows = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
            if (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) {
                e.preventDefault();
                const dir = (k === 'ArrowRight') !== this.rtl ? 1 : -1;
                this._navigate(dir > 0 ? 'next' : 'previous', this._step(dir));
                return;
            }
            if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); const dir = k === 'PageDown' ? 1 : -1; this._navigate(dir > 0 ? 'next' : 'previous', this._step(dir)); return; }
            if (arrows[k]) { e.preventDefault(); this._moveSelection(arrows[k], e.shiftKey); return; }
            if ((k === 't' || k === 'T') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this._navigate('today', new Date()); return; }
            if (/^[1-9]$/.test(k) && !e.ctrlKey && !e.metaKey) {
                const v = this.options.views[+k - 1];
                if (v) { e.preventDefault(); this.view(v.type, 'changeView'); }
                return;
            }
            if (k === 'Enter') {
                e.preventDefault();
                if (sel.events.size && this.editEvent) this.editEvent(Array.from(sel.events)[0]);
                else if (sel.range && this.addEvent && this.options.editable.create) this.addEvent(Object.assign({ start: new Date(sel.range.s), end: new Date(sel.range.e), isAllDay: sel.range.k !== 'time' }, this._leafValues(sel.range.g)));
                return;
            }
            if ((k === 'Delete' || k === 'Backspace') && sel.events.size && this.removeEvent) { e.preventDefault(); this.removeEvent(Array.from(sel.events)[0]); return; }
            if (k === 'Escape') { this.clearSelection(); this._closePopover(); return; }
            if (k === 'Tab') {
                const els = Array.from(this._scroll.querySelectorAll('.psch-event[data-uid]:not([hidden])'));
                const uids = [...new Set(els.map(x => x.dataset.uid))];
                if (!uids.length) return;
                const cur = sel.events.size ? uids.indexOf(Array.from(sel.events)[0]) : -1;
                const next = cur + (e.shiftKey ? -1 : 1);
                if ((cur === -1 && e.shiftKey) || next < 0 || next >= uids.length) return;
                e.preventDefault();
                const uid = uids[cur === -1 ? 0 : next];
                this._selectEvent(uid, false);
                const el = this._scroll.querySelector(`.psch-event[data-uid="${cssEsc(uid)}"]`);
                if (el) this._scrollIntoView(el);
            }
        }
        _moveSelection(dir, extend) {
            const slots = Array.from(this._scroll.querySelectorAll('.psch-slot'));
            if (!slots.length) return;
            const sel = this._selection;
            let cur = null;
            const ref = extend && sel.focus ? sel.focus : (sel.range ? (dir === 'down' || dir === 'right' ? { s: sel.range.e - 1, k: sel.range.k, g: sel.range.g } : { s: sel.range.s, k: sel.range.k, g: sel.range.g }) : null);
            if (ref) cur = slots.find(el => el.dataset.k === ref.k && +el.dataset.g === ref.g && +el.dataset.s <= ref.s && +el.dataset.e > ref.s);
            if (!cur && sel.events.size) {
                const occ = this._occByUid.get(Array.from(sel.events)[0]);
                if (occ) cur = slots.find(el => +el.dataset.s <= +occ.start && +el.dataset.e > +occ.start);
            }
            let target;
            if (!cur) {
                const top = this._scroll.getBoundingClientRect().top;
                target = slots.find(el => el.getBoundingClientRect().bottom > top + 40) || slots[0];
            } else {
                const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                let d = dir;
                if (this.rtl && (d === 'left' || d === 'right')) d = d === 'left' ? 'right' : 'left';
                let best = null, bestScore = Infinity;
                slots.forEach(el => {
                    if (el === cur) return;
                    const b = el.getBoundingClientRect();
                    if (!b.width || !b.height) return;
                    const x = b.left + b.width / 2, y = b.top + b.height / 2;
                    const dx = x - cx, dy = y - cy;
                    let ok, score;
                    if (d === 'up') { ok = dy < -1 && Math.abs(dx) < Math.max(r.width, b.width) / 2; score = -dy + Math.abs(dx) * 3; }
                    else if (d === 'down') { ok = dy > 1 && Math.abs(dx) < Math.max(r.width, b.width) / 2; score = dy + Math.abs(dx) * 3; }
                    else if (d === 'left') { ok = dx < -1 && Math.abs(dy) < Math.max(r.height, b.height) / 2; score = -dx + Math.abs(dy) * 3; }
                    else { ok = dx > 1 && Math.abs(dy) < Math.max(r.height, b.height) / 2; score = dx + Math.abs(dy) * 3; }
                    if (ok && score < bestScore) { bestScore = score; best = el; }
                });
                target = best;
                if (!target) {
                    if (dir === 'left' || dir === 'right') this._navigate(dir === (this.rtl ? 'left' : 'right') ? 'next' : 'previous', this._step(dir === (this.rtl ? 'left' : 'right') ? 1 : -1));
                    return;
                }
            }
            const info = this._slotInfo(target);
            this._selectSlot(info, extend);
            sel.focus = extend ? { s: info.s, k: info.k, g: info.g } : null;
            this._scrollIntoView(target);
        }
        _scrollIntoView(el) {
            const sc = this._scroll, r = el.getBoundingClientRect(), b = sc.getBoundingClientRect();
            const head = sc.querySelector('.psch-thead');
            const top = b.top + (head && head.contains(el) === false ? head.offsetHeight : 0);
            if (r.top < top) sc.scrollTop -= top - r.top + 4;
            else if (r.bottom > b.bottom) sc.scrollTop += r.bottom - b.bottom + 4;
            if (r.left < b.left + 60) sc.scrollLeft -= b.left + 60 - r.left;
            else if (r.right > b.right) sc.scrollLeft += r.right - b.right + 4;
        }

        // ------------------------------------------------------------ açılır liste (+N daha, yıl görünümü)
        _openDayPopover(anchor, info) {
            this._closePopover();
            if (!info || this.options.moreEventsPopover === false) return;
            const s = new Date(info.s), e = new Date(info.e), leaf = this._leafByIndex(info.g);
            const list = this._occ.filter(x => this._matchLeaf(x.event, leaf) && (D.overlaps(x.start, x.end, s, e) || (+x.start === +x.end && x.start >= s && x.start < e)));
            const m = this.msg, c = this.culture;
            const pop = document.createElement('div');
            pop.className = 'psch-popover';
            pop.setAttribute('role', 'dialog');
            pop.setAttribute('aria-label', c.dateLong(s));
            pop.setAttribute('dir', this.rtl ? 'rtl' : 'ltr');
            const supportsPopover = typeof pop.showPopover === 'function';
            if (supportsPopover) pop.setAttribute('popover', 'auto');
            const items = list.length ? list.map(occ => {
                const color = this._eventColor(occ.event);
                return `<button type="button" class="psch-pop-item" data-uid="${esc(occ.uid)}" style="${this._colorStyle(color)}"><i></i><span class="psch-pop-time">${esc(this._isAllDayLike(occ) ? m.allDay : c.time(occ.start))}</span><span class="psch-pop-title">${esc(occ.event.title || m.untitled)}</span></button>`;
            }).join('') : `<div class="psch-pop-empty">${esc(m.noEvents)}</div>`;
            const goDay = this.options.views.some(v => v.type === 'day') ? `<button type="button" class="psch-link" data-pop-goto="${info.s}">${esc(m.goToDay)}</button>` : '';
            pop.innerHTML = `<div class="psch-pop-head"><div><div class="psch-pop-dnum">${s.getDate()}</div><div class="psch-pop-dname">${esc(c.dayNames[s.getDay()])}</div></div><button type="button" class="psch-dlg-x" data-pop-close aria-label="${esc(m.close)}">&times;</button></div><div class="psch-pop-list">${items}</div>${goDay ? `<div class="psch-pop-foot">${goDay}</div>` : ''}`;
            document.body.appendChild(pop);
            if (supportsPopover) pop.showPopover(); else pop.classList.add('psch-pop-open');
            const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
            let left = r.left + r.width / 2 - pw / 2, top = r.bottom + 6;
            if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
            left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
            pop.style.left = left + 'px'; pop.style.top = top + 'px';
            this._popover = pop;
            pop.addEventListener('toggle', ev => { if (ev.newState === 'closed') { pop.remove(); if (this._popover === pop) this._popover = null; } });
            pop.addEventListener('click', ev => {
                const item = ev.target.closest('.psch-pop-item');
                if (ev.target.closest('[data-pop-close]')) { this._closePopover(); return; }
                const go = ev.target.closest('[data-pop-goto]');
                if (go) { this._closePopover(); this._date = D.startOfDay(new Date(+go.dataset.popGoto)); this.view('day', 'changeView'); return; }
                if (item) { this._closePopover(); this._selectEvent(item.dataset.uid, false); if (this.editEvent) this.editEvent(item.dataset.uid); }
            });
            if (!supportsPopover) {
                setTimeout(() => {
                    this._popDismiss = ev => { if (!pop.contains(ev.target)) this._closePopover(); };
                    document.addEventListener('pointerdown', this._popDismiss);
                }, 0);
            }
            const first = pop.querySelector('.psch-pop-item, .psch-link');
            if (first) first.focus();
        }
        _closePopover() {
            const p = this._popover;
            if (!p) return;
            this._popover = null;
            if (this._popDismiss) { document.removeEventListener('pointerdown', this._popDismiss); this._popDismiss = null; }
            try { if (p.matches(':popover-open')) p.hidePopover(); } catch (e) { /* yoksay */ }
            p.remove();
        }

        // ------------------------------------------------------------ bildirim
        _toast(text, type) {
            if (!this._toasts) return;
            const t = document.createElement('div');
            t.className = 'psch-toast psch-toast-' + (type || 'info');
            t.textContent = text;
            this._toasts.appendChild(t);
            setTimeout(() => { t.classList.add('psch-toast-out'); setTimeout(() => t.remove(), 300); }, 3200);
        }

        // ------------------------------------------------------------ olay sistemi
        _mkHandler(fn) {
            if (!fn) return null;
            const f = resolveFn(fn);
            if (f) return f;
            if (typeof fn === 'string' && /^[A-Za-z_$][\w$.]*$/.test(fn)) return function (args) { const g = resolveFn(fn); return g ? g.call(this, args) : undefined; };
            return null;
        }
        bind(name, fn) {
            const f = this._mkHandler(fn);
            if (!name || !f) return this;
            (this._handlers[name] = this._handlers[name] || []).push(f);
            return this;
        }
        unbind(name, fn) {
            if (!name) { this._handlers = {}; return this; }
            if (!fn) delete this._handlers[name];
            else this._handlers[name] = (this._handlers[name] || []).filter(x => x !== fn);
            return this;
        }
        one(name, fn) {
            const f = resolveFn(fn);
            if (!f) return this;
            const wrap = args => { this.unbind(name, wrap); f.call(this, args); };
            return this.bind(name, wrap);
        }
        /** Olayı tetikler; işleyicilerden biri preventDefault() çağırırsa true döner. */
        _trigger(name, data) {
            const args = Object.assign({
                sender: this, type: name, _prevented: false,
                preventDefault() { this._prevented = true; },
                isDefaultPrevented() { return this._prevented; }
            }, data || {});
            (this._optHandlers[name] || []).concat(this._handlers[name] || []).forEach(fn => {
                try { fn.call(this, args); } catch (err) { console.error(`[Panoptes.Scheduler] "${name}" işleyici hatası`, err); }
            });
            const ce = new CustomEvent('panoptes:scheduler:' + name.toLowerCase(), { detail: args, bubbles: true, cancelable: true });
            if (!this.element.dispatchEvent(ce)) args._prevented = true;
            return args._prevented;
        }

        // ------------------------------------------------------------ genel API
        _navigate(action, date, view) {
            const args = { action, date: D.startOfDay(date || this._date), view: view || this._view };
            if (this._trigger('navigate', args)) return false;
            const oldStart = this._range ? +this._range.start : null;
            this._date = D.startOfDay(args.date);
            this._view = canonView(args.view) || this._view;
            this._selection.range = null; this._selection.anchor = null;
            this._closePopover();
            this._computeRange();
            if (this.dataSource && this.dataSource.serverFiltering && (+this._range.start !== oldStart || action === 'changeView')) this.read();
            else this.refresh();
            this._trigger('dateChange', { date: this._date, view: this._view, start: this._range.start, end: this._range.end });
            return true;
        }
        view(name, action) {
            if (name === undefined) return this._view;
            const v = canonView(name);
            if (!v) return this._view;
            if (!this.options.views.some(x => x.type === v)) { this.options.views.push({ type: v, title: null }); this._buildToolbar(); }
            this._navigate(action || 'changeView', this._date, v);
            return this._view;
        }
        changeView(name) { return this.view(name); }
        date(d) {
            if (d === undefined) return new Date(this._date.getTime());
            const parsed = D.parse(d);
            if (parsed) this._navigate('changeDate', parsed);
            return new Date(this._date.getTime());
        }
        viewRange() { return { start: new Date(this._range.start), end: new Date(this._range.end) }; }
        toggleWorkHours(on) {
            const next = on === undefined ? !this._showWorkHours : !!on;
            if (next === this._showWorkHours) return;
            if (this._trigger('navigate', { action: 'changeWorkDay', date: this._date, view: this._view, showWorkHours: next })) return;
            this._showWorkHours = next;
            this.refresh();
        }
        search(q) {
            this._query = String(q || '').trim().toLocaleLowerCase(this.culture.locale);
            const input = this._toolbar.querySelector('.psch-search input');
            if (input && document.activeElement !== input) input.value = q || '';
            this.refresh();
            this._trigger('search', { query: q || '', count: this._occ.length });
        }
        filter(fn) { this._filter = typeof fn === 'function' ? fn : null; this.refresh(); }
        filterResources(fn) { this._resFilter = typeof fn === 'function' ? fn : null; this.refresh(); }
        resources() { return this._resources.map(r => ({ name: r.name, field: r.field, title: r.title, multiple: r.multiple, items: r.items.map(i => ({ value: i.value, text: i.text, color: i.color })) })); }
        occurrences() { return this._occ.slice(); }
        occurrencesInRange(start, end, resources, excludeUid) {
            const s = D.parse(start), e = D.parse(end);
            return this._expandRange(s, e, true).filter(o => o.uid !== excludeUid && D.overlaps(o.start, o.end, s, e) && (!resources || Object.keys(resources).every(f => resources[f] == null || valueMatches(o.event[f], resources[f]))));
        }
        occurrenceByUid(uid) { return this._occByUid.get(uid) || null; }
        eventById(id) { return this.events.find(e => String(e.id) === String(id)) || null; }
        selected() { return Array.from(this._selection.events).map(u => this._occByUid.get(u)).filter(Boolean).map(o => o.event); }
        select(opts) {
            const sel = this._selection;
            sel.events.clear(); sel.range = null;
            if (opts && Array.isArray(opts.events)) {
                opts.events.forEach(id => this._occ.filter(o => o.uid === String(id) || String(o.event.id) === String(id)).forEach(o => sel.events.add(o.uid)));
            } else if (opts && opts.start && opts.end) {
                const s = +D.parse(opts.start), e = +D.parse(opts.end);
                sel.range = { s, e, k: opts.isAllDay ? (isTimeView(this._view) ? 'allday' : 'day') : (this._view === 'month' || this._view === 'year' || this._view === 'timelineMonth' ? 'day' : 'time'), g: -1 };
                sel.anchor = Object.assign({}, sel.range);
            }
            this._applySelection();
            this._fireChange();
        }
        slotByPosition(x, y) {
            const el = document.elementsFromPoint(x, y).find(n => n.classList && n.classList.contains('psch-slot') && this._body.contains(n));
            if (!el) return null;
            const i = this._slotInfo(el);
            return { start: new Date(i.s), end: new Date(i.e), isAllDay: i.k !== 'time', resources: this._leafValues(i.g), element: el };
        }
        setOptions(opts) {
            this._rawOptions = Object.assign({}, this._rawOptions, opts || {});
            const dsChanged = opts && ('dataSource' in opts || 'events' in opts || 'timezone' in opts);
            const serialized = dsChanged && opts.timezone !== undefined && !('dataSource' in opts) && !('events' in opts) ? this.data() : null;
            this._setOptions(this._rawOptions, false, opts || {});
            this._applyCssVars();
            this._buildToolbar();
            this.element.classList.toggle('psch-compact', this._compact);
            if (serialized) { this.events = serialized.map(r => this._normalize(r)); this.refresh(); }
            else if (dsChanged) this._initData();
            else this.refresh();
        }
        setDataSource(ds) { this._rawOptions.dataSource = ds; this.options.dataSource = ds; this._initData(); }
        destroy() {
            clearInterval(this._nowTimer);
            if (this._ro) this._ro.disconnect();
            if (this._unsubscribe) this._unsubscribe();
            this._closePopover();
            if (this._destroyEditing) this._destroyEditing();
            this.element.innerHTML = '';
            this.element.classList.remove('psch');
            delete this.element._panoptesScheduler;
            P.Scheduler.instances.delete(this.id);
        }
    }

    // ---------------------------------------------------------------------------------
    // Otomatik başlatma
    // ---------------------------------------------------------------------------------
    function initSchedulers(root) {
        (root || document).querySelectorAll('[data-panoptes-scheduler]').forEach(el => {
            if (!el._panoptesScheduler) {
                try { new PanoptesScheduler(el); } catch (err) { console.error('[Panoptes.Scheduler] Başlatılamadı', err); }
            }
        });
    }

    P.Scheduler = {
        Class: PanoptesScheduler,
        instances: new Map(),
        init: initSchedulers,
        create: (el, opts) => new PanoptesScheduler(el, opts),
        getInstance: id => {
            const el = typeof id === 'string' ? document.getElementById(id) : id;
            return el ? (el._panoptesScheduler || null) : null;
        },
        isTimeView, isTimeline, canonView
    };
    window.panoptesScheduler = P.Scheduler;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initSchedulers());
    else setTimeout(() => initSchedulers(), 0);

})(window, document);
