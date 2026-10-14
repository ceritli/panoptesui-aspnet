/**
 * Panoptes ListView v1.0.0
 * Enterprise Panoptes UI ListView
 * - Full ToDataSourceResultAsync Remote & Local Data Binding
 * - Client Templating with '#: Field #' and '#= Field #' interpolation
 * - Alternating Item Templates & Edit Templates
 * - Full In-Line / In-Card CRUD (Create, Read, Update, Destroy)
 * - Single & Multiple Interactive Card Selection
 * - Integrated Pager with Page Sizes & Summary
 * - Live Search, Sorting & Custom Layouts (Grid/List)
 * - Pure Vanilla JS + Tailwind CSS (Zero external dependencies)
 */
(function (window) {
  'use strict';

  window.Panoptes = window.Panoptes || {};
  window.Panoptes.instances = window.Panoptes.instances || {};
  window.Panoptes.ListView = window.Panoptes.ListView || {};

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return '₺0,00';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  }

  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('tr-TR').format(d);
  }

  function createCaseInsensitiveProxy(target) {
    if (!target || typeof target !== 'object') return target;
    const ignored = new Set(['p', 'escape', 'formatCurrency', 'formatDate', 'data', 'Array', 'Date', 'Math', 'Number', 'String', 'Boolean', 'Object', 'JSON', 'console', 'window', 'document']);
    return new Proxy(target, {
      has(t, prop) {
        if (ignored.has(prop)) return false;
        return true;
      },
      get(t, prop) {
        if (prop in t) return t[prop];
        if (typeof prop === 'string') {
          const lower = prop.toLowerCase();
          for (const k of Object.keys(t)) {
            if (k.toLowerCase() === lower) return t[k];
          }
        }
        return undefined;
      }
    });
  }

  // Template Compiler supporting #: Field #, #= RawHtml #, ${Field}, # if (...) { # ... # } #
  function compileTemplate(templateStr) {
    if (!templateStr || typeof templateStr !== 'string') {
      return (data) => `<div class="p-4 bg-white rounded-xl border border-slate-200">${JSON.stringify(data)}</div>`;
    }

    // Convert template style interpolation
    let code = "const p = []; with(data) { p.push('";
    let cursor = 0;
    const re = /#([:=]?)([\s\S]*?)#/g;
    let match;

    let cleanTpl = templateStr.replace(/[\r\t\n]/g, ' ');

    while ((match = re.exec(cleanTpl)) !== null) {
      const text = cleanTpl.slice(cursor, match.index);
      code += text.replace(/'/g, "\\'");

      const op = match[1]; // '', ':', '='
      const expr = match[2].trim();

      if (op === ':') {
        code += "'); p.push(escape(" + expr + ")); p.push('";
      } else if (op === '=') {
        code += "'); p.push(" + expr + "); p.push('";
      } else {
        code += "'); " + expr + " p.push('";
      }
      cursor = match.index + match[0].length;
    }

    code += cleanTpl.slice(cursor).replace(/'/g, "\\'") + "'); } return p.join('');";

    try {
      const fn = new Function('data', 'escape', 'formatCurrency', 'formatDate', code);
      return function (data) {
        try {
          return fn(createCaseInsensitiveProxy(data), escapeHtml, formatCurrency, formatDate);
        } catch (runErr) {
          console.warn('Panoptes.ListView: Template execution error, using fallback:', runErr);
          return null;
        }
      };
    } catch (e) {
      console.warn('Panoptes.ListView: Template compilation warning, using regex fallback:', e);
      return function (data) {
        return templateStr.replace(/#[:=]?\s*([a-zA-Z0-9_.]+)\s*#/g, (m, key) => {
          const lower = key.toLowerCase();
          let val = '';
          for (const k of Object.keys(data || {})) {
            if (k.toLowerCase() === lower) { val = data[k]; break; }
          }
          return m.startsWith('#:') ? escapeHtml(val) : val;
        }).replace(/\$\{([a-zA-Z0-9_.]+)\}/g, (m, key) => {
          const lower = key.toLowerCase();
          let val = '';
          for (const k of Object.keys(data || {})) {
            if (k.toLowerCase() === lower) { val = data[k]; break; }
          }
          return escapeHtml(val);
        });
      };
    }
  }

  class PanoptesListViewInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      this.config = this.readConfig();
      this.items = [];
      this.total = 0;
      this.page = 1;
      this.pageSize = this.config.pageSize || 8;
      this.sortField = null;
      this.sortDir = 'asc';
      this.searchQuery = '';
      this.selectedKeys = new Set();
      this.editingId = null;
      this.isAdding = false;
      this.newItemData = null;

      this.itemTemplate = this.resolveTemplate(this.config.clientTemplateId, this.config.templateHtml);
      this.altTemplate = this.resolveTemplate(this.config.clientAltTemplateId, this.config.altTemplateHtml) || this.itemTemplate;
      this.editTemplate = this.resolveTemplate(this.config.clientEditTemplateId, this.config.editTemplateHtml);

      this.initDom();
      this.read();
    }

    readConfig() {
      const script = this.wrapper.querySelector(`script[data-panoptes-config="${this.id}"]`);
      if (script) {
        try {
          return JSON.parse(script.textContent);
        } catch (e) {
          console.error(`Panoptes.ListView [${this.id}] invalid config JSON`, e);
        }
      }
      return {};
    }

    resolveTemplate(templateId, inlineHtml) {
      if (templateId) {
        const el = document.getElementById(templateId);
        if (el) {
          return compileTemplate(el.innerHTML);
        }
      }
      if (inlineHtml && inlineHtml.trim()) {
        return compileTemplate(inlineHtml);
      }
      return null;
    }

    initDom() {
      this.container = this.wrapper.querySelector('.panoptes-listview-container') || this.wrapper;
      this.container.innerHTML = `
        <div class="panoptes-lv-root flex flex-col space-y-4">
          <!-- Toolbar -->
          <div class="panoptes-lv-toolbar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div class="flex items-center gap-3 flex-1">
              ${this.config.searchable ? `
                <div class="relative flex-1 max-w-md">
                  <input type="text" 
                         class="panoptes-lv-search w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs" 
                         placeholder="Liste içinde ara..." />
                  <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              ` : ''}

              ${this.config.sortable ? `
                <div class="flex items-center gap-1.5 text-xs">
                  <span class="text-slate-400 hidden sm:inline text-[11px] font-semibold uppercase tracking-wider">Sırala:</span>
                  <select class="panoptes-lv-sort text-xs py-1.5 pl-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium cursor-pointer">
                    <option value="">Varsayılan Sıralama</option>
                    <option value="name_asc">İsim (A-Z)</option>
                    <option value="name_desc">İsim (Z-A)</option>
                    <option value="price_asc">Fiyat (En Düşük)</option>
                    <option value="price_desc">Fiyat (En Yüksek)</option>
                    <option value="id_desc">En Yeni Eklenenler</option>
                  </select>
                </div>
              ` : ''}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              ${this.config.selectable === 'multiple' ? `
                <button type="button" class="panoptes-lv-btn-selectall px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
                  Tümünü Seç
                </button>
                <button type="button" class="panoptes-lv-btn-clearselect px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition hidden">
                  Seçimi Kaldır
                </button>
              ` : ''}

              ${this.config.editable ? `
                <button type="button" class="panoptes-lv-btn-add inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  <span>Yeni Kayıt Ekle</span>
                </button>
              ` : ''}

              <button type="button" class="panoptes-lv-btn-refresh p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition" title="Yenile">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>

          <!-- Selection Count Bar (if multiple) -->
          <div class="panoptes-lv-selected-bar hidden px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold flex items-center justify-between">
            <span class="panoptes-lv-selected-text">0 öğe seçildi</span>
            <button type="button" class="panoptes-lv-selected-clear text-blue-600 hover:underline font-bold">Vazgeç</button>
          </div>

          <!-- Content Grid / List Area -->
          <div class="panoptes-lv-content min-h-[200px]"></div>

          <!-- Pager Area -->
          ${this.config.pageable ? `
            <div class="panoptes-lv-pager flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="text-xs text-slate-500 font-medium panoptes-lv-summary">
                Yükleniyor...
              </div>

              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1 panoptes-lv-page-buttons"></div>

                <div class="flex items-center gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-3">
                  <span class="text-[11px] font-semibold text-slate-400 uppercase">Sayfa Başı:</span>
                  <select class="panoptes-lv-pagesize text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    ${(this.config.pageSizes || [4, 8, 12, 24]).map(s => `<option value="${s}" ${s === this.pageSize ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      // Search with debounce
      const searchInput = this.container.querySelector('.panoptes-lv-search');
      if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.searchQuery = e.target.value.trim();
            this.page = 1;
            this.read();
          }, 300);
        });
      }

      // Sort
      const sortSelect = this.container.querySelector('.panoptes-lv-sort');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === 'name_asc') { this.sortField = 'Name'; this.sortDir = 'asc'; }
          else if (val === 'name_desc') { this.sortField = 'Name'; this.sortDir = 'desc'; }
          else if (val === 'price_asc') { this.sortField = 'Price'; this.sortDir = 'asc'; }
          else if (val === 'price_desc') { this.sortField = 'Price'; this.sortDir = 'desc'; }
          else if (val === 'id_desc') { this.sortField = 'Id'; this.sortDir = 'desc'; }
          else { this.sortField = null; this.sortDir = 'asc'; }
          this.read();
        });
      }

      // Refresh
      const refreshBtn = this.container.querySelector('.panoptes-lv-btn-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.read());
      }

      // Select All / Clear
      const selectAllBtn = this.container.querySelector('.panoptes-lv-btn-selectall');
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => this.selectAll());
      }

      const clearBtn = this.container.querySelector('.panoptes-lv-selected-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearSelection());
      }

      // Add New
      const addBtn = this.container.querySelector('.panoptes-lv-btn-add');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.add());
      }

      // Page size change
      const pageSizeSelect = this.container.querySelector('.panoptes-lv-pagesize');
      if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
          this.pageSize = parseInt(e.target.value, 10);
          this.page = 1;
          this.read();
        });
      }
    }

    async read() {
      const contentEl = this.container.querySelector('.panoptes-lv-content');
      this.renderSkeleton(contentEl);

      const ds = this.config.dataSource || {};
      const url = ds.readUrl;
      const method = (ds.readMethod || 'POST').toUpperCase();

      if (!url) {
        console.warn(`Panoptes.ListView [${this.id}] no readUrl configured.`);
        return;
      }

      const requestPayload = {
        page: this.page,
        pageSize: this.pageSize,
        sort: this.sortField ? [{ field: this.sortField, dir: this.sortDir }] : []
      };

      if (this.searchQuery) {
        requestPayload.filter = {
          logic: 'or',
          filters: [
            { field: 'Name', operator: 'contains', value: this.searchQuery },
            { field: 'Category', operator: 'contains', value: this.searchQuery }
          ]
        };
      }

      try {
        let res;
        if (method === 'POST') {
          res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(requestPayload)
          });
        } else {
          const q = new URLSearchParams();
          q.set('page', this.page);
          q.set('pageSize', this.pageSize);
          if (this.searchQuery) q.set('search', this.searchQuery);
          res = await fetch(`${url}?${q.toString()}`);
        }

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const result = await res.json();

        // Standard DataSourceResult has { data: [...], total: ... }
        if (result && Array.isArray(result.data)) {
          this.items = result.data;
          this.total = typeof result.total === 'number' ? result.total : result.data.length;
        } else if (Array.isArray(result)) {
          this.items = result;
          this.total = result.length;
        } else {
          this.items = [];
          this.total = 0;
        }

        this.renderItems();
        this.renderPager();
        this.trigger('onDataBound', { items: this.items, total: this.total });
      } catch (err) {
        console.error(`Panoptes.ListView [${this.id}] fetch error:`, err);
        contentEl.innerHTML = `
          <div class="p-8 text-center bg-red-50 text-red-700 rounded-2xl border border-red-200">
            <div class="font-bold text-sm">Veri yüklenirken bir hata oluştu!</div>
            <div class="text-xs text-red-500 mt-1">${escapeHtml(err.message)}</div>
            <button type="button" class="mt-3 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-xl shadow-xs hover:bg-red-700 transition" onclick="window.Panoptes.ListView.get('${this.id}').read()">Tekrar Dene</button>
          </div>
        `;
      }
    }

    renderSkeleton(el) {
      if (!el) return;
      const cols = this.config.columns || 3;
      const gridClass = this.config.layout === 'list' 
        ? 'space-y-4' 
        : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-5`;

      el.innerHTML = `
        <div class="${gridClass}">
          ${Array(cols * 2).fill(0).map(() => `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
              <div class="w-full h-36 bg-slate-100 rounded-xl"></div>
              <div class="h-4 bg-slate-100 rounded-md w-3/4"></div>
              <div class="h-3 bg-slate-100 rounded-md w-1/2"></div>
              <div class="flex justify-between items-center pt-2">
                <div class="h-5 bg-slate-100 rounded-md w-20"></div>
                <div class="h-8 bg-slate-100 rounded-xl w-24"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    renderItems() {
      const contentEl = this.container.querySelector('.panoptes-lv-content');
      if (!contentEl) return;

      if (this.items.length === 0 && !this.isAdding) {
        contentEl.innerHTML = `
          <div class="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            </div>
            <div class="font-bold text-slate-800 text-sm">Herhangi bir kayıt bulunamadı</div>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Arama kriterlerinizi değiştirerek veya yeni bir kayıt ekleyerek tekrar deneyebilirsiniz.</p>
            ${this.searchQuery ? `
              <button type="button" class="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition" onclick="const input = document.getElementById('${this.id}').querySelector('.panoptes-lv-search'); if(input) { input.value = ''; } window.Panoptes.ListView.get('${this.id}').searchQuery = ''; window.Panoptes.ListView.get('${this.id}').read();">
                Aramayı Temizle
              </button>
            ` : ''}
          </div>
        `;
        return;
      }

      const cols = this.config.columns || 3;
      const gridClass = this.config.layout === 'list' 
        ? 'space-y-4' 
        : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-5`;

      contentEl.innerHTML = `<div class="${gridClass}" id="${this.id}-items-wrapper"></div>`;
      const wrapper = document.getElementById(`${this.id}-items-wrapper`);

      // If adding new item, prepend the edit form card
      if (this.isAdding) {
        const addCard = document.createElement('div');
        addCard.className = `panoptes-lv-item-add panoptes-lv-edit-card bg-white rounded-2xl p-5 border-2 border-dashed border-blue-400 shadow-md ${this.config.itemClass || ''}`;
        addCard.innerHTML = this.renderEditForm({ id: 0, name: '', category: '', price: 0, stock: 10, isActive: true }, true);
        wrapper.appendChild(addCard);
        this.bindCardActions(addCard, null, true);
      }

      this.items.forEach((item, index) => {
        const itemId = this.getItemId(item, index);
        const isSelected = this.selectedKeys.has(itemId);
        const isEditing = (this.editingId === itemId);

        const card = document.createElement('div');
        card.dataset.id = itemId;
        card.dataset.index = index;

        let baseClasses = `panoptes-lv-item group relative transition-all duration-200 ${this.config.itemClass || ''}`;
        if (this.config.selectable !== 'none') {
          baseClasses += ' cursor-pointer select-none';
        }
        if (isSelected) {
          baseClasses += ' ring-2 ring-blue-600 bg-blue-50/20 shadow-md';
        }

        card.className = baseClasses;

        if (!this.itemTemplate && this.config.clientTemplateId) {
          this.itemTemplate = this.resolveTemplate(this.config.clientTemplateId, this.config.templateHtml);
        }
        if (!this.altTemplate && this.config.clientAltTemplateId) {
          this.altTemplate = this.resolveTemplate(this.config.clientAltTemplateId, this.config.altTemplateHtml) || this.itemTemplate;
        }

        if (isEditing) {
          card.classList.add('panoptes-lv-edit-card', 'bg-white', 'rounded-2xl', 'p-5', 'border-2', 'border-blue-500', 'shadow-lg');
          card.innerHTML = this.renderEditForm(item, false);
          this.bindCardActions(card, item, false);
        } else {
          // Normal template rendering
          const tpl = (index % 2 === 1 && this.altTemplate) ? this.altTemplate : this.itemTemplate;
          let renderedContent = '';
          if (tpl) {
            renderedContent = tpl(item);
          }
          if (!renderedContent) {
            renderedContent = this.defaultCardTemplate(item);
          }

          card.innerHTML = renderedContent;

          // If selectable, attach click handler
          if (this.config.selectable !== 'none') {
            card.addEventListener('click', (e) => {
              // Don't toggle selection if clicking an edit or delete button inside card
              if (e.target.closest('.panoptes-lv-action-btn') || e.target.closest('button') || e.target.closest('input')) {
                return;
              }
              this.toggleSelect(itemId);
            });
          }

          // If editable, bind edit/delete button triggers inside card
          this.bindCardActions(card, item, false);
        }

        wrapper.appendChild(card);
      });

      this.updateSelectionBar();
    }

    defaultCardTemplate(item) {
      const isSelected = this.selectedKeys.has(this.getItemId(item));
      return `
        <div class="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between h-full">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider mb-1">
                  ${escapeHtml(item.Category || item.category || 'Genel')}
                </span>
                <h4 class="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition leading-snug">
                  ${escapeHtml(item.Name || item.name || 'İsimsiz')}
                </h4>
              </div>
              ${this.config.selectable !== 'none' ? `
                <div class="w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}">
                  ${isSelected ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                </div>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-slate-100">
              <div>
                <span class="text-slate-400 block text-[10px]">Stok Durumu</span>
                <span class="font-semibold text-slate-700">${item.Stock ?? item.stock ?? 0} Adet</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Durum</span>
                <span class="font-semibold ${(item.IsActive ?? item.isActive) ? 'text-emerald-600' : 'text-slate-400'}">
                  ${(item.IsActive ?? item.isActive) ? '● Aktif' : '○ Pasif'}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 mt-1">
            <div class="text-base font-black text-slate-900">
              ${formatCurrency(item.Price ?? item.price ?? 0)}
            </div>

            ${this.config.editable ? `
              <div class="flex items-center gap-1.5">
                <button type="button" class="panoptes-lv-action-btn panoptes-lv-btn-edit px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition flex items-center gap-1" title="Düzenle">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  <span>Düzenle</span>
                </button>
                <button type="button" class="panoptes-lv-action-btn panoptes-lv-btn-delete p-1 text-xs rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition" title="Sil">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    renderEditForm(item, isNew) {
      if (this.editTemplate) {
        return this.editTemplate(item);
      }

      // Default high-polish edit form
      const name = item.Name || item.name || '';
      const category = item.Category || item.category || '';
      const price = item.Price ?? item.price ?? 0;
      const stock = item.Stock ?? item.stock ?? 0;
      const isActive = (item.IsActive ?? item.isActive) !== false;

      return `
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-xs font-bold text-blue-900 uppercase tracking-wider">
              ${isNew ? '✨ Yeni Kayıt Ekle' : '✏️ Kaydı Düzenle'}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">ID: ${item.Id || item.id || 'Yeni'}</span>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Ürün Adı *</label>
              <input type="text" name="name" value="${escapeHtml(name)}" required 
                     class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Ürün adı giriniz" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Kategori</label>
                <input type="text" name="category" value="${escapeHtml(category)}" 
                       class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kategori" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Fiyat (₺) *</label>
                <input type="number" step="0.01" name="price" value="${price}" required 
                       class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 items-center pt-1">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Stok</label>
                <input type="number" name="stock" value="${stock}" 
                       class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              <div class="flex items-center gap-2 pt-4">
                <input type="checkbox" name="isActive" id="edit_active_${item.Id || 0}" ${isActive ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                <label for="edit_active_${item.Id || 0}" class="text-xs font-semibold text-slate-700 cursor-pointer">Aktif</label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" class="panoptes-lv-btn-cancel px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition">
              İptal
            </button>
            <button type="button" class="panoptes-lv-btn-save px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
              Kaydet
            </button>
          </div>
        </div>
      `;
    }

    bindCardActions(cardEl, item, isNew) {
      // Edit button trigger
      const editBtn = cardEl.querySelector('.panoptes-lv-btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = this.getItemId(item);
          this.edit(itemId);
        });
      }

      // Delete button trigger
      const deleteBtn = cardEl.querySelector('.panoptes-lv-btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = this.getItemId(item);
          this.remove(itemId);
        });
      }

      // Save button trigger
      const saveBtn = cardEl.querySelector('.panoptes-lv-btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.saveFromCard(cardEl, item, isNew);
        });
      }

      // Cancel button trigger
      const cancelBtn = cardEl.querySelector('.panoptes-lv-btn-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cancel();
        });
      }
    }

    async saveFromCard(cardEl, originalItem, isNew) {
      const inputs = cardEl.querySelectorAll('input, select, textarea');
      const formData = originalItem ? { ...originalItem } : {};

      inputs.forEach(inp => {
        if (!inp.name) return;
        if (inp.type === 'checkbox') {
          formData[inp.name] = inp.checked;
        } else if (inp.type === 'number') {
          formData[inp.name] = parseFloat(inp.value) || 0;
        } else {
          formData[inp.name] = inp.value;
        }
      });

      const ds = this.config.dataSource || {};
      const url = isNew ? (ds.createUrl || ds.updateUrl) : (ds.updateUrl || ds.createUrl);

      if (!url) {
        // Local mode or fallback
        if (isNew) {
          formData.id = Date.now();
          this.items.unshift(formData);
          this.total++;
        } else {
          const idx = this.items.findIndex(x => this.getItemId(x) === this.getItemId(originalItem));
          if (idx !== -1) this.items[idx] = { ...this.items[idx], ...formData };
        }
        this.editingId = null;
        this.isAdding = false;
        this.renderItems();
        this.trigger('onSave', { item: formData, isNew });
        return;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.editingId = null;
        this.isAdding = false;
        this.trigger('onSave', { item: formData, isNew });
        await this.read();
      } catch (err) {
        alert(`Kayıt kaydedilirken hata oluştu: ${err.message}`);
      }
    }

    async remove(id) {
      const item = this.items.find(x => this.getItemId(x) === id);
      const name = item ? (item.Name || item.name || `#${id}`) : `#${id}`;

      if (!confirm(`"${name}" kaydını silmek istediğinize emin misiniz?`)) {
        return;
      }

      const ds = this.config.dataSource || {};
      const url = ds.destroyUrl;

      if (!url) {
        this.items = this.items.filter(x => this.getItemId(x) !== id);
        this.total = Math.max(0, this.total - 1);
        this.selectedKeys.delete(id);
        this.renderItems();
        this.renderPager();
        this.trigger('onRemove', { id });
        return;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(item || { id })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.selectedKeys.delete(id);
        this.trigger('onRemove', { id });
        await this.read();
      } catch (err) {
        alert(`Kayıt silinirken hata oluştu: ${err.message}`);
      }
    }

    renderPager() {
      if (!this.config.pageable) return;
      const totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
      const summaryEl = this.container.querySelector('.panoptes-lv-summary');
      const buttonsEl = this.container.querySelector('.panoptes-lv-page-buttons');

      if (summaryEl) {
        const start = this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
        const end = Math.min(this.page * this.pageSize, this.total);
        summaryEl.innerHTML = `Toplam <strong>${this.total}</strong> kayıttan <strong>${start} - ${end}</strong> arası gösteriliyor`;
      }

      if (buttonsEl) {
        let html = '';

        // Previous
        html += `
          <button type="button" class="panoptes-lv-page-btn p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition" 
                  data-page="${this.page - 1}" ${this.page <= 1 ? 'disabled' : ''} title="Önceki Sayfa">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
        `;

        // Page numbers
        let startPage = Math.max(1, this.page - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
          startPage = Math.max(1, endPage - 4);
        }

        for (let p = startPage; p <= endPage; p++) {
          const isActive = (p === this.page);
          html += `
            <button type="button" class="panoptes-lv-page-btn w-7 h-7 text-xs font-bold rounded-lg transition ${isActive ? 'bg-blue-600 text-white shadow-2xs' : 'border border-slate-200 text-slate-700 hover:bg-slate-100'}" 
                    data-page="${p}">
              ${p}
            </button>
          `;
        }

        // Next
        html += `
          <button type="button" class="panoptes-lv-page-btn p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition" 
                  data-page="${this.page + 1}" ${this.page >= totalPages ? 'disabled' : ''} title="Sonraki Sayfa">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        `;

        buttonsEl.innerHTML = html;

        buttonsEl.querySelectorAll('.panoptes-lv-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.page, 10);
            if (!isNaN(p) && p >= 1 && p <= totalPages && p !== this.page) {
              this.page = p;
              this.read();
            }
          });
        });
      }
    }

    getItemId(item, index) {
      if (item) {
        if (item.id !== undefined) return item.id;
        if (item.Id !== undefined) return item.Id;
        if (item.ID !== undefined) return item.ID;
      }
      return index !== undefined ? index : 0;
    }

    toggleSelect(id) {
      if (this.config.selectable === 'single') {
        this.selectedKeys.clear();
        this.selectedKeys.add(id);
      } else if (this.config.selectable === 'multiple') {
        if (this.selectedKeys.has(id)) {
          this.selectedKeys.delete(id);
        } else {
          this.selectedKeys.add(id);
        }
      }
      this.renderItems();
      this.trigger('onChange', { selected: this.getSelected() });
    }

    selectAll() {
      if (this.config.selectable !== 'multiple') return;
      this.items.forEach((item, index) => {
        this.selectedKeys.add(this.getItemId(item, index));
      });
      this.renderItems();
      this.trigger('onChange', { selected: this.getSelected() });
    }

    clearSelection() {
      this.selectedKeys.clear();
      this.renderItems();
      this.trigger('onChange', { selected: [] });
    }

    getSelected() {
      return this.items.filter((item, index) => this.selectedKeys.has(this.getItemId(item, index)));
    }

    updateSelectionBar() {
      const bar = this.container.querySelector('.panoptes-lv-selected-bar');
      const text = this.container.querySelector('.panoptes-lv-selected-text');
      const clearBtn = this.container.querySelector('.panoptes-lv-btn-clearselect');

      const count = this.selectedKeys.size;
      if (bar) {
        if (count > 0 && this.config.selectable === 'multiple') {
          bar.classList.remove('hidden');
          if (text) text.textContent = `${count} adet öğe seçildi`;
        } else {
          bar.classList.add('hidden');
        }
      }
      if (clearBtn) {
        if (count > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
    }

    edit(id) {
      this.editingId = id;
      this.isAdding = false;
      this.renderItems();
      this.trigger('onEdit', { id });
    }

    add() {
      this.isAdding = true;
      this.editingId = null;
      this.renderItems();
      // Scroll to top of grid
      const contentEl = this.container.querySelector('.panoptes-lv-content');
      if (contentEl) contentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    cancel() {
      this.editingId = null;
      this.isAdding = false;
      this.renderItems();
      this.trigger('onCancel', {});
    }

    trigger(eventName, data) {
      const callbackName = this.config[eventName];
      if (callbackName && typeof window[callbackName] === 'function') {
        try {
          window[callbackName](data, this);
        } catch (e) {
          console.error(`Panoptes.ListView callback [${callbackName}] error:`, e);
        }
      }
      // Also dispatch standard DOM CustomEvent
      this.wrapper.dispatchEvent(new CustomEvent(`panoptes:${eventName.toLowerCase()}`, { detail: data }));
    }
  }

  // Public Static API
  window.Panoptes.ListView = {
    init: function (id) {
      const inst = new PanoptesListViewInstance(id);
      window.Panoptes.instances[id] = inst;
      return inst;
    },
    get: function (id) {
      return window.Panoptes.instances[id];
    }
  };

})(window);
