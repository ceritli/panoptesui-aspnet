/**
 * Panoptes TreeList Component (Hiyerarşik Ağaç Tablosu / TreeGrid)
 * Panoptes ASP.NET Core TreeList bileşeni.
 *
 * Özellikler: sıralama, filtre satırı, arama paneli, istemci tarafı sayfalama,
 * onay kutusu / çoklu seçim, satır içi / hücre içi / popup düzenleme,
 * sürükle-bırak, sütun menüsü, sütun yeniden sıralama, sütun boyutlandırma,
 * dondurulmuş (locked) sütunlar, çok katmanlı başlıklar, toplamlar (aggregates),
 * klavye ile gezinme, Excel & PDF çıktısı, uzak veri / OData bağlama (lazy yükleme),
 * durum saklama (persist state), satır şablonu, araç çubuğu şablonu, olay & API desteği.
 */
(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    if (window.Panoptes.TreeList && window.Panoptes.TreeList.__v2) return;

    /* ------------------------------------------------------------------ */
    /* Stil                                                               */
    /* ------------------------------------------------------------------ */
    const CSS = `
.ptl-root{background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;box-shadow:0 1px 2px rgba(15,23,42,.05);overflow:hidden;display:flex;flex-direction:column;width:100%;font-size:12px;color:#334155;font-family:inherit}
.ptl-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;padding:.65rem 1rem;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.ptl-toolbar-left{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.ptl-toolbar-right{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-left:auto}
.ptl-title{font-weight:700;font-size:14px;color:#1e293b}
.ptl-badge{display:inline-flex;align-items:center;padding:.1rem .5rem;border-radius:9999px;font-size:10px;font-weight:700;background:#dbeafe;color:#1d4ed8;white-space:nowrap}
.ptl-badge.ptl-b-green{background:#d1fae5;color:#047857}.ptl-badge.ptl-b-amber{background:#fef3c7;color:#b45309}.ptl-badge.ptl-b-rose{background:#ffe4e6;color:#be123c}.ptl-badge.ptl-b-slate{background:#e2e8f0;color:#475569}.ptl-badge.ptl-b-blue{background:#dbeafe;color:#1d4ed8}
.ptl-btn{display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .7rem;border:1px solid #cbd5e1;background:#fff;border-radius:.5rem;font-weight:600;font-size:12px;color:#334155;cursor:pointer;transition:background .15s,border-color .15s,transform .1s;line-height:1.2}
.ptl-btn:hover{background:#f1f5f9}.ptl-btn:active{transform:scale(.97)}
.ptl-btn svg{width:14px;height:14px}
.ptl-btn-primary{background:#2563eb;border-color:#2563eb;color:#fff}.ptl-btn-primary:hover{background:#1d4ed8}
.ptl-btn-success{background:#059669;border-color:#059669;color:#fff}.ptl-btn-success:hover{background:#047857}
.ptl-btn-danger{background:#e11d48;border-color:#e11d48;color:#fff}.ptl-btn-danger:hover{background:#be123c}
.ptl-search-wrap{position:relative}
.ptl-search-wrap svg{position:absolute;left:.6rem;top:.5rem;width:14px;height:14px;color:#94a3b8;pointer-events:none}
.ptl-search{padding:.38rem .7rem .38rem 1.9rem;border:1px solid #cbd5e1;border-radius:.5rem;width:200px;background:#fff;font-size:12px;outline:none}
.ptl-search:focus,.ptl-input:focus,.ptl-filter-input:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.2)}
.ptl-hint{padding:.4rem 1rem;background:#eff6ff;border-bottom:1px solid #dbeafe;color:#1e40af;font-size:11px;display:flex;flex-wrap:wrap;gap:.35rem .9rem;align-items:center}
.ptl-hint kbd{background:#fff;border:1px solid #bfdbfe;border-bottom-width:2px;border-radius:.3rem;padding:0 .35rem;font-family:ui-monospace,monospace;font-size:10px;color:#1e3a8a}
.ptl-scroll{overflow:auto;position:relative;outline:none;flex:1}
.ptl-scroll:focus-visible{box-shadow:inset 0 0 0 2px rgba(37,99,235,.35)}
.ptl-table{border-collapse:separate;border-spacing:0;table-layout:fixed;width:100%;text-align:left}
.ptl-table th,.ptl-table td{border-bottom:1px solid #eef2f7;padding:.55rem .8rem;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#fff}
.ptl-table thead th{position:sticky;top:0;z-index:4;background:#f1f5f9;color:#475569;font-weight:700;border-bottom:1px solid #cbd5e1;user-select:none}
.ptl-table thead th.ptl-group-th{text-align:center;border-bottom:1px solid #cbd5e1;border-left:1px solid #e2e8f0;background:#e8eef6;color:#334155}
.ptl-table thead tr.ptl-filter-row th{top:auto;background:#f8fafc;padding:.3rem .5rem;font-weight:400}
.ptl-th-inner{display:flex;align-items:center;gap:.35rem;min-width:0}
.ptl-th-title{overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.ptl-th-sortable{cursor:pointer}.ptl-th-sortable:hover{background:#e8eef6}
.ptl-sort-ind{color:#2563eb;font-size:11px;display:inline-flex;align-items:center;gap:1px}
.ptl-sort-ind sup{font-size:8px;color:#64748b}
.ptl-th-menu{border:0;background:transparent;color:#94a3b8;padding:2px;border-radius:.3rem;cursor:pointer;display:inline-flex}
.ptl-th-menu:hover{background:#cbd5e1;color:#1e293b}.ptl-th-menu svg{width:14px;height:14px}
.ptl-resizer{position:absolute;right:0;top:0;bottom:0;width:6px;cursor:col-resize;z-index:6}
.ptl-resizer:hover,.ptl-resizing .ptl-resizer{background:rgba(37,99,235,.35)}
.ptl-col-drag-over-l{box-shadow:inset 3px 0 0 #2563eb}.ptl-col-drag-over-r{box-shadow:inset -3px 0 0 #2563eb}
.ptl-reorderable{cursor:grab}
.ptl-filter-input{width:100%;padding:.25rem .45rem;border:1px solid #cbd5e1;border-radius:.4rem;background:#fff;font-size:11px;outline:none;box-sizing:border-box}
.ptl-row{transition:background .12s}
.ptl-row:hover>td{background:#f8fafc}
.ptl-row.ptl-selected>td{background:#eff6ff}
.ptl-row.ptl-active>td:first-child{box-shadow:inset 3px 0 0 #2563eb}
.ptl-row.ptl-active>td{background:#f0f7ff}
.ptl-row.ptl-selected.ptl-active>td{background:#e0efff}
.ptl-row.ptl-parent>td{font-weight:500}
.ptl-row.ptl-editing>td{background:#fffbeb}
.ptl-row.ptl-drop-inside>td{background:#dbeafe!important;box-shadow:inset 0 0 0 1px #3b82f6}
.ptl-row.ptl-drop-before>td{box-shadow:inset 0 3px 0 #2563eb}
.ptl-row.ptl-drop-after>td{box-shadow:inset 0 -3px 0 #2563eb}
.ptl-row.ptl-dragging{opacity:.4}
.ptl-row[draggable=true]{cursor:grab}
.ptl-a-right{text-align:right}.ptl-a-center{text-align:center}
.ptl-chk{text-align:center;padding-left:.4rem!important;padding-right:.4rem!important}
.ptl-check{width:14px;height:14px;accent-color:#2563eb;cursor:pointer}
.ptl-treecell{display:flex;align-items:center;gap:.3rem;min-width:0}
.ptl-treetext{overflow:hidden;text-overflow:ellipsis;min-width:0}
.ptl-toggle{border:0;background:transparent;padding:2px;border-radius:.3rem;color:#94a3b8;cursor:pointer;display:inline-flex;transition:transform .15s,background .15s;flex-shrink:0}
.ptl-toggle:hover{background:#e2e8f0;color:#1e293b}.ptl-toggle svg{width:14px;height:14px}
.ptl-toggle.ptl-open{transform:rotate(90deg)}
.ptl-toggle-spacer{width:18px;height:18px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:#cbd5e1}
.ptl-toggle-spacer::before{content:'\\2022'}
.ptl-spin{width:14px;height:14px;border:2px solid #cbd5e1;border-top-color:#2563eb;border-radius:50%;animation:ptl-spin .7s linear infinite;flex-shrink:0;margin:2px}
@keyframes ptl-spin{to{transform:rotate(360deg)}}
.ptl-agg{color:#7c3aed;font-weight:700;font-style:italic}
.ptl-agg::before{content:'\\03A3\\00A0';opacity:.7}
.ptl-money{font-family:ui-monospace,monospace;font-weight:600;color:#0f172a}
.ptl-progress{display:flex;align-items:center;gap:.4rem}
.ptl-progress-bar{flex:1;height:6px;background:#e2e8f0;border-radius:9999px;overflow:hidden;min-width:30px}
.ptl-progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:9999px}
.ptl-progress-lbl{font-size:10px;font-weight:700;color:#475569;min-width:30px;text-align:right}
.ptl-input{width:100%;padding:.25rem .45rem;border:1px solid #93c5fd;border-radius:.4rem;font-size:12px;outline:none;background:#fff;box-sizing:border-box;font-family:inherit}
.ptl-input.ptl-invalid{border-color:#e11d48;background:#fff1f2}
.ptl-input-chk{width:15px;height:15px;accent-color:#2563eb}
.ptl-cmd{white-space:nowrap;text-align:center}
.ptl-cmd-btn{border:0;background:transparent;padding:4px;border-radius:.4rem;color:#64748b;cursor:pointer;display:inline-flex;transition:background .12s,color .12s}
.ptl-cmd-btn svg{width:15px;height:15px}
.ptl-cmd-btn:hover{background:#e2e8f0;color:#0f172a}
.ptl-cmd-btn.ptl-c-del:hover{background:#ffe4e6;color:#be123c}
.ptl-cmd-btn.ptl-c-ok{color:#059669}.ptl-cmd-btn.ptl-c-ok:hover{background:#d1fae5}
.ptl-cell-editable{cursor:cell}
.ptl-cell-editable:hover{box-shadow:inset 0 0 0 1px #bfdbfe}
.ptl-table tfoot td{position:sticky;bottom:0;z-index:3;background:#f8fafc;border-top:1px solid #cbd5e1;border-bottom:0;font-weight:700;color:#334155}
.ptl-locked{position:sticky;z-index:2;box-shadow:1px 0 0 #e2e8f0}
.ptl-table thead th.ptl-locked{z-index:7}
.ptl-locked-last{box-shadow:2px 0 4px -1px rgba(15,23,42,.18)!important}
.ptl-empty{text-align:center;color:#94a3b8;padding:2rem!important}
.ptl-pager{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem;padding:.55rem 1rem;border-top:1px solid #e2e8f0;background:#f8fafc;font-size:11px;color:#64748b}
.ptl-pager-btns{display:flex;align-items:center;gap:.2rem}
.ptl-pg{min-width:26px;height:26px;padding:0 .4rem;border:1px solid transparent;background:transparent;border-radius:.4rem;cursor:pointer;color:#475569;font-weight:600;font-size:11px}
.ptl-pg:hover:not(:disabled){background:#e2e8f0}
.ptl-pg.ptl-pg-cur{background:#2563eb;color:#fff}
.ptl-pg:disabled{opacity:.35;cursor:default}
.ptl-pager select{padding:.2rem .4rem;border:1px solid #cbd5e1;border-radius:.4rem;background:#fff;font-size:11px}
.ptl-menu{position:fixed;z-index:9999;min-width:200px;background:#fff;border:1px solid #e2e8f0;border-radius:.6rem;box-shadow:0 10px 30px rgba(15,23,42,.18);padding:.35rem;font-size:12px;color:#334155}
.ptl-menu-item{display:flex;align-items:center;gap:.5rem;width:100%;padding:.4rem .6rem;border:0;background:transparent;border-radius:.4rem;cursor:pointer;text-align:left;font-size:12px;color:inherit}
.ptl-menu-item:hover{background:#f1f5f9}.ptl-menu-item svg{width:14px;height:14px;color:#64748b}
.ptl-menu-sep{height:1px;background:#e2e8f0;margin:.3rem 0}
.ptl-menu-title{padding:.25rem .6rem;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
.ptl-menu label.ptl-menu-item{cursor:pointer}
.ptl-menu input[type=checkbox]{accent-color:#2563eb}
.ptl-modal-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9998;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px)}
.ptl-modal{background:#fff;border-radius:1rem;box-shadow:0 25px 60px rgba(15,23,42,.35);width:100%;max-width:520px;max-height:90vh;overflow:auto}
.ptl-modal-h{padding:1rem 1.25rem;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:15px;color:#0f172a}
.ptl-modal-b{padding:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.ptl-modal-b .ptl-field-full{grid-column:1/-1}
.ptl-modal-b label{display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:.25rem}
.ptl-modal-f{padding:.9rem 1.25rem;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:.5rem;background:#f8fafc}
.ptl-toast{position:absolute;right:.75rem;bottom:.75rem;background:#0f172a;color:#fff;padding:.45rem .8rem;border-radius:.5rem;font-size:11px;opacity:0;transform:translateY(6px);transition:all .25s;pointer-events:none;z-index:20}
.ptl-toast.ptl-toast-show{opacity:1;transform:none}
.ptl-root{position:relative}
mark.ptl-mark{background:#fde68a;color:inherit;border-radius:2px;padding:0 1px}
.ptl-error{padding:1rem;color:#be123c;background:#fff1f2;text-align:center}
`;

    function injectStyle() {
        if (document.getElementById('ptl-style')) return;
        const st = document.createElement('style');
        st.id = 'ptl-style';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    /* ------------------------------------------------------------------ */
    /* Yardımcılar                                                         */
    /* ------------------------------------------------------------------ */
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lower = (s) => String(s == null ? '' : s).toLocaleLowerCase('tr-TR');
    const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
    const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parsePx = (w) => {
        if (w == null || w === '') return null;
        const n = parseFloat(w);
        return isFinite(n) ? n : null;
    };
    const cssEsc = (s) => (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&');
    const isEmpty = (v) => v === null || v === undefined || v === '';

    const ICON = {
        chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z"/></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>',
        menu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
        up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l7-7 7 7"/></svg>',
        down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>',
        save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>',
        reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h5M20 20v-5h-5M5.6 9A8 8 0 0119 11M18.4 15A8 8 0 015 13"/></svg>'
    };

    function inferType(c) {
        if (c.type) return c.type;
        if (c.options && c.options.length) return 'select';
        switch (c.format) {
            case 'currency': case 'number': case 'percent': case 'progress': return 'number';
            case 'date': return 'date';
            case 'boolean': return 'boolean';
            default: return 'string';
        }
    }

    function normCol(c) {
        const col = Object.assign({
            field: '', title: '', width: null, align: 'left', format: null, isTreeColumn: false,
            aggregate: null, type: null, editable: true, sortable: null, filterable: null,
            locked: false, hidden: false, group: null, options: null, required: false
        }, c);
        col.width = parsePx(col.width);
        col.type = inferType(col);
        if (!col.title) col.title = col.field;
        return col;
    }

    function badgeClass(text) {
        const t = lower(text);
        if (/(tamam|aktif|evet|onay|başar|ba\u015far|yeşil)/.test(t)) return 'ptl-b-green';
        if (/(devam|süre|aç\u0131k|acik|yeni)/.test(t)) return 'ptl-b-blue';
        if (/(plan|bekle|taslak)/.test(t)) return 'ptl-b-amber';
        if (/(iptal|gecik|hata|red|pasif|hay\u0131r|hayir)/.test(t)) return 'ptl-b-rose';
        return 'ptl-b-slate';
    }

    function toIsoDate(v) {
        if (isEmpty(v)) return '';
        const d = new Date(v);
        if (isNaN(d)) return String(v);
        const p = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    function fmtText(col, v) {
        if (isEmpty(v)) return '';
        switch (col.format) {
            case 'currency': { const n = Number(v); return isNaN(n) ? String(v) : nf2.format(n) + ' ₺'; }
            case 'number': { const n = Number(v); return isNaN(n) ? String(v) : nf.format(n); }
            case 'percent': case 'progress': { const n = Number(v); return isNaN(n) ? String(v) : '%' + nf.format(n); }
            case 'date': { const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleDateString('tr-TR'); }
            case 'boolean': return (v === true || v === 'true') ? 'Evet' : 'Hayır';
            default:
                if (col.type === 'date') { const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleDateString('tr-TR'); }
                if (col.type === 'boolean') return (v === true || v === 'true') ? 'Evet' : 'Hayır';
                return String(v);
        }
    }

    function cmpValues(col, a, b) {
        const ea = isEmpty(a), eb = isEmpty(b);
        if (ea && eb) return 0;
        if (ea) return -1;
        if (eb) return 1;
        switch (col.type) {
            case 'number': return Number(a) - Number(b);
            case 'date': return new Date(a) - new Date(b);
            case 'boolean': return (a === true || a === 'true' ? 1 : 0) - (b === true || b === 'true' ? 1 : 0);
            default: return String(a).localeCompare(String(b), 'tr', { numeric: true, sensitivity: 'base' });
        }
    }

    function parseNumFilter(raw) {
        const m = String(raw).trim().match(/^(>=|<=|!=|<>|>|<|=)?\s*(-?[\d.,]+)$/);
        if (!m) return null;
        const num = parseFloat(m[2].replace(',', '.'));
        if (isNaN(num)) return null;
        const map = { '>=': 'ge', '<=': 'le', '!=': 'ne', '<>': 'ne', '>': 'gt', '<': 'lt', '=': 'eq' };
        return { op: map[m[1]] || 'eq', value: num };
    }

    function buildFilter(col, raw) {
        raw = raw == null ? '' : String(raw).trim();
        if (raw === '') return null;
        if (col.type === 'number') {
            const f = parseNumFilter(raw);
            return f ? { raw: raw, op: f.op, value: f.value } : { raw: raw, op: 'contains', value: raw };
        }
        if (col.type === 'date') return { raw: raw, op: 'eq', value: raw };
        if (col.type === 'boolean') return { raw: raw, op: 'eq', value: raw === 'true' };
        if (col.type === 'select') return { raw: raw, op: 'eq', value: raw };
        return { raw: raw, op: 'contains', value: raw };
    }

    function matchFilter(col, f, v) {
        switch (f.op) {
            case 'contains': return lower(fmtText(col, v)).includes(lower(f.value)) || lower(v).includes(lower(f.value));
            case 'eq':
                if (col.type === 'number') return Number(v) === f.value;
                if (col.type === 'date') return toIsoDate(v) === f.value;
                if (col.type === 'boolean') return (v === true || v === 'true') === f.value;
                return lower(v) === lower(f.value);
            case 'ne': return Number(v) !== f.value;
            case 'gt': return Number(v) > f.value;
            case 'ge': return Number(v) >= f.value;
            case 'lt': return Number(v) < f.value;
            case 'le': return Number(v) <= f.value;
            default: return true;
        }
    }

    function aggCompute(fn, values) {
        const nums = values.filter((v) => !isEmpty(v) && !isNaN(Number(v))).map(Number);
        switch (fn) {
            case 'count': return values.filter((v) => !isEmpty(v)).length;
            case 'sum': return nums.reduce((a, b) => a + b, 0);
            case 'avg': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
            case 'min': return nums.length ? Math.min.apply(null, nums) : 0;
            case 'max': return nums.length ? Math.max.apply(null, nums) : 0;
            default: return null;
        }
    }
    const AGG_LABEL = { sum: 'Toplam', avg: 'Ort.', count: 'Adet', min: 'Min', max: 'Maks' };

    /* ------------------------------------------------------------------ */
    /* Bileşen                                                             */
    /* ------------------------------------------------------------------ */
    const TL = window.Panoptes.TreeList = {
        __v2: true,
        instances: {},
        getInstance: function (id) { return this.instances[id] || null; },
        whenReady: function (id, fn) {
            const inst = this.instances[id];
            if (inst) { fn(inst); return; }
            const h = (e) => { if (e.detail && e.detail.id === id) { document.removeEventListener('ptl:ready', h); fn(e.detail.instance); } };
            document.addEventListener('ptl:ready', h);
        },
        init: function (container) {
            if (!container) return null;
            if (!container.id) container.id = 'panoptes-treelist-' + Math.random().toString(36).substring(2, 9);
            if (this.instances[container.id]) return this.instances[container.id];
            injectStyle();
            const instance = new TreeListInstance(container);
            this.instances[container.id] = instance;
            document.dispatchEvent(new CustomEvent('ptl:ready', { detail: { id: container.id, instance: instance } }));
            return instance;
        },
        initAll: function () {
            document.querySelectorAll('[data-panoptes-treelist="true"]').forEach((el) => this.init(el));
        }
    };

    class TreeListInstance {
        constructor(el) {
            this.el = el;
            this.id = el.id;

            const cfgNode = el.querySelector('script.ptl-config');
            let cfg = {};
            try { cfg = JSON.parse(cfgNode ? cfgNode.textContent : '{}'); } catch (e) { console.error('TreeList yapılandırması okunamadı', e); }
            this.cfg = cfg;

            this.opt = Object.assign({
                title: null, height: null, showSearch: true, showToolbar: true,
                sortable: false, filterable: false, columnMenu: false, resizable: false, reorderable: false, lockable: false,
                selectable: 'single', editable: 'none', draggable: false,
                pageable: false, pageSize: 10, pageSizes: [5, 10, 20, 50],
                aggregates: 'none', persistKey: null, persistAuto: false,
                remoteUrl: null, odataUrl: null, rowTemplate: null, toolbarTemplate: null,
                searchFields: null, tools: [], exportName: 'treelist', keyboard: true, keyboardHint: false,
                emptyText: 'Kayıt bulunamadı.', callbacks: {}, onEvent: null
            }, Object.keys(cfg.options || {}).reduce((o, k) => { if (cfg.options[k] !== null && cfg.options[k] !== undefined) o[k] = cfg.options[k]; return o; }, {}));
            if (typeof this.opt.searchFields === 'string') this.opt.searchFields = this.opt.searchFields.split(',').map((s) => s.trim()).filter(Boolean);
            if (typeof this.opt.tools === 'string') this.opt.tools = this.opt.tools.split(',').map((s) => s.trim()).filter(Boolean);
            if (typeof this.opt.pageSizes === 'string') this.opt.pageSizes = this.opt.pageSizes.split(',').map((s) => parseInt(s, 10)).filter(Boolean);

            this.remote = !!(this.opt.remoteUrl || this.opt.odataUrl);
            this.odata = !!this.opt.odataUrl;

            this.cols = (cfg.columns || []).map(normCol);
            if (this.cols.length && !this.cols.some((c) => c.isTreeColumn)) this.cols[0].isTreeColumn = true;

            this.nodes = [];
            this.byId = new Map();
            this.childMap = new Map();
            this.sort = [];
            this.filters = {};
            this.search = '';
            this.page = 1;
            this.pageSize = this.opt.pageSize;
            this.rootTotal = 0;
            this.selected = new Set();
            this.activeId = null;
            this.edit = null;
            this.cellEdit = null;
            this.popup = null;
            this.seq = 0;
            this.rows = [];
            this.dragId = null;
            this.loadError = null;
            this.widthsFrozen = false;

            this.initialCols = JSON.parse(JSON.stringify(this.cols));
            this.handlers = {};

            this.buildSkeleton();
            this.bindEvents();

            if (this.remote) {
                this.loadRoots();
            } else {
                this.setData(cfg.items || [], true);
            }

            if (this.opt.persistKey && this.opt.persistAuto) this.loadState(true);
        }

        /* ------------------------------ Veri ------------------------------ */
        makeNode(raw) {
            const values = raw.values && typeof raw.values === 'object' ? raw.values : Object.assign({}, raw);
            return {
                id: String(raw.id),
                parentId: (raw.parentId === null || raw.parentId === undefined || raw.parentId === '') ? null : String(raw.parentId),
                expanded: this.remote ? false : raw.expanded !== false,
                values: values,
                hasChildren: !!raw.hasChildren,
                loaded: !this.remote,
                loading: false
            };
        }

        setData(items, initial) {
            this.nodes = items.map((i) => this.makeNode(i));
            this.reindex();
            if (initial) this.initialExpanded = new Set(this.nodes.filter((n) => n.expanded).map((n) => n.id));
            this.render();
            this.trigger('dataBound', { count: this.nodes.length });
        }

        reindex() {
            this.byId.clear();
            this.childMap.clear();
            this.nodes.forEach((n) => this.byId.set(n.id, n));
            this.nodes.forEach((n) => {
                const k = n.parentId == null ? '' : n.parentId;
                if (!this.childMap.has(k)) this.childMap.set(k, []);
                this.childMap.get(k).push(n);
            });
            this.nodes.forEach((n) => {
                if (!this.remote) n.hasChildren = (this.childMap.get(n.id) || []).length > 0;
                else if ((this.childMap.get(n.id) || []).length) n.hasChildren = true;
            });
        }

        childrenOf(id) { return this.childMap.get(id == null ? '' : id) || []; }
        node(id) { return this.byId.get(String(id)) || null; }
        colByField(f) { return this.cols.find((c) => c.field === f); }
        visibleCols() { return this.cols.filter((c) => !c.hidden); }
        isDescendant(id, ancestorId) {
            let n = this.node(id);
            while (n && n.parentId != null) {
                if (n.parentId === String(ancestorId)) return true;
                n = this.node(n.parentId);
            }
            return false;
        }
        descendants(id) {
            const out = [];
            const walk = (pid) => this.childrenOf(pid).forEach((c) => { out.push(c); walk(c.id); });
            walk(id);
            return out;
        }

        /* --------------------------- Uzak veri ---------------------------- */
        buildRemoteRequest(parentId) {
            const isRoot = parentId == null;
            const base = this.opt.odataUrl || this.opt.remoteUrl;
            const sep = base.indexOf('?') >= 0 ? '&' : '?';
            const q = [];
            const fl = Object.keys(this.filters).map((f) => ({ field: f, op: this.filters[f].op, value: this.filters[f].value }));
            if (this.odata) {
                const parts = [isRoot ? 'parentId eq null' : "parentId eq '" + String(parentId).replace(/'/g, "''") + "'"];
                fl.forEach((f) => {
                    const col = this.colByField(f.field);
                    if (f.op === 'contains') parts.push("contains(tolower(" + f.field + "),'" + lower(f.value).replace(/'/g, "''") + "')");
                    else if (col && col.type === 'number') parts.push(f.field + ' ' + f.op + ' ' + f.value);
                    else if (col && col.type === 'boolean') parts.push(f.field + ' eq ' + f.value);
                    else parts.push(f.field + " eq '" + String(f.value).replace(/'/g, "''") + "'");
                });
                q.push('$filter=' + encodeURIComponent(parts.join(' and ')));
                if (this.sort.length) q.push('$orderby=' + encodeURIComponent(this.sort.map((s) => s.field + ' ' + s.dir).join(',')));
                q.push('$count=true');
                if (isRoot && this.opt.pageable) {
                    q.push('$top=' + this.pageSize);
                    q.push('$skip=' + ((this.page - 1) * this.pageSize));
                }
            } else {
                if (!isRoot) q.push('parentId=' + encodeURIComponent(parentId));
                if (this.sort.length) q.push('sort=' + encodeURIComponent(this.sort.map((s) => s.field + '-' + s.dir).join(',')));
                if (fl.length) q.push('filter=' + encodeURIComponent(JSON.stringify(fl)));
                if (isRoot && this.opt.pageable) {
                    q.push('take=' + this.pageSize);
                    q.push('skip=' + ((this.page - 1) * this.pageSize));
                }
            }
            return base + sep + q.join('&');
        }

        async fetchLevel(parentId) {
            const url = this.buildRemoteRequest(parentId);
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            let list, total;
            if (this.odata) { list = json.value || []; total = json['@odata.count']; }
            else { list = Array.isArray(json) ? json : (json.items || []); total = Array.isArray(json) ? undefined : json.total; }
            this.lastRequest = url;
            return { items: list.map((r) => this.makeNode(r)), total: total === undefined ? list.length : total };
        }

        async loadRoots() {
            this.setBusy(true);
            try {
                const r = await this.fetchLevel(null);
                this.nodes = r.items;
                this.rootTotal = r.total;
                this.loadError = null;
                this.reindex();
            } catch (e) {
                this.loadError = 'Veri yüklenemedi: ' + e.message;
                this.nodes = [];
            }
            this.setBusy(false);
            this.render();
            this.trigger('dataBound', { count: this.nodes.length, request: this.lastRequest });
        }

        async loadChildren(node) {
            node.loading = true;
            this.renderRows();
            try {
                const r = await this.fetchLevel(node.id);
                r.items.forEach((i) => this.nodes.push(i));
                node.loaded = true;
                node.hasChildren = r.items.length > 0;
                this.reindex();
            } catch (e) {
                this.loadError = 'Alt kayıtlar yüklenemedi: ' + e.message;
            }
            node.loading = false;
            this.renderRows();
            this.trigger('dataBound', { count: this.nodes.length, request: this.lastRequest, parentId: node.id });
        }

        setBusy(b) { this.scrollEl && this.scrollEl.classList.toggle('ptl-busy', b); this.scrollEl && (this.scrollEl.style.opacity = b ? '.55' : ''); }

        reloadRemote() { this.loadRoots(); }

        /* ------------------------- Satır hesaplama ------------------------- */
        filtersActive() { return Object.keys(this.filters).length > 0 || !!this.search; }

        nodeMatches(n) {
            for (const f in this.filters) {
                const col = this.colByField(f);
                if (col && !matchFilter(col, this.filters[f], n.values[f])) return false;
            }
            if (this.search) {
                const q = lower(this.search);
                const fields = this.opt.searchFields && this.opt.searchFields.length ? this.opt.searchFields : this.visibleCols().map((c) => c.field);
                const ok = fields.some((f) => {
                    const col = this.colByField(f);
                    return col ? lower(fmtText(col, n.values[f])).includes(q) || lower(n.values[f]).includes(q) : false;
                });
                if (!ok) return false;
            }
            return true;
        }

        computeShown() {
            if (this.remote || !this.filtersActive()) return null;
            const shown = new Set();
            const dfs = (n) => {
                let any = this.nodeMatches(n);
                this.childrenOf(n.id).forEach((c) => { if (dfs(c)) any = true; });
                if (any) shown.add(n.id);
                return any;
            };
            this.childrenOf(null).forEach(dfs);
            return shown;
        }

        sortSiblings(arr) {
            if (this.remote || !this.sort.length) return arr;
            const specs = this.sort.map((s) => ({ col: this.colByField(s.field), dir: s.dir === 'desc' ? -1 : 1 })).filter((s) => s.col);
            return arr.slice().sort((a, b) => {
                for (const s of specs) {
                    const r = cmpValues(s.col, a.values[s.col.field], b.values[s.col.field]);
                    if (r) return r * s.dir;
                }
                return 0;
            });
        }

        computeRows() {
            const shown = this.computeShown();
            this.shown = shown;
            let roots = this.childrenOf(null);
            if (shown) roots = roots.filter((r) => shown.has(r.id));
            roots = this.sortSiblings(roots);
            this.rootCount = this.remote ? this.rootTotal : roots.length;
            if (this.opt.pageable && !this.remote) {
                const pages = Math.max(1, Math.ceil(roots.length / this.pageSize));
                if (this.page > pages) this.page = pages;
                roots = roots.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
            }
            const rows = [];
            const walk = (n, level) => {
                let kids = this.childrenOf(n.id);
                if (shown) kids = kids.filter((k) => shown.has(k.id));
                const forced = !!(shown && kids.length);
                const expanded = n.expanded || forced;
                rows.push({ node: n, level: level, expanded: expanded });
                if (expanded && kids.length) this.sortSiblings(kids).forEach((k) => walk(k, level + 1));
            };
            roots.forEach((r) => walk(r, 0));
            this.rows = rows;
            return rows;
        }

        exportRows() {
            const shown = this.computeShown();
            let roots = this.childrenOf(null);
            if (shown) roots = roots.filter((r) => shown.has(r.id));
            const out = [];
            const walk = (n, level) => {
                out.push({ node: n, level: level });
                let kids = this.childrenOf(n.id);
                if (shown) kids = kids.filter((k) => shown.has(k.id));
                this.sortSiblings(kids).forEach((k) => walk(k, level + 1));
            };
            this.sortSiblings(roots).forEach((r) => walk(r, 0));
            return out;
        }

        /* ------------------------------ İskelet ---------------------------- */
        hasCheckbox() { return this.opt.selectable === 'checkbox'; }
        hasCommands() { return this.opt.editable !== 'none'; }
        toolEnabled(t) { return this.opt.tools.indexOf(t) >= 0; }

        buildSkeleton() {
            const o = this.opt;
            const tb = [];
            if (o.showToolbar) {
                tb.push('<div class="ptl-toolbar"><div class="ptl-toolbar-left">');
                if (o.title) tb.push('<span class="ptl-title">' + esc(o.title) + '</span><span class="ptl-badge ptl-count"></span>');
                if (this.hasCommands() && this.toolEnabled('create')) tb.push('<button type="button" class="ptl-btn ptl-btn-primary" data-tool="create">' + ICON.plus + 'Yeni Kayıt Ekle</button>');
                if (this.toolEnabled('expandAll')) tb.push('<button type="button" class="ptl-btn" data-tool="expandAll">Tümünü Aç</button>');
                if (this.toolEnabled('collapseAll')) tb.push('<button type="button" class="ptl-btn" data-tool="collapseAll">Tümünü Kapat</button>');
                if (this.toolEnabled('excel')) tb.push('<button type="button" class="ptl-btn ptl-btn-success" data-tool="excel">' + ICON.download + 'Excel\'e Aktar</button>');
                if (this.toolEnabled('pdf')) tb.push('<button type="button" class="ptl-btn ptl-btn-danger" data-tool="pdf">' + ICON.download + 'PDF\'e Aktar</button>');
                if (this.toolEnabled('saveState')) tb.push('<button type="button" class="ptl-btn" data-tool="saveState">' + ICON.save + 'Durumu Kaydet</button>');
                if (this.toolEnabled('loadState')) tb.push('<button type="button" class="ptl-btn" data-tool="loadState">' + ICON.download + 'Durumu Yükle</button>');
                if (this.toolEnabled('resetState')) tb.push('<button type="button" class="ptl-btn" data-tool="resetState">' + ICON.reset + 'Sıfırla</button>');
                tb.push('<span class="ptl-toolbar-custom"></span>');
                tb.push('</div><div class="ptl-toolbar-right">');
                if (o.showSearch && !this.remote) tb.push('<div class="ptl-search-wrap">' + ICON.search + '<input type="text" class="ptl-search" placeholder="Ağaçta ara..." /></div>');
                tb.push('</div></div>');
            }
            if (o.keyboardHint) {
                tb.push('<div class="ptl-hint"><span>⌨️ Klavye:</span><span><kbd>↑</kbd><kbd>↓</kbd> satırlar arası gezin</span><span><kbd>→</kbd> aç / alt kayda git</span><span><kbd>←</kbd> kapat / üst kayda git</span><span><kbd>Boşluk</kbd> seç</span><span><kbd>Enter</kbd> aç/kapat</span><span><kbd>Home</kbd><kbd>End</kbd> ilk/son</span>' + (this.hasCommands() ? '<span><kbd>F2</kbd> düzenle</span><span><kbd>Del</kbd> sil</span>' : '') + '</div>');
            }
            const heightStyle = o.height ? ' style="max-height:' + parseInt(o.height, 10) + 'px"' : '';
            tb.push('<div class="ptl-scroll" tabindex="0"' + heightStyle + '><table class="ptl-table"><colgroup></colgroup><thead></thead><tbody></tbody><tfoot></tfoot></table></div>');
            tb.push('<div class="ptl-pager" style="display:none"></div><div class="ptl-toast"></div>');
            this.el.classList.add('ptl-root');
            this.el.innerHTML = tb.join('');

            this.toolbarEl = this.el.querySelector('.ptl-toolbar');
            this.scrollEl = this.el.querySelector('.ptl-scroll');
            this.table = this.el.querySelector('.ptl-table');
            this.colgroup = this.table.querySelector('colgroup');
            this.thead = this.table.querySelector('thead');
            this.tbody = this.table.querySelector('tbody');
            this.tfoot = this.table.querySelector('tfoot');
            this.pagerEl = this.el.querySelector('.ptl-pager');
            this.toastEl = this.el.querySelector('.ptl-toast');
            this.searchInput = this.el.querySelector('.ptl-search');
            this.customToolbarEl = this.el.querySelector('.ptl-toolbar-custom');

            if (o.toolbarTemplate && this.customToolbarEl) {
                const tpl = document.getElementById(o.toolbarTemplate);
                this.toolbarTplHtml = tpl ? tpl.innerHTML : '';
            }
        }

        /* ------------------------------ Render ----------------------------- */
        render() {
            this.renderHead();
            this.renderRows();
            if (!this.widthsFrozen && (this.opt.resizable || this.cols.some((c) => c.locked))) {
                this.freezeWidths();
            }
            this.applySticky();
        }

        renderHead() {
            const cols = this.visibleCols();
            const o = this.opt;
            const grouped = cols.some((c) => c.group);
            const rowSpan = grouped ? 2 : 1;
            const chk = this.hasCheckbox();
            const cmd = this.hasCommands();

            // colgroup
            let cg = '';
            if (chk) cg += '<col style="width:42px">';
            cols.forEach((c) => { cg += '<col data-field="' + esc(c.field) + '"' + (c.width ? ' style="width:' + c.width + 'px"' : '') + '>'; });
            if (cmd) cg += '<col style="width:' + (o.editable === 'inline' ? 104 : 96) + 'px">';
            this.colgroup.innerHTML = cg;

            const thFor = (c, spanRows) => {
                const sortable = (c.sortable === null ? o.sortable : c.sortable);
                const sidx = this.sort.findIndex((s) => s.field === c.field);
                let ind = '';
                if (sidx >= 0) ind = '<span class="ptl-sort-ind">' + (this.sort[sidx].dir === 'asc' ? ICON.up : ICON.down).replace('<svg', '<svg width="12" height="12"') + (this.sort.length > 1 ? '<sup>' + (sidx + 1) + '</sup>' : '') + '</span>';
                const menu = o.columnMenu ? '<button type="button" class="ptl-th-menu" data-colmenu="' + esc(c.field) + '" title="Sütun menüsü">' + ICON.menu + '</button>' : '';
                const cls = 'ptl-th' + (sortable ? ' ptl-th-sortable' : '') + (o.reorderable ? ' ptl-reorderable' : '') + (c.locked ? ' ptl-locked' : '');
                const resizer = o.resizable ? '<span class="ptl-resizer" data-resize="' + esc(c.field) + '"></span>' : '';
                return '<th class="' + cls + '" data-field="' + esc(c.field) + '"' + (spanRows > 1 ? ' rowspan="' + spanRows + '"' : '') + (o.reorderable ? ' draggable="true"' : '') + ' style="text-align:' + c.align + '">'
                    + '<div class="ptl-th-inner"><span class="ptl-th-title">' + esc(c.title) + '</span>' + ind + menu + '</div>' + resizer + '</th>';
            };

            let h = '';
            if (grouped) {
                h += '<tr class="ptl-head-row1">';
                if (chk) h += '<th class="ptl-chk" rowspan="2"><input type="checkbox" class="ptl-check ptl-check-all"></th>';
                let i = 0;
                while (i < cols.length) {
                    const c = cols[i];
                    if (!c.group) { h += thFor(c, 2); i++; continue; }
                    let j = i;
                    while (j < cols.length && cols[j].group === c.group) j++;
                    h += '<th class="ptl-group-th" colspan="' + (j - i) + '">' + esc(c.group) + '</th>';
                    i = j;
                }
                if (cmd) h += '<th class="ptl-cmd" rowspan="2">İşlemler</th>';
                h += '</tr><tr class="ptl-head-row2">';
                cols.forEach((c) => { if (c.group) h += thFor(c, 1); });
                h += '</tr>';
            } else {
                h += '<tr>';
                if (chk) h += '<th class="ptl-chk"><input type="checkbox" class="ptl-check ptl-check-all"></th>';
                cols.forEach((c) => { h += thFor(c, 1); });
                if (cmd) h += '<th class="ptl-cmd">İşlemler</th>';
                h += '</tr>';
            }

            if (o.filterable) {
                h += '<tr class="ptl-filter-row">';
                if (chk) h += '<th></th>';
                cols.forEach((c) => {
                    if (c.filterable === false) { h += '<th></th>'; return; }
                    const raw = this.filters[c.field] ? this.filters[c.field].raw : '';
                    let input;
                    if (c.type === 'boolean') {
                        input = '<select class="ptl-filter-input" data-filter="' + esc(c.field) + '"><option value="">Tümü</option><option value="true"' + (raw === 'true' ? ' selected' : '') + '>Evet</option><option value="false"' + (raw === 'false' ? ' selected' : '') + '>Hayır</option></select>';
                    } else if (c.type === 'select') {
                        input = '<select class="ptl-filter-input" data-filter="' + esc(c.field) + '"><option value="">Tümü</option>' + (c.options || []).map((op) => '<option' + (raw === op ? ' selected' : '') + '>' + esc(op) + '</option>').join('') + '</select>';
                    } else if (c.type === 'date') {
                        input = '<input type="date" class="ptl-filter-input" data-filter="' + esc(c.field) + '" value="' + esc(raw) + '">';
                    } else {
                        input = '<input type="text" class="ptl-filter-input" data-filter="' + esc(c.field) + '" placeholder="' + (c.type === 'number' ? '>100, =50…' : 'Filtrele…') + '" value="' + esc(raw) + '">';
                    }
                    h += '<th>' + input + '</th>';
                });
                if (cmd) h += '<th><button type="button" class="ptl-btn" style="padding:.2rem .45rem;font-size:10px" data-tool="clearFilters" title="Filtreleri temizle">' + ICON.x + '</button></th>';
                h += '</tr>';
            }
            this.thead.innerHTML = h;
        }

        renderRows() {
            const rows = this.computeRows();
            const cols = this.visibleCols();
            const span = cols.length + (this.hasCheckbox() ? 1 : 0) + (this.hasCommands() ? 1 : 0);
            let html = '';
            if (this.loadError) {
                html = '<tr><td colspan="' + span + '" class="ptl-error">' + esc(this.loadError) + '</td></tr>';
            } else if (!rows.length) {
                html = '<tr><td colspan="' + span + '" class="ptl-empty">' + esc(this.opt.emptyText) + '</td></tr>';
            } else {
                html = rows.map((r) => this.rowHtml(r, cols)).join('');
            }
            this.tbody.innerHTML = html;
            this.renderFoot(cols);
            this.renderPager();
            this.updateToolbar();
            this.refreshSelectionUI();
            this.applySticky();
        }

        rowHtml(r, cols) {
            const n = r.node;
            const sel = this.selected.has(n.id);
            const act = this.activeId === n.id;
            const rowEdit = this.edit && this.edit.id === n.id && this.opt.editable === 'inline';
            let cls = 'ptl-row' + (sel ? ' ptl-selected' : '') + (act ? ' ptl-active' : '') + (rowEdit ? ' ptl-editing' : '') + (n.hasChildren ? ' ptl-parent' : '');
            let tds = '';
            if (this.hasCheckbox()) tds += '<td class="ptl-chk"><input type="checkbox" class="ptl-check ptl-check-row" data-id="' + esc(n.id) + '"></td>';
            if (this.opt.rowTemplate && typeof window[this.opt.rowTemplate] === 'function') {
                tds += window[this.opt.rowTemplate]({
                    id: n.id, parentId: n.parentId, level: r.level, values: n.values, hasChildren: n.hasChildren, expanded: r.expanded,
                    indent: r.level * 22, toggle: this.toggleHtml(n, r), esc: esc, fmt: (f, v) => { const c = this.colByField(f); return c ? fmtText(c, v) : v; }
                });
            } else {
                cols.forEach((c) => { tds += this.cellHtml(c, n, r, rowEdit); });
            }
            if (this.hasCommands()) tds += this.commandHtml(n, rowEdit);
            const drag = this.opt.draggable && !this.edit ? ' draggable="true"' : '';
            return '<tr class="' + cls + '" data-id="' + esc(n.id) + '" data-level="' + r.level + '"' + drag + '>' + tds + '</tr>';
        }

        toggleHtml(n, r) {
            if (n.loading) return '<span class="ptl-spin"></span>';
            if (!n.hasChildren) return '<span class="ptl-toggle-spacer"></span>';
            return '<button type="button" class="ptl-toggle' + (r.expanded ? ' ptl-open' : '') + '" data-toggle tabindex="-1" aria-label="' + (r.expanded ? 'Daralt' : 'Genişlet') + '">' + ICON.chevron + '</button>';
        }

        highlight(text) {
            const t = esc(text);
            if (!this.search || !t) return t;
            const q = esc(this.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            try { return t.replace(new RegExp('(' + q + ')', 'gi'), '<mark class="ptl-mark">$1</mark>'); } catch (e) { return t; }
        }

        displayHtml(c, n, r) {
            const v = n.values[c.field];
            if ((this.opt.aggregates === 'parent' || this.opt.aggregates === 'both') && c.aggregate && n.hasChildren && this.childrenOf(n.id).length) {
                const av = this.aggregateFor(c, n.id);
                return '<span class="ptl-agg" title="Alt kayıtların ' + (AGG_LABEL[c.aggregate] || '').toLowerCase() + ' değeri">' + esc(fmtText(c, av)) + '</span>';
            }
            if (isEmpty(v)) return '';
            switch (c.format) {
                case 'currency': return '<span class="ptl-money">' + esc(fmtText(c, v)) + '</span>';
                case 'badge': return '<span class="ptl-badge ' + badgeClass(v) + '">' + this.highlight(v) + '</span>';
                case 'progress': {
                    const p = Math.max(0, Math.min(100, Number(v) || 0));
                    return '<div class="ptl-progress"><div class="ptl-progress-bar"><div class="ptl-progress-fill" style="width:' + p + '%"></div></div><span class="ptl-progress-lbl">%' + nf.format(p) + '</span></div>';
                }
                case 'boolean': return '<span class="ptl-badge ' + ((v === true || v === 'true') ? 'ptl-b-green' : 'ptl-b-slate') + '">' + fmtText(c, v) + '</span>';
                default:
                    return this.highlight(fmtText(c, v));
            }
        }

        cellHtml(c, n, r, rowEdit) {
            const cellEditing = this.cellEdit && this.cellEdit.id === n.id && this.cellEdit.field === c.field;
            const popupMode = this.opt.editable === 'popup';
            let inner;
            if ((rowEdit && c.editable !== false) || cellEditing) inner = this.editorHtml(c, n.values[c.field]);
            else inner = this.displayHtml(c, n, r);
            if (c.isTreeColumn) {
                inner = '<div class="ptl-treecell" style="padding-left:' + (r.level * 22) + 'px">' + this.toggleHtml(n, r) + '<span class="ptl-treetext">' + inner + '</span></div>';
            }
            const editableCell = this.opt.editable === 'incell' && c.editable !== false && !cellEditing;
            const cls = 'ptl-cell ptl-a-' + c.align + (editableCell ? ' ptl-cell-editable' : '') + (c.locked ? ' ptl-locked' : '');
            return '<td class="' + cls + '" data-field="' + esc(c.field) + '"' + (cellEditing || (c.format === 'badge' || c.format === 'progress') ? '' : ' title="' + esc(fmtText(c, n.values[c.field])) + '"') + '>' + inner + '</td>';
        }

        editorHtml(c, value) {
            const f = esc(c.field);
            if (c.type === 'boolean') return '<input type="checkbox" class="ptl-input-chk" data-edit-field="' + f + '"' + ((value === true || value === 'true') ? ' checked' : '') + '>';
            if (c.type === 'select' || (c.options && c.options.length)) {
                return '<select class="ptl-input" data-edit-field="' + f + '">' + (c.options || []).map((op) => '<option' + (String(value) === String(op) ? ' selected' : '') + '>' + esc(op) + '</option>').join('') + '</select>';
            }
            if (c.type === 'number') return '<input type="number" step="any" class="ptl-input" data-edit-field="' + f + '" value="' + esc(isEmpty(value) ? '' : value) + '">';
            if (c.type === 'date') return '<input type="date" class="ptl-input" data-edit-field="' + f + '" value="' + esc(toIsoDate(value)) + '">';
            return '<input type="text" class="ptl-input" data-edit-field="' + f + '" value="' + esc(isEmpty(value) ? '' : value) + '">';
        }

        commandHtml(n, rowEdit) {
            const mode = this.opt.editable;
            let b = '';
            if (rowEdit) {
                b = '<button type="button" class="ptl-cmd-btn ptl-c-ok" data-cmd="save" title="Kaydet">' + ICON.check + '</button><button type="button" class="ptl-cmd-btn" data-cmd="cancel" title="İptal">' + ICON.x + '</button>';
            } else {
                if (mode === 'inline' || mode === 'popup') b += '<button type="button" class="ptl-cmd-btn" data-cmd="edit" title="Düzenle">' + ICON.edit + '</button>';
                b += '<button type="button" class="ptl-cmd-btn" data-cmd="addChild" title="Alt kayıt ekle">' + ICON.plus + '</button>';
                b += '<button type="button" class="ptl-cmd-btn ptl-c-del" data-cmd="remove" title="Sil">' + ICON.trash + '</button>';
            }
            return '<td class="ptl-cmd">' + b + '</td>';
        }

        aggregateFor(c, nodeId) {
            let list;
            if (nodeId == null) {
                list = this.nodes.filter((n) => !this.childrenOf(n.id).length && (!this.shown || this.shown.has(n.id)));
            } else {
                list = this.descendants(nodeId).filter((n) => !this.childrenOf(n.id).length);
            }
            return aggCompute(c.aggregate, list.map((n) => n.values[c.field]));
        }

        renderFoot(cols) {
            const mode = this.opt.aggregates;
            if ((mode !== 'footer' && mode !== 'both') || !cols.some((c) => c.aggregate)) { this.tfoot.innerHTML = ''; return; }
            let h = '<tr class="ptl-foot">';
            if (this.hasCheckbox()) h += '<td></td>';
            cols.forEach((c, i) => {
                let txt = '';
                if (c.aggregate) txt = '<span class="ptl-agg" title="' + (AGG_LABEL[c.aggregate] || '') + '">' + esc(fmtText(c.aggregate === 'count' ? Object.assign({}, c, { format: 'number' }) : c, this.aggregateFor(c, null))) + '</span>';
                else if (c.isTreeColumn || i === 0) txt = '<span style="color:#475569">Genel Toplam</span>';
                h += '<td class="ptl-a-' + c.align + (c.locked ? ' ptl-locked' : '') + '" data-agg-field="' + esc(c.field) + '">' + txt + '</td>';
            });
            if (this.hasCommands()) h += '<td></td>';
            h += '</tr>';
            this.tfoot.innerHTML = h;
        }

        refreshAggregates() {
            // Hücre içi düzenlemede DOM'u yeniden kurmadan toplamları güncelle
            this.tbody.querySelectorAll('tr.ptl-row').forEach((tr) => {
                const n = this.node(tr.dataset.id);
                if (!n || !n.hasChildren) return;
                this.visibleCols().forEach((c) => {
                    if (!c.aggregate) return;
                    const td = tr.querySelector('td[data-field="' + cssEsc(c.field) + '"]');
                    const span = td && td.querySelector('.ptl-agg');
                    if (span) span.textContent = fmtText(c, this.aggregateFor(c, n.id));
                });
            });
            this.renderFoot(this.visibleCols());
            this.applySticky();
        }

        renderPager() {
            if (!this.opt.pageable) { this.pagerEl.style.display = 'none'; return; }
            const total = this.rootCount || 0;
            const pages = Math.max(1, Math.ceil(total / this.pageSize));
            if (this.page > pages) this.page = pages;
            const from = total ? (this.page - 1) * this.pageSize + 1 : 0;
            const to = Math.min(total, this.page * this.pageSize);
            let nums = '';
            const start = Math.max(1, Math.min(this.page - 2, pages - 4));
            const end = Math.min(pages, start + 4);
            for (let p = start; p <= end; p++) nums += '<button type="button" class="ptl-pg' + (p === this.page ? ' ptl-pg-cur' : '') + '" data-page="' + p + '">' + p + '</button>';
            const sizeList = Array.from(new Set(this.opt.pageSizes.concat([this.pageSize]))).sort((a, b) => a - b);
            const sizes = sizeList.map((s) => '<option value="' + s + '"' + (s === this.pageSize ? ' selected' : '') + '>' + s + '</option>').join('');
            this.pagerEl.innerHTML =
                '<div>' + from + '–' + to + ' / ' + total + ' kök kayıt <span style="opacity:.7">(alt kayıtlar dahil değil)</span></div>' +
                '<div class="ptl-pager-btns"><button type="button" class="ptl-pg" data-page="1"' + (this.page === 1 ? ' disabled' : '') + '>«</button>' +
                '<button type="button" class="ptl-pg" data-page="' + (this.page - 1) + '"' + (this.page === 1 ? ' disabled' : '') + '>‹</button>' + nums +
                '<button type="button" class="ptl-pg" data-page="' + (this.page + 1) + '"' + (this.page === pages ? ' disabled' : '') + '>›</button>' +
                '<button type="button" class="ptl-pg" data-page="' + pages + '"' + (this.page === pages ? ' disabled' : '') + '>»</button></div>' +
                '<div>Sayfa başına <select class="ptl-pagesize">' + sizes + '</select></div>';
            this.pagerEl.style.display = '';
        }

        updateToolbar() {
            const badge = this.el.querySelector('.ptl-count');
            if (badge) badge.textContent = this.remote ? (this.nodes.length + ' kayıt yüklendi') : (this.nodes.length + ' Kayıt');
            if (this.customToolbarEl && this.toolbarTplHtml) {
                const html = this.toolbarTplHtml
                    .replace(/\{\{count\}\}/g, this.nodes.length)
                    .replace(/\{\{selected\}\}/g, this.selected.size)
                    .replace(/\{\{title\}\}/g, esc(this.opt.title || ''));
                if (this.customToolbarEl.dataset.rendered !== html) {
                    // yalnızca değiştiğinde yeniden yaz (odak kaybını önlemek için)
                    const active = document.activeElement;
                    if (!(active && this.customToolbarEl.contains(active))) {
                        this.customToolbarEl.innerHTML = html;
                        this.customToolbarEl.dataset.rendered = html;
                    }
                }
            }
        }

        refreshSelectionUI() {
            const chkAll = this.thead.querySelector('.ptl-check-all');
            this.tbody.querySelectorAll('tr.ptl-row').forEach((tr) => {
                const id = tr.dataset.id;
                tr.classList.toggle('ptl-selected', this.selected.has(id));
                tr.classList.toggle('ptl-active', this.activeId === id);
                const cb = tr.querySelector('.ptl-check-row');
                if (cb) {
                    const st = this.checkState(id);
                    cb.checked = st === true;
                    cb.indeterminate = st === 'mixed';
                }
            });
            if (chkAll) {
                const roots = this.childrenOf(null);
                const all = roots.length && roots.every((r) => this.selected.has(r.id));
                chkAll.checked = !!all;
                chkAll.indeterminate = !all && this.selected.size > 0;
            }
        }

        checkState(id) {
            if (this.selected.has(id)) return true;
            const kids = this.descendants(id);
            if (kids.some((k) => this.selected.has(k.id))) return 'mixed';
            return false;
        }

        applySticky() {
            // Çok katmanlı başlıkta 2. satırın üst boşluğu
            const r1 = this.thead.querySelector('.ptl-head-row1');
            const r2 = this.thead.querySelector('.ptl-head-row2');
            if (r1 && r2) {
                const h = r1.getBoundingClientRect().height;
                r2.querySelectorAll('th').forEach((th) => { th.style.top = h + 'px'; });
            }
            const fr = this.thead.querySelector('.ptl-filter-row');
            if (fr) {
                let top = 0;
                this.thead.querySelectorAll('tr:not(.ptl-filter-row)').forEach((tr) => { top += tr.getBoundingClientRect().height; });
                fr.querySelectorAll('th').forEach((th) => { th.style.position = 'sticky'; th.style.top = top + 'px'; });
            }
            // Dondurulmuş sütunlar
            const cols = this.visibleCols();
            const lockedCols = cols.filter((c) => c.locked);
            if (!lockedCols.length) return;
            const refRow = this.tbody.querySelector('tr.ptl-row') || this.thead.querySelector('tr');
            if (!refRow) return;
            const cells = Array.from(refRow.children);
            const offset = this.hasCheckbox() ? 1 : 0;
            let left = 0;
            const lefts = [];
            const count = offset + lockedCols.length;
            for (let i = 0; i < count && i < cells.length; i++) {
                lefts.push(left);
                left += cells[i].getBoundingClientRect().width;
            }
            this.table.querySelectorAll('tr').forEach((tr) => {
                for (let i = 0; i < count && i < tr.children.length; i++) {
                    const cell = tr.children[i];
                    if (tr.classList.contains('ptl-head-row2') || cell.colSpan > 1) continue;
                    cell.classList.add('ptl-locked');
                    cell.style.left = lefts[i] + 'px';
                    cell.classList.toggle('ptl-locked-last', i === count - 1);
                }
            });
        }

        freezeWidths() {
            // Ölçülen sütun genişliklerini sabitle (boyutlandırma / dondurma için)
            const refRow = this.thead.querySelector('tr:not(.ptl-head-row1)') || this.thead.querySelector('tr');
            if (!refRow || !this.table.getBoundingClientRect().width) return;
            const cols = this.visibleCols();
            const ths = this.thead.querySelectorAll('th[data-field]');
            const map = {};
            ths.forEach((th) => { map[th.dataset.field] = th.getBoundingClientRect().width; });
            cols.forEach((c) => { if (!c.width && map[c.field]) c.width = Math.round(map[c.field]); });
            this.widthsFrozen = true;
            this.applyColWidths();
        }

        applyColWidths() {
            const cols = this.visibleCols();
            let sum = (this.hasCheckbox() ? 42 : 0) + (this.hasCommands() ? (this.opt.editable === 'inline' ? 104 : 96) : 0);
            cols.forEach((c) => { sum += (c.width || 120); });
            this.colgroup.querySelectorAll('col[data-field]').forEach((col) => {
                const c = this.colByField(col.dataset.field);
                if (c && c.width) col.style.width = c.width + 'px';
            });
            this.table.style.width = sum + 'px';
            this.table.style.minWidth = '';
        }

        toast(msg) {
            if (!this.toastEl) return;
            this.toastEl.textContent = msg;
            this.toastEl.classList.add('ptl-toast-show');
            clearTimeout(this._toastT);
            this._toastT = setTimeout(() => this.toastEl.classList.remove('ptl-toast-show'), 2200);
        }

        /* ------------------------------ Olaylar ---------------------------- */
        on(name, fn) {
            (this.handlers[name] = this.handlers[name] || []).push(fn);
            return this;
        }

        trigger(name, data) {
            data = data || {};
            const cbName = this.opt.callbacks && this.opt.callbacks[name];
            if (cbName && typeof window[cbName] === 'function') window[cbName](data);
            if (this.opt.onEvent && typeof window[this.opt.onEvent] === 'function') window[this.opt.onEvent](Object.assign({ type: name }, data));
            (this.handlers[name] || []).forEach((fn) => fn(data));
            this.el.dispatchEvent(new CustomEvent('ptl:' + name, { detail: data, bubbles: true }));
        }

        bindEvents() {
            const el = this.el;

            // Araç çubuğu
            el.addEventListener('click', (e) => {
                const tool = e.target.closest('[data-tool]');
                if (tool && el.contains(tool)) { this.handleTool(tool.dataset.tool); return; }

                const pg = e.target.closest('.ptl-pg');
                if (pg && !pg.disabled) { this.goToPage(parseInt(pg.dataset.page, 10)); return; }

                const mbtn = e.target.closest('[data-colmenu]');
                if (mbtn) { e.stopPropagation(); this.openColumnMenu(mbtn, mbtn.dataset.colmenu); return; }
            });

            const search = this.searchInput;
            if (search) {
                let t;
                search.addEventListener('input', () => {
                    clearTimeout(t);
                    t = setTimeout(() => {
                        this.search = search.value;
                        this.page = 1;
                        this.renderRows();
                        this.trigger('search', { value: this.search });
                        this.persist();
                    }, 120);
                });
            }

            const pagerSel = (e) => {
                if (e.target.classList.contains('ptl-pagesize')) {
                    this.pageSize = parseInt(e.target.value, 10);
                    this.page = 1;
                    if (this.remote) this.reloadRemote(); else this.renderRows();
                    this.trigger('page', { page: this.page, pageSize: this.pageSize });
                    this.persist();
                }
            };
            el.addEventListener('change', pagerSel);

            // Başlık: sıralama, filtre, sütun sürükleme, boyutlandırma, tümünü seç
            this.thead.addEventListener('click', (e) => {
                if (e.target.closest('[data-colmenu]') || e.target.closest('.ptl-resizer') || e.target.closest('.ptl-filter-input') || e.target.closest('[data-tool]')) return;
                if (e.target.classList.contains('ptl-check-all')) {
                    this.toggleAll(e.target.checked);
                    return;
                }
                const th = e.target.closest('th.ptl-th');
                if (!th) return;
                const c = this.colByField(th.dataset.field);
                if (!c) return;
                const sortable = c.sortable === null ? this.opt.sortable : c.sortable;
                if (sortable) this.toggleSort(c.field, e.shiftKey);
            });

            let ft;
            const onFilter = (e) => {
                const inp = e.target.closest('[data-filter]');
                if (!inp) return;
                clearTimeout(ft);
                ft = setTimeout(() => this.setFilter(inp.dataset.filter, inp.value), e.type === 'input' ? 200 : 0);
            };
            this.thead.addEventListener('input', onFilter);
            this.thead.addEventListener('change', onFilter);

            this.initColumnDnD();
            this.initResize();

            // Gövde
            this.tbody.addEventListener('click', (e) => this.onBodyClick(e));
            this.tbody.addEventListener('dblclick', (e) => {
                if (this.opt.editable === 'inline' || this.opt.editable === 'popup') {
                    const tr = e.target.closest('tr.ptl-row');
                    if (tr && !e.target.closest('.ptl-cmd-btn,.ptl-toggle,input,select')) this.beginEdit(tr.dataset.id);
                }
            });
            this.tbody.addEventListener('change', (e) => {
                if (e.target.classList.contains('ptl-check-row')) this.toggleCheck(e.target.dataset.id, e.target.checked);
            });
            this.tbody.addEventListener('focusout', (e) => this.onCellBlur(e));
            this.tbody.addEventListener('keydown', (e) => this.onEditorKey(e));

            this.initRowDnD();

            if (this.opt.keyboard) this.scrollEl.addEventListener('keydown', (e) => this.onKeyNav(e));
        }

        handleTool(t) {
            switch (t) {
                case 'create': this.createNew(); break;
                case 'expandAll': this.expandAll(); break;
                case 'collapseAll': this.collapseAll(); break;
                case 'excel': this.exportExcel(); break;
                case 'pdf': this.exportPdf(); break;
                case 'saveState': this.saveState(); break;
                case 'loadState': this.loadState(); break;
                case 'resetState': this.resetState(); break;
                case 'clearFilters': this.clearFilters(); break;
            }
        }

        /* --------------------------- Seçim & tıklama ------------------------ */
        onBodyClick(e) {
            const tr = e.target.closest('tr.ptl-row');
            if (!tr) return;
            const id = tr.dataset.id;

            const cmd = e.target.closest('[data-cmd]');
            if (cmd) { e.stopPropagation(); this.handleCommand(cmd.dataset.cmd, id); return; }

            if (e.target.closest('[data-toggle]')) { e.stopPropagation(); this.toggleNode(id); return; }
            if (e.target.closest('.ptl-check-row') || e.target.closest('input,select,textarea')) return;

            // Hücre içi düzenleme
            if (this.opt.editable === 'incell') {
                const td = e.target.closest('td[data-field]');
                if (td) {
                    const col = this.colByField(td.dataset.field);
                    if (col && col.editable !== false && !(this.cellEdit && this.cellEdit.id === id && this.cellEdit.field === col.field)) {
                        this.activeId = id;
                        this.beginCellEdit(id, col.field);
                        return;
                    }
                }
            }

            this.activeId = id;
            const mode = this.opt.selectable;
            if (mode === 'single') {
                this.selected = new Set([id]);
            } else if (mode === 'multiple') {
                if (e.ctrlKey || e.metaKey) {
                    if (this.selected.has(id)) this.selected.delete(id); else this.selected.add(id);
                } else if (e.shiftKey && this.lastClicked) {
                    const ids = this.rows.map((r) => r.node.id);
                    const a = ids.indexOf(this.lastClicked), b = ids.indexOf(id);
                    if (a >= 0 && b >= 0) { this.selected = new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)); }
                } else {
                    this.selected = new Set([id]);
                }
                this.lastClicked = id;
            }
            this.refreshSelectionUI();
            const n = this.node(id);
            this.trigger('select', { id: id, parentId: n ? n.parentId : null, level: parseInt(tr.dataset.level, 10), element: tr, values: n ? n.values : null, selected: Array.from(this.selected) });
            if (mode !== 'none') this.trigger('change', { selected: Array.from(this.selected) });
        }

        toggleCheck(id, checked) {
            const n = this.node(id);
            if (!n) return;
            const apply = (x) => { if (checked) this.selected.add(x.id); else this.selected.delete(x.id); this.childrenOf(x.id).forEach(apply); };
            apply(n);
            let p = n.parentId;
            while (p != null) {
                const kids = this.childrenOf(p);
                if (kids.every((k) => this.selected.has(k.id))) this.selected.add(p); else this.selected.delete(p);
                const pn = this.node(p);
                p = pn ? pn.parentId : null;
            }
            this.refreshSelectionUI();
            this.updateToolbar();
            this.trigger('change', { selected: Array.from(this.selected), id: id, checked: checked });
        }

        toggleAll(checked) {
            this.selected = checked ? new Set(this.nodes.map((n) => n.id)) : new Set();
            this.refreshSelectionUI();
            this.updateToolbar();
            this.trigger('change', { selected: Array.from(this.selected), all: checked });
        }

        getSelected() { return Array.from(this.selected); }
        getSelectedItems() { return this.getSelected().map((id) => { const n = this.node(id); return n ? { id: n.id, parentId: n.parentId, values: n.values } : null; }).filter(Boolean); }
        clearSelection() { this.selected = new Set(); this.refreshSelectionUI(); this.updateToolbar(); this.trigger('change', { selected: [] }); }
        selectAll() { this.toggleAll(true); }

        select(id) {
            id = String(id);
            const n = this.node(id);
            if (!n) return;
            let p = n.parentId;
            while (p != null) { const pn = this.node(p); if (pn) pn.expanded = true; p = pn ? pn.parentId : null; }
            if (this.opt.pageable && !this.remote) this.gotoPageOfNode(id);
            this.activeId = id;
            if (this.opt.selectable === 'checkbox') this.selected.add(id); else if (this.opt.selectable !== 'none') this.selected = new Set([id]);
            this.renderRows();
            const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(id) + '"]');
            if (tr) tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.trigger('select', { id: id, parentId: n.parentId, level: this.levelOf(id), element: tr, values: n.values, selected: Array.from(this.selected) });
        }

        levelOf(id) { let l = 0; let n = this.node(id); while (n && n.parentId != null) { l++; n = this.node(n.parentId); } return l; }

        gotoPageOfNode(id) {
            let n = this.node(id);
            while (n && n.parentId != null) n = this.node(n.parentId);
            if (!n) return;
            let roots = this.childrenOf(null);
            const shown = this.computeShown();
            if (shown) roots = roots.filter((r) => shown.has(r.id));
            roots = this.sortSiblings(roots);
            const idx = roots.findIndex((r) => r.id === n.id);
            if (idx >= 0) this.page = Math.floor(idx / this.pageSize) + 1;
        }

        /* --------------------------- Genişlet / daralt ---------------------- */
        async toggleNode(id) {
            const n = this.node(id);
            if (!n) return;
            const willExpand = !(this.rows.find((r) => r.node.id === id) || { expanded: n.expanded }).expanded;
            n.expanded = willExpand;
            if (willExpand && this.remote && n.hasChildren && !n.loaded) {
                await this.loadChildren(n);
            } else {
                this.renderRows();
            }
            this.trigger(willExpand ? 'expand' : 'collapse', { id: n.id, expanded: willExpand, values: n.values });
            this.persist();
        }

        expand(id) {
            const n = this.node(id);
            if (!n || (n.expanded && (n.loaded || !this.remote))) return;
            n.expanded = true;
            if (this.remote && n.hasChildren && !n.loaded) this.loadChildren(n); else this.renderRows();
            this.trigger('expand', { id: n.id, expanded: true, values: n.values });
        }

        collapse(id) {
            const n = this.node(id);
            if (!n || !n.expanded) return;
            n.expanded = false;
            this.renderRows();
            this.trigger('collapse', { id: n.id, expanded: false, values: n.values });
        }

        expandAll() {
            this.nodes.forEach((n) => { if (n.hasChildren) n.expanded = true; });
            this.renderRows();
            this.trigger('expand', { all: true });
            this.persist();
        }

        collapseAll() {
            this.nodes.forEach((n) => { if (n.hasChildren) n.expanded = false; });
            this.renderRows();
            this.trigger('collapse', { all: true });
            this.persist();
        }

        /* ------------------------ Sıralama & filtre ------------------------- */
        toggleSort(field, multi) {
            const cur = this.sort.find((s) => s.field === field);
            let next;
            if (!cur) next = 'asc'; else if (cur.dir === 'asc') next = 'desc'; else next = null;
            this.sortBy(field, next, multi);
        }

        sortBy(field, dir, multi) {
            if (!multi) this.sort = this.sort.filter((s) => s.field === field);
            this.sort = this.sort.filter((s) => s.field !== field);
            if (dir) this.sort.push({ field: field, dir: dir });
            this.afterQueryChange();
            this.trigger('sort', { sort: this.sort.slice() });
        }

        clearSort() { this.sort = []; this.afterQueryChange(); this.trigger('sort', { sort: [] }); }

        setFilter(field, raw) {
            const col = this.colByField(field);
            if (!col) return;
            const f = buildFilter(col, raw);
            if (f) this.filters[field] = f; else delete this.filters[field];
            this.page = 1;
            if (this.remote) this.reloadRemote(); else this.renderRows();
            this.trigger('filter', { filters: this.currentFilters() });
            this.persist();
        }

        currentFilters() { const o = {}; Object.keys(this.filters).forEach((k) => { o[k] = { op: this.filters[k].op, value: this.filters[k].value }; }); return o; }

        filter(arg) {
            // API: filter('metin') => arama; filter({alan:'değer'}) => sütun filtresi
            if (typeof arg === 'string') { this.search = arg; if (this.searchInput) this.searchInput.value = arg; this.page = 1; this.renderRows(); this.trigger('search', { value: arg }); return; }
            this.filters = {};
            Object.keys(arg || {}).forEach((k) => { const c = this.colByField(k); const f = c && buildFilter(c, arg[k]); if (f) this.filters[k] = f; });
            this.page = 1;
            this.renderHead();
            if (this.remote) this.reloadRemote(); else this.renderRows();
            this.trigger('filter', { filters: this.currentFilters() });
        }

        clearFilters() {
            this.filters = {};
            this.search = '';
            if (this.searchInput) this.searchInput.value = '';
            this.page = 1;
            this.renderHead();
            if (this.remote) this.reloadRemote(); else this.renderRows();
            this.applySticky();
            this.trigger('filter', { filters: {} });
            this.persist();
        }

        setSearchFields(fields) {
            this.opt.searchFields = fields;
            this.renderRows();
        }

        afterQueryChange() {
            this.page = this.remote ? 1 : this.page;
            this.renderHead();
            if (this.remote) this.reloadRemote(); else this.renderRows();
            this.applySticky();
            this.persist();
        }

        goToPage(p) {
            const pages = Math.max(1, Math.ceil((this.rootCount || 0) / this.pageSize));
            p = Math.max(1, Math.min(pages, p));
            if (p === this.page) return;
            this.page = p;
            if (this.remote) this.reloadRemote(); else this.renderRows();
            this.trigger('page', { page: p, pageSize: this.pageSize });
            this.persist();
        }

        /* --------------------------- Sütun menüsü -------------------------- */
        closeMenu() {
            if (this.menuEl) { this.menuEl.remove(); this.menuEl = null; }
            document.removeEventListener('mousedown', this._menuOutside, true);
            document.removeEventListener('keydown', this._menuKey, true);
        }

        openColumnMenu(btn, field) {
            this.closeMenu();
            const c = this.colByField(field);
            if (!c) return;
            const sortable = c.sortable === null ? this.opt.sortable : c.sortable;
            const m = document.createElement('div');
            m.className = 'ptl-menu';
            let h = '';
            if (sortable) {
                h += '<button type="button" class="ptl-menu-item" data-m="asc">' + ICON.up + 'Artan Sırala</button>';
                h += '<button type="button" class="ptl-menu-item" data-m="desc">' + ICON.down + 'Azalan Sırala</button>';
                h += '<button type="button" class="ptl-menu-item" data-m="nosort">' + ICON.x + 'Sıralamayı Kaldır</button>';
                h += '<div class="ptl-menu-sep"></div>';
            }
            if (this.opt.lockable) {
                h += '<button type="button" class="ptl-menu-item" data-m="lock">' + ICON.lock + (c.locked ? 'Sütunun Kilidini Aç' : 'Sütunu Kilitle') + '</button>';
                h += '<div class="ptl-menu-sep"></div>';
            }
            h += '<div class="ptl-menu-title">Sütunlar</div>';
            this.cols.forEach((col) => {
                h += '<label class="ptl-menu-item"><input type="checkbox" data-mcol="' + esc(col.field) + '"' + (col.hidden ? '' : ' checked') + '> ' + esc(col.title) + '</label>';
            });
            if (this.opt.filterable !== false && c.filterable !== false) {
                const raw = this.filters[c.field] ? this.filters[c.field].raw : '';
                h += '<div class="ptl-menu-sep"></div><div class="ptl-menu-title">Filtre</div>';
                h += '<div style="padding:.2rem .5rem;display:flex;gap:.3rem"><input type="text" class="ptl-filter-input" data-mfilter value="' + esc(raw) + '" placeholder="' + (c.type === 'number' ? '>100, =50…' : 'içerir…') + '"><button type="button" class="ptl-btn ptl-btn-primary" style="padding:.2rem .5rem" data-m="applyFilter">' + ICON.check + '</button></div>';
            }
            m.innerHTML = h;
            document.body.appendChild(m);
            const r = btn.getBoundingClientRect();
            const mw = m.offsetWidth, mh = m.offsetHeight;
            m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.left)) + 'px';
            m.style.top = Math.max(8, Math.min(window.innerHeight - mh - 8, r.bottom + 4)) + 'px';
            this.menuEl = m;

            m.addEventListener('click', (e) => {
                const it = e.target.closest('[data-m]');
                if (!it) return;
                const a = it.dataset.m;
                if (a === 'asc' || a === 'desc') { this.closeMenu(); this.sortBy(field, a, false); }
                else if (a === 'nosort') { this.closeMenu(); this.sortBy(field, null, true); }
                else if (a === 'lock') { this.closeMenu(); this.toggleLock(field); }
                else if (a === 'applyFilter') { const v = m.querySelector('[data-mfilter]').value; this.closeMenu(); this.renderHead(); this.setFilter(field, v); this.renderHead(); this.applySticky(); }
            });
            m.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-mfilter]')) { const v = e.target.value; this.closeMenu(); this.setFilter(field, v); this.renderHead(); this.applySticky(); } });
            m.addEventListener('change', (e) => {
                const cb = e.target.closest('[data-mcol]');
                if (!cb) return;
                const col = this.colByField(cb.dataset.mcol);
                const visibleCount = this.visibleCols().length;
                if (!cb.checked && visibleCount <= 1) { cb.checked = true; return; }
                col.hidden = !cb.checked;
                this.widthsFrozen = false;
                this.render();
                this.trigger(col.hidden ? 'columnHide' : 'columnShow', { field: col.field });
                this.persist();
            });
            this._menuOutside = (e) => { if (!m.contains(e.target)) this.closeMenu(); };
            this._menuKey = (e) => { if (e.key === 'Escape') this.closeMenu(); };
            setTimeout(() => {
                document.addEventListener('mousedown', this._menuOutside, true);
                document.addEventListener('keydown', this._menuKey, true);
            });
        }

        toggleLock(field) {
            const c = this.colByField(field);
            if (!c) return;
            c.locked = !c.locked;
            if (c.locked) {
                // kilitli sütunları başa taşı
                const idx = this.cols.indexOf(c);
                this.cols.splice(idx, 1);
                const lastLocked = this.cols.reduce((acc, col, i) => (col.locked ? i : acc), -1);
                this.cols.splice(lastLocked + 1, 0, c);
            }
            this.widthsFrozen = false;
            this.render();
            this.trigger('columnLock', { field: field, locked: c.locked });
            this.persist();
        }

        /* ---------------- Sütun yeniden sıralama & boyutlandırma ------------- */
        initColumnDnD() {
            let dragField = null;
            this.thead.addEventListener('dragstart', (e) => {
                const th = e.target.closest && e.target.closest('th.ptl-th');
                if (!this.opt.reorderable || !th) return;
                dragField = th.dataset.field;
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', dragField); } catch (x) { }
            });
            const clear = () => this.thead.querySelectorAll('.ptl-col-drag-over-l,.ptl-col-drag-over-r').forEach((x) => x.classList.remove('ptl-col-drag-over-l', 'ptl-col-drag-over-r'));
            this.thead.addEventListener('dragover', (e) => {
                const th = e.target.closest && e.target.closest('th.ptl-th');
                if (!dragField || !th || th.dataset.field === dragField) return;
                e.preventDefault();
                clear();
                const r = th.getBoundingClientRect();
                th.classList.add(e.clientX < r.left + r.width / 2 ? 'ptl-col-drag-over-l' : 'ptl-col-drag-over-r');
            });
            this.thead.addEventListener('dragleave', (e) => { if (!this.thead.contains(e.relatedTarget)) clear(); });
            this.thead.addEventListener('drop', (e) => {
                const th = e.target.closest && e.target.closest('th.ptl-th');
                if (!dragField || !th) return;
                e.preventDefault();
                const r = th.getBoundingClientRect();
                const after = e.clientX >= r.left + r.width / 2;
                const from = dragField;
                dragField = null;
                clear();
                this.moveColumn(from, th.dataset.field, after);
            });
            this.thead.addEventListener('dragend', () => { dragField = null; clear(); });
        }

        moveColumn(from, to, after) {
            if (from === to) return;
            const a = this.colByField(from), b = this.colByField(to);
            if (!a || !b || a.locked !== b.locked) { this.toast('Kilitli ve kilitsiz sütunlar arasında taşıma yapılamaz'); return; }
            this.cols.splice(this.cols.indexOf(a), 1);
            const idx = this.cols.indexOf(b);
            this.cols.splice(after ? idx + 1 : idx, 0, a);
            this.render();
            this.trigger('columnReorder', { field: from, before: to, order: this.cols.map((c) => c.field) });
            this.persist();
        }

        initResize() {
            this.thead.addEventListener('mousedown', (e) => {
                const rz = e.target.closest && e.target.closest('.ptl-resizer');
                if (!rz) return;
                e.preventDefault();
                e.stopPropagation();
                const field = rz.dataset.resize;
                const col = this.colByField(field);
                if (!col) return;
                if (!this.widthsFrozen) this.freezeWidths();
                const startX = e.clientX;
                const startW = col.width || rz.parentElement.getBoundingClientRect().width;
                const th = rz.parentElement;
                th.classList.add('ptl-resizing');
                const move = (ev) => {
                    col.width = Math.max(50, Math.round(startW + ev.clientX - startX));
                    this.applyColWidths();
                    this.applySticky();
                };
                const up = () => {
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                    th.classList.remove('ptl-resizing');
                    this.trigger('columnResize', { field: field, width: col.width });
                    this.persist();
                };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            });
        }

        /* ------------------------------- Düzenleme -------------------------- */
        createNew(parentId) {
            parentId = parentId == null ? null : String(parentId);
            const mode = this.opt.editable;
            if (mode === 'popup') { this.openPopup(null, parentId); return; }
            const tree = this.cols.find((c) => c.isTreeColumn) || this.cols[0];
            const values = {};
            this.cols.forEach((c) => { values[c.field] = c.type === 'boolean' ? false : (c.type === 'number' ? null : ''); if (c.options && c.options.length) values[c.field] = c.options[0]; });
            if (mode === 'incell') values[tree.field] = 'Yeni Kayıt';
            const id = this.addItem(values, parentId, true);
            if (mode === 'incell') {
                this.beginCellEdit(id, tree.field);
            } else {
                this.edit = { id: id, isNew: true };
                this.renderRows();
                this.focusEditor(id);
            }
        }

        addItem(values, parentId, silent) {
            parentId = parentId == null ? null : String(parentId);
            const id = 'n' + (++this.seq) + '-' + Math.random().toString(36).slice(2, 6);
            const node = { id: id, parentId: parentId, expanded: true, values: Object.assign({}, values), hasChildren: false, loaded: true, loading: false };
            if (parentId == null && this.opt.pageable) { this.nodes.unshift(node); this.page = 1; } else this.nodes.push(node);
            if (parentId != null) { const p = this.node(parentId); if (p) { p.expanded = true; p.hasChildren = true; } }
            this.reindex();
            this.activeId = id;
            if (!silent) { this.renderRows(); this.trigger('add', { id: id, parentId: parentId, values: node.values }); this.persist(); }
            return id;
        }

        removeItem(id) {
            id = String(id);
            const n = this.node(id);
            if (!n) return false;
            const ids = new Set([id].concat(this.descendants(id).map((d) => d.id)));
            this.nodes = this.nodes.filter((x) => !ids.has(x.id));
            ids.forEach((i) => this.selected.delete(i));
            if (this.activeId && ids.has(this.activeId)) this.activeId = null;
            if (this.edit && ids.has(this.edit.id)) this.edit = null;
            this.reindex();
            this.renderRows();
            this.trigger('remove', { id: id, parentId: n.parentId, values: n.values, removed: Array.from(ids) });
            this.persist();
            return true;
        }

        updateItem(id, values) {
            const n = this.node(id);
            if (!n) return false;
            Object.assign(n.values, values);
            this.renderRows();
            this.trigger('save', { id: n.id, values: n.values });
            this.persist();
            return true;
        }

        dataItem(id) { const n = this.node(id); return n ? { id: n.id, parentId: n.parentId, expanded: n.expanded, values: n.values } : null; }
        getData() { return this.nodes.map((n) => ({ id: n.id, parentId: n.parentId, expanded: n.expanded, values: n.values })); }

        handleCommand(cmd, id) {
            switch (cmd) {
                case 'edit': this.beginEdit(id); break;
                case 'save': this.saveEdit(); break;
                case 'cancel': this.cancelEdit(); break;
                case 'addChild': this.addChildFlow(id); break;
                case 'remove': {
                    const n = this.node(id);
                    const kids = this.descendants(id).length;
                    const label = n ? (n.values[(this.cols.find((c) => c.isTreeColumn) || this.cols[0]).field] || id) : id;
                    if (window.confirm('"' + label + '" kaydı' + (kids ? ' ve ' + kids + ' alt kaydı' : '') + ' silinsin mi?')) this.removeItem(id);
                    break;
                }
            }
        }

        addChildFlow(parentId) {
            if (this.opt.editable === 'popup') { this.openPopup(null, parentId); return; }
            this.createNew(parentId);
        }

        beginEdit(id) {
            if (this.opt.editable === 'popup') { this.openPopup(id); return; }
            if (this.opt.editable === 'incell') { const t = this.cols.find((c) => c.editable !== false); if (t) this.beginCellEdit(id, t.field); return; }
            if (this.edit && this.edit.id !== id) this.cancelEdit();
            this.edit = { id: id, isNew: false };
            this.renderRows();
            this.focusEditor(id);
            this.trigger('edit', { id: id, values: (this.node(id) || {}).values });
        }

        focusEditor(id) {
            const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(id) + '"]');
            const inp = tr && tr.querySelector('[data-edit-field]');
            if (inp) { inp.focus(); if (inp.select) inp.select(); }
        }

        readInputs(root) {
            const vals = {};
            let ok = true;
            root.querySelectorAll('[data-edit-field]').forEach((inp) => {
                const f = inp.dataset.editField;
                const c = this.colByField(f);
                if (!c) return;
                let v;
                if (inp.type === 'checkbox') v = inp.checked;
                else if (c.type === 'number') v = inp.value === '' ? null : Number(inp.value);
                else v = inp.value;
                const required = c.required || c.isTreeColumn;
                const invalid = (required && (v === '' || v === null)) || (c.type === 'number' && v !== null && isNaN(v));
                inp.classList.toggle('ptl-invalid', !!invalid);
                if (invalid) ok = false;
                vals[f] = v;
            });
            return ok ? vals : null;
        }

        saveEdit() {
            if (!this.edit) return;
            const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(this.edit.id) + '"]');
            const vals = tr ? this.readInputs(tr) : null;
            if (!vals) { this.toast('Lütfen zorunlu alanları doğru doldurun'); return; }
            const n = this.node(this.edit.id);
            const wasNew = this.edit.isNew;
            Object.assign(n.values, vals);
            this.edit = null;
            this.renderRows();
            this.trigger(wasNew ? 'add' : 'save', { id: n.id, parentId: n.parentId, values: n.values });
            this.persist();
        }

        cancelEdit() {
            if (this.cellEdit) { this.cellEdit = null; this.renderRows(); return; }
            if (!this.edit) return;
            const e = this.edit;
            this.edit = null;
            if (e.isNew) { this.nodes = this.nodes.filter((x) => x.id !== e.id); this.reindex(); }
            this.renderRows();
            this.trigger('cancel', { id: e.id });
        }

        beginCellEdit(id, field) {
            if (this.cellEdit) this.commitCell(true);
            this.cellEdit = { id: id, field: field };
            const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(id) + '"]');
            const col = this.colByField(field);
            const n = this.node(id);
            const td = tr && tr.querySelector('td[data-field="' + cssEsc(field) + '"]');
            if (td && col && n) {
                const r = this.rows.find((x) => x.node.id === id) || { level: 0, expanded: n.expanded };
                td.classList.remove('ptl-cell-editable');
                const editor = this.editorHtml(col, n.values[field]);
                td.innerHTML = col.isTreeColumn ? '<div class="ptl-treecell" style="padding-left:' + (r.level * 22) + 'px">' + this.toggleHtml(n, r) + '<span class="ptl-treetext" style="flex:1">' + editor + '</span></div>' : editor;
                const inp = td.querySelector('[data-edit-field]');
                if (inp) { inp.focus(); if (inp.select) inp.select(); }
            } else {
                this.renderRows();
            }
            this.refreshSelectionUI();
            this.trigger('edit', { id: id, field: field });
        }

        commitCell(skipRender) {
            if (!this.cellEdit) return;
            const { id, field } = this.cellEdit;
            this.cellEdit = null;
            const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(id) + '"]');
            const td = tr && tr.querySelector('td[data-field="' + cssEsc(field) + '"]');
            const inp = td && td.querySelector('[data-edit-field]');
            const n = this.node(id);
            const col = this.colByField(field);
            if (inp && n && col) {
                const vals = this.readInputs(td);
                if (!vals) {
                    // geçersiz değer: düzenlemeye devam et
                    this.cellEdit = { id: id, field: field };
                    this.toast('Geçersiz değer');
                    inp.focus();
                    return;
                }
                {
                    const old = n.values[field];
                    n.values[field] = vals[field];
                    if (String(old) !== String(vals[field])) this.trigger('save', { id: id, field: field, oldValue: old, value: vals[field], values: n.values });
                }
                // hücreyi yerinde güncelle
                const r = this.rows.find((x) => x.node.id === id) || { level: 0, expanded: n.expanded };
                let inner = this.displayHtml(col, n, r);
                if (col.isTreeColumn) inner = '<div class="ptl-treecell" style="padding-left:' + (r.level * 22) + 'px">' + this.toggleHtml(n, r) + '<span class="ptl-treetext">' + inner + '</span></div>';
                td.innerHTML = inner;
                if (this.opt.editable === 'incell' && col.editable !== false) td.classList.add('ptl-cell-editable');
                this.refreshAggregates();
                this.persist();
            }
        }

        onCellBlur(e) {
            if (!this.cellEdit) return;
            const td = e.target.closest && e.target.closest('td');
            if (!td || !e.target.matches('[data-edit-field]')) return;
            // sonraki odak aynı hücrede mi?
            const tr = td.closest('tr');
            const cid = tr ? tr.dataset.id : null;
            const cfield = td.dataset.field;
            setTimeout(() => {
                if (!this.cellEdit) return;
                if (this.cellEdit.id !== cid || this.cellEdit.field !== cfield) return;
                const active = document.activeElement;
                if (active && td.contains(active)) return;
                this.commitCell();
            }, 0);
        }

        onEditorKey(e) {
            if (!e.target.matches || !e.target.matches('[data-edit-field]')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.cellEdit) { this.cellEdit = null; this.renderRows(); } else this.cancelEdit();
                this.scrollEl.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.cellEdit) { this.commitCell(); this.scrollEl.focus(); } else this.saveEdit();
            } else if (e.key === 'Tab' && this.cellEdit && this.opt.editable === 'incell') {
                const cols = this.visibleCols().filter((c) => c.editable !== false);
                const idx = cols.findIndex((c) => c.field === this.cellEdit.field);
                const next = cols[idx + (e.shiftKey ? -1 : 1)];
                if (next) { e.preventDefault(); const id = this.cellEdit.id; this.commitCell(); this.beginCellEdit(id, next.field); }
            }
        }

        openPopup(id, parentId) {
            this.closePopup();
            const node = id ? this.node(id) : null;
            const cols = this.cols.filter((c) => c.editable !== false);
            const ov = document.createElement('div');
            ov.className = 'ptl-modal-ov';
            const title = node ? 'Kaydı Düzenle' : (parentId ? 'Alt Kayıt Ekle' : 'Yeni Kayıt Ekle');
            let body = '';
            cols.forEach((c, i) => {
                const val = node ? node.values[c.field] : (c.options && c.options.length ? c.options[0] : (c.type === 'boolean' ? false : ''));
                body += '<div class="' + (c.isTreeColumn || i === 0 ? 'ptl-field-full' : '') + '"><label>' + esc(c.title) + ((c.required || c.isTreeColumn) ? ' *' : '') + '</label>' + this.editorHtml(c, val) + '</div>';
            });
            ov.innerHTML = '<div class="ptl-modal" role="dialog" aria-modal="true"><div class="ptl-modal-h">' + esc(title) + '</div><div class="ptl-modal-b">' + body + '</div><div class="ptl-modal-f"><button type="button" class="ptl-btn" data-pm="cancel">İptal</button><button type="button" class="ptl-btn ptl-btn-primary" data-pm="save">' + ICON.check + 'Kaydet</button></div></div>';
            document.body.appendChild(ov);
            this.popup = { el: ov, id: id, parentId: parentId };
            const first = ov.querySelector('[data-edit-field]');
            if (first) first.focus();
            const save = () => {
                const vals = this.readInputs(ov);
                if (!vals) return;
                if (node) {
                    Object.assign(node.values, vals);
                    this.closePopup();
                    this.renderRows();
                    this.trigger('save', { id: node.id, values: node.values });
                } else {
                    const nid = this.addItem(vals, parentId, true);
                    this.closePopup();
                    this.renderRows();
                    this.trigger('add', { id: nid, parentId: parentId, values: vals });
                }
                this.persist();
            };
            ov.addEventListener('click', (e) => {
                if (e.target === ov || e.target.closest('[data-pm="cancel"]')) { this.closePopup(); this.trigger('cancel', { id: id }); }
                else if (e.target.closest('[data-pm="save"]')) save();
            });
            ov.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') { this.closePopup(); this.trigger('cancel', { id: id }); }
                else if (e.key === 'Enter' && !e.target.matches('textarea')) { e.preventDefault(); save(); }
            });
            this.trigger('edit', { id: id, popup: true });
        }

        closePopup() { if (this.popup) { this.popup.el.remove(); this.popup = null; } }

        /* ---------------------------- Sürükle & bırak ----------------------- */
        initRowDnD() {
            const clear = () => this.tbody.querySelectorAll('.ptl-drop-inside,.ptl-drop-before,.ptl-drop-after').forEach((r) => r.classList.remove('ptl-drop-inside', 'ptl-drop-before', 'ptl-drop-after'));
            const zoneOf = (tr, e) => {
                const r = tr.getBoundingClientRect();
                const y = e.clientY - r.top;
                return y < r.height * 0.28 ? 'before' : (y > r.height * 0.72 ? 'after' : 'inside');
            };
            this.tbody.addEventListener('dragstart', (e) => {
                const tr = e.target.closest && e.target.closest('tr.ptl-row');
                if (!tr || !this.opt.draggable) return;
                this.dragId = tr.dataset.id;
                tr.classList.add('ptl-dragging');
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', this.dragId); } catch (x) { }
                this.trigger('dragStart', { id: this.dragId });
            });
            this.tbody.addEventListener('dragover', (e) => {
                if (!this.dragId) return;
                const tr = e.target.closest('tr.ptl-row');
                if (!tr) return;
                const tid = tr.dataset.id;
                clear();
                if (tid === this.dragId || this.isDescendant(tid, this.dragId)) return;
                e.preventDefault();
                tr.classList.add('ptl-drop-' + zoneOf(tr, e));
            });
            this.tbody.addEventListener('dragleave', (e) => { if (!this.tbody.contains(e.relatedTarget)) clear(); });
            this.tbody.addEventListener('drop', (e) => {
                if (!this.dragId) return;
                const tr = e.target.closest('tr.ptl-row');
                if (!tr) return;
                e.preventDefault();
                const tid = tr.dataset.id;
                const zone = zoneOf(tr, e);
                const id = this.dragId;
                this.dragId = null;
                clear();
                if (tid === id || this.isDescendant(tid, id)) return;
                this.moveNode(id, tid, zone);
            });
            this.tbody.addEventListener('dragend', () => { this.dragId = null; clear(); this.tbody.querySelectorAll('.ptl-dragging').forEach((r) => r.classList.remove('ptl-dragging')); });
        }

        moveNode(id, targetId, zone) {
            const n = this.node(id), t = this.node(targetId);
            if (!n || !t) return;
            const oldParent = n.parentId;
            this.nodes.splice(this.nodes.indexOf(n), 1);
            if (zone === 'inside') {
                n.parentId = t.id;
                t.expanded = true;
                t.hasChildren = true;
                this.nodes.push(n);
            } else {
                n.parentId = t.parentId;
                const idx = this.nodes.indexOf(t);
                this.nodes.splice(zone === 'before' ? idx : idx + 1, 0, n);
            }
            this.reindex();
            this.renderRows();
            this.trigger('drop', { id: id, targetId: targetId, zone: zone, oldParentId: oldParent, newParentId: n.parentId });
            this.persist();
        }

        /* ---------------------------- Klavye gezinmesi ---------------------- */
        onKeyNav(e) {
            if (e.target.matches('input,select,textarea,button') && !e.target.classList.contains('ptl-toggle')) return;
            if (this.edit || this.cellEdit) return;
            const rows = this.rows;
            if (!rows.length) return;
            let idx = rows.findIndex((r) => r.node.id === this.activeId);
            const setActive = (i) => {
                i = Math.max(0, Math.min(rows.length - 1, i));
                this.activeId = rows[i].node.id;
                this.refreshSelectionUI();
                const tr = this.tbody.querySelector('tr[data-id="' + cssEsc(this.activeId) + '"]');
                if (tr) tr.scrollIntoView({ block: 'nearest' });
                this.trigger('focus', { id: this.activeId });
            };
            const cur = idx >= 0 ? rows[idx] : null;
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); setActive(idx < 0 ? 0 : idx + 1); break;
                case 'ArrowUp': e.preventDefault(); setActive(idx < 0 ? 0 : idx - 1); break;
                case 'Home': e.preventDefault(); setActive(0); break;
                case 'End': e.preventDefault(); setActive(rows.length - 1); break;
                case 'ArrowRight':
                    if (!cur) { setActive(0); break; }
                    e.preventDefault();
                    if (cur.node.hasChildren && !cur.expanded) this.toggleNode(cur.node.id);
                    else if (cur.expanded && idx + 1 < rows.length && rows[idx + 1].level > cur.level) setActive(idx + 1);
                    break;
                case 'ArrowLeft':
                    if (!cur) break;
                    e.preventDefault();
                    if (cur.expanded && cur.node.hasChildren) this.toggleNode(cur.node.id);
                    else if (cur.node.parentId != null) { const pi = rows.findIndex((r) => r.node.id === cur.node.parentId); if (pi >= 0) setActive(pi); }
                    break;
                case 'Enter':
                    if (!cur) break;
                    e.preventDefault();
                    if (cur.node.hasChildren) this.toggleNode(cur.node.id);
                    else if (this.hasCommands() && this.opt.editable !== 'incell') this.beginEdit(cur.node.id);
                    break;
                case ' ':
                    if (!cur) break;
                    e.preventDefault();
                    if (this.hasCheckbox()) this.toggleCheck(cur.node.id, !this.selected.has(cur.node.id));
                    else if (this.opt.selectable === 'multiple') { if (this.selected.has(cur.node.id)) this.selected.delete(cur.node.id); else this.selected.add(cur.node.id); this.refreshSelectionUI(); this.trigger('change', { selected: Array.from(this.selected) }); }
                    else if (this.opt.selectable === 'single') { this.selected = new Set([cur.node.id]); this.refreshSelectionUI(); const n = cur.node; this.trigger('select', { id: n.id, parentId: n.parentId, level: cur.level, element: this.tbody.querySelector('tr[data-id="' + cssEsc(n.id) + '"]'), values: n.values, selected: [n.id] }); }
                    break;
                case 'F2':
                    if (cur && this.hasCommands()) { e.preventDefault(); this.beginEdit(cur.node.id); }
                    break;
                case 'Delete':
                    if (cur && this.hasCommands()) { e.preventDefault(); this.handleCommand('remove', cur.node.id); }
                    break;
                case 'PageDown': if (this.opt.pageable) { e.preventDefault(); this.goToPage(this.page + 1); } break;
                case 'PageUp': if (this.opt.pageable) { e.preventDefault(); this.goToPage(this.page - 1); } break;
            }
        }

        /* ----------------------------- Dışa aktarma ------------------------- */
        plainCell(c, v) { return fmtText(c, v); }

        exportExcel(name) {
            const cols = this.visibleCols();
            const rows = this.exportRows();
            const tree = cols.find((c) => c.isTreeColumn) || cols[0];
            let h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>td,th{border:1px solid #999;font-family:Calibri,Arial;font-size:11pt}th{background:#dbeafe;font-weight:bold}</style></head><body><table>';
            h += '<tr>' + cols.map((c) => '<th>' + esc(c.title) + '</th>').join('') + '</tr>';
            rows.forEach((r) => {
                h += '<tr>' + cols.map((c) => {
                    const v = r.node.values[c.field];
                    let t = esc(this.plainCell(c, v));
                    if (c === tree) t = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(r.level) + t;
                    const num = (c.type === 'number' && !isEmpty(v) && !c.format) ? ' x:num="' + esc(v) + '"' : '';
                    return '<td' + num + '>' + t + '</td>';
                }).join('') + '</tr>';
            });
            if (cols.some((c) => c.aggregate)) {
                h += '<tr>' + cols.map((c, i) => '<td><b>' + (c.aggregate ? esc(fmtText(c, this.aggregateFor(c, null))) : (i === 0 ? 'Genel Toplam' : '')) + '</b></td>').join('') + '</tr>';
            }
            h += '</table></body></html>';
            const blob = new Blob(['\ufeff', h], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (name || this.opt.exportName || 'treelist') + '.xls';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
            this.toast('Excel dosyası indiriliyor: ' + a.download);
            this.trigger('excelExport', { rows: rows.length, fileName: a.download });
        }

        exportPdf() {
            const cols = this.visibleCols();
            const rows = this.exportRows();
            const tree = cols.find((c) => c.isTreeColumn) || cols[0];
            const w = window.open('', '_blank', 'width=1000,height=700');
            if (!w) { this.toast('Açılır pencere engellendi. Lütfen izin verin.'); return; }
            let h = '<html><head><meta charset="utf-8"><title>' + esc(this.opt.title || 'TreeList') + '</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;margin:24px}h1{font-size:16px;margin:0 0 4px}p{color:#64748b;margin:0 0 14px}table{border-collapse:collapse;width:100%}th{background:#e2e8f0;text-align:left}th,td{border:1px solid #cbd5e1;padding:5px 8px}td.r{text-align:right}tfoot td{background:#f1f5f9;font-weight:bold}@media print{@page{size:A4 landscape;margin:12mm}}</style></head><body>';
            h += '<h1>' + esc(this.opt.title || 'TreeList') + '</h1><p>' + new Date().toLocaleString('tr-TR') + ' · ' + rows.length + ' kayıt</p><table><thead><tr>' + cols.map((c) => '<th>' + esc(c.title) + '</th>').join('') + '</tr></thead><tbody>';
            rows.forEach((r) => {
                h += '<tr>' + cols.map((c) => {
                    let t = esc(this.plainCell(c, r.node.values[c.field]));
                    if (c === tree) t = '<span style="display:inline-block;width:' + (r.level * 16) + 'px"></span>' + (this.childrenOf(r.node.id).length ? '▾ ' : '• ') + t;
                    return '<td class="' + (c.align === 'right' ? 'r' : '') + '">' + t + '</td>';
                }).join('') + '</tr>';
            });
            h += '</tbody>';
            if (cols.some((c) => c.aggregate)) h += '<tfoot><tr>' + cols.map((c, i) => '<td class="' + (c.align === 'right' ? 'r' : '') + '">' + (c.aggregate ? esc(fmtText(c, this.aggregateFor(c, null))) : (i === 0 ? 'Genel Toplam' : '')) + '</td>').join('') + '</tr></tfoot>';
            h += '</table><script>window.onload=function(){setTimeout(function(){window.print();},250)}<\/script></body></html>';
            w.document.open();
            w.document.write(h);
            w.document.close();
            this.trigger('pdfExport', { rows: rows.length });
        }

        /* ---------------------------- Durum saklama ------------------------- */
        stateKey() { return 'ptl-state:' + (this.opt.persistKey || this.id); }

        getState() {
            return {
                v: 1,
                expanded: this.nodes.filter((n) => n.expanded).map((n) => n.id),
                sort: this.sort,
                filters: this.filters,
                search: this.search,
                page: this.page,
                pageSize: this.pageSize,
                columns: this.cols.map((c) => ({ field: c.field, width: c.width, hidden: c.hidden, locked: c.locked }))
            };
        }

        persist() {
            if (this.opt.persistKey && this.opt.persistAuto && !this._restoring) {
                try { localStorage.setItem(this.stateKey(), JSON.stringify(this.getState())); } catch (e) { }
            }
        }

        saveState() {
            try {
                const json = JSON.stringify(this.getState());
                localStorage.setItem(this.stateKey(), json);
                this.toast('Durum kaydedildi (' + json.length + ' bayt)');
                this.trigger('stateSave', { key: this.stateKey(), state: this.getState() });
            } catch (e) { this.toast('Durum kaydedilemedi'); }
        }

        loadState(silent) {
            let st;
            try { st = JSON.parse(localStorage.getItem(this.stateKey()) || 'null'); } catch (e) { st = null; }
            if (!st) { if (!silent) this.toast('Kayıtlı durum bulunamadı'); return false; }
            this._restoring = true;
            if (st.columns && st.columns.length) {
                const ordered = [];
                st.columns.forEach((sc) => {
                    const c = this.colByField(sc.field);
                    if (c) { c.width = sc.width; c.hidden = !!sc.hidden; c.locked = !!sc.locked; ordered.push(c); }
                });
                this.cols.forEach((c) => { if (ordered.indexOf(c) < 0) ordered.push(c); });
                this.cols = ordered;
            }
            if (!this.remote && st.expanded) {
                const set = new Set(st.expanded);
                this.nodes.forEach((n) => { n.expanded = set.has(n.id); });
            }
            this.sort = st.sort || [];
            this.filters = st.filters || {};
            this.search = st.search || '';
            if (this.searchInput) this.searchInput.value = this.search;
            this.page = st.page || 1;
            this.pageSize = st.pageSize || this.pageSize;
            this.widthsFrozen = false;
            if (this.remote) this.loadRoots(); else this.render();
            this._restoring = false;
            if (!silent) this.toast('Durum yüklendi');
            this.trigger('stateLoad', { key: this.stateKey(), state: st });
            return true;
        }

        resetState() {
            try { localStorage.removeItem(this.stateKey()); } catch (e) { }
            this._restoring = true;
            this.cols = JSON.parse(JSON.stringify(this.initialCols));
            if (!this.remote && this.initialExpanded) this.nodes.forEach((n) => { n.expanded = this.initialExpanded.has(n.id); });
            this.sort = []; this.filters = {}; this.search = '';
            if (this.searchInput) this.searchInput.value = '';
            this.page = 1; this.pageSize = this.opt.pageSize;
            this.widthsFrozen = false;
            this.table.style.width = '';
            if (this.remote) this.loadRoots(); else this.render();
            this._restoring = false;
            this.toast('Durum sıfırlandı');
            this.trigger('stateReset', {});
        }

        hasSavedState() { try { return !!localStorage.getItem(this.stateKey()); } catch (e) { return false; } }

        refresh() { if (this.remote) this.reloadRemote(); else this.render(); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TL.initAll());
    } else {
        TL.initAll();
    }
})();
