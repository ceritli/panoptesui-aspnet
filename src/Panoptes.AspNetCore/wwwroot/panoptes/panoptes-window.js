/**
 * Panoptes Window (Sürüklenebilir & Boyutlandırılabilir Masaüstü Pencere Motoru)
 * Panoptes UI Window bileşeni, modern, modal/non-modal, draggable, resizable, minimize/maximize motoru.
 */

(function (window, document) {
    'use strict';

    class PanoptesWindow {
        constructor(element) {
            if (typeof element === 'string') {
                this.element = document.getElementById(element);
            } else {
                this.element = element;
            }

            if (!this.element) return;
            if (this.element._panoptesWindow) return this.element._panoptesWindow;

            this.id = this.element.id;
            this.title = this.element.getAttribute('data-title') || 'Pencere';
            this.defaultWidth = this.element.getAttribute('data-width') || '540px';
            this.defaultHeight = this.element.getAttribute('data-height') || '360px';
            this.isModal = this.element.getAttribute('data-modal') !== 'false';
            this.isDraggable = this.element.getAttribute('data-draggable') !== 'false';
            this.isResizable = this.element.getAttribute('data-resizable') !== 'false';
            this.isClosable = this.element.getAttribute('data-closable') !== 'false';
            this.isMaximizable = this.element.getAttribute('data-maximizable') !== 'false';
            this.isMinimizable = this.element.getAttribute('data-minimizable') !== 'false';
            this.initiallyVisible = this.element.getAttribute('data-visible') === 'true';

            this.isOpen = false;
            this.isMaximized = false;
            this.isMinimized = false;

            this.buildWindow();
            this.element._panoptesWindow = this;

            if (this.initiallyVisible) {
                this.open();
            }
        }

        buildWindow() {
            // Ham içeriği al
            this.contentHtml = this.element.innerHTML;

            // Kapsayıcı Window DOM
            this.winElement = document.createElement('div');
            this.winElement.className = 'panoptes-window-instance fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 transform scale-95 opacity-0 select-none';
            this.winElement.style.width = this.defaultWidth;
            this.winElement.style.height = this.defaultHeight;
            this.winElement.style.display = 'none';

            // Başlık Çubuğu
            const header = document.createElement('div');
            header.className = `panoptes-win-header bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between select-none ${this.isDraggable ? 'cursor-move' : ''}`;

            const titleWrap = document.createElement('div');
            titleWrap.className = 'flex items-center gap-2 text-xs font-bold text-slate-800';
            titleWrap.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span><span>${this.title}</span>`;

            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'flex items-center gap-1 -mr-1';

            if (this.isMinimizable) {
                const minBtn = document.createElement('button');
                minBtn.type = 'button';
                minBtn.className = 'text-slate-400 hover:text-slate-600 p-1 rounded-lg transition';
                minBtn.title = 'Küçült / Büyüt';
                minBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`;
                minBtn.addEventListener('click', () => this.toggleMinimize());
                actionsWrap.appendChild(minBtn);
            }

            if (this.isMaximizable) {
                const maxBtn = document.createElement('button');
                maxBtn.type = 'button';
                maxBtn.className = 'text-slate-400 hover:text-slate-600 p-1 rounded-lg transition';
                maxBtn.title = 'Tam Ekran';
                maxBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>`;
                maxBtn.addEventListener('click', () => this.toggleMaximize());
                actionsWrap.appendChild(maxBtn);
                this.maxBtn = maxBtn;
            }

            if (this.isClosable) {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'text-slate-400 hover:text-rose-600 p-1 rounded-lg transition ml-1';
                closeBtn.title = 'Kapat';
                closeBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
                closeBtn.addEventListener('click', () => this.close());
                actionsWrap.appendChild(closeBtn);
            }

            header.appendChild(titleWrap);
            header.appendChild(actionsWrap);
            this.winElement.appendChild(header);

            // Gövde (Content)
            const body = document.createElement('div');
            body.className = 'panoptes-win-body flex-1 overflow-auto p-5 text-xs text-slate-600';
            body.innerHTML = this.contentHtml;
            this.winElement.appendChild(body);
            this.bodyElement = body;

            // Boyutlandırma kulakçığı (Resizer)
            if (this.isResizable) {
                const resizer = document.createElement('div');
                resizer.className = 'panoptes-win-resizer absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-slate-300 hover:text-blue-500';
                resizer.innerHTML = `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M22 22h-4v-4h4v4zm0-6h-4v-4h4v4zm-6 6h-4v-4h4v4zm-6 0H6v-4h4v4zm12-12h-4V6h4v4z"/></svg>`;
                this.winElement.appendChild(resizer);
                this.bindResize(resizer);
            }

            // Draggable Bağlama
            if (this.isDraggable) {
                this.bindDrag(header);
            }

            // Modal Backdrop
            if (this.isModal) {
                this.backdrop = document.createElement('div');
                this.backdrop.className = 'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs transition-opacity duration-200 opacity-0';
                this.backdrop.style.display = 'none';
                document.body.appendChild(this.backdrop);
            }

            document.body.appendChild(this.winElement);
        }

        bindDrag(handle) {
            let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
            let isDragging = false;

            handle.addEventListener('mousedown', (e) => {
                if (this.isMaximized || e.target.closest('button')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                const rect = this.winElement.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;

                // Mutlak left/top ata
                this.winElement.style.transform = 'none';
                this.winElement.style.left = `${initialLeft}px`;
                this.winElement.style.top = `${initialTop}px`;
                this.winElement.style.margin = '0';

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;

                    this.winElement.style.left = `${initialLeft + deltaX}px`;
                    this.winElement.style.top = `${initialTop + deltaY}px`;
                };

                const onMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }

        bindResize(handle) {
            let startX = 0, startY = 0, initialWidth = 0, initialHeight = 0;
            let isResizing = false;

            handle.addEventListener('mousedown', (e) => {
                if (this.isMaximized || this.isMinimized) return;
                e.stopPropagation();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;

                initialWidth = this.winElement.offsetWidth;
                initialHeight = this.winElement.offsetHeight;

                const onMouseMove = (moveEvent) => {
                    if (!isResizing) return;
                    const newW = Math.max(260, initialWidth + (moveEvent.clientX - startX));
                    const newH = Math.max(160, initialHeight + (moveEvent.clientY - startY));

                    this.winElement.style.width = `${newW}px`;
                    this.winElement.style.height = `${newH}px`;
                };

                const onMouseUp = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }

        center() {
            const vpW = window.innerWidth;
            const vpH = window.innerHeight;
            const winW = this.winElement.offsetWidth || 500;
            const winH = this.winElement.offsetHeight || 350;

            const left = Math.max(20, (vpW - winW) / 2);
            const top = Math.max(20, (vpH - winH) / 2);

            this.winElement.style.transform = 'none';
            this.winElement.style.left = `${left}px`;
            this.winElement.style.top = `${top}px`;
            this.winElement.style.margin = '0';
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;

            if (this.backdrop) {
                this.backdrop.style.display = 'block';
                requestAnimationFrame(() => this.backdrop.classList.remove('opacity-0'));
            }

            this.winElement.style.display = 'flex';
            this.center();

            requestAnimationFrame(() => {
                this.winElement.classList.remove('scale-95', 'opacity-0');
                this.winElement.classList.add('scale-100', 'opacity-100');
            });
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;

            if (this.backdrop) {
                this.backdrop.classList.add('opacity-0');
                setTimeout(() => { this.backdrop.style.display = 'none'; }, 200);
            }

            this.winElement.classList.remove('scale-100', 'opacity-100');
            this.winElement.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                this.winElement.style.display = 'none';
            }, 200);
        }

        toggleMaximize() {
            if (this.isMinimized) {
                this.toggleMinimize();
            }

            if (!this.isMaximized) {
                // Maximize yap
                this._preMaxState = {
                    left: this.winElement.style.left,
                    top: this.winElement.style.top,
                    width: this.winElement.style.width,
                    height: this.winElement.style.height
                };

                this.winElement.style.left = '10px';
                this.winElement.style.top = '10px';
                this.winElement.style.width = 'calc(100vw - 20px)';
                this.winElement.style.height = 'calc(100vh - 20px)';
                this.isMaximized = true;
            } else {
                // Geri yükle (Restore)
                if (this._preMaxState) {
                    this.winElement.style.left = this._preMaxState.left;
                    this.winElement.style.top = this._preMaxState.top;
                    this.winElement.style.width = this._preMaxState.width;
                    this.winElement.style.height = this._preMaxState.height;
                }
                this.isMaximized = false;
            }
        }

        toggleMinimize() {
            if (!this.isMinimized) {
                this._preMinHeight = this.winElement.style.height;
                this.bodyElement.style.display = 'none';
                this.winElement.style.height = 'auto';
                this.isMinimized = true;
            } else {
                this.bodyElement.style.display = 'block';
                this.winElement.style.height = this._preMinHeight || this.defaultHeight;
                this.isMinimized = false;
            }
        }
    }

    function initWindows() {
        document.querySelectorAll('[data-panoptes-window="true"]').forEach(el => {
            new PanoptesWindow(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWindows);
    } else {
        initWindows();
    }

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Window = {
        init: initWindows,
        getInstance: (id) => {
            const el = typeof id === 'string' ? document.getElementById(id) : id;
            return el ? el._panoptesWindow || new PanoptesWindow(el) : null;
        },
        open: (id) => {
            const win = window.Panoptes.Window.getInstance(id);
            if (win) win.open();
        },
        close: (id) => {
            const win = window.Panoptes.Window.getInstance(id);
            if (win) win.close();
        }
    };

    window.panoptesWindow = window.Panoptes.Window;

})(window, document);
