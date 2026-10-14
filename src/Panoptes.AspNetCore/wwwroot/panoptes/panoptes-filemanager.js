(function () {
    if (!window.Panoptes) window.Panoptes = {};

    class FileManagerInstance {
        constructor(id) {
            this.id = id;
            this.wrapper = document.getElementById(id);
            if (!this.wrapper) return;

            const script = this.wrapper.querySelector(`script[data-panoptes-filemanager-config="${id}"]`);
            this.config = script ? JSON.parse(script.textContent) : {};

            this.currentPath = "/";
            this.files = [];
            
            this.elements = {
                toolbar: this.wrapper.querySelector('.pfm-toolbar'),
                treeview: this.wrapper.querySelector('.pfm-treeview-pane'),
                breadcrumb: this.wrapper.querySelector('.pfm-breadcrumb'),
                grid: this.wrapper.querySelector('.pfm-grid-pane'),
                preview: this.wrapper.querySelector('.pfm-preview-pane'),
                emptyState: this.wrapper.querySelector('.pfm-empty-state')
            };

            this.init();
        }

        init() {
            this.renderToolbar();
            this.renderBreadcrumb();
            this.loadData();
        }

        renderToolbar() {
            this.elements.toolbar.innerHTML = `
                <div class="flex items-center gap-1">
                    <button class="pfm-btn-newfolder px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
                        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1h-3m-6 5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-3" /></svg>
                        Yeni Klasör
                    </button>
                    <button class="pfm-btn-upload px-3 py-1.5 bg-blue-600 border border-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 flex items-center gap-1.5 shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Yükle
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <input type="text" class="pfm-search pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-48" placeholder="Ara..." />
                        <svg class="w-4 h-4 absolute left-2.5 top-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            `;
            
            this.elements.toolbar.querySelector('.pfm-btn-upload').onclick = () => alert('Yükleme simülasyonu çalıştı.');
            this.elements.toolbar.querySelector('.pfm-btn-newfolder').onclick = () => alert('Yeni klasör simülasyonu çalıştı.');
            this.elements.toolbar.querySelector('.pfm-search').addEventListener('input', (e) => {
                this.filterFiles(e.target.value);
            });
        }

        renderBreadcrumb() {
            const parts = this.currentPath.split('/').filter(Boolean);
            let html = `<button class="pfm-bc-home hover:bg-slate-100 p-1 rounded transition text-slate-400 hover:text-slate-700" data-path="/"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></button>`;
            
            let cur = "";
            parts.forEach((p, i) => {
                cur += "/" + p;
                html += `<svg class="w-3.5 h-3.5 mx-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;
                html += `<button class="pfm-bc-link hover:underline hover:text-blue-600 transition truncate max-w-[100px]" data-path="${cur}">${this.escape(p)}</button>`;
            });

            this.elements.breadcrumb.innerHTML = html;
            
            this.elements.breadcrumb.querySelectorAll('button[data-path]').forEach(btn => {
                btn.onclick = () => {
                    this.currentPath = btn.dataset.path;
                    this.loadData();
                };
            });
        }

        async loadData() {
            if (!this.config.urls.read) {
                // Mock Data
                this.files = [
                    { name: 'Belgeler', isDirectory: true, size: 0, date: '2026-10-10 14:30', ext: '' },
                    { name: 'Resimler', isDirectory: true, size: 0, date: '2026-10-10 15:45', ext: '' },
                    { name: 'rapor.pdf', isDirectory: false, size: 1024500, date: '2026-10-11 09:15', ext: '.pdf' },
                    { name: 'sunum.pptx', isDirectory: false, size: 2048000, date: '2026-10-11 11:20', ext: '.pptx' }
                ];
                if (this.currentPath !== "/") {
                    this.files = [
                        { name: 'gizli-dosya.txt', isDirectory: false, size: 1500, date: '2026-10-11 12:00', ext: '.txt' }
                    ];
                }
                this.renderGrid(this.files);
                this.renderTree();
                return;
            }

            try {
                const res = await fetch(this.config.urls.read + "?path=" + encodeURIComponent(this.currentPath));
                if (res.ok) {
                    this.files = await res.json();
                    this.renderGrid(this.files);
                    this.renderTree(); // Assuming we just render root folders if we have hierarchical data
                }
            } catch(e) {
                console.error("FileManager Error:", e);
            }
        }

        filterFiles(q) {
            if (!q) {
                this.renderGrid(this.files);
                return;
            }
            const ql = q.toLowerCase();
            this.renderGrid(this.files.filter(f => f.name.toLowerCase().includes(ql)));
        }

        renderGrid(files) {
            // Remove previous grid items except empty state
            Array.from(this.elements.grid.children).forEach(c => {
                if (c !== this.elements.emptyState) c.remove();
            });

            if (files.length === 0) {
                this.elements.emptyState.classList.remove('hidden');
                return;
            }
            this.elements.emptyState.classList.add('hidden');

            const view = document.createElement('div');
            view.className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2';

            files.forEach(f => {
                const el = document.createElement('div');
                el.className = 'pfm-file-item flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md transition cursor-pointer group relative';
                
                const iconHtml = f.isDirectory 
                    ? `<svg class="w-12 h-12 text-blue-400 group-hover:text-blue-500 transition" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`
                    : `<svg class="w-12 h-12 text-slate-400 group-hover:text-slate-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
                
                const sizeStr = f.isDirectory ? '' : this.formatSize(f.size);

                el.innerHTML = `
                    ${iconHtml}
                    <div class="mt-3 text-xs font-semibold text-slate-700 truncate w-full text-center group-hover:text-blue-600 transition" title="${this.escape(f.name)}">${this.escape(f.name)}</div>
                    ${f.isDirectory ? '' : `<div class="text-[10px] text-slate-400 mt-0.5">${sizeStr}</div>`}
                `;

                el.ondblclick = () => {
                    if (f.isDirectory) {
                        this.currentPath = (this.currentPath === "/" ? "/" : this.currentPath + "/") + f.name;
                        this.renderBreadcrumb();
                        this.loadData();
                    }
                };

                el.onclick = () => this.showPreview(f);

                view.appendChild(el);
            });

            this.elements.grid.appendChild(view);
        }

        renderTree() {
            // Very simplified tree view for folders
            const folders = this.files.filter(f => f.isDirectory);
            let html = `<div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Klasörler</div><ul class="space-y-1">`;
            html += `<li><button class="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-200/50 text-slate-700 text-sm transition ${this.currentPath==='/'?'bg-blue-50 text-blue-700 font-semibold':''}" data-tree-path="/"><svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg> Ana Dizin</button></li>`;
            
            // Just displaying the current level folders to avoid complex mock tree building
            folders.forEach(f => {
                const path = (this.currentPath === "/" ? "/" : this.currentPath + "/") + f.name;
                html += `<li><button class="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-200/50 text-slate-700 text-sm transition" data-tree-path="${path}"><svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg> ${this.escape(f.name)}</button></li>`;
            });
            html += `</ul>`;
            
            this.elements.treeview.innerHTML = html;

            this.elements.treeview.querySelectorAll('button[data-tree-path]').forEach(btn => {
                btn.onclick = () => {
                    this.currentPath = btn.dataset.treePath;
                    this.renderBreadcrumb();
                    this.loadData();
                };
            });
        }

        showPreview(f) {
            this.elements.preview.classList.remove('hidden');
            
            const iconHtml = f.isDirectory 
                ? `<svg class="w-24 h-24 text-blue-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`
                : `<svg class="w-24 h-24 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
            
            this.elements.preview.innerHTML = `
                <div class="text-right mb-4">
                    <button class="pfm-close-preview p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-100/50 hover:bg-slate-200 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                ${iconHtml}
                <div class="text-center mt-4">
                    <div class="font-bold text-slate-800 break-all text-sm">${this.escape(f.name)}</div>
                    <div class="text-xs text-slate-500 mt-1">${f.isDirectory ? 'Klasör' : (f.ext || 'Dosya')}</div>
                </div>
                <div class="mt-8 space-y-3">
                    <div class="flex justify-between text-xs border-b border-slate-200 pb-2">
                        <span class="text-slate-500">Oluşturulma</span>
                        <span class="font-medium text-slate-700">${f.date}</span>
                    </div>
                    ${!f.isDirectory ? `
                    <div class="flex justify-between text-xs border-b border-slate-200 pb-2">
                        <span class="text-slate-500">Boyut</span>
                        <span class="font-medium text-slate-700">${this.formatSize(f.size)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="mt-8 flex gap-2">
                    ${!f.isDirectory ? `<button class="flex-1 px-3 py-2 bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-100 transition">İndir</button>` : ''}
                    <button class="flex-1 px-3 py-2 bg-red-50 text-red-600 font-semibold text-xs rounded-lg hover:bg-red-100 transition">Sil</button>
                </div>
            `;

            this.elements.preview.querySelector('.pfm-close-preview').onclick = () => {
                this.elements.preview.classList.add('hidden');
            };
        }

        formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024, dm = 1, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        escape(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
    }

    window.Panoptes.FileManager = FileManagerInstance;

    const initFileManager = () => {
        document.querySelectorAll('.panoptes-filemanager').forEach(el => {
            if (!el.panoptesInstance) el.panoptesInstance = new FileManagerInstance(el.id);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFileManager);
    } else {
        initFileManager();
    }
})();
