/**
 * Panoptes StockChart Component (Finansal Mum ve Hacim Grafiği / Candlestick Chart)
 * Panoptes ASP.NET Core StockChart Bileşeni
 */

(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.StockChart = window.Panoptes.StockChart || {
        instances: {},

        getInstance: function (id) {
            return this.instances[id] || null;
        },

        init: function (container) {
            if (!container) return;
            const id = container.id || ('panoptes-stock-' + Math.random().toString(36).substring(2, 9));
            if (this.instances[id]) return;

            const instance = new PanoptesStockChartInstance(container);
            this.instances[id] = instance;
        },

        initAll: function () {
            document.querySelectorAll('[data-panoptes-stockchart="true"]').forEach(el => {
                this.init(el);
            });
        }
    };

    class PanoptesStockChartInstance {
        constructor(container) {
            this.container = container;
            this.id = container.id;
            this.symbol = container.getAttribute('data-symbol') || 'BIST';
            this.currency = container.getAttribute('data-currency') || '₺';
            this.showVolume = container.getAttribute('data-show-volume') !== 'false';
            this.onPointHover = container.getAttribute('data-on-point-hover');

            const dataScript = container.querySelector('.panoptes-stock-data');
            this.rawData = dataScript ? JSON.parse(dataScript.textContent || '[]') : [];

            this.canvas = container.querySelector('.panoptes-stock-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.tooltip = container.querySelector('.panoptes-stock-tooltip');

            this.activeRange = 'all'; // 7, 30, 90, 180, 365, all
            this.hoveredIndex = -1;

            this.initEvents();
            this.resizeCanvas();
            this.render();

            window.addEventListener('resize', () => {
                this.resizeCanvas();
                this.render();
            });
        }

        initEvents() {
            // Range buttons
            const rangeButtons = this.container.querySelectorAll('.panoptes-stock-ranges button');
            rangeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    rangeButtons.forEach(b => {
                        b.classList.remove('bg-blue-600', 'text-white');
                        b.classList.add('bg-white', 'text-slate-700');
                    });
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-white', 'text-slate-700');

                    this.setRange(btn.getAttribute('data-range'));
                });
            });

            // Canvas mouse hover & crosshair
            if (this.canvas) {
                this.canvas.addEventListener('mousemove', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.handleMouseMove(x, y);
                });

                this.canvas.addEventListener('mouseleave', () => {
                    this.hoveredIndex = -1;
                    if (this.tooltip) this.tooltip.classList.add('hidden');
                    this.render();
                });
            }
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width * dpr;
            this.canvas.height = (parseInt(this.canvas.style.height || '420', 10)) * dpr;
            this.ctx.scale(dpr, dpr);
            this.width = rect.width;
            this.height = parseInt(this.canvas.style.height || '420', 10);
        }

        getVisibleData() {
            if (this.activeRange === 'all') return this.rawData;
            const days = parseInt(this.activeRange, 10);
            if (isNaN(days) || days <= 0) return this.rawData;
            return this.rawData.slice(-days);
        }

        setRange(range) {
            this.activeRange = range;
            this.render();
        }

        handleMouseMove(x, y) {
            const data = this.getVisibleData();
            if (!data || data.length === 0) return;

            const rightMargin = 70;
            const chartWidth = this.width - rightMargin - 20;
            const barWidth = chartWidth / data.length;

            const index = Math.floor((x - 10) / barWidth);
            if (index >= 0 && index < data.length) {
                this.hoveredIndex = index;
                const point = data[index];

                if (this.tooltip) {
                    this.tooltip.classList.remove('hidden');
                    this.tooltip.querySelector('.panoptes-stock-tip-date').textContent = point.Date;
                    this.tooltip.querySelector('.panoptes-stock-tip-open').textContent = point.Open.toFixed(2) + ' ' + this.currency;
                    this.tooltip.querySelector('.panoptes-stock-tip-high').textContent = point.High.toFixed(2) + ' ' + this.currency;
                    this.tooltip.querySelector('.panoptes-stock-tip-low').textContent = point.Low.toFixed(2) + ' ' + this.currency;
                    this.tooltip.querySelector('.panoptes-stock-tip-close').textContent = point.Close.toFixed(2) + ' ' + this.currency;
                    this.tooltip.querySelector('.panoptes-stock-tip-volume').textContent = point.Volume ? point.Volume.toLocaleString('tr-TR') : '-';
                }

                if (this.onPointHover && typeof window[this.onPointHover] === 'function') {
                    window[this.onPointHover](point);
                }
            } else {
                this.hoveredIndex = -1;
                if (this.tooltip) this.tooltip.classList.add('hidden');
            }

            this.render();
        }

        render() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            // Clear background
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.fillRect(0, 0, w, h);

            const data = this.getVisibleData();
            if (!data || data.length === 0) {
                ctx.fillStyle = '#64748b';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Görüntülenecek veri bulunamadı.', w / 2, h / 2);
                return;
            }

            const rightMargin = 70;
            const bottomMargin = 25;
            const leftMargin = 15;
            const topMargin = 20;

            const chartWidth = w - rightMargin - leftMargin;
            const candleAreaHeight = this.showVolume ? (h - bottomMargin - topMargin) * 0.72 : (h - bottomMargin - topMargin);
            const volumeAreaHeight = this.showVolume ? (h - bottomMargin - topMargin) * 0.22 : 0;
            const volumeTop = topMargin + candleAreaHeight + 15;

            // Min and Max Prices
            let minPrice = Infinity;
            let maxPrice = -Infinity;
            let maxVolume = 0;

            data.forEach(d => {
                if (d.Low < minPrice) minPrice = d.Low;
                if (d.High > maxPrice) maxPrice = d.High;
                if (d.Volume > maxVolume) maxVolume = d.Volume;
            });

            const pricePadding = (maxPrice - minPrice) * 0.05 || 1;
            minPrice -= pricePadding;
            maxPrice += pricePadding;
            const priceRange = maxPrice - minPrice;

            // Horizontal Grid Lines & Price Axis
            const gridLines = 5;
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';

            for (let i = 0; i <= gridLines; i++) {
                const ratio = i / gridLines;
                const y = topMargin + ratio * candleAreaHeight;
                const price = maxPrice - ratio * priceRange;

                ctx.beginPath();
                ctx.moveTo(leftMargin, y);
                ctx.lineTo(w - rightMargin, y);
                ctx.stroke();

                ctx.fillText(price.toFixed(2) + ' ' + this.currency, w - rightMargin + 8, y + 3);
            }

            // Draw Candlesticks & Volume
            const barSpacing = chartWidth / data.length;
            const candleWidth = Math.max(1, barSpacing * 0.65);

            data.forEach((d, i) => {
                const x = leftMargin + i * barSpacing + barSpacing / 2;
                const isBullish = d.Close >= d.Open;
                const candleColor = isBullish ? '#10b981' : '#f43f5e';

                // Candlestick Y coordinates
                const highY = topMargin + ((maxPrice - d.High) / priceRange) * candleAreaHeight;
                const lowY = topMargin + ((maxPrice - d.Low) / priceRange) * candleAreaHeight;
                const openY = topMargin + ((maxPrice - d.Open) / priceRange) * candleAreaHeight;
                const closeY = topMargin + ((maxPrice - d.Close) / priceRange) * candleAreaHeight;

                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

                // 1. Wick (Fitil)
                ctx.strokeStyle = candleColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x, highY);
                ctx.lineTo(x, lowY);
                ctx.stroke();

                // 2. Body (Gövde)
                ctx.fillStyle = candleColor;
                ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

                // 3. Volume Bar
                if (this.showVolume && maxVolume > 0) {
                    const volHeight = (d.Volume / maxVolume) * volumeAreaHeight;
                    const volY = volumeTop + volumeAreaHeight - volHeight;
                    ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
                    ctx.fillRect(x - candleWidth / 2, volY, candleWidth, volHeight);
                }
            });

            // Date scale labels
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            const dateStep = Math.ceil(data.length / 6);
            for (let i = 0; i < data.length; i += dateStep) {
                const x = leftMargin + i * barSpacing + barSpacing / 2;
                const d = data[i];
                const dateLabel = d.Date.substring(5); // MM-DD
                ctx.fillText(dateLabel, x, h - 8);
            }

            // Crosshair overlay
            if (this.hoveredIndex >= 0 && this.hoveredIndex < data.length) {
                const hoveredPoint = data[this.hoveredIndex];
                const x = leftMargin + this.hoveredIndex * barSpacing + barSpacing / 2;
                const closeY = topMargin + ((maxPrice - hoveredPoint.Close) / priceRange) * candleAreaHeight;

                ctx.strokeStyle = '#64748b';
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1;

                // Vertical line
                ctx.beginPath();
                ctx.moveTo(x, topMargin);
                ctx.lineTo(x, h - bottomMargin);
                ctx.stroke();

                // Horizontal line
                ctx.beginPath();
                ctx.moveTo(leftMargin, closeY);
                ctx.lineTo(w - rightMargin, closeY);
                ctx.stroke();

                ctx.setLineDash([]); // Reset
            }
        }

        exportPng() {
            if (!this.canvas) return;
            const link = document.createElement('a');
            link.download = `${this.symbol}_StockChart_${new Date().toISOString().substring(0, 10)}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.Panoptes.StockChart.initAll();
    });
})();
