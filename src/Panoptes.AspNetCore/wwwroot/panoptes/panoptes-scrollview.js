window.Panoptes = window.Panoptes || {};

window.Panoptes.ScrollView = class {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;

        try {
            this.options = JSON.parse(this.element.getAttribute('data-options') || '{}');
        } catch (e) {
            this.options = { pageSize: 1, autoplay: false, enablePager: true, enableNavButtons: true, loop: true, autoplayInterval: 5000, gap: '1rem', drag: true, direction: 'ltr' };
        }

        this.track = this.element.querySelector('.panoptes-scrollview-track');
        if (!this.track) return;

        this.items = Array.from(this.track.children);
        if (this.items.length === 0) return;

        this.currentIndex = 0;
        this.totalItems = this.items.length;
        
        // Panning/Dragging state
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        
        this.init();
    }

    init() {
        // Prevent images/links inside from breaking the drag
        this.items.forEach(item => {
            const flexBasis = `calc((100% - ${this.options.gap} * ${this.options.pageSize - 1}) / ${this.options.pageSize})`;
            item.style.flex = `0 0 ${flexBasis}`;
            item.style.width = flexBasis;
            item.style.boxSizing = 'border-box';
            item.style.userSelect = 'none'; // prevent text selection
            
            // disable default image drag behavior
            const imgs = item.querySelectorAll('img');
            imgs.forEach(img => img.setAttribute('draggable', 'false'));
            const links = item.querySelectorAll('a');
            links.forEach(a => a.setAttribute('draggable', 'false'));
        });

        if (this.options.enableNavButtons && this.totalItems > this.options.pageSize) {
            this.renderNavButtons();
        }

        if (this.options.enablePager && this.totalItems > this.options.pageSize) {
            this.renderPager();
        }

        if (this.options.autoplay) {
            this.startAutoplay();
            this.element.addEventListener('mouseenter', () => this.stopAutoplay());
            this.element.addEventListener('mouseleave', () => this.startAutoplay());
        }

        if (this.options.drag && this.totalItems > this.options.pageSize) {
            this.bindDragEvents();
        }

        window.addEventListener('resize', () => {
            this.updateView(false); // Snap to position without transition briefly
        });

        // Initialize view
        setTimeout(() => this.updateView(true), 50);
    }

    bindDragEvents() {
        // Mouse Events
        this.track.addEventListener('mousedown', (e) => this.dragStart(e.pageX));
        window.addEventListener('mousemove', (e) => this.dragAction(e.pageX));
        window.addEventListener('mouseup', () => this.dragEnd());
        
        // Handle drag leaving window
        this.element.addEventListener('mouseleave', () => {
            if (this.isDragging) this.dragEnd();
        });
        
        // Touch Events
        this.track.addEventListener('touchstart', (e) => this.dragStart(e.touches[0].clientX), {passive: true});
        this.track.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                // Prevent vertical scroll while swiping horizontally
                e.preventDefault();
                this.dragAction(e.touches[0].clientX);
            }
        }, {passive: false});
        this.track.addEventListener('touchend', () => this.dragEnd());
    }

    dragStart(xPos) {
        this.isDragging = true;
        this.startX = xPos;
        this.element.classList.add('cursor-grabbing');
        this.track.style.transition = 'none'; // disable CSS transition during drag
        this.stopAutoplay();
    }

    dragAction(xPos) {
        if (!this.isDragging) return;
        
        const diff = xPos - this.startX;
        const currentOffset = this.getTranslateOffset();
        this.track.style.transform = `translateX(${currentOffset + diff}px)`;
    }

    dragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.element.classList.remove('cursor-grabbing');
        this.track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        
        const currentTransform = this.track.style.transform;
        const matrixMatch = currentTransform.match(/translateX\(([-\d.]+)px\)/);
        if (matrixMatch) {
            const currentX = parseFloat(matrixMatch[1]);
            const baseOffset = this.getTranslateOffset();
            const movedBy = currentX - baseOffset;
            
            // if moved more than 50px, snap to next/prev
            if (movedBy < -50) {
                this.next();
            } else if (movedBy > 50) {
                this.prev();
            } else {
                this.updateView(); // snap back
            }
        }
        
        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }

    getTranslateOffset() {
        const itemWidth = this.items[0].getBoundingClientRect().width;
        // Parse gap. Assuming pixels or rem. We can get computed gap from track.
        const gapVal = parseFloat(window.getComputedStyle(this.track).gap) || 0;
        const step = itemWidth + gapVal;
        return -(this.currentIndex * step);
    }

    renderNavButtons() {
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md hover:bg-white flex items-center justify-center text-slate-800 transition z-10 border border-slate-200';
        this.prevBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>';
        
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md hover:bg-white flex items-center justify-center text-slate-800 transition z-10 border border-slate-200';
        this.nextBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

        this.prevBtn.addEventListener('click', (e) => { e.preventDefault(); this.prev(); });
        this.nextBtn.addEventListener('click', (e) => { e.preventDefault(); this.next(); });

        this.element.appendChild(this.prevBtn);
        this.element.appendChild(this.nextBtn);
    }

    renderPager() {
        this.pagerContainer = document.createElement('div');
        this.pagerContainer.className = 'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10';
        
        this.pageCount = Math.ceil((this.totalItems - this.options.pageSize) / this.options.pageSize) + 1;
        this.dots = [];

        for (let i = 0; i < this.pageCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-300 transition-all hover:bg-blue-500 hover:scale-125 focus:outline-none shadow-sm';
            dot.addEventListener('click', () => {
                this.goTo(i * this.options.pageSize);
            });
            this.pagerContainer.appendChild(dot);
            this.dots.push(dot);
        }

        this.element.appendChild(this.pagerContainer);
    }

    updateView(useTransition = true) {
        if (!useTransition) {
            this.track.style.transition = 'none';
        } else {
            this.track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        }
        
        const offset = this.getTranslateOffset();
        this.track.style.transform = `translateX(${offset}px)`;

        // Clean up transition disable if we disabled it
        if (!useTransition) {
            // Force reflow
            void this.track.offsetWidth;
            this.track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        }

        // Update Pager
        if (this.dots && this.dots.length > 0) {
            const pageIndex = Math.ceil(this.currentIndex / this.options.pageSize);
            this.dots.forEach((dot, idx) => {
                if (idx === pageIndex) {
                    dot.classList.remove('bg-slate-300');
                    dot.classList.add('bg-blue-600', 'scale-125');
                } else {
                    dot.classList.add('bg-slate-300');
                    dot.classList.remove('bg-blue-600', 'scale-125');
                }
            });
        }

        // Update Nav Buttons (if not loop)
        if (!this.options.loop && this.prevBtn && this.nextBtn) {
            this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
            this.prevBtn.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
            
            const isEnd = this.currentIndex >= this.totalItems - this.options.pageSize;
            this.nextBtn.style.opacity = isEnd ? '0.5' : '1';
            this.nextBtn.style.pointerEvents = isEnd ? 'none' : 'auto';
        }
    }

    next() {
        if (this.currentIndex >= this.totalItems - this.options.pageSize) {
            if (this.options.loop) {
                this.currentIndex = 0; // Rewind
            } else {
                return;
            }
        } else {
            this.currentIndex += this.options.pageSize;
            // clamp
            if (this.currentIndex > this.totalItems - this.options.pageSize) {
                this.currentIndex = this.totalItems - this.options.pageSize;
            }
        }
        this.updateView();
    }

    prev() {
        if (this.currentIndex <= 0) {
            if (this.options.loop) {
                this.currentIndex = this.totalItems - this.options.pageSize; // Fast-forward to end
            } else {
                return;
            }
        } else {
            this.currentIndex -= this.options.pageSize;
            if (this.currentIndex < 0) this.currentIndex = 0;
        }
        this.updateView();
    }

    goTo(index) {
        if (index >= 0 && index <= this.totalItems - this.options.pageSize) {
            this.currentIndex = index;
            this.updateView();
        } else if (index > this.totalItems - this.options.pageSize) {
            this.currentIndex = this.totalItems - this.options.pageSize;
            this.updateView();
        }
    }

    startAutoplay() {
        if (this.autoplayTimer) clearInterval(this.autoplayTimer);
        this.autoplayTimer = setInterval(() => {
            this.next();
        }, this.options.autoplayInterval || 5000);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }
};
