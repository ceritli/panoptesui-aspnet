/**
 * Panoptes UI - Stepper & Wizard Vanilla JavaScript Engine
 * Sıfır dış bağımlılık, ultra hafif, doğrusal/serbest sihirbaz akışı ve buton kontrolleri.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    const instances = new Map();

    class StepperInstance {
        constructor(element) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) return;

            this.id = this.element.id;
            this.linear = this.element.getAttribute('data-linear') !== 'false';
            this.onSelectHandler = this.element.getAttribute('data-on-select');
            this.onChangeHandler = this.element.getAttribute('data-on-change');

            this.navItems = Array.from(this.element.querySelectorAll(':scope > .panoptes-stepper-nav > .panoptes-step-nav-item'));
            this.panes = Array.from(this.element.querySelectorAll(':scope > .panoptes-stepper-contents > .panoptes-step-pane'));
            this.prevBtn = this.element.querySelector('[data-stepper-prev]');
            this.nextBtn = this.element.querySelector('[data-stepper-next]');

            this.currentIndex = 0;
            this.init();
            instances.set(this.id, this);
        }

        init() {
            // Aktif adımı bul
            const initialActive = this.panes.findIndex(p => !p.classList.contains('hidden'));
            this.currentIndex = initialActive >= 0 ? initialActive : 0;

            // Nav item tıklamaları
            this.navItems.forEach((item, index) => {
                const btn = item.querySelector('[data-step-trigger]');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (this.linear && index > this.currentIndex + 1) {
                            // Doğrusal modda adımları atlayamaz
                            return;
                        }
                        this.goTo(index);
                    });
                }
            });

            // Geri butonu
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.prev();
                });
            }

            // İleri butonu
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.next();
                });
            }

            this.updateUI();
        }

        goTo(targetIndex) {
            if (targetIndex < 0 || targetIndex >= this.panes.length || targetIndex === this.currentIndex) return;

            const prevIndex = this.currentIndex;
            this.currentIndex = targetIndex;

            this.updateUI();

            this.triggerCallback(this.onSelectHandler, { index: targetIndex, prevIndex: prevIndex, stepper: this });
            this.triggerCallback(this.onChangeHandler, { index: targetIndex, prevIndex: prevIndex, stepper: this });
        }

        next() {
            if (this.currentIndex < this.panes.length - 1) {
                // Mevcut adımı tamamlandı olarak işaretle
                this.markCompleted(this.currentIndex);
                this.goTo(this.currentIndex + 1);
            } else if (this.currentIndex === this.panes.length - 1) {
                // Son adım bitirildi
                this.markCompleted(this.currentIndex);
                this.triggerCallback(this.onChangeHandler, { index: this.currentIndex, isFinished: true, stepper: this });
            }
        }

        prev() {
            if (this.currentIndex > 0) {
                this.goTo(this.currentIndex - 1);
            }
        }

        markCompleted(index) {
            if (index < 0 || index >= this.navItems.length) return;
            const navItem = this.navItems[index];
            const circle = navItem.querySelector('.panoptes-step-circle');
            if (circle) {
                circle.classList.remove('bg-white', 'text-slate-500', 'border-slate-300', 'bg-blue-600', 'text-white', 'border-blue-600', 'ring-4', 'ring-blue-100');
                circle.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
                circle.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
            }

            // Ara çizgiyi yeşil yap
            const line = navItem.querySelector('.panoptes-step-line');
            if (line) {
                line.classList.remove('bg-slate-200');
                line.classList.add('bg-emerald-500');
            }
        }

        updateUI() {
            // Panelleri göster/gizle
            this.panes.forEach((pane, idx) => {
                if (idx === this.currentIndex) {
                    pane.classList.remove('hidden');
                } else {
                    pane.classList.add('hidden');
                }
            });

            // Nav halkalarını güncelle
            this.navItems.forEach((item, idx) => {
                const circle = item.querySelector('.panoptes-step-circle');
                const label = item.querySelector('.panoptes-step-label');

                if (idx === this.currentIndex) {
                    if (circle && !circle.classList.contains('bg-emerald-600')) {
                        circle.classList.remove('bg-white', 'text-slate-500', 'border-slate-300');
                        circle.classList.add('bg-blue-600', 'text-white', 'border-blue-600', 'ring-4', 'ring-blue-100');
                    }
                    if (label) {
                        label.classList.remove('text-slate-500');
                        label.classList.add('text-blue-700');
                    }
                } else if (idx < this.currentIndex) {
                    // Geçilmiş adım
                    if (label) {
                        label.classList.remove('text-blue-700', 'text-slate-500');
                        label.classList.add('text-slate-800');
                    }
                } else {
                    // İleriki adım
                    if (circle && !circle.classList.contains('bg-emerald-600')) {
                        circle.classList.remove('bg-blue-600', 'text-white', 'border-blue-600', 'ring-4', 'ring-blue-100');
                        circle.classList.add('bg-white', 'text-slate-500', 'border-slate-300');
                    }
                    if (label) {
                        label.classList.remove('text-blue-700', 'text-slate-800');
                        label.classList.add('text-slate-500');
                    }
                }
            });

            // Buton durumları
            if (this.prevBtn) {
                this.prevBtn.disabled = (this.currentIndex === 0);
            }
            if (this.nextBtn) {
                if (this.currentIndex === this.panes.length - 1) {
                    this.nextBtn.textContent = '✓ Tamamla (Bitir)';
                    this.nextBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    this.nextBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
                } else {
                    this.nextBtn.textContent = 'İleri →';
                    this.nextBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                    this.nextBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                }
            }
        }

        triggerCallback(handlerName, payload) {
            if (!handlerName) return;
            if (typeof window[handlerName] === 'function') {
                try {
                    window[handlerName](payload);
                } catch (err) {
                    console.error('Panoptes Stepper callback error:', err);
                }
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
            return new StepperInstance(el);
        }
        return null;
    }

    const publicApi = {
        initAll: function () {
            document.querySelectorAll('[data-panoptes-stepper="true"]').forEach(el => {
                if (!instances.has(el.id)) {
                    new StepperInstance(el);
                }
            });
        },
        get: function (id) {
            return getOrCreateInstance(id);
        },
        getInstance: function (id) {
            return getOrCreateInstance(id);
        }
    };

    window.Panoptes.Stepper = publicApi;
    window.panoptesStepper = publicApi;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => publicApi.initAll());
    } else {
        publicApi.initAll();
    }

})(window, document);
