window.Panoptes = window.Panoptes || {};

window.Panoptes.HoverGallery = class {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;
        
        this.images = Array.from(this.element.querySelectorAll('img'));
        if (this.images.length === 0) return;
        
        this.init();
    }
    
    init() {
        // Setup wrapper styling
        this.element.style.position = 'relative';
        this.element.style.overflow = 'hidden';
        
        // Hide all images except first
        this.images.forEach((img, i) => {
            img.style.position = i === 0 ? 'relative' : 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.opacity = i === 0 ? '1' : '0';
            img.style.transition = 'opacity 0.2s ease-in-out';
            img.style.zIndex = '1';
        });

        // Create overlay zones
        const zoneContainer = document.createElement('div');
        zoneContainer.className = 'absolute inset-0 z-10 flex';
        
        // Create indicator bar container
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'absolute bottom-2 left-0 right-0 z-20 flex px-2 gap-1 opacity-0 transition-opacity duration-300';
        
        this.element.addEventListener('mouseenter', () => indicatorContainer.style.opacity = '1');
        this.element.addEventListener('mouseleave', () => {
            indicatorContainer.style.opacity = '0';
            this.showImage(0); // reset to first image on leave
        });

        this.indicators = [];

        this.images.forEach((_, index) => {
            // Zone
            const zone = document.createElement('div');
            zone.className = 'flex-grow h-full';
            zone.addEventListener('mouseenter', () => this.showImage(index));
            zoneContainer.appendChild(zone);
            
            // Indicator
            const indicator = document.createElement('div');
            indicator.className = 'flex-grow h-1 rounded-full bg-white/40 transition-colors';
            indicatorContainer.appendChild(indicator);
            this.indicators.push(indicator);
        });

        this.element.appendChild(zoneContainer);
        this.element.appendChild(indicatorContainer);
        
        this.showImage(0); // Initial state
    }
    
    showImage(index) {
        this.images.forEach((img, i) => {
            if (i === index) {
                img.style.opacity = '1';
                img.style.zIndex = '2';
                this.indicators[i].className = 'flex-grow h-1 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-colors';
            } else {
                img.style.opacity = '0';
                img.style.zIndex = '1';
                this.indicators[i].className = 'flex-grow h-1 rounded-full bg-white/50 shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-colors';
            }
        });
    }
};
