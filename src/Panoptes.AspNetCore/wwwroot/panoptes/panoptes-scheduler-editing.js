/**
 * Panoptes Scheduler — Düzenleme modülü
 * Sürükle-bırak ile taşıma, yeniden boyutlandırma, sürükleyerek aralık seçimi, etkinlik düzenleyici (yerel <dialog>),
 * yineleme düzenleyici, yinelenen etkinlik (tekrar / seri) iş akışları, silme onayı, özel düzenleyici şablonu,
 * veri kaynağına kaydetme (iyimser güncelleme + hata durumunda geri alma), PDF (yazdır) ve iCalendar içe/dışa aktarımı.
 * Bağımlılık: panoptes-scheduler-core.js ve panoptes-scheduler.js bu dosyadan önce yüklenmelidir.
 */
(function (window, document) {
    'use strict';

    const P = window.Panoptes || {};
    const Core = P.SchedulerCore, S = P.Scheduler;
    if (!Core || !S || !S.Class) { console.error('[Panoptes.Scheduler] Düzenleme modülü için önce çekirdek ve ana bileşen yüklenmelidir.'); return; }
    const { D, TZ, format, Recurrence, ICal, resolveFn } = Core;
    const { MS_MIN, MS_DAY } = D;
    const esc = D.escape;
    const proto = S.Class.prototype;
    const DRAG_THRESHOLD = 4;
    const EDGE = 36;
    let seq = 0;

    // ---------------------------------------------------------------------------------
    // Yardımcılar
    // ---------------------------------------------------------------------------------
    function cloneEvent(ev) {
        const c = Object.assign({}, ev);
        delete c._rule; delete c._ruleSrc;
        Object.keys(c).forEach(k => {
            if (c[k] instanceof Date) c[k] = new Date(c[k].getTime());
            else if (Array.isArray(c[k])) c[k] = c[k].map(x => (x instanceof Date ? new Date(x.getTime()) : x));
        });
        if (!Array.isArray(c.recurrenceException)) c.recurrenceException = [];
        return c;
    }
    function replaceContents(target, src) {
        Object.keys(target).forEach(k => { delete target[k]; });
        Object.assign(target, src);
    }
    function fixAllDay(ev) {
        delete ev._rule; delete ev._ruleSrc;
        if (ev.isAllDay) {
            ev.start = D.startOfDay(ev.start);
            ev.end = D.startOfDay(ev.end || ev.start);
            if (ev.end <= ev.start) ev.end = D.addDays(ev.start, 1);
        } else if (!ev.end || ev.end < ev.start) {
            ev.end = D.addMinutes(ev.start, 60);
        }
        return ev;
    }
    function tmpId() { return 'tmp_' + Math.random().toString(36).slice(2); }
    function sameVal(a, b) { return JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b); }
    function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }

    // ---------------------------------------------------------------------------------
    // Yaşam döngüsü
    // ---------------------------------------------------------------------------------
    proto._initEditing = function () {
        this._edDown = e => this._edPointerDown(e);
        this._body.addEventListener('pointerdown', this._edDown);
    };
    proto._destroyEditing = function () {
        if (this._edDown) this._body.removeEventListener('pointerdown', this._edDown);
        this._endDrag();
        if (this._openDialog) { try { this._openDialog.close(); } catch (e) { /* yoksay */ } }
    };

    // ---------------------------------------------------------------------------------
    // Sürükle-bırak: taşıma, boyutlandırma, aralık seçimi
    // ---------------------------------------------------------------------------------
    proto._slotAt = function (x, y) {
        const stack = document.elementsFromPoint(x, y);
        let inHead = false;
        for (const n of stack) {
            if (!n.classList || !this._body.contains(n)) continue;
            if (!inHead && n.closest('.psch-thead')) inHead = true;
            if (n.classList.contains('psch-slot') && !n.classList.contains('psch-yday')) {
                if (inHead && !n.closest('.psch-thead')) return null;
                return this._slotInfo(n);
            }
        }
        return null;
    };
    proto._edPointerDown = function (e) {
        if (e.button !== 0 || this._drag || !this._scroll) return;
        const t = e.target;
        if (t.closest('.psch-del, .psch-more, .psch-dbtn, .psch-mday, .psch-ytitle, .psch-yday')) return;
        const ed = this.options.editable;
        const evEl = t.closest('.psch-event');
        let d;
        if (evEl) {
            if (!evEl.dataset.uid || evEl.classList.contains('psch-ev-agenda')) return;
            const occ = this._occByUid.get(evEl.dataset.uid);
            if (!occ || occ.event.isReadonly) return;
            const rh = t.closest('.psch-rh');
            let mode = null, edge = null;
            if (rh && ed.resize) { mode = 'resize'; edge = rh.classList.contains('psch-rh-start') ? 'start' : 'end'; }
            else if (!rh && ed.move) mode = 'move';
            if (!mode) return;
            const origin = this._slotAt(e.clientX, e.clientY);
            if (!origin) return;
            d = { mode, edge, occ, origin };
            if (e.pointerType !== 'mouse') e.preventDefault();
        } else {
            const slot = t.closest('.psch-slot');
            if (!slot || !this.options.selectable || e.pointerType === 'touch') return;
            d = { mode: 'select', origin: this._slotInfo(slot) };
        }
        Object.assign(d, { x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastY: e.clientY, started: false, result: null });
        this._drag = d;
        this._dragHandlers = {
            move: ev => this._edPointerMove(ev),
            up: ev => this._edPointerUp(ev),
            cancel: () => this._endDrag(),
            key: ev => { if (ev.key === 'Escape' && this._drag) { ev.stopPropagation(); this._endDrag(); this._suppressClick = false; } }
        };
        document.addEventListener('pointermove', this._dragHandlers.move);
        document.addEventListener('pointerup', this._dragHandlers.up);
        document.addEventListener('pointercancel', this._dragHandlers.cancel);
        document.addEventListener('keydown', this._dragHandlers.key, true);
    };
    proto._edPointerMove = function (e) {
        const d = this._drag;
        if (!d) return;
        if (!d.started) {
            if (Math.abs(e.clientX - d.x0) < DRAG_THRESHOLD && Math.abs(e.clientY - d.y0) < DRAG_THRESHOLD) return;
            if (d.mode !== 'select') {
                const name = d.mode === 'move' ? 'moveStart' : 'resizeStart';
                if (this._trigger(name, { event: d.occ.event, occurrence: d.occ })) { this._endDrag(); return; }
            }
            d.started = true;
            this.element.classList.add('psch-is-dragging', 'psch-is-' + d.mode);
            this._closePopover();
            this._markDragging();
        }
        e.preventDefault();
        d.lastX = e.clientX; d.lastY = e.clientY;
        this._autoScroll(e.clientX, e.clientY);
        this._dragUpdate();
    };
    proto._markDragging = function () {
        const d = this._drag;
        if (!d || !d.occ || !this._scroll) return;
        this._scroll.querySelectorAll(`.psch-event[data-uid="${cssEsc(d.occ.uid)}"]`).forEach(el => el.classList.add('psch-dragging'));
    };
    proto._autoScroll = function (x, y) {
        const sc = this._scroll;
        if (!sc) return;
        const r = sc.getBoundingClientRect();
        const head = sc.querySelector('.psch-thead');
        const top = r.top + (head ? head.offsetHeight : 0);
        let dx = 0, dy = 0;
        if (y >= top && y < top + EDGE) dy = -Math.ceil((top + EDGE - y) / 3);
        else if (y > r.bottom - EDGE && y <= r.bottom + 40) dy = Math.ceil((y - (r.bottom - EDGE)) / 3);
        if (x < r.left + EDGE && x >= r.left - 40) dx = -Math.ceil((r.left + EDGE - x) / 3);
        else if (x > r.right - EDGE && x <= r.right + 40) dx = Math.ceil((x - (r.right - EDGE)) / 3);
        this._as = { dx, dy };
        if ((dx || dy) && !this._asRaf) {
            const step = () => {
                const a = this._as;
                if (!this._drag || !a || (!a.dx && !a.dy)) { this._asRaf = 0; return; }
                sc.scrollTop += a.dy; sc.scrollLeft += a.dx;
                this._dragUpdate();
                this._asRaf = requestAnimationFrame(step);
            };
            this._asRaf = requestAnimationFrame(step);
        }
    };
    proto._dragUpdate = function () {
        const d = this._drag;
        if (!d || !d.started) return;
        const info = this._slotAt(d.lastX, d.lastY);
        if (!info) return;
        if (d.mode === 'select') {
            if (info.k !== d.origin.k || info.g !== d.origin.g) return;
            const sel = this._selection;
            sel.events.clear();
            sel.anchor = { s: d.origin.s, e: d.origin.e, k: info.k, g: info.g };
            sel.range = { s: Math.min(d.origin.s, info.s), e: Math.max(d.origin.e, info.e), k: info.k, g: info.g };
            this._applySelection();
            return;
        }
        const res = d.mode === 'move' ? this._computeMove(d, info) : this._computeResize(d, info);
        if (!res) return;
        const args = {
            event: d.occ.event, occurrence: d.occ, start: res.start, end: res.end, isAllDay: res.isAllDay,
            resources: res.resources, slot: { start: new Date(info.s), end: new Date(info.e), isAllDay: info.k !== 'time', resources: this._leafValues(info.g) }
        };
        res.invalid = this._trigger(d.mode === 'move' ? 'move' : 'resize', args);
        res.info = info;
        d.result = res;
        this._markDragging();
        this._showHint(res, d.mode === 'move' ? info : d.origin);
        this._showDragTip(res, d.lastX, d.lastY);
    };
    proto._computeMove = function (d, info) {
        const occ = d.occ, o = d.origin;
        const dur = occ.end - occ.start;
        let start, end, isAllDay = occ.isAllDay;
        if (o.k === 'time' && info.k === 'time') {
            if (occ.isAllDay) {
                const diff = D.dayDiff(new Date(o.s), new Date(info.s));
                start = D.addDays(occ.start, diff); end = D.addDays(occ.end, diff);
            } else {
                start = new Date(+occ.start + (info.s - o.s)); end = new Date(+start + dur);
            }
        } else if (o.k === 'time' && info.k !== 'time') {
            if (o.k === 'time' && info.k === 'allday') { isAllDay = true; start = D.startOfDay(new Date(info.s)); end = D.addDays(start, 1); }
            else { const diff = D.dayDiff(new Date(o.s), new Date(info.s)); start = D.addDays(occ.start, diff); end = D.addDays(occ.end, diff); }
        } else if (o.k !== 'time' && info.k === 'time') {
            isAllDay = false;
            start = new Date(info.s);
            end = occ.isAllDay ? D.addMinutes(start, this.options.majorTick || 60) : new Date(info.s + dur);
        } else {
            const diff = D.dayDiff(new Date(o.s), new Date(info.s));
            start = D.addDays(occ.start, diff); end = D.addDays(occ.end, diff);
        }
        return { start, end, isAllDay, resources: this._resourceChanges(occ, o.g, info.g) };
    };
    proto._computeResize = function (d, info) {
        const occ = d.occ, o = d.origin;
        if (info.k !== o.k || info.g !== o.g) return null;
        let start = occ.start, end = occ.end;
        const minMs = info.k === 'time' ? this._slotMinutes() * MS_MIN : MS_DAY;
        if (info.k === 'time') {
            if (d.edge === 'end') end = new Date(Math.max(info.e, +start + minMs));
            else start = new Date(Math.min(info.s, +end - minMs));
        } else if (occ.isAllDay) {
            if (d.edge === 'end') end = new Date(Math.max(info.e, +D.addDays(start, 1)));
            else start = new Date(Math.min(info.s, +D.addDays(end, -1)));
        } else {
            if (d.edge === 'end') {
                const diff = D.dayDiff(new Date(+occ.end - 1), new Date(info.s));
                end = D.addDays(occ.end, diff);
                if (end <= start) end = new Date(+start + this._slotMinutes() * MS_MIN);
            } else {
                const diff = D.dayDiff(occ.start, new Date(info.s));
                start = D.addDays(occ.start, diff);
                if (start >= end) start = new Date(+end - this._slotMinutes() * MS_MIN);
            }
        }
        return { start, end, isAllDay: occ.isAllDay, resources: {} };
    };
    /** Kaynak grubu değiştiğinde etkinliğin kaynak alanlarını günceller (çoklu kaynaklarda yalnızca kaynak grubun değeri değiştirilir). */
    proto._resourceChanges = function (occ, fromG, toG) {
        const out = {};
        if (toG == null || toG < 0 || fromG === toG) return out;
        const from = this._leafByIndex(fromG), to = this._leafByIndex(toG);
        if (!to) return out;
        to.path.forEach(p => {
            const f = p.res.field, cur = occ.event[f];
            const fromVal = from ? from.values[f] : undefined;
            if (p.res.multiple || Array.isArray(cur)) {
                let arr = Array.isArray(cur) ? cur.slice() : (cur != null && cur !== '' ? [cur] : []);
                if (fromVal !== undefined && String(fromVal) === String(p.item.value)) return;
                arr = arr.filter(v => String(v) !== String(fromVal));
                if (!arr.some(v => String(v) === String(p.item.value))) arr.push(p.item.value);
                out[f] = arr;
            } else if (String(cur) !== String(p.item.value)) {
                out[f] = p.item.value;
            }
        });
        return out;
    };
    proto._showHint = function (res, info) {
        this._clearHint();
        if (!this._scroll) return;
        const cls = res.invalid ? 'psch-hint-invalid' : 'psch-hint';
        let k = info.k;
        if (this._drag && this._drag.mode === 'move' && res.isAllDay && info.k === 'time' && !this._drag.occ.isAllDay) k = 'allday';
        const s = +res.start, e = Math.max(+res.end, +res.start + 1);
        this._scroll.querySelectorAll(`.psch-slot[data-k="${k}"][data-g="${info.g}"]`).forEach(el => {
            if (+el.dataset.s < e && +el.dataset.e > s) el.classList.add(cls);
        });
    };
    proto._clearHint = function () {
        if (!this._scroll) return;
        this._scroll.querySelectorAll('.psch-hint, .psch-hint-invalid').forEach(el => el.classList.remove('psch-hint', 'psch-hint-invalid'));
    };
    proto._showDragTip = function (res, x, y) {
        let tip = this._dragTip;
        if (!tip) {
            tip = this._dragTip = document.createElement('div');
            tip.className = 'psch-dragtip';
            tip.setAttribute('aria-hidden', 'true');
            document.body.appendChild(tip);
        }
        tip.classList.toggle('psch-dragtip-invalid', !!res.invalid);
        tip.textContent = this._rangeText(res.start, res.end, res.isAllDay);
        const w = tip.offsetWidth;
        tip.style.left = Math.min(window.innerWidth - w - 8, x + 14) + 'px';
        tip.style.top = Math.max(8, y - 34) + 'px';
    };
    proto._rangeText = function (start, end, allDay) {
        const c = this.culture;
        if (allDay) {
            const last = D.addDays(end, -1);
            return D.sameDay(start, last) ? `${c.dateMed(start)} · ${this.msg.allDay}` : c.range(start, last);
        }
        if (D.sameDay(start, end) || +end === +D.addDays(D.startOfDay(start), 1)) return `${c.dateShort(start)} · ${c.timeRange(start, end)}`;
        return `${c.dateShort(start)} ${c.time(start)} – ${c.dateShort(end)} ${c.time(end)}`;
    };
    proto._endDrag = function () {
        const h = this._dragHandlers;
        if (h) {
            document.removeEventListener('pointermove', h.move);
            document.removeEventListener('pointerup', h.up);
            document.removeEventListener('pointercancel', h.cancel);
            document.removeEventListener('keydown', h.key, true);
            this._dragHandlers = null;
        }
        if (this._asRaf) { cancelAnimationFrame(this._asRaf); this._asRaf = 0; }
        this._as = null;
        this._clearHint();
        if (this._dragTip) { this._dragTip.remove(); this._dragTip = null; }
        if (this._scroll) this._scroll.querySelectorAll('.psch-dragging').forEach(el => el.classList.remove('psch-dragging'));
        this.element.classList.remove('psch-is-dragging', 'psch-is-move', 'psch-is-resize', 'psch-is-select');
        this._drag = null;
    };
    proto._edPointerUp = function () {
        const d = this._drag;
        if (!d) return;
        const started = d.started, res = d.result;
        this._endDrag();
        if (!started) return;
        this._suppressClick = true;
        setTimeout(() => { this._suppressClick = false; }, 0);
        if (d.mode === 'select') {
            this._announceRange(this._selection.range);
            this._fireChange();
            return;
        }
        if (!res || res.invalid) return;
        const occ = d.occ;
        const changed = +res.start !== +occ.start || +res.end !== +occ.end || !!res.isAllDay !== !!occ.isAllDay || Object.keys(res.resources).length > 0;
        if (!changed) return;
        const args = { event: occ.event, occurrence: occ, start: res.start, end: res.end, isAllDay: res.isAllDay, resources: res.resources, slot: { start: new Date(res.info.s), end: new Date(res.info.e), isAllDay: res.info.k !== 'time', resources: this._leafValues(res.info.g) } };
        if (this._trigger(d.mode === 'move' ? 'moveEnd' : 'resizeEnd', args)) return;
        this._applyChange(occ, Object.assign({ start: args.start, end: args.end, isAllDay: !!args.isAllDay }, args.resources));
    };

    // ---------------------------------------------------------------------------------
    // Değişiklik uygulama & kalıcılık (iyimser güncelleme, hata durumunda geri alma)
    // ---------------------------------------------------------------------------------
    /** Bir tekrara (veya tekil etkinliğe) zaman/kaynak değişikliği uygular; yinelenen etkinliklerde tekrar/seri sorusu sorulur. */
    proto._applyChange = async function (occ, changes) {
        const ev = occ.event;
        if (!occ.isRecurring) return this._persistUpdate(ev, changes);
        const which = await this._askRecurring('edit');
        if (!which) return false;
        if (which === 'occurrence') {
            const draft = Object.assign(this._exceptionDraft(occ), changes);
            return this._createException(occ, draft);
        }
        const next = {};
        Object.keys(changes).forEach(k => { if (k !== 'start' && k !== 'end') next[k] = changes[k]; });
        const delta = changes.start - occ.start;
        const isAllDay = changes.isAllDay != null ? changes.isAllDay : ev.isAllDay;
        const dur = changes.end - changes.start;
        if (isAllDay && !ev.isAllDay) {
            next.start = D.startOfDay(new Date(+ev.start + delta)); next.end = D.addDays(next.start, 1);
        } else if (isAllDay) {
            const days = D.dayDiff(occ.start, changes.start);
            next.start = D.addDays(ev.start, days); next.end = D.addDays(next.start, Math.max(1, Math.round(dur / MS_DAY)));
        } else {
            next.start = new Date(+ev.start + delta); next.end = new Date(+next.start + dur);
        }
        const shift = +next.start - +ev.start;
        if (shift) next.recurrenceException = (ev.recurrenceException || []).map(x => new Date(+x + shift));
        return this._persistUpdate(ev, next);
    };
    proto._exceptionDraft = function (occ) {
        const master = occ.event;
        const ex = cloneEvent(master);
        ex.id = tmpId();
        ex.recurrenceId = master.id;
        ex.recurrenceRule = '';
        ex.recurrenceException = [];
        ex.start = new Date(occ.start.getTime());
        ex.end = new Date(occ.end.getTime());
        return ex;
    };
    /** Seriden tek bir tekrarı ayırır: ana kayda istisna tarihi eklenir, değiştirilmiş tekrar yeni kayıt olarak oluşturulur. */
    proto._createException = async function (occ, draft) {
        const master = occ.event;
        fixAllDay(draft);
        draft.recurrenceId = master.id;
        draft.recurrenceRule = '';
        const exdates = (master.recurrenceException || []).concat([new Date(occ.start.getTime())]);
        const okMaster = await this._persistUpdate(master, { recurrenceException: exdates }, true);
        if (!okMaster) return false;
        return this._persistCreate(draft);
    };
    proto._mergeServer = function (ev, res) {
        if (!res || typeof res !== 'object') return;
        const n = this._normalize(res);
        if (!n) return;
        if (String(n.id).indexOf('tmp_') === 0 && ev.id != null && String(ev.id).indexOf('tmp_') !== 0) n.id = ev.id;
        replaceContents(ev, n);
    };
    proto._persistUpdate = async function (ev, changes, silent) {
        const backup = cloneEvent(ev);
        Object.assign(ev, changes);
        fixAllDay(ev);
        this.refresh();
        try {
            const res = await this.dataSource.send('update', this._serialize(ev));
            this._mergeServer(ev, res);
            if (!silent) this.refresh();
            return true;
        } catch (err) {
            replaceContents(ev, backup);
            this.refresh();
            this._saveError(err, 'update', ev);
            return false;
        }
    };
    proto._persistCreate = async function (ev, noRefresh) {
        fixAllDay(ev);
        if (!this.events.includes(ev)) this.events.push(ev);
        if (!noRefresh) this.refresh();
        try {
            const res = await this.dataSource.send('create', this._serialize(ev));
            this._mergeServer(ev, res);
            if (!noRefresh) this.refresh();
            return true;
        } catch (err) {
            this.events = this.events.filter(x => x !== ev);
            this.refresh();
            this._saveError(err, 'create', ev);
            return false;
        }
    };
    proto._persistDestroy = async function (list) {
        const items = Array.isArray(list) ? list : [list];
        this.events = this.events.filter(x => !items.includes(x));
        this.refresh();
        let ok = true;
        for (const ev of items) {
            try { await this.dataSource.send('destroy', this._serialize(ev)); }
            catch (err) { ok = false; this.events.push(ev); this._saveError(err, 'destroy', ev); }
        }
        if (!ok) this.refresh();
        return ok;
    };
    proto._saveError = function (err, operation, ev) {
        console.error('[Panoptes.Scheduler] Kaydetme hatası', err);
        this._trigger('error', { error: err, operation, event: ev });
        this._toast(this.msg.errors.save, 'error');
    };

    // ---------------------------------------------------------------------------------
    // Diyaloglar (yerel <dialog>)
    // ---------------------------------------------------------------------------------
    /**
     * opts: { title, body (HTML|Node), buttons:[{text,value,primary,danger,close,start,noValidate}], className, width, onOpen(form,dlg), onSubmit(value,form,dlg) }
     * Seçilen düğmenin değeriyle (kapatıldıysa null) çözülen Promise döner.
     */
    proto._dialog = function (opts) {
        return new Promise(resolve => {
            const m = this.msg;
            const dlg = document.createElement('dialog');
            const tid = `${this.id}_dlg${++seq}`;
            dlg.className = 'psch-dialog ' + (opts.className || '');
            dlg.setAttribute('closedby', 'any');
            dlg.setAttribute('aria-labelledby', tid);
            dlg.setAttribute('dir', this.rtl ? 'rtl' : 'ltr');
            dlg.setAttribute('lang', this.culture.locale);
            if (opts.width) dlg.style.width = `min(94vw, ${typeof opts.width === 'number' || /^\d+$/.test(opts.width) ? opts.width + 'px' : opts.width})`;
            const buttons = (opts.buttons || []).map(b => (b.close
                ? `<button type="button" class="psch-btn" data-close>${esc(b.text)}</button>`
                : `<button type="submit" class="psch-btn${b.primary ? ' psch-btn-primary' : ''}${b.danger ? ' psch-btn-danger' : ''}${b.start ? ' psch-dlg-start' : ''}" value="${esc(b.value)}"${b.noValidate ? ' formnovalidate' : ''}>${esc(b.text)}</button>`)).join('');
            dlg.innerHTML = `<form method="dialog" class="psch-dlg-form" novalidate><header class="psch-dlg-head"><h2 id="${tid}">${esc(opts.title || '')}</h2><button type="button" class="psch-dlg-x" data-close aria-label="${esc(m.close)}">&times;</button></header><div class="psch-dlg-body"></div>${buttons ? `<footer class="psch-dlg-foot">${buttons}</footer>` : ''}</form>`;
            const form = dlg.querySelector('form');
            const body = dlg.querySelector('.psch-dlg-body');
            if (opts.body instanceof Node) body.appendChild(opts.body); else body.innerHTML = opts.body || '';
            document.body.appendChild(dlg);
            let result = null;
            const finish = () => { if (this._openDialog === dlg) this._openDialog = null; dlg.remove(); resolve(result); };
            if (opts.onOpen && opts.onOpen(form, dlg) === false) { result = '__prevented'; finish(); return; }
            form.addEventListener('submit', e => {
                e.preventDefault();
                const value = e.submitter ? e.submitter.value : 'ok';
                if (opts.onSubmit && opts.onSubmit(value, form, dlg) === false) return;
                result = value;
                dlg.close();
            });
            dlg.addEventListener('click', e => {
                if (e.target.closest('[data-close]')) { dlg.close(); return; }
                if (e.target === dlg) {
                    const r = dlg.getBoundingClientRect();
                    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
                }
            });
            dlg.addEventListener('close', finish, { once: true });
            this._openDialog = dlg;
            dlg.showModal();
            const focus = dlg.querySelector('[autofocus]') || dlg.querySelector('.psch-btn-primary') || dlg.querySelector('button');
            if (focus) focus.focus();
        });
    };
    proto._askRecurring = function (kind) {
        const mode = this.options.editable.editRecurringMode;
        if (mode === 'occurrence' || mode === 'series') return Promise.resolve(mode);
        const r = this.msg.recurring;
        return this._dialog({
            title: r.title, className: 'psch-confirm',
            body: `<p class="psch-dlg-text">${esc(kind === 'delete' ? r.deleteText : r.editText)}</p>`,
            buttons: [{ text: r.occurrence, value: 'occurrence', primary: true }, { text: r.series, value: 'series' }]
        }).then(v => (v === 'occurrence' || v === 'series' ? v : null));
    };
    proto._confirmDelete = function (ev) {
        const conf = this.options.editable.confirmation;
        if (conf === false) return Promise.resolve(true);
        const m = this.msg;
        const text = typeof conf === 'string' ? conf : m.deleteConfirm;
        return this._dialog({
            title: m.deleteTitle, className: 'psch-confirm',
            body: `<p class="psch-dlg-text">${esc(text)}</p>${ev ? `<p class="psch-dlg-sub">${esc(ev.title || m.untitled)}</p>` : ''}`,
            buttons: [{ text: m.editor.cancel, close: true }, { text: m.editor.destroy, value: 'yes', danger: true }]
        }).then(v => v === 'yes');
    };

    // ---------------------------------------------------------------------------------
    // Genel düzenleme API'si
    // ---------------------------------------------------------------------------------
    proto._findOcc = function (ref) {
        if (ref && typeof ref === 'object') ref = ref.uid || ref.id;
        let occ = this._occByUid.get(String(ref));
        if (!occ) {
            const ev = this.eventById(ref);
            if (!ev) return null;
            occ = { uid: String(ev.id), event: ev, start: ev.start, end: ev.end, isRecurring: false, isException: ev.recurrenceId != null, isAllDay: !!ev.isAllDay, isMaster: !!this._ruleOf(ev) };
        }
        return occ;
    };
    /** Yeni etkinlik düzenleyicisini açar. data: { start, end, isAllDay, title, ...kaynak alanları } */
    proto.addEvent = function (data) {
        const ed = this.options.editable;
        if (!ed.create) return;
        const d = Object.assign({}, data || {});
        const isAllDay = !!d.isAllDay;
        let start = D.parse(d.start);
        if (!start) {
            const r = this._selection.range;
            start = r ? new Date(r.s) : D.atMinutes(this._date, D.parseTime(this.options.workDayStart, 480));
        }
        let end = D.parse(d.end);
        if (isAllDay) {
            start = D.startOfDay(start);
            end = end ? D.startOfDay(end) : D.addDays(start, 1);
            if (end <= start) end = D.addDays(start, 1);
        } else if (!end || end <= start) {
            end = D.addMinutes(start, this.options.majorTick || 60);
        }
        const ev = Object.assign({ title: '', description: '' }, d, {
            id: tmpId(), start, end, isAllDay, recurrenceRule: d.recurrenceRule || '', recurrenceException: [], recurrenceId: null, isReadonly: false
        });
        if (this._trigger('add', { event: ev })) return;
        return this._openEditor(ev, { isNew: true, mode: 'event' });
    };
    /** Etkinlik düzenleyicisini açar (tekrar uid'si veya etkinlik kimliği). */
    proto.editEvent = async function (ref) {
        const occ = this._findOcc(ref);
        if (!occ) return;
        const ev = occ.event, ed = this.options.editable;
        if (ev.isReadonly || !ed.update) return this._openEditor(cloneEvent(ev), { readonly: true, occ, original: ev, mode: 'event', viewStart: occ.start, viewEnd: occ.end });
        if (occ.isRecurring) {
            const which = await this._askRecurring('edit');
            if (!which) return;
            if (which === 'occurrence') return this._openEditor(this._exceptionDraft(occ), { occ, original: ev, mode: 'occurrence' });
            return this._openEditor(cloneEvent(ev), { occ, original: ev, mode: 'series' });
        }
        return this._openEditor(cloneEvent(ev), { occ, original: ev, mode: this._ruleOf(ev) ? 'series' : 'event' });
    };
    /** Etkinliği siler (onay ve yinelenen etkinlik sorusu ile). */
    proto.removeEvent = async function (ref) {
        const occ = this._findOcc(ref);
        if (!occ) return false;
        const ed = this.options.editable;
        if (occ.event.isReadonly || !ed.destroy) return false;
        let which = null;
        if (occ.isRecurring) {
            which = await this._askRecurring('delete');
            if (!which) return false;
        }
        return this._removeResolved(occ, which, !occ.isRecurring);
    };
    proto._removeResolved = async function (occ, which, confirmFirst) {
        const ev = occ.event;
        if (confirmFirst && !(await this._confirmDelete(ev))) return false;
        if (this._trigger('remove', { event: ev, occurrence: occ, mode: which || 'event' })) return false;
        if (which === 'occurrence') {
            return this._persistUpdate(ev, { recurrenceException: (ev.recurrenceException || []).concat([new Date(occ.start.getTime())]) });
        }
        const related = this._ruleOf(ev) ? this.events.filter(x => x !== ev && x.recurrenceId != null && String(x.recurrenceId) === String(ev.id)) : [];
        this.clearSelection();
        return this._persistDestroy([ev].concat(related));
    };
    /** Düzenleyici açmadan yeni etkinlik oluşturur ve kaydeder. */
    proto.createEvent = function (data) {
        const raw = Object.assign({}, data || {});
        const ev = this._normalize(Object.assign({}, raw, { id: raw.id != null ? raw.id : null }));
        if (!ev) return Promise.resolve(null);
        if (raw.id == null) ev.id = tmpId();
        return this._persistCreate(ev).then(ok => (ok ? ev : null));
    };
    /** Var olan bir etkinliği günceller. changes içindeki tarih alanları Date veya ISO metin olabilir. */
    proto.updateEvent = function (id, changes) {
        const ev = this.eventById(id);
        if (!ev) return Promise.resolve(false);
        const c = Object.assign({}, changes || {});
        ['start', 'end'].forEach(k => { if (k in c) c[k] = D.parse(c[k]); });
        if ('recurrenceException' in c) c.recurrenceException = this._parseExceptions(c.recurrenceException);
        return this._persistUpdate(ev, c);
    };
    /** Onay sormadan etkinliği (ve seriye ait istisnaları) siler. */
    proto.deleteEvent = function (id) {
        const ev = this.eventById(id);
        if (!ev) return Promise.resolve(false);
        const related = this.events.filter(x => x !== ev && x.recurrenceId != null && String(x.recurrenceId) === String(ev.id));
        return this._persistDestroy([ev].concat(related));
    };
    proto.cancelEvent = function () { if (this._openDialog) this._openDialog.close(); };
    proto.saveEvent = function () {
        const dlg = this._openDialog;
        const btn = dlg && dlg.querySelector('button[value="save"]');
        if (btn) btn.click();
    };

    // ---------------------------------------------------------------------------------
    // Etkinlik düzenleyici
    // ---------------------------------------------------------------------------------
    proto._openEditor = function (draft, ctx) {
        const ed = this.options.editable, m = this.msg, me = m.editor;
        const pfx = `${this.id}_ed${++seq}_`;
        const readonly = !!ctx.readonly;
        const showRec = !readonly && draft.recurrenceId == null && ctx.mode !== 'occurrence';
        const tz = ed.timezone && !draft.isAllDay && draft.startTimezone && TZ.isValid(draft.startTimezone) ? draft.startTimezone : null;
        const disp = d => (tz ? TZ.toWall(this._wallToAbs(d), tz) : d);
        const tpl = !readonly && ed.template ? ed.template : null;
        let body;
        if (readonly) body = this._readonlyHTML(draft, ctx);
        else if (tpl) body = `<div class="psch-tpl-editor">${this._templateSource(tpl, draft)}</div><div class="psch-dlg-error" role="alert" hidden></div>`;
        else body = this._defaultEditorHTML(draft, showRec, pfx, disp);
        const win = ed.window || {};
        const title = win.title || (readonly ? me.viewEvent : ctx.isNew ? me.newEvent : me.editEvent);
        const buttons = readonly ? [{ text: m.close, close: true }] : [
            ...(!ctx.isNew && ed.destroy ? [{ text: me.destroy, value: 'destroy', danger: true, start: true, noValidate: true }] : []),
            { text: me.cancel, close: true }, { text: me.save, value: 'save', primary: true }
        ];
        return this._dialog({
            title, body, buttons, className: 'psch-editor' + (readonly ? ' psch-editor-ro' : ''), width: win.width,
            onOpen: form => {
                if (tpl) this._bindTemplate(form, draft, showRec, pfx, disp);
                if (!readonly) this._wireEditor(form, draft);
                if (window.Panoptes && window.Panoptes.initAll) {
                    window.Panoptes.initAll(form);
                }
                return !this._trigger('edit', { event: ctx.original || draft, draft, occurrence: ctx.occ || null, mode: ctx.mode, isNew: !!ctx.isNew, readonly, container: form });
            },
            onSubmit: (value, form) => {
                if (value !== 'save') return true;
                const vals = this._readEditor(form, draft);
                if (!vals) return false;
                const next = Object.assign(cloneEvent(draft), vals);
                fixAllDay(next);
                if (this._trigger('save', { event: next, original: ctx.original || null, occurrence: ctx.occ || null, isNew: !!ctx.isNew, mode: ctx.mode, container: form })) return false;
                ctx.result = next;
                return true;
            }
        }).then(value => {
            if (value === '__prevented') return null;
            if (value === 'save' && ctx.result) return this._commitEditor(ctx);
            if (value === 'destroy' && ctx.occ) return this._removeResolved(ctx.occ, ctx.mode === 'occurrence' ? 'occurrence' : (ctx.occ.isRecurring && ctx.mode === 'series' ? 'series' : null), true);
            if (!readonly) this._trigger('cancel', { event: ctx.original || draft, isNew: !!ctx.isNew });
            return null;
        });
    };
    proto._commitEditor = function (ctx) {
        const next = ctx.result;
        if (ctx.isNew) return this._persistCreate(next);
        if (ctx.mode === 'occurrence') return this._createException(ctx.occ, next);
        const target = ctx.original;
        if (ctx.mode === 'series' && next.recurrenceRule === target.recurrenceRule) {
            const delta = +next.start - +target.start;
            if (delta) next.recurrenceException = (target.recurrenceException || []).map(d => new Date(+d + delta));
        }
        return this._persistUpdate(target, next);
    };
    proto._templateSource = function (tpl, draft) {
        if (typeof tpl === 'function') return tpl(draft, this) || '';
        const fn = resolveFn(tpl);
        if (fn) return fn(draft, this) || '';
        const src = String(tpl);
        if (src.charAt(0) === '#') {
            const el = document.getElementById(src.slice(1));
            if (!el) { console.warn('[Panoptes.Scheduler] Düzenleyici şablonu bulunamadı:', src); return ''; }
            return el.innerHTML;
        }
        return src;
    };
    function field(label, control, id, cls) {
        return `<div class="psch-field${cls ? ' ' + cls : ''}">${id ? `<label class="psch-label" for="${id}">${esc(label)}</label>` : `<span class="psch-label">${esc(label)}</span>`}<div class="psch-control">${control}</div></div>`;
    }
    proto._defaultEditorHTML = function (draft, showRec, pfx, disp) {
        const ed = this.options.editable, me = this.msg.editor;
        const allDay = !!draft.isAllDay;
        const s = allDay ? draft.start : disp(draft.start);
        const e = allDay ? D.addDays(draft.end, -1) : disp(draft.end);
        
        const ptText = (id, name, val) => `<div id="${id}-wrap" class="panoptes-textbox-wrapper relative inline-block w-full"><div class="panoptes-input-group relative flex items-center"><input type="text" id="${id}-wrap-input" name="${name}" value="${esc(val)}" class="panoptes-input w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm" /><button type="button" class="panoptes-textbox-clear absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition" style="${val?'':'display:none;'}" data-action="clear-text"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div><script type="application/json" data-panoptes-textbox-config="${id}-wrap">{"id":"${id}-wrap","name":"${name}","value":${JSON.stringify(val)}}</script></div>`;
        const ptDate = (id, name, val, isAll) => {
            const cls = isAll ? 'panoptes-datepicker' : 'panoptes-datetimepicker';
            const action = isAll ? 'toggle-calendar' : 'toggle-datetime';
            return `<div id="${id}-wrap" class="${cls}-wrapper relative inline-block w-full"><div class="panoptes-input-group relative flex items-center"><input type="text" id="${id}-wrap-input" name="${name}" value="${esc(val)}" class="panoptes-input w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm" /><button type="button" class="${cls}-toggle absolute right-2.5 text-slate-400 hover:text-blue-600 focus:outline-none transition" data-action="${action}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button></div><script type="application/json" data-panoptes-${isAll ? 'datepicker' : 'datetimepicker'}-config="${id}-wrap">{"id":"${id}-wrap","name":"${name}","value":${JSON.stringify(val)}}</script></div>`;
        };
        const ptCheck = (id, name, label, chk) => `<label id="${id}-wrap" class="panoptes-checkbox-wrapper inline-flex items-center gap-2.5 select-none cursor-pointer"><input type="checkbox" id="${id}-wrap-input" name="${name}" class="sr-only peer" ${chk?'checked':''} /><div class="w-4 h-4 rounded border border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 flex items-center justify-center transition shadow-xs"><svg class="w-3 h-3 text-white hidden peer-checked:block pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg></div><span class="text-sm text-slate-700 font-medium">${esc(label)}</span></label>`;
        const ptArea = (id, name, val) => `<div id="${id}-wrap" class="panoptes-textarea-wrapper relative w-full"><textarea id="${id}-wrap-input" name="${name}" rows="3" class="panoptes-input w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm resize-y">${esc(val)}</textarea><script type="application/json" data-panoptes-textarea-config="${id}-wrap">{"id":"${id}-wrap","name":"${name}"}</script></div>`;

        let h = field(me.title, ptText(pfx + 'title', 'title', draft.title || ''), pfx + 'title-wrap-input');
        
        let type = allDay ? 'date' : 'datetime-local';
        let sVal = D.toInput(s, allDay);
        let eVal = D.toInput(e, allDay);
        if (allDay) {
            // For datepicker format YYYY-MM-DD
            sVal = sVal.split('T')[0];
            eVal = eVal.split('T')[0];
        } else {
            // For datetime format DD.MM.YYYY HH:mm instead of standard ISO?
            // Wait, Panoptes datepicker uses DD.MM.YYYY HH:mm! Let's format it properly for the component.
            sVal = ('0'+s.getDate()).slice(-2) + '.' + ('0'+(s.getMonth()+1)).slice(-2) + '.' + s.getFullYear() + ' ' + ('0'+s.getHours()).slice(-2) + ':' + ('0'+s.getMinutes()).slice(-2);
            eVal = ('0'+e.getDate()).slice(-2) + '.' + ('0'+(e.getMonth()+1)).slice(-2) + '.' + e.getFullYear() + ' ' + ('0'+e.getHours()).slice(-2) + ':' + ('0'+e.getMinutes()).slice(-2);
        }

        h += `<div class="psch-grid2">${field(me.start, ptDate(pfx + 'start', 'start', sVal, allDay), pfx + 'start-wrap-input')}${field(me.end, ptDate(pfx + 'end', 'end', eVal, allDay), pfx + 'end-wrap-input')}</div>`;
        h += `<div class="psch-field psch-field-check">${ptCheck(pfx + 'allday', 'isAllDay', me.allDay, allDay)}</div>`;
        if (ed.timezone) {
            const cur = draft.startTimezone || '';
            const zones = TZ.list();
            const tzOpts = JSON.stringify([{text: me.timezoneDefault + (this.options.timezone ? ` (${this.options.timezone})` : ''), value: ''}].concat(zones.map(z => ({text: z.replace(/_/g, ' ') + ` (${TZ.offsetLabel(z, draft.start)})`, value: z}))));
            h += field(me.timezone, `<div id="${pfx}tz-wrap" class="panoptes-select-wrapper relative inline-block w-full"><input type="hidden" id="${pfx}tz-wrap-value" name="startTimezone" value="${esc(cur)}" /><div class="panoptes-select-control relative flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-300 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"><span class="panoptes-select-display truncate font-normal text-slate-700">${cur ? esc(cur.replace(/_/g, ' ')) : esc(me.timezoneDefault)}</span><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></div><script type="application/json" data-panoptes-select-config="${pfx}tz-wrap">{"id":"${pfx}tz-wrap","name":"startTimezone","value":"${esc(cur)}","options":${tzOpts}}</script></div>`, null);
        }
        if (showRec) h += this._recurrenceEditorHTML(draft, pfx);
        h += field(me.description, ptArea(pfx + 'desc', 'description', draft.description || ''), null);
        h += this._resourceFieldsHTML(draft, pfx);
        h += '<div class="psch-dlg-error" role="alert" hidden></div>';
        return h;
    };
    proto._resourceFieldsHTML = function (draft, pfx) {
        return this._resources.map((r, ri) => {
            const v = draft[r.field];
            const vals = (Array.isArray(v) ? v : (v != null && v !== '' ? [v] : [])).map(String);
            if (r.multiple) {
                const boxes = r.items.map((it, i) => `<label class="psch-chip-check"><input type="checkbox" name="res:${esc(r.field)}" value="${i}"${vals.includes(String(it.value)) ? ' checked' : ''}><span>${it.color ? `<i style="background:${it.color}"></i>` : ''}${esc(it.text)}</span></label>`).join('');
                return field(r.title, `<div class="psch-chip-list" role="group" aria-label="${esc(r.title)}">${boxes}</div>`, null);
            }
            const opts = r.items.map((it, i) => `<option value="${i}"${vals[0] === String(it.value) ? ' selected' : ''}>${esc(it.text)}</option>`).join('');
            return field(r.title, `<select id="${pfx}res${ri}" name="res:${esc(r.field)}" class="psch-input"><option value="">—</option>${opts}</select>`, pfx + 'res' + ri);
        }).join('');
    };
    proto._recurrenceEditorHTML = function (draft, pfx) {
        const m = this.msg.recurrence, c = this.culture;
        const start = draft.start;
        const rule = draft.recurrenceRule ? Recurrence.parse(draft.recurrenceRule) : null;
        const freq = rule ? rule.freq : '';
        const interval = rule ? rule.interval : 1;
        const order = [0, 1, 2, 3, 4, 5, 6].map(i => (i + this.firstDay) % 7);
        const plainDays = rule && rule.byDay.some(x => !x.n) ? rule.byDay.filter(x => !x.n).map(x => x.day) : [start.getDay()];
        let ord = null, ordDay = start.getDay();
        if (rule) {
            const nth = rule.byDay.find(x => x.n);
            if (nth) { ord = nth.n; ordDay = nth.day; }
            else if (rule.bySetPos.length && rule.byDay.length) { ord = rule.bySetPos[0]; ordDay = rule.byDay[0].day; }
        }
        const defOrd = Math.ceil(start.getDate() / 7) > 4 ? -1 : Math.ceil(start.getDate() / 7);
        const mmode = ord != null && (freq === 'MONTHLY' || freq === 'YEARLY') ? 'ordinal' : 'day';
        const mday = rule && rule.byMonthDay.length ? rule.byMonthDay[0] : start.getDate();
        const month = rule && rule.byMonth.length ? rule.byMonth[0] : start.getMonth() + 1;
        const endMode = rule ? (rule.count ? 'count' : (rule.until ? 'until' : 'never')) : 'never';
        const ordOpts = ['1', '2', '3', '4', '-1'].map(k => `<option value="${k}"${String(ord != null ? ord : defOrd) === k ? ' selected' : ''}>${esc(m.ordinals[k])}</option>`).join('');
        const dayOpts = [0, 1, 2, 3, 4, 5, 6].map(i => order[i]).map(d => `<option value="${d}"${d === ordDay ? ' selected' : ''}>${esc(c.dayNames[d])}</option>`).join('');
        const monthOpts = c.monthNames.map((n, i) => `<option value="${i + 1}"${i + 1 === month ? ' selected' : ''}>${esc(n)}</option>`).join('');
        const freqOpts = [['', m.never], ['DAILY', m.daily], ['WEEKLY', m.weekly], ['MONTHLY', m.monthly], ['YEARLY', m.yearly]]
            .map(([v, t]) => `<option value="${v}"${v === freq ? ' selected' : ''}>${esc(t)}</option>`).join('');
        const untilVal = rule && rule.until ? D.toDateKey(rule.until) : D.toDateKey(D.addMonths(start, 3));
        const name = pfx + 'rec';
        return `<fieldset class="psch-rec" data-freq="${freq}">
<legend class="psch-sr">${esc(m.repeat)}</legend>
${field(m.repeat, `<select id="${name}freq" name="rec:freq" class="psch-input">${freqOpts}</select>`, name + 'freq')}
<div class="psch-rec-opts">
${field(m.every, `<div class="psch-inline"><input id="${name}int" name="rec:interval" type="number" min="1" max="999" class="psch-input psch-input-num" value="${interval}"><span class="psch-rec-unit">${esc((m.units && m.units[freq]) || '')}</span></div>`, name + 'int', 'psch-rec-interval')}
${field(m.onDays, `<div class="psch-daytoggles" role="group" aria-label="${esc(m.onDays)}">${order.map(d => `<label class="psch-daytoggle"><input type="checkbox" name="rec:byday" value="${d}"${plainDays.includes(d) ? ' checked' : ''}><span title="${esc(c.dayNames[d])}">${esc(c.dayShort[d])}</span></label>`).join('')}</div>`, null, 'psch-rec-weekly')}
${field(m.month, `<select id="${name}month" name="rec:month" class="psch-input">${monthOpts}</select>`, name + 'month', 'psch-rec-yearly')}
<div class="psch-field psch-rec-monthly"><span class="psch-label">${esc(m.dayOfMonth)}</span><div class="psch-control psch-stack">
<label class="psch-radio-line"><input type="radio" name="rec:mmode" value="day"${mmode === 'day' ? ' checked' : ''}><span>${esc(m.dayOfMonth)}</span><input name="rec:mday" type="number" min="1" max="31" class="psch-input psch-input-num" value="${mday}" aria-label="${esc(m.dayOfMonth)}"></label>
<label class="psch-radio-line"><input type="radio" name="rec:mmode" value="ordinal"${mmode === 'ordinal' ? ' checked' : ''}><span>${esc(m.onThe)}</span><select name="rec:ord" class="psch-input" aria-label="${esc(m.onThe)}">${ordOpts}</select><select name="rec:oday" class="psch-input" aria-label="${esc(m.onDays)}">${dayOpts}</select></label>
</div></div>
<div class="psch-field psch-rec-end"><span class="psch-label">${esc(m.end)}</span><div class="psch-control psch-stack">
<label class="psch-radio-line"><input type="radio" name="rec:end" value="never"${endMode === 'never' ? ' checked' : ''}><span>${esc(m.endNever)}</span></label>
<label class="psch-radio-line"><input type="radio" name="rec:end" value="count"${endMode === 'count' ? ' checked' : ''}><span>${esc(m.endAfter)}</span><input name="rec:count" type="number" min="1" max="999" class="psch-input psch-input-num" value="${rule && rule.count ? rule.count : 10}" aria-label="${esc(m.occurrences)}"><span>${esc(m.occurrences)}</span></label>
<label class="psch-radio-line"><input type="radio" name="rec:end" value="until"${endMode === 'until' ? ' checked' : ''}><span>${esc(m.endOn)}</span><input name="rec:until" type="date" class="psch-input" value="${untilVal}" aria-label="${esc(m.endOn)}"></label>
</div></div>
</div>
</fieldset>`;
    };
    proto._readonlyHTML = function (ev, ctx) {
        const m = this.msg, c = this.culture;
        const s = ctx.viewStart || ev.start, e = ctx.viewEnd || ev.end;
        const res = this._resourceTexts(ev);
        const rows = [[m.date, this._rangeText(s, e, ev.isAllDay)]];
        const rule = this._ruleOf(ctx.original || ev);
        if (rule) rows.push([this.msg.recurrence.repeat, Recurrence.describe(rule, c, m)]);
        if (ev.description) rows.push([m.editor.description, ev.description]);
        Object.keys(res).forEach(k => { if (res[k].text) rows.push([res[k].title, res[k].text]); });
        return `<div class="psch-ro"><div class="psch-ro-title">${esc(ev.title || m.untitled)}</div><dl class="psch-ro-list">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>${ev.isReadonly ? `<p class="psch-ro-note">${esc(m.editor.readonly)}</p>` : ''}</div>`;
    };
    proto._bindTemplate = function (form, draft, showRec, pfx, disp) {
        const recHost = form.querySelector('[data-psch-recurrence]');
        if (recHost) recHost.innerHTML = showRec ? this._recurrenceEditorHTML(draft, pfx) : '';
        const resHost = form.querySelector('[data-psch-resources]');
        if (resHost) resHost.innerHTML = this._resourceFieldsHTML(draft, pfx);
        Array.from(form.elements).forEach(el => {
            const n = el.name;
            if (!n || /^(rec|res):/.test(n) || el.type === 'submit' || el.type === 'button') return;
            const v = draft[n];
            if (n === 'start' || n === 'end') {
                const dt = n === 'end' && draft.isAllDay ? D.addDays(draft.end, -1) : (draft.isAllDay ? draft[n] : disp(draft[n]));
                if (dt) el.value = D.toInput(dt, el.type === 'date');
                return;
            }
            if (el.type === 'checkbox') {
                const group = form.querySelectorAll(`[name="${cssEsc(n)}"]`).length > 1;
                el.checked = group ? (Array.isArray(v) ? v : [v]).map(String).includes(el.value) : !!v;
            } else if (el.type === 'radio') el.checked = v != null && String(v) === el.value;
            else if (el.type === 'select-multiple') { const arr = (Array.isArray(v) ? v : [v]).map(String); Array.from(el.options).forEach(o => { o.selected = arr.includes(o.value); }); }
            else if (v instanceof Date) el.value = D.toInput(v, el.type === 'date');
            else if (v != null) el.value = Array.isArray(v) ? (v[0] != null ? v[0] : '') : v;
        });
    };
    proto._wireEditor = function (form, draft) {
        const els = form.elements;
        const st = els.namedItem('start'), en = els.namedItem('end'), ad = els.namedItem('isAllDay'), tz = els.namedItem('startTimezone');
        const wd = D.parseTime(this.options.workDayStart, 480);
        const mem = {
            st: draft.isAllDay ? `${D.pad(Math.floor(wd / 60))}:${D.pad(wd % 60)}` : D.toInput(draft.start).slice(11),
            en: draft.isAllDay ? `${D.pad(Math.floor((wd + 60) / 60) % 24)}:${D.pad(wd % 60)}` : D.toInput(draft.end).slice(11)
        };
        if (ad && st && en && st.tagName === 'INPUT' && en.tagName === 'INPUT') {
            ad.addEventListener('change', () => {
                if (ad.checked) {
                    if (st.type === 'datetime-local') { mem.st = st.value.slice(11) || mem.st; mem.en = en.value.slice(11) || mem.en; }
                    st.type = 'date'; en.type = 'date';
                    st.value = st.value.slice(0, 10); en.value = en.value.slice(0, 10);
                } else {
                    const sv = st.value.slice(0, 10), ev = en.value.slice(0, 10);
                    st.type = 'datetime-local'; en.type = 'datetime-local';
                    if (sv) st.value = `${sv}T${mem.st}`;
                    if (ev) en.value = `${ev}T${mem.en}`;
                }
                if (tz && tz.tagName === 'SELECT') tz.disabled = ad.checked;
            });
        }
        if (st && en && st.tagName === 'INPUT') {
            let prev = D.parse(st.value);
            st.addEventListener('change', () => {
                const ns = D.parse(st.value), ne = D.parse(en.value);
                if (ns && prev && ne) {
                    const shifted = new Date(+ne + (+ns - +prev));
                    en.value = D.toInput(shifted, en.type === 'date');
                }
                prev = ns;
            });
        }
        const rec = form.querySelector('.psch-rec');
        if (rec) {
            const sel = rec.querySelector('[name="rec:freq"]');
            const unit = rec.querySelector('.psch-rec-unit');
            sel.addEventListener('change', () => {
                rec.dataset.freq = sel.value;
                if (unit) unit.textContent = (this.msg.recurrence.units || {})[sel.value] || '';
            });
        }
    };
    /** Form değerlerini okur; doğrulama hatasında hatayı gösterip null döner. */
    proto._readEditor = function (form, draft) {
        const me = this.msg.editor;
        const out = {};
        const groups = {};
        Array.from(form.elements).forEach(el => {
            const n = el.name;
            if (!n || /^(rec|res):/.test(n) || el.disabled || el.type === 'submit' || el.type === 'button' || el.tagName === 'FIELDSET') return;
            if (el.type === 'radio') { if (el.checked) out[n] = el.value; return; }
            if (el.type === 'checkbox') {
                if (groups[n] === undefined) groups[n] = form.querySelectorAll(`[name="${cssEsc(n)}"]`).length > 1;
                if (groups[n]) { out[n] = out[n] || []; if (el.checked) out[n].push(el.value); }
                else out[n] = el.checked;
                return;
            }
            if (el.type === 'number') { out[n] = el.value === '' ? null : Number(el.value); return; }
            if (el.type === 'datetime-local' || el.type === 'date') { out[n] = el.value ? D.parse(el.value) : null; return; }
            if (el.type === 'select-multiple') { out[n] = Array.from(el.selectedOptions).map(o => o.value); return; }
            out[n] = el.value;
        });
        const allDay = 'isAllDay' in out ? !!out.isAllDay : !!draft.isAllDay;
        out.isAllDay = allDay;
        let start = out.start !== undefined ? out.start : draft.start;
        let end = out.end !== undefined ? out.end : (allDay ? D.addDays(draft.end, -1) : draft.end);
        const err = form.querySelector('.psch-dlg-error');
        const fail = msg => { if (err) { err.textContent = msg; err.hidden = false; } return null; };
        if (!start) return fail(me.invalidRange);
        if (allDay) {
            start = D.startOfDay(start);
            end = end ? D.addDays(D.startOfDay(end), 1) : D.addDays(start, 1);
            if (end <= start) return fail(me.invalidRange);
        } else {
            const tz = out.startTimezone && this.options.editable.timezone && TZ.isValid(out.startTimezone) ? out.startTimezone : null;
            if (tz) {
                start = this._absToWall(TZ.fromWall(start, tz));
                if (end) end = this._absToWall(TZ.fromWall(end, tz));
            }
            if (!end) end = D.addMinutes(start, 60);
            if (end <= start) return fail(me.invalidRange);
        }
        out.start = start; out.end = end;
        if ('startTimezone' in out) { out.startTimezone = out.startTimezone || null; out.endTimezone = out.startTimezone; }
        this._resources.forEach(r => {
            const boxes = form.querySelectorAll(`[name="res:${cssEsc(r.field)}"]`);
            if (boxes.length) {
                if (r.multiple) out[r.field] = Array.from(boxes).filter(b => b.checked).map(b => r.items[+b.value]).filter(Boolean).map(it => it.value);
                else { const v = boxes[0].value; out[r.field] = v === '' ? null : (r.items[+v] ? r.items[+v].value : null); }
            } else if (r.field in out) {
                const map = x => { const it = r.items.find(i => String(i.value) === String(x)); return it ? it.value : (x === '' ? null : x); };
                out[r.field] = Array.isArray(out[r.field]) ? out[r.field].map(map) : map(out[r.field]);
            }
        });
        if (form.querySelector('[name="rec:freq"]')) out.recurrenceRule = this._readRecurrence(form, start);
        if (err) err.hidden = true;
        return out;
    };
    proto._readRecurrence = function (form, start) {
        const q = n => form.querySelector(`[name="${n}"]`);
        const checked = n => { const el = form.querySelector(`[name="${n}"]:checked`); return el ? el.value : null; };
        const freq = q('rec:freq').value;
        if (!freq) return '';
        const rule = { freq, interval: Math.max(1, parseInt(q('rec:interval').value, 10) || 1), count: null, until: null, byDay: [], byMonthDay: [], byMonth: [], bySetPos: [], wkst: this.firstDay };
        if (freq === 'WEEKLY') {
            rule.byDay = Array.from(form.querySelectorAll('[name="rec:byday"]:checked')).map(b => ({ n: 0, day: +b.value }));
            if (!rule.byDay.length) rule.byDay = [{ n: 0, day: start.getDay() }];
        }
        if (freq === 'MONTHLY' || freq === 'YEARLY') {
            if (freq === 'YEARLY') rule.byMonth = [+q('rec:month').value || (start.getMonth() + 1)];
            if (checked('rec:mmode') === 'ordinal') rule.byDay = [{ n: +q('rec:ord').value || 1, day: +q('rec:oday').value }];
            else rule.byMonthDay = [Math.min(31, Math.max(1, +q('rec:mday').value || start.getDate()))];
        }
        const end = checked('rec:end');
        if (end === 'count') rule.count = Math.max(1, parseInt(q('rec:count').value, 10) || 1);
        else if (end === 'until') {
            const u = D.parse(q('rec:until').value);
            if (u) rule.until = new Date(u.getFullYear(), u.getMonth(), u.getDate(), 23, 59, 59);
        }
        return Recurrence.serialize(rule);
    };

    // ---------------------------------------------------------------------------------
    // PDF (tarayıcının yazdır → PDF olarak kaydet akışı) — harici kütüphane yok
    // ---------------------------------------------------------------------------------
    proto.saveAsPDF = function (options) {
        const opts = Object.assign({ fileName: 'Takvim', title: this._titleText(), landscape: true }, (this.options.pdf || {}), options || {});
        if (this._trigger('pdfExport', { options: opts })) return;
        const clone = this.element.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('.psch-toolbar, .psch-footer, .psch-toasts, .psch-loading, .psch-live, script').forEach(n => n.remove());
        clone.classList.add('psch-print');
        clone.style.height = 'auto';
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(n => {
            if (n.tagName === 'LINK') return `<link rel="stylesheet" href="${esc(n.href)}">`;
            return `<style>${n.textContent}</style>`;
        }).join('');
        const html = `<!doctype html><html lang="${esc(this.culture.locale)}" dir="${this.rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(opts.fileName)}</title>${styles}<style>@page{size:${opts.landscape ? 'landscape' : 'portrait'};margin:10mm}html,body{background:#fff;margin:0}body{padding:0;font-family:Inter,system-ui,sans-serif}.psch-print-title{font:600 16px/1.3 Inter,system-ui,sans-serif;margin:0 0 8px;color:#0f172a}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body><h1 class="psch-print-title">${esc(opts.title)}</h1>${clone.outerHTML}</body></html>`;
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:1200px;height:800px;border:0;opacity:0;pointer-events:none;';
        document.body.appendChild(frame);
        frame.addEventListener('load', () => {
            setTimeout(() => {
                try { frame.contentWindow.focus(); frame.contentWindow.print(); }
                catch (e) { console.error('[Panoptes.Scheduler] Yazdırma başlatılamadı', e); }
                setTimeout(() => frame.remove(), 1500);
            }, 350);
        }, { once: true });
        frame.srcdoc = html;
    };
    proto.print = function () { return this.saveAsPDF(); };

    // ---------------------------------------------------------------------------------
    // iCalendar (RFC 5545)
    // ---------------------------------------------------------------------------------
    proto.exportICal = function () {
        const host = (window.location && window.location.hostname) || 'panoptes';
        const items = this.events.map(ev => {
            const abs = d => (ev.isAllDay ? d : this._wallToAbs(d));
            return {
                uid: `${ev.id}@${host}`, title: ev.title, description: ev.description, location: ev.location,
                isAllDay: !!ev.isAllDay, start: abs(ev.start), end: abs(ev.end),
                rule: ev.recurrenceId == null ? (ev.recurrenceRule || '') : '',
                exdates: ev.recurrenceId == null ? (ev.recurrenceException || []).map(abs) : []
            };
        });
        return ICal.serialize(items, 'Panoptes//Scheduler');
    };
    proto.saveAsICal = function (fileName) {
        const text = this.exportICal();
        const args = { fileName: (fileName || (this.options.ical && this.options.ical.fileName) || 'takvim').replace(/\.ics$/i, '') + '.ics', data: text };
        if (this._trigger('icalExport', args)) return text;
        const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = args.fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return text;
    };
    proto.importICal = async function (text) {
        let parsed;
        try { parsed = ICal.parse(text); } catch (err) { parsed = null; }
        if (!parsed || !parsed.length) { this._toast(this.msg.errors.ical, 'error'); this._trigger('error', { operation: 'ical', error: new Error('ical') }); return 0; }
        const toEv = p => {
            const allDay = !!p.isAllDay;
            const wall = d => (allDay ? D.startOfDay(d) : this._absToWall(d));
            const ev = {
                id: tmpId(), title: p.title || '', description: p.description || '', isAllDay: allDay,
                start: wall(p.start), end: wall(p.end), recurrenceRule: p.rule || '', recurrenceId: null,
                recurrenceException: (p.exdates || []).map(wall), isReadonly: false
            };
            if (p.location) ev.location = p.location;
            return fixAllDay(ev);
        };
        const masters = parsed.filter(p => !p.recurrenceStart).map(p => ({ p, ev: toEv(p) }));
        const exceptions = parsed.filter(p => p.recurrenceStart);
        const byUid = new Map(masters.filter(x => x.p.uid).map(x => [x.p.uid, x.ev]));
        const pending = [];
        exceptions.forEach(p => {
            const ev = toEv(p);
            const master = byUid.get(p.uid);
            if (master) {
                master.recurrenceException.push(p.isAllDay ? D.startOfDay(p.recurrenceStart) : this._absToWall(p.recurrenceStart));
                pending.push({ ev, master });
            } else masters.push({ p, ev });
        });
        const all = masters.map(x => x.ev).concat(pending.map(x => x.ev));
        if (this._trigger('icalImport', { events: all })) return 0;
        masters.forEach(x => this.events.push(x.ev));
        this.refresh();
        let n = 0;
        for (const x of masters) if (await this._persistCreate(x.ev, true)) n++;
        for (const x of pending) {
            x.ev.recurrenceId = x.master.id;
            this.events.push(x.ev);
            if (await this._persistCreate(x.ev, true)) n++;
        }
        this.refresh();
        this._toast(format(this.msg.imported, n), 'success');
        return n;
    };

})(window, document);
