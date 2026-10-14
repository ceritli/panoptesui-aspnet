window.Panoptes = window.Panoptes || {};

window.Panoptes.Lightbox = class {
    constructor(elementId) {
        this.container = document.getElementById(elementId);
        if (!this.container) return;

        try {
            this.options = JSON.parse(this.container.getAttribute('data-options') || '{}');
        } catch (e) {
            this.options = { selector: 'a[data-lightbox]', enableZoom: true, enableDownload: true, enableCounter: true, enableThumbnails: true, enableRotation: true, loop: true };
        }
        
        // Ensure defaults for new properties if not provided
        if (this.options.enableThumbnails === undefined) this.options.enableThumbnails = true;
        if (this.options.enableRotation === undefined) this.options.enableRotation = true;

        this.items = Array.from(this.container.querySelectorAll(this.options.selector));
        if (this.items.length === 0) return;

        this.currentIndex = 0;
        this.slides = [];
        
        this.bindEvents();
    }

    bindEvents() {
        this.items.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.open(index);
            });
        });

        this.handleKeyDown = (e) => {
            if (!this.overlay) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        };
    }

    open(index) {
        this.currentIndex = index;
        this.buildOverlay();
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.handleKeyDown);
        
        this.updateSlides();

        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
        });
    }

    close() {
        if (!this.overlay) return;
        this.overlay.classList.add('opacity-0');
        
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(()=>{});
        }

        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.overlay = null;
            document.body.style.overflow = '';
            document.removeEventListener('keydown', this.handleKeyDown);
        }, 300);
    }

    buildOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 z-[99999] bg-black flex flex-col opacity-0 transition-opacity duration-300 select-none';
        
        // --- Toolbar ---
        const toolbar = document.createElement('div');
        toolbar.className = 'absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 z-30 text-white';

        this.counterEl = document.createElement('div');
        this.counterEl.className = 'text-sm font-medium tracking-wide';
        if (!this.options.enableCounter) this.counterEl.style.display = 'none';
        
        const controls = document.createElement('div');
        controls.className = 'flex items-center gap-1';

        // Rotate Button
        if (this.options.enableRotation) {
            const rotBtn = document.createElement('button');
            rotBtn.className = 'p-2 hover:bg-white/20 rounded-lg transition text-white';
            rotBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';
            rotBtn.addEventListener('click', () => this.rotateCurrentSlide());
            controls.appendChild(rotBtn);
        }

        // Fullscreen
        const fsBtn = document.createElement('button');
        fsBtn.className = 'p-2 hover:bg-white/20 rounded-lg transition text-white';
        fsBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>';
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                this.overlay.requestFullscreen().catch(()=>{});
            } else {
                document.exitFullscreen().catch(()=>{});
            }
        });
        controls.appendChild(fsBtn);

        // Download
        if (this.options.enableDownload) {
            this.downloadBtn = document.createElement('a');
            this.downloadBtn.className = 'p-2 hover:bg-white/20 rounded-lg transition text-white';
            this.downloadBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
            this.downloadBtn.setAttribute('download', '');
            controls.appendChild(this.downloadBtn);
        }

        // Close
        const closeBtn = document.createElement('button');
        closeBtn.className = 'p-2 hover:bg-white/20 rounded-lg transition text-white ml-2';
        closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        closeBtn.addEventListener('click', () => this.close());
        controls.appendChild(closeBtn);

        toolbar.appendChild(this.counterEl);
        toolbar.appendChild(controls);

        // --- Nav Buttons ---
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full transition text-white z-20 backdrop-blur-sm';
        this.prevBtn.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>';
        this.prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });

        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full transition text-white z-20 backdrop-blur-sm';
        this.nextBtn.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
        this.nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

        // --- Slides Track ---
        this.trackContainer = document.createElement('div');
        this.trackContainer.className = 'relative flex-1 w-full overflow-hidden';
        
        this.track = document.createElement('div');
        this.track.className = 'absolute inset-0 flex transition-transform duration-500 ease-in-out';
        this.trackContainer.appendChild(this.track);

        // --- Thumbnails Strip ---
        if (this.options.enableThumbnails && this.items.length > 1) {
            this.thumbWrapper = document.createElement('div');
            this.thumbWrapper.className = 'absolute bottom-0 inset-x-0 transition-transform duration-300 z-30 translate-y-0';
            
            // Toggle Button
            this.thumbToggleBtn = document.createElement('button');
            this.thumbToggleBtn.className = 'absolute -top-8 right-4 bg-black/70 hover:bg-black p-1.5 rounded-t-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]';
            this.thumbToggleBtn.innerHTML = '<svg class="w-5 h-5 transition-transform duration-300 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
            
            this.isThumbOpen = true;
            this.thumbToggleBtn.addEventListener('click', () => {
                this.isThumbOpen = !this.isThumbOpen;
                if (this.isThumbOpen) {
                    this.thumbWrapper.classList.remove('translate-y-24');
                    this.thumbToggleBtn.querySelector('svg').classList.remove('rotate-180');
                } else {
                    this.thumbWrapper.classList.add('translate-y-24'); // Hides the 24px height container (which is 6rem = 96px, close to 24 Tailwind units)
                    this.thumbToggleBtn.querySelector('svg').classList.add('rotate-180');
                }
            });

            this.thumbContainer = document.createElement('div');
            this.thumbContainer.className = 'h-24 bg-black/90 border-t border-white/10 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar pointer-events-auto';
            
            this.thumbWrapper.appendChild(this.thumbToggleBtn);
            this.thumbWrapper.appendChild(this.thumbContainer);
            this.buildThumbnails();
        }

        // Assemble
        this.overlay.appendChild(toolbar);
        if (this.items.length > 1) {
            this.overlay.appendChild(this.prevBtn);
            this.overlay.appendChild(this.nextBtn);
            this.overlay.appendChild(this.trackContainer);
            if (this.options.enableThumbnails) {
                this.overlay.appendChild(this.thumbWrapper);
            }
        } else {
            this.overlay.appendChild(this.trackContainer);
        }

        document.body.appendChild(this.overlay);

        // Build all slide placeholders
        this.items.forEach((_, idx) => {
            const slide = document.createElement('div');
            slide.className = 'flex-shrink-0 w-full h-full flex items-center justify-center relative p-4';
            
            const spinner = document.createElement('div');
            spinner.className = 'absolute inset-0 flex items-center justify-center z-0';
            spinner.innerHTML = '<svg class="w-10 h-10 text-white/20 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            slide.appendChild(spinner);
            
            slide.isLoaded = false;
            slide.transformState = { scale: 1, rotate: 0, x: 0, y: 0 }; // Initialize state for zooming/rotating
            
            this.slides.push(slide);
            this.track.appendChild(slide);
        });
    }

    buildThumbnails() {
        this.thumbs = [];
        this.items.forEach((item, index) => {
            const thumbUrl = item.querySelector('img')?.getAttribute('src') || item.getAttribute('href');
            const t = document.createElement('button');
            t.className = 'w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all opacity-50 hover:opacity-100';
            t.innerHTML = `<img src="${thumbUrl}" class="w-full h-full object-cover" draggable="false" />`;
            t.addEventListener('click', () => {
                this.currentIndex = index;
                this.updateSlides();
            });
            this.thumbContainer.appendChild(t);
            this.thumbs.push(t);
        });
    }

    updateSlides() {
        // Move track
        this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;

        // Update UI
        if (this.counterEl) {
            this.counterEl.textContent = `${this.currentIndex + 1} / ${this.items.length}`;
        }
        
        const currentItem = this.items[this.currentIndex];
        if (this.downloadBtn) {
            this.downloadBtn.href = currentItem.getAttribute('href') || currentItem.getAttribute('data-src');
        }

        // Reset transform of all slides to avoid weird panning artifacts on inactive slides
        this.slides.forEach((s, idx) => {
            if (idx !== this.currentIndex && s.imgEl) {
                s.transformState = { scale: 1, rotate: 0, x: 0, y: 0 };
                this.applyTransform(s, false);
            }
        });

        // Update Thumbnails
        if (this.options.enableThumbnails && this.thumbs) {
            this.thumbs.forEach((t, i) => {
                if (i === this.currentIndex) {
                    t.classList.remove('border-transparent', 'opacity-50');
                    t.classList.add('border-blue-500', 'opacity-100');
                    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    t.classList.add('border-transparent', 'opacity-50');
                    t.classList.remove('border-blue-500', 'opacity-100');
                }
            });
        }

        // Load adjacent slides
        this.loadSlide(this.currentIndex);
        if (this.currentIndex > 0) this.loadSlide(this.currentIndex - 1);
        if (this.currentIndex < this.items.length - 1) this.loadSlide(this.currentIndex + 1);

        // Buttons state
        if (!this.options.loop && this.items.length > 1) {
            this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.2' : '1';
            this.prevBtn.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
            
            this.nextBtn.style.opacity = this.currentIndex === this.items.length - 1 ? '0.2' : '1';
            this.nextBtn.style.pointerEvents = this.currentIndex === this.items.length - 1 ? 'none' : 'auto';
        }
    }

    loadSlide(index) {
        const slide = this.slides[index];
        if (!slide || slide.isLoaded) return;
        
        const item = this.items[index];
        const src = item.getAttribute('href') || item.getAttribute('data-src');
        const title = item.getAttribute('title') || item.querySelector('img')?.getAttribute('alt') || '';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative flex items-center justify-center w-full h-full';
        
        const img = new Image();
        img.className = 'max-w-full max-h-full object-contain drop-shadow-2xl opacity-0 transition-opacity duration-300 z-10 select-none';
        img.draggable = false;
        
        slide.imgContainer = imgContainer;
        slide.imgEl = img;

        if (this.options.enableZoom) {
            img.style.cursor = 'zoom-in';
            
            // Double click to zoom in/out
            img.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (slide.transformState.scale > 1) {
                    slide.transformState.scale = 1;
                    slide.transformState.x = 0;
                    slide.transformState.y = 0;
                    img.style.cursor = 'zoom-in';
                } else {
                    slide.transformState.scale = 2; // Zoom factor
                    img.style.cursor = 'grab';
                }
                this.applyTransform(slide, true);
            });
            
            // Mouse drag for panning when zoomed in
            let isDragging = false;
            let startX, startY;
            let initialX, initialY;

            img.addEventListener('mousedown', (e) => {
                if (slide.transformState.scale > 1) {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    initialX = slide.transformState.x;
                    initialY = slide.transformState.y;
                    img.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                slide.transformState.x = initialX + dx;
                slide.transformState.y = initialY + dy;
                this.applyTransform(slide, false); // No transition while dragging for smooth tracking
            });

            window.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    img.style.cursor = 'grab';
                }
            });
            
            // Handle mouse leave screen while dragging
            window.addEventListener('mouseleave', () => {
                if (isDragging) {
                    isDragging = false;
                    img.style.cursor = 'grab';
                }
            });

            // Mouse wheel scroll to zoom
            imgContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomFactor = 0.1;
                const minScale = 0.5;
                const maxScale = 5;

                if (e.deltaY < 0) {
                    slide.transformState.scale += zoomFactor; // Scroll up = Zoom in
                } else {
                    slide.transformState.scale -= zoomFactor; // Scroll down = Zoom out
                }

                slide.transformState.scale = Math.min(Math.max(minScale, slide.transformState.scale), maxScale);

                if (slide.transformState.scale <= 1) {
                    slide.transformState.scale = 1;
                    slide.transformState.x = 0;
                    slide.transformState.y = 0;
                    img.style.cursor = 'zoom-in';
                } else {
                    img.style.cursor = 'grab';
                }
                
                this.applyTransform(slide, false);
            }, { passive: false });
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'absolute bottom-8 inset-x-0 text-center text-white/80 text-sm pointer-events-none drop-shadow-lg z-20';
        titleEl.textContent = title;

        img.onload = () => {
            const spinner = slide.querySelector('div.absolute');
            if(spinner) spinner.remove();
            
            img.classList.remove('opacity-0');
            slide.isLoaded = true;
        };

        img.src = src;
        imgContainer.appendChild(img);
        slide.appendChild(imgContainer);
        if (title) slide.appendChild(titleEl);
    }

    applyTransform(slide, useTransition = true) {
        if (!slide.imgEl) return;
        const state = slide.transformState;
        
        if (useTransition) {
            slide.imgEl.style.transition = 'transform 0.3s ease-out';
        } else {
            slide.imgEl.style.transition = 'none';
        }

        slide.imgEl.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale}) rotate(${state.rotate}deg)`;
    }

    rotateCurrentSlide() {
        const slide = this.slides[this.currentIndex];
        if (!slide) return;
        slide.transformState.rotate += 90;
        this.applyTransform(slide, true);
    }

    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++;
            this.updateSlides();
        } else if (this.options.loop) {
            this.currentIndex = 0;
            this.updateSlides();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateSlides();
        } else if (this.options.loop) {
            this.currentIndex = this.items.length - 1;
            this.updateSlides();
        }
    }
};
