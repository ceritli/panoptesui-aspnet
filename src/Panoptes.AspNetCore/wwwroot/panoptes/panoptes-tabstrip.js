/**
 * Panoptes TabStrip v1.0.0
 * Enterprise Panoptes UI
 * - Top, Bottom, Left & Right Tab Positions
 * - Lazy Loading (AJAX Fetch on tab select with loading spinner & caching)
 * - Dynamic Closable Tabs (X button, auto fallback to adjacent tab)
 * - Runtime Tab Addition API (addTab, removeTab, select)
 * - Badges, Custom SVG Icons, Animations & Full Keyboard Navigation
 * - Pure Vanilla JS + Tailwind CSS (Zero external dependencies)
 */
(function (window) {
  'use strict';

  window.Panoptes = window.Panoptes || {};
  window.Panoptes.instances = window.Panoptes.instances || {};
  window.Panoptes.TabStrip = window.Panoptes.TabStrip || {};

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Built-in SVG Icons Library for Tabs
  const ICONS = {
    file: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
    folder: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>',
    home: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
    user: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
    users: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    settings: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
    chart: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
    bell: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
    lock: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
    code: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
    database: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>',
    shield: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    cloud: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>',
    mail: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    plus: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>'
  };

  function renderIcon(icon) {
    if (!icon) return '';
    if (icon.trim().startsWith('<svg')) return icon;
    const key = icon.toLowerCase().trim();
    if (ICONS[key]) return ICONS[key];
    return `<span class="panoptes-tab-icon-text font-bold text-xs">${escapeHtml(icon)}</span>`;
  }

  class PanoptesTabStripInstance {
    constructor(elementOrId) {
      this.element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!this.element) return;

      this.id = this.element.id;
      this.position = this.element.dataset.tabPosition || 'top';
      this.animation = this.element.dataset.animation || 'fade';
      this.onSelectCallback = this.element.dataset.onSelect ? window[this.element.dataset.onSelect] : null;
      this.onCloseCallback = this.element.dataset.onClose ? window[this.element.dataset.onClose] : null;

      this.nav = this.element.querySelector('.panoptes-tabstrip-nav');
      this.contents = this.element.querySelector('.panoptes-tabstrip-contents');
      this.loadedUrls = new Set();

      this.initIcons();
      this.bindEvents();

      // Aktif sekmenin başlangıç lazy yüklemesini kontrol et
      const activeBtn = this.nav.querySelector('.panoptes-tab-btn.active');
      if (activeBtn) {
        const idx = parseInt(activeBtn.dataset.tabIndex, 10);
        this.checkLazyLoad(idx, activeBtn);
      }
    }

    initIcons() {
      if (!this.nav) return;
      this.nav.querySelectorAll('.panoptes-tab-icon[data-icon]').forEach(el => {
        const iconKey = el.dataset.icon;
        if (iconKey && !el.innerHTML.trim()) {
          el.innerHTML = renderIcon(iconKey);
        }
      });
    }

    bindEvents() {
      if (!this.nav) return;

      // Sekme tıklamaları ve kapatma butonları
      this.nav.addEventListener('click', (e) => {
        // Kapatma butonuna mı tıklandı?
        const closeBtn = e.target.closest('.panoptes-tab-close');
        if (closeBtn) {
          e.stopPropagation();
          const btn = closeBtn.closest('.panoptes-tab-btn');
          if (btn) {
            const idx = parseInt(btn.dataset.tabIndex, 10);
            this.removeTab(idx);
          }
          return;
        }

        // Sekme butonuna tıklandı
        const btn = e.target.closest('.panoptes-tab-btn');
        if (btn && !btn.disabled) {
          const idx = parseInt(btn.dataset.tabIndex, 10);
          this.select(idx);
        }
      });

      // Klavye ile gezinme (Sol / Sağ / Yukarı / Aşağı ok tuşları)
      this.nav.addEventListener('keydown', (e) => {
        const btns = Array.from(this.nav.querySelectorAll('.panoptes-tab-btn:not([disabled])'));
        if (btns.length === 0) return;

        const currentActive = this.nav.querySelector('.panoptes-tab-btn.active');
        let currentIdx = btns.indexOf(currentActive);
        if (currentIdx === -1) currentIdx = 0;

        let nextIdx = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextIdx = (currentIdx + 1) % btns.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextIdx = (currentIdx - 1 + btns.length) % btns.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIdx = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIdx = btns.length - 1;
        }

        if (nextIdx !== -1) {
          const targetBtn = btns[nextIdx];
          targetBtn.focus();
          const targetTabIdx = parseInt(targetBtn.dataset.tabIndex, 10);
          this.select(targetTabIdx);
        }
      });
    }

    /**
     * Belirtilen sekme indeksini seçer ve aktifleştirir.
     */
    select(index) {
      if (!this.nav || !this.contents) return;

      const btns = this.nav.querySelectorAll('.panoptes-tab-btn');
      const panes = this.contents.querySelectorAll('.panoptes-tab-pane');

      let selectedBtn = null;
      let selectedPane = null;

      btns.forEach(btn => {
        const idx = parseInt(btn.dataset.tabIndex, 10);
        if (idx === index) {
          selectedBtn = btn;
          btn.classList.add('active', 'bg-white', 'text-blue-700', 'shadow-sm', 'border', 'border-slate-200/80', 'font-bold');
          btn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-200/60');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active', 'bg-white', 'text-blue-700', 'shadow-sm', 'border', 'border-slate-200/80', 'font-bold');
          if (!btn.disabled) {
            btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-200/60');
          }
          btn.setAttribute('aria-selected', 'false');
        }
      });

      panes.forEach(pane => {
        const idx = parseInt(pane.dataset.tabIndex, 10);
        if (idx === index) {
          selectedPane = pane;
          pane.classList.remove('hidden');
          pane.classList.add('block');
          if (this.animation === 'fade') {
            pane.classList.remove('animate-fadeIn');
            // DOM reflow tetikle
            void pane.offsetWidth;
            pane.classList.add('animate-fadeIn');
          }
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('block');
        }
      });

      if (selectedBtn) {
        this.checkLazyLoad(index, selectedBtn);

        // Olay geri çağrısı
        if (typeof this.onSelectCallback === 'function') {
          const title = selectedBtn.querySelector('.panoptes-tab-title')?.innerText?.trim() || '';
          this.onSelectCallback({
            sender: this,
            index: index,
            title: title,
            button: selectedBtn,
            pane: selectedPane
          });
        }
      }
    }

    /**
     * AJAX Lazy Load kontrolü
     */
    checkLazyLoad(index, button) {
      const url = button.dataset.contentUrl;
      if (!url || this.loadedUrls.has(url)) return;

      const pane = this.contents.querySelector(`.panoptes-tab-pane[data-tab-index="${index}"]`);
      if (!pane) return;

      this.loadedUrls.add(url);

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(html => {
          pane.innerHTML = html;
        })
        .catch(err => {
          this.loadedUrls.delete(url); // Hata durumunda yeniden denenebilsin
          pane.innerHTML = `
            <div class="p-6 text-center text-red-500 text-xs">
              <span class="font-bold">İçerik yüklenirken hata oluştu:</span> ${escapeHtml(err.message)}
              <div class="mt-2">
                <button type="button" class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold" onclick="Panoptes.TabStrip.get('${this.id}').reloadLazy(${index})">
                  Yeniden Dene
                </button>
              </div>
            </div>`;
        });
    }

    reloadLazy(index) {
      const btn = this.nav.querySelector(`.panoptes-tab-btn[data-tab-index="${index}"]`);
      if (btn && btn.dataset.contentUrl) {
        this.loadedUrls.delete(btn.dataset.contentUrl);
        this.checkLazyLoad(index, btn);
      }
    }

    /**
     * Belirtilen indeksteki sekmeyi kaldırır.
     */
    removeTab(index) {
      if (!this.nav || !this.contents) return;

      const btn = this.nav.querySelector(`.panoptes-tab-btn[data-tab-index="${index}"]`);
      const pane = this.contents.querySelector(`.panoptes-tab-pane[data-tab-index="${index}"]`);
      if (!btn) return;

      const title = btn.querySelector('.panoptes-tab-title')?.innerText?.trim() || '';
      const wasActive = btn.classList.contains('active');

      // Animasyonla kaldır
      btn.style.opacity = '0';
      btn.style.transform = 'scale(0.9)';
      btn.style.transition = 'all 0.15s ease-out';

      setTimeout(() => {
        btn.remove();
        if (pane) pane.remove();

        // Eğer aktif sekme silindiyse, kalan sekmelerden birini seç
        if (wasActive) {
          const remainingBtns = Array.from(this.nav.querySelectorAll('.panoptes-tab-btn:not([disabled])'));
          if (remainingBtns.length > 0) {
            // Silinen indekse en yakın olanı veya ilkini seç
            const targetBtn = remainingBtns[Math.min(index, remainingBtns.length - 1)];
            const targetIdx = parseInt(targetBtn.dataset.tabIndex, 10);
            this.select(targetIdx);
          }
        }

        // OnClose callback
        if (typeof this.onCloseCallback === 'function') {
          this.onCloseCallback({
            sender: this,
            index: index,
            title: title
          });
        }
      }, 150);
    }

    /**
     * Çalışma zamanında dinamik yeni bir sekme ekler.
     */
    addTab(options) {
      if (!this.nav || !this.contents) return;

      const title = options.title || 'Yeni Sekme';
      const icon = options.icon || '';
      const badge = options.badge || '';
      const badgeColor = options.badgeColor || 'blue';
      const content = options.content || '';
      const contentUrl = options.contentUrl || '';
      const closable = options.closable !== false;
      const makeActive = options.active !== false;

      // Yeni indeks belirle
      const allBtns = this.nav.querySelectorAll('.panoptes-tab-btn');
      let maxIdx = -1;
      allBtns.forEach(b => {
        const val = parseInt(b.dataset.tabIndex, 10);
        if (!isNaN(val) && val > maxIdx) maxIdx = val;
      });
      const newIndex = maxIdx + 1;

      const isVertical = this.position === 'left' || this.position === 'right';
      const btnBaseClass = isVertical
        ? 'panoptes-tab-btn flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left w-full select-none text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        : 'panoptes-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap select-none text-slate-600 hover:text-slate-900 hover:bg-slate-200/60';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = `${this.id}_tab_${newIndex}`;
      btn.role = 'tab';
      btn.className = btnBaseClass;
      btn.dataset.tabIndex = newIndex;
      if (contentUrl) btn.dataset.contentUrl = contentUrl;

      // İkon ve Başlık
      let leftHtml = `<span class="flex items-center gap-2 min-w-0">`;
      if (icon) {
        leftHtml += `<span class="panoptes-tab-icon shrink-0">${renderIcon(icon)}</span>`;
      }
      leftHtml += `<span class="panoptes-tab-title truncate">${escapeHtml(title)}</span></span>`;

      // Rozet ve Kapatma Butonu
      let rightHtml = `<span class="flex items-center gap-1.5 shrink-0 ml-auto">`;
      if (badge) {
        const badgeColorMap = {
          emerald: 'bg-emerald-100 text-emerald-800',
          amber: 'bg-amber-100 text-amber-800',
          red: 'bg-red-100 text-red-800',
          purple: 'bg-purple-100 text-purple-800',
          slate: 'bg-slate-200 text-slate-700',
          blue: 'bg-blue-100 text-blue-800'
        };
        const colorClass = badgeColorMap[badgeColor.toLowerCase()] || badgeColorMap.blue;
        rightHtml += `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold ${colorClass}">${escapeHtml(badge)}</span>`;
      }
      if (closable) {
        rightHtml += `<span class="panoptes-tab-close p-0.5 rounded hover:bg-slate-300/60 text-slate-400 hover:text-slate-700 transition cursor-pointer ml-1" title="Sekmeyi Kapat" role="button">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </span>`;
      }
      rightHtml += `</span>`;

      btn.innerHTML = leftHtml + rightHtml;
      this.nav.appendChild(btn);

      // Pane oluştur
      const pane = document.createElement('div');
      pane.id = `${this.id}_pane_${newIndex}`;
      pane.role = 'tabpanel';
      pane.className = 'panoptes-tab-pane hidden';
      pane.dataset.tabIndex = newIndex;

      if (contentUrl && !content) {
        pane.innerHTML = `<div class="panoptes-tab-loading flex items-center justify-center p-8 text-slate-400 text-xs font-semibold gap-2">
          <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Yükleniyor...</span>
        </div>`;
      } else {
        pane.innerHTML = content;
      }

      this.contents.appendChild(pane);

      if (makeActive) {
        this.select(newIndex);
      }

      return newIndex;
    }
  }

  // Global API
  window.Panoptes.TabStrip = {
    initAll: function () {
      document.querySelectorAll('[data-panoptes-tabstrip="true"]').forEach(el => {
        if (!window.Panoptes.instances[el.id]) {
          window.Panoptes.instances[el.id] = new PanoptesTabStripInstance(el);
        }
      });
    },
    get: function (id) {
      return window.Panoptes.instances[id] || null;
    }
  };

  // Otomatik başlatma
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Panoptes.TabStrip.initAll());
  } else {
    window.Panoptes.TabStrip.initAll();
  }

})(window);
