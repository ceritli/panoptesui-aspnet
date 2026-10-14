/**
 * Panoptes Signature Component
 * Pure HTML5 Canvas & Vector Path smoothing signature pad
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Signature = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-signature="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new SignaturePadComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        clear: function(id) {
            const inst = this.get(id);
            if (inst) inst.clear();
        },

        undo: function(id) {
            const inst = this.get(id);
            if (inst) inst.undo();
        },

        getDataURL: function(id, type) {
            const inst = this.get(id);
            return inst ? inst.getDataURL(type) : null;
        },

        getSVG: function(id) {
            const inst = this.get(id);
            return inst ? inst.getSVG() : null;
        },

        isEmpty: function(id) {
            const inst = this.get(id);
            return inst ? inst.isEmpty() : true;
        }
    };

    class SignaturePadComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.strokeColor = element.dataset.strokeColor || '#0f172a';
            this.strokeWidth = parseFloat(element.dataset.strokeWidth) || 2.5;
            this.bgColor = element.dataset.bgColor || '#ffffff';
            this.readOnly = element.dataset.readonly === 'true';
            this.onChangeCallback = element.dataset.onChange || null;

            this.canvas = element.querySelector('.panoptes-signature-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.input = element.querySelector(`#${this.id}_input`);
            this.placeholder = element.querySelector('.panoptes-signature-placeholder');
            this.btnClear = element.querySelector('.panoptes-sig-clear-btn');
            this.btnUndo = element.querySelector('.panoptes-sig-undo-btn');
            this.statusEl = element.querySelector('.panoptes-sig-status');

            this.paths = [];
            this.currentPath = null;
            this.isDrawing = false;

            this.initCanvasScale();
            this.bindEvents();

            // Load initial value if present
            if (this.input && this.input.value && this.input.value.startsWith('data:image')) {
                this.loadDataURL(this.input.value);
            }
        }

        initCanvasScale() {
            if (!this.canvas) return;
            // Handle HiDPI displays
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Set internal resolution
            this.canvas.width = (rect.width || 600) * dpr;
            this.canvas.height = (rect.height || 220) * dpr;
            this.ctx.scale(dpr, dpr);
            this.displayScale = dpr;
            this.cssWidth = rect.width || 600;
            this.cssHeight = rect.height || 220;

            this.redraw();
        }

        bindEvents() {
            if (!this.canvas || this.readOnly) return;

            // Mouse events
            this.canvas.addEventListener('mousedown', (e) => this.startStroke(e.clientX, e.clientY));
            this.canvas.addEventListener('mousemove', (e) => this.moveStroke(e.clientX, e.clientY));
            window.addEventListener('mouseup', () => this.endStroke());

            // Touch events
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) {
                    e.preventDefault();
                    this.startStroke(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: false });

            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0 && this.isDrawing) {
                    e.preventDefault();
                    this.moveStroke(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: false });

            this.canvas.addEventListener('touchend', (e) => {
                if (this.isDrawing) {
                    e.preventDefault();
                    this.endStroke();
                }
            }, { passive: false });

            // Button controls
            if (this.btnClear) {
                this.btnClear.addEventListener('click', () => this.clear());
            }
            if (this.btnUndo) {
                this.btnUndo.addEventListener('click', () => this.undo());
            }

            // Window resize adjustment
            window.addEventListener('resize', () => {
                this.initCanvasScale();
            });
        }

        getCanvasPos(clientX, clientY) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        startStroke(clientX, clientY) {
            this.isDrawing = true;
            const pt = this.getCanvasPos(clientX, clientY);
            this.currentPath = [pt];

            if (this.placeholder) {
                this.placeholder.classList.add('opacity-0');
            }

            this.ctx.beginPath();
            this.ctx.moveTo(pt.x, pt.y);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.lineWidth = this.strokeWidth;
        }

        moveStroke(clientX, clientY) {
            if (!this.isDrawing || !this.currentPath) return;
            const pt = this.getCanvasPos(clientX, clientY);
            this.currentPath.push(pt);

            this.ctx.lineTo(pt.x, pt.y);
            this.ctx.stroke();
        }

        endStroke() {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            if (this.currentPath && this.currentPath.length > 0) {
                this.paths.push(this.currentPath);
                this.currentPath = null;
                this.updateState();
            }
        }

        redraw() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.lineWidth = this.strokeWidth;

            for (const path of this.paths) {
                if (path.length === 0) continue;
                this.ctx.beginPath();
                this.ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    this.ctx.lineTo(path[i].x, path[i].y);
                }
                this.ctx.stroke();
            }

            if (this.placeholder) {
                if (this.paths.length === 0) {
                    this.placeholder.classList.remove('opacity-0');
                } else {
                    this.placeholder.classList.add('opacity-0');
                }
            }
        }

        clear() {
            this.paths = [];
            this.currentPath = null;
            this.redraw();
            this.updateState();
        }

        undo() {
            if (this.paths.length > 0) {
                this.paths.pop();
                this.redraw();
                this.updateState();
            }
        }

        isEmpty() {
            return this.paths.length === 0;
        }

        getDataURL(type) {
            if (this.isEmpty()) return '';
            return this.canvas.toDataURL(type || 'image/png');
        }

        getSVG() {
            const w = this.cssWidth || 600;
            const h = this.cssHeight || 220;
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
            svg += `<rect width="100%" height="100%" fill="none"/>`;
            
            for (const path of this.paths) {
                if (path.length === 0) continue;
                let d = `M ${path[0].x.toFixed(1)} ${path[0].y.toFixed(1)}`;
                for (let i = 1; i < path.length; i++) {
                    d += ` L ${path[i].x.toFixed(1)} ${path[i].y.toFixed(1)}`;
                }
                svg += `<path d="${d}" fill="none" stroke="${this.strokeColor}" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
            }
            svg += `</svg>`;
            return svg;
        }

        loadDataURL(dataUrl) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, this.cssWidth, this.cssHeight);
                if (this.placeholder) this.placeholder.classList.add('opacity-0');
            };
            img.src = dataUrl;
        }

        updateState() {
            const empty = this.isEmpty();
            const dataUrl = empty ? '' : this.getDataURL('image/png');

            if (this.input) {
                this.input.value = dataUrl;
            }

            if (this.statusEl) {
                if (empty) {
                    this.statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-300"></span><span>İmza bekleniyor</span>`;
                } else {
                    this.statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-emerald-700 font-bold">İmzalandı (${this.paths.length} darbe)</span>`;
                }
            }

            if (this.onChangeCallback && typeof window[this.onChangeCallback] === 'function') {
                window[this.onChangeCallback](dataUrl, this);
            }

            this.container.dispatchEvent(new CustomEvent('panoptes-signature-change', {
                detail: { dataURL: dataUrl, isEmpty: empty, signature: this }
            }));
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.Signature.init());
    } else {
        window.Panoptes.Signature.init();
    }
})();
