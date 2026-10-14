/**
 * Panoptes Upload Component
 * Drag & Drop, Async Upload, Progress Bar, Extension & Size Validation
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Upload = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-upload="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new UploadComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        getFiles: function(id) {
            const inst = this.get(id);
            return inst ? inst.getFiles() : [];
        },

        clearFiles: function(id) {
            const inst = this.get(id);
            if (inst) inst.clearFiles();
        },

        uploadAll: function(id) {
            const inst = this.get(id);
            if (inst) inst.uploadAll();
        }
    };

    class UploadComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.multiple = element.dataset.multiple === 'true';
            this.autoUpload = element.dataset.autoUpload === 'true';
            this.maxSize = parseInt(element.dataset.maxSize) || 10485760;
            this.allowedExtStr = element.dataset.allowedExt || '';
            this.allowedExts = this.allowedExtStr ? this.allowedExtStr.toLowerCase().split(',').map(s => s.trim()) : [];
            this.saveUrl = element.dataset.saveUrl || null;
            this.removeUrl = element.dataset.removeUrl || null;

            this.onSelectCb = element.dataset.onSelect || null;
            this.onUploadCb = element.dataset.onUpload || null;
            this.onSuccessCb = element.dataset.onSuccess || null;
            this.onErrorCb = element.dataset.onError || null;
            this.onRemoveCb = element.dataset.onRemove || null;

            this.fileInput = element.querySelector('.panoptes-upload-hidden-input');
            this.dropzone = element.querySelector('.panoptes-upload-dropzone');
            this.btnSelect = element.querySelector('.panoptes-upload-select-btn');
            this.fileListEl = element.querySelector('.panoptes-upload-file-list');
            this.manualActionsEl = element.querySelector('.panoptes-upload-manual-actions');
            this.pendingCountEl = element.querySelector('.panoptes-upload-pending-count');
            this.btnStartAll = element.querySelector('.panoptes-upload-start-all-btn');

            this.files = [];

            this.bindEvents();
        }

        bindEvents() {
            // Dropzone click
            if (this.dropzone && this.fileInput) {
                this.dropzone.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    this.fileInput.click();
                });
            }

            if (this.btnSelect && this.fileInput) {
                this.btnSelect.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.fileInput.click();
                });
            }

            // File input change
            if (this.fileInput) {
                this.fileInput.addEventListener('change', (e) => {
                    this.handleFileSelect(e.target.files);
                    this.fileInput.value = ''; // allow re-selecting same file
                });
            }

            // Drag & Drop
            if (this.dropzone) {
                ['dragenter', 'dragover'].forEach(eventName => {
                    this.dropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.dropzone.classList.add('border-blue-600', 'bg-blue-50/50');
                    });
                });

                ['dragleave', 'drop'].forEach(eventName => {
                    this.dropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.dropzone.classList.remove('border-blue-600', 'bg-blue-50/50');
                    });
                });

                this.dropzone.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    if (dt && dt.files && dt.files.length > 0) {
                        this.handleFileSelect(dt.files);
                    }
                });
            }

            // Manual upload all button
            if (this.btnStartAll) {
                this.btnStartAll.addEventListener('click', () => {
                    this.uploadAll();
                });
            }
        }

        handleFileSelect(fileList) {
            const newFiles = Array.from(fileList);
            if (!this.multiple && newFiles.length > 0) {
                this.files = [];
                this.fileListEl.innerHTML = '';
            }

            for (const file of newFiles) {
                const fileObj = {
                    id: 'f_' + Math.random().toString(36).substr(2, 9),
                    file: file,
                    name: file.name,
                    size: file.size,
                    extension: '.' + file.name.split('.').pop().toLowerCase(),
                    progress: 0,
                    status: 'pending', // pending, uploading, success, error
                    errorMessage: null
                };

                // Validate extension
                if (this.allowedExts.length > 0 && !this.allowedExts.includes(fileObj.extension)) {
                    fileObj.status = 'error';
                    fileObj.errorMessage = `Geçersiz dosya uzantısı. İzin verilenler: ${this.allowedExtStr}`;
                }

                // Validate size
                if (file.size > this.maxSize) {
                    fileObj.status = 'error';
                    const maxMb = (this.maxSize / (1024 * 1024)).toFixed(1);
                    fileObj.errorMessage = `Dosya boyutu ${maxMb} MB sınırını aşıyor.`;
                }

                this.files.push(fileObj);
                this.renderFileCard(fileObj);

                this.triggerCallback(this.onSelectCb, 'panoptes-upload-select', fileObj);

                if (this.autoUpload && fileObj.status === 'pending') {
                    this.startUpload(fileObj);
                }
            }

            this.updateManualBar();
        }

        renderFileCard(fileObj) {
            const card = document.createElement('div');
            card.id = `card_${fileObj.id}`;
            card.className = 'panoptes-file-card bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs';

            const iconSvg = this.getFileIcon(fileObj.extension);
            const sizeFormatted = this.formatBytes(fileObj.size);

            card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-600">
                        ${iconSvg}
                    </div>
                    <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-slate-800 truncate" title="${fileObj.name}">${fileObj.name}</span>
                            <span class="text-[11px] text-slate-400 shrink-0">${sizeFormatted}</span>
                        </div>
                        <div class="panoptes-file-progress-wrap w-full bg-slate-100 h-1.5 rounded-full overflow-hidden ${fileObj.status === 'error' ? 'hidden' : ''}">
                            <div class="panoptes-file-progress-bar bg-blue-600 h-full rounded-full transition-all duration-200" style="width: ${fileObj.progress}%"></div>
                        </div>
                        <div class="panoptes-file-status text-[11px] flex items-center justify-between">
                            <span class="panoptes-file-status-text font-medium ${fileObj.status === 'error' ? 'text-rose-600 font-bold' : 'text-slate-400'}">
                                ${fileObj.errorMessage ? fileObj.errorMessage : (fileObj.status === 'pending' ? 'Yükleme bekleniyor...' : 'Yükleniyor %0')}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="shrink-0 flex items-center gap-1.5">
                    <button type="button" class="panoptes-file-remove-btn w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition" title="Kaldır">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            `;

            card.querySelector('.panoptes-file-remove-btn').addEventListener('click', () => {
                this.removeFile(fileObj.id);
            });

            this.fileListEl.appendChild(card);
        }

        startUpload(fileObj) {
            fileObj.status = 'uploading';
            this.updateFileCard(fileObj);
            this.triggerCallback(this.onUploadCb, 'panoptes-upload-start', fileObj);

            if (this.saveUrl) {
                // Real XHR Upload
                const formData = new FormData();
                formData.append('file', fileObj.file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', this.saveUrl, true);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        fileObj.progress = Math.round((e.loaded / e.total) * 100);
                        this.updateFileCard(fileObj);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        fileObj.progress = 100;
                        fileObj.status = 'success';
                        this.updateFileCard(fileObj);
                        this.triggerCallback(this.onSuccessCb, 'panoptes-upload-success', fileObj);
                    } else {
                        fileObj.status = 'error';
                        fileObj.errorMessage = `Sunucu hatası: HTTP ${xhr.status}`;
                        this.updateFileCard(fileObj);
                        this.triggerCallback(this.onErrorCb, 'panoptes-upload-error', fileObj);
                    }
                    this.updateManualBar();
                };

                xhr.onerror = () => {
                    fileObj.status = 'error';
                    fileObj.errorMessage = 'Ağ bağlantı hatası oluştu.';
                    this.updateFileCard(fileObj);
                    this.triggerCallback(this.onErrorCb, 'panoptes-upload-error', fileObj);
                    this.updateManualBar();
                };

                xhr.send(formData);
            } else {
                // Realistic progress simulation for standalone demo
                let p = 0;
                const interval = setInterval(() => {
                    p += Math.floor(Math.random() * 25) + 15;
                    if (p >= 100) {
                        p = 100;
                        clearInterval(interval);
                        fileObj.progress = 100;
                        fileObj.status = 'success';
                        this.updateFileCard(fileObj);
                        this.triggerCallback(this.onSuccessCb, 'panoptes-upload-success', fileObj);
                        this.updateManualBar();
                    } else {
                        fileObj.progress = p;
                        this.updateFileCard(fileObj);
                    }
                }, 120);
            }
        }

        updateFileCard(fileObj) {
            const card = document.getElementById(`card_${fileObj.id}`);
            if (!card) return;

            const progressBar = card.querySelector('.panoptes-file-progress-bar');
            const progressWrap = card.querySelector('.panoptes-file-progress-wrap');
            const statusText = card.querySelector('.panoptes-file-status-text');

            if (progressBar) progressBar.style.width = `${fileObj.progress}%`;

            if (fileObj.status === 'uploading') {
                if (statusText) {
                    statusText.className = 'panoptes-file-status-text font-medium text-blue-600';
                    statusText.textContent = `Yükleniyor %${fileObj.progress}`;
                }
            } else if (fileObj.status === 'success') {
                if (progressBar) progressBar.className = 'panoptes-file-progress-bar bg-emerald-500 h-full rounded-full transition-all duration-200';
                if (statusText) {
                    statusText.className = 'panoptes-file-status-text font-bold text-emerald-600 flex items-center gap-1';
                    statusText.innerHTML = `
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Başarıyla yüklendi</span>
                    `;
                }
            } else if (fileObj.status === 'error') {
                if (progressWrap) progressWrap.classList.add('hidden');
                if (statusText) {
                    statusText.className = 'panoptes-file-status-text font-bold text-rose-600 flex items-center gap-1';
                    statusText.innerHTML = `
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>${fileObj.errorMessage || 'Hata'}</span>
                    `;
                }
            }
        }

        removeFile(fileId) {
            const idx = this.files.findIndex(f => f.id === fileId);
            if (idx === -1) return;
            const removed = this.files.splice(idx, 1)[0];

            const card = document.getElementById(`card_${fileId}`);
            if (card) card.remove();

            this.triggerCallback(this.onRemoveCb, 'panoptes-upload-remove', removed);
            this.updateManualBar();
        }

        uploadAll() {
            this.files.filter(f => f.status === 'pending').forEach(f => {
                this.startUpload(f);
            });
        }

        clearFiles() {
            this.files = [];
            this.fileListEl.innerHTML = '';
            this.updateManualBar();
        }

        getFiles() {
            return this.files;
        }

        updateManualBar() {
            if (!this.manualActionsEl) return;
            const pending = this.files.filter(f => f.status === 'pending').length;
            if (pending > 0) {
                this.manualActionsEl.classList.remove('hidden');
                if (this.pendingCountEl) {
                    this.pendingCountEl.textContent = `${pending} dosya yüklemeyi bekliyor`;
                }
            } else {
                this.manualActionsEl.classList.add('hidden');
            }
        }

        triggerCallback(fnName, evtName, data) {
            if (fnName && typeof window[fnName] === 'function') {
                window[fnName](data, this);
            }
            this.container.dispatchEvent(new CustomEvent(evtName, {
                detail: { file: data, upload: this }
            }));
        }

        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        getFileIcon(ext) {
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
                return '<svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
            }
            if (['.pdf'].includes(ext)) {
                return '<svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>';
            }
            if (['.doc', '.docx'].includes(ext)) {
                return '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
            }
            if (['.xls', '.xlsx'].includes(ext)) {
                return '<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
            }
            if (['.zip', '.rar', '.tar', '.gz'].includes(ext)) {
                return '<svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>';
            }
            return '<svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>';
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.Upload.init());
    } else {
        window.Panoptes.Upload.init();
    }
})();
