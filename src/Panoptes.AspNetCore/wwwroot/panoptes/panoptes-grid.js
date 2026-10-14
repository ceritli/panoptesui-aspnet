/**
 * Panoptes Grid v1.3.0 - Full Enterprise Engine
 * Complete Panoptes UI for ASP.NET Core Enterprise Grid Features:
 * - Multi-Column (Grouped) Headers (colspan/rowspan)
 * - Drag-and-Drop Column Reordering
 * - Filter Row & Filter Menu modes
 * - In-Line, PopUp Modal and In-Cell (Batch) Editing
 * - Master-Detail (Hierarchy) Row Expansion
 * - Keyboard Navigation (Arrow keys, Enter, Esc)
 * - Aggregates Footer (Sum, Count, Avg)
 * - Column Resizing, Column Chooser, Frozen Columns
 * - Excel (UTF-8 CSV) and PDF Export
 */
(function (window) {
  'use strict';

  window.Panoptes = window.Panoptes || {};
  window.Panoptes.instances = window.Panoptes.instances || {};

  
  // OpenXML XLSX Engine
  function crc32(buf) {
    let crc = 0 ^ (-1);
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function buildZip(files) {
    const encoder = new TextEncoder();
    const parts = [];
    const centralHeaders = [];
    let offset = 0;

    for (const f of files) {
      const data = typeof f.content === 'string' ? encoder.encode(f.content) : f.content;
      const nameBytes = encoder.encode(f.name);
      const crc = crc32(data);
      const size = data.length;

      // Local Header (30 bytes + name length)
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true); // Stored
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      parts.push(local, data);

      // Central Directory Header (46 bytes + name length)
      const central = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      central.set(nameBytes, 46);

      centralHeaders.push(central);
      offset += local.length + size;
    }

    const centralOffset = offset;
    let centralSize = 0;
    centralHeaders.forEach(c => { centralSize += c.length; });

    // End of Central Directory (22 bytes)
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    ev.setUint16(20, 0, true);

    const totalLen = offset + centralSize + 22;
    const finalBuffer = new Uint8Array(totalLen);
    let curPos = 0;
    for (const p of parts) {
      finalBuffer.set(p, curPos);
      curPos += p.length;
    }
    for (const c of centralHeaders) {
      finalBuffer.set(c, curPos);
      curPos += c.length;
    }
    finalBuffer.set(eocd, curPos);

    return finalBuffer;
  }

  class PanoptesGridInstance {
    constructor(elementId) {
      this.elementId = elementId;
      this.wrapper = document.getElementById(elementId);
      if (!this.wrapper) return;

      this.config = this.readConfig();
      this.container = this.wrapper.querySelector('.panoptes-grid-container');

      this.state = {
        page: 1,
        pageSize: this.config.pageSize || 10,
        sorts: [],
        columnFilters: {},
        searchKeyword: '',
        groups: [],
        collapsedGroups: new Set(),
        expandedDetailRows: new Set(),
        selectedKeys: new Set(),
        editingRowIndex: null,
        isNewRow: false,
        dirtyItems: new Map(),
        focusedCell: { rowIndex: 0, colIndex: 0 },
        loading: false,
        data: [],
        total: 0,
        aggregates: null
      };

      this.activePopover = null;
      this.activeColumnMenu = false;
      this.debounceTimer = null;
      this.draggedColIdx = null;

      if (this.config.persistState) {
        this.loadState();
      }

      this.initLayout();
      this.fetchData();
    }

    getLocale() {
      const code = (this.config.locale || window.panoptes?.currentLocale || document.documentElement.lang || 'tr').toLowerCase();
      return code.startsWith('en') ? 'en' : 'tr';
    }

    emit(eventName, detail = {}) {
      if (!this.wrapper) return;
      const customEvent = new CustomEvent(eventName, { bubbles: true, detail });
      this.wrapper.dispatchEvent(customEvent);

      const shortName = eventName.replace('panoptes:', '');
      const pascal = shortName.charAt(0).toUpperCase() + shortName.slice(1);
      const callbackName = this.config[`on${pascal}`] || this.config[`on${shortName}`];
      if (callbackName && typeof window[callbackName] === 'function') {
        window[callbackName](detail);
      }
    }

    readConfig() {
      const script = this.wrapper.querySelector(`script[data-panoptes-config="${this.elementId}"]`);
      if (script && script.textContent) {
        try {
          return JSON.parse(script.textContent);
        } catch (e) {
          console.error('[Panoptes] Config parse error:', e);
        }
      }
      return {};
    }

    initLayout() {
      this.container.innerHTML = `
        ${this.renderGroupBar()}
        ${this.renderToolbar()}
        <div class="panoptes-table-container" tabindex="0">
          <table class="panoptes-table">
            <thead>${this.renderThead()}</thead>
            <tbody id="${this.elementId}-tbody"></tbody>
            <tfoot id="${this.elementId}-tfoot"></tfoot>
          </table>
        </div>
        <div class="panoptes-pager" id="${this.elementId}-pager"></div>
      `;

      this.bindEvents();
      this.initResizers();
      this.initReordering();
      this.initKeyboardNav();
    }

    renderGroupBar() {
      if (!this.config.groupable) return '';
      const isEn = this.getLocale() === 'en';

      const groupChips = this.state.groups.map(g => `
        <span class="panoptes-group-chip" draggable="true" data-group-field="${g.field}"><svg style="width: 0.75rem; height: 0.75rem; color: #94a3b8; cursor: grab;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
          <span>${this.getColumnTitle(g.field)}</span>
          <span class="panoptes-group-chip-remove" data-action="remove-group" data-field="${g.field}">×</span>
        </span>
      `).join('');

      return `
        <div class="panoptes-group-bar" id="${this.elementId}-group-bar">
          <svg style="width: 1rem; height: 1rem; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <span style="font-weight: 500;">${isEn ? 'Grouping:' : 'Gruplama:'}</span>
          ${groupChips ? groupChips : `<span style="color:#94a3b8;"><span class="panoptes-group-prompt"><svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg> ${isEn ? 'Drag a column header here to group' : 'Gruplamak için bir sütun başlığını buraya sürükleyin'}</span></span>`}
          <select class="panoptes-select-control" data-action="add-group" style="margin-left: auto; font-size: 0.75rem;">
            <option value="">${isEn ? '+ Add Group...' : '+ Grup Ekle...'}</option>
            ${this.getLeafColumns().filter(c => c.field && !this.state.groups.some(g => g.field === c.field)).map(c => `
              <option value="${c.field}">${c.title || c.field}</option>
            `).join('')}
          </select>
        </div>
      `;
    }

    renderToolbar() {
      const hasCrud = this.config.dataSource && (this.config.dataSource.createUrl || this.config.editable);
      const isBatch = this.config.editable === 'incell' || this.config.editable === 'batch';
      const dirtyCount = this.state.dirtyItems.size;
      const isEn = this.getLocale() === 'en';

      return `
        <div class="panoptes-toolbar">
          <div class="panoptes-toolbar-left">
            ${hasCrud ? `
              <button class="panoptes-btn panoptes-btn-primary" data-action="add-new">
                <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>${isEn ? 'Add New Record' : 'Yeni Kayıt Ekle'}</span>
              </button>
            ` : ''}

            ${isBatch && dirtyCount > 0 ? `
              <button class="panoptes-btn panoptes-btn-success" data-action="save-batch">
                <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>${isEn ? `Save Changes (${dirtyCount})` : `Değişiklikleri Kaydet (${dirtyCount})`}</span>
              </button>
              <button class="panoptes-btn" data-action="cancel-batch">${isEn ? 'Cancel' : 'İptal'}</button>
            ` : ''}

            ${this.state.selectedKeys.size > 0 ? `
              <div class="panoptes-selection-badge">
                <span>${isEn ? `${this.state.selectedKeys.size} selected` : `${this.state.selectedKeys.size} seçildi`}</span>
                <button type="button" class="panoptes-btn panoptes-btn-xs" data-action="clear-selection" style="padding: 0.1rem 0.4rem; font-size: 0.7rem; border-radius: 9999px;">${isEn ? 'Clear' : 'Temizle'}</button>
              </div>
            ` : ''}

            ${this.config.searchable ? `
              <div style="position: relative; display: inline-flex; align-items: center;">
                <svg style="position: absolute; left: 0.65rem; width: 1rem; height: 1rem; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="text" class="panoptes-search-input" placeholder="${isEn ? 'Quick search...' : 'Hızlı ara...'}" data-action="quick-search" value="${this.state.searchKeyword}" />
              </div>
            ` : ''}
          </div>

          <div class="panoptes-toolbar-right">
            ${this.config.columnMenu ? `
              <button class="panoptes-btn" data-action="toggle-column-menu" title="${isEn ? 'Show/Hide Columns' : 'Sütunları Göster/Gizle'}">
                <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
                </svg>
                <span>${isEn ? 'Columns' : 'Sütunlar'}</span>
              </button>
              <div class="panoptes-column-menu-dropdown" id="${this.elementId}-column-menu" style="display: none;"></div>
            ` : ''}

            <button class="panoptes-btn" data-action="refresh" title="${isEn ? 'Refresh' : 'Yenile'}">
              <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>${isEn ? 'Refresh' : 'Yenile'}</span>
            </button>

            ${this.config.exportable ? `
              <button class="panoptes-btn" data-action="export-excel" title="${isEn ? 'Export to Excel' : "Excel'e Aktar"}">
                <svg style="width: 0.95rem; height: 0.95rem; color: #16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Excel</span>
              </button>
            ` : ''}

            ${this.config.pdfExport !== false ? `
              <button class="panoptes-btn" data-action="export-pdf" title="${isEn ? 'Export to PDF' : 'PDF Olarak Yazdır / İndir'}">
                <svg style="width: 0.95rem; height: 0.95rem; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span>PDF</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    getLeafColumns(cols = this.config.columns || []) {
      const leaves = [];
      cols.forEach(col => {
        if (col.columns && col.columns.length > 0) {
          leaves.push(...this.getLeafColumns(col.columns));
        } else {
          leaves.push(col);
        }
      });
      return leaves.filter(c => !c.hidden);
    }

    renderThead() {
      const cols = this.config.columns || [];
      const hasMultiHeader = cols.some(c => c.columns && c.columns.length > 0);
      const leafCols = this.getLeafColumns();

      let headerRows = '';

      if (hasMultiHeader) {
        // Multi-Column Row 1 (Parents and standalones)
        headerRows += '<tr>';
        if (this.hasDetail()) headerRows += '<th rowspan="2" style="width: 44px;"></th>';
        if (this.config.selectable && !leafCols.some(c => c.selectable)) headerRows += '<th rowspan="2" style="width: 44px; text-align: center;"><input type="checkbox" data-action="select-all" /></th>';

        cols.forEach((col, idx) => {
          if (col.hidden) return;
          if (col.columns && col.columns.length > 0) {
            const visibleChildCount = col.columns.filter(c => !c.hidden).length;
            headerRows += `<th colspan="${visibleChildCount}" style="text-align: center; border-bottom: 1px solid #e2e8f0; background: #f1f5f9;">${col.title}</th>`;
          } else {
            headerRows += this.renderSingleTh(col, idx, 'rowspan="2"');
          }
        });

        if (this.hasActionsColumn()) headerRows += '<th rowspan="2" style="width: 140px; text-align: center;">İşlemler</th>';
        headerRows += '</tr>';

        // Multi-Column Row 2 (Children)
        headerRows += '<tr>';
        cols.forEach(col => {
          if (col.hidden || !col.columns || col.columns.length === 0) return;
          col.columns.forEach((childCol, cIdx) => {
            if (!childCol.hidden) headerRows += this.renderSingleTh(childCol, `${col.title}-${cIdx}`, '');
          });
        });
        headerRows += '</tr>';
      } else {
        // Normal Single Row Header
        headerRows += '<tr>';
        if (this.hasDetail()) headerRows += '<th style="width: 44px;"></th>';
        if (this.config.selectable && !leafCols.some(c => c.selectable)) headerRows += '<th style="width: 44px; text-align: center;"><input type="checkbox" data-action="select-all" /></th>';

        leafCols.forEach((col, idx) => {
          headerRows += this.renderSingleTh(col, idx, '');
        });

        if (this.hasActionsColumn()) headerRows += '<th style="width: 140px; text-align: center;">İşlemler</th>';
        headerRows += '</tr>';
      }

      // Filter Row Mode (inline inputs under header)
      if (this.config.filterMode === 'row' || this.config.filterMode === 'both') {
        headerRows += '<tr class="panoptes-filter-row">';
        if (this.hasDetail()) headerRows += '<th></th>';
        if (this.config.selectable) headerRows += '<th></th>';

        leafCols.forEach(col => {
          if (!col.field || col.filterable === false) {
            headerRows += '<th></th>';
          } else {
            const curVal = this.state.columnFilters[col.field]?.value || '';
            headerRows += `
              <th style="padding: 0.35rem 0.5rem;">
                <input type="text" class="panoptes-edit-input" placeholder="${col.title || col.field} ara..."
                       data-action="filter-row-input" data-field="${col.field}" value="${curVal}" style="font-weight: normal;" />
              </th>
            `;
          }
        });

        if (this.hasActionsColumn()) headerRows += '<th></th>';
        headerRows += '</tr>';
      }

      return headerRows;
    }

    renderSingleTh(col, idx, spanAttr) {
      if (col.selectable) {
        return `
          <th style="width: ${col.width || '55px'}; text-align: center;" class="${col.headerClass || ''}" ${spanAttr}>
            <input type="checkbox" data-action="select-all" />
          </th>
        `;
      }

      const sortable = col.sortable !== false && this.config.sortable !== false && !!col.field;
      const filterable = col.filterable !== false && this.config.filterable !== false && !!col.field && this.config.filterMode !== 'row';
      const sort = this.state.sorts.find(s => s.field.toLowerCase() === (col.field || '').toLowerCase());
      const sortDir = sort ? sort.dir : '';
      const widthStyle = col.width ? `style="width: ${col.width};"` : '';
      const isFiltered = !!this.state.columnFilters[col.field];
      const frozenClass = col.frozen ? 'panoptes-frozen-left' : '';

      let sortIcon = '';
      if (sortable) {
        if (sortDir === 'asc') {
          sortIcon = `<svg style="width: 0.9rem; height: 0.9rem; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>`;
        } else if (sortDir === 'desc') {
          sortIcon = `<svg style="width: 0.9rem; height: 0.9rem; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
        }
      }

      let filterIcon = '';
      if (filterable) {
        filterIcon = `
          <span class="panoptes-filter-btn ${isFiltered ? 'active' : ''}" data-action="open-filter" data-field="${col.field}" title="Filtrele">
            <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </span>
        `;
      }

      return `
        <th class="${sortable ? 'sortable' : ''} ${frozenClass} ${col.headerClass || ''}" ${widthStyle} ${spanAttr} data-field="${col.field || ''}" data-col-index="${idx}" draggable="${this.config.reorderable !== false ? 'true' : 'false'}">
          <div class="panoptes-th-content">
            <div style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; text-overflow: ellipsis;">
              <span>${col.title || col.field || ''}</span>
              ${sortIcon}
            </div>
            ${filterIcon}
          </div>
          ${this.config.resizable !== false ? `<div class="panoptes-resizer"></div>` : ''}
        </th>
      `;
    }

    renderRows() {
      const tbody = this.wrapper.querySelector(`#${this.elementId}-tbody`);
      if (!tbody) return;

      const leafCols = this.getLeafColumns();
      const totalColCount = leafCols.length + (this.config.selectable ? 1 : 0) + (this.hasDetail() ? 1 : 0) + (this.hasActionsColumn() ? 1 : 0);

      if (this.state.loading) {
        let skeletonHtml = '';
        for (let i = 0; i < 5; i++) {
          skeletonHtml += `<tr><td colspan="${totalColCount}" style="padding: 0.5rem 1rem;"><div class="panoptes-skeleton-row" style="border-radius: 0.375rem;"></div></td></tr>`;
        }
        tbody.innerHTML = skeletonHtml;
        return;
      }

      let rowsHtml = '';

      if (this.state.isNewRow && this.config.editable === 'inline') {
        rowsHtml += this.renderInlineEditRow({}, -1, true);
      }

      if (!this.state.data || this.state.data.length === 0) {
        if (!this.state.isNewRow) {
          tbody.innerHTML = `
            <tr>
              <td colspan="${totalColCount}" style="text-align: center; padding: 3.5rem 1rem; color: #94a3b8;">
                <svg style="margin: 0 auto 0.5rem auto; width: 2.5rem; height: 2.5rem; color: #cbd5e1;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div style="font-weight: 500;">${this.getLocale() === 'en' ? 'No records to display' : 'Gösterilecek kayıt bulunamadı'}</div>
              </td>
            </tr>
          `;
          this.renderFooter();
          return;
        }
      }

      const isGrouped = this.state.data.length > 0 && this.state.data[0].items !== undefined && this.state.data[0].field !== undefined;

      if (isGrouped) {
        this.state.data.forEach((group, gIdx) => {
          const groupKey = String(group.key ?? '(Boş)');
          const isCollapsed = this.state.collapsedGroups.has(groupKey);

          rowsHtml += `
            <tr class="panoptes-group-header-row" data-action="toggle-group-row" data-group-key="${groupKey}">
              <td colspan="${totalColCount}">
                <div class="panoptes-group-header-content">
                  <svg style="width: 1rem; height: 1rem; transition: transform 0.15s ease; ${isCollapsed ? 'transform: rotate(-90deg);' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                  <span>${this.getColumnTitle(group.field)}: <strong>${groupKey}</strong></span>
                  <span class="panoptes-badge panoptes-badge-info">${group.count} kayıt</span>
                  ${this.renderGroupAggregates(group.items, leafCols)}
                </div>
              </td>
            </tr>
          `;

          if (!isCollapsed && group.items) {
            group.items.forEach((row, rIdx) => {
              rowsHtml += this.renderSingleRow(row, `${gIdx}-${rIdx}`, leafCols);
            });
          }
        });
      } else {
        this.state.data.forEach((row, rIdx) => {
          if (this.state.editingRowIndex === rIdx && this.config.editable === 'inline') {
            rowsHtml += this.renderInlineEditRow(row, rIdx, false);
          } else {
            rowsHtml += this.renderSingleRow(row, rIdx, leafCols);
          }
        });
      }

      tbody.innerHTML = rowsHtml;
      this.renderFooter();
      this.renderPager();
      this.initNestedGrids();
      if (window.Panoptes && window.Panoptes.initAll) window.Panoptes.initAll(tbody);
    }

    renderSingleRow(row, rowIndex, cols) {
      const rowKey = String(this.getDeepValue(row, 'id') ?? rowIndex);
      const isSelected = this.state.selectedKeys.has(rowKey);
      const isDetailExpanded = this.state.expandedDetailRows.has(rowKey);

      let html = `<tr class="${isSelected ? 'selected panoptes-row-selected' : ''}" data-row-index="${rowIndex}" data-key="${rowKey}">`;

      if (this.hasDetail()) {
        html += `
          <td style="text-align: center; width: 44px;">
            <button class="panoptes-expand-btn" data-action="toggle-detail" data-key="${rowKey}" title="Detay">
              ${isDetailExpanded ? '−' : '+'}
            </button>
          </td>
        `;
      }

      if (this.config.selectable && !cols.some(c => c.selectable)) {
        html += `
          <td style="text-align: center; width: 44px;">
            <input type="checkbox" data-action="select-row" data-key="${rowKey}" ${isSelected ? 'checked' : ''} />
          </td>
        `;
      }

      const isBatch = this.config.editable === 'incell' || this.config.editable === 'batch';

      cols.forEach((col, cIdx) => {
        if (col.selectable) {
          html += `
            <td style="text-align: center; width: ${col.width || '55px'};" class="${col.class || ''}">
              <input type="checkbox" data-action="select-row" data-key="${rowKey}" ${isSelected ? 'checked' : ''} />
            </td>
          `;
          return;
        }

        let val = col.field ? this.getDeepValue(row, col.field) : null;
        let formattedVal = this.formatCell(val, col, row);
        const frozenClass = col.frozen ? 'panoptes-frozen-left' : '';
        const isDirty = this.isCellDirty(rowKey, col.field);

        html += `
          <td style="text-align: ${col.align || 'left'};" 
              class="${frozenClass} ${col.class || ''} ${isDirty ? 'panoptes-cell-dirty' : ''} ${isBatch && col.editable !== false ? 'cursor-pointer' : ''}"
              data-cell-field="${col.field || ''}"
              data-row-key="${rowKey}"
              data-col-idx="${cIdx}">
            ${formattedVal}
          </td>
        `;
      });

      if (this.hasActionsColumn()) {
        html += `
          <td style="text-align: center; white-space: nowrap;">
            <button class="panoptes-btn panoptes-btn-sm" data-action="edit-row" data-index="${rowIndex}" title="Düzenle">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              <span>Düzenle</span>
            </button>
            <button class="panoptes-btn panoptes-btn-sm panoptes-btn-danger" data-action="delete-row" data-index="${rowIndex}" title="Sil">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        `;
      }

      html += '</tr>';

      if (this.hasDetail() && isDetailExpanded) {
        const totalColCount = cols.length + (this.config.selectable ? 1 : 0) + 1 + (this.hasActionsColumn() ? 1 : 0);
        html += `
          <tr class="panoptes-detail-row">
            <td colspan="${totalColCount}">
              <div class="panoptes-detail-card">
                ${this.renderDetailContent(row)}
              </div>
            </td>
          </tr>
        `;
      }

      return html;
    }

    renderInlineEditRow(row, rowIndex, isNew) {
      const cols = this.getLeafColumns();
      let html = `<tr class="editing" data-edit-index="${rowIndex}">`;

      if (this.hasDetail()) html += `<td></td>`;
      if (this.config.selectable) html += `<td></td>`;

      cols.forEach(col => {
        if (!col.field || col.editable === false || (col.field.toLowerCase() === 'id' && isNew)) {
          let val = col.field ? this.getDeepValue(row, col.field) : (isNew ? 'Yeni' : '');
          html += `<td style="color: #94a3b8;">${val ?? ''}</td>`;
          return;
        }

        let val = this.getDeepValue(row, col.field) ?? '';
        let inputHtml = this.renderEditorInput(col, val);

        html += `<td>${inputHtml}</td>`;
      });

      html += `
        <td style="text-align: center; white-space: nowrap;">
          <button class="panoptes-btn panoptes-btn-sm panoptes-btn-success" data-action="save-edit" data-index="${rowIndex}" title="Kaydet">
            <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Kaydet</span>
          </button>
          <button class="panoptes-btn panoptes-btn-sm" data-action="cancel-edit" title="İptal">
            <span>İptal</span>
          </button>
        </td>
      `;

      html += '</tr>';
      return html;
    }

renderEditorInput(col, val, uniqueSuffix = '') {
      const fieldId = uniqueSuffix ? `${this.elementId}-${uniqueSuffix}-${col.field}` : `${this.elementId}-${col.field}`;

      // 1. Boolean -> Panoptes.Switch
      if (col.editorType === 'boolean' || typeof val === 'boolean') {
        const isChecked = val === true;
        return `
          <div id="switch-${fieldId}" class="panoptes-switch-wrapper inline-flex items-center gap-3 cursor-pointer select-none">
            <input type="hidden" id="switch-${fieldId}-value" data-field="${col.field}" value="${isChecked ? 'true' : 'false'}" />
            <div class="panoptes-switch-track relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isChecked ? 'bg-blue-600' : 'bg-slate-300'}">
              <span class="panoptes-switch-thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}"></span>
            </div>
            <span class="panoptes-switch-label text-xs font-semibold text-slate-700">${isChecked ? 'Aktif' : 'Pasif'}</span>
            <script type="application/json" data-panoptes-switch-config="switch-${fieldId}">{"id":"switch-${fieldId}","isChecked":${isChecked ? 'true' : 'false'},"onLabel":"Aktif","offLabel":"Pasif"}</script>
          </div>
        `;
      }

      // 2. Select / DropDownList -> Panoptes.Select
      if (col.editorType === 'select' || col.editorOptions) {
        const currentVal = val ? String(val) : '';
        return `
          <div id="sel-${fieldId}" class="panoptes-select-wrapper relative inline-block w-full">
            <input type="hidden" id="sel-${fieldId}-value" data-field="${col.field}" value="${currentVal}" />
            <div class="panoptes-select-control relative flex items-center justify-between w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition text-slate-800">
              <span class="panoptes-select-display truncate font-normal text-slate-700">${currentVal || 'Seçiniz...'}</span>
              <div class="flex items-center space-x-1">
                <button type="button" class="panoptes-select-clear text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100" style="${currentVal ? '' : 'display:none;'}">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <svg class="w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <script type="application/json" data-panoptes-select-config="sel-${fieldId}">{"id":"sel-${fieldId}","value":"${currentVal}","options":"${(col.editorOptions || '')}"}</script>
          </div>
        `;
      }

      // 3. Date -> Panoptes.DatePicker
      if (col.editorType === 'date' || col.format === 'date') {
        let formattedVal = '';
        if (val) {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              formattedVal = `${day}.${month}.${year}`;
            }
          } catch (e) {}
        }
        return `
          <div id="dp-${fieldId}" class="panoptes-datepicker-wrapper relative inline-block w-full">
            <div class="panoptes-input-group relative flex items-center">
              <input type="text"
                     id="dp-${fieldId}-input"
                     data-field="${col.field}"
                     data-type="datepicker"
                     value="${formattedVal}"
                     placeholder="GG.AA.YYYY"
                     class="panoptes-input w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm bg-white" />
              <button type="button" 
                      class="panoptes-datepicker-toggle absolute right-2.5 text-slate-400 hover:text-blue-600 focus:outline-none transition" 
                      data-action="toggle-calendar">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <script type="application/json" data-panoptes-datepicker-config="dp-${fieldId}">{"id":"dp-${fieldId}","value":"${formattedVal}","format":"DD.MM.YYYY"}</script>
          </div>
        `;
      }

      // 4. Number -> Panoptes.NumericTextBox
      if (col.editorType === 'number' || typeof val === 'number') {
        const numVal = val !== null && val !== undefined ? val : '';
        const isCurrency = col.format === 'currency';
        const step = col.field.toLowerCase() === 'price' ? 100 : 1;
        return `
          <div id="num-${fieldId}" class="panoptes-numeric-wrapper relative inline-block w-full">
            <div class="panoptes-numeric-group relative flex items-center">
              ${isCurrency ? '<span class="absolute left-3 text-slate-400 font-bold text-sm pointer-events-none">₺</span>' : ''}
              <input type="text" 
                     id="num-${fieldId}-display" 
                     class="panoptes-numeric-input w-full ${isCurrency ? 'pl-7' : 'pl-3'} pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm bg-white" 
                     placeholder="0.00" />
              <input type="hidden" 
                     id="num-${fieldId}-value" 
                     data-field="${col.field}" 
                     value="${numVal}" />
              <div class="panoptes-spin-buttons absolute right-1 top-1 bottom-1 flex flex-col justify-center border-l border-slate-200 pl-1">
                <button type="button" class="panoptes-spin-up text-slate-400 hover:text-blue-600 focus:outline-none p-0.5 transition" data-action="spin-up">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button type="button" class="panoptes-spin-down text-slate-400 hover:text-blue-600 focus:outline-none p-0.5 transition" data-action="spin-down">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>
            <script type="application/json" data-panoptes-numeric-config="num-${fieldId}">{"id":"num-${fieldId}","value":${numVal !== '' ? numVal : 'null'},"step":${step},"format":"${col.format || ''}"}</script>
          </div>
        `;
      }

      // 5. Default: Text -> Panoptes.TextBox
      const strVal = val !== null && val !== undefined ? String(val) : '';
      return `
        <div id="tb-${fieldId}" class="panoptes-textbox-wrapper relative inline-block w-full">
          <div class="panoptes-input-group relative flex items-center">
            <input type="text" 
                   id="tb-${fieldId}-input" 
                   data-field="${col.field}" 
                   value="${strVal}" 
                   placeholder="${col.title || col.field} giriniz..." 
                   class="panoptes-input w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm bg-white" />
            <button type="button" 
                    id="tb-${fieldId}-clear" 
                    class="panoptes-textbox-clear absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition ${strVal ? '' : 'hidden'}" 
                    data-action="clear-input">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <script type="application/json" data-panoptes-textbox-config="tb-${fieldId}">{"id":"tb-${fieldId}","value":"${strVal}","clearable":true}</script>
        </div>
      `;
    }

    renderFooter() {
      const tfoot = this.wrapper.querySelector(`#${this.elementId}-tfoot`);
      if (!tfoot) return;

      const cols = this.getLeafColumns();
      let hasAggregates = false;
      let totalAmount = 0;
      let totalStock = 0;

      (this.state.data || []).forEach(row => {
        const p = parseFloat(this.getDeepValue(row, 'price') || 0);
        const s = parseInt(this.getDeepValue(row, 'stock') || 0, 10);
        if (!isNaN(p)) totalAmount += p;
        if (!isNaN(s)) totalStock += s;
        hasAggregates = true;
      });

      if (!hasAggregates || this.state.data.length === 0) {
        tfoot.innerHTML = '';
        return;
      }

      let html = '<tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #e2e8f0; color: #1e293b;">';
      if (this.hasDetail()) html += '<td></td>';
      if (this.config.selectable) html += '<td></td>';

      cols.forEach(col => {
        const f = (col.field || '').toLowerCase();
        if (f === 'price') {
          html += `<td style="text-align: right; padding: 0.75rem 1rem;">Toplam: ${totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>`;
        } else if (f === 'stock') {
          html += `<td style="text-align: center; padding: 0.75rem 1rem;">Top. Stok: ${totalStock.toLocaleString('tr-TR')}</td>`;
        } else if (f === 'name') {
          html += `<td style="padding: 0.75rem 1rem;">Sayfa Özeti</td>`;
        } else {
          html += '<td></td>';
        }
      });

      if (this.hasActionsColumn()) html += '<td></td>';
      html += '</tr>';

      tfoot.innerHTML = html;
    }

    hasDetail() {
      return !!(this.config.detailTemplate || this.config.clientDetailTemplateId);
    }

    hasActionsColumn() {
      return this.config.editable === 'inline' || this.config.editable === 'popup' || 
             (!this.config.editable && (this.config.dataSource?.updateUrl || this.config.dataSource?.destroyUrl));
    }

    renderDetailContent(row) {
      if (this.config.detailTemplate) {
        return this.evalTemplate(this.config.detailTemplate, row);
      }
      if (this.config.clientDetailTemplateId) {
        const el = document.getElementById(this.config.clientDetailTemplateId);
        if (el) return this.evalTemplate(el.innerHTML, row);
      }
      return `
        <div style="font-size: 0.8125rem; color: #475569;">
          <strong>Detaylı Bilgiler:</strong> ID #${this.getDeepValue(row, 'id')}, Ürün: ${this.getDeepValue(row, 'name')}, Stok Miktarı: ${this.getDeepValue(row, 'stock')} adet.
        </div>
      `;
    }

    getColumnTitle(field) {
      const col = this.getLeafColumns().find(c => c.field && c.field.toLowerCase() === field.toLowerCase());
      return col ? (col.title || col.field) : field;
    }

    renderPager() {
      const pager = this.wrapper.querySelector(`#${this.elementId}-pager`);
      if (!pager) return;

      const total = this.state.total;
      const pageSize = this.state.pageSize;
      const page = this.state.page;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
      const end = Math.min(total, page * pageSize);

      let pagesHtml = '';
      const visibleRange = 2;
      for (let p = Math.max(1, page - visibleRange); p <= Math.min(totalPages, page + visibleRange); p++) {
        pagesHtml += `
          <button class="panoptes-page-btn ${p === page ? 'active' : ''}" data-action="go-page" data-page="${p}">
            ${p}
          </button>
        `;
      }

      const isEn = this.getLocale() === 'en';
      const pagerInfo = isEn 
        ? `<span>Showing <strong>${start}</strong> - <strong>${end}</strong> of <strong>${total.toLocaleString('en-US')}</strong> items</span>`
        : `<span>Toplam <strong>${total.toLocaleString('tr-TR')}</strong> kayıttan <strong>${start}</strong> - <strong>${end}</strong> arası gösteriliyor</span>`;
      const perPageSuffix = isEn ? ' / page' : ' / sayfa';
      const firstTitle = isEn ? 'First Page' : 'İlk Sayfa';
      const prevTitle = isEn ? 'Previous Page' : 'Önceki Sayfa';
      const nextTitle = isEn ? 'Next Page' : 'Sonraki Sayfa';
      const lastTitle = isEn ? 'Last Page' : 'Son Sayfa';

      pager.innerHTML = `
        <div class="panoptes-pager-left">
          ${pagerInfo}
        </div>
        <div class="panoptes-pager-right">
          <select class="panoptes-select-control" data-action="change-pagesize">
            ${(this.config.pageSizes || [5, 10, 25, 50]).map(size => `
              <option value="${size}" ${size === pageSize ? 'selected' : ''}>${size}${perPageSuffix}</option>
            `).join('')}
          </select>

          <button class="panoptes-page-btn" data-action="go-page" data-page="1" ${page <= 1 ? 'disabled' : ''} title="${firstTitle}">«</button>
          <button class="panoptes-page-btn" data-action="go-page" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} title="${prevTitle}">‹</button>
          ${pagesHtml}
          <button class="panoptes-page-btn" data-action="go-page" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} title="${nextTitle}">›</button>
          <button class="panoptes-page-btn" data-action="go-page" data-page="${totalPages}" ${page >= totalPages ? 'disabled' : ''} title="${lastTitle}">»</button>
        </div>
      `;
    }

    bindEvents() {
      this.wrapper.addEventListener('click', (e) => {
        const targetGrid = e.target.closest('.panoptes-grid-wrapper');
        if (targetGrid && targetGrid !== this.wrapper) return;
        const th = e.target.closest('th.sortable');
        if (th && !e.target.closest('.panoptes-filter-btn') && !e.target.closest('.panoptes-resizer') && !e.target.closest('input')) {
          const field = th.getAttribute('data-field');
          this.toggleSort(field);
          return;
        }

        const expandBtn = e.target.closest('[data-action="toggle-detail"]');
        if (expandBtn) {
          const key = String(expandBtn.getAttribute('data-key'));
          if (this.state.expandedDetailRows.has(key)) {
            this.state.expandedDetailRows.delete(key);
          } else {
            this.state.expandedDetailRows.add(key);
          }
          this.renderRows();
          return;
        }

        // Single / Multi Row Click Selection
        const trRow = e.target.closest(`#${this.elementId}-tbody tr[data-key]`);
        if (trRow && this.config.selectable && !e.target.closest('button, input, a, select, svg, .panoptes-expand-btn')) {
          const rowKey = String(trRow.getAttribute('data-key'));
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd Multi-Select Toggle
            if (this.state.selectedKeys.has(rowKey)) {
              this.state.selectedKeys.delete(rowKey);
            } else {
              this.state.selectedKeys.add(rowKey);
            }
          } else if (e.shiftKey && this.lastSelectedKey) {
            // Shift Range Selection
            const allTrs = Array.from(this.wrapper.querySelectorAll(`#${this.elementId}-tbody tr[data-key]`));
            const keys = allTrs.map(t => String(t.getAttribute('data-key')));
            const idx1 = keys.indexOf(this.lastSelectedKey);
            const idx2 = keys.indexOf(rowKey);
            if (idx1 !== -1 && idx2 !== -1) {
              const start = Math.min(idx1, idx2);
              const end = Math.max(idx1, idx2);
              for (let i = start; i <= end; i++) {
                this.state.selectedKeys.add(keys[i]);
              }
            }
          } else {
            // Tekli Seçim (Single selection): Tıklanan satırı seçer, diğerlerini kaldırır
            if (this.state.selectedKeys.has(rowKey) && this.state.selectedKeys.size === 1) {
              this.state.selectedKeys.clear();
            } else {
              this.state.selectedKeys.clear();
              this.state.selectedKeys.add(rowKey);
            }
          }
          this.lastSelectedKey = rowKey;
          this.renderRows();
          this.refreshToolbar();
          if (this.config.onRowClick && typeof window[this.config.onRowClick] === 'function') {
            window[this.config.onRowClick](rowKey);
          }
          return;
        }

        const filterBtn = e.target.closest('[data-action="open-filter"]');
        if (filterBtn) {
          e.stopPropagation();
          const field = filterBtn.getAttribute('data-field');
          this.openFilterPopover(field, filterBtn);
          return;
        }

        const pageBtn = e.target.closest('[data-action="go-page"]');
        if (pageBtn && !pageBtn.disabled) {
          e.stopPropagation();
          this.setPage(parseInt(pageBtn.getAttribute('data-page'), 10));
          return;
        }

        if (e.target.closest('[data-action="refresh"]')) {
          this.refresh();
          return;
        }
        if (e.target.closest('[data-action="export-excel"]')) {
          this.exportToExcel();
          return;
        }
        if (e.target.closest('[data-action="export-pdf"]')) {
          this.exportToPdf();
          return;
        }
        if (e.target.closest('[data-action="add-new"]')) {
          this.addNewRow();
          return;
        }
        if (e.target.closest('[data-action="save-batch"]')) {
          this.saveBatchChanges();
          return;
        }
        if (e.target.closest('[data-action="cancel-batch"]')) {
          this.cancelBatchChanges();
          return;
        }
        if (e.target.closest('[data-action="toggle-column-menu"]')) {
          this.toggleColumnMenu();
          return;
        }

        const removeGroupBtn = e.target.closest('[data-action="remove-group"]');
        if (removeGroupBtn) {
          const field = removeGroupBtn.getAttribute('data-field');
          this.removeGroup(field);
          return;
        }
        const groupRow = e.target.closest('[data-action="toggle-group-row"]');
        if (groupRow) {
          const key = groupRow.getAttribute('data-group-key');
          if (this.state.collapsedGroups.has(key)) {
            this.state.collapsedGroups.delete(key);
          } else {
            this.state.collapsedGroups.add(key);
          }
          this.renderRows();
          return;
        }

        const editBtn = e.target.closest('[data-action="edit-row"]');
        if (editBtn) {
          const idx = parseInt(editBtn.getAttribute('data-index'), 10);
          this.editRow(idx);
          return;
        }
        const saveBtn = e.target.closest('[data-action="save-edit"]');
        if (saveBtn) {
          const idx = parseInt(saveBtn.getAttribute('data-index'), 10);
          this.saveRow(idx);
          return;
        }
        const cancelBtn = e.target.closest('[data-action="cancel-edit"]');
        if (cancelBtn) {
          this.cancelEdit();
          return;
        }
        const deleteBtn = e.target.closest('[data-action="delete-row"]');
        if (deleteBtn) {
          const idx = parseInt(deleteBtn.getAttribute('data-index'), 10);
          this.deleteRow(idx);
          return;
        }
      });

      // Filter Row input handler
      this.wrapper.addEventListener('input', (e) => {
        const targetGrid = e.target.closest('.panoptes-grid-wrapper');
        if (targetGrid && targetGrid !== this.wrapper) return;
        if (e.target.matches('[data-action="filter-row-input"]')) {
          const field = e.target.getAttribute('data-field');
          const val = e.target.value.trim();
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            if (val) {
              this.state.columnFilters[field] = { operator: 'contains', value: val };
            } else {
              delete this.state.columnFilters[field];
            }
            this.state.page = 1;
            this.fetchData();
          }, 350);
        }
      });

      // In-Cell Click & Double Click handler
      const handleIncellEdit = (e) => {
        const targetGrid = e.target.closest('.panoptes-grid-wrapper');
        if (targetGrid && targetGrid !== this.wrapper) return;
        if (this.config.editable !== 'incell' && this.config.editable !== 'batch') return;

        const td = e.target.closest('td[data-cell-field]');
        if (!td) return;
        if (td.classList.contains('panoptes-cell-editing')) return;

        const field = td.getAttribute('data-cell-field');
        const col = this.getLeafColumns().find(c => c.field === field);
        if (!col || col.editable === false) return;

        const rowKey = td.getAttribute('data-row-key');
        const row = this.state.data.find(r => String(this.getDeepValue(r, 'id')) === String(rowKey));
        if (!row) return;

        const currentVal = this.getDeepValue(row, field);
        const uniqueSuffix = `incell_${rowKey}_${Date.now()}`;
        td.classList.add('panoptes-cell-editing');
        td.style.padding = '0.25rem';
        td.innerHTML = this.renderEditorInput(col, currentVal, uniqueSuffix);

        // Initialize Panoptes components (DatePicker, Select, Numeric, Switch, etc.)
        if (window.Panoptes && window.Panoptes.initAll) {
          window.Panoptes.initAll(td);
        }

        let isClosed = false;

        const cleanupListeners = () => {
          document.removeEventListener('mousedown', onDocMouseDown);
          window.removeEventListener('keydown', onDocKeyDown);
        };

        const commit = () => {
          if (isClosed) return;
          isClosed = true;
          cleanupListeners();

          const input = td.querySelector(`[data-field="${field}"]`);
          let val = null;
          const wrapper = input ? input.closest('[class*="panoptes-"]') : null;

          if (wrapper && window.Panoptes && window.Panoptes.getValue) {
            val = window.Panoptes.getValue(wrapper);
          } else if (input) {
            val = input.value;
          } else {
            val = currentVal;
          }

          if (col.editorType === 'date' || col.format === 'date') {
            if (val) {
              const parts = String(val).split(/[./-]/);
              if (parts.length === 3) {
                if (parts[0].length === 4) val = new Date(parts[0], parts[1] - 1, parts[2]).toISOString();
                else val = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
              } else {
                const parsed = new Date(val);
                val = isNaN(parsed.getTime()) ? val : parsed.toISOString();
              }
            } else {
              val = null;
            }
          } else if (col.editorType === 'number' || typeof currentVal === 'number') {
            val = (val !== '' && val !== null && !isNaN(val)) ? parseFloat(val) : 0;
          } else if (col.editorType === 'boolean' || typeof currentVal === 'boolean') {
            val = val === true || val === 'true';
          }

          row[field] = val;
          this.markCellDirty(rowKey, field, val);
          td.classList.remove('panoptes-cell-editing');
          td.style.padding = '';
          td.innerHTML = this.formatCell(val, col, row);
          td.classList.add('panoptes-cell-dirty');
          this.refreshToolbar();
        };

        const cancel = () => {
          if (isClosed) return;
          isClosed = true;
          cleanupListeners();
          td.classList.remove('panoptes-cell-editing');
          td.style.padding = '';
          td.innerHTML = this.formatCell(currentVal, col, row);
        };

        const onDocMouseDown = (evt) => {
          // If clicked inside td, do nothing
          if (td.contains(evt.target)) return;

          // If clicked inside any open floating popover (calendar, select dropdown, etc.), do nothing!
          if (evt.target.closest('.panoptes-calendar-popover, .panoptes-datepicker-popover, .panoptes-daterange-popover, .panoptes-select-dropdown, .panoptes-multiselect-dropdown, .panoptes-combobox-dropdown, .panoptes-timepicker-popover, .panoptes-datetimepicker-popover, .panoptes-autocomplete-popover, .panoptes-colorpicker-popover')) {
            return;
          }

          commit();
        };

        const onDocKeyDown = (ke) => {
          if (ke.key === 'Escape') {
            ke.preventDefault();
            cancel();
          } else if (ke.key === 'Enter') {
            const openDropdown = document.querySelector('.panoptes-select-dropdown, .panoptes-calendar-popover');
            if (!openDropdown) {
              ke.preventDefault();
              commit();
            }
          }
        };

        setTimeout(() => {
          document.addEventListener('mousedown', onDocMouseDown);
          window.addEventListener('keydown', onDocKeyDown);
        }, 120);

        // Auto commit on component change
        const fieldInput = td.querySelector(`[data-field="${field}"]`);
        if (fieldInput) {
          fieldInput.addEventListener('change', () => {
            setTimeout(commit, 120);
          });
        }
        const compWrapper = td.querySelector('.panoptes-datepicker-wrapper, .panoptes-select-wrapper, .panoptes-switch-wrapper');
        if (compWrapper) {
          compWrapper.addEventListener('change', () => {
            setTimeout(commit, 120);
          });
        }

        // Focus first active control
        const focusable = td.querySelector('input:not([type="hidden"]), select, .panoptes-select-control, .panoptes-switch-track');
        if (focusable) {
          focusable.focus();
          if (focusable.select) focusable.select();
        }
      };

      this.wrapper.addEventListener('click', handleIncellEdit);
      this.wrapper.addEventListener('dblclick', handleIncellEdit);

      // Search input
      const searchInput = this.wrapper.querySelector('[data-action="quick-search"]');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          clearTimeout(this.debounceTimer);
          const val = e.target.value.trim();
          this.debounceTimer = setTimeout(() => {
            this.state.searchKeyword = val;
            this.state.page = 1;
            this.fetchData();
          }, 350);
        });
      }

      // Changes
      this.wrapper.addEventListener('change', (e) => {
        const targetGrid = e.target.closest('.panoptes-grid-wrapper');
        if (targetGrid && targetGrid !== this.wrapper) return;
        if (e.target.matches('[data-action="change-pagesize"]')) {
          this.state.pageSize = parseInt(e.target.value, 10);
          this.state.page = 1;
          this.fetchData();
        }

        if (e.target.matches('[data-action="add-group"]')) {
          const field = e.target.value;
          if (field) {
            this.addGroup(field);
            e.target.value = '';
          }
        }

        if (e.target.matches('[data-action="select-all"]')) {
          const checked = e.target.checked;
          this.state.selectedKeys.clear();
          if (checked) {
            const flat = this.getFlatData();
            flat.forEach((row, i) => {
              const k = String(this.getDeepValue(row, 'id') ?? i);
              this.state.selectedKeys.add(k);
            });
          }
          this.renderRows();
          this.refreshToolbar();
          this.emit('panoptes:change', { selectedKeys: this.getSelectedKeys(), selectedRows: this.getSelectedRows() });
          this.emit('change', { selectedKeys: this.getSelectedKeys(), selectedRows: this.getSelectedRows() });
          return;
        }

        if (e.target.matches('[data-action="select-row"]')) {
          const key = String(e.target.getAttribute('data-key'));
          if (e.target.checked) this.state.selectedKeys.add(key);
          else this.state.selectedKeys.delete(key);
          this.lastSelectedKey = key;
          this.renderRows();
          this.refreshToolbar();
          this.emit('panoptes:change', { selectedKeys: this.getSelectedKeys(), selectedRows: this.getSelectedRows() });
          this.emit('change', { selectedKeys: this.getSelectedKeys(), selectedRows: this.getSelectedRows() });
          return;
        }
      });

      // Close popups on click outside
      document.addEventListener('click', (e) => {
        if (this.activePopover && !this.activePopover.contains(e.target) && !e.target.closest('[data-action="open-filter"]')) {
          this.closeFilterPopover();
        }
        const colMenu = this.wrapper.querySelector(`#${this.elementId}-column-menu`);
        if (colMenu && this.activeColumnMenu && !colMenu.contains(e.target) && !e.target.closest('[data-action="toggle-column-menu"]')) {
          colMenu.style.display = 'none';
          this.activeColumnMenu = false;
        }
      });
    }

    initReordering() {
      if (this.config.reorderable === false && this.config.groupable === false) return;

      this.wrapper.addEventListener('dragstart', (e) => {
        const targetGrid = e.target.closest('.panoptes-grid-wrapper');
        if (targetGrid && targetGrid !== this.wrapper) return;
        const th = e.target.closest('th[data-col-index]');
        if (th) {
          this.draggedColIdx = parseInt(th.getAttribute('data-col-index'), 10);
          this.draggedColField = th.getAttribute('data-field');
          e.dataTransfer.setData('text/plain', String(this.draggedColIdx));
          th.style.opacity = '0.4';
        }
        const chip = e.target.closest('.panoptes-group-chip');
        if (chip) {
          this.draggedGroupField = chip.getAttribute('data-group-field');
          e.dataTransfer.setData('text/plain', this.draggedGroupField || '');
        }
      });

      this.wrapper.addEventListener('dragend', (e) => {
        const th = e.target.closest('th[data-col-index]');
        if (th) th.style.opacity = '1';
        const groupBar = this.wrapper.querySelector('.panoptes-group-bar');
        if (groupBar) groupBar.classList.remove('panoptes-drop-active');
        this.draggedColIdx = null;
        this.draggedColField = null;
        this.draggedGroupField = null;
      });

      this.wrapper.addEventListener('dragover', (e) => {
        const th = e.target.closest('th[data-col-index]');
        if (th) e.preventDefault();

        const groupBar = e.target.closest('.panoptes-group-bar');
        if (groupBar && (this.draggedColField || this.draggedColIdx !== null)) {
          e.preventDefault();
          groupBar.classList.add('panoptes-drop-active');
        }
      });

      this.wrapper.addEventListener('dragleave', (e) => {
        const groupBar = e.target.closest('.panoptes-group-bar');
        if (groupBar && !groupBar.contains(e.relatedTarget)) {
          groupBar.classList.remove('panoptes-drop-active');
        }
      });

      this.wrapper.addEventListener('drop', (e) => {
        const groupBar = e.target.closest('.panoptes-group-bar');
        if (groupBar) {
          groupBar.classList.remove('panoptes-drop-active');
          if (this.draggedColField) {
            e.preventDefault();
            this.addGroup(this.draggedColField);
            return;
          }
        }

        const targetTh = e.target.closest('th[data-col-index]');
        if (targetTh && this.draggedColIdx !== null) {
          e.preventDefault();
          const targetIdx = parseInt(targetTh.getAttribute('data-col-index'), 10);
          if (targetIdx !== this.draggedColIdx) {
            const cols = this.config.columns;
            const moved = cols.splice(this.draggedColIdx, 1)[0];
            cols.splice(targetIdx, 0, moved);
            this.updateThead();
            this.renderRows();
            this.showToast('Sütun sırası güncellendi', 'info');
            if (this.config.persistState) this.saveState();
          }
        }
      });
    }

    initKeyboardNav() {
      const container = this.wrapper.querySelector('.panoptes-table-container');
      if (!container) return;

      container.addEventListener('keydown', (e) => {
        const rows = this.wrapper.querySelectorAll('tbody tr:not(.panoptes-detail-row)');
        if (!rows || rows.length === 0) return;

        let { rowIndex, colIndex } = this.state.focusedCell;
        const totalRows = rows.length;
        const totalCols = this.getLeafColumns().length;

        if (e.key === 'ArrowDown') {
          rowIndex = Math.min(totalRows - 1, rowIndex + 1);
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          rowIndex = Math.max(0, rowIndex - 1);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          colIndex = Math.min(totalCols - 1, colIndex + 1);
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          colIndex = Math.max(0, colIndex - 1);
          e.preventDefault();
        } else {
          return;
        }

        this.state.focusedCell = { rowIndex, colIndex };
        this.highlightFocusedCell();
      });
    }

    highlightFocusedCell() {
      this.wrapper.querySelectorAll('td.panoptes-cell-focus').forEach(td => td.classList.remove('panoptes-cell-focus'));
      const rows = this.wrapper.querySelectorAll('tbody tr:not(.panoptes-detail-row)');
      const targetRow = rows[this.state.focusedCell.rowIndex];
      if (targetRow) {
        const cells = targetRow.querySelectorAll('td[data-cell-field]');
        const targetCell = cells[this.state.focusedCell.colIndex];
        if (targetCell) {
          targetCell.classList.add('panoptes-cell-focus');
          targetCell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }

    markCellDirty(rowKey, field, val) {
      if (!this.state.dirtyItems.has(rowKey)) {
        const original = this.state.data.find(r => String(this.getDeepValue(r, 'id')) === String(rowKey));
        this.state.dirtyItems.set(rowKey, { ...(original || {}), [field]: val });
      } else {
        const item = this.state.dirtyItems.get(rowKey);
        item[field] = val;
      }
    }

    isCellDirty(rowKey, field) {
      return this.state.dirtyItems.has(rowKey) && this.state.dirtyItems.get(rowKey)[field] !== undefined;
    }

    refreshToolbar() {
      const tb = this.wrapper.querySelector('.panoptes-toolbar');
      if (tb) tb.outerHTML = this.renderToolbar();
    }

    async saveBatchChanges() {
      const items = Array.from(this.state.dirtyItems.values());
      const batchUrl = this.config.dataSource?.batchUrl || this.config.batchUrl || this.config.dataSource?.updateUrl;

      if (!batchUrl) {
        alert('Toplu kaydetme için batchUrl tanımlanmamış.');
        return;
      }

      try {
        const res = await fetch(batchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.showToast(`${items.length} adet kayıt başarıyla güncellendi`, 'success');
        this.state.dirtyItems.clear();
        this.fetchData();
      } catch (e) {
        console.error('[Panoptes Grid] Batch save failed:', e);
        this.showToast('Toplu kaydetme başarısız oldu!', 'error');
      }
    }

    cancelBatchChanges() {
      this.state.dirtyItems.clear();
      this.fetchData();
      this.showToast('Değişiklikler iptal edildi', 'info');
    }

    initResizers() {
      if (this.config.resizable === false) return;

      const ths = this.wrapper.querySelectorAll('th');
      ths.forEach(th => {
        const resizer = th.querySelector('.panoptes-resizer');
        if (!resizer) return;

        let startX, startWidth;
        const onMouseMove = (e) => {
          const width = Math.max(50, startWidth + (e.pageX - startX));
          th.style.width = `${width}px`;
          const field = th.getAttribute('data-field');
          const col = this.getLeafColumns().find(c => c.field === field);
          if (col) col.width = `${width}px`;
        };
        const onMouseUp = () => {
          resizer.classList.remove('resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        resizer.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          startX = e.pageX;
          startWidth = th.offsetWidth;
          resizer.classList.add('resizing');
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });

        resizer.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          const field = th.getAttribute('data-field');
          if (field) this.autoFitColumn(field, th);
        });
      });
    }

    openFilterPopover(field, targetBtn) {
      this.closeFilterPopover();

      const existingFilter = this.state.columnFilters[field] || { operator: 'contains', value: '', values: [] };
      const uniqueValues = this.getUniqueValues(field);

      const isEn = this.getLocale() === 'en';
      const popover = document.createElement('div');
      popover.className = 'panoptes-filter-popover';
      popover.innerHTML = `
        <div style="font-weight: 600; font-size: 0.8125rem; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem;">
          ${isEn ? `Filter ${this.getColumnTitle(field)}` : `${this.getColumnTitle(field)} Filtrele`}
        </div>
        <div>
          <select id="panoptes-filter-op">
            <option value="contains" ${existingFilter.operator === 'contains' ? 'selected' : ''}>${isEn ? 'Contains' : 'İçeren'}</option>
            <option value="eq" ${existingFilter.operator === 'eq' ? 'selected' : ''}>${isEn ? 'Is Equal To (=)' : 'Eşit Olan (=)'}</option>
            <option value="startswith" ${existingFilter.operator === 'startswith' ? 'selected' : ''}>${isEn ? 'Starts With' : 'İle Başlayan'}</option>
            <option value="endswith" ${existingFilter.operator === 'endswith' ? 'selected' : ''}>${isEn ? 'Ends With' : 'İle Biten'}</option>
            <option value="gt" ${existingFilter.operator === 'gt' ? 'selected' : ''}>${isEn ? 'Greater Than (>)' : 'Büyüktür (&gt;)'}</option>
            <option value="gte" ${existingFilter.operator === 'gte' ? 'selected' : ''}>${isEn ? 'Greater Than or Equal (≥)' : 'Büyük Eşittir (&ge;)'}</option>
            <option value="lt" ${existingFilter.operator === 'lt' ? 'selected' : ''}>${isEn ? 'Less Than (<)' : 'Küçüktür (&lt;)'}</option>
            <option value="lte" ${existingFilter.operator === 'lte' ? 'selected' : ''}>${isEn ? 'Less Than or Equal (≤)' : 'Küçük Eşittir (&le;)'}</option>
          </select>
        </div>
        <div>
          <input type="text" id="panoptes-filter-val" placeholder="${isEn ? 'Enter value...' : 'Değer yazın...'}" value="${existingFilter.value || ''}" />
        </div>
        ${uniqueValues.length > 0 ? `
          <div style="font-size: 0.6875rem; font-weight: 600; color: #64748b; margin-top: 0.25rem;">${isEn ? 'Select Values:' : 'Değer Seçimi:'}</div>
          <div class="panoptes-filter-checklist">
            ${uniqueValues.map(uVal => `
              <label class="panoptes-filter-check-item">
                <input type="checkbox" value="${String(uVal)}" ${(existingFilter.values || []).includes(String(uVal)) ? 'checked' : ''} />
                <span>${String(uVal)}</span>
              </label>
            `).join('')}
          </div>
        ` : ''}
        <div class="panoptes-filter-popover-actions">
          <button class="panoptes-btn panoptes-btn-sm" id="panoptes-filter-clear">${isEn ? 'Clear' : 'Temizle'}</button>
          <button class="panoptes-btn panoptes-btn-sm panoptes-btn-primary" id="panoptes-filter-apply">${isEn ? 'Filter' : 'Filtrele'}</button>
        </div>
      `;

      document.body.appendChild(popover);
      const rect = targetBtn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
      popover.style.left = `${Math.min(window.innerWidth - 260, rect.left + window.scrollX - 100)}px`;

      popover.querySelector('#panoptes-filter-apply').addEventListener('click', () => {
        const op = popover.querySelector('#panoptes-filter-op').value;
        const val = popover.querySelector('#panoptes-filter-val').value.trim();
        const checkedVals = Array.from(popover.querySelectorAll('.panoptes-filter-checklist input:checked')).map(cb => cb.value);

        if (val || checkedVals.length > 0) {
          this.state.columnFilters[field] = { operator: op, value: val, values: checkedVals };
        } else {
          delete this.state.columnFilters[field];
        }
        this.closeFilterPopover();
        this.updateThead();
        this.state.page = 1;
        this.fetchData();
      });

      popover.querySelector('#panoptes-filter-clear').addEventListener('click', () => {
        delete this.state.columnFilters[field];
        this.closeFilterPopover();
        this.updateThead();
        this.state.page = 1;
        this.fetchData();
      });

      this.activePopover = popover;
    }

    getUniqueValues(field) {
      const set = new Set();
      (this.state.data || []).forEach(row => {
        let v = this.getDeepValue(row, field);
        if (v !== null && v !== undefined && v !== '') set.add(String(v));
      });
      return Array.from(set).slice(0, 15);
    }

    closeFilterPopover() {
      if (this.activePopover) {
        this.activePopover.remove();
        this.activePopover = null;
      }
    }

    toggleColumnMenu() {
      const menu = this.wrapper.querySelector(`#${this.elementId}-column-menu`);
      if (!menu) return;

      if (this.activeColumnMenu) {
        menu.style.display = 'none';
        this.activeColumnMenu = false;
        return;
      }

      menu.innerHTML = this.getLeafColumns().map((col, idx) => `
        <label class="panoptes-column-menu-item">
          <input type="checkbox" data-col-idx="${idx}" ${!col.hidden ? 'checked' : ''} />
          <span>${col.title || col.field}</span>
        </label>
      `).join('');

      menu.querySelectorAll('input').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-col-idx'), 10);
          this.getLeafColumns()[idx].hidden = !e.target.checked;
          this.updateThead();
          this.renderRows();
        });
      });

      menu.style.display = 'flex';
      this.activeColumnMenu = true;
    }

    addGroup(field) {
      if (!field || this.state.groups.some(g => g.field === field)) return;
      this.state.groups.push({ field: field, dir: 'asc' });
      this.refreshLayout();
      this.state.page = 1;
      this.fetchData();
    }

    removeGroup(field) {
      this.state.groups = this.state.groups.filter(g => g.field !== field);
      this.refreshLayout();
      this.state.page = 1;
      this.fetchData();
    }

    refreshLayout() {
      const groupBar = this.wrapper.querySelector(`#${this.elementId}-group-bar`);
      if (groupBar) groupBar.outerHTML = this.renderGroupBar();
    }

    updateThead() {
      const thead = this.wrapper.querySelector('thead');
      if (thead) {
        thead.innerHTML = this.renderThead();
        this.initResizers();
        this.initReordering();
      }
    }

    toggleSort(field) {
      if (!field) return;
      const lower = field.toLowerCase();
      const existingIndex = this.state.sorts.findIndex(s => s.field.toLowerCase() === lower);
      if (existingIndex > -1) {
        if (this.state.sorts[existingIndex].dir === 'asc') {
          this.state.sorts[existingIndex].dir = 'desc';
        } else {
          this.state.sorts.splice(existingIndex, 1);
        }
      } else {
        this.state.sorts = [{ field: field, dir: 'asc' }];
      }

      this.updateThead();
      this.state.page = 1;
      this.emit('panoptes:sort', { sorts: this.state.sorts });
      this.emit('sort', { sorts: this.state.sorts });
      this.fetchData();
    }

    setPage(page) {
      if (page < 1 || (this.getTotalPages() > 0 && page > this.getTotalPages())) return;
      this.state.page = page;
      this.emit('panoptes:pagechange', { page: page, pageSize: this.state.pageSize });
      this.emit('pagechange', { page: page, pageSize: this.state.pageSize });
      this.fetchData();
    }

    refresh() {
      this.fetchData();
      this.showToast('Veriler güncellendi', 'success');
    }

    addNewRow() {
      if (this.config.editable === 'popup') {
        this.openEditModal({}, true);
      } else {
        this.state.isNewRow = true;
        this.state.editingRowIndex = -1;
        this.renderRows();
      }
    }

    editRow(index) {
      const row = this.state.data[index];
      if (this.config.editable === 'popup') {
        this.openEditModal(row, false);
      } else {
        this.state.isNewRow = false;
        this.state.editingRowIndex = index;
        this.renderRows();
      }
    }

    cancelEdit() {
      this.state.isNewRow = false;
      this.state.editingRowIndex = null;
      this.renderRows();
    }

    openEditModal(row, isNew) {
      const isEn = this.getLocale() === 'en';
      const cols = this.getLeafColumns().filter(c => c.field && c.editable !== false);
      const modal = document.createElement('div');
      modal.className = 'panoptes-modal-backdrop';
      modal.innerHTML = `
        <div class="panoptes-modal">
          <div class="panoptes-modal-header">
            <span style="font-weight: 700; font-size: 1rem; color: #0f172a;">
              ${isNew ? (isEn ? 'Add New Record' : 'Yeni Kayıt Ekle') : (isEn ? 'Edit Record' : 'Kaydı Düzenle')}
            </span>
            <button class="panoptes-btn panoptes-btn-sm" id="panoptes-modal-close">×</button>
          </div>
          <div class="panoptes-modal-body">
            ${cols.map(c => `
              <div class="panoptes-form-group ${c.field.toLowerCase() === 'name' ? 'col-span-2' : ''}">
                <label class="panoptes-form-label">${c.title || c.field}</label>
                ${this.renderEditorInput(c, this.getDeepValue(row, c.field))}
              </div>
            `).join('')}
          </div>
          <div class="panoptes-modal-footer">
            <button class="panoptes-btn" id="panoptes-modal-cancel">${isEn ? 'Cancel' : 'İptal'}</button>
            <button class="panoptes-btn panoptes-btn-primary" id="panoptes-modal-save">${isEn ? 'Save' : 'Kaydet'}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close handlers setup FIRST so modal is always closable
      const closeModal = () => {
        modal.classList.add('fade-out');
        document.removeEventListener('keydown', onKeyDown);
        setTimeout(() => modal.remove(), 120);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') closeModal();
      };
      document.addEventListener('keydown', onKeyDown);

      const closeBtn = modal.querySelector('#panoptes-modal-close');
      if (closeBtn) closeBtn.onclick = closeModal;

      const cancelBtn = modal.querySelector('#panoptes-modal-cancel');
      if (cancelBtn) cancelBtn.onclick = closeModal;

      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      // Auto-initialize ALL Panoptes components inside modal inside safe try/catch
      try {
        if (window.Panoptes && window.Panoptes.initAll) {
          window.Panoptes.initAll(modal);
        }
      } catch (err) {
        console.error('[Panoptes Grid] Modal component init error:', err);
      }

      modal.querySelector('#panoptes-modal-save').onclick = async () => {
        const payload = { ...row };
        cols.forEach(col => {
          const field = col.field;
          const input = modal.querySelector(`[data-field="${field}"]`);
          if (!input) return;

          let val = null;
          const wrapper = input.closest('[class*="panoptes-"]');

          if (wrapper && window.Panoptes && window.Panoptes.getValue) {
            val = window.Panoptes.getValue(wrapper);
          } else {
            val = input.value;
          }

          if (col.editorType === 'date' || col.format === 'date') {
            if (val) {
              const parts = String(val).split(/[./-]/);
              if (parts.length === 3) {
                if (parts[0].length === 4) val = new Date(parts[0], parts[1] - 1, parts[2]).toISOString();
                else val = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
              } else {
                val = new Date(val).toISOString();
              }
            } else {
              val = null;
            }
          } else if (col.editorType === 'number' || typeof row[field] === 'number') {
            val = val !== '' && val !== null ? parseFloat(val) : 0;
          } else if (col.editorType === 'boolean' || typeof row[field] === 'boolean') {
            val = val === true || val === 'true';
          }

          payload[field] = val;
        });

        const url = isNew 
          ? (this.config.dataSource?.createUrl || this.config.createUrl)
          : (this.config.dataSource?.updateUrl || this.config.updateUrl);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          modal.remove();
          this.showToast(isNew ? 'Yeni kayıt eklendi' : 'Kayıt güncellendi', 'success');
          this.fetchData();
        } catch (err) {
          console.error(err);
          this.showToast('Kaydetme hatası!', 'error');
        }
      };
    }

    async saveRow(index) {
      const editRow = this.wrapper.querySelector(`tr[data-edit-index="${index}"]`);
      if (!editRow) return;

      const payload = index >= 0 && this.state.data[index] ? { ...this.state.data[index] } : {};
      editRow.querySelectorAll('[data-field]').forEach(input => {
        const field = input.getAttribute('data-field');
        let val = input.value;
        if (input.type === 'number') val = val !== '' ? parseFloat(val) : 0;
        if (input.tagName === 'SELECT' && (val === 'true' || val === 'false')) val = (val === 'true');
        payload[field] = val;
      });

      const isCreate = index === -1;
      const url = isCreate 
        ? (this.config.dataSource?.createUrl || this.config.createUrl) 
        : (this.config.dataSource?.updateUrl || this.config.updateUrl);

      if (!url) {
        alert('Kaydetme URL adresi tanımlanmamış.');
        return;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        this.showToast(isCreate ? 'Yeni kayıt eklendi' : 'Kayıt güncellendi', 'success');
        this.cancelEdit();
        this.fetchData();
      } catch (err) {
        console.error('[Panoptes Grid] Save failed:', err);
        this.showToast('Kaydetme başarısız oldu!', 'error');
      }
    }

    async deleteRow(index) {
      const item = this.state.data[index];
      if (!item) return;

      const itemName = this.getDeepValue(item, 'name') || this.getDeepValue(item, 'title') || this.getDeepValue(item, 'id') || 'Kayıt';
      if (!confirm(`"${itemName}" kaydını silmek istediğinizden emin misiniz?`)) {
        return;
      }

      const url = this.config.dataSource?.destroyUrl || this.config.deleteUrl;
      if (!url) {
        alert('Silme URL adresi tanımlanmamış.');
        return;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: this.getDeepValue(item, 'id') })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.showToast('Kayıt silindi', 'success');
        this.fetchData();
      } catch (err) {
        console.error('[Panoptes Grid] Delete failed:', err);
        this.showToast('Silme başarısız oldu!', 'error');
      }
    }

    async fetchData() {
      const readUrl = this.config.dataSource?.readUrl || this.config.url;
      if (!readUrl) return;

      this.state.loading = true;
      this.renderRows();

      const payload = {
        page: this.state.page,
        pageSize: this.state.pageSize,
        sorts: this.state.sorts,
        groups: this.state.groups,
        filter: this.buildCurrentFilter()
      };

      try {
        const method = (this.config.dataSource?.readMethod || this.config.method || 'POST').toUpperCase();
        let response;

        if (method === 'GET') {
          const queryParams = new URLSearchParams({
            page: payload.page,
            pageSize: payload.pageSize
          });
          if (payload.sorts.length > 0) {
            queryParams.set('sort', payload.sorts.map(s => `${s.field}:${s.dir}`).join(','));
          }
          if (payload.filter) {
            queryParams.set('filter', JSON.stringify(payload.filter));
          }
          response = await fetch(`${readUrl}?${queryParams.toString()}`);
        } else {
          response = await fetch(readUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        this.state.data = result.data || result.Data || [];
        this.state.total = result.total ?? result.Total ?? 0;
        this.state.aggregates = result.aggregates ?? result.Aggregates ?? null;
      } catch (err) {
        console.error('[Panoptes Grid] Data fetch failed:', err);
        this.state.data = [];
        this.state.total = 0;
      } finally {
        this.state.loading = false;
        this.renderRows();

        this.emit('panoptes:databound', { data: this.state.data, total: this.state.total });
        this.emit('databound', { data: this.state.data, total: this.state.total });

        if (this.config.onDataBound && typeof window[this.config.onDataBound] === 'function') {
          window[this.config.onDataBound](this.state.data, this.state.total);
        }
      }
    }

    buildCurrentFilter() {
      const filters = [];

      if (this.state.searchKeyword) {
        const searchableCols = this.getLeafColumns().filter(c => c.field);
        if (searchableCols.length > 0) {
          filters.push({
            logic: 'or',
            filters: searchableCols.map(c => ({
              field: c.field,
              operator: 'contains',
              value: this.state.searchKeyword
            }))
          });
        }
      }

      Object.keys(this.state.columnFilters).forEach(field => {
        const item = this.state.columnFilters[field];
        if (item.values && item.values.length > 0) {
          filters.push({
            logic: 'or',
            filters: item.values.map(v => ({
              field: field,
              operator: 'eq',
              value: v
            }))
          });
        } else if (item.value) {
          filters.push({
            field: field,
            operator: item.operator,
            value: item.value
          });
        }
      });

      if (filters.length === 0) return null;
      if (filters.length === 1) return filters[0];

      return {
        logic: 'and',
        filters: filters
      };
    }

    formatCell(val, col, row) {
      if (col.template) {
        return this.evalTemplate(col.template, row, val);
      }

      if (val === null || val === undefined) return '<span style="color:#cbd5e1;">-</span>';

      if (col.format) {
        const fmt = col.format.toLowerCase();
        if (fmt.includes('c') || fmt.includes('currency')) {
          const num = Number(val);
          return !isNaN(num) ? num.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : val;
        }
        if (fmt === 'rating' || fmt === 'stars') {
          const r = Math.max(0, Math.min(5, Math.round(Number(val) || 0)));
          let stars = '';
          for (let i = 1; i <= 5; i++) {
            stars += `<span style="color: ${i <= r ? '#f59e0b' : '#cbd5e1'}; font-size: 1rem; line-height: 1;">★</span>`;
          }
          return `<div class="panoptes-rating-cell" style="display: inline-flex; align-items: center; gap: 2px;">${stars} <span style="font-size: 0.75rem; color: #64748b; margin-left: 4px; font-weight: 600;">(${val})</span></div>`;
        }
        if (fmt === 'progress' || fmt === 'sparkline') {
          const pct = Math.max(0, Math.min(150, Number(val) || 0));
          const color = pct >= 100 ? '#10b981' : (pct >= 80 ? '#6366f1' : '#f59e0b');
          return `
            <div class="panoptes-progress-cell" style="display: flex; align-items: center; gap: 8px; width: 100%; min-width: 110px;">
              <div style="flex: 1; background: #e2e8f0; height: 8px; border-radius: 9999px; overflow: hidden;">
                <div style="background: ${color}; width: ${Math.min(pct, 100)}%; height: 100%; border-radius: 9999px; transition: width 0.3s ease;"></div>
              </div>
              <span style="font-size: 0.75rem; font-weight: 700; color: #334155; min-width: 38px; text-align: right;">${val}%</span>
            </div>
          `;
        }
        if (fmt === 'badge') {
          const isOk = val === true || val === 'true' || val === 'Available' || val === 'Stokta';
          return isOk
            ? '<span class="panoptes-badge panoptes-badge-success" style="padding: 3px 9px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 9999px; background: #10b981;"></span>Stokta Var</span>'
            : '<span class="panoptes-badge panoptes-badge-danger" style="padding: 3px 9px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 9999px; background: #ef4444;"></span>Tükendi</span>';
        }
        if (fmt === 'country') {
          const code = (row.countryCode || row.CountryCode || 'tr').toLowerCase();
          const countryName = val || row.country || row.Country || 'Türkiye';
          return `
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 500; color: #334155;">
              <span class="fi fi-${code}" style="border-radius: 2px;"></span>
              <span>${countryName}</span>
            </div>
          `;
        }
        if (fmt.includes('date')) {
          const d = new Date(val);
          return !isNaN(d.getTime()) ? d.toLocaleDateString('tr-TR') : val;
        }
        if (fmt.includes('datetime')) {
          const d = new Date(val);
          return !isNaN(d.getTime()) ? d.toLocaleString('tr-TR') : val;
        }
      }

      if (typeof val === 'boolean') {
        return val 
          ? '<span class="panoptes-badge panoptes-badge-success">Aktif</span>' 
          : '<span class="panoptes-badge panoptes-badge-danger">Pasif</span>';
      }

      return String(val);
    }

    evalTemplate(template, row, val) {
      if (typeof template === 'function') return template(row, val);
      if (typeof template === 'string') {
        if (template.startsWith('#') && /^#[a-zA-Z0-9_-]+$/.test(template)) {
          const scriptTag = document.querySelector(template);
          if (scriptTag) template = scriptTag.innerHTML;
        }
        // Support #=functionName(data)# or #=functionName(row)#
        const fnMatch = template.match(/^#=\s*([a-zA-Z0-9_]+)\s*\(\s*(data|row)\s*\)\s*#$/);
        if (fnMatch && typeof window[fnMatch[1]] === 'function') {
          return window[fnMatch[1]](row, val);
        }
        return template.replace(/#+[:=]?\s*([a-zA-Z0-9_.]+)\s*#/g, (_, path) => {
          let cleanPath = path;
          if (cleanPath.startsWith('data.')) cleanPath = cleanPath.substring(5);
          return this.getDeepValue(row, cleanPath) ?? '';
        });
      }
      return val ?? '';
    }

        getFlatData() {
      if (!this.state.data) return [];
      if (this.state.data.length > 0 && this.state.data[0].items !== undefined) {
        const flat = [];
        const extract = (groups) => {
          groups.forEach(g => {
            if (g.items) {
              if (g.items.length > 0 && g.items[0].items !== undefined) extract(g.items);
              else flat.push(...g.items);
            }
          });
        };
        extract(this.state.data);
        return flat;
      }
      return this.state.data;
    }

getDeepValue(obj, path) {
      if (!obj || !path) return null;
      return path.split('.').reduce((acc, part) => {
        if (!acc || typeof acc !== 'object') return null;
        if (acc[part] !== undefined) return acc[part];
        const lower = part.toLowerCase();
        const foundKey = Object.keys(acc).find(k => k.toLowerCase() === lower);
        return (foundKey && acc[foundKey] !== undefined) ? acc[foundKey] : null;
      }, obj);
    }


    autoFitColumn(field, th) {
      if (!th) th = this.wrapper.querySelector(`th[data-field="${field}"]`);
      if (!th) return;

      const leafCols = this.getLeafColumns();
      const colIdx = leafCols.findIndex(c => c.field === field);
      const rows = this.wrapper.querySelectorAll(`#${this.elementId}-tbody tr[data-index]`);

      const measurer = document.createElement('span');
      measurer.style.visibility = 'hidden';
      measurer.style.position = 'absolute';
      measurer.style.whiteSpace = 'nowrap';
      measurer.style.font = window.getComputedStyle(th).font;
      document.body.appendChild(measurer);

      measurer.textContent = th.innerText.trim();
      let maxW = measurer.getBoundingClientRect().width + 48;

      rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        let cellOffset = (this.hasDetail() ? 1 : 0) + (this.config.selectable ? 1 : 0);
        const cell = cells[colIdx + cellOffset];
        if (cell) {
          measurer.style.font = window.getComputedStyle(cell).font;
          measurer.textContent = cell.innerText.trim();
          const cellW = measurer.getBoundingClientRect().width + 32;
          if (cellW > maxW) maxW = cellW;
        }
      });

      document.body.removeChild(measurer);
      maxW = Math.max(65, Math.min(650, Math.ceil(maxW)));
      th.style.width = `${maxW}px`;

      const col = leafCols.find(c => c.field === field);
      if (col) col.width = `${maxW}px`;

      this.showToast(`${col ? col.title || field : field} sütunu ${maxW}px olarak uyarlandı`, 'info');
      if (this.config.persistState) this.saveState();
    }

    saveState(name = 'default') {
      try {
        const state = {
          columns: (this.config.columns || []).map(c => ({
            field: c.field,
            width: c.width,
            hidden: !!c.hidden
          })),
          sorts: this.state.sorts,
          pageSize: this.state.pageSize,
          groups: this.state.groups
        };
        localStorage.setItem(`panoptes-grid-state-${this.elementId}-${name}`, JSON.stringify(state));
        this.showToast('Grid düzeni tarayıcıya kaydedildi', 'success');
      } catch (err) {
        console.warn('[Panoptes] State save error:', err);
      }
    }

    loadState(name = 'default') {
      try {
        const raw = localStorage.getItem(`panoptes-grid-state-${this.elementId}-${name}`);
        if (!raw) return false;
        const state = JSON.parse(raw);
        if (state.columns && Array.isArray(state.columns)) {
          state.columns.forEach(savedCol => {
            const c = (this.config.columns || []).find(x => x.field === savedCol.field);
            if (c) {
              if (savedCol.width) c.width = savedCol.width;
              if (savedCol.hidden !== undefined) c.hidden = savedCol.hidden;
            }
          });
        }
        if (state.sorts) this.state.sorts = state.sorts;
        if (state.pageSize) this.state.pageSize = state.pageSize;
        if (state.groups) this.state.groups = state.groups;
        return true;
      } catch (err) {
        console.warn('[Panoptes] State load error:', err);
        return false;
      }
    }

    resetState(name = 'default') {
      localStorage.removeItem(`panoptes-grid-state-${this.elementId}-${name}`);
      this.showToast('Grid düzeni sıfırlandı, sayfa yenileniyor...', 'info');
      setTimeout(() => window.location.reload(), 300);
    }

    getSelectedRows() {
      const flat = this.getFlatData();
      return flat.filter(it => this.state.selectedKeys.has(String(it.id ?? it.Id)));
    }

    getSelectedKeys() {
      return Array.from(this.state.selectedKeys);
    }

    clearSelection() {
      this.state.selectedKeys.clear();
      this.renderRows();
      this.refreshToolbar();
    }

    selectAll(check = true) {
      const flat = this.getFlatData();
      flat.forEach(it => {
        const k = String(it.id ?? it.Id ?? '');
        if (!k) return;
        if (check) this.state.selectedKeys.add(k);
        else this.state.selectedKeys.delete(k);
      });
      this.renderRows();
      this.refreshToolbar();
    }

    renderGroupAggregates(items, cols) {
      if (!items || items.length === 0) return '';
      const parts = [];
      cols.forEach(col => {
        if (!col.field) return;
        const aggs = (col.aggregates || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (aggs.length === 0 && col.format === 'currency') aggs.push('sum');

        aggs.forEach(agg => {
          const numericVals = items.map(it => Number(this.getDeepValue(it, col.field)) || 0);
          if (numericVals.length === 0) return;
          let val = 0;
          let label = 'Toplam';
          if (agg === 'sum') {
            val = numericVals.reduce((a, b) => a + b, 0);
          } else if (agg === 'average' || agg === 'avg') {
            val = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
            label = 'Ort.';
          } else if (agg === 'min') {
            val = Math.min(...numericVals);
            label = 'Min';
          } else if (agg === 'max') {
            val = Math.max(...numericVals);
            label = 'Max';
          }
          const formatted = col.format === 'currency'
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
            : val.toLocaleString('tr-TR');
          parts.push(`<span class="panoptes-group-aggregate-pill"><strong>${col.title || col.field} ${label}:</strong> ${formatted}</span>`);
        });
      });
      return parts.join(' ');
    }

    renderGroupFooter(items, cols, totalColCount) {
      let hasAgg = false;
      cols.forEach(c => {
        if (c.aggregates || c.format === 'currency') hasAgg = true;
      });
      if (!hasAgg) return '';

      let html = '<tr class="panoptes-group-footer-row">';
      if (this.hasDetail()) html += '<td></td>';
      if (this.config.selectable) html += '<td></td>';

      cols.forEach(col => {
        const aggs = (col.aggregates || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (col.format === 'currency' && !aggs.includes('sum')) aggs.push('sum');

        if (aggs.length > 0 && col.field) {
          const numericVals = items.map(it => Number(this.getDeepValue(it, col.field)) || 0);
          const sum = numericVals.reduce((a, b) => a + b, 0);
          const formatted = col.format === 'currency'
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sum)
            : sum.toLocaleString('tr-TR');
          html += `<td style="text-align: ${col.align || 'left'}; font-weight: 600; color: #1e293b;">Ara Toplam: ${formatted}</td>`;
        } else {
          html += '<td></td>';
        }
      });

      if (this.hasActionsColumn()) html += '<td></td>';
      html += '</tr>';
      return html;
    }

    openContextMenu(e, row, rowIndex) {
      this.closeContextMenu();
      const menu = document.createElement('div');
      menu.id = `${this.elementId}-context-menu`;
      menu.className = 'panoptes-context-menu';

      menu.innerHTML = `
        <div class="panoptes-context-menu-item" data-ctx-action="edit">
          <svg style="width: 1rem; height: 1rem; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Satırı Düzenle</span>
        </div>
        <div class="panoptes-context-menu-item" data-ctx-action="copy-json">
          <svg style="width: 1rem; height: 1rem; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
          <span>JSON Olarak Kopyala</span>
        </div>
        <div class="panoptes-context-menu-item" data-ctx-action="copy-tsv">
          <svg style="width: 1rem; height: 1rem; color: #6366f1;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>Excel/TSV Olarak Kopyala</span>
        </div>
        ${this.hasDetail() ? `
          <div class="panoptes-context-menu-item" data-ctx-action="toggle-detail">
            <svg style="width: 1rem; height: 1rem; color: #8b5cf6;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Detayı Aç / Kapat</span>
          </div>
        ` : ''}
        <div class="panoptes-context-menu-divider"></div>
        <div class="panoptes-context-menu-item panoptes-item-danger" data-ctx-action="delete">
          <svg style="width: 1rem; height: 1rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          <span>Kaydı Sil</span>
        </div>
      `;

      document.body.appendChild(menu);

      // Positioning
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 220);
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;

      menu.addEventListener('click', (ev) => {
        const item = ev.target.closest('[data-ctx-action]');
        if (!item) return;
        const act = item.getAttribute('data-ctx-action');
        this.closeContextMenu();

        if (act === 'edit') {
          this.editRow(rowIndex);
        } else if (act === 'delete') {
          this.deleteRow(rowIndex);
        } else if (act === 'copy-json') {
          navigator.clipboard.writeText(JSON.stringify(row, null, 2))
            .then(() => this.showToast('Satır JSON formatında panoya kopyalandı', 'success'));
        } else if (act === 'copy-tsv') {
          const tsv = this.getLeafColumns().map(c => this.getDeepValue(row, c.field)).join('	');
          navigator.clipboard.writeText(tsv)
            .then(() => this.showToast('Satır Excel (TSV) formatında panoya kopyalandı', 'success'));
        } else if (act === 'toggle-detail') {
          const key = String(row.id ?? row.Id ?? rowIndex);
          if (this.state.expandedDetailRows.has(key)) this.state.expandedDetailRows.delete(key);
          else this.state.expandedDetailRows.add(key);
          this.renderRows();
        }
      });

      const onDocClick = (ev) => {
        if (!menu.contains(ev.target)) {
          this.closeContextMenu();
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('click', onDocClick), 50);
    }

    closeContextMenu() {
      const existing = document.getElementById(`${this.elementId}-context-menu`);
      if (existing) existing.remove();
    }

    initNestedGrids() {
      const nestedEls = this.wrapper.querySelectorAll('.panoptes-detail-row .panoptes-grid-wrapper, [data-panoptes-nested-grid]');
      nestedEls.forEach(el => {
        const id = el.id || el.getAttribute('data-panoptes-nested-grid');
        if (id && window.Panoptes && window.Panoptes.Grid) {
          const existing = window.Panoptes.Grid.get(id);
          // If instance already exists and table is rendered, don't recreate it
          if (existing && el.querySelector('.panoptes-table')) {
            return;
          }
          if (window.Panoptes.instances && window.Panoptes.instances[id]) {
            delete window.Panoptes.instances[id];
          }
          window.Panoptes.Grid.init(id);
        }
      });
    }

    exportToExcel() {
      const flat = this.getFlatData();
      if (!flat || flat.length === 0) {
        this.showToast('Dışa aktarılacak veri bulunamadı.', 'warning');
        return;
      }

      const cols = this.getLeafColumns().filter(c => c.field && !c.hidden);
      if (cols.length === 0) return;

      const escapeXml = (str) => {
        if (str == null) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const getColLetter = (idx) => {
        let letter = '';
        while (idx >= 0) {
          letter = String.fromCharCode((idx % 26) + 65) + letter;
          idx = Math.floor(idx / 26) - 1;
        }
        return letter;
      };

      // Generate Sheet XML
      let sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
      sheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
      
      // Column widths
      sheetXml += '<cols>';
      cols.forEach((c, idx) => {
        sheetXml += `<col min="${idx + 1}" max="${idx + 1}" width="24" customWidth="1"/>`;
      });
      sheetXml += '</cols>';

      sheetXml += '<sheetData>';
      
      // Row 1: Header row (style 1: Royal blue background, bold white text)
      sheetXml += '<row r="1" ht="26" customHeight="1">';
      cols.forEach((c, idx) => {
        const cellRef = `${getColLetter(idx)}1`;
        const title = escapeXml(c.title || c.field);
        sheetXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${title}</t></is></c>`;
      });
      sheetXml += '</row>';

      // Data Rows
      flat.forEach((row, rIdx) => {
        const rowNum = rIdx + 2;
        sheetXml += `<row r="${rowNum}" ht="20" customHeight="1">`;
        cols.forEach((c, cIdx) => {
          const cellRef = `${getColLetter(cIdx)}${rowNum}`;
          const val = this.getDeepValue(row, c.field);

          if (val === null || val === undefined) {
            sheetXml += `<c r="${cellRef}"/>`;
          } else if (typeof val === 'number') {
            sheetXml += `<c r="${cellRef}" t="n"><v>${val}</v></c>`;
          } else if (typeof val === 'boolean') {
            sheetXml += `<c r="${cellRef}" t="b"><v>${val ? 1 : 0}</v></c>`;
          } else {
            sheetXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
          }
        });
        sheetXml += '</row>';
      });

      sheetXml += '</sheetData></worksheet>';

      const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

      const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

      const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

      const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Veriler" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

      const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill fillType="none"/></fill>
    <fill><patternFill fillType="gray125"/></fill>
    <fill><patternFill fillType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

      const files = [
        { name: '[Content_Types].xml', content: contentTypesXml },
        { name: '_rels/.rels', content: relsXml },
        { name: 'xl/_rels/workbook.xml.rels', content: wbRelsXml },
        { name: 'xl/workbook.xml', content: workbookXml },
        { name: 'xl/styles.xml', content: stylesXml },
        { name: 'xl/worksheets/sheet1.xml', content: sheetXml }
      ];

      const zipBytes = buildZip(files);
      const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 10);
      a.download = `Panoptes_Export_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast('Excel (.xlsx) dosyası başarıyla indirildi', 'success');
    }

    exportToPdf() {
      window.print();
    }

    showToast(message, type = 'info') {
      let container = document.querySelector('.panoptes-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'panoptes-toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `panoptes-toast panoptes-toast-${type}`;
      toast.innerHTML = `<span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(1rem)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  window.Panoptes.Grid = {
    init: function (elementId) {
      const instance = new PanoptesGridInstance(elementId);
      window.Panoptes.instances[elementId] = instance;
      return instance;
    },
    get: function (elementId) {
      return window.Panoptes.instances[elementId];
    }
  };
})(window);