/**
 * Panoptes Splitter (Panel Bölücü & Boyutlandırıcı)
 * Panoptes UI Splitter bileşeni, modern, dokunmatik/fare destekli yeniden boyutlandırılabilir ve katlanabilir panel motoru.
 */

(function (window, document) {
    'use strict';

    class PanoptesSplitter {
        constructor(element) {
            if (typeof element === 'string') {
                this.element = document.getElementById(element);
            } else {
                this.element = element;
            }

            if (!this.element) return;
            if (this.element._panoptesSplitter) return this.element._panoptesSplitter;

            this.id = this.element.id;
            this.orientation = this.element.getAttribute('data-orientation') || 'horizontal';
            this.isVertical = this.orientation === 'vertical';
            this.panes = Array.from(this.element.querySelectorAll(':scope > .panoptes-splitter-pane'));
            this.splitbars = Array.from(this.element.querySelectorAll(':scope > .panoptes-splitbar'));

            this.onResizeCallback = this.element.getAttribute('data-on-resize');
            this.onCollapseCallback = this.element.getAttribute('data-on-collapse');
            this.onExpandCallback = this.element.getAttribute('data-on-expand');

            this.init();
            this.element._panoptesSplitter = this;
        }

        init() {
            this.bindSplitbars();
        }

        bindSplitbars() {
            this.splitbars.forEach((bar, index) => {
                const prevPane = this.panes[index];
                const nextPane = this.panes[index + 1];

                if (!prevPane || !nextPane) return;

                let startPos = 0;
                let startPrevSize = 0;
                let startNextSize = 0;
                let isDragging = false;

                const onMouseDown = (e) => {
                    // Sadece sol tık
                    if (e.button !== 0) return;

                    isDragging = true;
                    document.body.style.userSelect = 'none';
                    document.body.style.cursor = this.isVertical ? 'row-resize' : 'col-resize';
                    bar.classList.add('bg-blue-300');

                    startPos = this.isVertical ? e.clientY : e.clientX;
                    startPrevSize = this.isVertical ? prevPane.offsetHeight : prevPane.offsetWidth;
                    startNextSize = this.isVertical ? nextPane.offsetHeight : nextPane.offsetWidth;

                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        const currentPos = this.isVertical ? moveEvent.clientY : moveEvent.clientX;
                        const delta = currentPos - startPos;

                        this.resizePanes(prevPane, nextPane, startPrevSize, startNextSize, delta);
                    };

                    const onMouseUp = () => {
                        if (!isDragging) return;
                        isDragging = false;
                        document.body.style.userSelect = '';
                        document.body.style.cursor = '';
                        bar.classList.remove('bg-blue-300');

                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);

                        this.triggerEvent(this.onResizeCallback, {
                            sender: this,
                            prevPane: prevPane,
                            nextPane: nextPane,
                            prevSize: this.isVertical ? prevPane.offsetHeight : prevPane.offsetWidth,
                            nextSize: this.isVertical ? nextPane.offsetHeight : nextPane.offsetWidth
                        });
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                };

                bar.addEventListener('mousedown', onMouseDown);

                // Dokunmatik (Touch) desteği
                const onTouchStart = (e) => {
                    if (e.touches.length !== 1) return;
                    const touch = e.touches[0];

                    startPos = this.isVertical ? touch.clientY : touch.clientX;
                    startPrevSize = this.isVertical ? prevPane.offsetHeight : prevPane.offsetWidth;
                    startNextSize = this.isVertical ? nextPane.offsetHeight : nextPane.offsetWidth;

                    const onTouchMove = (moveEvent) => {
                        if (moveEvent.touches.length !== 1) return;
                        const moveTouch = moveEvent.touches[0];
                        const currentPos = this.isVertical ? moveTouch.clientY : moveTouch.clientX;
                        const delta = currentPos - startPos;
                        this.resizePanes(prevPane, nextPane, startPrevSize, startNextSize, delta);
                    };

                    const onTouchEnd = () => {
                        document.removeEventListener('touchmove', onTouchMove);
                        document.removeEventListener('touchend', onTouchEnd);

                        this.triggerEvent(this.onResizeCallback, {
                            sender: this,
                            prevPane: prevPane,
                            nextPane: nextPane,
                            prevSize: this.isVertical ? prevPane.offsetHeight : prevPane.offsetWidth,
                            nextSize: this.isVertical ? nextPane.offsetHeight : nextPane.offsetWidth
                        });
                    };

                    document.addEventListener('touchmove', onTouchMove, { passive: false });
                    document.addEventListener('touchend', onTouchEnd);
                };

                bar.addEventListener('touchstart', onTouchStart, { passive: true });
            });
        }

        parseSize(val, totalPx) {
            if (!val) return null;
            val = val.toString().trim();
            if (val.endsWith('px')) {
                return parseFloat(val);
            }
            if (val.endsWith('%')) {
                return (parseFloat(val) / 100) * totalPx;
            }
            return parseFloat(val) || null;
        }

        resizePanes(prevPane, nextPane, startPrev, startNext, delta) {
            const containerSize = this.isVertical ? this.element.clientHeight : this.element.clientWidth;

            const prevMin = this.parseSize(prevPane.getAttribute('data-min-size'), containerSize) || 30;
            const prevMax = this.parseSize(prevPane.getAttribute('data-max-size'), containerSize) || (startPrev + startNext - 30);

            const nextMin = this.parseSize(nextPane.getAttribute('data-min-size'), containerSize) || 30;
            const nextMax = this.parseSize(nextPane.getAttribute('data-max-size'), containerSize) || (startPrev + startNext - 30);

            let newPrev = startPrev + delta;
            let newNext = startNext - delta;

            if (newPrev < prevMin) {
                newPrev = prevMin;
                newNext = startPrev + startNext - newPrev;
            } else if (newPrev > prevMax) {
                newPrev = prevMax;
                newNext = startPrev + startNext - newPrev;
            }

            if (newNext < nextMin) {
                newNext = nextMin;
                newPrev = startPrev + startNext - newNext;
            } else if (newNext > nextMax) {
                newNext = nextMax;
                newPrev = startPrev + startNext - newNext;
            }

            if (this.isVertical) {
                prevPane.style.height = `${newPrev}px`;
                prevPane.style.flex = `0 0 ${newPrev}px`;
                nextPane.style.height = `${newNext}px`;
                nextPane.style.flex = `0 0 ${newNext}px`;
            } else {
                prevPane.style.width = `${newPrev}px`;
                prevPane.style.flex = `0 0 ${newPrev}px`;
                nextPane.style.width = `${newNext}px`;
                nextPane.style.flex = `0 0 ${newNext}px`;
            }
        }

        getPane(indexOrId) {
            if (typeof indexOrId === 'number') {
                return this.panes[indexOrId] || null;
            }
            return this.panes.find(p => p.getAttribute('data-pane-id') === indexOrId || p.id === indexOrId) || null;
        }

        collapse(indexOrId) {
            const pane = this.getPane(indexOrId);
            if (!pane) return;

            pane._originalSize = this.isVertical ? pane.offsetHeight : pane.offsetWidth;
            pane.style.display = 'none';
            if (this.isVertical) {
                pane.style.height = '0px';
                pane.style.flex = '0 0 0px';
            } else {
                pane.style.width = '0px';
                pane.style.flex = '0 0 0px';
            }

            this.triggerEvent(this.onCollapseCallback, {
                sender: this,
                pane: pane,
                index: this.panes.indexOf(pane)
            });
        }

        expand(indexOrId) {
            const pane = this.getPane(indexOrId);
            if (!pane) return;

            pane.style.display = '';
            const restoredSize = pane._originalSize || pane.getAttribute('data-default-size') || (this.isVertical ? '200px' : '250px');
            const pxSize = typeof restoredSize === 'number' ? `${restoredSize}px` : restoredSize;

            if (this.isVertical) {
                pane.style.height = pxSize;
                pane.style.flex = `0 0 ${pxSize}`;
            } else {
                pane.style.width = pxSize;
                pane.style.flex = `0 0 ${pxSize}`;
            }

            this.triggerEvent(this.onExpandCallback, {
                sender: this,
                pane: pane,
                index: this.panes.indexOf(pane)
            });
        }

        toggle(indexOrId) {
            const pane = this.getPane(indexOrId);
            if (!pane) return;

            if (pane.style.display === 'none' || (this.isVertical ? pane.offsetHeight === 0 : pane.offsetWidth === 0)) {
                this.expand(indexOrId);
            } else {
                this.collapse(indexOrId);
            }
        }

        size(indexOrId, newSize) {
            const pane = this.getPane(indexOrId);
            if (!pane) return;

            const sizeStr = typeof newSize === 'number' ? `${newSize}px` : newSize;
            pane.style.display = '';
            if (this.isVertical) {
                pane.style.height = sizeStr;
                pane.style.flex = `0 0 ${sizeStr}`;
            } else {
                pane.style.width = sizeStr;
                pane.style.flex = `0 0 ${sizeStr}`;
            }

            this.triggerEvent(this.onResizeCallback, {
                sender: this,
                pane: pane,
                size: sizeStr
            });
        }

        triggerEvent(fnName, args) {
            if (!fnName) return;
            try {
                if (typeof window[fnName] === 'function') {
                    window[fnName](args);
                } else {
                    const fn = new Function('e', fnName);
                    fn(args);
                }
            } catch (err) {
                console.warn(`[PanoptesSplitter] Event callback error (${fnName}):`, err);
            }
        }
    }

    function initSplitters() {
        document.querySelectorAll('[data-panoptes-splitter="true"]').forEach(el => {
            new PanoptesSplitter(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSplitters);
    } else {
        initSplitters();
    }

    // Global Namespace
    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Splitter = {
        init: initSplitters,
        getInstance: (id) => {
            const el = typeof id === 'string' ? document.getElementById(id) : id;
            return el ? el._panoptesSplitter || new PanoptesSplitter(el) : null;
        },
        get: (id) => window.Panoptes.Splitter.getInstance(id)
    };

    window.panoptesSplitter = window.Panoptes.Splitter;

})(window, document);
