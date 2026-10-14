/**
 * Panoptes Spreadsheet (v2) - Excel benzeri hesap & çalışma tablosu
 * Panoptes ASP.NET Core Spreadsheet bileşeni.
 *
 * Özellikler: formül motoru (45+ fonksiyon, sayfalar arası başvuru), aralık seçimi, kopyala/yapıştır,
 * geri al/yinele, birleştirme, dondurma, sıralama & filtreleme, veri doğrulama, özel hücre editörleri,
 * kilitli hücreler, yorumlar, resimler, satır/sütun boyutlandırma, klavye navigasyonu, olaylar,
 * veri kaynağı bağlama, CSV / JSON / XLSX (sunucu) içe-dışa aktarım ve yazdırma (PDF).
 */
(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    if (window.Panoptes.Spreadsheet && window.Panoptes.Spreadsheet.__v2) return;

    /* ======================================================================
     *  Yardımcılar
     * ==================================================================== */
    const EPOCH = Date.UTC(1899, 11, 30);
    const DAY = 86400000;
    const colToLetter = c => { let s = ''; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - m) / 26); } return s; };
    const letterToCol = L => { let c = 0; for (let i = 0; i < L.length; i++) c = c * 26 + (L.charCodeAt(i) - 64); return c; };
    const K = (r, c) => r + ',' + c;
    const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const clone = o => (typeof structuredClone === 'function') ? structuredClone(o) : JSON.parse(JSON.stringify(o));
    const lc = o => {
        if (!o || typeof o !== 'object' || Array.isArray(o)) return o || {};
        const r = {}; Object.keys(o).forEach(k => { r[k.toLowerCase()] = o[k]; }); return r;
    };

    const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;
    function parseCellRef(t) {
        const m = REF_RE.exec(String(t).trim());
        if (!m) return null;
        return { c: letterToCol(m[2].toUpperCase()), r: parseInt(m[4], 10), ac: !!m[1], ar: !!m[3] };
    }
    function parseRange(t) {
        if (typeof t !== 'string') return null;
        const p = t.split(':');
        const a = parseCellRef(p[0]);
        if (!a) return null;
        const b = p[1] ? parseCellRef(p[1]) : a;
        if (!b) return null;
        return { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) };
    }
    const rangeStr = g => {
        const a = colToLetter(g.c1) + g.r1;
        return (g.r1 === g.r2 && g.c1 === g.c2) ? a : a + ':' + colToLetter(g.c2) + g.r2;
    };
    const inRange = (g, r, c) => r >= g.r1 && r <= g.r2 && c >= g.c1 && c <= g.c2;
    const overlaps = (a, b) => a.r1 <= b.r2 && a.r2 >= b.r1 && a.c1 <= b.c2 && a.c2 >= b.c1;

    /* ======================================================================
     *  Hata değerleri & Formül motoru
     * ==================================================================== */
    class SErr { constructor(code) { this.code = code; } toString() { return this.code; } }
    const E = { VALUE: '#DEĞER!', DIV0: '#BÖL/0!', NAME: '#AD?', REF: '#BAŞV!', NA: '#YOK', ERR: '#HATA!', CIRC: '#DÖNGÜ!', NUM: '#SAYI!' };
    const fail = code => { throw new SErr(code); };

    const TR = 'ÇĞİÖŞÜçğıöşü';
    const SHEETREF = "(?:'(?:[^']|'')+'|[A-Za-z" + TR + "_][\\w" + TR + ".]*)!";
    const CELL = '\\$?[A-Za-z]{1,3}\\$?\\d+';
    const TOKEN_RE = new RegExp(
        '\\s+|' +
        '("(?:[^"]|"")*")|' +
        '((?:' + SHEETREF + ')?' + CELL + '(?::' + CELL + ')?)(?![\\w(' + TR + '])|' +
        '(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|\\.\\d+)|' +
        '([A-Za-z' + TR + '_][\\w' + TR + '.]*)|' +
        '(<=|>=|<>|[-+*/^&=<>%(),;:])', 'y');

    function tokenize(src) {
        const toks = [];
        let pos = 0;
        while (pos < src.length) {
            TOKEN_RE.lastIndex = pos;
            const m = TOKEN_RE.exec(src);
            if (!m) fail(E.ERR);
            const start = pos;
            pos = TOKEN_RE.lastIndex;
            if (m[1] != null) toks.push({ t: 'str', v: m[1].slice(1, -1).replace(/""/g, '"'), s: start, e: pos });
            else if (m[2] != null) toks.push({ t: 'ref', v: m[2], s: start, e: pos });
            else if (m[3] != null) toks.push({ t: 'num', v: parseFloat(m[3]), s: start, e: pos });
            else if (m[4] != null) toks.push({ t: 'name', v: m[4], s: start, e: pos });
            else if (m[5] != null) toks.push({ t: 'op', v: m[5], s: start, e: pos });
        }
        return toks;
    }

    function parseRefToken(t) {
        let sheet = null;
        const i = t.lastIndexOf('!');
        if (i >= 0) {
            sheet = t.slice(0, i);
            if (sheet[0] === "'") sheet = sheet.slice(1, -1).replace(/''/g, "'");
            t = t.slice(i + 1);
        }
        const p = t.split(':');
        return { sheet, a: parseCellRef(p[0]), b: p[1] ? parseCellRef(p[1]) : null };
    }
    function refText(sheet, a, b) {
        const one = x => (x.ac ? '$' : '') + colToLetter(x.c) + (x.ar ? '$' : '') + x.r;
        let s = one(a) + (b ? ':' + one(b) : '');
        if (sheet != null) {
            const simple = new RegExp('^[A-Za-z' + TR + '_][\\w' + TR + '.]*$').test(sheet);
            s = (simple ? sheet : "'" + sheet.replace(/'/g, "''") + "'") + '!' + s;
        }
        return s;
    }

    function parseFormula(src) {
        const toks = tokenize(src);
        let i = 0;
        const isOp = v => toks[i] && toks[i].t === 'op' && toks[i].v === v;
        const next = () => toks[i++];
        const CMP = ['=', '<>', '<', '>', '<=', '>='];
        function cmp() { let a = cat(); while (toks[i] && toks[i].t === 'op' && CMP.indexOf(toks[i].v) >= 0) { const op = next().v; a = { k: 'bin', op, a, b: cat() }; } return a; }
        function cat() { let a = add(); while (isOp('&')) { next(); a = { k: 'bin', op: '&', a, b: add() }; } return a; }
        function add() { let a = mul(); while (isOp('+') || isOp('-')) { const op = next().v; a = { k: 'bin', op, a, b: mul() }; } return a; }
        function mul() { let a = pow(); while (isOp('*') || isOp('/')) { const op = next().v; a = { k: 'bin', op, a, b: pow() }; } return a; }
        function pow() { let a = unary(); while (isOp('^')) { next(); a = { k: 'bin', op: '^', a, b: unary() }; } return a; }
        function unary() { if (isOp('-')) { next(); return { k: 'un', a: unary() }; } if (isOp('+')) { next(); return unary(); } return post(); }
        function post() { let a = prim(); while (isOp('%')) { next(); a = { k: 'pct', a }; } return a; }
        function prim() {
            const t = next();
            if (!t) fail(E.ERR);
            if (t.t === 'num') return { k: 'num', v: t.v };
            if (t.t === 'str') return { k: 'str', v: t.v };
            if (t.t === 'ref') {
                const p = parseRefToken(t.v);
                if (!p.a) fail(E.REF);
                if (p.b) return { k: 'range', sheet: p.sheet, r1: p.a.r, c1: p.a.c, r2: p.b.r, c2: p.b.c };
                return { k: 'ref', sheet: p.sheet, r: p.a.r, c: p.a.c };
            }
            if (t.t === 'name') {
                const up = t.v.toUpperCase();
                if (isOp('(')) {
                    next();
                    const args = [];
                    if (isOp(')')) { next(); return { k: 'call', name: up, args }; }
                    for (;;) {
                        args.push((isOp(',') || isOp(';')) ? { k: 'empty' } : cmp());
                        if (isOp(',') || isOp(';')) { next(); continue; }
                        if (isOp(')')) { next(); break; }
                        fail(E.ERR);
                    }
                    return { k: 'call', name: up, args };
                }
                if (up === 'TRUE') return { k: 'bool', v: true };
                if (up === 'FALSE') return { k: 'bool', v: false };
                fail(E.NAME);
            }
            if (t.t === 'op' && t.v === '(') { const e = cmp(); if (!isOp(')')) fail(E.ERR); next(); return e; }
            fail(E.ERR);
        }
        const ast = cmp();
        if (i < toks.length) fail(E.ERR);
        return ast;
    }

    class RangeVal {
        constructor(si, r1, c1, r2, c2, x) {
            this.si = si; this.x = x;
            this.r1 = Math.min(r1, r2); this.r2 = Math.max(r1, r2);
            this.c1 = Math.min(c1, c2); this.c2 = Math.max(c1, c2);
        }
        get(r, c) { return this.x.value(this.si, r, c); }
        first() { return this.get(this.r1, this.c1); }
        each(fn) { for (let r = this.r1; r <= this.r2; r++) for (let c = this.c1; c <= this.c2; c++) fn(this.get(r, c), r, c); }
        get rows() { return this.r2 - this.r1 + 1; }
        get cols() { return this.c2 - this.c1 + 1; }
    }

    const sc = v => (v instanceof RangeVal ? v.first() : v);
    function num(v) {
        if (v == null || v === '') return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (v instanceof SErr) throw v;
        const s = String(v).trim().replace(',', '.');
        const n = Number(s);
        if (s === '' || isNaN(n)) fail(E.VALUE);
        return n;
    }
    function str(v) {
        if (v == null) return '';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return fmtGeneral(v);
        return String(v);
    }
    function truthy(v) {
        if (typeof v === 'boolean') return v;
        if (v == null || v === '') return false;
        if (typeof v === 'number') return v !== 0;
        const s = String(v).toUpperCase();
        if (s === 'TRUE') return true;
        if (s === 'FALSE') return false;
        fail(E.VALUE);
    }
    function cmpVals(a, b) {
        const rank = v => (typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : 3);
        if (a == null) a = (typeof b === 'string') ? '' : (typeof b === 'boolean' ? false : 0);
        if (b == null) b = (typeof a === 'string') ? '' : (typeof a === 'boolean' ? false : 0);
        if (rank(a) !== rank(b)) return rank(a) < rank(b) ? -1 : 1;
        if (typeof a === 'string') { a = a.toLocaleLowerCase('tr'); b = b.toLocaleLowerCase('tr'); }
        return a < b ? -1 : a > b ? 1 : 0;
    }
    function binop(op, a, b) {
        switch (op) {
            case '+': return num(a) + num(b);
            case '-': return num(a) - num(b);
            case '*': return num(a) * num(b);
            case '/': { const d = num(b); if (d === 0) fail(E.DIV0); return num(a) / d; }
            case '^': return Math.pow(num(a), num(b));
            case '&': return str(a) + str(b);
            case '=': return cmpVals(a, b) === 0;
            case '<>': return cmpVals(a, b) !== 0;
            case '<': return cmpVals(a, b) < 0;
            case '>': return cmpVals(a, b) > 0;
            case '<=': return cmpVals(a, b) <= 0;
            case '>=': return cmpVals(a, b) >= 0;
        }
        fail(E.ERR);
    }

    function ev(n, x) {
        switch (n.k) {
            case 'num': case 'str': case 'bool': return n.v;
            case 'empty': return null;
            case 'ref': { const v = x.value(x.sheet(n.sheet), n.r, n.c); if (v instanceof SErr) throw v; return v; }
            case 'range': return new RangeVal(x.sheet(n.sheet), n.r1, n.c1, n.r2, n.c2, x);
            case 'un': return -num(sc(ev(n.a, x)));
            case 'pct': return num(sc(ev(n.a, x))) / 100;
            case 'bin': return binop(n.op, sc(ev(n.a, x)), sc(ev(n.b, x)));
            case 'call': return callFn(n, x);
        }
        fail(E.ERR);
    }

    function callFn(n, x) {
        const a = n.args;
        if (n.name === 'IF') {
            const c = truthy(sc(ev(a[0], x)));
            const br = c ? a[1] : a[2];
            return br ? ev(br, x) : c;
        }
        if (n.name === 'IFERROR') {
            try { return sc(ev(a[0], x)); } catch (e) { if (e instanceof SErr) return a[1] ? ev(a[1], x) : ''; throw e; }
        }
        const f = FN[n.name];
        if (!f) fail(E.NAME);
        return f(a.map(t => ev(t, x)), x);
    }

    function nums(args) {
        const out = [];
        args.forEach(a => {
            if (a instanceof RangeVal) a.each(v => { if (v instanceof SErr) throw v; if (typeof v === 'number') out.push(v); });
            else if (a != null) out.push(num(a));
        });
        return out;
    }
    function vals(args) {
        const out = [];
        args.forEach(a => { if (a instanceof RangeVal) a.each(v => { if (v instanceof SErr) throw v; out.push(v); }); else out.push(a); });
        return out;
    }
    const rnd = (v, d, m) => {
        const s = v < 0 ? -1 : 1; const f = Math.pow(10, d); let t = Math.abs(v) * f;
        t = m === 'u' ? Math.ceil(t - 1e-9) : m === 'd' ? Math.floor(t + 1e-9) : Math.round(t + 1e-9);
        return s * t / f;
    };
    function wild(p, s) {
        if (!/[*?]/.test(p)) return p === s;
        return new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(s);
    }
    function critFn(c) {
        if (typeof c === 'number') return v => typeof v === 'number' && v === c;
        if (typeof c === 'boolean') return v => v === c;
        let s = String(c == null ? '' : c), op = '=';
        const m = /^(<=|>=|<>|<|>|=)([\s\S]*)$/.exec(s);
        if (m) { op = m[1]; s = m[2]; }
        const n = Number(s.replace(',', '.')); const isN = s.trim() !== '' && !isNaN(n);
        return v => {
            if (isN && typeof v === 'number') {
                switch (op) { case '=': return v === n; case '<>': return v !== n; case '<': return v < n; case '>': return v > n; case '<=': return v <= n; case '>=': return v >= n; }
            }
            if (isN && op !== '=' && op !== '<>') return false;
            const sv = v == null ? '' : str(v).toLocaleLowerCase('tr'), t = s.toLocaleLowerCase('tr');
            if (op === '<>') return !wild(t, sv);
            if (op === '=') return wild(t, sv);
            return false;
        };
    }
    function needRange(r) { if (!(r instanceof RangeVal)) fail(E.VALUE); return r; }

    const FN = {
        SUM: a => nums(a).reduce((s, v) => s + v, 0),
        AVERAGE: a => { const n = nums(a); if (!n.length) fail(E.DIV0); return n.reduce((s, v) => s + v, 0) / n.length; },
        AVG: a => FN.AVERAGE(a),
        MIN: a => { const n = nums(a); return n.length ? Math.min.apply(null, n) : 0; },
        MAX: a => { const n = nums(a); return n.length ? Math.max.apply(null, n) : 0; },
        COUNT: a => { let c = 0; a.forEach(x => { if (x instanceof RangeVal) x.each(v => { if (typeof v === 'number') c++; }); else if (x != null && x !== '' && !isNaN(Number(x))) c++; }); return c; },
        COUNTA: a => vals(a).filter(v => v != null && v !== '').length,
        COUNTBLANK: a => vals(a).filter(v => v == null || v === '').length,
        PRODUCT: a => nums(a).reduce((s, v) => s * v, 1),
        MEDIAN: a => { const n = nums(a).sort((p, q) => p - q); if (!n.length) fail(E.NUM); const m = n.length >> 1; return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2; },
        STDEV: a => { const n = nums(a); if (n.length < 2) fail(E.DIV0); const m = n.reduce((s, v) => s + v, 0) / n.length; return Math.sqrt(n.reduce((s, v) => s + (v - m) * (v - m), 0) / (n.length - 1)); },
        LARGE: a => { const n = nums([a[0]]).sort((p, q) => q - p); const k = num(a[1]); if (k < 1 || k > n.length) fail(E.NUM); return n[k - 1]; },
        SMALL: a => { const n = nums([a[0]]).sort((p, q) => p - q); const k = num(a[1]); if (k < 1 || k > n.length) fail(E.NUM); return n[k - 1]; },
        ROUND: a => rnd(num(a[0]), a[1] != null ? num(a[1]) : 0, 'r'),
        ROUNDUP: a => rnd(num(a[0]), a[1] != null ? num(a[1]) : 0, 'u'),
        ROUNDDOWN: a => rnd(num(a[0]), a[1] != null ? num(a[1]) : 0, 'd'),
        ABS: a => Math.abs(num(a[0])),
        SQRT: a => { const v = num(a[0]); if (v < 0) fail(E.NUM); return Math.sqrt(v); },
        POWER: a => Math.pow(num(a[0]), num(a[1])),
        EXP: a => Math.exp(num(a[0])),
        LN: a => { const v = num(a[0]); if (v <= 0) fail(E.NUM); return Math.log(v); },
        LOG10: a => { const v = num(a[0]); if (v <= 0) fail(E.NUM); return Math.log10(v); },
        MOD: a => { const d = num(a[1]); if (d === 0) fail(E.DIV0); const n = num(a[0]); return n - d * Math.floor(n / d); },
        INT: a => Math.floor(num(a[0])),
        SIGN: a => Math.sign(num(a[0])),
        CEILING: a => { const s = a[1] != null ? num(a[1]) : 1; return s === 0 ? 0 : Math.ceil(num(a[0]) / s) * s; },
        FLOOR: a => { const s = a[1] != null ? num(a[1]) : 1; return s === 0 ? 0 : Math.floor(num(a[0]) / s) * s; },
        PI: () => Math.PI,
        RAND: () => Math.random(),
        RANDBETWEEN: a => { const lo = Math.ceil(num(a[0])), hi = Math.floor(num(a[1])); return lo + Math.floor(Math.random() * (hi - lo + 1)); },
        SUMPRODUCT: a => {
            const rs = a.map(needRange); const n = rs[0].rows * rs[0].cols; let tot = 0;
            for (let i = 0; i < n; i++) {
                let p = 1;
                rs.forEach(r => { const v = r.get(r.r1 + Math.floor(i / r.cols), r.c1 + (i % r.cols)); p *= (typeof v === 'number' ? v : 0); });
                tot += p;
            }
            return tot;
        },
        SUMIF: a => {
            const rng = needRange(a[0]), f = critFn(sc(a[1])), sr = a[2] instanceof RangeVal ? a[2] : rng; let tot = 0;
            rng.each((v, r, c) => { if (f(v)) { const sv = sr === rng ? v : sr.get(sr.r1 + (r - rng.r1), sr.c1 + (c - rng.c1)); if (typeof sv === 'number') tot += sv; } });
            return tot;
        },
        COUNTIF: a => { const rng = needRange(a[0]), f = critFn(sc(a[1])); let c = 0; rng.each(v => { if (f(v)) c++; }); return c; },
        AVERAGEIF: a => {
            const rng = needRange(a[0]), f = critFn(sc(a[1])), sr = a[2] instanceof RangeVal ? a[2] : rng; let tot = 0, c = 0;
            rng.each((v, r, cc) => { if (f(v)) { const sv = sr === rng ? v : sr.get(sr.r1 + (r - rng.r1), sr.c1 + (cc - rng.c1)); if (typeof sv === 'number') { tot += sv; c++; } } });
            if (!c) fail(E.DIV0);
            return tot / c;
        },
        AND: a => vals(a).filter(v => v != null && v !== '').every(truthy),
        OR: a => vals(a).filter(v => v != null && v !== '').some(truthy),
        NOT: a => !truthy(sc(a[0])),
        TRUE: () => true,
        FALSE: () => false,
        CONCAT: a => vals(a).map(str).join(''),
        CONCATENATE: a => vals(a).map(str).join(''),
        LEN: a => str(sc(a[0])).length,
        UPPER: a => str(sc(a[0])).toLocaleUpperCase('tr'),
        LOWER: a => str(sc(a[0])).toLocaleLowerCase('tr'),
        TRIM: a => str(sc(a[0])).trim().replace(/\s+/g, ' '),
        LEFT: a => str(sc(a[0])).slice(0, a[1] != null ? num(a[1]) : 1),
        RIGHT: a => { const s = str(sc(a[0])), n = a[1] != null ? num(a[1]) : 1; return n <= 0 ? '' : s.slice(-n); },
        MID: a => { const s = str(sc(a[0])), st = num(a[1]) - 1; return s.substr(Math.max(0, st), num(a[2])); },
        REPT: a => str(sc(a[0])).repeat(Math.max(0, num(a[1]))),
        SUBSTITUTE: a => str(sc(a[0])).split(str(sc(a[1]))).join(str(sc(a[2]))),
        FIND: a => { const i = str(sc(a[1])).indexOf(str(sc(a[0])), a[2] != null ? num(a[2]) - 1 : 0); if (i < 0) fail(E.VALUE); return i + 1; },
        VALUE: a => num(sc(a[0])),
        TEXT: a => formatValue(num(sc(a[0])), str(sc(a[1]))),
        TODAY: () => Math.floor((Date.now() - EPOCH) / DAY),
        NOW: () => (Date.now() - EPOCH) / DAY,
        DATE: a => { const y = num(a[0]), m = num(a[1]), d = num(a[2]); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY); },
        YEAR: a => new Date(EPOCH + num(sc(a[0])) * DAY).getUTCFullYear(),
        MONTH: a => new Date(EPOCH + num(sc(a[0])) * DAY).getUTCMonth() + 1,
        DAY: a => new Date(EPOCH + num(sc(a[0])) * DAY).getUTCDate(),
        WEEKDAY: a => { const d = new Date(EPOCH + num(sc(a[0])) * DAY).getUTCDay(); return d === 0 ? 7 : d; },
        VLOOKUP: a => {
            const key = sc(a[0]), tb = needRange(a[1]), ci = num(a[2]); const exact = a[3] != null && !truthy(sc(a[3]));
            if (ci < 1 || ci > tb.cols) fail(E.REF);
            let hit = -1;
            for (let r = tb.r1; r <= tb.r2; r++) {
                const v = tb.get(r, tb.c1);
                if (exact) { if (cmpVals(v, key) === 0) { hit = r; break; } }
                else if (v != null && cmpVals(v, key) <= 0) hit = r; else if (v != null) break;
            }
            if (hit < 0) fail(E.NA);
            const res = tb.get(hit, tb.c1 + ci - 1);
            if (res instanceof SErr) throw res;
            return res;
        },
        INDEX: a => {
            const rg = needRange(a[0]); const r = a[1] != null ? num(a[1]) : 1; const c = a[2] != null ? num(a[2]) : 1;
            const rr = rg.rows === 1 && a[2] == null ? 1 : r, cc = rg.rows === 1 && a[2] == null ? r : c;
            if (rr < 1 || rr > rg.rows || cc < 1 || cc > rg.cols) fail(E.REF);
            return rg.get(rg.r1 + rr - 1, rg.c1 + cc - 1);
        },
        MATCH: a => {
            const key = sc(a[0]), rg = needRange(a[1]); const type = a[2] != null ? num(a[2]) : 1; let hit = -1, i = 0;
            rg.each(v => {
                i++;
                if (hit >= 0 && type === 0) return;
                if (type === 0) { if (cmpVals(v, key) === 0) hit = i; }
                else if (type === 1) { if (v != null && cmpVals(v, key) <= 0) hit = i; }
                else if (v != null && cmpVals(v, key) >= 0) hit = i;
            });
            if (hit < 0) fail(E.NA);
            return hit;
        }
    };
    const FUNCTION_NAMES = Object.keys(FN).concat(['IF', 'IFERROR']).sort();

    /* ---------------- Başvuru yeniden yazma (kopyala, satır/sütun ekle-sil) ---------------- */
    function rewriteRefs(src, fn) {
        let toks;
        try { toks = tokenize(src); } catch (e) { return src; }
        let out = '', last = 0;
        toks.forEach(t => {
            if (t.t !== 'ref') return;
            const p = parseRefToken(t.v);
            if (!p.a) return;
            const r = fn({ sheet: p.sheet, a: Object.assign({}, p.a), b: p.b ? Object.assign({}, p.b) : null });
            out += src.slice(last, t.s) + (r ? refText(r.sheet, r.a, r.b) : '#BAŞV!');
            last = t.e;
        });
        return out + src.slice(last);
    }
    function shiftFormula(f, dr, dc) {
        return rewriteRefs(f, ref => {
            const sh = p => ({ r: p.ar ? p.r : p.r + dr, c: p.ac ? p.c : p.c + dc, ar: p.ar, ac: p.ac });
            const a = sh(ref.a), b = ref.b ? sh(ref.b) : null;
            if (a.r < 1 || a.c < 1 || (b && (b.r < 1 || b.c < 1))) return null;
            return { sheet: ref.sheet, a, b };
        });
    }
    function adjSpan(a1, a2, at, cnt, del) {
        if (!del) { if (a1 >= at) a1 += cnt; if (a2 >= at) a2 += cnt; return [a1, a2]; }
        const end = at + cnt - 1;
        if (a1 > end) a1 -= cnt; else if (a1 >= at) a1 = at;
        if (a2 > end) a2 -= cnt; else if (a2 >= at) a2 = at - 1;
        return a2 < a1 ? null : [a1, a2];
    }

    /* ======================================================================
     *  Sayı / tarih biçimleri & girdi ayrıştırma
     * ==================================================================== */
    function fmtGeneral(v) {
        if (Number.isInteger(v)) return String(v);
        const s = Number(v.toPrecision(12));
        if (Math.abs(s) >= 1e15 || (Math.abs(s) < 1e-6 && s !== 0)) return s.toExponential(4).replace('.', ',');
        return String(s).replace('.', ',');
    }
    const NAMED_FMT = {
        number: '#,##0.00', integer: '#,##0', currency: '#,##0.00 ₺', percent: '0%', percent2: '0.00%',
        date: 'dd.MM.yyyy', datetime: 'dd.MM.yyyy HH:mm', time: 'HH:mm', scientific: 'sci'
    };
    const monthName = (d, w) => new Intl.DateTimeFormat('tr-TR', { month: w, timeZone: 'UTC' }).format(d);
    const dayName = (d, w) => new Intl.DateTimeFormat('tr-TR', { weekday: w, timeZone: 'UTC' }).format(d);
    function fmtDate(v, p) {
        const d = new Date(EPOCH + Math.round(v * DAY));
        const p2 = n => String(n).padStart(2, '0');
        return p.replace(/yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|mm|ss/g, t => {
            switch (t) {
                case 'yyyy': return d.getUTCFullYear();
                case 'yy': return p2(d.getUTCFullYear() % 100);
                case 'MMMM': return monthName(d, 'long');
                case 'MMM': return monthName(d, 'short');
                case 'MM': return p2(d.getUTCMonth() + 1);
                case 'M': return d.getUTCMonth() + 1;
                case 'dddd': return dayName(d, 'long');
                case 'ddd': return dayName(d, 'short');
                case 'dd': return p2(d.getUTCDate());
                case 'd': return d.getUTCDate();
                case 'HH': return p2(d.getUTCHours());
                case 'H': return d.getUTCHours();
                case 'mm': return p2(d.getUTCMinutes());
                case 'ss': return p2(d.getUTCSeconds());
            }
            return t;
        });
    }
    const unq = s => s.replace(/"/g, '').replace(/\\/g, '');
    function formatValue(v, fmt) {
        if (v == null || v === '') return '';
        if (v instanceof SErr) return v.code;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (!fmt || fmt === 'general') return typeof v === 'number' ? fmtGeneral(v) : String(v);
        if (fmt === 'text' || fmt === 'color') return String(v);
        if (fmt === 'stars') { const n = Math.max(0, Math.min(5, Math.round(Number(v) || 0))); return '★'.repeat(n) + '☆'.repeat(5 - n); }
        if (typeof v !== 'number') {
            const n = Number(String(v).replace(',', '.'));
            if (String(v).trim() === '' || isNaN(n)) return String(v);
            v = n;
        }
        const p = NAMED_FMT[fmt] || fmt;
        if (p === 'sci') return v.toExponential(2).replace('.', ',').replace('e', 'E');
        if (!/[0#]/.test(p) && /[dMyHms]/.test(p)) return fmtDate(v, p);
        const secs = p.split(';'); let pat = secs[0];
        if (v < 0 && secs[1]) { pat = secs[1]; v = Math.abs(v); } else if (v === 0 && secs[2]) pat = secs[2];
        const m = /^([^#0]*)([#0,.]+)([\s\S]*)$/.exec(pat);
        if (!m) return fmtGeneral(v);
        if (/%/.test(pat)) v *= 100;
        const core = m[2], dot = core.indexOf('.'), decs = dot >= 0 ? core.slice(dot + 1) : '';
        const minD = (decs.match(/0/g) || []).length, maxD = decs.length;
        const s = v.toLocaleString('tr-TR', { minimumFractionDigits: minD, maximumFractionDigits: maxD, useGrouping: core.indexOf(',') >= 0 });
        return unq(m[1]) + s + unq(m[3]);
    }

    function serialFromYMD(y, mo, d) {
        const t = Date.UTC(y, mo - 1, d), dt = new Date(t);
        if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
        return Math.round((t - EPOCH) / DAY);
    }
    function parseDateText(s) {
        let m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
        if (m) return serialFromYMD(+m[3], +m[2], +m[1]);
        m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (m) return serialFromYMD(+m[1], +m[2], +m[3]);
        return null;
    }
    const serialToISO = n => new Date(EPOCH + Math.round(n) * DAY).toISOString().slice(0, 10);

    /** Kullanıcı girdisini {v,f,fmt} olarak ayrıştırır. */
    function parseInput(text) {
        let s = text == null ? '' : String(text);
        if (s === '') return { v: null };
        if (s[0] === '=' && s.length > 1) return { f: s.slice(1).trim() };
        const t = s.trim();
        if (/^(true|false)$/i.test(t)) return { v: t.toLowerCase() === 'true' };
        let m = /^([-+]?\d+(?:[.,]\d+)?)\s*%$/.exec(t);
        if (m) return { v: Number(m[1].replace(',', '.')) / 100, fmt: 'percent' };
        m = /^(?:₺|\$|€)?\s*([-+]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-+]?\d+(?:[.,]\d+)?)\s*(?:₺|TL|\$|€)?$/.exec(t);
        if (m) {
            let n = m[1];
            if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(n) && (n.indexOf(',') >= 0 || (n.match(/\./g) || []).length > 1)) n = n.replace(/\./g, '').replace(',', '.');
            else n = n.replace(',', '.');
            const out = { v: Number(n) };
            if (/₺|TL/.test(t)) out.fmt = 'currency';
            return isNaN(out.v) ? { v: s } : out;
        }
        const d = parseDateText(t);
        if (d != null) return { v: d, fmt: 'date' };
        return { v: s };
    }
    function parseCompareValue(v) {
        if (v == null || v === '') return null;
        if (typeof v === 'number') return v;
        const d = parseDateText(String(v).trim());
        if (d != null) return d;
        const n = Number(String(v).replace(',', '.'));
        return isNaN(n) ? String(v) : n;
    }

    /* ======================================================================
     *  Stiller (bileşenle birlikte bir kez enjekte edilir)
     * ==================================================================== */
    const CSS = `
.ps-root{display:flex;flex-direction:column;border:1px solid #cbd5e1;border-radius:12px;background:#fff;overflow:hidden;font:13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f172a;position:relative;box-sizing:border-box;min-width:320px;max-width:100%;min-height:240px}
.ps-root *{box-sizing:border-box}
.ps-resizable{resize:both}
.ps-title{padding:8px 14px;font-weight:700;font-size:14px;color:#1e293b;background:linear-gradient(90deg,#eff6ff,#f8fafc);border-bottom:1px solid #e2e8f0}
.ps-tabs{display:flex;gap:2px;padding:6px 8px 0;background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}
.ps-tab{padding:6px 14px;border:0;background:transparent;border-radius:8px 8px 0 0;font:600 12px system-ui,sans-serif;color:#64748b;cursor:pointer;transition:color .15s,background .15s}
.ps-tab:hover{color:#1d4ed8}
.ps-tab.on{background:#fff;color:#1d4ed8;box-shadow:inset 0 2px 0 #2563eb}
.ps-ribbon{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:6px 10px;background:#fff;border-bottom:1px solid #e2e8f0;min-height:44px}
.ps-grp{display:flex;align-items:center;gap:2px;padding-right:8px;border-right:1px solid #e2e8f0;flex-wrap:wrap}
.ps-grp:last-child{border-right:0}
.ps-btn{min-width:28px;height:28px;padding:0 8px;border:1px solid transparent;border-radius:6px;background:transparent;color:#334155;font:600 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s}
.ps-btn:hover{background:#eef2ff}
.ps-btn.on{background:#dbeafe;border-color:#93c5fd;color:#1d4ed8}
.ps-btn:disabled{opacity:.4;cursor:default;background:transparent}
.ps-btn svg{width:14px;height:14px;display:block;margin:auto}
.ps-sel-in{height:28px;border:1px solid #cbd5e1;border-radius:6px;font:12px system-ui,sans-serif;background:#fff;padding:0 6px;color:#334155}
.ps-color{width:30px;height:28px;padding:2px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer}
.ps-lbl{font-size:10px;color:#94a3b8;margin:0 2px;text-transform:uppercase;letter-spacing:.04em}
.ps-fbar{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
.ps-ref{min-width:64px;text-align:center;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}
.ps-fx{font:italic 700 14px Georgia,serif;color:#94a3b8}
.ps-fin{flex:1;min-width:0;height:28px;border:1px solid #cbd5e1;border-radius:6px;padding:0 10px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;outline:none;background:#fff;color:#0f172a}
.ps-fin:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.ps-scroll{position:relative;flex:1;min-height:120px;overflow:auto;background:#fff;outline:none}
.ps-inner{position:relative;width:max-content;min-width:100%}
.ps-table{border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:13px;user-select:none;-webkit-user-select:none}
.ps-table td,.ps-table th{padding:0 6px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;overflow:hidden;white-space:nowrap;position:relative;background:#fff}
.ps-table.ps-nogrid td{border-right-color:transparent;border-bottom-color:transparent}
.ps-table th{background:#f1f5f9;color:#64748b;font-weight:600;font-size:11px;text-align:center;position:sticky;z-index:5;cursor:default}
.ps-table thead th{top:0;height:24px}
.ps-corner{left:0;z-index:8!important}
.ps-rowh{left:0}
.ps-hl{background:#dbeafe!important;color:#1d4ed8!important}
.ps-colrs{position:absolute;top:0;right:-3px;width:7px;height:100%;cursor:col-resize;z-index:2}
.ps-rowrs{position:absolute;left:0;bottom:-3px;height:7px;width:100%;cursor:row-resize;z-index:2}
.ps-colrs:hover,.ps-rowrs:hover{background:rgba(37,99,235,.35)}
.ps-fz{position:sticky}
.ps-c{cursor:cell}
.ps-err{color:#dc2626}
.ps-cm::before{content:'';position:absolute;top:0;right:0;border-style:solid;border-width:0 8px 8px 0;border-color:transparent #ef4444 transparent transparent;z-index:1}
.ps-bad{outline:1px dashed #f97316;outline-offset:-2px}
.ps-dis{background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 5px,#eef2f6 5px,#eef2f6 10px)!important;color:#94a3b8!important;cursor:not-allowed}
.ps-list::after{content:'▾';position:absolute;right:5px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:10px}
.ps-fbtn{position:absolute;right:3px;top:50%;margin-top:-8px;width:16px;height:16px;border-radius:4px;background:#e2e8f0;color:#475569;font-size:10px;text-align:center;line-height:16px;cursor:pointer;z-index:2}
.ps-fbtn:hover{background:#cbd5e1}
.ps-fbtn.on{background:#2563eb;color:#fff}
.ps-swatch{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.2);margin-right:6px;vertical-align:-2px}
.ps-chk{cursor:pointer;width:14px;height:14px;vertical-align:middle;accent-color:#2563eb}
.ps-editing{overflow:visible!important}
.ps-edit{position:absolute;left:0;top:0;width:100%;height:100%;min-width:60px;border:2px solid #2563eb;outline:none;padding:0 5px;font:inherit;background:#fff;color:#0f172a;z-index:20;border-radius:0}
.ps-selbox{position:absolute;z-index:4;pointer-events:none;border:2px solid #2563eb;background:rgba(37,99,235,.10);display:none}
.ps-actbox{position:absolute;z-index:4;pointer-events:none;border:2px solid #1d4ed8;box-shadow:inset 0 0 0 1px #fff;display:none}
.ps-layer{position:absolute;left:0;top:0;width:0;height:0;overflow:visible}
.ps-img{position:absolute;z-index:3;cursor:move;border:1px solid transparent;user-select:none}
.ps-img.on{border-color:#2563eb;box-shadow:0 0 0 1px #2563eb}
.ps-img img{width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.ps-img-rs{position:absolute;right:-6px;bottom:-6px;width:11px;height:11px;background:#2563eb;border:1px solid #fff;border-radius:2px;cursor:nwse-resize;display:none}
.ps-img.on .ps-img-rs{display:block}
.ps-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:4px 8px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:12px;min-height:34px}
.ps-stabs{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.ps-stab{padding:3px 12px;border-radius:6px;border:1px solid transparent;background:#e2e8f0;color:#475569;font:600 12px system-ui,sans-serif;cursor:pointer}
.ps-stab:hover{background:#cbd5e1}
.ps-stab.on{background:#fff;color:#1d4ed8;border-color:#cbd5e1;box-shadow:0 1px 2px rgba(15,23,42,.08)}
.ps-stab-add{padding:3px 9px;border-radius:6px;border:1px dashed #94a3b8;background:transparent;color:#64748b;font:700 13px system-ui,sans-serif;cursor:pointer}
.ps-stab-add:hover{background:#fff;color:#1d4ed8}
.ps-stats{color:#475569;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}
.ps-menu{position:fixed;z-index:99999;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 14px 34px rgba(15,23,42,.18);padding:4px;min-width:210px;font:12px system-ui,sans-serif;color:#1e293b}
.ps-mi{display:flex;justify-content:space-between;gap:18px;padding:6px 10px;border-radius:6px;cursor:pointer;white-space:nowrap}
.ps-mi:hover{background:#eff6ff;color:#1d4ed8}
.ps-mi.dim{opacity:.4;pointer-events:none}
.ps-mi kbd{font:10px ui-monospace,monospace;color:#94a3b8}
.ps-msep{height:1px;background:#e2e8f0;margin:4px 2px}
.ps-ov{position:absolute;inset:0;background:rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;z-index:60;padding:12px}
.ps-dlg{background:#fff;border-radius:14px;min-width:340px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 24px 60px rgba(15,23,42,.35)}
.ps-dlg h4{margin:0;padding:14px 18px;font-size:14px;font-weight:700;border-bottom:1px solid #e2e8f0}
.ps-dlg .ps-db{padding:14px 18px;display:grid;gap:10px;font-size:12px}
.ps-dlg .ps-df{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #e2e8f0;background:#f8fafc}
.ps-dlg label{display:grid;gap:4px;font-weight:600;color:#475569}
.ps-dlg label.row{display:flex;align-items:center;gap:8px}
.ps-dlg input[type=text],.ps-dlg input[type=number],.ps-dlg select,.ps-dlg textarea{border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font:12px system-ui,sans-serif;width:100%;color:#0f172a}
.ps-dlg textarea{min-height:90px;resize:vertical}
.ps-pbtn{padding:7px 16px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;font:600 12px system-ui,sans-serif;cursor:pointer;color:#334155}
.ps-pbtn:hover{background:#f1f5f9}
.ps-pbtn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
.ps-pbtn.primary:hover{background:#1d4ed8}
.ps-pbtn.danger{color:#b91c1c;border-color:#fecaca}
.ps-toast{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;z-index:70;box-shadow:0 8px 24px rgba(15,23,42,.3);max-width:80%;animation:psIn .18s ease}
.ps-toast.err{background:#b91c1c}
.ps-toast.ok{background:#047857}
@keyframes psIn{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
.ps-tip{position:fixed;z-index:99998;max-width:280px;background:#fffbeb;border:1px solid #fde68a;padding:7px 10px;border-radius:8px;font:12px system-ui,sans-serif;box-shadow:0 6px 18px rgba(15,23,42,.15);pointer-events:none;white-space:pre-wrap;color:#78350f}
.ps-tip b{display:block;margin-bottom:2px}
.ps-fm{position:fixed;z-index:99999;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 18px 44px rgba(15,23,42,.22);width:260px;padding:10px;font:12px system-ui,sans-serif;color:#1e293b;display:grid;gap:8px}
.ps-fm .ps-fl{max-height:170px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
.ps-fm .ps-fl label{display:flex;align-items:center;gap:6px;padding:2px 4px;border-radius:4px;cursor:pointer}
.ps-fm .ps-fl label:hover{background:#eff6ff}
.ps-fm input[type=text],.ps-fm select{border:1px solid #cbd5e1;border-radius:6px;padding:5px 7px;font:12px system-ui,sans-serif;width:100%}
.ps-fm .ps-fr{display:flex;gap:6px}
@media print{.ps-ribbon,.ps-tabs,.ps-fbar,.ps-foot{display:none!important}}
`;
    function ensureStyles() {
        if (document.getElementById('panoptes-spreadsheet-css')) return;
        const s = document.createElement('style');
        s.id = 'panoptes-spreadsheet-css';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    /* ======================================================================
     *  Sayfa verisi normalleştirme (C# modeli / JSON -> iç yapı)
     * ==================================================================== */
    const DEF_W = 100, DEF_H = 24, HDR_H = 24, HDR_W = 44;

    function getField(it, f) {
        if (!it) return null;
        if (f in it) return it[f];
        const k = Object.keys(it).find(x => x.toLowerCase() === String(f).toLowerCase());
        return k ? it[k] : null;
    }
    function toItems(v) { return Array.isArray(v) ? v.map(String) : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []); }

    function normSheet(raw) {
        const o = lc(raw);
        const sh = {
            name: String(o.name || 'Sayfa 1'), rows: Math.max(1, +o.rows || 50), cols: Math.max(1, +o.cols || 26),
            cells: {}, colW: {}, rowH: {}, merges: [], frozenR: +o.frozenrows || 0, frozenC: +o.frozencols || 0,
            vals: [], eds: [], dis: [], imgs: [], filter: null, grid: o.showgridlines !== false, ds: null
        };
        Object.keys(o.columnwidths || {}).forEach(k => { sh.colW[+k] = +o.columnwidths[k]; });
        Object.keys(o.rowheights || {}).forEach(k => { sh.rowH[+k] = +o.rowheights[k]; });
        (o.cells || []).forEach(rc => {
            const c = lc(rc), r = +c.row, cc = +c.col;
            if (!(r > 0 && cc > 0)) return;
            sh.rows = Math.max(sh.rows, r); sh.cols = Math.max(sh.cols, cc);
            const cell = {}, fmt = c.format ? String(c.format) : null;
            if (c.formula) cell.f = String(c.formula).replace(/^=/, '').trim();
            else if (c.value != null && c.value !== '') {
                if (typeof c.value === 'number' || typeof c.value === 'boolean') cell.v = c.value;
                else if (fmt === 'text') cell.v = String(c.value);
                else {
                    const p = parseInput(String(c.value));
                    if (p.f != null) cell.f = p.f; else { cell.v = p.v; if (p.fmt && !fmt) cell.fmt = p.fmt; }
                }
            }
            if (fmt) cell.fmt = fmt;
            if (c.bold) cell.b = 1; if (c.italic) cell.i = 1; if (c.underline) cell.u = 1; if (c.strike) cell.s = 1;
            if (c.align) cell.al = c.align; if (c.valign) cell.va = c.valign;
            if (c.background) cell.bg = c.background; if (c.color) cell.fg = c.color;
            if (c.fontsize) cell.fs = +c.fontsize; if (c.wrap) cell.wr = 1; if (c.border) cell.bd = c.border;
            if (c.enabled === false || c.enable === false) cell.en = false;
            if (c.comment) cell.cm = String(c.comment);
            sh.cells[K(r, cc)] = cell;
        });
        (o.mergedcells || []).forEach(t => { const g = parseRange(t); if (g && (g.r1 !== g.r2 || g.c1 !== g.c2)) sh.merges.push(g); });
        (o.validations || []).forEach(v0 => {
            const v = lc(v0), g = parseRange(v.range);
            if (!g) return;
            sh.vals.push({
                g, type: v.type || 'list', comparer: v.comparer || 'between', from: v.from, to: v.to, formula: v.formula,
                items: toItems(v.items), allowNulls: v.allownulls !== false, reject: v.reject !== false,
                title: v.title || '', message: v.message || '', error: v.error || ''
            });
        });
        (o.editors || []).forEach(e0 => {
            const e = lc(e0), g = parseRange(e.range);
            if (g) sh.eds.push({ g, type: e.type || 'list', items: toItems(e.items), min: e.min, max: e.max, step: e.step });
        });
        (o.disabledranges || []).forEach(t => { const g = parseRange(t); if (g) sh.dis.push(g); });
        (o.images || []).forEach((im0, i) => {
            const im = lc(im0);
            if (im.src) sh.imgs.push({ id: 'img' + Date.now().toString(36) + i, src: im.src, r: +im.row || 1, c: +im.col || 1, x: +im.x || 0, y: +im.y || 0, w: +im.width || 160, h: +im.height || 100 });
        });
        if (o.filter) { const g = parseRange(String(o.filter)); if (g) sh.filter = { g, crit: {} }; }
        const ds = lc(o.datasource);
        if (ds.columns && ds.columns.length) {
            sh.ds = {
                columns: ds.columns.map(x0 => { const x = lc(x0); return { field: x.field, title: x.title || x.field, width: x.width, format: x.format, editor: x.editor, items: toItems(x.items) }; }),
                items: Array.isArray(ds.items) ? ds.items : []
            };
        }
        return sh;
    }

    function bindSheetData(sh) {
        const ds = sh.ds;
        if (!ds) return;
        const cols = ds.columns;
        cols.forEach((col, i) => {
            sh.cells[K(1, i + 1)] = { v: col.title, b: 1, bg: '#eff6ff', fg: '#1e3a8a' };
            if (col.width) sh.colW[i + 1] = +col.width;
        });
        ds.items.forEach((it, ri) => {
            cols.forEach((col, i) => {
                const raw = getField(it, col.field);
                if (raw == null || raw === '') return;
                const cell = {};
                if (typeof raw === 'number' || typeof raw === 'boolean') cell.v = raw;
                else if (col.format === 'text') cell.v = String(raw);
                else {
                    const s = String(raw), d = /^\d{4}-\d{2}-\d{2}/.test(s) ? parseDateText(s.slice(0, 10)) : null;
                    if (d != null) { cell.v = d; cell.fmt = 'date'; } else { const p = parseInput(s); cell.v = p.f != null ? s : p.v; if (p.fmt) cell.fmt = p.fmt; }
                }
                if (col.format) cell.fmt = col.format;
                sh.cells[K(ri + 2, i + 1)] = cell;
            });
        });
        sh.rows = Math.max(sh.rows, ds.items.length + 11);
        sh.eds = sh.eds.filter(e => !e.ds);
        cols.forEach((col, i) => {
            if (col.editor) sh.eds.push({ ds: true, g: { r1: 2, r2: sh.rows, c1: i + 1, c2: i + 1 }, type: col.editor, items: col.items || [] });
        });
    }

    /* ======================================================================
     *  Spreadsheet sınıfı
     * ==================================================================== */
    class Spreadsheet {
        constructor(el) {
            ensureStyles();
            this.el = el;
            this.id = el.id;
            const sc0 = el.querySelector('.panoptes-sheet-data');
            let data = {};
            try { data = sc0 ? JSON.parse(sc0.textContent || '{}') : {}; } catch (e) { data = {}; }
            if (Array.isArray(data)) data = { sheets: data };
            const o = lc(data.options || {});
            this.opts = {
                title: o.title || el.getAttribute('data-title') || '', height: +o.height || 520,
                toolbar: o.toolbar == null ? true : o.toolbar, formulaBar: o.formulabar !== false, sheetsBar: o.sheetsbar !== false,
                editable: o.editable !== false, resizable: !!o.resizable, exportUrl: o.exporturl || '', importUrl: o.importurl || '',
                onEvent: o.onevent || el.getAttribute('data-on-event') || '', onCellChange: o.oncellchange || el.getAttribute('data-on-cell-change') || '',
                fileName: o.filename || 'Panoptes', showGridLines: o.showgridlines !== false
            };
            this.readonly = !this.opts.editable;
            this.sheets = (data.sheets && data.sheets.length ? data.sheets : [{ name: 'Sayfa 1' }]).map(normSheet);
            this.sheets.forEach(bindSheetData);
            this.active = 0;
            this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 };
            this.cache = new Map(); this.astCache = new Map(); this.visiting = new Set(); this.override = null;
            this.undoS = []; this.redoS = []; this.clip = null; this.ls = {};
            this.hidden = new Set(); this.hl = []; this.zoom = 1; this.showFormulas = false;
            this.editing = null; this.selImg = null; this.ribbonTab = 'home';
            this.buildDom();
            this.bindEvents();
            this.bindImages();
            this.render();
            this.emit('ready', {});
        }

        /* ---------------------------- DOM ---------------------------- */
        buildDom() {
            const o = this.opts, el = this.el;
            el.classList.add('ps-root', 'panoptes-spreadsheet');
            if (o.resizable) el.classList.add('ps-resizable');
            el.style.height = o.height + 'px';
            el.innerHTML =
                (o.title ? '<div class="ps-title">' + esc(o.title) + '</div>' : '') +
                '<div class="ps-tabs"></div><div class="ps-ribbon"></div>' +
                '<div class="ps-fbar"><div class="ps-ref">A1</div><span class="ps-fx">fx</span>' +
                '<input class="ps-fin" type="text" spellcheck="false" autocomplete="off" placeholder="Değer veya formül girin (=SUM(A1:A5))"></div>' +
                '<div class="ps-scroll" tabindex="0"><div class="ps-inner"><table class="ps-table"></table><div class="ps-layer"></div><div class="ps-selbox"></div><div class="ps-actbox"></div></div></div>' +
                '<div class="ps-foot"><div class="ps-stabs"></div><div class="ps-stats"></div></div>';
            const q = s => el.querySelector(s);
            this.tabsEl = q('.ps-tabs'); this.ribbon = q('.ps-ribbon'); this.fbar = q('.ps-fbar');
            this.refEl = q('.ps-ref'); this.fin = q('.ps-fin'); this.scroll = q('.ps-scroll'); this.inner = q('.ps-inner');
            this.table = q('.ps-table'); this.layer = q('.ps-layer'); this.selbox = q('.ps-selbox'); this.actbox = q('.ps-actbox');
            this.foot = q('.ps-foot'); this.stabs = q('.ps-stabs'); this.statsEl = q('.ps-stats');
            if (!o.formulaBar) this.fbar.style.display = 'none';
            if (!o.sheetsBar) this.stabs.style.display = 'none';
            this.buildRibbon();
        }

        cur() { return this.sheets[this.active]; }
        on(type, fn) { (this.ls[type] = this.ls[type] || []).push(fn); return this; }
        emit(type, data) {
            const e = Object.assign({ type, sender: this, sheet: this.cur() ? this.cur().name : '' }, data || {});
            (this.ls[type] || []).forEach(f => f(e));
            (this.ls['*'] || []).forEach(f => f(e));
            const fn = this.opts.onEvent;
            if (fn && typeof window[fn] === 'function') { try { window[fn](e); } catch (err) { console.error(err); } }
        }
        toast(msg, kind) {
            const t = document.createElement('div');
            t.className = 'ps-toast' + (kind ? ' ' + kind : '');
            t.textContent = msg;
            this.el.appendChild(t);
            setTimeout(() => t.remove(), 2800);
        }

        /* ------------------------- Hesaplama -------------------------- */
        invalidate() { this.cache.clear(); }
        sheetIndex(name) {
            const i = this.sheets.findIndex(s => s.name.toLowerCase() === String(name).toLowerCase());
            if (i < 0) fail(E.REF);
            return i;
        }
        valueAt(si, r, c) {
            const key = K(r, c), sh = this.sheets[si];
            if (!sh) return null;
            if (this.override && this.override.si === si && this.override.key === key) return this.override.v;
            const cell = sh.cells[key];
            if (!cell) return null;
            if (!cell.f) return cell.v == null ? null : cell.v;
            const ck = si + '|' + key;
            if (this.cache.has(ck)) return this.cache.get(ck);
            if (this.visiting.has(ck)) return new SErr(E.CIRC);
            this.visiting.add(ck);
            let v;
            try {
                let ast = this.astCache.get(cell.f);
                if (!ast) { ast = parseFormula(cell.f); this.astCache.set(cell.f, ast); }
                v = ev(ast, { sheet: name => (name == null ? si : this.sheetIndex(name)), value: (s, rr, cc) => this.valueAt(s, rr, cc) });
                if (v instanceof RangeVal) v = v.first();
                if (v === undefined) v = null;
                if (typeof v === 'number' && !isFinite(v)) v = new SErr(E.NUM);
            } catch (e) {
                v = e instanceof SErr ? e : new SErr(E.ERR);
                if (!(e instanceof SErr)) console.error(e);
            } finally { this.visiting.delete(ck); }
            this.cache.set(ck, v);
            return v;
        }
        valueOf(r, c) { return this.valueAt(this.active, r, c); }

        /* ------------------------ Geometri / yardımcılar ------------------------ */
        cw(sh, c) { return sh.colW[c] || DEF_W; }
        rh(sh, r) { return this.hidden.has(r) ? 0 : (sh.rowH[r] || DEF_H); }
        geom(sh) {
            const colX = [0], rowY = [0];
            let x = HDR_W, y = HDR_H;
            for (let c = 1; c <= sh.cols; c++) { colX[c] = x; x += this.cw(sh, c); }
            colX[sh.cols + 1] = x;
            for (let r = 1; r <= sh.rows; r++) { rowY[r] = y; y += this.rh(sh, r); }
            rowY[sh.rows + 1] = y;
            this.geo = { colX, rowY, W: x, H: y };
        }
        mergeAt(sh, r, c) { for (let i = 0; i < sh.merges.length; i++) if (inRange(sh.merges[i], r, c)) return sh.merges[i]; return null; }
        normPt(sh, r, c) { const m = this.mergeAt(sh, r, c); return m ? { r: m.r1, c: m.c1 } : { r, c }; }
        range() {
            const sh = this.cur(), a = this.anchor, f = this.focus;
            const g = { r1: Math.min(a.r, f.r), r2: Math.max(a.r, f.r), c1: Math.min(a.c, f.c), c2: Math.max(a.c, f.c) };
            let ch = true;
            while (ch) {
                ch = false;
                for (const m of sh.merges) {
                    if (overlaps(m, g)) {
                        if (m.r1 < g.r1) { g.r1 = m.r1; ch = true; }
                        if (m.r2 > g.r2) { g.r2 = m.r2; ch = true; }
                        if (m.c1 < g.c1) { g.c1 = m.c1; ch = true; }
                        if (m.c2 > g.c2) { g.c2 = m.c2; ch = true; }
                    }
                }
            }
            return g;
        }
        isDisabled(sh, r, c) {
            const cell = sh.cells[K(r, c)];
            if (cell && cell.en === false) return true;
            for (let i = 0; i < sh.dis.length; i++) if (inRange(sh.dis[i], r, c)) return true;
            return false;
        }
        editorFor(sh, r, c) {
            for (let i = 0; i < sh.eds.length; i++) if (inRange(sh.eds[i].g, r, c)) return sh.eds[i];
            const rule = this.ruleFor(sh, r, c);
            if (rule && rule.type === 'list') return { type: 'list', items: rule.items };
            return null;
        }
        ruleFor(sh, r, c) {
            for (let i = 0; i < sh.vals.length; i++) if (inRange(sh.vals[i].g, r, c)) return sh.vals[i];
            return null;
        }
        passCrit(si, r, c, crit) {
            const v = this.valueAt(si, r, c), cell = this.sheets[si].cells[K(r, c)];
            const text = formatValue(v, cell && cell.fmt);
            if (crit.values && crit.values.indexOf(text) < 0) return false;
            if (crit.op) {
                const t = text.toLocaleLowerCase('tr'), q = String(crit.val == null ? '' : crit.val).toLocaleLowerCase('tr');
                const qn = parseCompareValue(crit.val), vn = typeof v === 'number' ? v : parseCompareValue(text);
                const cmpv = () => (typeof vn === 'number' && typeof qn === 'number') ? vn - qn : t < q ? -1 : t > q ? 1 : 0;
                switch (crit.op) {
                    case 'contains': return t.indexOf(q) >= 0;
                    case 'notContains': return t.indexOf(q) < 0;
                    case 'eq': return cmpv() === 0;
                    case 'neq': return cmpv() !== 0;
                    case 'startsWith': return t.startsWith(q);
                    case 'endsWith': return t.endsWith(q);
                    case 'gt': return cmpv() > 0;
                    case 'gte': return cmpv() >= 0;
                    case 'lt': return cmpv() < 0;
                    case 'lte': return cmpv() <= 0;
                    case 'empty': return t === '';
                    case 'notEmpty': return t !== '';
                }
            }
            return true;
        }
        computeHidden(sh, si) {
            const hid = new Set(); this.filterInfo = null;
            const f = sh.filter;
            if (f) {
                const g = f.g, last = Math.min(sh.rows, g.r2), keys = Object.keys(f.crit);
                let shown = 0, total = 0;
                for (let r = g.r1 + 1; r <= last; r++) {
                    total++;
                    let ok = true;
                    for (let i = 0; i < keys.length; i++) if (!this.passCrit(si, r, +keys[i], f.crit[keys[i]])) { ok = false; break; }
                    if (ok) shown++; else hid.add(r);
                }
                this.filterInfo = { shown, total };
            }
            this.hidden = hid;
        }
        /** Hücrenin biçimsiz, düzenlenebilir metin karşılığı. */
        editText(r, c, si) {
            si = si == null ? this.active : si;
            const cell = this.sheets[si].cells[K(r, c)];
            if (!cell) return '';
            if (cell.f) return '=' + cell.f;
            const v = cell.v;
            if (v == null) return '';
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            if (typeof v === 'number') {
                if (cell.fmt === 'percent' || cell.fmt === 'percent2' || cell.fmt === '0%' || cell.fmt === '0.00%') return fmtGeneral(Math.round(v * 1e8) / 1e6) + '%';
                if (cell.fmt && (cell.fmt === 'date' || cell.fmt === 'datetime' || /^[dMy]/.test(cell.fmt))) return formatValue(v, 'dd.MM.yyyy');
                return fmtGeneral(v);
            }
            return String(v);
        }
        tdAt(r, c) { return this.table.querySelector('td.ps-c[data-r="' + r + '"][data-c="' + c + '"]'); }

        /* --------------------------- Görüntüleme --------------------------- */
        cellHtml(sh, si, r, c, m) {
            const cell = sh.cells[K(r, c)], val = this.valueAt(si, r, c);
            const ed = this.editorFor(sh, r, c), dis = this.isDisabled(sh, r, c), G = this.geo;
            let cls = 'ps-c', st = '', inner = '', al = cell && cell.al;
            const isErr = val instanceof SErr;
            if (this.showFormulas && cell && cell.f) inner = esc('=' + cell.f);
            else if (ed && ed.type === 'checkbox') {
                inner = '<input type="checkbox" class="ps-chk" data-r="' + r + '" data-c="' + c + '"' + (val === true ? ' checked' : '') + (dis || this.readonly ? ' disabled' : '') + '>';
                al = al || 'center';
            } else if (ed && ed.type === 'color' && typeof val === 'string' && val) inner = '<span class="ps-swatch" style="background:' + esc(val) + '"></span>' + esc(val);
            else inner = esc(formatValue(val, (cell && cell.fmt) || (ed && ed.type === 'rating' ? 'stars' : null)));
            if (!al) al = (isErr || typeof val === 'boolean') ? 'center' : (typeof val === 'number' ? 'right' : 'left');
            st += 'text-align:' + al + ';';
            if (cell) {
                if (cell.b) st += 'font-weight:700;';
                if (cell.i) st += 'font-style:italic;';
                if (cell.u || cell.s) st += 'text-decoration:' + (cell.u ? 'underline' : '') + (cell.u && cell.s ? ' ' : '') + (cell.s ? 'line-through' : '') + ';';
                if (cell.bg) st += 'background-color:' + esc(cell.bg) + ';';
                if (cell.fg) st += 'color:' + esc(cell.fg) + ';';
                if (cell.fs) st += 'font-size:' + (+cell.fs) + 'px;';
                if (cell.wr) st += 'white-space:normal;word-break:break-word;';
                if (cell.va) st += 'vertical-align:' + ({ top: 'top', bottom: 'bottom' }[cell.va] || 'middle') + ';';
                if (cell.bd) {
                    const sd = [];
                    if (cell.bd.indexOf('t') >= 0) sd.push('inset 0 1px 0 0 #0f172a');
                    if (cell.bd.indexOf('b') >= 0) sd.push('inset 0 -1px 0 0 #0f172a');
                    if (cell.bd.indexOf('l') >= 0) sd.push('inset 1px 0 0 0 #0f172a');
                    if (cell.bd.indexOf('r') >= 0) sd.push('inset -1px 0 0 0 #0f172a');
                    if (sd.length) st += 'box-shadow:' + sd.join(',') + ';';
                }
                if (cell.cm) cls += ' ps-cm';
            }
            if (isErr) cls += ' ps-err';
            if (dis) cls += ' ps-dis';
            if (ed && ed.type === 'list') cls += ' ps-list';
            const rule = this.ruleFor(sh, r, c);
            if (rule && val != null && val !== '' && !this.checkRule(rule, val, sh, r, c)) cls += ' ps-bad';
            const fr = r <= sh.frozenR, fc = c <= sh.frozenC;
            if (fr || fc) {
                cls += ' ps-fz';
                st += 'position:sticky;z-index:' + (fr && fc ? 3 : 2) + ';';
                if (fr) st += 'top:' + G.rowY[r] + 'px;';
                if (fc) st += 'left:' + G.colX[c] + 'px;';
                if (fc && c === sh.frozenC) st += 'border-right:2px solid #94a3b8;';
                if (fr && r === sh.frozenR) st += 'border-bottom:2px solid #94a3b8;';
            }
            if (sh.filter && r === sh.filter.g.r1 && c >= sh.filter.g.c1 && c <= sh.filter.g.c2) {
                inner += '<span class="ps-fbtn' + (sh.filter.crit[c] ? ' on' : '') + '" data-c="' + c + '">▾</span>';
                st += 'padding-right:24px;';
            }
            const span = m ? ' colspan="' + (m.c2 - m.c1 + 1) + '" rowspan="' + (m.r2 - m.r1 + 1) + '"' : '';
            return '<td class="' + cls + '" data-r="' + r + '" data-c="' + c + '"' + span + ' style="' + st + '">' + inner + '</td>';
        }

        render() {
            this.clampSel();
            const sh = this.cur(), si = this.active;
            this.editing = null;
            this.computeHidden(sh, si);
            this.geom(sh);
            const G = this.geo, anchors = {}, covered = new Set();
            sh.merges.forEach(m => {
                anchors[K(m.r1, m.c1)] = m;
                for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) if (!(r === m.r1 && c === m.c1)) covered.add(K(r, c));
            });
            let h = '<colgroup><col style="width:' + HDR_W + 'px">';
            for (let c = 1; c <= sh.cols; c++) h += '<col style="width:' + this.cw(sh, c) + 'px">';
            h += '</colgroup><thead><tr><th class="ps-corner" data-all="1"></th>';
            for (let c = 1; c <= sh.cols; c++) {
                const fz = c <= sh.frozenC ? ';left:' + G.colX[c] + 'px;z-index:6' : '';
                h += '<th class="ps-colh" data-c="' + c + '" style="' + (fz ? fz.slice(1) : '') + '">' + colToLetter(c) + '<i class="ps-colrs" data-c="' + c + '"></i></th>';
            }
            h += '</tr></thead><tbody>';
            for (let r = 1; r <= sh.rows; r++) {
                const hid = this.hidden.has(r);
                h += '<tr data-r="' + r + '" style="height:' + (hid ? 0 : (sh.rowH[r] || DEF_H)) + 'px' + (hid ? ';display:none' : '') + '">';
                h += '<th class="ps-rowh" data-r="' + r + '"' + (r <= sh.frozenR ? ' style="top:' + G.rowY[r] + 'px;z-index:6"' : '') + '>' + r + '<i class="ps-rowrs" data-r="' + r + '"></i></th>';
                for (let c = 1; c <= sh.cols; c++) {
                    const k = K(r, c);
                    if (covered.has(k)) continue;
                    h += this.cellHtml(sh, si, r, c, anchors[k]);
                }
                h += '</tr>';
            }
            h += '</tbody>';
            this.table.innerHTML = h;
            this.table.style.width = G.W + 'px';
            this.table.classList.toggle('ps-nogrid', !(sh.grid && this.opts.showGridLines));
            this.inner.style.zoom = this.zoom === 1 ? '' : this.zoom;
            this.colHs = []; this.rowHs = [];
            this.table.querySelectorAll('th.ps-colh').forEach(e => { this.colHs[+e.dataset.c] = e; });
            this.table.querySelectorAll('th.ps-rowh').forEach(e => { this.rowHs[+e.dataset.r] = e; });
            this.hl = [];
            this.renderLayer();
            this.renderTabs();
            this.updateSelection(true);
            this.updateRibbon();
        }

        updateSelection(noScroll) {
            const sh = this.cur(), G = this.geo;
            if (!G) return;
            const g = this.range();
            const a = this.normPt(sh, this.anchor.r, this.anchor.c), am = this.mergeAt(sh, a.r, a.c);
            const box = (el, x1, y1, x2, y2) => { el.style.display = 'block'; el.style.left = x1 + 'px'; el.style.top = y1 + 'px'; el.style.width = (x2 - x1) + 'px'; el.style.height = (y2 - y1) + 'px'; };
            if (this.editing) { this.selbox.style.display = 'none'; this.actbox.style.display = 'none'; }
            else {
                const ar1 = am ? am.r1 : a.r, ar2 = am ? am.r2 : a.r, ac1 = am ? am.c1 : a.c, ac2 = am ? am.c2 : a.c;
                box(this.actbox, G.colX[ac1], G.rowY[ar1], G.colX[ac2 + 1], G.rowY[ar2 + 1]);
                const single = (g.r1 === g.r2 && g.c1 === g.c2) || (am && g.r1 === am.r1 && g.r2 === am.r2 && g.c1 === am.c1 && g.c2 === am.c2);
                if (single) this.selbox.style.display = 'none'; else box(this.selbox, G.colX[g.c1], G.rowY[g.r1], G.colX[g.c2 + 1], G.rowY[g.r2 + 1]);
            }
            this.hl.forEach(e => e.classList.remove('ps-hl'));
            this.hl = [];
            for (let c = g.c1; c <= g.c2; c++) if (this.colHs[c]) { this.colHs[c].classList.add('ps-hl'); this.hl.push(this.colHs[c]); }
            for (let r = g.r1; r <= g.r2; r++) if (this.rowHs[r]) { this.rowHs[r].classList.add('ps-hl'); this.hl.push(this.rowHs[r]); }
            this.refEl.textContent = rangeStr(g);
            if (!this.fbFocus) this.fin.value = this.editText(a.r, a.c);
            this.fin.disabled = this.readonly;
            this.updateStatus(g);
            this.showInputTip(sh, a.r, a.c);
            const key = rangeStr(g) + '|' + this.active;
            if (key !== this._lastSel) { this._lastSel = key; if (!noScroll) this.emit('select', { range: rangeStr(g), row: a.r, col: a.c }); }
            if (!noScroll) this.scrollToCell(this.focus.r, this.focus.c);
            this.updateRibbon();
        }

        updateStatus(g) {
            const si = this.active, area = (g.r2 - g.r1 + 1) * (g.c2 - g.c1 + 1);
            let txt = '';
            if (area > 1 && area <= 40000) {
                let sum = 0, cnt = 0, nn = 0, mn = Infinity, mx = -Infinity;
                for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) {
                    const v = this.valueAt(si, r, c);
                    if (v != null && v !== '') cnt++;
                    if (typeof v === 'number') { nn++; sum += v; if (v < mn) mn = v; if (v > mx) mx = v; }
                }
                if (nn >= 2) txt = 'Toplam: ' + formatValue(sum) + '  ·  Ort: ' + formatValue(sum / nn) + '  ·  Say: ' + cnt + '  ·  Min: ' + formatValue(mn) + '  ·  Max: ' + formatValue(mx);
                else if (cnt > 1) txt = 'Say: ' + cnt;
            }
            if (this.filterInfo) txt = (txt ? txt + '   |   ' : '') + 'Filtre: ' + this.filterInfo.shown + ' / ' + this.filterInfo.total + ' kayıt';
            this.statsEl.textContent = txt || (this.readonly ? 'Salt okunur' : 'Çift tıklayın veya yazmaya başlayın');
        }

        scrollToCell(r, c) {
            const sh = this.cur(), G = this.geo, sc1 = this.scroll, z = this.zoom;
            if (!G || r > sh.rows || c > sh.cols) return;
            const x1 = G.colX[c] * z, x2 = G.colX[c + 1] * z, y1 = G.rowY[r] * z, y2 = G.rowY[r + 1] * z;
            const fW = sh.frozenC ? (G.colX[sh.frozenC + 1]) * z : HDR_W * z, fH = sh.frozenR ? (G.rowY[sh.frozenR + 1]) * z : HDR_H * z;
            if (c > sh.frozenC) {
                const visL = sc1.scrollLeft + fW, visR = sc1.scrollLeft + sc1.clientWidth;
                if (x1 < visL) sc1.scrollLeft -= (visL - x1); else if (x2 > visR) sc1.scrollLeft += (x2 - visR);
            }
            if (r > sh.frozenR) {
                const visT = sc1.scrollTop + fH, visB = sc1.scrollTop + sc1.clientHeight;
                if (y1 < visT) sc1.scrollTop -= (visT - y1); else if (y2 > visB) sc1.scrollTop += (y2 - visB);
            }
        }

        renderTabs() {
            const frag = [];
            this.sheets.forEach((s, i) => frag.push('<button type="button" class="ps-stab' + (i === this.active ? ' on' : '') + '" data-i="' + i + '">' + esc(s.name) + '</button>'));
            if (!this.readonly) frag.push('<button type="button" class="ps-stab-add" data-add="1" title="Yeni sayfa ekle">+</button>');
            this.stabs.innerHTML = frag.join('');
        }

        /* ====================== Seçim & Gezinti ====================== */
        clampR(r) { return Math.max(1, Math.min(this.cur().rows, r)); }
        clampC(c) { return Math.max(1, Math.min(this.cur().cols, c)); }
        setSel(ar, ac, fr, fc, noScroll) {
            const sh = this.cur();
            const n = this.normPt(sh, this.clampR(ar), this.clampC(ac));
            this.anchor = n;
            this.focus = fr == null ? { r: n.r, c: n.c } : { r: this.clampR(fr), c: this.clampC(fc) };
            this.updateSelection(noScroll);
        }
        selectRange(ref) {
            const g = typeof ref === 'string' ? parseRange(ref) : ref;
            if (g) this.setSel(g.r1, g.c1, g.r2, g.c2);
        }
        selectAll() { const sh = this.cur(); this.setSel(1, 1, sh.rows, sh.cols); }
        usedRange() {
            const sh = this.cur(); let r = 1, c = 1;
            Object.keys(sh.cells).forEach(k => { const p = k.split(','); const cell = sh.cells[k]; if (cell.v != null || cell.f) { r = Math.max(r, +p[0]); c = Math.max(c, +p[1]); } });
            return { r, c };
        }
        jumpTarget(r, c, dr, dc) {
            const sh = this.cur(), si = this.active;
            const filled = (rr, cc) => { const v = this.valueAt(si, rr, cc); return v != null && v !== ''; };
            const out = (rr, cc) => rr < 1 || cc < 1 || rr > sh.rows || cc > sh.cols;
            let nr = r + dr, nc = c + dc;
            if (out(nr, nc)) return { r, c };
            if (filled(r, c) && filled(nr, nc)) {
                for (;;) { const tr = nr + dr, tc = nc + dc; if (out(tr, tc) || !filled(tr, tc)) break; nr = tr; nc = tc; }
            } else {
                for (;;) { if (filled(nr, nc)) break; const tr = nr + dr, tc = nc + dc; if (out(tr, tc)) break; nr = tr; nc = tc; }
            }
            return { r: nr, c: nc };
        }
        moveActive(dr, dc, extend, jump) {
            const sh = this.cur(), base = extend ? this.focus : this.anchor;
            let r = base.r, c = base.c;
            if (jump) { const t = this.jumpTarget(r, c, dr, dc); r = t.r; c = t.c; }
            else {
                const m = this.mergeAt(sh, r, c);
                if (m && !extend) { if (dr > 0) r = m.r2; if (dc > 0) c = m.c2; }
                r += dr; c += dc;
                if (dr) { let rr = r; while (rr >= 1 && rr <= sh.rows && this.hidden.has(rr)) rr += dr; r = (rr < 1 || rr > sh.rows) ? base.r : rr; }
            }
            r = this.clampR(r); c = this.clampC(c);
            if (extend) this.focus = { r, c };
            else { const n = this.normPt(sh, r, c); this.anchor = n; this.focus = { r: n.r, c: n.c }; }
            this.updateSelection();
        }

        /* ====================== Düzenleme ====================== */
        beginEdit(initial) {
            if (this.readonly) return;
            const sh = this.cur(), a = this.normPt(sh, this.anchor.r, this.anchor.c);
            if (this.isDisabled(sh, a.r, a.c)) {
                this.emit('blocked', { row: a.r, col: a.c, ref: colToLetter(a.c) + a.r });
                this.toast('Bu hücre kilitli, düzenlenemez.', 'err');
                return;
            }
            const ed = this.editorFor(sh, a.r, a.c);
            if (ed && ed.type === 'checkbox') return;
            const td = this.tdAt(a.r, a.c);
            if (!td) return;
            this.hideTip();
            const type = ed ? ed.type : 'text', cell = sh.cells[K(a.r, a.c)], curText = this.editText(a.r, a.c);
            let input;
            if (type === 'list' || type === 'rating') {
                input = document.createElement('select');
                const items = type === 'rating' ? ['0', '1', '2', '3', '4', '5'] : (ed.items || []).slice();
                if (curText && items.indexOf(curText) < 0) items.unshift(curText);
                let opts = '<option value=""></option>';
                items.forEach(it => { opts += '<option value="' + esc(it) + '"' + (String(it) === curText ? ' selected' : '') + '>' + (type === 'rating' ? ('★'.repeat(+it) || '—') : esc(it)) + '</option>'; });
                input.innerHTML = opts;
            } else if (type === 'date') {
                input = document.createElement('input'); input.type = 'date';
                const v = this.valueAt(this.active, a.r, a.c);
                if (typeof v === 'number') input.value = serialToISO(v);
            } else if (type === 'number') {
                input = document.createElement('input'); input.type = 'number';
                if (ed.min != null) input.min = ed.min; if (ed.max != null) input.max = ed.max; input.step = ed.step != null ? ed.step : 'any';
                input.value = cell && typeof cell.v === 'number' ? cell.v : '';
            } else if (type === 'color') {
                input = document.createElement('input'); input.type = 'color';
                input.value = /^#[0-9a-f]{6}$/i.test(curText) ? curText : '#2563eb';
            } else {
                input = document.createElement('input'); input.type = 'text';
                input.value = initial != null ? initial : curText;
            }
            input.className = 'ps-edit'; input.spellcheck = false;
            td.classList.add('ps-editing');
            td.appendChild(input);
            this.editing = { r: a.r, c: a.c, input, type, mode: initial != null ? 'enter' : 'edit' };
            this.updateSelection(true);
            input.focus();
            if (input.type === 'text') { const n = input.value.length; try { input.setSelectionRange(n, n); } catch (e) { /* yoksay */ } }
            if (input.tagName === 'SELECT' && input.showPicker) { try { input.showPicker(); } catch (e) { /* yoksay */ } }
            input.addEventListener('keydown', ev => this.onEditKey(ev));
            input.addEventListener('input', () => { if (type === 'text') this.fin.value = input.value; });
            input.addEventListener('blur', () => { if (this.editing && this.editing.input === input) this.commitEdit(0, 0); });
            if (type === 'list' || type === 'rating') input.addEventListener('change', () => { if (this.editing && this.editing.input === input) this.commitEdit(0, 0); });
        }
        onEditKey(ev) {
            const ed = this.editing;
            if (!ed) return;
            const k = ev.key;
            ev.stopPropagation();
            if (k === 'Enter' && !ev.altKey) { ev.preventDefault(); this.commitEdit(ev.shiftKey ? -1 : 1, 0); }
            else if (k === 'Tab') { ev.preventDefault(); this.commitEdit(0, ev.shiftKey ? -1 : 1); }
            else if (k === 'Escape') { ev.preventDefault(); this.cancelEdit(); }
            else if (ed.mode === 'enter' && ed.type === 'text' && /^Arrow(Up|Down|Left|Right)$/.test(k)) {
                ev.preventDefault();
                this.commitEdit(k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0, k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0);
            }
        }
        commitEdit(dr, dc) {
            const ed = this.editing;
            if (!ed) return;
            this.editing = null;
            const val = ed.input.value, td = ed.input.parentNode;
            ed.input.remove();
            if (td) td.classList.remove('ps-editing');
            const ok = this.applyInput(ed.r, ed.c, val, ed.type);
            if (!ok) this.updateSelection(true);
            if (dr || dc) this.moveActive(dr, dc);
            this.scroll.focus({ preventScroll: true });
        }
        cancelEdit() {
            const ed = this.editing;
            if (!ed) return;
            this.editing = null;
            const td = ed.input.parentNode;
            ed.input.remove();
            if (td) td.classList.remove('ps-editing');
            this.updateSelection(true);
            this.scroll.focus({ preventScroll: true });
        }

        setRaw(sh, r, c, p) {
            const k = K(r, c);
            const cell = sh.cells[k] || (sh.cells[k] = {});
            if (p.f != null) { cell.f = p.f; delete cell.v; }
            else { delete cell.f; if (p.v == null) delete cell.v; else cell.v = p.v; }
            if (p.fmt && !cell.fmt) cell.fmt = p.fmt;
            this.prune(sh, k);
        }
        prune(sh, k) { const c = sh.cells[k]; if (c && Object.keys(c).length === 0) delete sh.cells[k]; }

        /** Hücreye metin girer (ayrıştırma + doğrulama + olaylar). Başarılıysa true. */
        applyInput(r, c, text, type) {
            const sh = this.cur(), si = this.active, cell = sh.cells[K(r, c)];
            let p;
            if (type === 'color') p = { v: text || null };
            else if (type === 'date') { p = text ? { v: parseDateText(text), fmt: 'date' } : { v: null }; }
            else if (type === 'number' || type === 'rating') p = text === '' ? { v: null } : { v: Number(text) };
            else if (cell && cell.fmt === 'text') p = { v: text === '' ? null : String(text) };
            else p = parseInput(text);
            if (p.f == null && !(cell && cell.f) && (cell && cell.v != null ? cell.v : null) === (p.v != null ? p.v : null)) return true;
            if (p.f == null) {
                const rule = this.ruleFor(sh, r, c);
                if (rule && !this.validateInput(rule, p.v, sh, r, c)) return false;
            }
            const oldVal = this.valueAt(si, r, c);
            this.mutate(() => this.setRaw(sh, r, c, p));
            const nv = this.valueAt(si, r, c), ref = colToLetter(c) + r;
            this.emit('change', { row: r, col: c, ref, value: nv instanceof SErr ? nv.code : nv, formula: p.f != null ? '=' + p.f : null, oldValue: oldVal instanceof SErr ? oldVal.code : oldVal });
            const fn = this.opts.onCellChange;
            if (fn && typeof window[fn] === 'function') window[fn]({ row: r, col: c, ref, value: text });
            return true;
        }
        validateInput(rule, v, sh, r, c) {
            if (this.checkRule(rule, v, sh, r, c)) return true;
            const msg = rule.error || rule.message || 'Girilen değer doğrulama kuralına uymuyor.';
            this.emit('validation', { row: r, col: c, ref: colToLetter(c) + r, value: v, rejected: rule.reject, message: msg });
            if (rule.reject) { this.toast((rule.title ? rule.title + ': ' : '') + msg, 'err'); return false; }
            return window.confirm((rule.title ? rule.title + '\n' : '') + msg + '\n\nYine de girilsin mi?');
        }

        /* ====================== Geri al / Yinele ====================== */
        snap() { return { sheets: clone(this.sheets), active: this.active, anchor: Object.assign({}, this.anchor), focus: Object.assign({}, this.focus) }; }
        pushUndo() { this.undoS.push(this.snap()); if (this.undoS.length > 150) this.undoS.shift(); this.redoS = []; }
        mutate(fn) { this.pushUndo(); fn(); this.afterMutate(); }
        afterMutate() { this.cache.clear(); this.syncDataSources(); this.render(); }
        restore(s) {
            this.sheets = s.sheets; this.active = Math.min(s.active, this.sheets.length - 1);
            this.anchor = s.anchor; this.focus = s.focus; this.cache.clear(); this.render();
        }
        undo() { if (!this.undoS.length) return; this.redoS.push(this.snap()); this.restore(this.undoS.pop()); this.emit('undo', {}); }
        redo() { if (!this.redoS.length) return; this.undoS.push(this.snap()); this.restore(this.redoS.pop()); this.emit('redo', {}); }

        syncDataSources() {
            this.sheets.forEach((sh, si) => {
                const ds = sh.ds;
                if (!ds) return;
                const out = [];
                for (let r = 2; r <= sh.rows; r++) {
                    let any = false;
                    const it = Object.assign({}, ds.items[out.length] || {});
                    ds.columns.forEach((col, i) => {
                        let v = this.valueAt(si, r, i + 1);
                        const cell = sh.cells[K(r, i + 1)];
                        if (v instanceof SErr) v = null;
                        if (v != null && v !== '') any = true;
                        if (typeof v === 'number' && cell && (cell.fmt === 'date' || cell.fmt === 'datetime')) v = serialToISO(v);
                        it[col.field] = v == null ? null : v;
                    });
                    if (any) out.push(it);
                }
                if (JSON.stringify(out) !== JSON.stringify(ds.items)) {
                    ds.items.length = 0; out.forEach(x => ds.items.push(x));
                    this.emit('dataChange', { items: ds.items });
                }
            });
        }

        /* ====================== Pano (kopyala / yapıştır) ====================== */
        copyRange(cut) {
            const g = this.range(), sh = this.cur(), si = this.active, cells = {}, lines = [];
            for (let r = g.r1; r <= g.r2; r++) {
                const line = [];
                for (let c = g.c1; c <= g.c2; c++) {
                    const cell = sh.cells[K(r, c)];
                    cells[K(r - g.r1, c - g.c1)] = cell ? clone(cell) : null;
                    line.push(formatValue(this.valueAt(si, r, c), cell && cell.fmt).replace(/[\t\r\n]+/g, ' '));
                }
                if (!this.hidden.has(r)) lines.push(line.join('\t'));
            }
            this.clip = { g, cells, si, cut: !!cut && !this.readonly, tsv: lines.join('\n') };
            return this.clip.tsv;
        }
        pasteText(text) {
            if (this.readonly) return;
            const sh = this.cur(), g = this.range(), r0 = g.r1, c0 = g.c1, clip = this.clip;
            let applied;
            if (clip && (text === '' || text.replace(/\r/g, '') === clip.tsv)) {
                const h = clip.g.r2 - clip.g.r1 + 1, w = clip.g.c2 - clip.g.c1 + 1;
                const selH = g.r2 - g.r1 + 1, selW = g.c2 - g.c1 + 1;
                const tH = (h === 1 && w === 1) ? selH : h, tW = (h === 1 && w === 1) ? selW : w;
                applied = { r1: r0, c1: c0, r2: Math.min(sh.rows, r0 + tH - 1), c2: Math.min(sh.cols, c0 + tW - 1) };
                this.mutate(() => {
                    for (let dr = 0; dr < tH; dr++) for (let dc = 0; dc < tW; dc++) {
                        const r = r0 + dr, c = c0 + dc;
                        if (r > sh.rows || c > sh.cols || this.isDisabled(sh, r, c)) continue;
                        const sr = dr % h, sc2 = dc % w, src = clip.cells[K(sr, sc2)], k = K(r, c);
                        if (src) {
                            const nc = clone(src);
                            if (nc.f) nc.f = shiftFormula(nc.f, r - (clip.g.r1 + sr), c - (clip.g.c1 + sc2));
                            sh.cells[k] = nc;
                        } else delete sh.cells[k];
                    }
                    if (clip.cut && clip.si === this.active) {
                        for (let r = clip.g.r1; r <= clip.g.r2; r++) for (let c = clip.g.c1; c <= clip.g.c2; c++) if (!inRange(applied, r, c)) delete sh.cells[K(r, c)];
                    }
                });
                if (clip.cut) this.clip = null;
            } else {
                const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(l => l.split('\t'));
                const maxW = Math.max.apply(null, rows.map(x => x.length));
                applied = { r1: r0, c1: c0, r2: Math.min(sh.rows, r0 + rows.length - 1), c2: Math.min(sh.cols, c0 + maxW - 1) };
                this.mutate(() => {
                    rows.forEach((row, dr) => row.forEach((txt, dc) => {
                        const r = r0 + dr, c = c0 + dc;
                        if (r > sh.rows || c > sh.cols || this.isDisabled(sh, r, c)) return;
                        const cell = sh.cells[K(r, c)];
                        const p = (cell && cell.fmt === 'text') ? { v: txt || null } : parseInput(txt);
                        const rule = this.ruleFor(sh, r, c);
                        if (rule && rule.reject && p.f == null && !this.checkRule(rule, p.v, sh, r, c)) return;
                        this.setRaw(sh, r, c, p);
                    }));
                });
            }
            this.anchor = { r: applied.r1, c: applied.c1 }; this.focus = { r: applied.r2, c: applied.c2 };
            this.updateSelection();
            this.emit('paste', { range: rangeStr(applied) });
        }
        clearContents(g) {
            if (this.readonly) return;
            g = g || this.range();
            const sh = this.cur();
            let any = false;
            this.mutate(() => {
                for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) {
                    const k = K(r, c), cell = sh.cells[k];
                    if (!cell || this.isDisabled(sh, r, c)) continue;
                    if (cell.v != null || cell.f) { any = true; delete cell.v; delete cell.f; this.prune(sh, k); }
                }
            });
            if (any) this.emit('clear', { range: rangeStr(g) });
        }

        /* ====================== İpucu (tooltip) ====================== */
        showTip(html, x, y) {
            this.hideTip();
            const t = document.createElement('div');
            t.className = 'ps-tip'; t.innerHTML = html;
            document.body.appendChild(t);
            const w = t.offsetWidth;
            t.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 8)) + 'px';
            t.style.top = y + 'px';
            this.tip = t;
        }
        hideTip() { if (this.tip) { this.tip.remove(); this.tip = null; } }
        showInputTip(sh, r, c) {
            this.hideTip();
            const rule = this.ruleFor(sh, r, c);
            if (!rule || !(rule.message || rule.title) || this.editing) return;
            const td = this.tdAt(r, c);
            if (!td) return;
            const rc = td.getBoundingClientRect(), sr = this.scroll.getBoundingClientRect();
            if (rc.bottom < sr.top || rc.top > sr.bottom) return;
            this.showTip((rule.title ? '<b>' + esc(rule.title) + '</b>' : '') + esc(rule.message), rc.left, rc.bottom + 4);
        }

        /* ====================== Bağlam menüsü ====================== */
        openMenu(x, y, items) {
            this.closeMenu();
            const m = document.createElement('div');
            m.className = 'ps-menu';
            items.forEach(it => {
                if (it === '-') { const s = document.createElement('div'); s.className = 'ps-msep'; m.appendChild(s); return; }
                const d = document.createElement('div');
                d.className = 'ps-mi' + (it.disabled ? ' dim' : '');
                d.innerHTML = '<span>' + esc(it.label) + '</span>' + (it.kbd ? '<kbd>' + esc(it.kbd) + '</kbd>' : '');
                d.addEventListener('mousedown', ev => ev.preventDefault());
                d.addEventListener('click', () => { this.closeMenu(); it.run(); });
                m.appendChild(d);
            });
            document.body.appendChild(m);
            const w = m.offsetWidth, h = m.offsetHeight;
            m.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 8)) + 'px';
            m.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 8)) + 'px';
            this.menu = m;
            this._mc = ev => { if (this.menu && !this.menu.contains(ev.target)) this.closeMenu(); };
            this._mk = ev => { if (ev.key === 'Escape') this.closeMenu(); };
            setTimeout(() => { document.addEventListener('mousedown', this._mc, true); document.addEventListener('keydown', this._mk, true); }, 0);
        }
        closeMenu() {
            if (this.menu) { this.menu.remove(); this.menu = null; }
            if (this._mc) { document.removeEventListener('mousedown', this._mc, true); document.removeEventListener('keydown', this._mk, true); this._mc = null; }
        }

        /* ====================== Fare / Klavye olayları ====================== */
        bindEvents() {
            const sc1 = this.scroll;
            sc1.addEventListener('mousedown', e => this.onMouseDown(e));
            sc1.addEventListener('click', e => this.onClick(e));
            sc1.addEventListener('dblclick', e => this.onDblClick(e));
            sc1.addEventListener('contextmenu', e => this.onContext(e));
            sc1.addEventListener('keydown', e => this.onKey(e));
            sc1.addEventListener('scroll', () => this.hideTip());
            sc1.addEventListener('copy', e => this.onCopy(e, false));
            sc1.addEventListener('cut', e => this.onCopy(e, true));
            sc1.addEventListener('paste', e => { if (this.editing) return; e.preventDefault(); this.pasteText((e.clipboardData && e.clipboardData.getData('text/plain')) || ''); });
            sc1.addEventListener('mouseover', e => {
                const td = e.target.closest && e.target.closest('td.ps-cm');
                if (!td || this.drag) return;
                const cell = this.cur().cells[K(+td.dataset.r, +td.dataset.c)];
                if (cell && cell.cm) { const rc = td.getBoundingClientRect(); this.showTip('<b>Yorum</b>' + esc(cell.cm), rc.right + 6, rc.top); }
            });
            sc1.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('td.ps-cm')) this.hideTip(); });
            this.fin.addEventListener('focus', () => { this.fbFocus = true; this.fbDirty = false; });
            this.fin.addEventListener('input', () => { this.fbDirty = true; this.fbCell = this.normPt(this.cur(), this.anchor.r, this.anchor.c); });
            this.fin.addEventListener('blur', () => {
                this.fbFocus = false;
                if (this.fbDirty && this.fbCell) { this.fbDirty = false; this.applyInput(this.fbCell.r, this.fbCell.c, this.fin.value, 'text'); }
            });
            this.fin.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); this.fbDirty = false; const a = this.normPt(this.cur(), this.anchor.r, this.anchor.c); this.applyInput(a.r, a.c, this.fin.value, 'text'); this.moveActive(1, 0); this.scroll.focus({ preventScroll: true }); }
                else if (e.key === 'Escape') { e.preventDefault(); this.fbDirty = false; this.updateSelection(true); this.scroll.focus({ preventScroll: true }); }
            });
            this.stabs.addEventListener('click', e => {
                if (e.target.closest('[data-add]')) { this.addSheet(); return; }
                const b = e.target.closest('.ps-stab');
                if (b) this.activateSheet(+b.dataset.i);
            });
            this.stabs.addEventListener('dblclick', e => { const b = e.target.closest('.ps-stab'); if (b && !this.readonly) this.renameSheetDialog(+b.dataset.i); });
            this.stabs.addEventListener('contextmenu', e => {
                const b = e.target.closest('.ps-stab');
                if (!b || this.readonly) return;
                e.preventDefault();
                const i = +b.dataset.i;
                this.openMenu(e.clientX, e.clientY, [
                    { label: 'Yeniden adlandır', run: () => this.renameSheetDialog(i) },
                    { label: 'Sola taşı', disabled: i === 0, run: () => this.moveSheet(i, -1) },
                    { label: 'Sağa taşı', disabled: i === this.sheets.length - 1, run: () => this.moveSheet(i, 1) },
                    '-',
                    { label: 'Sayfayı sil', disabled: this.sheets.length < 2, run: () => this.removeSheet(i) }
                ]);
            });
            if (window.ResizeObserver) {
                let first = true;
                new ResizeObserver(() => { if (first) { first = false; return; } this.emit('resize', { kind: 'component', width: this.el.offsetWidth, height: this.el.offsetHeight }); }).observe(this.el);
            }
        }

        onCopy(e, cut) {
            if (this.editing || (e.target.closest && e.target.closest('input,select,textarea'))) return;
            const t = this.copyRange(cut);
            e.clipboardData.setData('text/plain', t);
            e.preventDefault();
            this.emit(this.clip.cut ? 'cut' : 'copy', { range: rangeStr(this.clip.g) });
        }

        onMouseDown(e) {
            if (e.button === 1) return;
            const t = e.target;
            this.closeMenu();
            if (this.editing) { if (t.closest('.ps-edit')) return; this.commitEdit(0, 0); }
            const cr = t.closest('.ps-colrs');
            if (cr) { e.preventDefault(); this.startResize('col', +cr.dataset.c, e); return; }
            const rr = t.closest('.ps-rowrs');
            if (rr) { e.preventDefault(); this.startResize('row', +rr.dataset.r, e); return; }
            if (t.closest('.ps-fbtn') || t.closest('.ps-img')) return;
            const sh = this.cur(), td = t.closest('td.ps-c'), th = t.closest('th');
            this.deselectImg();
            if (td) {
                const r = +td.dataset.r, c = +td.dataset.c;
                if (e.button === 2 && inRange(this.range(), r, c)) return;
                if (!t.closest('.ps-chk')) e.preventDefault();
                this.scroll.focus({ preventScroll: true });
                if (e.shiftKey) { const n = this.normPt(sh, r, c); this.focus = { r: n.r, c: n.c }; }
                else { const n = this.normPt(sh, r, c); this.anchor = n; this.focus = { r: n.r, c: n.c }; }
                this.updateSelection(true);
                if (e.button === 0) this.startDrag('cell');
            } else if (th) {
                e.preventDefault();
                this.scroll.focus({ preventScroll: true });
                if (th.dataset.all) { this.selectAll(); return; }
                if (th.classList.contains('ps-colh')) {
                    const c = +th.dataset.c;
                    if (e.shiftKey) this.focus = { r: sh.rows, c }; else { this.anchor = { r: 1, c }; this.focus = { r: sh.rows, c }; }
                    this.updateSelection(true);
                    if (e.button === 0) this.startDrag('col');
                } else if (th.classList.contains('ps-rowh')) {
                    const r = +th.dataset.r;
                    if (e.shiftKey) this.focus = { r, c: sh.cols }; else { this.anchor = { r, c: 1 }; this.focus = { r, c: sh.cols }; }
                    this.updateSelection(true);
                    if (e.button === 0) this.startDrag('row');
                }
            }
        }
        startDrag(type) {
            this.drag = { type };
            const sh = this.cur();
            const move = ev => {
                if (!this.drag) return;
                const rc = this.scroll.getBoundingClientRect();
                if (ev.clientY > rc.bottom - 12) this.scroll.scrollTop += 24; else if (ev.clientY < rc.top + HDR_H) this.scroll.scrollTop -= 24;
                if (ev.clientX > rc.right - 12) this.scroll.scrollLeft += 30; else if (ev.clientX < rc.left + HDR_W) this.scroll.scrollLeft -= 30;
                const el = document.elementFromPoint(ev.clientX, ev.clientY);
                if (!el || !el.closest) return;
                const td = el.closest('td.ps-c'), th = el.closest('th');
                if (type === 'cell' && td && this.scroll.contains(td)) { const n = this.normPt(sh, +td.dataset.r, +td.dataset.c); this.focus = { r: n.r, c: n.c }; }
                else if (type === 'col' && th && th.classList.contains('ps-colh')) this.focus = { r: sh.rows, c: +th.dataset.c };
                else if (type === 'row' && th && th.classList.contains('ps-rowh')) this.focus = { r: +th.dataset.r, c: sh.cols };
                else return;
                this.updateSelection(true);
            };
            const up = () => {
                this.drag = null;
                document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                this.updateSelection();
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        }
        onClick(e) {
            const fb = e.target.closest('.ps-fbtn');
            if (fb) { e.stopPropagation(); this.openFilterMenu(+fb.dataset.c, fb); return; }
            const chk = e.target.closest('.ps-chk');
            if (chk) {
                if (this.readonly) return;
                this.applyInput(+chk.dataset.r, +chk.dataset.c, chk.checked ? 'TRUE' : 'FALSE', 'text');
                return;
            }
            const td = e.target.closest('td.ps-list');
            if (td && e.button === 0 && !this.drag) {
                const a = this.normPt(this.cur(), +td.dataset.r, +td.dataset.c), rc = td.getBoundingClientRect();
                if (e.clientX > rc.right - 22 && this.anchor.r === a.r && this.anchor.c === a.c) this.beginEdit();
            }
        }
        onDblClick(e) {
            const cr = e.target.closest('.ps-colrs');
            if (cr) { this.autofit('col', +cr.dataset.c); return; }
            const rr = e.target.closest('.ps-rowrs');
            if (rr) { this.autofit('row', +rr.dataset.r); return; }
            if (e.target.closest('.ps-chk') || e.target.closest('.ps-fbtn')) return;
            const td = e.target.closest('td.ps-c');
            if (td) this.beginEdit();
        }
        onContext(e) {
            e.preventDefault();
            const img = e.target.closest('.ps-img');
            if (img) {
                this.selectImg(img.dataset.id);
                this.openMenu(e.clientX, e.clientY, [{ label: 'Resmi sil', kbd: 'Del', run: () => this.removeImage(img.dataset.id) }]);
                return;
            }
            const td = e.target.closest('td.ps-c'), th = e.target.closest('th');
            const sh = this.cur();
            if (td) { const r = +td.dataset.r, c = +td.dataset.c; if (!inRange(this.range(), r, c)) this.setSel(r, c, undefined, undefined, true); }
            else if (th && th.classList.contains('ps-colh')) { const c = +th.dataset.c; if (!inRange(this.range(), 1, c) || this.range().r2 < sh.rows) this.setSel(1, c, sh.rows, c, true); }
            else if (th && th.classList.contains('ps-rowh')) { const r = +th.dataset.r; if (!inRange(this.range(), r, 1) || this.range().c2 < sh.cols) this.setSel(r, 1, r, sh.cols, true); }
            else return;
            this.scroll.focus({ preventScroll: true });
            this.openMenu(e.clientX, e.clientY, this.contextItems());
        }

        onKey(e) {
            if (this.editing || e.target !== this.scroll) return;
            const k = e.key, mod = e.ctrlKey || e.metaKey, sh = this.cur();
            let handled = true;
            if (this.selImg) {
                if (k === 'Delete' || k === 'Backspace') { this.removeImage(this.selImg); e.preventDefault(); return; }
                if (k === 'Escape') { this.deselectImg(); e.preventDefault(); return; }
            }
            const ext = e.shiftKey;
            if (mod) {
                switch (k.toLowerCase()) {
                    case 'z': if (ext) this.redo(); else this.undo(); break;
                    case 'y': this.redo(); break;
                    case 'b': this.exec('bold'); break;
                    case 'i': this.exec('italic'); break;
                    case 'u': this.exec('underline'); break;
                    case 'a': this.selectAll(); break;
                    case 'c': case 'x': case 'v': handled = false; break;
                    case 'home': this.setSel(1, 1); break;
                    case 'end': { const u = this.usedRange(); this.setSel(u.r, u.c); break; }
                    case 'arrowup': this.moveActive(-1, 0, ext, true); break;
                    case 'arrowdown': this.moveActive(1, 0, ext, true); break;
                    case 'arrowleft': this.moveActive(0, -1, ext, true); break;
                    case 'arrowright': this.moveActive(0, 1, ext, true); break;
                    case ' ': { const g = this.range(); this.setSel(1, g.c1, sh.rows, g.c2); break; }
                    case 'l': if (ext) this.exec('filter'); else handled = false; break;
                    default: handled = false;
                }
            } else {
                switch (k) {
                    case 'ArrowUp': this.moveActive(-1, 0, ext); break;
                    case 'ArrowDown':
                        if (e.altKey) { const a = this.normPt(sh, this.anchor.r, this.anchor.c), td = this.tdAt(a.r, a.c), fb = td && td.querySelector('.ps-fbtn'); if (fb) this.openFilterMenu(+fb.dataset.c, fb); else this.beginEdit(); }
                        else this.moveActive(1, 0, ext);
                        break;
                    case 'ArrowLeft': this.moveActive(0, -1, ext); break;
                    case 'ArrowRight': this.moveActive(0, 1, ext); break;
                    case 'Tab': this.moveActive(0, ext ? -1 : 1); break;
                    case 'Enter': this.moveActive(ext ? -1 : 1, 0); break;
                    case 'F2': if (ext) this.exec('comment'); else this.beginEdit(); break;
                    case 'Delete': case 'Backspace': this.clearContents(); break;
                    case 'Home': { const f = this.focus; if (ext) this.focus = { r: f.r, c: 1 }; else { this.anchor = { r: this.anchor.r, c: 1 }; this.focus = { r: this.anchor.r, c: 1 }; } this.updateSelection(); break; }
                    case 'End': { const u = this.usedRange(); if (ext) this.focus = { r: this.focus.r, c: u.c }; else { this.anchor = this.normPt(sh, this.anchor.r, u.c); this.focus = { r: this.anchor.r, c: this.anchor.c }; } this.updateSelection(); break; }
                    case 'PageDown': case 'PageUp': {
                        const n = Math.max(1, Math.floor(this.scroll.clientHeight / (DEF_H * this.zoom)) - 2) * (k === 'PageDown' ? 1 : -1);
                        this.moveActive(n, 0, ext); break;
                    }
                    case 'Escape': this.clip = null; handled = false; break;
                    case ' ': {
                        const a = this.normPt(sh, this.anchor.r, this.anchor.c), ed = this.editorFor(sh, a.r, a.c);
                        if (ed && ed.type === 'checkbox') this.applyInput(a.r, a.c, this.valueAt(this.active, a.r, a.c) === true ? 'FALSE' : 'TRUE', 'text');
                        else if (ext) { const g = this.range(); this.setSel(g.r1, 1, g.r2, sh.cols); }
                        else this.beginEdit(' ');
                        break;
                    }
                    default:
                        if (k.length === 1 && !e.altKey) this.beginEdit(k); else handled = false;
                }
            }
            if (handled) e.preventDefault();
        }

        /* ====================== Boyutlandırma ====================== */
        startResize(kind, idx, e) {
            const sh = this.cur(), z = this.zoom, isCol = kind === 'col';
            const start = isCol ? e.clientX : e.clientY, base = isCol ? this.cw(sh, idx) : (sh.rowH[idx] || DEF_H);
            this.pushUndo();
            let raf = 0, size = base;
            const move = ev => {
                size = Math.max(isCol ? 30 : 14, Math.round(base + ((isCol ? ev.clientX : ev.clientY) - start) / z));
                (isCol ? sh.colW : sh.rowH)[idx] = size;
                if (!raf) raf = requestAnimationFrame(() => { raf = 0; this.render(); });
            };
            const up = () => {
                document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                this.render();
                this.emit('resize', { kind: isCol ? 'column' : 'row', index: idx, size });
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        }
        autofit(kind, idx) {
            const sh = this.cur(), si = this.active;
            this.pushUndo();
            if (kind === 'col') {
                const ctx = (this._cv || (this._cv = document.createElement('canvas'))).getContext('2d');
                let w = 40;
                Object.keys(sh.cells).forEach(k => {
                    const p = k.split(',').map(Number);
                    if (p[1] !== idx) return;
                    const cell = sh.cells[k];
                    ctx.font = (cell.i ? 'italic ' : '') + (cell.b ? '700 ' : '400 ') + (cell.fs || 13) + 'px system-ui';
                    const extra = sh.filter && p[0] === sh.filter.g.r1 ? 30 : 0;
                    w = Math.max(w, ctx.measureText(formatValue(this.valueAt(si, p[0], p[1]), cell.fmt)).width + 22 + extra);
                });
                sh.colW[idx] = Math.min(480, Math.ceil(w));
            } else delete sh.rowH[idx];
            this.render();
            this.emit('resize', { kind: kind === 'col' ? 'column' : 'row', index: idx, size: kind === 'col' ? sh.colW[idx] : DEF_H, auto: true });
        }

        /* ====================== Veri doğrulama ====================== */
        evalText(f, si) {
            try {
                const ast = parseFormula(f);
                const v = ev(ast, { sheet: name => (name == null ? si : this.sheetIndex(name)), value: (s, rr, cc) => this.valueAt(s, rr, cc) });
                return v instanceof RangeVal ? v.first() : v;
            } catch (e) { return e instanceof SErr ? e : new SErr(E.ERR); }
        }
        checkRule(rule, v, sh, r, c) {
            if (v == null || v === '') return rule.allowNulls;
            const toNum = x => (typeof x === 'number' ? x : Number(String(x).replace(',', '.')));
            const cmpOk = a => {
                const f = parseCompareValue(rule.from), t = parseCompareValue(rule.to);
                switch (rule.comparer) {
                    case 'between': return a >= f && a <= t;
                    case 'notBetween': return a < f || a > t;
                    case 'equalTo': return a === f;
                    case 'notEqualTo': return a !== f;
                    case 'greaterThan': return a > f;
                    case 'lessThan': return a < f;
                    case 'greaterThanOrEqualTo': return a >= f;
                    case 'lessThanOrEqualTo': return a <= f;
                }
                return true;
            };
            switch (rule.type) {
                case 'list': {
                    const s = String(v).toLocaleLowerCase('tr');
                    return rule.items.some(it => String(it).toLocaleLowerCase('tr') === s || (typeof v === 'number' && Number(it) === v));
                }
                case 'whole': { const n = toNum(v); return typeof v !== 'boolean' && Number.isInteger(n) && cmpOk(n); }
                case 'decimal': { const n = toNum(v); return typeof v !== 'boolean' && !isNaN(n) && cmpOk(n); }
                case 'date': return typeof v === 'number' && cmpOk(v);
                case 'textLength': return cmpOk(String(typeof v === 'number' ? fmtGeneral(v) : v).length);
                case 'custom': {
                    const f = String(rule.formula || '').replace(/^=/, '').trim();
                    if (!f) return true;
                    const si = this.sheets.indexOf(sh), keep = this.cache, prev = this.override;
                    this.cache = new Map();
                    this.override = { si, key: K(r, c), v };
                    let res;
                    try { res = this.evalText(shiftFormula(f, r - rule.g.r1, c - rule.g.c1), si); } finally { this.override = prev; this.cache = keep; }
                    return res === true || (typeof res === 'number' && res !== 0);
                }
            }
            return true;
        }

        /* ====================== Resimler ====================== */
        renderLayer() {
            const sh = this.cur(), G = this.geo;
            this.layer.innerHTML = '';
            sh.imgs.forEach(im => {
                const x = (G.colX[Math.min(im.c, sh.cols)] || HDR_W) + im.x, y = (G.rowY[Math.min(im.r, sh.rows)] || HDR_H) + im.y;
                const d = document.createElement('div');
                d.className = 'ps-img' + (this.selImg === im.id ? ' on' : '');
                d.dataset.id = im.id;
                d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + im.w + 'px;height:' + im.h + 'px';
                d.innerHTML = '<img alt="" draggable="false"><i class="ps-img-rs"></i>';
                d.firstChild.src = im.src;
                this.layer.appendChild(d);
            });
        }
        bindImages() {
            this.layer.addEventListener('mousedown', e => {
                const d = e.target.closest('.ps-img');
                if (!d) return;
                e.preventDefault(); e.stopPropagation();
                this.closeMenu();
                if (this.editing) this.commitEdit(0, 0);
                const sh = this.cur(), im = sh.imgs.find(i => i.id === d.dataset.id);
                if (!im) return;
                this.selectImg(im.id);
                this.scroll.focus({ preventScroll: true });
                if (this.readonly || e.button !== 0) return;
                const resize = !!e.target.closest('.ps-img-rs'), sx = e.clientX, sy = e.clientY, z = this.zoom, G = this.geo;
                const ox = G.colX[im.c] + im.x, oy = G.rowY[im.r] + im.y, ow = im.w, oh = im.h;
                let moved = false, nx = ox, ny = oy;
                this.pushUndo();
                const el = this.layer.querySelector('.ps-img[data-id="' + im.id + '"]');
                const move = ev => {
                    const dx = (ev.clientX - sx) / z, dy = (ev.clientY - sy) / z;
                    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
                    if (resize) { im.w = Math.max(24, Math.round(ow + dx)); im.h = Math.max(24, Math.round(oh + dy)); el.style.width = im.w + 'px'; el.style.height = im.h + 'px'; }
                    else { nx = Math.max(HDR_W, ox + dx); ny = Math.max(HDR_H, oy + dy); el.style.left = nx + 'px'; el.style.top = ny + 'px'; }
                };
                const up = () => {
                    document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                    if (!moved) { this.undoS.pop(); return; }
                    if (!resize) this.anchorImage(im, nx, ny);
                    this.renderLayer();
                    this.emit('imageChange', { id: im.id, action: resize ? 'resize' : 'move', row: im.r, col: im.c, width: im.w, height: im.h });
                };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            });
        }
        anchorImage(im, x, y) {
            const sh = this.cur(), G = this.geo;
            let c = 1, r = 1;
            while (c < sh.cols && G.colX[c + 1] <= x) c++;
            while (r < sh.rows && G.rowY[r + 1] <= y) r++;
            im.c = c; im.r = r; im.x = Math.round(x - G.colX[c]); im.y = Math.round(y - G.rowY[r]);
        }
        selectImg(id) {
            this.selImg = id;
            this.layer.querySelectorAll('.ps-img').forEach(e => e.classList.toggle('on', e.dataset.id === id));
        }
        deselectImg() { if (this.selImg) this.selectImg(null); }
        removeImage(id) {
            const sh = this.cur();
            this.mutate(() => { sh.imgs = sh.imgs.filter(i => i.id !== id); });
            this.selImg = null;
            this.emit('imageRemove', { id });
        }
        addImage(def) {
            const sh = this.cur(), d = lc(def);
            if (!d.src) return;
            const place = (w, h) => {
                const a = this.normPt(sh, d.row || this.anchor.r, d.col || this.anchor.c);
                const im = { id: 'img' + Date.now().toString(36) + Math.floor(Math.random() * 999), src: d.src, r: a.r, c: a.c, x: +d.x || 4, y: +d.y || 4, w: +d.width || w, h: +d.height || h };
                this.mutate(() => { sh.imgs.push(im); });
                this.selectImg(im.id);
                this.emit('imageAdd', { id: im.id, row: im.r, col: im.c, width: im.w, height: im.h });
            };
            if (d.width && d.height) { place(+d.width, +d.height); return; }
            const probe = new Image();
            probe.onload = () => { const k = Math.min(1, 260 / (probe.naturalWidth || 260)); place(Math.round((probe.naturalWidth || 200) * k), Math.round((probe.naturalHeight || 120) * k)); };
            probe.onerror = () => this.toast('Resim yüklenemedi.', 'err');
            probe.src = d.src;
        }
        imageDialog() {
            const dlg = this.dialog('Resim ekle',
                '<label>Dosyadan seç<input type="file" accept="image/*" data-f="file"></label>' +
                '<label>veya Resim adresi (URL)<input type="text" data-f="url" placeholder="https://..."></label>',
                [{ label: 'İptal' }, {
                    label: 'Ekle', cls: 'primary', run: d => {
                        const f = d.body.querySelector('[data-f=file]').files[0], u = d.body.querySelector('[data-f=url]').value.trim();
                        if (f) { const fr = new FileReader(); fr.onload = () => this.addImage({ src: fr.result }); fr.readAsDataURL(f); }
                        else if (u) this.addImage({ src: u });
                        else { this.toast('Bir dosya seçin veya adres girin.', 'err'); return false; }
                    }
                }]);
            return dlg;
        }

        /* ====================== Biçimlendirme komutları ====================== */
        applyStyle(fn, evt, data, g) {
            if (this.readonly) return;
            g = g || this.range();
            const sh = this.cur();
            this.mutate(() => {
                for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) {
                    if (this.isDisabled(sh, r, c)) continue;
                    const k = K(r, c), cell = sh.cells[k] || (sh.cells[k] = {});
                    fn(cell, r, c);
                    this.prune(sh, k);
                }
            });
            this.emit(evt || 'changeFormat', Object.assign({ range: rangeStr(g) }, data || {}));
        }
        decFmt(fmt, delta) {
            let p = NAMED_FMT[fmt] || fmt || '';
            if (p === 'sci') return fmt;
            if (!/[0#]/.test(p)) p = '0';
            const m = /^([^#0]*)([#0,]+)(?:\.([#0]*))?([\s\S]*)$/.exec(p);
            if (!m) return fmt;
            const nd = Math.max(0, (m[3] || '').length + delta);
            return m[1] + m[2] + (nd ? '.' + '0'.repeat(nd) : '') + m[4];
        }
        applyBorder(kind, g) {
            g = g || this.range();
            this.applyStyle((cell, r, c) => {
                let bd = cell.bd || '';
                const add = ch => { if (bd.indexOf(ch) < 0) bd += ch; };
                if (kind === 'none') bd = '';
                else if (kind === 'all') bd = 'tbrl';
                else if (kind === 'outside') { if (r === g.r1) add('t'); if (r === g.r2) add('b'); if (c === g.c1) add('l'); if (c === g.c2) add('r'); }
                else if (kind === 'top' && r === g.r1) add('t');
                else if (kind === 'bottom' && r === g.r2) add('b');
                else if (kind === 'left' && c === g.c1) add('l');
                else if (kind === 'right' && c === g.c2) add('r');
                if (bd) cell.bd = bd; else delete cell.bd;
            }, 'changeFormat', { border: kind }, g);
        }
        toggleMerge(g) {
            if (this.readonly) return;
            g = g || this.range();
            if (g.r1 === g.r2 && g.c1 === g.c2) return;
            const sh = this.cur(), idx = sh.merges.findIndex(m => m.r1 === g.r1 && m.r2 === g.r2 && m.c1 === g.c1 && m.c2 === g.c2);
            this.mutate(() => {
                if (idx >= 0) sh.merges.splice(idx, 1);
                else {
                    sh.merges = sh.merges.filter(m => !overlaps(m, g));
                    sh.merges.push({ r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 });
                    for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) if (!(r === g.r1 && c === g.c1)) delete sh.cells[K(r, c)];
                }
            });
            this.emit(idx >= 0 ? 'unmerge' : 'merge', { range: rangeStr(g) });
        }
        freeze(rows, cols) {
            const sh = this.cur();
            this.mutate(() => { sh.frozenR = Math.max(0, +rows || 0); sh.frozenC = Math.max(0, +cols || 0); });
            this.emit('freeze', { rows: sh.frozenR, columns: sh.frozenC });
        }
        setEnabled(g, enabled) {
            if (this.readonly) return;
            const sh = this.cur();
            this.mutate(() => {
                if (enabled && sh.dis.length) {
                    sh.dis.forEach(d => { for (let r = d.r1; r <= d.r2; r++) for (let c = d.c1; c <= d.c2; c++) (sh.cells[K(r, c)] || (sh.cells[K(r, c)] = {})).en = false; });
                    sh.dis = [];
                }
                for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) {
                    const k = K(r, c), cell = sh.cells[k] || (sh.cells[k] = {});
                    if (enabled) delete cell.en; else cell.en = false;
                    this.prune(sh, k);
                }
            });
            this.emit(enabled ? 'enable' : 'disable', { range: rangeStr(g) });
        }
        setComment(g, text) {
            const sh = this.cur();
            this.mutate(() => {
                const k = K(g.r1, g.c1), cell = sh.cells[k] || (sh.cells[k] = {});
                if (text) cell.cm = text; else delete cell.cm;
                this.prune(sh, k);
            });
            this.emit('comment', { ref: colToLetter(g.c1) + g.r1, text: text || null });
        }
        commentDialog() {
            const sh = this.cur(), a = this.normPt(sh, this.anchor.r, this.anchor.c), cell = sh.cells[K(a.r, a.c)] || {};
            const g = { r1: a.r, c1: a.c, r2: a.r, c2: a.c };
            const btns = [{ label: 'İptal' }];
            if (cell.cm) btns.unshift({ label: 'Yorumu sil', cls: 'danger', run: () => this.setComment(g, '') });
            btns.push({ label: 'Kaydet', cls: 'primary', run: d => this.setComment(g, d.body.querySelector('textarea').value.trim()) });
            this.dialog('Yorum - ' + colToLetter(a.c) + a.r, '<label>Yorum metni<textarea placeholder="Bu hücre hakkında not yazın...">' + esc(cell.cm || '') + '</textarea></label>', btns);
        }
        setValidation(g, def) {
            const sh = this.cur(), d = lc(def);
            this.mutate(() => {
                sh.vals = sh.vals.filter(v => !(v.g.r1 >= g.r1 && v.g.r2 <= g.r2 && v.g.c1 >= g.c1 && v.g.c2 <= g.c2));
                if (d.type) sh.vals.push({
                    g: { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 }, type: d.type, comparer: d.comparer || 'between', from: d.from, to: d.to, formula: d.formula,
                    items: toItems(d.items), allowNulls: d.allownulls !== false, reject: d.reject !== false, title: d.title || '', message: d.message || '', error: d.error || ''
                });
            });
            this.emit('validationChange', { range: rangeStr(g), type: d.type || null });
        }
        validationDialog() {
            const sh = this.cur(), g = this.range(), a = this.normPt(sh, this.anchor.r, this.anchor.c);
            const rule = this.ruleFor(sh, a.r, a.c) || { type: 'list', comparer: 'between', items: [], allowNulls: true, reject: true };
            const opt = (arr, cur) => arr.map(x => '<option value="' + x[0] + '"' + (x[0] === cur ? ' selected' : '') + '>' + x[1] + '</option>').join('');
            const body =
                '<label>Kriter<select data-f="type">' + opt([['list', 'Liste'], ['whole', 'Tam sayı'], ['decimal', 'Ondalık sayı'], ['date', 'Tarih'], ['textLength', 'Metin uzunluğu'], ['custom', 'Özel formül']], rule.type) + '</select></label>' +
                '<label data-g="cmp">Karşılaştırma<select data-f="comparer">' + opt([['between', 'arasında'], ['notBetween', 'arasında değil'], ['equalTo', 'eşit'], ['notEqualTo', 'eşit değil'], ['greaterThan', 'büyük'], ['lessThan', 'küçük'], ['greaterThanOrEqualTo', 'büyük veya eşit'], ['lessThanOrEqualTo', 'küçük veya eşit']], rule.comparer) + '</select></label>' +
                '<div data-g="cmp" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Değer 1<input type="text" data-f="from" value="' + esc(rule.from == null ? '' : rule.from) + '"></label><label>Değer 2<input type="text" data-f="to" value="' + esc(rule.to == null ? '' : rule.to) + '"></label></div>' +
                '<label data-g="list">Liste öğeleri (virgülle ayırın)<input type="text" data-f="items" value="' + esc((rule.items || []).join(', ')) + '"></label>' +
                '<label data-g="custom">Özel formül (seçimin ilk hücresine göre)<input type="text" data-f="formula" placeholder="=B2>0" value="' + esc(rule.formula || '') + '"></label>' +
                '<label class="row"><input type="checkbox" data-f="allowNulls"' + (rule.allowNulls ? ' checked' : '') + '> Boş değere izin ver</label>' +
                '<label>Geçersiz girişte<select data-f="reject">' + opt([['1', 'Reddet'], ['0', 'Uyar (onayla)']], rule.reject ? '1' : '0') + '</select></label>' +
                '<label>Giriş başlığı<input type="text" data-f="title" value="' + esc(rule.title || '') + '"></label>' +
                '<label>Giriş mesajı<input type="text" data-f="message" value="' + esc(rule.message || '') + '"></label>' +
                '<label>Hata mesajı<input type="text" data-f="error" value="' + esc(rule.error || '') + '"></label>';
            const dlg = this.dialog('Veri doğrulama - ' + rangeStr(g), body, [
                { label: 'Kaldır', cls: 'danger', run: () => this.setValidation(g, {}) },
                { label: 'İptal' },
                {
                    label: 'Uygula', cls: 'primary', run: d => {
                        const f = n => d.body.querySelector('[data-f=' + n + ']');
                        this.setValidation(g, {
                            type: f('type').value, comparer: f('comparer').value, from: f('from').value, to: f('to').value, formula: f('formula').value,
                            items: f('items').value, allowNulls: f('allowNulls').checked, reject: f('reject').value === '1',
                            title: f('title').value, message: f('message').value, error: f('error').value
                        });
                    }
                }]);
            const sync = () => {
                const t = dlg.body.querySelector('[data-f=type]').value;
                dlg.body.querySelectorAll('[data-g]').forEach(e => {
                    const g = e.dataset.g;
                    const hide = (g === 'cmp' && (t === 'list' || t === 'custom')) || (g === 'list' && t !== 'list') || (g === 'custom' && t !== 'custom');
                    e.style.display = hide ? 'none' : (e.tagName === 'DIV' ? 'grid' : '');
                });
            };
            dlg.body.querySelector('[data-f=type]').addEventListener('change', sync);
            sync();
        }

        /* ====================== Satır / Sütun / Sayfa ====================== */
        structural(axis, at, n) {
            if (this.readonly) return;
            const sh = this.cur(), isR = axis === 'r', del = n < 0, cnt = Math.abs(n);
            if (del && cnt >= (isR ? sh.rows : sh.cols)) { this.toast('Son satır/sütun silinemez.', 'err'); return; }
            this.pushUndo();
            const shift = v => { if (del) { if (v >= at && v < at + cnt) return null; return v >= at + cnt ? v - cnt : v; } return v >= at ? v + cnt : v; };
            const nc = {};
            Object.keys(sh.cells).forEach(k => {
                const p = k.split(',').map(Number), v = shift(isR ? p[0] : p[1]);
                if (v == null) return;
                nc[isR ? K(v, p[1]) : K(p[0], v)] = sh.cells[k];
            });
            sh.cells = nc;
            const sz = isR ? sh.rowH : sh.colW, ns = {};
            Object.keys(sz).forEach(k => { const v = shift(+k); if (v != null) ns[v] = sz[k]; });
            if (isR) { sh.rowH = ns; sh.rows = Math.max(1, sh.rows + n); } else { sh.colW = ns; sh.cols = Math.max(1, sh.cols + n); }
            const adj = g => {
                const sp = adjSpan(isR ? g.r1 : g.c1, isR ? g.r2 : g.c2, at, cnt, del);
                if (!sp) return null;
                return isR ? { r1: sp[0], r2: sp[1], c1: g.c1, c2: g.c2 } : { c1: sp[0], c2: sp[1], r1: g.r1, r2: g.r2 };
            };
            sh.merges = sh.merges.map(adj).filter(m => m && (m.r1 !== m.r2 || m.c1 !== m.c2));
            sh.vals.forEach(v => { v.g = adj(v.g); }); sh.vals = sh.vals.filter(v => v.g);
            sh.eds.forEach(v => { v.g = adj(v.g); }); sh.eds = sh.eds.filter(v => v.g);
            sh.dis = sh.dis.map(adj).filter(Boolean);
            if (sh.filter) { sh.filter.g = adj(sh.filter.g); if (!sh.filter.g) sh.filter = null; }
            if (isR && at <= sh.frozenR) sh.frozenR = Math.max(0, sh.frozenR + n);
            if (!isR && at <= sh.frozenC) sh.frozenC = Math.max(0, sh.frozenC + n);
            sh.imgs.forEach(im => { const k = isR ? 'r' : 'c', v = shift(im[k]); im[k] = v == null ? at : v; });
            this.sheets.forEach(s2 => {
                Object.keys(s2.cells).forEach(k => {
                    const cell = s2.cells[k];
                    if (!cell.f) return;
                    cell.f = rewriteRefs(cell.f, ref => {
                        const target = ref.sheet == null ? s2.name : ref.sheet;
                        if (target.toLowerCase() !== sh.name.toLowerCase()) return ref;
                        const a = ref.a, b = ref.b || ref.a;
                        const sp = adjSpan(isR ? a.r : a.c, isR ? b.r : b.c, at, cnt, del);
                        if (!sp) return null;
                        if (isR) { a.r = sp[0]; if (ref.b) ref.b.r = sp[1]; } else { a.c = sp[0]; if (ref.b) ref.b.c = sp[1]; }
                        return ref;
                    });
                });
            });
            this.clampSel();
            this.afterMutate();
            this.emit(isR ? (del ? 'deleteRow' : 'insertRow') : (del ? 'deleteColumn' : 'insertColumn'), { index: at, count: cnt });
        }
        clampSel() {
            const sh = this.cur();
            this.anchor = { r: Math.max(1, Math.min(sh.rows, this.anchor.r)), c: Math.max(1, Math.min(sh.cols, this.anchor.c)) };
            this.focus = { r: Math.max(1, Math.min(sh.rows, this.focus.r)), c: Math.max(1, Math.min(sh.cols, this.focus.c)) };
        }
        uniqueSheetName(base) {
            let i = this.sheets.length + 1;
            while (this.sheets.some(s => s.name.toLowerCase() === (base + ' ' + i).toLowerCase())) i++;
            return base + ' ' + i;
        }
        addSheet(name) {
            if (this.readonly) return;
            if (this.editing) this.commitEdit(0, 0);
            this.pushUndo();
            name = name || this.uniqueSheetName('Sayfa');
            this.sheets.push(normSheet({ name, rows: 50, cols: 26 }));
            this.active = this.sheets.length - 1;
            this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 };
            this.cache.clear(); this.render();
            this.emit('insertSheet', { name });
        }
        activateSheet(i) {
            if (typeof i === 'string') i = this.sheets.findIndex(s => s.name.toLowerCase() === i.toLowerCase());
            if (i < 0 || i >= this.sheets.length || i === this.active) return;
            if (this.editing) this.commitEdit(0, 0);
            this.active = i; this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 }; this.selImg = null;
            this.render();
            this.emit('selectSheet', { name: this.sheets[i].name, index: i });
        }
        renameSheet(i, name) {
            name = String(name || '').trim();
            if (!name || name === this.sheets[i].name) return false;
            if (this.sheets.some((s, j) => j !== i && s.name.toLowerCase() === name.toLowerCase())) { this.toast('Bu isimde bir sayfa zaten var.', 'err'); return false; }
            this.pushUndo();
            const old = this.sheets[i].name;
            this.sheets[i].name = name;
            this.sheets.forEach(s2 => Object.keys(s2.cells).forEach(k => {
                const cell = s2.cells[k];
                if (cell.f) cell.f = rewriteRefs(cell.f, ref => { if (ref.sheet != null && ref.sheet.toLowerCase() === old.toLowerCase()) ref.sheet = name; return ref; });
            }));
            this.afterMutate();
            this.emit('renameSheet', { oldName: old, name });
            return true;
        }
        renameSheetDialog(i) {
            this.dialog('Sayfayı yeniden adlandır', '<label>Sayfa adı<input type="text" value="' + esc(this.sheets[i].name) + '"></label>',
                [{ label: 'İptal' }, { label: 'Kaydet', cls: 'primary', run: d => { if (this.renameSheet(i, d.body.querySelector('input').value) === false) return false; } }]);
        }
        removeSheet(i) {
            if (this.sheets.length < 2 || this.readonly) return;
            const nm = this.sheets[i].name;
            if (!window.confirm('"' + nm + '" sayfası silinsin mi?')) return;
            this.pushUndo();
            this.sheets.splice(i, 1);
            this.active = Math.min(this.active, this.sheets.length - 1);
            this.sheets.forEach(s2 => Object.keys(s2.cells).forEach(k => {
                const cell = s2.cells[k];
                if (cell.f) cell.f = rewriteRefs(cell.f, ref => (ref.sheet != null && ref.sheet.toLowerCase() === nm.toLowerCase()) ? null : ref);
            }));
            this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 };
            this.afterMutate();
            this.emit('removeSheet', { name: nm });
        }
        moveSheet(i, d) {
            const j = i + d;
            if (j < 0 || j >= this.sheets.length) return;
            this.pushUndo();
            const t = this.sheets[i]; this.sheets[i] = this.sheets[j]; this.sheets[j] = t;
            if (this.active === i) this.active = j; else if (this.active === j) this.active = i;
            this.afterMutate();
        }

        /* ====================== Sıralama & Filtreleme ====================== */
        hasHeader(g) {
            const si = this.active;
            let allStr = true;
            for (let c = g.c1; c <= g.c2; c++) { const v = this.valueAt(si, g.r1, c); if (!(typeof v === 'string' && v !== '')) { allStr = false; break; } }
            if (!allStr || g.r2 <= g.r1) return false;
            for (let c = g.c1; c <= g.c2; c++) if (typeof this.valueAt(si, g.r1 + 1, c) === 'number') return true;
            return false;
        }
        sortRange(g, col, dir) {
            if (this.readonly) return;
            const sh = this.cur(), si = this.active, rows = [];
            for (let r = g.r1; r <= g.r2; r++) rows.push(r);
            const keyOf = r => this.valueAt(si, r, col);
            const cmp = (a, b) => {
                const va = keyOf(a), vb = keyOf(b), ea = va == null || va === '', eb = vb == null || vb === '';
                if (ea && eb) return 0; if (ea) return 1; if (eb) return -1;
                const c = cmpVals(va instanceof SErr ? va.code : va, vb instanceof SErr ? vb.code : vb);
                return dir === 'desc' ? -c : c;
            };
            const order = rows.slice().sort((a, b) => cmp(a, b) || a - b);
            this.mutate(() => {
                const keep = {};
                rows.forEach(r => { for (let c = g.c1; c <= g.c2; c++) { const k = K(r, c); if (sh.cells[k]) keep[k] = sh.cells[k]; delete sh.cells[k]; } });
                order.forEach((src, i) => {
                    const dst = g.r1 + i;
                    for (let c = g.c1; c <= g.c2; c++) {
                        const cell = keep[K(src, c)];
                        if (!cell) continue;
                        const nc = clone(cell);
                        if (nc.f) nc.f = shiftFormula(nc.f, dst - src, 0);
                        sh.cells[K(dst, c)] = nc;
                    }
                });
            });
            this.emit('sort', { range: rangeStr(g), column: colToLetter(col), direction: dir });
        }
        sortSelection(dir) {
            const sh = this.cur(), g = this.range(), col = this.anchor.c;
            let range;
            if (sh.filter) range = { r1: sh.filter.g.r1 + 1, r2: Math.min(sh.rows, sh.filter.g.r2), c1: sh.filter.g.c1, c2: sh.filter.g.c2 };
            else if (g.r1 === g.r2 && g.c1 === g.c2) { const u = this.usedRange(); range = { r1: 1, c1: 1, r2: u.r, c2: u.c }; if (this.hasHeader(range)) range.r1 = 2; }
            else { range = Object.assign({}, g); if (this.hasHeader(range)) range.r1++; }
            if (col < range.c1 || col > range.c2 || range.r2 <= range.r1) { this.toast('Sıralanacak veri aralığı bulunamadı.', 'err'); return; }
            this.sortRange(range, col, dir);
        }
        toggleFilter(ref) {
            if (this.readonly) return;
            const sh = this.cur();
            this.pushUndo();
            if (sh.filter && ref !== 'on') { sh.filter = null; this.emit('filter', { enabled: false }); }
            else {
                let g = ref && ref !== 'on' ? parseRange(ref) : this.range();
                if (g && g.r1 === g.r2 && g.c1 === g.c2) { const u = this.usedRange(); g = { r1: 1, c1: 1, r2: u.r, c2: u.c }; }
                sh.filter = { g, crit: {} };
                this.emit('filter', { enabled: true, range: rangeStr(g) });
            }
            this.afterMutate();
        }
        openFilterMenu(col, btn) {
            this.closeMenu();
            const sh = this.cur(), si = this.active, f = sh.filter;
            if (!f) return;
            const g = f.g, crit = f.crit[col] || {}, counts = new Map(), keys = Object.keys(f.crit).filter(k => +k !== col);
            for (let r = g.r1 + 1; r <= Math.min(sh.rows, g.r2); r++) {
                if (keys.some(k => !this.passCrit(si, r, +k, f.crit[k]))) continue;
                const cell = sh.cells[K(r, col)], t = formatValue(this.valueAt(si, r, col), cell && cell.fmt);
                counts.set(t, (counts.get(t) || 0) + 1);
            }
            const list = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true })).slice(0, 300);
            const m = document.createElement('div');
            m.className = 'ps-fm ps-menu-root';
            const ops = [['', '(koşul yok)'], ['contains', 'içerir'], ['notContains', 'içermez'], ['eq', 'eşittir'], ['neq', 'eşit değildir'], ['startsWith', 'ile başlar'], ['endsWith', 'ile biter'], ['gt', 'büyüktür'], ['gte', 'büyük veya eşit'], ['lt', 'küçüktür'], ['lte', 'küçük veya eşit'], ['empty', 'boş'], ['notEmpty', 'boş değil']];
            m.innerHTML =
                '<div class="ps-fr"><button type="button" class="ps-pbtn" data-s="asc" style="flex:1">A → Z sırala</button><button type="button" class="ps-pbtn" data-s="desc" style="flex:1">Z → A sırala</button></div>' +
                '<input type="text" data-q placeholder="Değerlerde ara...">' +
                '<div class="ps-fl"><label><input type="checkbox" data-all checked> <b>(Tümünü seç)</b></label>' +
                list.map((t, i) => '<label data-t><input type="checkbox" data-v="' + i + '"' + (!crit.values || crit.values.indexOf(t) >= 0 ? ' checked' : '') + '> <span>' + (t === '' ? '(Boş)' : esc(t)) + '</span> <small style="color:#94a3b8;margin-left:auto">' + counts.get(t) + '</small></label>').join('') + '</div>' +
                '<select data-op>' + ops.map(o => '<option value="' + o[0] + '"' + (crit.op === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
                '<input type="text" data-val placeholder="Koşul değeri" value="' + esc(crit.val == null ? '' : crit.val) + '">' +
                '<div class="ps-fr"><button type="button" class="ps-pbtn danger" data-clear style="flex:1">Temizle</button><button type="button" class="ps-pbtn primary" data-apply style="flex:1">Uygula</button></div>';
            document.body.appendChild(m);
            const rc = btn.getBoundingClientRect();
            m.style.left = Math.max(4, Math.min(rc.left - 200, window.innerWidth - 276)) + 'px';
            m.style.top = Math.min(rc.bottom + 4, window.innerHeight - m.offsetHeight - 8) + 'px';
            this.menu = m;
            const boxes = () => Array.from(m.querySelectorAll('[data-v]'));
            m.querySelector('[data-all]').addEventListener('change', e => boxes().forEach(b => { if (b.closest('label').style.display !== 'none') b.checked = e.target.checked; }));
            m.querySelector('[data-q]').addEventListener('input', e => {
                const q = e.target.value.toLocaleLowerCase('tr');
                m.querySelectorAll('[data-t]').forEach(l => { l.style.display = l.textContent.toLocaleLowerCase('tr').indexOf(q) >= 0 ? '' : 'none'; });
            });
            m.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => {
                this.closeMenu();
                const range = { r1: g.r1 + 1, r2: Math.min(sh.rows, g.r2), c1: g.c1, c2: g.c2 };
                this.sortRange(range, col, b.dataset.s);
            }));
            m.querySelector('[data-clear]').addEventListener('click', () => {
                this.closeMenu(); this.pushUndo(); delete f.crit[col]; this.afterMutate();
                this.emit('filter', { column: colToLetter(col), criteria: null });
            });
            m.querySelector('[data-apply]').addEventListener('click', () => {
                const checked = boxes().filter(b => b.checked).map(b => list[+b.dataset.v]);
                const op = m.querySelector('[data-op]').value, val = m.querySelector('[data-val]').value;
                this.closeMenu(); this.pushUndo();
                const allChecked = checked.length === list.length;
                if (allChecked && !op) delete f.crit[col];
                else f.crit[col] = { values: allChecked ? null : checked, op: op || null, val };
                this.afterMutate();
                this.emit('filter', { column: colToLetter(col), criteria: f.crit[col] || null });
            });
            this._mc = ev => { if (this.menu && !this.menu.contains(ev.target)) this.closeMenu(); };
            this._mk = ev => { if (ev.key === 'Escape') this.closeMenu(); };
            setTimeout(() => { document.addEventListener('mousedown', this._mc, true); document.addEventListener('keydown', this._mk, true); }, 0);
            const q = m.querySelector('[data-q]'); q.focus();
        }

        /* ====================== Diyalog yardımcısı ====================== */
        dialog(title, bodyHtml, buttons) {
            const ov = document.createElement('div');
            ov.className = 'ps-ov';
            ov.innerHTML = '<div class="ps-dlg" role="dialog" aria-modal="true"><h4>' + esc(title) + '</h4><div class="ps-db">' + bodyHtml + '</div><div class="ps-df"></div></div>';
            const foot = ov.querySelector('.ps-df');
            const api = { el: ov, body: ov.querySelector('.ps-db'), close: () => { ov.remove(); this.scroll.focus({ preventScroll: true }); } };
            let primary = null;
            buttons.forEach(b => {
                const x = document.createElement('button');
                x.type = 'button'; x.className = 'ps-pbtn ' + (b.cls || ''); x.textContent = b.label;
                x.addEventListener('click', () => { if (b.run && b.run(api) === false) return; api.close(); });
                if (b.cls === 'primary') primary = x;
                foot.appendChild(x);
            });
            ov.addEventListener('mousedown', e => { if (e.target === ov) api.close(); });
            ov.addEventListener('keydown', e => {
                e.stopPropagation();
                if (e.key === 'Escape') api.close();
                else if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text' && primary) primary.click();
            });
            this.el.appendChild(ov);
            const f = ov.querySelector('input:not([type=checkbox]),select,textarea');
            if (f) f.focus();
            return api;
        }

        /* ====================== Şerit (araç çubuğu) ====================== */
        buildRibbon() {
            const o = this.opts;
            if (o.toolbar === false || o.toolbar === 'false') { this.tabsEl.style.display = 'none'; this.ribbon.style.display = 'none'; return; }
            let tabs = ['home', 'insert', 'data', 'view', 'file'];
            if (Array.isArray(o.toolbar)) tabs = o.toolbar;
            else if (typeof o.toolbar === 'string' && o.toolbar !== 'true') tabs = o.toolbar.split(',').map(s => s.trim().toLowerCase());
            tabs = tabs.filter(t => TAB_LABEL[t]);
            if (this.readonly) tabs = tabs.filter(t => t === 'view' || t === 'file');
            if (!tabs.length) tabs = ['view'];
            this.tabList = tabs; this.ribbonTab = tabs[0];
            this.tabsEl.innerHTML = tabs.map(t => '<button type="button" class="ps-tab" data-tab="' + t + '">' + TAB_LABEL[t] + '</button>').join('');
            this.tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { this.ribbonTab = b.dataset.tab; this.fillRibbon(); } });
            this.ribbon.addEventListener('click', e => {
                const b = e.target.closest('button[data-cmd]');
                if (!b) return;
                this.exec(b.dataset.cmd, b.dataset.arg);
                if (!this.el.querySelector('.ps-ov')) this.scroll.focus({ preventScroll: true });
            });
            this.ribbon.addEventListener('change', e => {
                const t = e.target, cmd = t.dataset && t.dataset.cmd;
                if (!cmd || t.tagName === 'BUTTON') return;
                if (t.tagName === 'SELECT' && MENU_SELECTS.indexOf(cmd) >= 0) { if (t.value) this.exec(cmd, t.value); t.value = ''; }
                else this.exec(cmd, t.value);
                if (!this.el.querySelector('.ps-ov')) this.scroll.focus({ preventScroll: true });
            });
            this.fillRibbon();
        }
        fillRibbon() {
            if (!this.tabList) return;
            this.tabsEl.querySelectorAll('.ps-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === this.ribbonTab));
            this.ribbon.innerHTML = RIBBON[this.ribbonTab](this.opts);
            this.updateRibbon();
        }
        updateRibbon() {
            if (!this.ribbon || this.ribbon.style.display === 'none') return;
            const sh = this.cur(), a = this.normPt(sh, this.anchor.r, this.anchor.c), cell = sh.cells[K(a.r, a.c)] || {};
            const set = (cmd, on) => this.ribbon.querySelectorAll('[data-cmd="' + cmd + '"]').forEach(b => b.classList.toggle('on', !!on));
            set('bold', cell.b); set('italic', cell.i); set('underline', cell.u); set('strike', cell.s); set('wrap', cell.wr);
            set('grid', sh.grid); set('formulas', this.showFormulas); set('filter', !!sh.filter); set('merge', !!this.mergeAt(sh, a.r, a.c));
            this.ribbon.querySelectorAll('[data-cmd="align"]').forEach(b => b.classList.toggle('on', (cell.al || '') === b.dataset.arg));
            const val = (cmd, v) => { const s = this.ribbon.querySelector('select[data-cmd="' + cmd + '"]'); if (s) s.value = v; };
            val('fontSize', String(cell.fs || 13));
            val('format', Array.from((this.ribbon.querySelector('select[data-cmd="format"]') || { options: [] }).options).some(o => o.value === (cell.fmt || 'general')) ? (cell.fmt || 'general') : '');
            val('zoom', String(this.zoom));
            const ci = this.ribbon.querySelector('input[data-cmd="color"]'), bi = this.ribbon.querySelector('input[data-cmd="bg"]');
            if (ci) ci.value = toHex(cell.fg) || '#0f172a';
            if (bi) bi.value = toHex(cell.bg) || '#ffffff';
            this.ribbon.querySelectorAll('[data-cmd="undo"]').forEach(b => { b.disabled = !this.undoS.length; });
            this.ribbon.querySelectorAll('[data-cmd="redo"]').forEach(b => { b.disabled = !this.redoS.length; });
        }

        exec(cmd, arg) {
            const sh = this.cur(), a = this.normPt(sh, this.anchor.r, this.anchor.c), ac = sh.cells[K(a.r, a.c)] || {}, g = this.range();
            const toggle = (key, name) => { const on = !ac[key]; this.applyStyle(c => { if (on) c[key] = 1; else delete c[key]; }, 'changeFormat', { [name]: on }); };
            switch (cmd) {
                case 'undo': this.undo(); break;
                case 'redo': this.redo(); break;
                case 'copy': case 'cut': {
                    const t = this.copyRange(cmd === 'cut');
                    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => { /* yoksay */ });
                    this.emit(cmd, { range: rangeStr(this.clip.g) });
                    this.toast(cmd === 'cut' ? 'Kesildi - yapıştırmak için hedef hücreyi seçin' : 'Kopyalandı');
                    break;
                }
                case 'paste':
                    if (this.clip) this.pasteText('');
                    else if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => this.pasteText(t)).catch(() => this.toast('Yapıştırmak için Ctrl+V kullanın.', 'err'));
                    break;
                case 'bold': toggle('b', 'bold'); break;
                case 'italic': toggle('i', 'italic'); break;
                case 'underline': toggle('u', 'underline'); break;
                case 'strike': toggle('s', 'strike'); break;
                case 'wrap': toggle('wr', 'wrap'); break;
                case 'fontSize': this.applyStyle(c => { if (+arg === 13) delete c.fs; else c.fs = +arg; }, 'changeFormat', { fontSize: +arg }); break;
                case 'color': this.applyStyle(c => { c.fg = arg; }, 'changeFormat', { color: arg }); break;
                case 'bg': this.applyStyle(c => { c.bg = arg; }, 'changeFormat', { background: arg }); break;
                case 'align': this.applyStyle(c => { c.al = arg; }, 'changeFormat', { align: arg }); break;
                case 'valign': this.applyStyle(c => { c.va = arg; }, 'changeFormat', { vAlign: arg }); break;
                case 'format': this.applyStyle(c => { if (arg === 'general') delete c.fmt; else c.fmt = arg; }, 'changeFormat', { format: arg }); break;
                case 'decUp': case 'decDown': { const d = cmd === 'decUp' ? 1 : -1; this.applyStyle(c => { c.fmt = this.decFmt(c.fmt, d); }, 'changeFormat', { format: this.decFmt(ac.fmt, d) }); break; }
                case 'border': this.applyBorder(arg); break;
                case 'merge': this.toggleMerge(); break;
                case 'clear':
                    if (arg === 'content') this.clearContents();
                    else if (arg === 'format') this.applyStyle(c => { ['b', 'i', 'u', 's', 'al', 'va', 'fmt', 'bg', 'fg', 'fs', 'wr', 'bd'].forEach(k => delete c[k]); }, 'changeFormat', { cleared: true });
                    else if (arg === 'all') this.applyStyle(c => { ['v', 'f', 'cm', 'b', 'i', 'u', 's', 'al', 'va', 'fmt', 'bg', 'fg', 'fs', 'wr', 'bd'].forEach(k => delete c[k]); }, 'clear', { all: true });
                    break;
                case 'rowAbove': this.structural('r', g.r1, g.r2 - g.r1 + 1); break;
                case 'rowBelow': this.structural('r', g.r2 + 1, g.r2 - g.r1 + 1); break;
                case 'delRow': this.structural('r', g.r1, -(g.r2 - g.r1 + 1)); break;
                case 'colLeft': this.structural('c', g.c1, g.c2 - g.c1 + 1); break;
                case 'colRight': this.structural('c', g.c2 + 1, g.c2 - g.c1 + 1); break;
                case 'delCol': this.structural('c', g.c1, -(g.c2 - g.c1 + 1)); break;
                case 'addSheet': this.addSheet(); break;
                case 'image': this.imageDialog(); break;
                case 'comment': this.commentDialog(); break;
                case 'sortAsc': this.sortSelection('asc'); break;
                case 'sortDesc': this.sortSelection('desc'); break;
                case 'filter': this.toggleFilter(); break;
                case 'validation': this.validationDialog(); break;
                case 'lock': this.setEnabled(g, false); break;
                case 'unlock': this.setEnabled(g, true); break;
                case 'grid': sh.grid = !sh.grid; this.render(); break;
                case 'formulas': this.showFormulas = !this.showFormulas; this.render(); break;
                case 'freeze': {
                    const m = { none: [0, 0], row: [1, 0], col: [0, 1], both: [1, 1], sel: [this.anchor.r - 1, this.anchor.c - 1] }[arg];
                    if (m) this.freeze(m[0], m[1]);
                    break;
                }
                case 'zoom': this.zoom = +arg || 1; this.render(); this.emit('zoom', { zoom: this.zoom }); break;
                case 'exportCsv': this.exportCsv(); break;
                case 'exportJson': this.exportJson(); break;
                case 'exportXlsx': this.exportXlsx(); break;
                case 'exportPdf': this.exportPdf(); break;
                case 'importFile': this.importFile(); break;
                case 'importXlsx': this.importXlsx(); break;
            }
        }
        contextItems() {
            const sh = this.cur(), a = this.normPt(sh, this.anchor.r, this.anchor.c), g = this.range(), cell = sh.cells[K(a.r, a.c)] || {};
            const ro = this.readonly, single = g.r1 === g.r2 && g.c1 === g.c2, merged = !!this.mergeAt(sh, a.r, a.c), locked = this.isDisabled(sh, a.r, a.c);
            return [
                { label: 'Kes', kbd: 'Ctrl+X', disabled: ro, run: () => this.exec('cut') },
                { label: 'Kopyala', kbd: 'Ctrl+C', run: () => this.exec('copy') },
                { label: 'Yapıştır', kbd: 'Ctrl+V', disabled: ro, run: () => this.exec('paste') },
                '-',
                { label: 'Satır ekle (üste)', disabled: ro, run: () => this.exec('rowAbove') },
                { label: 'Satır ekle (alta)', disabled: ro, run: () => this.exec('rowBelow') },
                { label: 'Satırı sil', disabled: ro, run: () => this.exec('delRow') },
                { label: 'Sütun ekle (sola)', disabled: ro, run: () => this.exec('colLeft') },
                { label: 'Sütun ekle (sağa)', disabled: ro, run: () => this.exec('colRight') },
                { label: 'Sütunu sil', disabled: ro, run: () => this.exec('delCol') },
                '-',
                { label: merged ? 'Birleştirmeyi kaldır' : 'Hücreleri birleştir', disabled: ro || (single && !merged), run: () => this.exec('merge') },
                { label: cell.cm ? 'Yorumu düzenle' : 'Yorum ekle', kbd: 'Shift+F2', disabled: ro, run: () => this.exec('comment') },
                cell.cm ? { label: 'Yorumu sil', disabled: ro, run: () => this.setComment({ r1: a.r, c1: a.c, r2: a.r, c2: a.c }, '') } : null,
                { label: 'Veri doğrulama...', disabled: ro, run: () => this.exec('validation') },
                { label: locked ? 'Kilidi aç' : 'Hücreleri kilitle', disabled: ro, run: () => this.exec(locked ? 'unlock' : 'lock') },
                '-',
                { label: 'İçeriği temizle', kbd: 'Del', disabled: ro, run: () => this.exec('clear', 'content') },
                { label: 'Biçimi temizle', disabled: ro, run: () => this.exec('clear', 'format') }
            ].filter(Boolean);
        }

        /* ====================== Dışa / İçe aktarım ====================== */
        toWire(sh, si) {
            const cells = [];
            Object.keys(sh.cells).forEach(k => {
                const p = k.split(',').map(Number), cell = sh.cells[k], v = this.valueAt(si, p[0], p[1]);
                const w = { row: p[0], col: p[1] };
                if (v instanceof SErr) w.value = v.code;
                else if (v != null && v !== '') w.value = typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v);
                if (cell.f) w.formula = '=' + cell.f;
                if (cell.b) w.bold = true; if (cell.i) w.italic = true; if (cell.u) w.underline = true; if (cell.s) w.strike = true;
                if (cell.al) w.align = cell.al; if (cell.va) w.vAlign = cell.va; if (cell.fmt) w.format = cell.fmt;
                if (cell.bg) w.background = cell.bg; if (cell.fg) w.color = cell.fg; if (cell.fs) w.fontSize = cell.fs;
                if (cell.wr) w.wrap = true; if (cell.bd) w.border = cell.bd; if (cell.en === false) w.enabled = false;
                if (cell.cm) w.comment = cell.cm;
                cells.push(w);
            });
            const colW = {}, rowH = {};
            Object.keys(sh.colW).forEach(k => { colW[k] = sh.colW[k]; }); Object.keys(sh.rowH).forEach(k => { rowH[k] = sh.rowH[k]; });
            return {
                name: sh.name, rows: sh.rows, cols: sh.cols, cells, columnWidths: colW, rowHeights: rowH,
                mergedCells: sh.merges.map(rangeStr), frozenRows: sh.frozenR, frozenCols: sh.frozenC,
                validations: sh.vals.map(v => ({ range: rangeStr(v.g), type: v.type, comparer: v.comparer, from: v.from == null ? null : String(v.from), to: v.to == null ? null : String(v.to), formula: v.formula || null, items: v.items, allowNulls: v.allowNulls, reject: v.reject, title: v.title, message: v.message, error: v.error })),
                editors: sh.eds.filter(e => !e.ds).map(e => ({ range: rangeStr(e.g), type: e.type, items: e.items, min: e.min == null ? null : String(e.min), max: e.max == null ? null : String(e.max), step: e.step == null ? null : String(e.step) })),
                disabledRanges: sh.dis.map(rangeStr),
                images: sh.imgs.map(i => ({ src: i.src, row: i.r, col: i.c, x: i.x, y: i.y, width: i.w, height: i.h })),
                filter: sh.filter ? rangeStr(sh.filter.g) : null, showGridLines: sh.grid
            };
        }
        getSheets() { return this.sheets.map((s, i) => this.toWire(s, i)); }
        toJSON() { return { sheets: this.getSheets() }; }
        loadSheets(arr) {
            this.pushUndo();
            this.sheets = (arr && arr.length ? arr : [{ name: 'Sayfa 1' }]).map(normSheet);
            this.sheets.forEach(bindSheetData);
            this.active = 0; this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 }; this.selImg = null;
            this.afterMutate();
        }
        download(blob, name) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = name;
            document.body.appendChild(a); a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
        }
        fileBase() { return (this.opts.fileName || 'Panoptes') + '_' + new Date().toISOString().slice(0, 10); }
        toCsv() {
            const sh = this.cur(), si = this.active, u = this.usedRange(), out = [];
            for (let r = 1; r <= u.r; r++) {
                const row = [];
                for (let c = 1; c <= u.c; c++) {
                    const v = this.valueAt(si, r, c), cell = sh.cells[K(r, c)];
                    const t = v == null ? '' : (cell && cell.fmt && /^(date|datetime|time)$/.test(cell.fmt)) ? formatValue(v, cell.fmt) : (v instanceof SErr ? v.code : typeof v === 'number' ? fmtGeneral(v) : String(v));
                    row.push('"' + t.replace(/"/g, '""') + '"');
                }
                out.push(row.join(';'));
            }
            return out.join('\r\n');
        }
        exportCsv() {
            this.download(new Blob(['\uFEFF' + this.toCsv()], { type: 'text/csv;charset=utf-8;' }), this.fileBase() + '_' + this.cur().name + '.csv');
            this.emit('export', { format: 'csv' });
        }
        exportJson() {
            this.download(new Blob([JSON.stringify(this.toJSON(), null, 2)], { type: 'application/json' }), this.fileBase() + '.json');
            this.emit('export', { format: 'json' });
        }
        exportXlsx() {
            if (!this.opts.exportUrl) { this.toast('Excel dışa aktarımı için export-url tanımlanmamış.', 'err'); return Promise.resolve(); }
            this.toast('Excel dosyası sunucuda hazırlanıyor...');
            return fetch(this.opts.exportUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: this.opts.fileName, sheets: this.getSheets() }) })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
                .then(b => { this.download(b, this.fileBase() + '.xlsx'); this.emit('export', { format: 'xlsx', size: b.size }); this.toast('Excel dosyası indirildi.', 'ok'); })
                .catch(err => this.toast('Excel dışa aktarımı başarısız: ' + err.message, 'err'));
        }
        pickFile(accept, cb) {
            const i = document.createElement('input');
            i.type = 'file'; i.accept = accept; i.style.display = 'none';
            i.addEventListener('change', () => { if (i.files[0]) cb(i.files[0]); i.remove(); });
            document.body.appendChild(i); i.click();
        }
        importXlsx(file) {
            if (!this.opts.importUrl) { this.toast('Excel içe aktarımı için import-url tanımlanmamış.', 'err'); return; }
            const run = f => {
                const fd = new FormData(); fd.append('file', f);
                this.toast('Excel dosyası sunucuda okunuyor...');
                fetch(this.opts.importUrl, { method: 'POST', body: fd })
                    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                    .then(j => { this.loadSheets(j.sheets || j.Sheets || []); this.emit('import', { format: 'xlsx', fileName: f.name, sheets: this.sheets.length }); this.toast('"' + f.name + '" içe aktarıldı.', 'ok'); })
                    .catch(err => this.toast('Excel içe aktarımı başarısız: ' + err.message, 'err'));
            };
            if (file) run(file); else this.pickFile('.xlsx', run);
        }
        parseCsv(text) {
            const first = text.split(/\r?\n/)[0] || '';
            const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length && first.indexOf(';') >= 0 ? ';' : (first.indexOf('\t') >= 0 && first.indexOf(',') < 0 ? '\t' : ',');
            const rows = []; let row = [], cur = '', q = false;
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
                else if (ch === '"') q = true;
                else if (ch === sep) { row.push(cur); cur = ''; }
                else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
                else if (ch !== '\r') cur += ch;
            }
            if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
            return rows;
        }
        importFile() {
            this.pickFile('.csv,.json,.txt', f => {
                const fr = new FileReader();
                fr.onload = () => {
                    try {
                        if (/\.json$/i.test(f.name)) {
                            const j = JSON.parse(fr.result);
                            this.loadSheets(Array.isArray(j) ? j : (j.sheets || j.Sheets || []));
                        } else {
                            const rows = this.parseCsv(String(fr.result).replace(/^\uFEFF/, '')), w = Math.max.apply(null, rows.map(r => r.length).concat([1]));
                            const nm = this.uniqueSheetName(f.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'İçe aktarılan');
                            const s = normSheet({ name: nm, rows: Math.max(50, rows.length + 5), cols: Math.max(26, w) });
                            rows.forEach((r, ri) => r.forEach((t, ci) => { if (t !== '') { const p = parseInput(t), cell = {}; if (p.f != null) cell.f = p.f; else { cell.v = p.v; if (p.fmt) cell.fmt = p.fmt; } s.cells[K(ri + 1, ci + 1)] = cell; } }));
                            this.pushUndo(); this.sheets.push(s); this.active = this.sheets.length - 1; this.anchor = { r: 1, c: 1 }; this.focus = { r: 1, c: 1 }; this.afterMutate();
                        }
                        this.emit('import', { format: /\.json$/i.test(f.name) ? 'json' : 'csv', fileName: f.name });
                        this.toast('"' + f.name + '" içe aktarıldı.', 'ok');
                    } catch (err) { this.toast('Dosya okunamadı: ' + err.message, 'err'); }
                };
                fr.readAsText(f, 'utf-8');
            });
        }
        exportPdf() {
            const sh = this.cur(), si = this.active, u = this.usedRange(), anchors = {}, covered = new Set();
            sh.merges.forEach(m => { anchors[K(m.r1, m.c1)] = m; for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) if (!(r === m.r1 && c === m.c1)) covered.add(K(r, c)); });
            let h = '<table><colgroup>';
            for (let c = 1; c <= u.c; c++) h += '<col style="width:' + this.cw(sh, c) + 'px">';
            h += '</colgroup><tbody>';
            for (let r = 1; r <= u.r; r++) {
                if (this.hidden.has(r)) continue;
                h += '<tr style="height:' + (sh.rowH[r] || DEF_H) + 'px">';
                for (let c = 1; c <= u.c; c++) {
                    const k = K(r, c);
                    if (covered.has(k)) continue;
                    const cell = sh.cells[k] || {}, v = this.valueAt(si, r, c), m = anchors[k];
                    const al = cell.al || ((v instanceof SErr || typeof v === 'boolean') ? 'center' : typeof v === 'number' ? 'right' : 'left');
                    let st = 'text-align:' + al + ';';
                    if (cell.b) st += 'font-weight:700;'; if (cell.i) st += 'font-style:italic;';
                    if (cell.u || cell.s) st += 'text-decoration:' + (cell.u ? 'underline ' : '') + (cell.s ? 'line-through' : '') + ';';
                    if (cell.bg) st += 'background:' + esc(cell.bg) + ';'; if (cell.fg) st += 'color:' + esc(cell.fg) + ';'; if (cell.fs) st += 'font-size:' + (+cell.fs) + 'px;';
                    if (cell.bd) { if (cell.bd.indexOf('t') >= 0) st += 'border-top:1.5px solid #000;'; if (cell.bd.indexOf('b') >= 0) st += 'border-bottom:1.5px solid #000;'; if (cell.bd.indexOf('l') >= 0) st += 'border-left:1.5px solid #000;'; if (cell.bd.indexOf('r') >= 0) st += 'border-right:1.5px solid #000;'; }
                    h += '<td' + (m ? ' colspan="' + (m.c2 - m.c1 + 1) + '" rowspan="' + (m.r2 - m.r1 + 1) + '"' : '') + ' style="' + st + '">' + esc(formatValue(v, cell.fmt)) + '</td>';
                }
                h += '</tr>';
            }
            h += '</tbody></table>';
            const w = window.open('', '_blank');
            if (!w) { this.toast('Açılır pencere engellendi, izin verin.', 'err'); return; }
            w.document.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>' + esc(sh.name) + '</title><style>@page{size:landscape;margin:12mm}body{font:12px system-ui,sans-serif;color:#0f172a;margin:16px}h2{margin:0 0 10px;font-size:16px}table{border-collapse:collapse;table-layout:fixed}td{border:1px solid #cbd5e1;padding:2px 6px;overflow:hidden;white-space:nowrap}</style></head><body><h2>' + esc((this.opts.title ? this.opts.title + ' - ' : '') + sh.name) + '</h2>' + h + '</body></html>');
            w.document.close(); w.focus();
            setTimeout(() => w.print(), 350);
            this.emit('export', { format: 'pdf' });
        }

        /* ====================== Genel API ====================== */
        toRC(a, b) {
            if (typeof a === 'string') { const p = parseCellRef(a); return p ? { r: p.r, c: p.c } : null; }
            return { r: a, c: b };
        }
        getValue(a, b) { const p = this.toRC(a, b); if (!p) return null; const v = this.valueOf(p.r, p.c); return v instanceof SErr ? v.code : v; }
        getFormula(a, b) { const p = this.toRC(a, b); const cell = p && this.cur().cells[K(p.r, p.c)]; return cell && cell.f ? '=' + cell.f : null; }
        getText(a, b) { const p = this.toRC(a, b); if (!p) return ''; const cell = this.cur().cells[K(p.r, p.c)]; return formatValue(this.valueOf(p.r, p.c), cell && cell.fmt); }
        setValue(a, b, c) {
            const p = this.toRC(a, typeof a === 'string' ? undefined : b), text = typeof a === 'string' ? b : c;
            if (!p) return false;
            return this.applyInput(p.r, p.c, text == null ? '' : String(text), 'text');
        }
        getCellValue(r, c) { return this.getValue(r, c); }
        setCellValue(r, c, v) { return this.setValue(r, c, v); }
        getRange(ref) {
            const g = parseRange(ref), out = [];
            if (!g) return out;
            for (let r = g.r1; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) row.push(this.getValue(r, c)); out.push(row); }
            return out;
        }
        setRange(ref, rows) {
            const g = parseRange(ref), sh = this.cur();
            if (!g) return;
            this.mutate(() => rows.forEach((row, dr) => row.forEach((v, dc) => {
                const r = g.r1 + dr, c = g.c1 + dc;
                if (r > sh.rows || c > sh.cols || this.isDisabled(sh, r, c)) return;
                this.setRaw(sh, r, c, typeof v === 'number' || typeof v === 'boolean' ? { v } : parseInput(v == null ? '' : String(v)));
            })));
            this.emit('change', { range: rangeStr(g), bulk: true });
        }
        format(ref, f) {
            const g = parseRange(ref), d = lc(f);
            if (!g) return;
            this.applyStyle(c => {
                if ('bold' in d) { if (d.bold) c.b = 1; else delete c.b; }
                if ('italic' in d) { if (d.italic) c.i = 1; else delete c.i; }
                if ('underline' in d) { if (d.underline) c.u = 1; else delete c.u; }
                if ('strike' in d) { if (d.strike) c.s = 1; else delete c.s; }
                if ('wrap' in d) { if (d.wrap) c.wr = 1; else delete c.wr; }
                if (d.background) c.bg = d.background; if (d.color) c.fg = d.color; if (d.fontsize) c.fs = +d.fontsize;
                if (d.align) c.al = d.align; if (d.valign) c.va = d.valign;
                if (d.format) { if (d.format === 'general') delete c.fmt; else c.fmt = d.format; }
            }, 'changeFormat', f, g);
        }
        merge(ref) { const g = parseRange(ref); if (g) { const sh = this.cur(); if (!sh.merges.some(m => m.r1 === g.r1 && m.r2 === g.r2 && m.c1 === g.c1 && m.c2 === g.c2)) this.toggleMerge(g); } }
        unmerge(ref) { const g = parseRange(ref), sh = this.cur(); if (g && sh.merges.some(m => m.r1 === g.r1 && m.r2 === g.r2 && m.c1 === g.c1 && m.c2 === g.c2)) this.toggleMerge(g); }
        enable(ref) { const g = parseRange(ref); if (g) this.setEnabled(g, true); }
        disable(ref) { const g = parseRange(ref); if (g) this.setEnabled(g, false); }
        isEnabled(ref) { const p = this.toRC(ref); return !!p && !this.isDisabled(this.cur(), p.r, p.c); }
        setValidationRule(ref, def) { const g = parseRange(ref); if (g) this.setValidation(g, def); }
        clearValidation(ref) { const g = parseRange(ref); if (g) this.setValidation(g, {}); }
        setEditor(ref, def) {
            const g = parseRange(ref), d = lc(def), sh = this.cur();
            if (!g) return;
            this.mutate(() => { sh.eds = sh.eds.filter(e => e.ds || !(e.g.r1 >= g.r1 && e.g.r2 <= g.r2 && e.g.c1 >= g.c1 && e.g.c2 <= g.c2)); if (d.type) sh.eds.push({ g, type: d.type, items: toItems(d.items), min: d.min, max: d.max, step: d.step }); });
        }
        setCommentAt(ref, text) { const g = parseRange(ref); if (g) this.setComment(g, text); }
        getComment(ref) { const p = this.toRC(ref), cell = p && this.cur().cells[K(p.r, p.c)]; return cell && cell.cm ? cell.cm : null; }
        insertRow(index, count) { this.structural('r', index, count || 1); }
        deleteRow(index, count) { this.structural('r', index, -(count || 1)); }
        insertColumn(index, count) { this.structural('c', index, count || 1); }
        deleteColumn(index, count) { this.structural('c', index, -(count || 1)); }
        resizeColumn(index, width) { this.pushUndo(); this.cur().colW[index] = Math.max(30, +width); this.render(); this.emit('resize', { kind: 'column', index, size: +width }); }
        resizeRow(index, height) { this.pushUndo(); this.cur().rowH[index] = Math.max(14, +height); this.render(); this.emit('resize', { kind: 'row', index, size: +height }); }
        sort(ref, col, dir) {
            const g = parseRange(ref), c = typeof col === 'string' ? letterToCol(col.toUpperCase()) : col;
            if (g) this.sortRange(g, c, dir === 'desc' ? 'desc' : 'asc');
        }
        filter(ref) {
            const sh = this.cur();
            if (ref === false || ref === null) { if (sh.filter) this.toggleFilter(); }
            else this.toggleFilter(ref || 'on');
        }
        clearFilters() { const sh = this.cur(); if (sh.filter) { this.pushUndo(); sh.filter.crit = {}; this.afterMutate(); this.emit('filter', { cleared: true }); } }
        select(ref) { this.selectRange(ref); this.scroll.focus({ preventScroll: true }); }
        getSelection() { const g = this.range(); return { ref: rangeStr(g), row: this.anchor.r, col: this.anchor.c }; }
        recalc() { this.cache.clear(); this.render(); }
        setReadonly(v) { this.readonly = !!v; this.render(); this.fillRibbon(); }
        getSheetNames() { return this.sheets.map(s => s.name); }
        bindData(columns, items, si) {
            const sh = this.sheets[si || 0];
            if (!sh) return;
            this.pushUndo();
            sh.cells = {}; sh.merges = [];
            sh.ds = { columns: columns.map(x0 => { const x = lc(x0); return { field: x.field, title: x.title || x.field, width: x.width, format: x.format, editor: x.editor, items: toItems(x.items) }; }), items };
            bindSheetData(sh);
            this.afterMutate();
            this.emit('dataBound', { count: items.length });
        }
        getData(si) { const sh = this.sheets[si || 0]; return sh && sh.ds ? sh.ds.items.slice() : []; }
        fetchData(url, columns, si) {
            return fetch(url, { headers: { Accept: 'application/json' } })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(j => {
                    const items = Array.isArray(j) ? j : (j.items || j.data || j.value || []);
                    const cols = columns || Object.keys(items[0] || {}).map(k => ({ field: k, title: k }));
                    this.bindData(cols, items, si);
                    return items;
                });
        }
    }

    /* ======================================================================
     *  Şerit tanımları
     * ==================================================================== */
    const TAB_LABEL = { home: 'Giriş', insert: 'Ekle', data: 'Veri', view: 'Görünüm', file: 'Dosya' };
    const MENU_SELECTS = ['border', 'valign', 'clear', 'freeze'];
    const ALIGN_SVG = {
        left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h16"/></svg>',
        center: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M4 18h16"/></svg>',
        right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M10 12h10M4 18h16"/></svg>'
    };
    const bt = (cmd, label, title, arg) => '<button type="button" class="ps-btn" data-cmd="' + cmd + '"' + (arg != null ? ' data-arg="' + arg + '"' : '') + ' title="' + esc(title || label.replace(/<[^>]+>/g, '')) + '">' + label + '</button>';
    const sl = (cmd, title, opts, w) => '<select class="ps-sel-in" data-cmd="' + cmd + '" title="' + esc(title) + '"' + (w ? ' style="width:' + w + 'px"' : '') + '>' + opts.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select>';
    const grp = function () { return '<div class="ps-grp">' + Array.prototype.join.call(arguments, '') + '</div>'; };
    const RIBBON = {
        home: () =>
            grp(bt('undo', 'Geri Al', 'Geri al (Ctrl+Z)'), bt('redo', 'Yinele', 'Yinele (Ctrl+Y)')) +
            grp(bt('cut', 'Kes'), bt('copy', 'Kopyala'), bt('paste', 'Yapıştır')) +
            grp(sl('fontSize', 'Yazı boyutu', [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36].map(x => [x, x]), 58),
                bt('bold', '<b>B</b>', 'Kalın (Ctrl+B)'), bt('italic', '<i style="font-family:serif">I</i>', 'İtalik (Ctrl+I)'),
                bt('underline', '<u>U</u>', 'Altı çizili (Ctrl+U)'), bt('strike', '<s>S</s>', 'Üstü çizili')) +
            grp('<span class="ps-lbl">Yazı</span><input type="color" class="ps-color" data-cmd="color" title="Yazı rengi" value="#0f172a">',
                '<span class="ps-lbl">Dolgu</span><input type="color" class="ps-color" data-cmd="bg" title="Dolgu rengi" value="#ffffff">',
                sl('border', 'Kenarlık', [['', 'Kenarlık'], ['all', 'Tüm kenarlıklar'], ['outside', 'Dış kenarlık'], ['top', 'Üst'], ['bottom', 'Alt'], ['left', 'Sol'], ['right', 'Sağ'], ['none', 'Kenarlık yok']], 104)) +
            grp(bt('align', ALIGN_SVG.left, 'Sola hizala', 'left'), bt('align', ALIGN_SVG.center, 'Ortala', 'center'), bt('align', ALIGN_SVG.right, 'Sağa hizala', 'right'),
                sl('valign', 'Dikey hizalama', [['', 'Dikey'], ['top', 'Üst'], ['middle', 'Orta'], ['bottom', 'Alt']], 72),
                bt('wrap', 'Kaydır', 'Metni kaydır'), bt('merge', 'Birleştir', 'Hücreleri birleştir / ayır')) +
            grp(sl('format', 'Sayı biçimi', [['general', 'Genel'], ['number', 'Sayı (1.234,00)'], ['integer', 'Tamsayı'], ['currency', 'Para birimi (₺)'], ['percent', 'Yüzde'], ['percent2', 'Yüzde (2 basamak)'], ['date', 'Tarih'], ['datetime', 'Tarih-saat'], ['time', 'Saat'], ['text', 'Metin'], ['scientific', 'Bilimsel']], 128),
                bt('decDown', '−.0', 'Ondalığı azalt'), bt('decUp', '+.0', 'Ondalığı artır')) +
            grp(sl('clear', 'Temizle', [['', 'Temizle'], ['content', 'İçeriği temizle'], ['format', 'Biçimi temizle'], ['all', 'Tümünü temizle']], 96)),
        insert: () =>
            grp(bt('rowAbove', 'Satır Ekle (Üst)'), bt('rowBelow', 'Satır Ekle (Alt)'), bt('delRow', 'Satırı Sil')) +
            grp(bt('colLeft', 'Sütun Ekle (Sol)'), bt('colRight', 'Sütun Ekle (Sağ)'), bt('delCol', 'Sütunu Sil')) +
            grp(bt('addSheet', 'Sayfa Ekle')) + grp(bt('image', 'Resim'), bt('comment', 'Yorum')),
        data: () =>
            grp(bt('sortAsc', 'Artan Sırala (A→Z)'), bt('sortDesc', 'Azalan Sırala (Z→A)'), bt('filter', 'Filtre')) +
            grp(bt('validation', 'Veri Doğrulama')) + grp(bt('lock', 'Hücreleri Kilitle'), bt('unlock', 'Kilidi Aç')),
        view: () =>
            grp(bt('grid', 'Izgara Çizgileri'), bt('formulas', 'Formülleri Göster')) +
            grp(sl('freeze', 'Bölmeleri dondur', [['', 'Bölmeleri Dondur'], ['none', 'Dondurmayı Kaldır'], ['row', 'İlk Satırı Dondur'], ['col', 'İlk Sütunu Dondur'], ['both', 'İlk Satır ve Sütun'], ['sel', 'Seçime Kadar Dondur']], 160)) +
            grp('<span class="ps-lbl">Yakınlık</span>' + sl('zoom', 'Yakınlaştırma', [0.5, 0.75, 1, 1.25, 1.5, 2].map(x => [x, Math.round(x * 100) + '%']), 76)),
        file: o =>
            grp(bt('exportCsv', 'CSV İndir'), bt('exportJson', 'JSON İndir'), o.exportUrl ? bt('exportXlsx', 'Excel (.xlsx) İndir') : '', bt('exportPdf', 'PDF / Yazdır')) +
            grp(bt('importFile', 'CSV / JSON Aç'), o.importUrl ? bt('importXlsx', 'Excel (.xlsx) Aç') : '')
    };
    function toHex(c) {
        if (!c) return null;
        if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
        const m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c);
        return m ? '#' + [m[1], m[2], m[3]].map(x => ('0' + (+x).toString(16)).slice(-2)).join('') : null;
    }

    /* ======================================================================
     *  Genel API & başlatma
     * ==================================================================== */
    window.Panoptes.Spreadsheet = {
        __v2: true,
        instances: {},
        functions: FUNCTION_NAMES,
        formatValue, parseInput, colToLetter, letterToCol,
        getInstance(id) { return this.instances[id] || null; },
        init(el) {
            if (!el) return null;
            if (!el.id) el.id = 'panoptes-sheet-' + Math.random().toString(36).slice(2, 9);
            if (this.instances[el.id]) return this.instances[el.id];
            const inst = new Spreadsheet(el);
            this.instances[el.id] = inst;
            return inst;
        },
        initAll() { document.querySelectorAll('[data-panoptes-spreadsheet="true"]').forEach(el => this.init(el)); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.Panoptes.Spreadsheet.initAll());
    else window.Panoptes.Spreadsheet.initAll();
})();
