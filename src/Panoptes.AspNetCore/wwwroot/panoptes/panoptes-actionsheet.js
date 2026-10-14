/**
 * Panoptes ActionSheet Component
 * Panoptes ASP.NET Core ActionSheet bileşeni modern mobil/masaüstü alttan açılan eylem sayfası (bottom-sheet dialog).
 * Özellikler: Slayt ve fade animasyonları, eylem butonları (gruplama, temalar, ikonlar), dokunmatik aşağı kaydırma (swipe-to-dismiss),
 * modal arka plan karartması, tam ekran modu, klavye gezintisi ve zengin istemci API.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    function injectStyles() {
        if (document.getElementById('panoptes-actionsheet-styles')) return;
        const style = document.createElement('style');
        style.id = 'panoptes-actionsheet-styles';
        style.textContent = `
            .panoptes-actionsheet-wrapper {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                pointer-events: none;
            }
            .panoptes-actionsheet-wrapper.is-open {
                pointer-events: auto;
            }
            .panoptes-actionsheet-overlay {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                opacity: 0;
                transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: auto;
            }
            .panoptes-actionsheet-wrapper.is-open .panoptes-actionsheet-overlay {
                opacity: 1;
            }
            .panoptes-actionsheet {
                position: relative;
                width: 100%;
                max-width: 480px;
                background: #ffffff;
                border-top-left-radius: 1.5rem;
                border-top-right-radius: 1.5rem;
                box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.15), 0 -8px 10px -6px rgba(0, 0, 0, 0.1);
                border: 1px solid #f1f5f9;
                border-bottom: none;
                z-index: 10;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                pointer-events: auto;
                outline: none;
                will-change: transform, opacity;
            }
            .dark .panoptes-actionsheet {
                background: #1e293b;
                border-color: #334155;
                box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.4);
            }
            /* Fullscreen Mode */
            .panoptes-actionsheet-wrapper[data-fullscreen="true"] .panoptes-actionsheet {
                max-height: 100vh;
                height: 100vh;
                border-radius: 0;
                max-width: 100%;
            }
            /* Slide Animation */
            .panoptes-actionsheet-wrapper[data-animation="slide"] .panoptes-actionsheet {
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .panoptes-actionsheet-wrapper[data-animation="slide"].is-open .panoptes-actionsheet {
                transform: translateY(0);
            }
            /* Fade Animation */
            .panoptes-actionsheet-wrapper[data-animation="fade"] .panoptes-actionsheet {
                opacity: 0;
                transform: scale(0.96);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            .panoptes-actionsheet-wrapper[data-animation="fade"].is-open .panoptes-actionsheet {
                opacity: 1;
                transform: scale(1);
            }
            /* None Animation */
            .panoptes-actionsheet-wrapper[data-animation="none"] .panoptes-actionsheet {
                transform: none;
            }
            /* Item Styling */
            .panoptes-actionsheet-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 0.75rem;
                text-decoration: none;
                transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease;
                outline: none;
                user-select: none;
            }
            .panoptes-actionsheet-item:focus-visible {
                box-shadow: 0 0 0 2px #6366f1;
            }
            .dark .panoptes-actionsheet-item.theme-default {
                color: #e2e8f0;
            }
            .dark .panoptes-actionsheet-item.theme-default:hover {
                background: #334155;
            }
            .dark .panoptes-actionsheet-item.theme-danger {
                color: #f87171;
            }
            .dark .panoptes-actionsheet-item.theme-danger:hover {
                background: #450a0a;
            }
            .dark .panoptes-actionsheet-item.theme-primary {
                color: #818cf8;
            }
            .dark .panoptes-actionsheet-item.theme-primary:hover {
                background: #1e1b4b;
            }
            /* Group Header divider */
            .panoptes-actionsheet-group-header {
                font-size: 0.65rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #94a3b8;
                padding: 0.5rem 1rem 0.25rem 1rem;
            }
            /* RTL Support */
            [dir="rtl"] .panoptes-actionsheet {
                direction: rtl;
                text-align: right;
            }
        `;
        document.head.appendChild(style);
    }

    class ActionSheetInstance {
        constructor(element, options = {}) {
            this.wrapper = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.wrapper) return;

            injectStyles();

            this.id = this.wrapper.id;
            this.sheet = this.wrapper.querySelector('.panoptes-actionsheet');
            this.overlay = this.wrapper.querySelector('.panoptes-actionsheet-overlay');
            this.dragPill = this.wrapper.querySelector('.panoptes-actionsheet-drag-pill-wrapper');
            this.closeBtn = this.wrapper.querySelector('.panoptes-actionsheet-btn-close');

            this.options = Object.assign({
                modal: this.wrapper.getAttribute('data-modal') !== 'false',
                animation: this.wrapper.getAttribute('data-animation') || 'slide',
                fullscreen: this.wrapper.getAttribute('data-fullscreen') === 'true',
                onOpen: this.wrapper.getAttribute('data-on-open') || null,
                onClose: this.wrapper.getAttribute('data-on-close') || null,
                onSelect: this.wrapper.getAttribute('data-on-select') || null
            }, options);

            this.isOpen = false;
            this.touchStartY = 0;
            this.touchCurrentY = 0;

            this.init();
        }

        init() {
            // Overlay click to close
            if (this.overlay && this.options.modal) {
                this.overlay.addEventListener('click', () => this.close());
            }

            // Close button click
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // Touch gesture (Swipe down to dismiss)
            this.bindTouchGestures();

            // Keyboard navigation
            this.bindKeyboardNav();

            // Item click events
            this.bindItemEvents();
        }

        bindTouchGestures() {
            if (!this.sheet) return;

            const handleTouchStart = (e) => {
                this.touchStartY = e.touches[0].clientY;
                this.touchCurrentY = this.touchStartY;
                this.sheet.style.transition = 'none';
            };

            const handleTouchMove = (e) => {
                this.touchCurrentY = e.touches[0].clientY;
                const deltaY = this.touchCurrentY - this.touchStartY;
                if (deltaY > 0) {
                    this.sheet.style.transform = `translateY(${deltaY}px)`;
                }
            };

            const handleTouchEnd = () => {
                const deltaY = this.touchCurrentY - this.touchStartY;
                this.sheet.style.transition = '';
                if (deltaY > 70) {
                    this.close();
                } else {
                    this.sheet.style.transform = '';
                }
            };

            if (this.dragPill) {
                this.dragPill.addEventListener('touchstart', handleTouchStart, { passive: true });
                this.dragPill.addEventListener('touchmove', handleTouchMove, { passive: true });
                this.dragPill.addEventListener('touchend', handleTouchEnd);
            }
        }

        bindKeyboardNav() {
            this.wrapper.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;

                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.close();
                    return;
                }

                const items = Array.from(this.wrapper.querySelectorAll('.panoptes-actionsheet-item:not([aria-disabled="true"])'));
                if (!items.length) return;

                const activeItem = document.activeElement;
                const currentIndex = items.indexOf(activeItem);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIdx = (currentIndex + 1) % items.length;
                    items[nextIdx].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIdx = (currentIndex - 1 + items.length) % items.length;
                    items[prevIdx].focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    if (activeItem && items.includes(activeItem)) {
                        e.preventDefault();
                        activeItem.click();
                    }
                }
            });
        }

        bindItemEvents() {
            const items = this.wrapper.querySelectorAll('.panoptes-actionsheet-item');
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    if (item.getAttribute('aria-disabled') === 'true') {
                        e.preventDefault();
                        return;
                    }

                    const title = item.querySelector('.panoptes-actionsheet-item-title')?.textContent || '';
                    const itemId = item.getAttribute('data-item-id') || item.id;

                    this.triggerEvent('select', {
                        sender: this,
                        item: item,
                        itemId: itemId,
                        text: title
                    });

                    if (this.options.onSelect && typeof window[this.options.onSelect] === 'function') {
                        window[this.options.onSelect]({
                            sender: this,
                            item: item,
                            itemId: itemId,
                            text: title
                        });
                    }

                    // Auto-close on select unless event prevented
                    if (!item.hasAttribute('data-prevent-close')) {
                        this.close();
                    }
                });
            });
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;

            this.wrapper.style.display = 'flex';
            // Force browser reflow
            void this.wrapper.offsetHeight;

            this.wrapper.classList.add('is-open');

            // Focus first item or sheet
            setTimeout(() => {
                const firstItem = this.wrapper.querySelector('.panoptes-actionsheet-item:not([aria-disabled="true"])');
                if (firstItem) {
                    firstItem.focus();
                } else if (this.sheet) {
                    this.sheet.focus();
                }
            }, 100);

            this.triggerEvent('open', { sender: this });
            if (this.options.onOpen && typeof window[this.options.onOpen] === 'function') {
                window[this.options.onOpen]({ sender: this });
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;

            this.wrapper.classList.remove('is-open');

            const animDuration = this.options.animation === 'none' ? 0 : 300;
            setTimeout(() => {
                if (!this.isOpen) {
                    this.wrapper.style.display = 'none';
                    if (this.sheet) this.sheet.style.transform = '';
                }
            }, animDuration);

            this.triggerEvent('close', { sender: this });
            if (this.options.onClose && typeof window[this.options.onClose] === 'function') {
                window[this.options.onClose]({ sender: this });
            }
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        fullscreen(enable) {
            this.options.fullscreen = !!enable;
            this.wrapper.setAttribute('data-fullscreen', this.options.fullscreen.toString());
        }

        enableItem(itemOrId) {
            const item = typeof itemOrId === 'string'
                ? this.wrapper.querySelector(`[data-item-id="${itemOrId}"], #${itemOrId}`)
                : itemOrId;
            if (item) {
                item.removeAttribute('aria-disabled');
                item.setAttribute('tabindex', '0');
                item.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
                item.classList.add('cursor-pointer');
            }
        }

        disableItem(itemOrId) {
            const item = typeof itemOrId === 'string'
                ? this.wrapper.querySelector(`[data-item-id="${itemOrId}"], #${itemOrId}`)
                : itemOrId;
            if (item) {
                item.setAttribute('aria-disabled', 'true');
                item.setAttribute('tabindex', '-1');
                item.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
                item.classList.remove('cursor-pointer');
            }
        }

        triggerEvent(eventName, detail) {
            const customEvent = new CustomEvent(`panoptes:actionsheet:${eventName}`, {
                bubbles: true,
                cancelable: true,
                detail
            });
            this.wrapper.dispatchEvent(customEvent);
        }
    }

    const registry = new Map();

    window.Panoptes.ActionSheet = {
        init: function (element, options) {
            const instance = new ActionSheetInstance(element, options);
            if (instance && instance.id) {
                registry.set(instance.id, instance);
            }
            return instance;
        },
        get: function (id) {
            return registry.get(id) || null;
        },
        open: function (id) {
            const inst = this.get(id);
            if (inst) inst.open();
        },
        close: function (id) {
            const inst = this.get(id);
            if (inst) inst.close();
        },
        toggle: function (id) {
            const inst = this.get(id);
            if (inst) inst.toggle();
        },
        initAll: function () {
            document.querySelectorAll('[data-panoptes-actionsheet="true"]').forEach(el => {
                if (!registry.has(el.id)) {
                    const inst = new ActionSheetInstance(el);
                    if (inst && inst.id) {
                        registry.set(inst.id, inst);
                    }
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.ActionSheet.initAll());
    } else {
        window.Panoptes.ActionSheet.initAll();
    }

})(window, document);
