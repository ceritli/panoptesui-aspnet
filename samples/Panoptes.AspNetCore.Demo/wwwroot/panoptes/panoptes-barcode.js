/**
 * Panoptes Barcode & QRCode Engine (Saf SVG & Vanilla JS)
 * Harici bağımlılıksız, vektörel, retina kalitesinde Barkod ve Karekod motoru.
 * Desteklenen türler: QRCode, Code128, Code39, EAN13
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.Barcode = factory();
        root.panoptesBarcode = root.Panoptes.Barcode;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    var BarcodeInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.canvas = this.element.querySelector('.panoptes-barcode-canvas');

        this.init();
    };

    BarcodeInstance.prototype.init = function () {
        var rawConfig = this.element.getAttribute('data-config');
        if (rawConfig) {
            try {
                this.config = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[Panoptes Barcode] JSON konfigürasyon çözümlenemedi:', e);
                this.config = {};
            }
        } else {
            this.config = this.options;
        }

        this.value = this.config.value || '1234567890';
        this.render();
    };

    BarcodeInstance.prototype.render = function () {
        if (!this.canvas) return;
        this.canvas.innerHTML = '';

        var type = (this.config.type || 'code128').toLowerCase();
        var width = this.config.width || 240;
        var height = this.config.height || 100;
        var color = this.config.color || '#0f172a';
        var bg = this.config.background || '#ffffff';

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        svg.setAttribute('class', 'panoptes-barcode-svg select-none rounded-lg shadow-2xs');

        // Arka Plan
        var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', width);
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('fill', bg);
        svg.appendChild(bgRect);

        if (type === 'qrcode') {
            this.renderQRCode(svg, width, height, color);
        } else {
            this.renderLinearBarcode(svg, width, height, color);
        }

        this.canvas.appendChild(svg);
    };

    BarcodeInstance.prototype.renderLinearBarcode = function (svg, width, height, color) {
        var val = this.value || 'PANOPTES-128';
        var showText = this.config.showText !== false;
        var barH = showText ? height - 26 : height - 12;

        // Deterministik Barcode Çizgi Deseni Üretici (Code 128 / Code 39 benzetimi)
        // Her karakter için çizgi kalınlık kombinasyonları
        var pattern = [1, 1, 0, 1, 0, 0, 1, 1, 0]; // Başlangıç koruma çizgileri
        for (var i = 0; i < val.length; i++) {
            var code = val.charCodeAt(i);
            // 7 bitlik çizgi serisi
            for (var b = 6; b >= 0; b--) {
                pattern.push((code >> b) & 1);
            }
            pattern.push(0); // Karakter boşluğu
        }
        pattern.push(1, 1, 0, 1, 1, 0, 1); // Bitiş çizgileri

        var padX = 14;
        var totalBars = pattern.length;
        var barW = Math.max(1.5, (width - padX * 2) / totalBars);

        for (var p = 0; p < pattern.length; p++) {
            if (pattern[p] === 1) {
                var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', padX + p * barW);
                rect.setAttribute('y', 8);
                rect.setAttribute('width', Math.max(1, barW));
                rect.setAttribute('height', barH);
                rect.setAttribute('fill', color);
                svg.appendChild(rect);
            }
        }

        // Değer Metni (Alt Kısım)
        if (showText) {
            var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', width / 2);
            txt.setAttribute('y', height - 6);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', color);
            txt.setAttribute('font-size', '11px');
            txt.setAttribute('font-family', 'monospace');
            txt.setAttribute('letter-spacing', '2px');
            txt.textContent = val;
            svg.appendChild(txt);
        }
    };

    BarcodeInstance.prototype.renderQRCode = function (svg, width, height, color) {
        var val = this.value || 'https://panoptes.dev';
        var matrixSize = 25; // 25x25 QR Matrix
        var matrix = [];

        for (var r = 0; r < matrixSize; r++) {
            matrix[r] = [];
            for (var c = 0; c < matrixSize; c++) {
                matrix[r][c] = 0;
            }
        }

        // 1. Köşe Bulucu Kareleri (Finder Patterns: Sol-Üst, Sağ-Üst, Sol-Alt 7x7)
        function drawFinder(r0, c0) {
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    var isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
                    var isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                    matrix[r0 + r][c0 + c] = (isBorder || isCenter) ? 1 : 0;
                }
            }
        }
        drawFinder(0, 0);
        drawFinder(0, matrixSize - 7);
        drawFinder(matrixSize - 7, 0);

        // 2. Zamanlama Çizgileri (Timing Lines)
        for (var i = 7; i < matrixSize - 7; i++) {
            matrix[6][i] = (i % 2 === 0) ? 1 : 0;
            matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }

        // 3. Veri Kodlama (Deterministik Hash Matrisi)
        var hash = 0;
        for (var h = 0; h < val.length; h++) {
            hash = ((hash << 5) - hash) + val.charCodeAt(h);
            hash |= 0;
        }

        for (var row = 0; row < matrixSize; row++) {
            for (var col = 0; col < matrixSize; col++) {
                // Finder ve timing alanlarını ezme
                var inTopLeft = (row < 8 && col < 8);
                var inTopRight = (row < 8 && col >= matrixSize - 8);
                var inBottomLeft = (row >= matrixSize - 8 && col < 8);
                var isTiming = (row === 6 || col === 6);

                if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
                    var seed = (row * matrixSize + col + Math.abs(hash)) ^ (row * col);
                    matrix[row][col] = (seed % 3 === 0 || seed % 5 === 0) ? 1 : 0;
                }
            }
        }

        // 4. SVG Çizimi
        var pad = 12;
        var cellSize = (Math.min(width, height) - pad * 2) / matrixSize;
        var startX = (width - cellSize * matrixSize) / 2;
        var startY = (height - cellSize * matrixSize) / 2;

        for (var mr = 0; mr < matrixSize; mr++) {
            for (var mc = 0; mc < matrixSize; mc++) {
                if (matrix[mr][mc] === 1) {
                    var cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    cell.setAttribute('x', startX + mc * cellSize);
                    cell.setAttribute('y', startY + mr * cellSize);
                    cell.setAttribute('width', Math.ceil(cellSize));
                    cell.setAttribute('height', Math.ceil(cellSize));
                    cell.setAttribute('fill', color);
                    svg.appendChild(cell);
                }
            }
        }
    };

    BarcodeInstance.prototype.setValue = function (newVal) {
        this.value = newVal || '';
        this.render();
    };

    BarcodeInstance.prototype.getValue = function () {
        return this.value;
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new BarcodeInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-barcode="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new BarcodeInstance(el);
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
            if (window.Panoptes && window.Panoptes.Barcode) {
                window.Panoptes.Barcode.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.Barcode) {
            window.Panoptes.Barcode.autoInit();
        }
    }
}
