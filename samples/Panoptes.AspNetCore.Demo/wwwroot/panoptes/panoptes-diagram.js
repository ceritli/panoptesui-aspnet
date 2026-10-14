/**
 * Panoptes Diagram & OrgChart Component (Görsel Akış ve Organizasyon Ağacı)
 * Panoptes ASP.NET Core Diagram Bileşeni
 * Düğüm Ekleme, Çıkarma, Bağlantı Kurma, Sürükle-Bırak, Pan/Zoom & SVG Dışa Aktarma
 */

(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Diagram = window.Panoptes.Diagram || {
        instances: {},

        getInstance: function (id) {
            return this.instances[id] || null;
        },

        init: function (container) {
            if (!container) return;
            const id = container.id || ('panoptes-diag-' + Math.random().toString(36).substring(2, 9));
            if (this.instances[id]) return;

            const instance = new PanoptesDiagramInstance(container);
            this.instances[id] = instance;
            return instance;
        },

        initAll: function () {
            document.querySelectorAll('[data-panoptes-diagram="true"]').forEach(el => {
                this.init(el);
            });
        }
    };

    class PanoptesDiagramInstance {
        constructor(container) {
            this.container = container;
            this.id = container.id;
            this.layout = container.getAttribute('data-layout') || 'flowchart';
            this.onNodeSelect = container.getAttribute('data-on-node-select');

            const nodesScript = container.querySelector('.panoptes-diag-nodes');
            const connsScript = container.querySelector('.panoptes-diag-conns');

            this.nodes = nodesScript ? JSON.parse(nodesScript.textContent || '[]') : [];
            this.connections = connsScript ? JSON.parse(connsScript.textContent || '[]') : [];

            // Yedek başlangıç verisi (Sıfırla / Reset için)
            this.initialNodes = JSON.parse(JSON.stringify(this.nodes));
            this.initialConnections = JSON.parse(JSON.stringify(this.connections));

            this.viewport = container.querySelector('.panoptes-diag-viewport');
            this.svg = container.querySelector('.panoptes-diag-svg');
            this.canvasGroup = container.querySelector('.panoptes-diag-canvas-group');

            this.scale = 1;
            this.tx = 40;
            this.ty = 40;
            this.isDraggingCanvas = false;
            this.draggingNode = null;
            this.dragNodeOffset = { x: 0, y: 0 };
            this.lastMouse = { x: 0, y: 0 };
            this.selectedNodeId = null;

            this.initEvents();
            this.autoLayoutIfNeeded();
            this.render();
            this.fit();
        }

        autoLayoutIfNeeded() {
            if (this.nodes.length === 0) return;
            const allZero = this.nodes.every(n => (n.X === 0 || n.X === undefined) && (n.Y === 0 || n.Y === undefined));
            if (!allZero) return;

            if (this.layout === 'orgchart') {
                const fromMap = {};
                this.connections.forEach(c => {
                    fromMap[c.From] = fromMap[c.From] || [];
                    fromMap[c.From].push(c.To);
                });

                const allTargets = new Set(this.connections.map(c => c.To));
                const roots = this.nodes.filter(n => !allTargets.has(n.Id));

                const nodeMap = {};
                this.nodes.forEach(n => { nodeMap[n.Id] = n; });

                const layoutLevel = (nodeIds, y, startX) => {
                    let curX = startX;
                    nodeIds.forEach(id => {
                        const n = nodeMap[id];
                        if (n) {
                            n.X = curX;
                            n.Y = y;
                            const children = fromMap[id] || [];
                            if (children.length > 0) {
                                layoutLevel(children, y + 130, curX - (children.length - 1) * 110);
                            }
                            curX += 230;
                        }
                    });
                };

                layoutLevel(roots.map(r => r.Id), 40, 200);
            } else {
                this.nodes.forEach((n, idx) => {
                    n.X = 40 + (idx % 3) * 230;
                    n.Y = 60 + Math.floor(idx / 3) * 150;
                });
            }
        }

        initEvents() {
            if (this.viewport) {
                // Tuval Kaydırma (Pan) veya Düğüm Taşıma (Drag & Drop)
                this.viewport.addEventListener('mousedown', (e) => {
                    const nodeEl = e.target.closest('.panoptes-diag-node');
                    if (nodeEl) {
                        const nodeId = nodeEl.getAttribute('data-id');
                        const node = this.nodes.find(n => n.Id === nodeId);
                        if (node) {
                            this.draggingNode = node;
                            const rect = this.viewport.getBoundingClientRect();
                            const mouseX = (e.clientX - rect.left - this.tx) / this.scale;
                            const mouseY = (e.clientY - rect.top - this.ty) / this.scale;
                            this.dragNodeOffset = {
                                x: mouseX - node.X,
                                y: mouseY - node.Y
                            };
                            this.selectNode(nodeId);
                        }
                        return;
                    }

                    this.isDraggingCanvas = true;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                });

                window.addEventListener('mousemove', (e) => {
                    if (this.draggingNode) {
                        const rect = this.viewport.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left - this.tx) / this.scale;
                        const mouseY = (e.clientY - rect.top - this.ty) / this.scale;
                        this.draggingNode.X = Math.round(mouseX - this.dragNodeOffset.x);
                        this.draggingNode.Y = Math.round(mouseY - this.dragNodeOffset.y);
                        this.render();
                        return;
                    }

                    if (this.isDraggingCanvas) {
                        const dx = e.clientX - this.lastMouse.x;
                        const dy = e.clientY - this.lastMouse.y;
                        this.tx += dx;
                        this.ty += dy;
                        this.lastMouse = { x: e.clientX, y: e.clientY };
                        this.updateTransform();
                    }
                });

                window.addEventListener('mouseup', () => {
                    this.isDraggingCanvas = false;
                    this.draggingNode = null;
                });

                // Fare tekerleğiyle yakınlaştırma (Zoom)
                this.viewport.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                    this.zoom(zoomFactor, e.clientX, e.clientY);
                }, { passive: false });
            }

            // Araç Çubuğu Butonları
            const btnZoomIn = this.container.querySelector('.panoptes-diag-btn-zoomin');
            if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.zoom(1.2));

            const btnZoomOut = this.container.querySelector('.panoptes-diag-btn-zoomout');
            if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.zoom(0.8));

            const btnFit = this.container.querySelector('.panoptes-diag-btn-fit');
            if (btnFit) btnFit.addEventListener('click', () => this.fit());

            const btnExport = this.container.querySelector('.panoptes-diag-btn-export');
            if (btnExport) btnExport.addEventListener('click', () => this.exportSvg());

            // Klavye ile Seçili Düğümü Silme (Delete / Backspace)
            window.addEventListener('keydown', (e) => {
                if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNodeId) {
                    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                    this.removeNode(this.selectedNodeId);
                }
            });
        }

        zoom(factor, clientX, clientY) {
            const oldScale = this.scale;
            this.scale = Math.min(3.0, Math.max(0.3, this.scale * factor));

            if (clientX !== undefined && clientY !== undefined && this.viewport) {
                const rect = this.viewport.getBoundingClientRect();
                const mouseX = clientX - rect.left;
                const mouseY = clientY - rect.top;

                this.tx = mouseX - (mouseX - this.tx) * (this.scale / oldScale);
                this.ty = mouseY - (mouseY - this.ty) * (this.scale / oldScale);
            }
            this.updateTransform();
        }

        updateTransform() {
            if (this.canvasGroup) {
                this.canvasGroup.setAttribute('transform', `translate(${this.tx}, ${this.ty}) scale(${this.scale})`);
            }
        }

        fit() {
            if (!this.viewport || this.nodes.length === 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            this.nodes.forEach(n => {
                const w = n.Width || 180;
                const h = n.Height || 70;
                if (n.X < minX) minX = n.X;
                if (n.Y < minY) minY = n.Y;
                if (n.X + w > maxX) maxX = n.X + w;
                if (n.Y + h > maxY) maxY = n.Y + h;
            });

            const vpRect = this.viewport.getBoundingClientRect();
            const padding = 50;
            const contentW = (maxX - minX) + padding * 2;
            const contentH = (maxY - minY) + padding * 2;

            if (contentW > 0 && contentH > 0 && vpRect.width > 0) {
                const scaleX = vpRect.width / contentW;
                const scaleY = vpRect.height / contentH;
                this.scale = Math.min(1.2, Math.max(0.4, Math.min(scaleX, scaleY)));
                this.tx = (vpRect.width - (maxX - minX) * this.scale) / 2 - minX * this.scale;
                this.ty = (vpRect.height - (maxY - minY) * this.scale) / 2 - minY * this.scale;
                this.updateTransform();
            }
        }

        render() {
            if (!this.canvasGroup) return;
            this.canvasGroup.innerHTML = '';

            const nodeMap = {};
            this.nodes.forEach(n => { nodeMap[n.Id] = n; });

            // 1. Bağlantıları Çiz (Düğümlerin altında kalması için önce çizilir)
            this.connections.forEach(conn => {
                const fromNode = nodeMap[conn.From];
                const toNode = nodeMap[conn.To];
                if (!fromNode || !toNode) return;

                const fromW = fromNode.Width || 180;
                const fromH = fromNode.Height || 70;
                const toW = toNode.Width || 180;
                const toH = toNode.Height || 70;

                let startX, startY, endX, endY;

                if (Math.abs(fromNode.Y - toNode.Y) > Math.abs(fromNode.X - toNode.X)) {
                    // Dikey akış
                    if (fromNode.Y < toNode.Y) {
                        startX = fromNode.X + fromW / 2;
                        startY = fromNode.Y + fromH;
                        endX = toNode.X + toW / 2;
                        endY = toNode.Y;
                    } else {
                        startX = fromNode.X + fromW / 2;
                        startY = fromNode.Y;
                        endX = toNode.X + toW / 2;
                        endY = toNode.Y + toH;
                    }
                } else {
                    // Yatay akış
                    if (fromNode.X < toNode.X) {
                        startX = fromNode.X + fromW;
                        startY = fromNode.Y + fromH / 2;
                        endX = toNode.X;
                        endY = toNode.Y + toH / 2;
                    } else {
                        startX = fromNode.X;
                        startY = fromNode.Y + fromH / 2;
                        endX = toNode.X + toW;
                        endY = toNode.Y + toH / 2;
                    }
                }

                // Yumuşak Bezier Eğrisi
                const dx = Math.abs(endX - startX) * 0.5;
                const dy = Math.abs(endY - startY) * 0.5;
                const cp1X = startX + (endX > startX ? dx : -dx);
                const cp2X = endX - (endX > startX ? dx : -dx);

                const d = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', conn.Color || '#64748b');
                path.setAttribute('stroke-width', '2');
                if (conn.Dashed) {
                    path.setAttribute('stroke-dasharray', '4,4');
                }
                path.setAttribute('marker-end', 'url(#diag-arrow)');
                this.canvasGroup.appendChild(path);

                // Bağlantı etiketi
                if (conn.Label) {
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;

                    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    const textLen = (conn.Label.length * 7) + 12;
                    labelBg.setAttribute('x', midX - textLen / 2);
                    labelBg.setAttribute('y', midY - 10);
                    labelBg.setAttribute('width', textLen);
                    labelBg.setAttribute('height', '20');
                    labelBg.setAttribute('rx', '4');
                    labelBg.setAttribute('fill', '#1e293b');
                    labelBg.setAttribute('stroke', '#334155');

                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY + 4);
                    text.setAttribute('fill', '#cbd5e1');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-family', 'sans-serif');
                    text.textContent = conn.Label;

                    labelGroup.appendChild(labelBg);
                    labelGroup.appendChild(text);
                    this.canvasGroup.appendChild(labelGroup);
                }
            });

            // 2. Düğümleri Çiz
            this.nodes.forEach(n => {
                const w = n.Width || 180;
                const h = n.Height || 70;

                const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                nodeGroup.setAttribute('class', 'panoptes-diag-node cursor-move group');
                nodeGroup.setAttribute('data-id', n.Id);
                nodeGroup.setAttribute('transform', `translate(${n.X}, ${n.Y})`);

                const colorTheme = this.getColorTheme(n.Color);

                // Arka plan kutusu
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('width', w);
                rect.setAttribute('height', h);
                rect.setAttribute('rx', n.Shape === 'pill' ? h / 2 : 12);
                rect.setAttribute('fill', '#1e293b');
                rect.setAttribute('stroke', this.selectedNodeId === n.Id ? '#38bdf8' : colorTheme.border);
                rect.setAttribute('stroke-width', this.selectedNodeId === n.Id ? '3' : '1.5');
                rect.setAttribute('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');

                // Sol renk şeridi
                const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bar.setAttribute('width', '5');
                bar.setAttribute('height', h - 16);
                bar.setAttribute('x', '8');
                bar.setAttribute('y', '8');
                bar.setAttribute('rx', '2');
                bar.setAttribute('fill', colorTheme.accent);

                // Başlık
                const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                titleText.setAttribute('x', 24);
                titleText.setAttribute('y', n.Subtitle ? 28 : h / 2 + 5);
                titleText.setAttribute('fill', '#f8fafc');
                titleText.setAttribute('font-size', '12');
                titleText.setAttribute('font-weight', 'bold');
                titleText.setAttribute('font-family', 'sans-serif');
                titleText.textContent = n.Title;

                nodeGroup.appendChild(rect);
                nodeGroup.appendChild(bar);
                nodeGroup.appendChild(titleText);

                // Alt başlık
                if (n.Subtitle) {
                    const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    subText.setAttribute('x', 24);
                    subText.setAttribute('y', 48);
                    subText.setAttribute('fill', '#94a3b8');
                    subText.setAttribute('font-size', '10');
                    subText.setAttribute('font-family', 'sans-serif');
                    subText.textContent = n.Subtitle;
                    nodeGroup.appendChild(subText);
                }

                // Düğüm seçimi
                nodeGroup.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectNode(n.Id);
                });

                this.canvasGroup.appendChild(nodeGroup);
            });
        }

        getColorTheme(colorName) {
            switch (colorName) {
                case 'emerald':
                    return { border: '#059669', accent: '#10b981' };
                case 'amber':
                    return { border: '#d97706', accent: '#f59e0b' };
                case 'rose':
                    return { border: '#e11d48', accent: '#f43f5e' };
                case 'purple':
                    return { border: '#7c3aed', accent: '#a855f7' };
                case 'blue':
                default:
                    return { border: '#2563eb', accent: '#3b82f6' };
            }
        }

        selectNode(nodeId) {
            this.selectedNodeId = nodeId;
            this.render();

            const n = this.nodes.find(x => x.Id === nodeId);
            if (this.onNodeSelect && typeof window[this.onNodeSelect] === 'function') {
                window[this.onNodeSelect](n);
            }

            const evt = new CustomEvent('panoptes:diagram:nodeSelect', {
                bubbles: true,
                detail: { diagramId: this.id, node: n }
            });
            this.container.dispatchEvent(evt);
        }

        /**
         * DİNAMİK VERİ YÖNETİMİ (CRUD API)
         */

        /**
         * Yeni düğüm ekler ve opsiyonel olarak mevcut bir düğüme bağlar.
         * @param {Object} node { Id, Title, Subtitle, Color, Shape, X, Y, Width, Height, connectFrom, connectTo, connectionLabel }
         */
        addNode(node) {
            if (!node) return null;

            node.Id = node.Id || ('node_' + Math.random().toString(36).substring(2, 8));
            node.Title = node.Title || 'Yeni Düğüm';
            node.Subtitle = node.Subtitle || '';
            node.Color = node.Color || 'blue';
            node.Shape = node.Shape || 'rounded';
            node.Width = node.Width || 180;
            node.Height = node.Height || 70;

            // Eğer koordinat belirtilmemişse, otomatik yerleşim hesapla
            if (node.X === undefined || node.Y === undefined) {
                if (node.connectFrom) {
                    const parent = this.nodes.find(n => n.Id === node.connectFrom);
                    if (parent) {
                        node.X = parent.X + (this.layout === 'orgchart' ? 0 : 220);
                        node.Y = parent.Y + (this.layout === 'orgchart' ? 140 : 0);
                    }
                } else if (this.nodes.length > 0) {
                    let maxX = -Infinity, maxY = -Infinity;
                    this.nodes.forEach(n => {
                        if (n.X > maxX) maxX = n.X;
                        if (n.Y > maxY) maxY = n.Y;
                    });
                    node.X = this.layout === 'orgchart' ? maxX + 100 : (this.nodes.length % 3 === 0 ? 40 : maxX + 220);
                    node.Y = this.layout === 'orgchart' ? maxY : (this.nodes.length % 3 === 0 ? maxY + 150 : 60);
                } else {
                    node.X = 40;
                    node.Y = 60;
                }
            }

            this.nodes.push(node);

            // Bağlantı oluştur
            if (node.connectFrom) {
                this.addConnection(node.connectFrom, node.Id, node.connectionLabel || 'Devam');
            }
            if (node.connectTo) {
                this.addConnection(node.Id, node.connectTo, node.connectionLabel || 'İletim');
            }

            this.render();
            this.selectNode(node.Id);

            const evt = new CustomEvent('panoptes:diagram:nodeAdded', {
                bubbles: true,
                detail: { diagramId: this.id, node: node }
            });
            this.container.dispatchEvent(evt);

            return node;
        }

        /**
         * Düğümü ve ona bağlı tüm okları/bağlantıları siler.
         * @param {string} nodeId - Silinecek düğümün ID'si. Boş bırakılırsa seçili düğüm silinir.
         */
        removeNode(nodeId) {
            const targetId = nodeId || this.selectedNodeId;
            if (!targetId) return null;

            const idx = this.nodes.findIndex(n => n.Id === targetId);
            if (idx === -1) return null;

            const removedNode = this.nodes.splice(idx, 1)[0];

            // Düğüme bağlı tüm bağlantıları temizle
            this.connections = this.connections.filter(c => c.From !== targetId && c.To !== targetId);

            if (this.selectedNodeId === targetId) {
                this.selectedNodeId = null;
                if (this.onNodeSelect && typeof window[this.onNodeSelect] === 'function') {
                    window[this.onNodeSelect](null);
                }
            }

            this.render();

            const evt = new CustomEvent('panoptes:diagram:nodeRemoved', {
                bubbles: true,
                detail: { diagramId: this.id, node: removedNode }
            });
            this.container.dispatchEvent(evt);

            return removedNode;
        }

        /**
         * İki düğüm arasında yeni bağlantı oku oluşturur.
         */
        addConnection(fromId, toId, label, color, dashed) {
            if (!fromId || !toId || fromId === toId) return false;

            const fromExists = this.nodes.some(n => n.Id === fromId);
            const toExists = this.nodes.some(n => n.Id === toId);
            if (!fromExists || !toExists) return false;

            // Zaten mevcut mu?
            const exists = this.connections.some(c => c.From === fromId && c.To === toId);
            if (exists) return false;

            const conn = {
                From: fromId,
                To: toId,
                Label: label || '',
                Color: color || '#64748b',
                Dashed: !!dashed
            };

            this.connections.push(conn);
            this.render();

            const evt = new CustomEvent('panoptes:diagram:connectionAdded', {
                bubbles: true,
                detail: { diagramId: this.id, connection: conn }
            });
            this.container.dispatchEvent(evt);

            return true;
        }

        /**
         * İki düğüm arasındaki bağlantıyı kaldırır.
         */
        removeConnection(fromId, toId) {
            this.connections = this.connections.filter(c => !(c.From === fromId && c.To === toId));
            this.render();
        }

        /**
         * Düğüm özelliklerini günceller.
         */
        updateNode(nodeId, newProps) {
            const node = this.nodes.find(n => n.Id === nodeId);
            if (!node || !newProps) return false;

            Object.assign(node, newProps);
            this.render();
            return true;
        }

        /**
         * Tüm düğümleri ve bağlantıları temizler.
         */
        clear() {
            this.nodes = [];
            this.connections = [];
            this.selectedNodeId = null;
            this.render();
        }

        /**
         * Başlangıçtaki orijinal şablon verilerine sıfırlar.
         */
        reset() {
            this.nodes = JSON.parse(JSON.stringify(this.initialNodes));
            this.connections = JSON.parse(JSON.stringify(this.initialConnections));
            this.selectedNodeId = null;
            this.autoLayoutIfNeeded();
            this.render();
            this.fit();
        }

        getNodes() {
            return this.nodes;
        }

        getConnections() {
            return this.connections;
        }

        getSelectedNode() {
            return this.nodes.find(n => n.Id === this.selectedNodeId) || null;
        }

        exportSvg() {
            if (!this.svg) return;
            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(this.svg);
            const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const link = document.createElement('a');
            link.download = `Panoptes_Diagram_${new Date().toISOString().substring(0, 10)}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.Panoptes.Diagram.initAll();
    });
})();
