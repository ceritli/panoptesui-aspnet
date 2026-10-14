/**
 * Panoptes TaskBoard (Kanban Panosu Motoru)
 * Panoptes UI TaskBoard bileşeni, modern, HTML5 Drag & Drop destekli, çoklu sütun ve kart motoru.
 */

(function (window, document) {
    'use strict';

    class PanoptesTaskBoard {
        constructor(element) {
            if (typeof element === 'string') {
                this.element = document.getElementById(element);
            } else {
                this.element = element;
            }

            if (!this.element) return;
            if (this.element._panoptesTaskBoard) return this.element._panoptesTaskBoard;

            this.id = this.element.id;
            this.onCardMovedCallback = this.element.getAttribute('data-on-card-moved');
            this.activeCard = null;

            this.init();
            this.element._panoptesTaskBoard = this;
        }

        init() {
            this.bindEvents();
        }

        bindEvents() {
            // Kartların sürükleme olayları
            this.element.querySelectorAll('.panoptes-tb-card').forEach(card => {
                this.bindCard(card);
            });

            // Sütunların bırakma (drop) alanları
            this.element.querySelectorAll('.panoptes-tb-cards').forEach(zone => {
                this.bindDropZone(zone);
            });
        }

        bindCard(card) {
            card.setAttribute('draggable', 'true');

            card.addEventListener('dragstart', (e) => {
                this.activeCard = card;
                card.classList.add('opacity-40', 'rotate-1', 'scale-98');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('opacity-40', 'rotate-1', 'scale-98');
                this.activeCard = null;
                this.element.querySelectorAll('.panoptes-tb-cards').forEach(z => {
                    z.classList.remove('bg-blue-50/50', 'ring-2', 'ring-blue-400/50');
                });
            });
        }

        bindDropZone(zone) {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('bg-blue-50/50', 'ring-2', 'ring-blue-400/50', 'rounded-xl');
            });

            zone.addEventListener('dragleave', (e) => {
                // Eğer doğrudan zone'dan çıkıldıysa efekti kaldır
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('bg-blue-50/50', 'ring-2', 'ring-blue-400/50');
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('bg-blue-50/50', 'ring-2', 'ring-blue-400/50');

                if (!this.activeCard) return;

                const columnEl = zone.closest('.panoptes-tb-column');
                const newColId = columnEl ? columnEl.getAttribute('data-column-id') : null;
                const oldColId = this.activeCard.getAttribute('data-column-id');

                // Kartı yeni alana ekle
                zone.appendChild(this.activeCard);
                this.activeCard.setAttribute('data-column-id', newColId);

                // Sayaçları güncelle
                this.updateCounters();

                // Callback tetikle
                if (oldColId !== newColId) {
                    this.triggerMovedEvent({
                        cardId: this.activeCard.getAttribute('data-card-id'),
                        cardTitle: this.activeCard.querySelector('.text-xs.font-bold')?.innerText || '',
                        oldColumnId: oldColId,
                        newColumnId: newColId
                    });
                }
            });
        }

        updateCounters() {
            this.element.querySelectorAll('.panoptes-tb-column').forEach(col => {
                const countBadge = col.querySelector('.panoptes-tb-column > div:first-child .text-\\[10px\\]');
                const cardCount = col.querySelectorAll('.panoptes-tb-card').length;
                if (countBadge) {
                    countBadge.textContent = cardCount;
                }
            });
        }

        triggerMovedEvent(data) {
            if (this.onCardMovedCallback) {
                try {
                    if (typeof window[this.onCardMovedCallback] === 'function') {
                        window[this.onCardMovedCallback](data);
                    } else {
                        const fn = new Function('e', this.onCardMovedCallback);
                        fn(data);
                    }
                } catch (err) {
                    console.warn('[PanoptesTaskBoard] Callback execution error:', err);
                }
            }

            // Custom DOM Event
            const customEvent = new CustomEvent('cardMoved', { detail: data });
            this.element.dispatchEvent(customEvent);
        }

        addCard(columnId, cardData) {
            const column = this.element.querySelector(`[data-column-id="${columnId}"] .panoptes-tb-cards`);
            if (!column) return;

            const card = document.createElement('div');
            card.className = 'panoptes-tb-card bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-card-id', cardData.id || `card_${Date.now()}`);
            card.setAttribute('data-column-id', columnId);

            card.innerHTML = `
                <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${cardData.category || 'GENEL'}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">${cardData.priority || 'Normal'}</span>
                </div>
                <div class="text-xs font-bold text-slate-800 mb-1 leading-snug group-hover:text-blue-600 transition-colors">${cardData.title}</div>
                ${cardData.description ? `<div class="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">${cardData.description}</div>` : ''}
                <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>${cardData.dueDate || ''}</span>
                    ${cardData.assignee ? `<span class="font-medium text-slate-600">${cardData.assignee}</span>` : ''}
                </div>
            `;

            column.appendChild(card);
            this.bindCard(card);
            this.updateCounters();
        }

        moveCard(cardId, targetColumnId) {
            const card = this.element.querySelector(`[data-card-id="${cardId}"]`);
            const targetZone = this.element.querySelector(`[data-column-id="${targetColumnId}"] .panoptes-tb-cards`);
            if (!card || !targetZone) return;

            const oldColId = card.getAttribute('data-column-id');
            targetZone.appendChild(card);
            card.setAttribute('data-column-id', targetColumnId);
            this.updateCounters();

            this.triggerMovedEvent({
                cardId: cardId,
                cardTitle: card.querySelector('.text-xs.font-bold')?.innerText || '',
                oldColumnId: oldColId,
                newColumnId: targetColumnId
            });
        }
    }

    function initTaskBoards() {
        document.querySelectorAll('[data-panoptes-taskboard="true"]').forEach(el => {
            new PanoptesTaskBoard(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTaskBoards);
    } else {
        initTaskBoards();
    }

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.TaskBoard = {
        init: initTaskBoards,
        getInstance: (id) => {
            const el = typeof id === 'string' ? document.getElementById(id) : id;
            return el ? el._panoptesTaskBoard || new PanoptesTaskBoard(el) : null;
        }
    };

    window.panoptesTaskBoard = window.Panoptes.TaskBoard;

})(window, document);
