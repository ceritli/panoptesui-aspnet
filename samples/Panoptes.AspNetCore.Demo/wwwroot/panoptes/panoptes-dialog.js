/**
 * Panoptes Dialog (Modal Uyarı & Onay Kutusu)
 * Panoptes UI Dialog bileşeni, modern, Promise tabanlı alert, confirm ve prompt motoru.
 */

(function (window, document) {
    'use strict';

    class PanoptesDialogService {
        constructor() {
            this.activeDialogs = [];
            this.bindKeyboard();
        }

        bindKeyboard() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeDialogs.length > 0) {
                    const top = this.activeDialogs[this.activeDialogs.length - 1];
                    if (top.closable) {
                        top.reject(false);
                        top.close();
                    }
                }
            });
        }

        createModal(options) {
            return new Promise((resolve, reject) => {
                const {
                    title = 'Bilgi',
                    content = '',
                    type = 'alert', // alert, confirm, prompt
                    okText = 'Tamam',
                    cancelText = 'İptal',
                    width = '420px',
                    closable = true,
                    promptPlaceholder = '',
                    promptDefaultValue = '',
                    danger = false
                } = options;

                // Backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 opacity-0';

                // Modal Kutusu
                const modal = document.createElement('div');
                modal.className = 'bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full transition-all duration-200 transform scale-95 opacity-0 select-none';
                modal.style.maxWidth = width;

                // İkon & Başlık Rengi
                let iconHtml = '';
                if (type === 'confirm') {
                    iconHtml = danger
                        ? `<div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></div>`
                        : `<div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>`;
                } else if (type === 'prompt') {
                    iconHtml = `<div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>`;
                } else {
                    iconHtml = `<div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>`;
                }

                // Prompt Input Alanı
                let promptInputHtml = '';
                if (type === 'prompt') {
                    promptInputHtml = `
                        <div class="mt-3">
                            <input type="text" class="panoptes-dialog-input w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="${promptPlaceholder}" value="${promptDefaultValue}" />
                        </div>
                    `;
                }

                // Header & Body
                modal.innerHTML = `
                    <div class="p-6">
                        <div class="flex items-start gap-4">
                            ${iconHtml}
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-sm font-bold text-slate-800">${title}</h3>
                                    ${closable ? `<button type="button" class="panoptes-dialog-close text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded-lg transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>` : ''}
                                </div>
                                <div class="mt-2 text-xs text-slate-600 leading-relaxed">${content}</div>
                                ${promptInputHtml}
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        ${type !== 'alert' ? `<button type="button" class="panoptes-dialog-cancel px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition">${cancelText}</button>` : ''}
                        <button type="button" class="panoptes-dialog-ok px-4 py-1.5 text-xs font-semibold text-white ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg transition shadow-xs">${okText}</button>
                    </div>
                `;

                backdrop.appendChild(modal);
                document.body.appendChild(backdrop);

                // Giriş animasyonu
                requestAnimationFrame(() => {
                    backdrop.classList.remove('opacity-0');
                    modal.classList.remove('scale-95', 'opacity-0');
                    modal.classList.add('scale-100', 'opacity-100');

                    if (type === 'prompt') {
                        const inp = modal.querySelector('.panoptes-dialog-input');
                        if (inp) {
                            inp.focus();
                            inp.select();
                        }
                    } else {
                        const okBtn = modal.querySelector('.panoptes-dialog-ok');
                        if (okBtn) okBtn.focus();
                    }
                });

                const close = () => {
                    backdrop.classList.add('opacity-0');
                    modal.classList.remove('scale-100', 'opacity-100');
                    modal.classList.add('scale-95', 'opacity-0');

                    setTimeout(() => {
                        if (backdrop.parentNode) {
                            backdrop.parentNode.removeChild(backdrop);
                        }
                        this.activeDialogs = this.activeDialogs.filter(d => d !== dialogInstance);
                    }, 200);
                };

                const dialogInstance = {
                    closable: closable,
                    close: close,
                    reject: reject
                };

                this.activeDialogs.push(dialogInstance);

                // Buton Olayları
                const okBtn = modal.querySelector('.panoptes-dialog-ok');
                if (okBtn) {
                    okBtn.addEventListener('click', () => {
                        if (type === 'prompt') {
                            const inp = modal.querySelector('.panoptes-dialog-input');
                            const val = inp ? inp.value : '';
                            resolve(val);
                        } else if (type === 'confirm') {
                            resolve(true);
                        } else {
                            resolve(true);
                        }
                        close();
                    });
                }

                const cancelBtn = modal.querySelector('.panoptes-dialog-cancel');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        if (type === 'prompt') {
                            resolve(null);
                        } else {
                            resolve(false);
                        }
                        close();
                    });
                }

                if (closable) {
                    const closeBtn = modal.querySelector('.panoptes-dialog-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            resolve(type === 'prompt' ? null : false);
                            close();
                        });
                    }

                    backdrop.addEventListener('click', (e) => {
                        if (e.target === backdrop) {
                            resolve(type === 'prompt' ? null : false);
                            close();
                        }
                    });
                }

                if (type === 'prompt') {
                    const inp = modal.querySelector('.panoptes-dialog-input');
                    if (inp) {
                        inp.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                resolve(inp.value);
                                close();
                            }
                        });
                    }
                }
            });
        }

        alert(content, title = 'Bilgi', options = {}) {
            return this.createModal({
                ...options,
                content,
                title,
                type: 'alert'
            });
        }

        confirm(content, title = 'Onay Gerekli', options = {}) {
            return this.createModal({
                ...options,
                content,
                title,
                type: 'confirm'
            });
        }

        prompt(content, defaultValue = '', title = 'Giriş Yapın', options = {}) {
            return this.createModal({
                ...options,
                content,
                title,
                promptDefaultValue: defaultValue,
                type: 'prompt'
            });
        }

        open(id) {
            const el = document.getElementById(id);
            if (!el) return;

            const title = el.getAttribute('data-title') || '';
            const type = el.getAttribute('data-type') || 'alert';
            const okText = el.getAttribute('data-ok-text') || 'Tamam';
            const cancelText = el.getAttribute('data-cancel-text') || 'İptal';
            const width = el.getAttribute('data-width') || '440px';
            const closable = el.getAttribute('data-closable') !== 'false';
            const onOk = el.getAttribute('data-on-ok');
            const onCancel = el.getAttribute('data-on-cancel');
            const content = el.innerHTML;

            this.createModal({
                title,
                content,
                type,
                okText,
                cancelText,
                width,
                closable
            }).then(result => {
                if (result) {
                    if (onOk && typeof window[onOk] === 'function') window[onOk](result);
                } else {
                    if (onCancel && typeof window[onCancel] === 'function') window[onCancel]();
                }
            });
        }
    }

    const service = new PanoptesDialogService();

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Dialog = service;
    window.Panoptes.alert = (c, t, o) => service.alert(c, t, o);
    window.Panoptes.confirm = (c, t, o) => service.confirm(c, t, o);
    window.Panoptes.prompt = (c, d, t, o) => service.prompt(c, d, t, o);
    window.panoptesDialog = service;

})(window, document);
