/**
 * Panoptes Gauge Engine (Saf SVG & Vanilla JS)
 * Harici kütüphanesiz, vektörel, kadranlı ve ibreli gösterge motoru.
 * Desteklenen türler: Radial (Kadran), Arc (Yay Dolumu), Linear (Termometre)
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.Gauge = factory();
        root.panoptesGauge = root.Panoptes.Gauge;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    var GaugeInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.canvas = this.element.querySelector('.panoptes-gauge-canvas');

        this.init();
    };

    GaugeInstance.prototype.init = function () {
        var rawConfig = this.element.getAttribute('data-config');
        if (rawConfig) {
            try {
                this.config = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[Panoptes Gauge] JSON konfigürasyon çözümlenemedi:', e);
                this.config = {};
            }
        } else {
            this.config = this.options;
        }

        this.currentValue = Number(this.config.value || 0);
        this.render();
    };

    GaugeInstance.prototype.render = function () {
        if (!this.canvas) return;
        this.canvas.innerHTML = '';

        var size = this.config.size || 240;
        var type = (this.config.type || 'radial').toLowerCase();

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
        svg.setAttribute('class', 'panoptes-gauge-svg select-none overflow-visible');

        if (type === 'arc') {
            this.renderArc(svg, size);
        } else if (type === 'linear') {
            this.renderLinear(svg, size);
        } else {
            this.renderRadial(svg, size);
        }

        this.canvas.appendChild(svg);
    };

    GaugeInstance.prototype.renderRadial = function (svg, size) {
        var cx = size / 2;
        var cy = size / 2;
        var r = size * 0.4;
        var min = Number(this.config.min || 0);
        var max = Number(this.config.max || 100);
        var val = Math.min(max, Math.max(min, this.currentValue));

        var startAngle = -210; // Derece
        var endAngle = 30;
        var totalAngle = endAngle - startAngle; // 240 derece

        // Arka Plan Çember Yayı
        var bgArc = this.describeArc(cx, cy, r, startAngle, endAngle);
        var bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bgPath.setAttribute('d', bgArc);
        bgPath.setAttribute('fill', 'none');
        bgPath.setAttribute('stroke', '#e2e8f0');
        bgPath.setAttribute('stroke-width', '10');
        bgPath.setAttribute('stroke-linecap', 'round');
        svg.appendChild(bgPath);

        // Eşik Dilimleri (Ranges)
        var ranges = this.config.ranges || [];
        var self = this;
        ranges.forEach(function (rng) {
            var rFrom = Math.min(max, Math.max(min, Number(rng.from || 0)));
            var rTo = Math.min(max, Math.max(min, Number(rng.to || 0)));
            var a1 = startAngle + ((rFrom - min) / (max - min)) * totalAngle;
            var a2 = startAngle + ((rTo - min) / (max - min)) * totalAngle;

            var rArc = self.describeArc(cx, cy, r, a1, a2);
            var rPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            rPath.setAttribute('d', rArc);
            rPath.setAttribute('fill', 'none');
            rPath.setAttribute('stroke', rng.color || '#3b82f6');
            rPath.setAttribute('stroke-width', '10');
            svg.appendChild(rPath);
        });

        // Kadran Çizgileri ve Sayısal Etiketler
        var tickCount = 5;
        for (var t = 0; t <= tickCount; t++) {
            var tVal = min + ((max - min) / tickCount) * t;
            var tAng = (startAngle + (t / tickCount) * totalAngle) * (Math.PI / 180);

            var x1 = cx + (r - 12) * Math.cos(tAng);
            var y1 = cy + (r - 12) * Math.sin(tAng);
            var x2 = cx + (r - 4) * Math.cos(tAng);
            var y2 = cy + (r - 4) * Math.sin(tAng);

            var tickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tickLine.setAttribute('x1', x1);
            tickLine.setAttribute('y1', y1);
            tickLine.setAttribute('x2', x2);
            tickLine.setAttribute('y2', y2);
            tickLine.setAttribute('stroke', '#94a3b8');
            tickLine.setAttribute('stroke-width', '2');
            svg.appendChild(tickLine);

            var tx = cx + (r - 22) * Math.cos(tAng);
            var ty = cy + (r - 22) * Math.sin(tAng) + 3;

            var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', tx);
            txt.setAttribute('y', ty);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', '#64748b');
            txt.setAttribute('font-size', '9px');
            txt.setAttribute('font-family', 'monospace');
            txt.textContent = Math.round(tVal);
            svg.appendChild(txt);
        }

        // İbre (Needle) Açısı
        var needleAngle = startAngle + ((val - min) / (max - min)) * totalAngle;
        var needleRad = needleAngle * (Math.PI / 180);
        var needleLen = r - 12;

        var nx = cx + needleLen * Math.cos(needleRad);
        var ny = cy + needleLen * Math.sin(needleRad);

        // İbre Çizgisi
        var needle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        needle.setAttribute('x1', cx);
        needle.setAttribute('y1', cy);
        needle.setAttribute('x2', nx);
        needle.setAttribute('y2', ny);
        needle.setAttribute('stroke', '#0f172a');
        needle.setAttribute('stroke-width', '3');
        needle.setAttribute('stroke-linecap', 'round');
        needle.setAttribute('class', 'panoptes-gauge-needle transition-all duration-500 ease-out');
        svg.appendChild(needle);

        // Merkez Pivot Noktası (Kapak Dairesi)
        var pivot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pivot.setAttribute('cx', cx);
        pivot.setAttribute('cy', cy);
        pivot.setAttribute('r', '8');
        pivot.setAttribute('fill', '#0f172a');
        pivot.setAttribute('stroke', '#ffffff');
        pivot.setAttribute('stroke-width', '2');
        svg.appendChild(pivot);

        // Alt Değer Etiketi
        var valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valText.setAttribute('x', cx);
        valText.setAttribute('y', cy + r * 0.7);
        valText.setAttribute('text-anchor', 'middle');
        valText.setAttribute('fill', '#0f172a');
        valText.setAttribute('font-size', '20px');
        valText.setAttribute('font-weight', 'bold');
        valText.textContent = val + (this.config.unit ? ' ' + this.config.unit : '');
        svg.appendChild(valText);
    };

    GaugeInstance.prototype.renderArc = function (svg, size) {
        var cx = size / 2;
        var cy = size / 2;
        var r = size * 0.42;
        var min = Number(this.config.min || 0);
        var max = Number(this.config.max || 100);
        var val = Math.min(max, Math.max(min, this.currentValue));

        var startAngle = -180;
        var endAngle = 0;
        var totalAngle = 180;

        // Arka Plan Yarım Dairesi
        var bgArc = this.describeArc(cx, cy + 20, r, startAngle, endAngle);
        var bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bgPath.setAttribute('d', bgArc);
        bgPath.setAttribute('fill', 'none');
        bgPath.setAttribute('stroke', '#e2e8f0');
        bgPath.setAttribute('stroke-width', '16');
        bgPath.setAttribute('stroke-linecap', 'round');
        svg.appendChild(bgPath);

        // Dolum Yayı
        var progressAngle = startAngle + ((val - min) / (max - min)) * totalAngle;
        if (progressAngle > startAngle) {
            var valArc = this.describeArc(cx, cy + 20, r, startAngle, progressAngle);
            var valPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            valPath.setAttribute('d', valArc);
            valPath.setAttribute('fill', 'none');
            valPath.setAttribute('stroke', '#3b82f6');
            valPath.setAttribute('stroke-width', '16');
            valPath.setAttribute('stroke-linecap', 'round');
            valPath.setAttribute('class', 'transition-all duration-500 ease-out');
            svg.appendChild(valPath);
        }

        // Merkez Değer
        var valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valText.setAttribute('x', cx);
        valText.setAttribute('y', cy + 10);
        valText.setAttribute('text-anchor', 'middle');
        valText.setAttribute('fill', '#0f172a');
        valText.setAttribute('font-size', '28px');
        valText.setAttribute('font-weight', 'bold');
        valText.textContent = val + (this.config.unit ? ' ' + this.config.unit : '');
        svg.appendChild(valText);

        var subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subText.setAttribute('x', cx);
        subText.setAttribute('y', cy + 30);
        subText.setAttribute('text-anchor', 'middle');
        subText.setAttribute('fill', '#94a3b8');
        subText.setAttribute('font-size', '10px');
        subText.textContent = 'Hedef: ' + max + ' ' + (this.config.unit || '');
        svg.appendChild(subText);
    };

    GaugeInstance.prototype.renderLinear = function (svg, size) {
        var min = Number(this.config.min || 0);
        var max = Number(this.config.max || 100);
        var val = Math.min(max, Math.max(min, this.currentValue));

        var barW = 28;
        var barH = size * 0.7;
        var bx = (size - barW) / 2;
        var by = (size - barH) / 2;

        // Arka Plan Çubuğu
        var bgBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgBar.setAttribute('x', bx);
        bgBar.setAttribute('y', by);
        bgBar.setAttribute('width', barW);
        bgBar.setAttribute('height', barH);
        bgBar.setAttribute('rx', barW / 2);
        bgBar.setAttribute('fill', '#e2e8f0');
        svg.appendChild(bgBar);

        // Dolum Yüksekliği
        var fillH = ((val - min) / (max - min)) * barH;
        var fillY = by + barH - fillH;

        var fillBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        fillBar.setAttribute('x', bx);
        fillBar.setAttribute('y', fillY);
        fillBar.setAttribute('width', barW);
        fillBar.setAttribute('height', fillH);
        fillBar.setAttribute('rx', barW / 2);
        fillBar.setAttribute('fill', '#10b981');
        fillBar.setAttribute('class', 'transition-all duration-500 ease-out');
        svg.appendChild(fillBar);

        // Yan Değer Etiketi
        var valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valText.setAttribute('x', bx + barW + 16);
        valText.setAttribute('y', fillY + 6);
        valText.setAttribute('fill', '#0f172a');
        valText.setAttribute('font-size', '14px');
        valText.setAttribute('font-weight', 'bold');
        valText.textContent = val + (this.config.unit ? ' ' + this.config.unit : '');
        svg.appendChild(valText);
    };

    GaugeInstance.prototype.describeArc = function (x, y, radius, startAngle, endAngle) {
        var start = this.polarToCartesian(x, y, radius, endAngle);
        var end = this.polarToCartesian(x, y, radius, startAngle);
        var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return [
            'M', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ');
    };

    GaugeInstance.prototype.polarToCartesian = function (cx, cy, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees) * Math.PI / 180.0;
        return {
            x: cx + (radius * Math.cos(angleInRadians)),
            y: cy + (radius * Math.sin(angleInRadians))
        };
    };

    GaugeInstance.prototype.setValue = function (newVal) {
        this.currentValue = Number(newVal);
        this.render();
    };

    GaugeInstance.prototype.getValue = function () {
        return this.currentValue;
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new GaugeInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-gauge="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new GaugeInstance(el);
                    instances.set(el.id, instance);
                }
            });
        }
    };
}));

// Sayfa yüklendiğinde otomatik başlat
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Panoptes && window.Panoptes.Gauge) {
                window.Panoptes.Gauge.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.Gauge) {
            window.Panoptes.Gauge.autoInit();
        }
    }
}
