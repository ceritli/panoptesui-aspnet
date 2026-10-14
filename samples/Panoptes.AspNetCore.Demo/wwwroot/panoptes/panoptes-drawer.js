/**
 * Panoptes UI - Drawer (Yan Çekmece) Vanilla JavaScript Engine
 * Sıfır dış bağımlılık, ultra hafif, overlay/push ve ESC/backdrop kapama desteği.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    const instances = new Map();

    class DrawerInstance {
        constructor(element) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) return;

            this.id = this.element.id;
            this.position = this.element.getAttribute('data-position') || 'left';
            this.mode = this.element.getAttribute('data-mode') || 'overlay';
            this.closeOnBackdrop = this.element.getAttribute('data-close-backdrop') !== 'false';
            this.isExpanded = this.element.getAttribute('data-expanded') === 'true';

            this.backdrop = this.element.querySelector('[data-drawer-backdrop]');
            this.panel = this.element.querySelector('[data-drawer-panel]');
            this.closeBtn = this.element.querySelector('[data-drawer-close]');

            this.init();
            instances.set(this.id, this);
        }

        init() {
            // Backdrop tıklandığında kapat
            if (this.backdrop && this.closeOnBackdrop) {
                this.backdrop.addEventListener('click', () => this.close());
            }

            // Kapat butonuna tıklandığında kapat
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // ESC tuşu dinleyicisi
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isExpanded) {
                    this.close();
                }
            });
        }

        open() {
            if (this.isExpanded) return;
            this.isExpanded = true;
            this.element.setAttribute('data-expanded', 'true');

            // Kök kapsayıcıyı görünür yap
            this.element.classList.remove('opacity-0', 'pointer-events-none');
            this.element.classList.add('opacity-100');

            // Backdrop
            if (this.backdrop) {
                this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
                this.backdrop.classList.add('opacity-100', 'pointer-events-auto');
            }

            // Panel kayma animasyonu
            if (this.panel) {
                if (this.position === 'right') {
                    this.panel.classList.remove('translate-x-full');
                    this.panel.classList.add('translate-x-0');
                } else {
                    this.panel.classList.remove('-translate-x-full');
                    this.panel.classList.add('translate-x-0');
                }
            }

            // Gövde scroll kilitleme
            document.body.classList.add('overflow-hidden');
        }

        close() {
            if (!this.isExpanded) return;
            this.isExpanded = false;
            this.element.setAttribute('data-expanded', 'false');

            // Panel kayma animasyonu
            if (this.panel) {
                if (this.position === 'right') {
                    this.panel.classList.remove('translate-x-0');
                    this.panel.classList.add('translate-x-full');
                } else {
                    this.panel.classList.remove('translate-x-0');
                    this.panel.classList.add('-translate-x-full');
                }
            }

            // Backdrop
            if (this.backdrop) {
                this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
                this.backdrop.classList.add('opacity-0', 'pointer-events-none');
            }

            // Animasyon bittiğinde kök kapsayıcıyı gizle
            setTimeout(() => {
                if (!this.isExpanded) {
                    this.element.classList.remove('opacity-100');
                    this.element.classList.add('opacity-0', 'pointer-events-none');
                    document.body.classList.remove('overflow-hidden');
                }
            }, 300);
        }

        toggle() {
            if (this.isExpanded) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    function getOrCreateInstance(id) {
        if (!id) return null;
        if (instances.has(id)) {
            return instances.get(id);
        }
        const el = document.getElementById(id);
        if (el) {
            return new DrawerInstance(el);
        }
        return null;
    }

    const publicApi = {
        initAll: function () {
            document.querySelectorAll('[data-panoptes-drawer="true"]').forEach(el => {
                if (!instances.has(el.id)) {
                    new DrawerInstance(el);
                }
            });

            // data-drawer-toggle="drawerId" olan tüm butonları otomatik dinle
            document.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
                if (!btn._drawerBound) {
                    btn._drawerBound = true;
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetId = btn.getAttribute('data-drawer-toggle');
                        const drawer = publicApi.getInstance(targetId);
                        if (drawer) drawer.toggle();
                    });
                }
            });
        },
        get: function (id) {
            return getOrCreateInstance(id);
        },
        getInstance: function (id) {
            return getOrCreateInstance(id);
        },
        open: function (id) {
            const d = getOrCreateInstance(id);
            if (d) d.open();
        },
        close: function (id) {
            const d = getOrCreateInstance(id);
            if (d) d.close();
        },
        toggle: function (id) {
            const d = getOrCreateInstance(id);
            if (d) d.toggle();
        }
    };

    window.Panoptes.Drawer = publicApi;
    window.panoptesDrawer = publicApi;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => publicApi.initAll());
    } else {
        publicApi.initAll();
    }

})(window, document);
