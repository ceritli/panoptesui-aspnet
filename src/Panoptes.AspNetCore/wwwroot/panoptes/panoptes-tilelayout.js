/**
 * Panoptes TileLayout Component
 * Panoptes ASP.NET Core TileLayout bileşeni modern, 2 boyutlu CSS Grid tabanlı pano ve dashboard düzenleyici.
 * Özellikler: Sürükle-bırak yeniden sıralama (reorder), 2D yeniden boyutlandırma (resize), dinamik kart ekleme/çıkarma,
 * durum saklama (localStorage/state persistence), klavye gezintisi (A11y/WCAG) ve zengin istemci API.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    // Enjekte edilen stil kuralları
    function injectStyles() {
        if (document.getElementById('panoptes-tilelayout-styles')) return;
        const style = document.createElement('style');
        style.id = 'panoptes-tilelayout-styles';
        style.textContent = `
            .panoptes-tilelayout {
                position: relative;
                box-sizing: border-box;
                width: 100%;
                transition: all 0.2s ease;
            }
            .panoptes-tilelayout-item {
                position: relative;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
                overflow: hidden;
                transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
                outline: none;
            }
            .dark .panoptes-tilelayout-item {
                background: #1e293b;
                border-color: #334155;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
            }
            .panoptes-tilelayout-item:focus-visible {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            }
            .panoptes-tilelayout-item.is-dragging {
                opacity: 0.4;
                transform: scale(0.98);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
            }
            .panoptes-tilelayout-item.is-resizing {
                user-select: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3), 0 10px 25px -5px rgba(99, 102, 241, 0.15);
            }
            .panoptes-tilelayout-item-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-bottom: 1px solid #f1f5f9;
                background: #f8fafc;
                user-select: none;
                flex-shrink: 0;
            }
            .dark .panoptes-tilelayout-item-header {
                background: #0f172a;
                border-color: #334155;
            }
            .panoptes-tilelayout-header-left {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 0;
            }
            .panoptes-tilelayout-drag-handle {
                cursor: grab;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.15rem;
                border-radius: 0.375rem;
                touch-action: none;
            }
            .panoptes-tilelayout-drag-handle:active {
                cursor: grabbing;
            }
            .panoptes-tilelayout-item-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #1e293b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .dark .panoptes-tilelayout-item-title {
                color: #f1f5f9;
            }
            .panoptes-tilelayout-item-actions {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            .panoptes-tilelayout-btn-close {
                background: transparent;
                border: none;
                padding: 0.25rem;
                border-radius: 0.375rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            .panoptes-tilelayout-btn-close:hover {
                background: #fee2e2;
            }
            .dark .panoptes-tilelayout-btn-close:hover {
                background: #450a0a;
            }
            .panoptes-tilelayout-item-body {
                flex: 1 1 auto;
                padding: 1rem;
                overflow: auto;
                position: relative;
            }
            .panoptes-tilelayout-resize-handle {
                position: absolute;
                right: 3px;
                bottom: 3px;
                width: 16px;
                height: 16px;
                cursor: se-resize;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
                touch-action: none;
                opacity: 0.6;
                transition: opacity 0.15s ease, transform 0.15s ease;
            }
            .panoptes-tilelayout-resize-handle:hover,
            .panoptes-tilelayout-item.is-resizing .panoptes-tilelayout-resize-handle {
                opacity: 1;
                transform: scale(1.15);
            }
            /* Dotted drop target indicator */
            .panoptes-tilelayout-placeholder {
                border: 2px dashed #6366f1;
                background: rgba(99, 102, 241, 0.05);
                border-radius: 0.75rem;
                box-sizing: border-box;
                transition: all 0.15s ease;
                pointer-events: none;
            }
            .dark .panoptes-tilelayout-placeholder {
                background: rgba(99, 102, 241, 0.15);
                border-color: #818cf8;
            }
            /* Ghost element during dragging */
            .panoptes-tilelayout-ghost {
                position: fixed;
                pointer-events: none;
                z-index: 9999;
                opacity: 0.85;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                border-radius: 0.75rem;
                transform: scale(1.02) rotate(1deg);
                transition: transform 0.05s ease;
                overflow: hidden;
                border: 2px solid #6366f1;
            }
            /* Live resizing indicator overlay */
            .panoptes-tilelayout-resize-badge {
                position: absolute;
                bottom: 8px;
                right: 24px;
                background: #1e293b;
                color: #ffffff;
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.15rem 0.5rem;
                border-radius: 0.375rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                z-index: 10;
                pointer-events: none;
            }
            /* RTL Support */
            [dir="rtl"] .panoptes-tilelayout-resize-handle {
                right: auto;
                left: 3px;
                cursor: sw-resize;
            }
            [dir="rtl"] .panoptes-tilelayout-resize-badge {
                right: auto;
                left: 24px;
            }
            /* Responsive Grid Breakpoints */
            @media (max-width: 768px) {
                .panoptes-tilelayout.panoptes-responsive {
                    grid-template-columns: 1fr !important;
                }
                .panoptes-tilelayout.panoptes-responsive .panoptes-tilelayout-item {
                    grid-column: span 1 !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    class TileLayoutInstance {
        constructor(element, options = {}) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) return;

            injectStyles();

            this.id = this.element.id;
            this.options = Object.assign({
                columns: parseInt(this.element.getAttribute('data-columns')) || 3,
                columnWidth: this.element.getAttribute('data-column-width') || '1fr',
                rowHeight: this.element.getAttribute('data-row-height') || '180px',
                gap: this.element.getAttribute('data-gap') || '16px',
                reorderable: this.element.getAttribute('data-reorderable') !== 'false',
                resizable: this.element.getAttribute('data-resizable') !== 'false',
                navigatable: this.element.getAttribute('data-navigatable') !== 'false',
                onReorder: this.element.getAttribute('data-on-reorder') || null,
                onResize: this.element.getAttribute('data-on-resize') || null
            }, options);

            this.initialState = [];
            this.activeDrag = null;
            this.activeResize = null;

            this.init();
        }

        init() {
            this.applyGridStyles();
            this.bindItems();
            this.saveInitialState();

            if (this.options.navigatable) {
                this.bindKeyboardNav();
            }

            // Window resize handler for mobile responsiveness
            window.addEventListener('resize', () => this.handleWindowResize());
            this.handleWindowResize();
        }

        applyGridStyles() {
            const colDef = this.options.columnWidth.includes('fr') || this.options.columnWidth.includes('%') || this.options.columnWidth.includes('px')
                ? `repeat(${this.options.columns}, ${this.options.columnWidth})`
                : `repeat(${this.options.columns}, 1fr)`;

            this.element.style.display = 'grid';
            this.element.style.gridTemplateColumns = colDef;
            this.element.style.gridAutoRows = this.options.rowHeight;
            this.element.style.gap = this.options.gap;
        }

        handleWindowResize() {
            if (window.innerWidth <= 768) {
                this.element.classList.add('panoptes-responsive');
            } else {
                this.element.classList.remove('panoptes-responsive');
            }
        }

        getItems() {
            return Array.from(this.element.querySelectorAll(':scope > .panoptes-tilelayout-item'));
        }

        bindItems() {
            const items = this.getItems();
            items.forEach((item, index) => {
                this.bindSingleItem(item, index);
            });
        }

        bindSingleItem(item, index) {
            if (item._panoptesBound) return;
            item._panoptesBound = true;

            if (!item.hasAttribute('tabindex')) {
                item.setAttribute('tabindex', '0');
            }

            // Drag handle / Reordering
            const canReorder = this.options.reorderable && item.getAttribute('data-reorderable') !== 'false';
            const dragHandle = item.querySelector('.panoptes-tilelayout-drag-handle');
            if (dragHandle && canReorder) {
                dragHandle.addEventListener('pointerdown', (e) => this.onDragStart(e, item));
            }

            // Resizing handle
            const canResize = this.options.resizable && item.getAttribute('data-resizable') !== 'false';
            const resizeHandle = item.querySelector('.panoptes-tilelayout-resize-handle');
            if (resizeHandle && canResize) {
                resizeHandle.addEventListener('pointerdown', (e) => this.onResizeStart(e, item));
            }

            // Close button
            const closeBtn = item.querySelector('.panoptes-tilelayout-btn-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeTile(item);
                });
            }
        }

        // ==================== SÜRÜKLE-BIRAK (REORDERING) ====================
        onDragStart(e, item) {
            if (e.button !== 0) return; // Only primary mouse button or touch
            e.preventDefault();
            e.stopPropagation();

            const rect = item.getBoundingClientRect();
            const placeholder = document.createElement('div');
            placeholder.className = 'panoptes-tilelayout-placeholder';
            placeholder.style.gridColumn = item.style.gridColumn || `span ${item.getAttribute('data-col-span') || 1}`;
            placeholder.style.gridRow = item.style.gridRow || `span ${item.getAttribute('data-row-span') || 1}`;
            placeholder.style.minHeight = `${rect.height}px`;

            // Create Ghost element
            const ghost = item.cloneNode(true);
            ghost.className = 'panoptes-tilelayout-ghost';
            ghost.style.width = `${rect.width}px`;
            ghost.style.height = `${rect.height}px`;
            ghost.style.left = `${rect.left}px`;
            ghost.style.top = `${rect.top}px`;
            document.body.appendChild(ghost);

            item.classList.add('is-dragging');
            this.element.insertBefore(placeholder, item);

            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            const initialIndex = this.getItems().indexOf(item);

            this.activeDrag = {
                item,
                ghost,
                placeholder,
                offsetX,
                offsetY,
                initialIndex
            };

            const onPointerMove = (moveEvt) => this.onDragMove(moveEvt);
            const onPointerUp = (upEvt) => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                this.onDragEnd(upEvt);
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        }

        onDragMove(e) {
            if (!this.activeDrag) return;
            const { ghost, placeholder, offsetX, offsetY, item } = this.activeDrag;

            ghost.style.left = `${e.clientX - offsetX}px`;
            ghost.style.top = `${e.clientY - offsetY}px`;

            // Detect target item under pointer
            const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
            const targetItem = elementsUnder.find(el => el.classList && el.classList.contains('panoptes-tilelayout-item') && el !== item && el.parentElement === this.element);

            if (targetItem) {
                const targetRect = targetItem.getBoundingClientRect();
                const isAfter = (e.clientY > targetRect.top + targetRect.height / 2) || (e.clientX > targetRect.left + targetRect.width / 2);

                if (isAfter) {
                    if (targetItem.nextSibling !== placeholder) {
                        this.element.insertBefore(placeholder, targetItem.nextSibling);
                    }
                } else {
                    if (targetItem !== placeholder) {
                        this.element.insertBefore(placeholder, targetItem);
                    }
                }
            }
        }

        onDragEnd(e) {
            if (!this.activeDrag) return;
            const { item, ghost, placeholder, initialIndex } = this.activeDrag;

            if (ghost && ghost.parentElement) {
                ghost.parentElement.removeChild(ghost);
            }

            // Move item to placeholder's new position
            this.element.insertBefore(item, placeholder);
            if (placeholder.parentElement) {
                placeholder.parentElement.removeChild(placeholder);
            }

            item.classList.remove('is-dragging');

            const newIndex = this.getItems().indexOf(item);
            this.activeDrag = null;

            if (initialIndex !== newIndex) {
                this.triggerEvent('reorder', {
                    sender: this,
                    container: item,
                    oldIndex: initialIndex,
                    newIndex: newIndex
                });

                if (this.options.onReorder && typeof window[this.options.onReorder] === 'function') {
                    window[this.options.onReorder]({
                        sender: this,
                        container: item,
                        oldIndex: initialIndex,
                        newIndex: newIndex
                    });
                }
            }
        }

        // ==================== YENİDEN BOYUTLANDIRMA (RESIZING) ====================
        onResizeStart(e, item) {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            const rect = item.getBoundingClientRect();
            const gridRect = this.element.getBoundingClientRect();

            const computedStyle = window.getComputedStyle(this.element);
            const gap = parseFloat(computedStyle.gap) || 16;
            const cols = this.options.columns;
            const cellWidth = (gridRect.width - (gap * (cols - 1))) / cols;
            const cellHeight = parseFloat(this.options.rowHeight) || 180;

            const initialColSpan = parseInt(item.getAttribute('data-col-span')) || 1;
            const initialRowSpan = parseInt(item.getAttribute('data-row-span')) || 1;

            item.classList.add('is-resizing');

            // Badge
            let badge = item.querySelector('.panoptes-tilelayout-resize-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'panoptes-tilelayout-resize-badge';
                item.appendChild(badge);
            }
            badge.textContent = `${initialColSpan} x ${initialRowSpan}`;

            this.activeResize = {
                item,
                badge,
                cellWidth,
                cellHeight,
                gap,
                rect,
                startX: e.clientX,
                startY: e.clientY,
                initialColSpan,
                initialRowSpan,
                currentColSpan: initialColSpan,
                currentRowSpan: initialRowSpan
            };

            const onPointerMove = (moveEvt) => this.onResizeMove(moveEvt);
            const onPointerUp = (upEvt) => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                this.onResizeEnd(upEvt);
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        }

        onResizeMove(e) {
            if (!this.activeResize) return;
            const { item, badge, cellWidth, cellHeight, gap, rect, initialColSpan, initialRowSpan } = this.activeResize;

            const isRtl = this.element.getAttribute('dir') === 'rtl';
            const deltaX = isRtl ? (this.activeResize.startX - e.clientX) : (e.clientX - this.activeResize.startX);
            const deltaY = e.clientY - this.activeResize.startY;

            const newWidth = Math.max(cellWidth, rect.width + deltaX);
            const newHeight = Math.max(cellHeight, rect.height + deltaY);

            let newColSpan = Math.round((newWidth + gap) / (cellWidth + gap));
            let newRowSpan = Math.round((newHeight + gap) / (cellHeight + gap));

            newColSpan = Math.max(1, Math.min(this.options.columns, newColSpan));
            newRowSpan = Math.max(1, newRowSpan);

            item.style.gridColumn = `span ${newColSpan}`;
            item.style.gridRow = `span ${newRowSpan}`;
            badge.textContent = `${newColSpan} x ${newRowSpan}`;

            this.activeResize.currentColSpan = newColSpan;
            this.activeResize.currentRowSpan = newRowSpan;
        }

        onResizeEnd(e) {
            if (!this.activeResize) return;
            const { item, badge, initialColSpan, initialRowSpan, currentColSpan, currentRowSpan } = this.activeResize;

            item.classList.remove('is-resizing');
            if (badge && badge.parentElement) {
                badge.parentElement.removeChild(badge);
            }

            item.setAttribute('data-col-span', currentColSpan);
            item.setAttribute('data-row-span', currentRowSpan);
            item.style.gridColumn = `span ${currentColSpan}`;
            item.style.gridRow = `span ${currentRowSpan}`;

            this.activeResize = null;

            if (initialColSpan !== currentColSpan || initialRowSpan !== currentRowSpan) {
                this.triggerEvent('resize', {
                    sender: this,
                    container: item,
                    colSpan: currentColSpan,
                    rowSpan: currentRowSpan,
                    oldColSpan: initialColSpan,
                    oldRowSpan: initialRowSpan
                });

                if (this.options.onResize && typeof window[this.options.onResize] === 'function') {
                    window[this.options.onResize]({
                        sender: this,
                        container: item,
                        colSpan: currentColSpan,
                        rowSpan: currentRowSpan,
                        oldColSpan: initialColSpan,
                        oldRowSpan: initialRowSpan
                    });
                }
            }
        }

        // ==================== DİNAMİK KART EKLE / ÇIKAR ====================
        addTile(options = {}) {
            const id = options.id || `tile_${Date.now()}`;
            const colSpan = options.colSpan || 1;
            const rowSpan = options.rowSpan || 1;
            const headerText = options.headerText || 'Yeni Kart';
            const bodyHtml = options.bodyHtml || '<p class="text-slate-500 text-sm">Yeni kart içeriği</p>';
            const removable = options.removable !== false;
            const reorderable = options.reorderable !== false;
            const resizable = options.resizable !== false;

            const item = document.createElement('div');
            item.id = id;
            item.className = 'panoptes-tilelayout-item k-tilelayout-item';
            item.style.gridColumn = `span ${colSpan}`;
            item.style.gridRow = `span ${rowSpan}`;
            item.setAttribute('data-tile-id', id);
            item.setAttribute('data-col-span', colSpan);
            item.setAttribute('data-row-span', rowSpan);
            item.setAttribute('data-reorderable', reorderable.toString());
            item.setAttribute('data-resizable', resizable.toString());
            item.setAttribute('data-removable', removable.toString());
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'region');
            item.setAttribute('aria-label', headerText);

            const dragHandleHtml = reorderable
                ? `<span class="panoptes-tilelayout-drag-handle" title="Taşı" aria-label="Taşı">
                      <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                        <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                        <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                        <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
                      </svg>
                   </span>`
                : '';

            const removeBtnHtml = removable
                ? `<button type="button" class="panoptes-tilelayout-btn-close" title="Kapat" aria-label="Kapat">
                      <svg class="w-4 h-4 text-slate-400 hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                   </button>`
                : '';

            const resizeHandleHtml = resizable
                ? `<span class="panoptes-tilelayout-resize-handle" title="Yeniden Boyutlandır" aria-label="Yeniden Boyutlandır">
                      <svg class="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 15l-6 6m6-12l-12 12"/>
                      </svg>
                   </span>`
                : '';

            item.innerHTML = `
                <div class="panoptes-tilelayout-item-header">
                    <div class="panoptes-tilelayout-header-left">
                        ${dragHandleHtml}
                        <span class="panoptes-tilelayout-item-title">${headerText}</span>
                    </div>
                    <div class="panoptes-tilelayout-item-actions">
                        ${removeBtnHtml}
                    </div>
                </div>
                <div class="panoptes-tilelayout-item-body">${bodyHtml}</div>
                ${resizeHandleHtml}
            `;

            this.element.appendChild(item);
            this.bindSingleItem(item, this.getItems().length - 1);

            // Giriş animasyonu
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            requestAnimationFrame(() => {
                item.style.transition = 'all 0.25s ease';
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            });

            this.triggerEvent('add', { sender: this, container: item });
            return item;
        }

        removeTile(itemOrId) {
            const item = typeof itemOrId === 'string'
                ? document.getElementById(itemOrId) || this.element.querySelector(`[data-tile-id="${itemOrId}"]`)
                : itemOrId;

            if (!item || !this.element.contains(item)) return;

            item.style.transition = 'all 0.2s ease';
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';

            setTimeout(() => {
                if (item.parentElement) {
                    item.parentElement.removeChild(item);
                    this.triggerEvent('remove', { sender: this, containerId: item.id });
                }
            }, 200);
        }

        // ==================== DURUM SAKLAMA (STATE PERSISTENCE) ====================
        saveInitialState() {
            this.initialState = this.getState();
        }

        getState() {
            return this.getItems().map((item, idx) => ({
                id: item.id || item.getAttribute('data-tile-id'),
                colSpan: parseInt(item.getAttribute('data-col-span')) || 1,
                rowSpan: parseInt(item.getAttribute('data-row-span')) || 1,
                order: idx,
                visible: item.style.display !== 'none'
            }));
        }

        getOptions() {
            return {
                columns: this.options.columns,
                columnWidth: this.options.columnWidth,
                rowHeight: this.options.rowHeight,
                gap: this.options.gap,
                items: this.getState()
            };
        }

        setState(state) {
            if (!Array.isArray(state)) return;
            const itemsMap = new Map();
            this.getItems().forEach(it => {
                const id = it.id || it.getAttribute('data-tile-id');
                itemsMap.set(id, it);
            });

            // Re-append items in order
            state.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach(entry => {
                const item = itemsMap.get(entry.id);
                if (item) {
                    if (entry.colSpan) {
                        item.setAttribute('data-col-span', entry.colSpan);
                        item.style.gridColumn = `span ${entry.colSpan}`;
                    }
                    if (entry.rowSpan) {
                        item.setAttribute('data-row-span', entry.rowSpan);
                        item.style.gridRow = `span ${entry.rowSpan}`;
                    }
                    if (entry.visible !== undefined) {
                        item.style.display = entry.visible ? '' : 'none';
                    }
                    this.element.appendChild(item);
                }
            });
        }

        setOptions(options) {
            if (options.columns) {
                this.options.columns = options.columns;
            }
            if (options.columnWidth) {
                this.options.columnWidth = options.columnWidth;
            }
            if (options.rowHeight) {
                this.options.rowHeight = options.rowHeight;
            }
            if (options.gap) {
                this.options.gap = options.gap;
            }
            this.applyGridStyles();

            if (options.items) {
                this.setState(options.items);
            }
        }

        reset() {
            if (this.initialState && this.initialState.length > 0) {
                this.setState(this.initialState);
            }
        }

        // ==================== KLAVYE NAVİGASYONU (A11Y) ====================
        bindKeyboardNav() {
            this.element.addEventListener('keydown', (e) => {
                const activeItem = document.activeElement && document.activeElement.closest('.panoptes-tilelayout-item');
                if (!activeItem || activeItem.parentElement !== this.element) return;

                const items = this.getItems();
                const currentIndex = items.indexOf(activeItem);

                // Ctrl+Arrows or Alt+Arrows => Reorder (Move Tile)
                if (e.ctrlKey || e.altKey) {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (currentIndex < items.length - 1) {
                            const next = items[currentIndex + 1];
                            this.element.insertBefore(next, activeItem);
                            activeItem.focus();
                            this.triggerEvent('reorder', { sender: this, container: activeItem, oldIndex: currentIndex, newIndex: currentIndex + 1 });
                        }
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (currentIndex > 0) {
                            const prev = items[currentIndex - 1];
                            this.element.insertBefore(activeItem, prev);
                            activeItem.focus();
                            this.triggerEvent('reorder', { sender: this, container: activeItem, oldIndex: currentIndex, newIndex: currentIndex - 1 });
                        }
                    }
                    return;
                }

                // Shift+Arrows => Resize Tile
                if (e.shiftKey) {
                    let colSpan = parseInt(activeItem.getAttribute('data-col-span')) || 1;
                    let rowSpan = parseInt(activeItem.getAttribute('data-row-span')) || 1;

                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        if (colSpan < this.options.columns) {
                            colSpan++;
                            this.resizeTile(activeItem, colSpan, rowSpan);
                        }
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        if (colSpan > 1) {
                            colSpan--;
                            this.resizeTile(activeItem, colSpan, rowSpan);
                        }
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        rowSpan++;
                        this.resizeTile(activeItem, colSpan, rowSpan);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (rowSpan > 1) {
                            rowSpan--;
                            this.resizeTile(activeItem, colSpan, rowSpan);
                        }
                    }
                    return;
                }

                // Normal Arrows => Focus Navigation
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIdx = (currentIndex + 1) % items.length;
                    items[nextIdx].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIdx = (currentIndex - 1 + items.length) % items.length;
                    items[prevIdx].focus();
                } else if (e.key === 'Delete') {
                    if (activeItem.getAttribute('data-removable') === 'true') {
                        e.preventDefault();
                        this.removeTile(activeItem);
                    }
                }
            });
        }

        resizeTile(itemOrId, colSpan, rowSpan) {
            const item = typeof itemOrId === 'string'
                ? document.getElementById(itemOrId) || this.element.querySelector(`[data-tile-id="${itemOrId}"]`)
                : itemOrId;
            if (!item) return;

            const oldColSpan = parseInt(item.getAttribute('data-col-span')) || 1;
            const oldRowSpan = parseInt(item.getAttribute('data-row-span')) || 1;

            colSpan = Math.max(1, Math.min(this.options.columns, colSpan));
            rowSpan = Math.max(1, rowSpan);

            item.setAttribute('data-col-span', colSpan);
            item.setAttribute('data-row-span', rowSpan);
            item.style.gridColumn = `span ${colSpan}`;
            item.style.gridRow = `span ${rowSpan}`;

            this.triggerEvent('resize', {
                sender: this,
                container: item,
                colSpan,
                rowSpan,
                oldColSpan,
                oldRowSpan
            });
        }

        reorderTile(itemOrId, newIndex) {
            const item = typeof itemOrId === 'string'
                ? document.getElementById(itemOrId) || this.element.querySelector(`[data-tile-id="${itemOrId}"]`)
                : itemOrId;
            if (!item) return;

            const items = this.getItems();
            const oldIndex = items.indexOf(item);
            if (oldIndex === -1 || newIndex < 0 || newIndex >= items.length) return;

            const target = items[newIndex];
            if (newIndex > oldIndex) {
                this.element.insertBefore(item, target.nextSibling);
            } else {
                this.element.insertBefore(item, target);
            }

            this.triggerEvent('reorder', {
                sender: this,
                container: item,
                oldIndex,
                newIndex
            });
        }

        setColumns(cols) {
            this.options.columns = parseInt(cols) || 3;
            this.applyGridStyles();
        }

        setRowHeight(height) {
            this.options.rowHeight = height;
            this.applyGridStyles();
        }

        triggerEvent(eventName, detail) {
            const customEvent = new CustomEvent(`panoptes:tilelayout:${eventName}`, {
                bubbles: true,
                cancelable: true,
                detail
            });
            this.element.dispatchEvent(customEvent);
        }
    }

    // Registry & Auto-init
    const registry = new Map();

    window.Panoptes.TileLayout = {
        init: function (element, options) {
            const instance = new TileLayoutInstance(element, options);
            if (instance && instance.id) {
                registry.set(instance.id, instance);
            }
            return instance;
        },
        get: function (id) {
            return registry.get(id) || null;
        },
        initAll: function () {
            document.querySelectorAll('[data-panoptes-tilelayout="true"]').forEach(el => {
                if (!registry.has(el.id)) {
                    const inst = new TileLayoutInstance(el);
                    if (inst && inst.id) {
                        registry.set(inst.id, inst);
                    }
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.TileLayout.initAll());
    } else {
        window.Panoptes.TileLayout.initAll();
    }

})(window, document);
