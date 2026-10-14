/**
 * Panoptes Notification (Toast Bildirim Motoru)
 * Panoptes UI Notification bileşeni, modern, çoklu pozisyon, otomatik gizlenme ve animasyonlu toast motoru.
 */

(function (window, document) {
    'use strict';

    const ICONS = {
        success: `<svg class="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error: `<svg class="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        warning: `<svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        info: `<svg class="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    const BORDER_COLORS = {
        success: 'border-emerald-200 bg-white text-slate-800',
        error: 'border-rose-200 bg-white text-slate-800',
        warning: 'border-amber-200 bg-white text-slate-800',
        info: 'border-blue-200 bg-white text-slate-800'
    };

    const PROGRESS_COLORS = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const POSITION_CLASSES = {
        'top-right': 'top-5 right-5 items-end',
        'top-left': 'top-5 left-5 items-start',
        'top-center': 'top-5 left-1/2 -translate-x-1/2 items-center',
        'bottom-right': 'bottom-5 right-5 items-end',
        'bottom-left': 'bottom-5 left-5 items-start',
        'bottom-center': 'bottom-5 left-1/2 -translate-x-1/2 items-center'
    };

    function getContainer(position) {
        position = (position || 'top-right').toLowerCase().replace('_', '-');
        const containerId = `panoptes_notif_container_${position.replace('-', '_')}`;
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            const posClass = POSITION_CLASSES[position] || POSITION_CLASSES['top-right'];
            container.className = `fixed z-50 flex flex-col gap-3 pointer-events-none p-2 ${posClass}`;
            document.body.appendChild(container);
        }
        return container;
    }

    class PanoptesNotificationService {
        show(options) {
            if (typeof options === 'string') {
                options = { message: options };
            }

            const {
                title = null,
                message = '',
                type = 'info',
                position = 'top-right',
                duration = 5000,
                closable = true,
                showIcon = true
            } = options;

            const container = getContainer(position);

            const toast = document.createElement('div');
            toast.className = `pointer-events-auto w-84 max-w-[calc(100vw-2rem)] rounded-xl border p-4 shadow-lg flex flex-col gap-2 relative overflow-hidden transition-all duration-300 transform translate-y-2 opacity-0 select-none ${BORDER_COLORS[type] || BORDER_COLORS.info}`;

            let headerHtml = '';
            if (title) {
                headerHtml = `<div class="font-bold text-xs text-slate-800">${title}</div>`;
            }

            const iconHtml = showIcon ? (ICONS[type] || ICONS.info) : '';
            const closeBtnHtml = closable ? `
                <button type="button" class="panoptes-notif-close text-slate-400 hover:text-slate-600 p-0.5 rounded transition ml-auto shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>` : '';

            toast.innerHTML = `
                <div class="flex items-start gap-3">
                    ${iconHtml}
                    <div class="flex-1 min-w-0 pr-1">
                        ${headerHtml}
                        <div class="text-xs text-slate-600 leading-relaxed break-words">${message}</div>
                    </div>
                    ${closeBtnHtml}
                </div>
                ${duration > 0 ? `<div class="panoptes-notif-progress absolute bottom-0 left-0 h-1 w-full ${PROGRESS_COLORS[type] || PROGRESS_COLORS.info} transition-all"></div>` : ''}
            `;

            container.appendChild(toast);

            // Giriş animasyonu
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            });

            let timer = null;
            let progressInterval = null;
            let remainingTime = duration;
            let startTime = Date.now();

            const close = () => {
                if (timer) clearTimeout(timer);
                if (progressInterval) clearInterval(progressInterval);

                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-2', 'opacity-0');

                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            };

            if (closable) {
                const closeBtn = toast.querySelector('.panoptes-notif-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', close);
                }
            }

            if (duration > 0) {
                const progressBar = toast.querySelector('.panoptes-notif-progress');

                const startTimer = () => {
                    startTime = Date.now();
                    timer = setTimeout(close, remainingTime);

                    if (progressBar) {
                        const totalDuration = duration;
                        progressInterval = setInterval(() => {
                            const elapsed = Date.now() - startTime;
                            const currentRemaining = Math.max(0, remainingTime - elapsed);
                            const percent = (currentRemaining / totalDuration) * 100;
                            progressBar.style.width = `${percent}%`;
                        }, 50);
                    }
                };

                const pauseTimer = () => {
                    if (timer) clearTimeout(timer);
                    if (progressInterval) clearInterval(progressInterval);
                    remainingTime -= Date.now() - startTime;
                };

                toast.addEventListener('mouseenter', pauseTimer);
                toast.addEventListener('mouseleave', () => {
                    if (remainingTime > 0) startTimer();
                });

                startTimer();
            }

            return {
                close: close
            };
        }

        success(message, title = null, options = {}) {
            return this.show({ ...options, message, title, type: 'success' });
        }

        error(message, title = null, options = {}) {
            return this.show({ ...options, message, title, type: 'error' });
        }

        warning(message, title = null, options = {}) {
            return this.show({ ...options, message, title, type: 'warning' });
        }

        info(message, title = null, options = {}) {
            return this.show({ ...options, message, title, type: 'info' });
        }
    }

    const service = new PanoptesNotificationService();

    // DOM'da tanımlı olan <panoptes-notification> etiketlerini tara ve göster
    function initAutoNotifications() {
        document.querySelectorAll('[data-panoptes-notification="true"][data-auto-show="true"]').forEach(el => {
            const message = el.getAttribute('data-message') || el.innerText || '';
            const title = el.getAttribute('data-title');
            const type = el.getAttribute('data-type') || 'info';
            const position = el.getAttribute('data-position') || 'top-right';
            const autoHide = parseInt(el.getAttribute('data-auto-hide') || '5000', 10);
            const closable = el.getAttribute('data-closable') !== 'false';
            const showIcon = el.getAttribute('data-show-icon') !== 'false';

            service.show({
                message: message,
                title: title,
                type: type,
                position: position,
                duration: autoHide,
                closable: closable,
                showIcon: showIcon
            });

            el.setAttribute('data-auto-show', 'false');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoNotifications);
    } else {
        initAutoNotifications();
    }

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Notification = service;
    window.Panoptes.notify = service;
    window.panoptesNotify = service;

})(window, document);
