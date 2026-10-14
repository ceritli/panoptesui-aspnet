/**
 * Panoptes ToolBar Engine (Vanilla JS & Tailwind)
 * Responsive araç çubuğu, arama debounce, buton grup yönetimi ve dinamik API.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.ToolBar = factory();
        root.panoptesToolbar = root.Panoptes.ToolBar;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    function ToolBarInstance(element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.searchInput = this.element.querySelector('input[type="search"]');

        this.init();
    }

    ToolBarInstance.prototype.init = function () {
        var self = this;

        // Dahili arama alanı dinleyicisi
        if (this.searchInput) {
            var debounceTimer = null;
            this.searchInput.addEventListener('input', function (e) {
                var query = e.target.value.trim();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function () {
                    var evt = new CustomEvent('panoptes:toolbar:search', {
                        bubbles: true,
                        detail: { toolbarId: self.id, query: query }
                    });
                    self.element.dispatchEvent(evt);

                    if (typeof self.options.onSearch === 'function') {
                        self.options.onSearch(query);
                    }
                }, 250);
            });
        }

        // Buton tıklamaları
        var buttons = this.element.querySelectorAll('button');
        buttons.forEach(function (btn, index) {
            btn.addEventListener('click', function (e) {
                var text = (btn.querySelector('span') ? btn.querySelector('span').textContent : btn.textContent || '').trim();
                var evt = new CustomEvent('panoptes:toolbar:click', {
                    bubbles: true,
                    detail: { toolbarId: self.id, index: index, button: btn, text: text }
                });
                self.element.dispatchEvent(evt);
            });
        });
    };

    ToolBarInstance.prototype.enable = function (target) {
        var btn = typeof target === 'number' 
            ? this.element.querySelectorAll('button')[target]
            : (typeof target === 'string' ? this.element.querySelector(target) : target);

        if (btn) {
            btn.removeAttribute('disabled');
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('cursor-pointer', 'active:scale-95');
        }
    };

    ToolBarInstance.prototype.disable = function (target) {
        var btn = typeof target === 'number' 
            ? this.element.querySelectorAll('button')[target]
            : (typeof target === 'string' ? this.element.querySelector(target) : target);

        if (btn) {
            btn.setAttribute('disabled', 'disabled');
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('cursor-pointer', 'active:scale-95');
        }
    };

    ToolBarInstance.prototype.getSearchValue = function () {
        return this.searchInput ? this.searchInput.value : '';
    };

    ToolBarInstance.prototype.setSearchValue = function (val) {
        if (this.searchInput) {
            this.searchInput.value = val || '';
            this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new ToolBarInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },

        get: function (id) {
            return instances.get(id);
        },

        autoInit: function () {
            document.querySelectorAll('[data-panoptes-toolbar="true"]').forEach(function (el) {
                if (!instances.has(el.id)) {
                    var inst = new ToolBarInstance(el);
                    instances.set(el.id, inst);
                }
            });
        }
    };
}));

// DOM Yüklendiğinde Otomatik Başlatma
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Panoptes && window.Panoptes.ToolBar) {
                window.Panoptes.ToolBar.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.ToolBar) {
            window.Panoptes.ToolBar.autoInit();
        }
    }
}
