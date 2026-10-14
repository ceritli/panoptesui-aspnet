/**
 * Panoptes UI - PanelBar (Accordion) Vanilla JavaScript Engine
 * Sıfır dış bağımlılık, ultra hafif, AJAX Lazy Loading ve tekli/çoklu akordeon desteği.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    const instances = new Map();

    class PanelBarInstance {
        constructor(element) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) return;

            this.id = this.element.id;
            this.expandMode = this.element.getAttribute('data-expand-mode') || 'multiple'; // single | multiple
            this.animation = this.element.getAttribute('data-animation') || 'fade';
            this.onSelectHandler = this.element.getAttribute('data-on-select');
            this.onExpandHandler = this.element.getAttribute('data-on-expand');
            this.onCollapseHandler = this.element.getAttribute('data-on-collapse');

            this.items = [];
            this.init();
            instances.set(this.id, this);
        }

        init() {
            const itemElements = this.element.querySelectorAll(':scope > .panoptes-panelbar-item');
            itemElements.forEach((itemEl, index) => {
                const headerBtn = itemEl.querySelector(':scope > [data-panel-toggle]');
                const contentDiv = itemEl.querySelector(':scope > [data-panel-content]');
                const chevron = headerBtn ? headerBtn.querySelector('.panoptes-panel-chevron') : null;
                const panelId = itemEl.getAttribute('data-panel-id') || `panel_${index}`;
                const contentUrl = contentDiv ? contentDiv.getAttribute('data-content-url') : null;
                const isExpanded = headerBtn && headerBtn.getAttribute('aria-expanded') === 'true';

                const itemObj = {
                    element: itemEl,
                    header: headerBtn,
                    content: contentDiv,
                    chevron: chevron,
                    id: panelId,
                    index: index,
                    contentUrl: contentUrl,
                    isLoaded: false,
                    isExpanded: isExpanded
                };

                this.items.push(itemObj);

                if (headerBtn) {
                    headerBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (headerBtn.hasAttribute('disabled')) return;
                        this.toggle(index);
                    });
                }

                // Başlangıçta açıksa ve AJAX URL varsa yükle
                if (isExpanded && contentUrl) {
                    this.loadContent(itemObj);
                }
            });
        }

        getItem(indexOrId) {
            if (typeof indexOrId === 'number') {
                return this.items[indexOrId];
            }
            return this.items.find(i => i.id === indexOrId);
        }

        toggle(indexOrId) {
            const item = this.getItem(indexOrId);
            if (!item) return;

            if (item.isExpanded) {
                this.collapse(indexOrId);
            } else {
                this.expand(indexOrId);
            }
        }

        expand(indexOrId) {
            const item = this.getItem(indexOrId);
            if (!item || item.isExpanded || (item.header && item.header.hasAttribute('disabled'))) return;

            // Olay bildirimi (on-select & on-expand)
            let isDefaultPrevented = false;
            const eventPayload = {
                sender: this,
                item: item,
                index: item.index,
                id: item.id,
                title: item.header ? (item.header.querySelector('span')?.textContent || '') : '',
                preventDefault: () => { isDefaultPrevented = true; }
            };

            this.triggerCallback(this.onSelectHandler, eventPayload);
            this.triggerCallback(this.onExpandHandler, eventPayload);

            if (isDefaultPrevented) return;

            // Eğer single (accordion) modundaysa diğer tüm açık panelleri kapat
            if (this.expandMode === 'single') {
                this.items.forEach(other => {
                    if (other !== item && other.isExpanded) {
                        this.collapseItemInternal(other);
                    }
                });
            }

            // Paneli aç
            item.isExpanded = true;
            if (item.header) {
                item.header.setAttribute('aria-expanded', 'true');
            }
            if (item.chevron) {
                item.chevron.classList.add('rotate-180', 'text-blue-600');
            }
            if (item.content) {
                item.content.classList.remove('hidden');
                if (this.animation === 'fade') {
                    item.content.classList.add('animate-fadeIn');
                }
            }

            // AJAX Lazy Loading
            if (item.contentUrl && !item.isLoaded) {
                this.loadContent(item);
            }
        }

        collapse(indexOrId) {
            const item = this.getItem(indexOrId);
            if (!item || !item.isExpanded || (item.header && item.header.hasAttribute('disabled'))) return;

            let isDefaultPrevented = false;
            const eventPayload = {
                sender: this,
                item: item,
                index: item.index,
                id: item.id,
                title: item.header ? (item.header.querySelector('span')?.textContent || '') : '',
                preventDefault: () => { isDefaultPrevented = true; }
            };

            this.triggerCallback(this.onCollapseHandler, eventPayload);
            if (isDefaultPrevented) return;

            this.collapseItemInternal(item);
        }

        collapseItemInternal(item) {
            item.isExpanded = false;
            if (item.header) {
                item.header.setAttribute('aria-expanded', 'false');
            }
            if (item.chevron) {
                item.chevron.classList.remove('rotate-180', 'text-blue-600');
            }
            if (item.content) {
                item.content.classList.add('hidden');
            }
        }

        expandAll() {
            if (this.expandMode === 'single') return; // Tekli modda tümü açılamaz
            this.items.forEach(item => this.expand(item.index));
        }

        collapseAll() {
            this.items.forEach(item => this.collapse(item.index));
        }

        async loadContent(item) {
            if (!item.contentUrl) return;

            const innerContainer = item.content.firstElementChild || item.content;
            innerContainer.innerHTML = `
                <div class="flex items-center justify-center p-6 text-slate-400 gap-2">
                    <span class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span class="text-xs">Sunucudan yükleniyor...</span>
                </div>
            `;

            try {
                const response = await fetch(item.contentUrl, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const html = await response.text();
                innerContainer.innerHTML = html;
                item.isLoaded = true;
            } catch (err) {
                innerContainer.innerHTML = `
                    <div class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                        <span>İçerik yüklenirken bir hata oluştu (${err.message})</span>
                        <button type="button" class="underline font-bold" onclick="Panoptes.PanelBar.get('${this.id}').loadContent(Panoptes.PanelBar.get('${this.id}').getItem(${item.index}))">Tekrar Dene</button>
                    </div>
                `;
            }
        }

        triggerCallback(handlerName, payload) {
            if (!handlerName) return;
            if (typeof window[handlerName] === 'function') {
                try {
                    window[handlerName](payload);
                } catch (err) {
                    console.error('Panoptes PanelBar callback error:', err);
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
            return new PanelBarInstance(el);
        }
        return null;
    }

    // Genel API (Hem Panoptes.PanelBar hem panoptesPanelBar olarak erişilebilir)
    const publicApi = {
        initAll: function () {
            document.querySelectorAll('[data-panoptes-panelbar="true"]').forEach(el => {
                if (!instances.has(el.id)) {
                    new PanelBarInstance(el);
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

    window.Panoptes.PanelBar = publicApi;
    window.panoptesPanelBar = publicApi;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => publicApi.initAll());
    } else {
        publicApi.initAll();
    }

})(window, document);
