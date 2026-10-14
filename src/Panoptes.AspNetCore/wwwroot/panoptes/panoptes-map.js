/**
 * Panoptes Map Component (Etkileşimli Coğrafi Harita)
 * Panoptes ASP.NET Core Map Bileşeni
 * 
 * Özellikler:
 * - Raster karo sağlayıcıları (OpenStreetMap Standart, OpenStreetMap HOT, Esri Uydu, OpenTopo, Esri Sokak)
 * - Veriye duyarlı oransal kabarcık katmanı (Bubble Layer)
 * - GeoJSON çokgen (Polygon) & Vektör sınır katmanları (Choropleth)
 * - Özel animasyonlu SVG işaretçileri (Markers) ve zengin HTML popuplar
 * - İstemci API (center, setCenter, flyTo, zoom, setZoom, zoomIn, zoomOut, pan, addMarker, removeMarker, export)
 * - Harita olayları (pan, zoom, click, markerClick, shapeClick)
 * - PNG ve SVG yüksek çözünürlüklü dışa aktarma
 */

(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Map = window.Panoptes.Map || {
        instances: {},

        getInstance: function (id) {
            if (this.instances[id]) return this.instances[id];
            const el = document.getElementById(id);
            if (el && el.getAttribute('data-panoptes-map') === 'true') {
                return this.init(el);
            }
            return null;
        },

        init: function (container) {
            if (!container) return null;
            const id = container.id || ('panoptes-map-' + Math.random().toString(36).substring(2, 9));
            if (this.instances[id]) return this.instances[id];

            if (window.L) {
                const instance = new PanoptesMapInstance(container);
                this.instances[id] = instance;
                return instance;
            }

            // Leaflet yüklü değilse dinamik yükle
            this.ensureLeaflet(() => {
                if (!this.instances[id]) {
                    const instance = new PanoptesMapInstance(container);
                    this.instances[id] = instance;
                }
            });

            return this.instances[id] || null;
        },

        initAll: function () {
            document.querySelectorAll('[data-panoptes-map="true"]').forEach(el => {
                this.init(el);
            });
        },

        ensureLeaflet: function (callback) {
            if (window.L) {
                callback();
                return;
            }

            // CSS kontrolü
            if (!document.getElementById('panoptes-leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'panoptes-leaflet-css';
                link.rel = 'stylesheet';
                link.href = '/panoptes/leaflet/leaflet.css';
                document.head.appendChild(link);
            }

            // JS kontrolü
            let script = document.getElementById('panoptes-leaflet-js');
            if (!script) {
                script = document.createElement('script');
                script.id = 'panoptes-leaflet-js';
                script.src = '/panoptes/leaflet/leaflet.js';
                script.onload = () => callback();
                script.onerror = () => {
                    const cdnScript = document.createElement('script');
                    cdnScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    cdnScript.onload = () => callback();
                    document.head.appendChild(cdnScript);
                };
                document.head.appendChild(script);
            } else {
                script.addEventListener('load', () => callback());
            }
        }
    };

    class PanoptesMapInstance {
        constructor(container) {
            this.container = container;
            this.id = container.id;
            this.viewport = container.querySelector('.panoptes-map-viewport');
            
            // Konfigürasyon JSON oku
            const configScript = container.querySelector('.panoptes-map-config');
            this.config = configScript ? JSON.parse(configScript.textContent || '{}') : {};

            this.centerCoords = this.config.center || [39.9334, 32.8597];
            this.zoomLevel = this.config.zoom || 6;
            this.minZoom = this.config.minZoom || 1;
            this.maxZoom = this.config.maxZoom || 19;
            this.showControls = this.config.controls !== false;
            this.isPannable = this.config.pannable !== false;
            this.isZoomable = this.config.zoomable !== false;

            this.layers = [];
            this.markers = [];
            this.markerLayerGroup = null;
            this.bubbleLayerGroup = null;
            this.shapeLayerGroup = null;
            this.tileLayers = {};
            this.activeTileLayer = null;

            this.initMap();
        }

        initMap() {
            if (!window.L || !this.viewport) return;

            // Leaflet haritasını başlat
            this.map = L.map(this.viewport, {
                center: this.centerCoords,
                zoom: this.zoomLevel,
                minZoom: this.minZoom,
                maxZoom: this.maxZoom,
                zoomControl: false,
                attributionControl: false,
                dragging: this.isPannable,
                touchZoom: this.isZoomable,
                scrollWheelZoom: this.isZoomable,
                doubleClickZoom: this.isZoomable,
                boxZoom: this.isZoomable
            });

            // Alt bilgi (Attribution) sağ alt köşeye
            L.control.attribution({ position: 'bottomright', prefix: 'Panoptes Map' }).addTo(this.map);

            // Katman grupları
            this.markerLayerGroup = L.layerGroup().addTo(this.map);
            this.bubbleLayerGroup = L.layerGroup().addTo(this.map);
            this.shapeLayerGroup = L.layerGroup().addTo(this.map);

            // Yapılandırmadaki katmanları kur
            this.setupLayers();

            // Doğrudan tanımlanan marker'ları ekle
            if (this.config.markers && this.config.markers.length > 0) {
                this.config.markers.forEach(m => this.addMarker(m));
            }

            // Arayüz kontrollerini oluştur
            if (this.showControls) {
                this.renderToolbar();
            }

            // Olay dinleyicilerini bağla
            this.bindEvents();

            // Yeniden boyutlandırma düzeltmesi
            setTimeout(() => {
                this.map.invalidateSize();
            }, 250);
        }

        setupLayers() {
            const layersConfig = this.config.layers || [];
            
            // Eğer tile katmanı yoksa varsayılan OpenStreetMap ekle
            const hasTile = layersConfig.some(l => l.type === 'tile');
            if (!hasTile) {
                layersConfig.unshift({
                    type: 'tile',
                    title: 'OpenStreetMap',
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attribution: '&copy; OpenStreetMap contributors',
                    opacity: 1.0,
                    visible: true
                });
            }

            layersConfig.forEach(layerCfg => {
                if (layerCfg.type === 'tile') {
                    const subdomains = layerCfg.subdomains || 'abc';
                    const tileLayer = L.tileLayer(layerCfg.urlTemplate, {
                        attribution: layerCfg.attribution || '',
                        opacity: layerCfg.opacity !== undefined ? layerCfg.opacity : 1.0,
                        subdomains: subdomains.split(''),
                        maxZoom: this.maxZoom
                    });

                    const title = layerCfg.title || 'Varsayılan Katman';
                    this.tileLayers[title] = tileLayer;

                    if (layerCfg.visible !== false && !this.activeTileLayer) {
                        tileLayer.addTo(this.map);
                        this.activeTileLayer = tileLayer;
                        this.activeTileLayerTitle = title;
                    }
                } else if (layerCfg.type === 'marker') {
                    if (layerCfg.markers && layerCfg.markers.length > 0) {
                        layerCfg.markers.forEach(m => this.addMarker(m));
                    }
                    const url = layerCfg.sourceUrl || layerCfg.url || layerCfg.dataSourceUrl;
                    if (url) {
                        this.loadRemoteMarkers(url);
                    }
                } else if (layerCfg.type === 'bubble') {
                    const url = layerCfg.sourceUrl || layerCfg.url || layerCfg.dataSourceUrl;
                    if (layerCfg.data) {
                        this.renderBubbles(layerCfg.data, layerCfg);
                    } else if (url) {
                        this.loadRemoteBubbles(url, layerCfg);
                    }
                } else if (layerCfg.type === 'shape') {
                    const url = layerCfg.sourceUrl || layerCfg.url || layerCfg.dataSourceUrl;
                    if (layerCfg.data) {
                        this.renderGeoJson(layerCfg.data, layerCfg);
                    } else if (url) {
                        this.loadRemoteGeoJson(url, layerCfg);
                    }
                }
            });
        }

        renderToolbar() {
            const toolbar = document.createElement('div');
            toolbar.className = 'panoptes-map-toolbar absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto';
            
            // Zoom Kontrolleri
            const zoomGroup = document.createElement('div');
            zoomGroup.className = 'flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 overflow-hidden';
            zoomGroup.innerHTML = `
                <button type="button" class="panoptes-map-btn-zoom-in w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition border-b border-slate-100" title="Yakınlaştır (+)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
                <button type="button" class="panoptes-map-btn-zoom-out w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition" title="Uzaklaştır (-)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>
                </button>
            `;
            toolbar.appendChild(zoomGroup);

            // Eylem Kontrolleri (Merkez, Tam Ekran, Dışa Aktar)
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 overflow-hidden';
            actionsGroup.innerHTML = `
                <button type="button" class="panoptes-map-btn-reset w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition border-b border-slate-100" title="Merkeze Dön">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                </button>
                <button type="button" class="panoptes-map-btn-fullscreen w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition border-b border-slate-100" title="Tam Ekran">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                </button>
                <button type="button" class="panoptes-map-btn-export w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition" title="PNG Olarak Kaydet">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
            `;
            toolbar.appendChild(actionsGroup);

            // Karo Katman Seçici (Eğer 2 veya daha fazla karo katmanı varsa)
            const tileKeys = Object.keys(this.tileLayers);
            if (tileKeys.length > 1) {
                const layerGroup = document.createElement('div');
                layerGroup.className = 'relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80';
                
                const selectBtn = document.createElement('button');
                selectBtn.type = 'button';
                selectBtn.className = 'panoptes-map-btn-layers w-9 h-9 flex items-center justify-center text-slate-700 hover:text-indigo-600 transition';
                selectBtn.title = 'Katman Değiştir';
                selectBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`;
                
                const dropdown = document.createElement('div');
                dropdown.className = 'panoptes-map-layer-menu hidden absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-200/80 p-2 min-w-[200px] z-50 flex flex-col gap-1 text-xs';
                
                tileKeys.forEach(key => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 transition ${key === this.activeTileLayerTitle ? 'font-bold text-indigo-600 bg-indigo-50/60' : 'text-slate-700'}`;
                    btn.innerHTML = `<span>${key}</span>${key === this.activeTileLayerTitle ? '✓' : ''}`;
                    btn.onclick = () => {
                        this.switchTileLayer(key);
                        dropdown.classList.add('hidden');
                        this.renderToolbar();
                    };
                    dropdown.appendChild(btn);
                });

                selectBtn.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                };

                document.addEventListener('click', () => dropdown.classList.add('hidden'));

                layerGroup.appendChild(selectBtn);
                layerGroup.appendChild(dropdown);
                toolbar.appendChild(layerGroup);
            }

            // Toolbar düğme olayları
            toolbar.querySelector('.panoptes-map-btn-zoom-in')?.addEventListener('click', () => this.zoomIn());
            toolbar.querySelector('.panoptes-map-btn-zoom-out')?.addEventListener('click', () => this.zoomOut());
            toolbar.querySelector('.panoptes-map-btn-reset')?.addEventListener('click', () => this.resetView());
            toolbar.querySelector('.panoptes-map-btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
            toolbar.querySelector('.panoptes-map-btn-export')?.addEventListener('click', () => this.exportPNG());

            // Eski toolbar varsa kaldır ve yenisini ekle
            const oldToolbar = this.container.querySelector('.panoptes-map-toolbar');
            if (oldToolbar) oldToolbar.remove();

            this.container.appendChild(toolbar);
        }

        bindEvents() {
            if (!this.map) return;

            // Pan olayları
            this.map.on('movestart', (e) => this.triggerEvent('on-pan', { type: 'movestart', center: this.map.getCenter() }));
            this.map.on('moveend', (e) => this.triggerEvent('on-pan', { type: 'moveend', center: this.map.getCenter(), zoom: this.map.getZoom() }));

            // Zoom olayları
            this.map.on('zoomstart', (e) => this.triggerEvent('on-zoom-start', { type: 'zoomstart', zoom: this.map.getZoom() }));
            this.map.on('zoomend', (e) => this.triggerEvent('on-zoom-end', { type: 'zoomend', zoom: this.map.getZoom() }));

            // Harita tıklama
            this.map.on('click', (e) => {
                this.triggerEvent('on-click', {
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                    containerPoint: e.containerPoint
                });
            });
        }

        triggerEvent(attrName, payload) {
            const eventType = attrName.replace('on-', '').replace(/-/g, '');
            const customEvent = new CustomEvent(`panoptes:map:${eventType}`, {
                bubbles: true,
                detail: payload
            });
            this.container.dispatchEvent(customEvent);

            const handlerName = this.container.getAttribute(`data-${attrName}`);
            if (handlerName && typeof window[handlerName] === 'function') {
                try {
                    window[handlerName](payload);
                } catch (err) {
                    console.error(`Panoptes Map event handler "${handlerName}" error:`, err);
                }
            }
        }

        // ==================== MARKER YÖNETİMİ ====================
        addMarker(markerData) {
            if (!this.map || !markerData) return;

            const lat = parseFloat(markerData.lat);
            const lng = parseFloat(markerData.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const markerId = markerData.id || ('m_' + Math.random().toString(36).substring(2, 9));
            const color = markerData.color || '#ef4444';
            const iconType = markerData.icon || 'pin';
            const shape = markerData.shape || 'pin';
            const title = markerData.title || '';

            const iconHtml = this.generateMarkerIconSvg(iconType, color, shape, title);
            const customIcon = L.divIcon({
                className: 'panoptes-custom-marker-icon',
                html: iconHtml,
                iconSize: [36, 44],
                iconAnchor: [18, 42],
                popupAnchor: [0, -38]
            });

            const marker = L.marker([lat, lng], {
                icon: customIcon,
                title: title,
                riseOnHover: true
            });

            marker.panoptesData = markerData;
            marker.panoptesId = markerId;

            // Popup şablonu
            if (markerData.popupTemplate) {
                marker.bindPopup(markerData.popupTemplate, {
                    className: 'panoptes-map-popup',
                    maxWidth: 320,
                    minWidth: 220
                });
            } else if (title || markerData.tooltip) {
                const defaultPopup = `
                    <div class="p-2.5">
                        <div class="font-bold text-slate-800 text-sm mb-1">${title || 'Konum Bilgisi'}</div>
                        ${markerData.tooltip ? `<div class="text-xs text-slate-600">${markerData.tooltip}</div>` : ''}
                        <div class="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                            <span>📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                        </div>
                    </div>
                `;
                marker.bindPopup(defaultPopup, { className: 'panoptes-map-popup', maxWidth: 280 });
            }

            // Tooltip (hover)
            if (markerData.tooltip && !markerData.popupTemplate) {
                marker.bindTooltip(markerData.tooltip, { direction: 'top', offset: [0, -38] });
            }

            // Tıklama Olayı
            marker.on('click', () => {
                this.triggerEvent('on-marker-click', {
                    marker: markerData,
                    lat: lat,
                    lng: lng,
                    id: markerId
                });
            });

            this.markerLayerGroup.addLayer(marker);
            this.markers.push(marker);

            return marker;
        }

        removeMarker(markerId) {
            const index = this.markers.findIndex(m => m.panoptesId === markerId);
            if (index !== -1) {
                const marker = this.markers[index];
                this.markerLayerGroup.removeLayer(marker);
                this.markers.splice(index, 1);
            }
        }

        clearMarkers() {
            this.markerLayerGroup.clearLayers();
            this.markers = [];
        }

        generateMarkerIconSvg(iconType, color, shape, title) {
            let glyph = '';
            switch (iconType) {
                case 'star':
                    glyph = '<path fill="#fff" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
                    break;
                case 'building':
                case 'store':
                    glyph = '<path fill="#fff" d="M4 21V9l8-6 8 6v12h-6v-7h-4v7H4z"/>';
                    break;
                case 'hospital':
                    glyph = '<path fill="#fff" d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>';
                    break;
                case 'airport':
                    glyph = '<path fill="#fff" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>';
                    break;
                case 'info':
                    glyph = '<circle cx="12" cy="7" r="1.5" fill="#fff"/><rect x="10.5" y="11" width="3" height="8" rx="1.5" fill="#fff"/>';
                    break;
                case 'dot':
                    glyph = '<circle cx="12" cy="12" r="4.5" fill="#fff"/>';
                    break;
                case 'pin':
                default:
                    glyph = '<circle cx="12" cy="10" r="3.5" fill="#fff"/>';
                    break;
            }

            if (shape === 'circle') {
                return `
                    <div class="panoptes-marker-wrapper relative group cursor-pointer transform hover:scale-110 transition-transform">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24">${glyph}</svg>
                        </div>
                        <div class="absolute -inset-1 rounded-full animate-ping opacity-30 pointer-events-none" style="background-color: ${color}"></div>
                    </div>
                `;
            }

            return `
                <div class="panoptes-marker-wrapper relative group cursor-pointer filter drop-shadow-md hover:drop-shadow-xl transform hover:-translate-y-1 transition-all">
                    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 43C18 43 34 27.5 34 17C34 8.16344 26.8366 1 18 1C9.16344 1 2 8.16344 2 17C2 27.5 18 43 18 43Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                        <g transform="translate(6, 4) scale(1)">
                            ${glyph}
                        </g>
                    </svg>
                </div>
            `;
        }

        loadRemoteMarkers(url) {
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    const items = Array.isArray(data) ? data : (data.items || data.data || []);
                    items.forEach(m => this.addMarker(m));
                })
                .catch(err => console.error('Panoptes Map marker veri yükleme hatası:', err));
        }

        // ==================== BUBBLE LAYER ====================
        renderBubbles(items, layerCfg) {
            if (!this.map || !items || !Array.isArray(items)) return;

            const latField = layerCfg.latField || 'lat';
            const lngField = layerCfg.lngField || 'lng';
            const valField = layerCfg.valueField || 'value';
            const minSize = layerCfg.minSize || 10;
            const maxSize = layerCfg.maxSize || 55;
            const baseColor = layerCfg.color || '#3b82f6';

            const values = items.map(x => parseFloat(x[valField]) || 0);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = (maxVal - minVal) || 1;

            items.forEach(item => {
                const lat = parseFloat(item[latField]);
                const lng = parseFloat(item[lngField]);
                const val = parseFloat(item[valField]) || 0;
                if (isNaN(lat) || isNaN(lng)) return;

                const normalized = (val - minVal) / range;
                const radius = minSize + normalized * (maxSize - minSize);

                const circle = L.circleMarker([lat, lng], {
                    radius: radius,
                    fillColor: item.color || baseColor,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 0.95,
                    fillOpacity: 0.65
                });

                circle.on('mouseover', () => {
                    circle.setStyle({ fillOpacity: 0.9, weight: 3 });
                });
                circle.on('mouseout', () => {
                    circle.setStyle({ fillOpacity: 0.65, weight: 2 });
                });

                let tooltipContent = `
                    <div class="p-1 font-sans">
                        <div class="font-bold text-slate-800 text-xs">${item.title || item.name || 'Konum'}</div>
                        <div class="text-indigo-600 font-semibold text-xs mt-0.5">${val.toLocaleString()} ${item.unit || ''}</div>
                    </div>
                `;
                if (layerCfg.tooltipTemplate) {
                    tooltipContent = layerCfg.tooltipTemplate
                        .replace('{title}', item.title || item.name || '')
                        .replace('{value}', val.toLocaleString())
                        .replace('{unit}', item.unit || '');
                }

                circle.bindTooltip(tooltipContent, {
                    sticky: true,
                    direction: 'top',
                    className: 'panoptes-bubble-tooltip'
                });

                circle.on('click', () => {
                    this.triggerEvent('on-shape-click', { item, val, lat, lng });
                });

                this.bubbleLayerGroup.addLayer(circle);
            });
        }

        loadRemoteBubbles(url, layerCfg) {
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    const items = Array.isArray(data) ? data : (data.items || data.data || []);
                    this.renderBubbles(items, layerCfg);
                })
                .catch(err => console.error('Panoptes Map bubble veri yükleme hatası:', err));
        }

        // ==================== GEOJSON & SHAPE LAYER ====================
        renderGeoJson(geoJsonData, layerCfg) {
            if (!this.map || !geoJsonData) return;

            const defaultFill = layerCfg.fillColor || layerCfg.color || '#3b82f6';
            const defaultStroke = layerCfg.strokeColor || '#1d4ed8';
            const strokeWidth = layerCfg.strokeWidth || 1.5;
            const opacity = layerCfg.opacity !== undefined ? layerCfg.opacity : 0.6;

            const geoLayer = L.geoJSON(geoJsonData, {
                style: (feature) => {
                    const props = feature.properties || {};
                    return {
                        fillColor: props.fillColor || defaultFill,
                        weight: strokeWidth,
                        opacity: 1,
                        color: props.strokeColor || defaultStroke,
                        dashArray: props.dashArray || '',
                        fillOpacity: props.fillOpacity || opacity
                    };
                },
                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};

                    layer.on({
                        mouseover: (e) => {
                            const l = e.target;
                            l.setStyle({
                                weight: strokeWidth + 2,
                                color: '#1e40af',
                                fillOpacity: 0.85
                            });
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                l.bringToFront();
                            }
                            this.triggerEvent('on-shape-mouse-enter', { feature, properties: props });
                        },
                        mouseout: (e) => {
                            geoLayer.resetStyle(e.target);
                            this.triggerEvent('on-shape-mouse-leave', { feature, properties: props });
                        },
                        click: (e) => {
                            this.triggerEvent('on-shape-click', { feature, properties: props, latlng: e.latlng });
                        }
                    });

                    const label = props.name || props.title || props.id;
                    if (label) {
                        let tooltipContent = `<div class="p-1 font-sans">
                            <div class="font-bold text-slate-800 text-xs">${label}</div>
                            ${props.value !== undefined ? `<div class="text-xs text-indigo-600 font-medium">Değer: ${props.value}</div>` : ''}
                        </div>`;
                        layer.bindTooltip(tooltipContent, { sticky: true, className: 'panoptes-geojson-tooltip' });
                    }
                }
            });

            this.shapeLayerGroup.addLayer(geoLayer);
            return geoLayer;
        }

        clearShapes() {
            if (this.shapeLayerGroup) {
                this.shapeLayerGroup.clearLayers();
            }
        }

        loadGeoJson(url, layerCfg = {}) {
            this.clearShapes();
            this.loadRemoteGeoJson(url, layerCfg);
        }

        loadRemoteGeoJson(url, layerCfg) {
            fetch(url)
                .then(r => r.json())
                .then(geoJson => this.renderGeoJson(geoJson, layerCfg))
                .catch(err => console.error('Panoptes Map GeoJSON veri yükleme hatası:', err));
        }

        // ==================== İSTEMCİ API METOTLARI ====================
        center(lat, lng, zoom) {
            if (!this.map) return;
            let target = null;
            if (Array.isArray(lat)) {
                target = [parseFloat(lat[0]), parseFloat(lat[1])];
                if (typeof lng === 'number') zoom = lng;
            } else if (typeof lat === 'object' && lat !== null && lat.lat !== undefined) {
                target = [parseFloat(lat.lat), parseFloat(lat.lng)];
                if (typeof lng === 'number') zoom = lng;
            } else if (lat !== undefined && lng !== undefined) {
                target = [parseFloat(lat), parseFloat(lng)];
            }

            if (!target || isNaN(target[0]) || isNaN(target[1])) return;

            const targetZoom = (zoom !== undefined && zoom !== null && !isNaN(zoom)) ? parseInt(zoom, 10) : this.map.getZoom();

            try {
                this.map.setView(target, targetZoom, { animate: true });
            } catch (e) {
                this.map.setView(target, targetZoom);
            }
        }

        flyTo(lat, lng, zoom) {
            if (!this.map) return;
            let target = null;
            if (Array.isArray(lat)) {
                target = [parseFloat(lat[0]), parseFloat(lat[1])];
                if (typeof lng === 'number') zoom = lng;
            } else if (typeof lat === 'object' && lat !== null && lat.lat !== undefined) {
                target = [parseFloat(lat.lat), parseFloat(lat.lng)];
                if (typeof lng === 'number') zoom = lng;
            } else if (lat !== undefined && lng !== undefined) {
                target = [parseFloat(lat), parseFloat(lng)];
            }

            if (!target || isNaN(target[0]) || isNaN(target[1])) return;

            const targetZoom = (zoom !== undefined && zoom !== null && !isNaN(zoom)) ? parseInt(zoom, 10) : this.map.getZoom();

            try {
                this.map.flyTo(target, targetZoom, { duration: 1.5 });
            } catch (e) {
                this.map.setView(target, targetZoom);
            }
        }

        setCenter(lat, lng, zoom) {
            this.center(lat, lng, zoom);
        }

        zoom(level) {
            if (this.map && level !== undefined && level !== null) {
                const z = parseInt(level, 10);
                if (!isNaN(z)) {
                    this.map.setZoom(z);
                }
            }
            return this.map ? this.map.getZoom() : this.zoomLevel;
        }

        setZoom(level) {
            this.zoom(level);
        }

        zoomIn() {
            if (this.map) this.map.zoomIn();
        }

        zoomOut() {
            if (this.map) this.map.zoomOut();
        }

        pan(dx, dy) {
            if (this.map) this.map.panBy([dx, dy]);
        }

        panTo(lat, lng, zoom) {
            this.center(lat, lng, zoom);
        }

        resetView() {
            if (this.map) {
                this.map.setView(this.centerCoords, this.zoomLevel);
            }
        }

        getBounds() {
            return this.map ? this.map.getBounds() : null;
        }

        fitBounds(bounds) {
            if (this.map && bounds) {
                this.map.fitBounds(bounds);
            }
        }

        switchTileLayer(layerTitle) {
            if (!this.map || !this.tileLayers[layerTitle]) return;

            if (this.activeTileLayer) {
                this.map.removeLayer(this.activeTileLayer);
            }

            this.activeTileLayer = this.tileLayers[layerTitle];
            this.activeTileLayerTitle = layerTitle;
            this.activeTileLayer.addTo(this.map);
            this.activeTileLayer.bringToBack();
        }

        setLayerOpacity(layerTitle, opacity) {
            const layer = this.tileLayers[layerTitle] || this.activeTileLayer;
            if (layer && typeof layer.setOpacity === 'function') {
                layer.setOpacity(opacity);
            }
        }

        setLayerVisibility(type, visible) {
            if (type === 'marker') {
                if (visible) this.map.addLayer(this.markerLayerGroup);
                else this.map.removeLayer(this.markerLayerGroup);
            } else if (type === 'bubble') {
                if (visible) this.map.addLayer(this.bubbleLayerGroup);
                else this.map.removeLayer(this.bubbleLayerGroup);
            } else if (type === 'shape') {
                if (visible) this.map.addLayer(this.shapeLayerGroup);
                else this.map.removeLayer(this.shapeLayerGroup);
            }
        }

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                this.container.requestFullscreen?.().then(() => {
                    setTimeout(() => this.map.invalidateSize(), 200);
                });
            } else {
                document.exitFullscreen?.().then(() => {
                    setTimeout(() => this.map.invalidateSize(), 200);
                });
            }
        }

        exportPNG(filename = 'panoptes-harita.png') {
            if (!this.viewport) return;

            const canvas = document.createElement('canvas');
            const rect = this.viewport.getBoundingClientRect();
            canvas.width = rect.width * 2;
            canvas.height = rect.height * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, rect.width, rect.height);

            const tiles = this.viewport.querySelectorAll('.leaflet-tile-pane img');
            const promises = Array.from(tiles).map(img => {
                return new Promise((resolve) => {
                    const imgRect = img.getBoundingClientRect();
                    const x = imgRect.left - rect.left;
                    const y = imgRect.top - rect.top;

                    const proxyImg = new Image();
                    proxyImg.crossOrigin = 'Anonymous';
                    proxyImg.onload = () => {
                        try {
                            ctx.drawImage(proxyImg, x, y, imgRect.width, imgRect.height);
                        } catch (e) {}
                        resolve();
                    };
                    proxyImg.onerror = () => resolve();
                    proxyImg.src = img.src;
                });
            });

            Promise.all(promises).then(() => {
                const svgOverlay = this.viewport.querySelector('.leaflet-overlay-pane svg');
                if (svgOverlay) {
                    const svgData = new XMLSerializer().serializeToString(svgOverlay);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const URL = window.URL || window.webkitURL || window;
                    const blobURL = URL.createObjectURL(svgBlob);
                    const overlayImg = new Image();
                    overlayImg.onload = () => {
                        ctx.drawImage(overlayImg, 0, 0);
                        this.finalizeCanvasExport(canvas, filename, ctx, rect);
                    };
                    overlayImg.onerror = () => {
                        this.finalizeCanvasExport(canvas, filename, ctx, rect);
                    };
                    overlayImg.src = blobURL;
                } else {
                    this.finalizeCanvasExport(canvas, filename, ctx, rect);
                }
            });
        }

        finalizeCanvasExport(canvas, filename, ctx, rect) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Panoptes Map Export', 16, rect.height - 18);

            ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(new Date().toLocaleString('tr-TR'), 16, rect.height - 34);

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        exportSVG(filename = 'panoptes-harita.svg') {
            const svgOverlay = this.viewport.querySelector('.leaflet-overlay-pane svg');
            if (!svgOverlay) {
                alert('Vektörel dışa aktarım için haritada aktif vektör/şekil katmanı bulunmalıdır.');
                return;
            }
            const svgData = new XMLSerializer().serializeToString(svgOverlay);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const link = document.createElement('a');
            link.download = filename;
            link.href = URL.createObjectURL(blob);
            link.click();
        }

        destroy() {
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
            delete Panoptes.Map.instances[this.id];
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Panoptes.Map.initAll());
    } else {
        Panoptes.Map.initAll();
    }

})();
