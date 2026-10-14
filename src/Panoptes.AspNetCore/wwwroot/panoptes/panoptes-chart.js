/**
 * Panoptes Chart Engine (Saf SVG & Vanilla JS)
 * Harici kütüphanesiz, vektörel, retina-ready, modern kurumsal grafik motoru.
 * Desteklenen türler: Column, Bar, Line, Area, Pie, Donut
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.Chart = factory();
        root.panoptesChart = root.Panoptes.Chart;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();
    var DEFAULT_COLORS = [
        '#2563eb', // Blue-600
        '#4f46e5', // Indigo-600
        '#059669', // Emerald-600
        '#d97706', // Amber-600
        '#e11d48', // Rose-600
        '#0891b2', // Cyan-600
        '#7c3aed', // Violet-600
        '#ea580c'  // Orange-600
    ];

    // Yardımcı veri erişim fonksiyonları (Büyük/Küçük harf duyarsız ve güvenli)
    function getSeriesValues(s) {
        if (!s) return [];
        return s.values || s.Values || s.data || s.Data || [];
    }

    function getSeriesName(s, fallback) {
        if (!s) return fallback || '';
        return s.name || s.Name || fallback || '';
    }

    function getSeriesColor(s, fallback) {
        if (!s) return fallback;
        return s.color || s.Color || fallback;
    }

    function getPointLabel(p, fallback) {
        if (!p) return fallback || '';
        return p.label || p.Label || fallback || '';
    }

    function getPointValue(p) {
        if (!p) return 0;
        var v = p.value !== undefined ? p.value : (p.Value !== undefined ? p.Value : 0);
        return Number(v) || 0;
    }

    function getPointColor(p, fallback) {
        if (!p) return fallback;
        return p.color || p.Color || fallback;
    }

    var ChartInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.container = this.element.querySelector('.panoptes-chart-canvas-container');
        this.legendContainer = this.element.querySelector('.panoptes-chart-legend');

        this.init();
    };

    ChartInstance.prototype.init = function () {
        var rawConfig = this.element.getAttribute('data-config');
        if (rawConfig) {
            try {
                this.config = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[Panoptes Chart] Konfigürasyon JSON çözümlenemedi:', e);
                this.config = {};
            }
        } else {
            this.config = this.options || {};
        }

        // Özellikleri normalize et (case-insensitive & varsayılanlar)
        this.config.categories = this.config.categories || this.config.Categories || [];
        this.config.series = this.config.series || this.config.Series || [];
        this.config.points = this.config.points || this.config.Points || [];
        this.config.type = (this.config.type || this.config.Type || 'column').toString().toLowerCase();
        this.config.height = this.config.height || this.config.Height || 320;
        this.config.showLegend = this.config.showLegend !== undefined ? this.config.showLegend : (this.config.ShowLegend !== undefined ? this.config.ShowLegend : true);
        this.config.showGrid = this.config.showGrid !== undefined ? this.config.showGrid : (this.config.ShowGrid !== undefined ? this.config.ShowGrid : true);
        this.config.valuePrefix = this.config.valuePrefix || this.config.ValuePrefix || '';
        this.config.valueSuffix = this.config.valueSuffix || this.config.ValueSuffix || '';

        this.tooltip = this.getOrCreateTooltip();
        this.render();

        var self = this;
        window.addEventListener('resize', function () {
            self.render();
        });
    };

    ChartInstance.prototype.getOrCreateTooltip = function () {
        var tt = document.getElementById('panoptes-chart-global-tooltip');
        if (!tt) {
            tt = document.createElement('div');
            tt.id = 'panoptes-chart-global-tooltip';
            tt.className = 'fixed pointer-events-none z-50 px-3 py-1.5 rounded-lg bg-slate-900/95 text-white text-xs font-mono shadow-xl transition-all duration-75 transform -translate-x-1/2 -translate-y-full opacity-0 border border-slate-700/50 backdrop-blur-xs';
            document.body.appendChild(tt);
        }
        return tt;
    };

    ChartInstance.prototype.showTooltip = function (e, text) {
        if (!this.tooltip) return;
        this.tooltip.innerHTML = text;
        this.tooltip.style.left = e.clientX + 'px';
        this.tooltip.style.top = (e.clientY - 12) + 'px';
        this.tooltip.classList.remove('opacity-0');
        this.tooltip.classList.add('opacity-100');
    };

    ChartInstance.prototype.hideTooltip = function () {
        if (!this.tooltip) return;
        this.tooltip.classList.remove('opacity-100');
        this.tooltip.classList.add('opacity-0');
    };

    ChartInstance.prototype.render = function () {
        if (!this.container) return;
        this.container.innerHTML = '';

        var width = this.container.clientWidth || 600;
        var height = this.config.height || 320;
        var type = (this.config.type || 'column').toLowerCase();

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        svg.setAttribute('class', 'panoptes-chart-svg select-none overflow-visible');

        if (type === 'pie' || type === 'donut') {
            this.renderPieDonut(svg, width, height, type === 'donut');
        } else if (type === 'bar') {
            this.renderBar(svg, width, height);
        } else if (type === 'line' || type === 'area') {
            this.renderLineArea(svg, width, height, type === 'area');
        } else {
            // Varsayılan: Column
            this.renderColumn(svg, width, height);
        }

        this.container.appendChild(svg);
        this.renderLegend();
    };

    ChartInstance.prototype.renderLegend = function () {
        if (!this.legendContainer || !this.config.showLegend) return;
        this.legendContainer.innerHTML = '';

        var items = [];
        var type = (this.config.type || 'column').toLowerCase();

        if (type === 'pie' || type === 'donut') {
            var points = this.config.points || [];
            points.forEach(function (p, idx) {
                items.push({
                    name: getPointLabel(p, 'Veri ' + (idx + 1)),
                    color: getPointColor(p, DEFAULT_COLORS[idx % DEFAULT_COLORS.length])
                });
            });
        } else {
            var series = this.config.series || [];
            series.forEach(function (s, idx) {
                items.push({
                    name: getSeriesName(s, 'Seri ' + (idx + 1)),
                    color: getSeriesColor(s, DEFAULT_COLORS[idx % DEFAULT_COLORS.length])
                });
            });
        }

        var self = this;
        items.forEach(function (item) {
            var el = document.createElement('div');
            el.className = 'flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition text-xs';
            el.innerHTML = '<span class="w-3 h-3 rounded-sm shrink-0" style="background-color: ' + item.color + '"></span>' +
                           '<span class="text-slate-600 font-medium">' + item.name + '</span>';
            self.legendContainer.appendChild(el);
        });
    };

    ChartInstance.prototype.renderColumn = function (svg, width, height) {
        var padL = 50, padR = 20, padT = 30, padB = 40;
        var plotW = width - padL - padR;
        var plotH = height - padT - padB;

        var categories = this.config.categories || [];
        var series = this.config.series || [];
        if (categories.length === 0 || series.length === 0) return;

        // Max değer hesapla
        var maxVal = 0;
        series.forEach(function (s) {
            var vals = getSeriesValues(s);
            vals.forEach(function (v) {
                var num = Number(v) || 0;
                if (num > maxVal) maxVal = num;
            });
        });
        if (maxVal === 0) maxVal = 10;
        maxVal = Math.ceil(maxVal * 1.15); // %15 üst boşluk

        // Izgara çizgileri ve Y eksen etiketleri
        var gridCount = 4;
        for (var g = 0; g <= gridCount; g++) {
            var val = (maxVal / gridCount) * g;
            var yPos = padT + plotH - (val / maxVal) * plotH;

            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padL);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', width - padR);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#f1f5f9');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padL - 8);
            text.setAttribute('y', yPos + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#94a3b8');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'monospace');
            text.textContent = Math.round(val).toLocaleString('tr-TR');
            svg.appendChild(text);
        }

        var catWidth = plotW / categories.length;
        var self = this;

        categories.forEach(function (cat, cIdx) {
            var groupX = padL + cIdx * catWidth;
            var numSeries = series.length;
            var barTotalWidth = catWidth * 0.7;
            var singleBarW = Math.max(8, barTotalWidth / numSeries);
            var startBarX = groupX + (catWidth - barTotalWidth) / 2;

            series.forEach(function (s, sIdx) {
                var vals = getSeriesValues(s);
                var val = vals[cIdx] !== undefined ? vals[cIdx] : 0;
                var numVal = Number(val) || 0;
                var barH = (numVal / maxVal) * plotH;
                var barX = startBarX + sIdx * singleBarW;
                var barY = padT + plotH - barH;
                var color = getSeriesColor(s, DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length]);
                var name = getSeriesName(s, 'Seri ' + (sIdx + 1));

                var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', barX + 1);
                rect.setAttribute('y', barY);
                rect.setAttribute('width', Math.max(2, singleBarW - 2));
                rect.setAttribute('height', Math.max(1, barH));
                rect.setAttribute('rx', '3');
                rect.setAttribute('fill', color);
                rect.setAttribute('class', 'transition-all duration-200 cursor-pointer hover:opacity-80');

                rect.addEventListener('mouseenter', function (e) {
                    var formatted = (self.config.valuePrefix || '') + numVal.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + cat + '</strong><br/>' + name + ': ' + formatted);
                });
                rect.addEventListener('mousemove', function (e) {
                    var formatted = (self.config.valuePrefix || '') + numVal.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + cat + '</strong><br/>' + name + ': ' + formatted);
                });
                rect.addEventListener('mouseleave', function () {
                    self.hideTooltip();
                });

                svg.appendChild(rect);
            });

            // Kategori Etiketi
            var catLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            catLabel.setAttribute('x', groupX + catWidth / 2);
            catLabel.setAttribute('y', padT + plotH + 20);
            catLabel.setAttribute('text-anchor', 'middle');
            catLabel.setAttribute('fill', '#64748b');
            catLabel.setAttribute('font-size', '11px');
            catLabel.textContent = cat;
            svg.appendChild(catLabel);
        });
    };

    ChartInstance.prototype.renderBar = function (svg, width, height) {
        var padL = 90, padR = 30, padT = 20, padB = 30;
        var plotW = width - padL - padR;
        var plotH = height - padT - padB;

        var categories = this.config.categories || [];
        var series = this.config.series || [];
        if (categories.length === 0 || series.length === 0) return;

        var maxVal = 0;
        series.forEach(function (s) {
            var vals = getSeriesValues(s);
            vals.forEach(function (v) {
                var num = Number(v) || 0;
                if (num > maxVal) maxVal = num;
            });
        });
        if (maxVal === 0) maxVal = 10;
        maxVal = Math.ceil(maxVal * 1.15);

        var rowH = plotH / categories.length;
        var self = this;

        categories.forEach(function (cat, cIdx) {
            var rowY = padT + cIdx * rowH;
            var numSeries = series.length;
            var barTotalHeight = rowH * 0.7;
            var singleBarH = Math.max(6, barTotalHeight / numSeries);
            var startBarY = rowY + (rowH - barTotalHeight) / 2;

            // Kategori Etiketi (Sol)
            var catLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            catLabel.setAttribute('x', padL - 10);
            catLabel.setAttribute('y', rowY + rowH / 2 + 4);
            catLabel.setAttribute('text-anchor', 'end');
            catLabel.setAttribute('fill', '#64748b');
            catLabel.setAttribute('font-size', '11px');
            catLabel.textContent = cat;
            svg.appendChild(catLabel);

            series.forEach(function (s, sIdx) {
                var vals = getSeriesValues(s);
                var val = vals[cIdx] !== undefined ? vals[cIdx] : 0;
                var numVal = Number(val) || 0;
                var barW = (numVal / maxVal) * plotW;
                var barY = startBarY + sIdx * singleBarH;
                var color = getSeriesColor(s, DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length]);
                var name = getSeriesName(s, 'Seri ' + (sIdx + 1));

                var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', padL);
                rect.setAttribute('y', barY);
                rect.setAttribute('width', Math.max(2, barW));
                rect.setAttribute('height', Math.max(2, singleBarH - 2));
                rect.setAttribute('rx', '3');
                rect.setAttribute('fill', color);
                rect.setAttribute('class', 'transition-all duration-200 cursor-pointer hover:opacity-80');

                rect.addEventListener('mouseenter', function (e) {
                    var formatted = (self.config.valuePrefix || '') + numVal.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + cat + '</strong><br/>' + name + ': ' + formatted);
                });
                rect.addEventListener('mousemove', function (e) {
                    var formatted = (self.config.valuePrefix || '') + numVal.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + cat + '</strong><br/>' + name + ': ' + formatted);
                });
                rect.addEventListener('mouseleave', function () {
                    self.hideTooltip();
                });

                svg.appendChild(rect);
            });
        });
    };

    ChartInstance.prototype.renderLineArea = function (svg, width, height, isArea) {
        var padL = 50, padR = 20, padT = 30, padB = 40;
        var plotW = width - padL - padR;
        var plotH = height - padT - padB;

        var categories = this.config.categories || [];
        var series = this.config.series || [];
        if (categories.length === 0 || series.length === 0) return;

        var maxVal = 0;
        series.forEach(function (s) {
            var vals = getSeriesValues(s);
            vals.forEach(function (v) {
                var num = Number(v) || 0;
                if (num > maxVal) maxVal = num;
            });
        });
        if (maxVal === 0) maxVal = 10;
        maxVal = Math.ceil(maxVal * 1.15);

        // Izgara
        var gridCount = 4;
        for (var g = 0; g <= gridCount; g++) {
            var val = (maxVal / gridCount) * g;
            var yPos = padT + plotH - (val / maxVal) * plotH;

            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padL);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', width - padR);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#f1f5f9');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padL - 8);
            text.setAttribute('y', yPos + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#94a3b8');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'monospace');
            text.textContent = Math.round(val).toLocaleString('tr-TR');
            svg.appendChild(text);
        }

        var stepX = categories.length > 1 ? plotW / (categories.length - 1) : plotW / 2;
        var self = this;

        // X Eksen Etiketleri
        categories.forEach(function (cat, cIdx) {
            var x = padL + cIdx * stepX;
            var catLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            catLabel.setAttribute('x', x);
            catLabel.setAttribute('y', padT + plotH + 20);
            catLabel.setAttribute('text-anchor', 'middle');
            catLabel.setAttribute('fill', '#64748b');
            catLabel.setAttribute('font-size', '11px');
            catLabel.textContent = cat;
            svg.appendChild(catLabel);
        });

        // Gradyan Defs (Area için)
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);

        series.forEach(function (s, sIdx) {
            var color = getSeriesColor(s, DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length]);
            var name = getSeriesName(s, 'Seri ' + (sIdx + 1));
            var vals = getSeriesValues(s);
            var pts = [];

            categories.forEach(function (cat, cIdx) {
                var v = vals[cIdx] !== undefined ? vals[cIdx] : 0;
                var numVal = Number(v) || 0;
                var x = padL + cIdx * stepX;
                var y = padT + plotH - (numVal / maxVal) * plotH;
                pts.push({ x: x, y: y, val: numVal, cat: cat });
            });

            if (pts.length === 0) return;

            // Area dolgusu
            if (isArea) {
                var gradId = 'grad_' + self.id + '_' + sIdx;
                var linearGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                linearGrad.setAttribute('id', gradId);
                linearGrad.setAttribute('x1', '0%');
                linearGrad.setAttribute('y1', '0%');
                linearGrad.setAttribute('x2', '0%');
                linearGrad.setAttribute('y2', '100%');

                var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', color);
                stop1.setAttribute('stop-opacity', '0.45');
                linearGrad.appendChild(stop1);

                var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%');
                stop2.setAttribute('stop-color', color);
                stop2.setAttribute('stop-opacity', '0.02');
                linearGrad.appendChild(stop2);
                defs.appendChild(linearGrad);

                var areaPathStr = 'M ' + pts[0].x + ' ' + (padT + plotH) + ' ';
                pts.forEach(function (p) {
                    areaPathStr += 'L ' + p.x + ' ' + p.y + ' ';
                });
                areaPathStr += 'L ' + pts[pts.length - 1].x + ' ' + (padT + plotH) + ' Z';

                var areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                areaPath.setAttribute('d', areaPathStr);
                areaPath.setAttribute('fill', 'url(#' + gradId + ')');
                svg.appendChild(areaPath);
            }

            // Çizgi (Line Path)
            var linePathStr = 'M ' + pts[0].x + ' ' + pts[0].y + ' ';
            for (var i = 1; i < pts.length; i++) {
                linePathStr += 'L ' + pts[i].x + ' ' + pts[i].y + ' ';
            }

            var linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linePath.setAttribute('d', linePathStr);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke', color);
            linePath.setAttribute('stroke-width', '2.5');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(linePath);

            // Veri Noktaları (Circles)
            pts.forEach(function (p) {
                var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', p.x);
                circle.setAttribute('cy', p.y);
                circle.setAttribute('r', '4');
                circle.setAttribute('fill', '#ffffff');
                circle.setAttribute('stroke', color);
                circle.setAttribute('stroke-width', '2');
                circle.setAttribute('class', 'cursor-pointer hover:scale-125 transition transform origin-center');

                circle.addEventListener('mouseenter', function (e) {
                    var formatted = (self.config.valuePrefix || '') + p.val.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + p.cat + '</strong><br/>' + name + ': ' + formatted);
                });
                circle.addEventListener('mousemove', function (e) {
                    var formatted = (self.config.valuePrefix || '') + p.val.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                    self.showTooltip(e, '<strong>' + p.cat + '</strong><br/>' + name + ': ' + formatted);
                });
                circle.addEventListener('mouseleave', function () {
                    self.hideTooltip();
                });

                svg.appendChild(circle);
            });
        });
    };

    ChartInstance.prototype.renderPieDonut = function (svg, width, height, isDonut) {
        var points = this.config.points || [];
        if (points.length === 0) return;

        var total = 0;
        points.forEach(function (p) { total += getPointValue(p); });
        if (total === 0) return;

        var cx = width / 2;
        var cy = height / 2;
        var radius = Math.min(cx, cy) - 25;
        var innerRadius = isDonut ? radius * 0.6 : 0;

        var currentAngle = -Math.PI / 2;
        var self = this;

        points.forEach(function (p, idx) {
            var val = getPointValue(p);
            var sliceAngle = (val / total) * 2 * Math.PI;
            var endAngle = currentAngle + sliceAngle;
            var color = getPointColor(p, DEFAULT_COLORS[idx % DEFAULT_COLORS.length]);
            var label = getPointLabel(p, 'Nokta ' + (idx + 1));

            var x1 = cx + radius * Math.cos(currentAngle);
            var y1 = cy + radius * Math.sin(currentAngle);
            var x2 = cx + radius * Math.cos(endAngle);
            var y2 = cy + radius * Math.sin(endAngle);

            var largeArc = sliceAngle > Math.PI ? 1 : 0;

            var pathD = '';
            if (isDonut) {
                var ix1 = cx + innerRadius * Math.cos(endAngle);
                var iy1 = cy + innerRadius * Math.sin(endAngle);
                var ix2 = cx + innerRadius * Math.cos(currentAngle);
                var iy2 = cy + innerRadius * Math.sin(currentAngle);

                pathD = [
                    'M', x1, y1,
                    'A', radius, radius, 0, largeArc, 1, x2, y2,
                    'L', ix1, iy1,
                    'A', innerRadius, innerRadius, 0, largeArc, 0, ix2, iy2,
                    'Z'
                ].join(' ');
            } else {
                pathD = [
                    'M', cx, cy,
                    'L', x1, y1,
                    'A', radius, radius, 0, largeArc, 1, x2, y2,
                    'Z'
                ].join(' ');
            }

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', color);
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('class', 'transition-all duration-200 cursor-pointer hover:opacity-85');

            var pct = Math.round((val / total) * 100);

            path.addEventListener('mouseenter', function (e) {
                var formatted = (self.config.valuePrefix || '') + val.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                self.showTooltip(e, '<strong>' + label + '</strong><br/>' + formatted + ' (%' + pct + ')');
            });
            path.addEventListener('mousemove', function (e) {
                var formatted = (self.config.valuePrefix || '') + val.toLocaleString('tr-TR') + (self.config.valueSuffix || '');
                self.showTooltip(e, '<strong>' + label + '</strong><br/>' + formatted + ' (%' + pct + ')');
            });
            path.addEventListener('mouseleave', function () {
                self.hideTooltip();
            });

            svg.appendChild(path);
            currentAngle = endAngle;
        });

        // Donut ise ortada toplam etiket
        if (isDonut) {
            var centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            centerText.setAttribute('x', cx);
            centerText.setAttribute('y', cy - 2);
            centerText.setAttribute('text-anchor', 'middle');
            centerText.setAttribute('fill', '#1e293b');
            centerText.setAttribute('font-size', '18px');
            centerText.setAttribute('font-weight', 'bold');
            centerText.textContent = total.toLocaleString('tr-TR');
            svg.appendChild(centerText);

            var subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            subText.setAttribute('x', cx);
            subText.setAttribute('y', cy + 16);
            subText.setAttribute('text-anchor', 'middle');
            subText.setAttribute('fill', '#94a3b8');
            subText.setAttribute('font-size', '10px');
            subText.textContent = 'TOPLAM';
            svg.appendChild(subText);
        }
    };

    ChartInstance.prototype.updateData = function (newSeriesOrPoints) {
        if (Array.isArray(newSeriesOrPoints)) {
            if (this.config.type === 'pie' || this.config.type === 'donut') {
                this.config.points = newSeriesOrPoints;
            } else {
                this.config.series = newSeriesOrPoints;
            }
        }
        this.render();
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new ChartInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-chart="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new ChartInstance(el);
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
            if (window.Panoptes && window.Panoptes.Chart) {
                window.Panoptes.Chart.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.Chart) {
            window.Panoptes.Chart.autoInit();
        }
    }
}
