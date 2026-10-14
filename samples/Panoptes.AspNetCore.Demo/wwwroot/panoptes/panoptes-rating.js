/**
 * Panoptes Rating Component JavaScript Engine
 * Modern, hafif ve interaktif yıldız/kalp puanlama motoru
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.Rating = factory();
        root.panoptesRating = root.Panoptes.Rating;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    var STAR_SVG = '<svg class="w-6 h-6 transition-all duration-150 transform hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    var HEART_SVG = '<svg class="w-6 h-6 transition-all duration-150 transform hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    var RatingInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.itemsContainer = this.element.querySelector('.panoptes-rating-items');
        this.labelEl = this.element.querySelector('.panoptes-rating-label');
        this.inputEl = this.element.querySelector('input[type="hidden"]');

        this.init();
    };

    RatingInstance.prototype.init = function () {
        var rawConfig = this.element.getAttribute('data-config');
        if (rawConfig) {
            try {
                this.config = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[Panoptes Rating] JSON konfigürasyon çözümlenemedi:', e);
                this.config = {};
            }
        } else {
            this.config = this.options;
        }

        this.value = Number(this.config.value || 0);
        this.max = Number(this.config.max || 5);
        this.precision = Number(this.config.precision || 1);
        this.isReadonly = !!this.config.isReadonly;
        this.disabled = !!this.config.disabled;
        this.iconType = (this.config.icon || 'star').toLowerCase();

        this.render();
        this.bindEvents();
    };

    RatingInstance.prototype.render = function () {
        if (!this.itemsContainer) return;
        this.itemsContainer.innerHTML = '';

        var self = this;
        var iconHtml = this.iconType === 'heart' ? HEART_SVG : STAR_SVG;
        var activeColor = this.iconType === 'heart' ? 'text-rose-500' : 'text-amber-400';
        var inactiveColor = 'text-slate-200';

        for (var i = 1; i <= this.max; i++) {
            var item = document.createElement('div');
            item.className = 'panoptes-rating-item relative cursor-pointer select-none';
            if (this.isReadonly || this.disabled) {
                item.className = 'panoptes-rating-item relative select-none cursor-default';
            }
            item.setAttribute('data-index', i);

            // Doluluk oranı
            var fillPct = 0;
            if (this.value >= i) {
                fillPct = 100;
            } else if (this.value > i - 1) {
                fillPct = (this.value - (i - 1)) * 100;
            }

            // Arka plan boş ikon
            var bgIcon = document.createElement('div');
            bgIcon.className = inactiveColor;
            bgIcon.innerHTML = iconHtml;
            item.appendChild(bgIcon);

            // Ön plan dolu ikon (kırpılmış / overflow hidden)
            if (fillPct > 0) {
                var fgIcon = document.createElement('div');
                fgIcon.className = 'absolute inset-0 overflow-hidden ' + activeColor;
                fgIcon.style.width = fillPct + '%';
                fgIcon.innerHTML = iconHtml;
                item.appendChild(fgIcon);
            }

            this.itemsContainer.appendChild(item);
        }

        // Etiket güncelle
        if (this.labelEl) {
            this.labelEl.textContent = this.value + ' / ' + this.max;
        }

        // Input güncelle
        if (this.inputEl) {
            this.inputEl.value = this.value;
        }
    };

    RatingInstance.prototype.bindEvents = function () {
        if (this.isReadonly || this.disabled) return;

        var self = this;
        var items = this.itemsContainer.querySelectorAll('.panoptes-rating-item');

        items.forEach(function (item) {
            var index = Number(item.getAttribute('data-index'));

            // Tıklama
            item.addEventListener('click', function (e) {
                var rect = item.getBoundingClientRect();
                var clickX = e.clientX - rect.left;
                var isHalf = (self.precision === 0.5) && (clickX < rect.width / 2);

                var newVal = isHalf ? index - 0.5 : index;
                self.setValue(newVal);
            });

            // Hover önizleme
            item.addEventListener('mousemove', function (e) {
                var rect = item.getBoundingClientRect();
                var clickX = e.clientX - rect.left;
                var isHalf = (self.precision === 0.5) && (clickX < rect.width / 2);
                var hoverVal = isHalf ? index - 0.5 : index;
                self.highlight(hoverVal);
            });
        });

        this.itemsContainer.addEventListener('mouseleave', function () {
            self.render();
        });
    };

    RatingInstance.prototype.highlight = function (tempVal) {
        var items = this.itemsContainer.querySelectorAll('.panoptes-rating-item');
        var iconHtml = this.iconType === 'heart' ? HEART_SVG : STAR_SVG;
        var activeColor = this.iconType === 'heart' ? 'text-rose-500' : 'text-amber-400';
        var inactiveColor = 'text-slate-200';

        items.forEach(function (item, idx) {
            var i = idx + 1;
            item.innerHTML = '';

            var fillPct = 0;
            if (tempVal >= i) {
                fillPct = 100;
            } else if (tempVal > i - 1) {
                fillPct = (tempVal - (i - 1)) * 100;
            }

            var bgIcon = document.createElement('div');
            bgIcon.className = inactiveColor;
            bgIcon.innerHTML = iconHtml;
            item.appendChild(bgIcon);

            if (fillPct > 0) {
                var fgIcon = document.createElement('div');
                fgIcon.className = 'absolute inset-0 overflow-hidden ' + activeColor;
                fgIcon.style.width = fillPct + '%';
                fgIcon.innerHTML = iconHtml;
                item.appendChild(fgIcon);
            }
        });

        if (this.labelEl) {
            this.labelEl.textContent = tempVal + ' / ' + this.max;
        }
    };

    RatingInstance.prototype.setValue = function (newVal) {
        this.value = Math.min(this.max, Math.max(0, Number(newVal)));
        this.render();

        // CustomEvent tetikle
        var event = new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true
        });
        this.element.dispatchEvent(event);

        var cb = this.config.onChange;
        if (cb) {
            if (typeof window[cb] === 'function') {
                window[cb](this.value);
            } else if (typeof cb === 'function') {
                cb(this.value);
            }
        }
    };

    RatingInstance.prototype.getValue = function () {
        return this.value;
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new RatingInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-rating="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new RatingInstance(el);
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
            if (window.Panoptes && window.Panoptes.Rating) {
                window.Panoptes.Rating.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.Rating) {
            window.Panoptes.Rating.autoInit();
        }
    }
}
