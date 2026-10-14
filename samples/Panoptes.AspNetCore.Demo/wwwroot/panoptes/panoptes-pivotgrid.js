/**
 * Panoptes PivotGrid Component (Çok Boyutlu Küp & Pivot Tablo / OLAP)
 * Panoptes ASP.NET Core PivotGrid Bileşeni
 */

(function () {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.PivotGrid = window.Panoptes.PivotGrid || {
        instances: {},

        getInstance: function (id) {
            return this.instances[id] || null;
        },

        init: function (container) {
            if (!container) return;
            const id = container.id || ('panoptes-pivot-' + Math.random().toString(36).substring(2, 9));
            if (this.instances[id]) return;

            const instance = new PanoptesPivotGridInstance(container);
            this.instances[id] = instance;
        },

        initAll: function () {
            document.querySelectorAll('[data-panoptes-pivotgrid="true"]').forEach(el => {
                this.init(el);
            });
        }
    };

    class PanoptesPivotGridInstance {
        constructor(container) {
            this.container = container;
            this.id = container.id;
            this.onUpdate = container.getAttribute('data-on-update');

            // Parse configurations
            this.fields = JSON.parse(container.getAttribute('data-fields') || '[]');
            this.rows = JSON.parse(container.getAttribute('data-rows') || '[]');
            this.columns = JSON.parse(container.getAttribute('data-columns') || '[]');
            this.measures = JSON.parse(container.getAttribute('data-measures') || '[]');

            const dataScript = container.querySelector('.panoptes-pivot-data');
            this.rawData = dataScript ? JSON.parse(dataScript.textContent || '[]') : [];

            this.tableContainer = container.querySelector('.panoptes-pivot-table-container');
            this.configPanel = container.querySelector('.panoptes-pivot-config-panel');

            this.initEvents();
            this.renderConfigurator();
            this.recalculateAndRender();
        }

        initEvents() {
            const toggleConfigBtn = this.container.querySelector('.panoptes-pivot-btn-config');
            if (toggleConfigBtn && this.configPanel) {
                toggleConfigBtn.addEventListener('click', () => {
                    this.configPanel.classList.toggle('hidden');
                });
            }

            const exportBtn = this.container.querySelector('.panoptes-pivot-btn-export');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportCsv());
            }
        }

        renderConfigurator() {
            if (!this.configPanel) return;

            const zoneRows = this.configPanel.querySelector('.panoptes-pivot-zone-rows');
            const zoneCols = this.configPanel.querySelector('.panoptes-pivot-zone-columns');
            const zoneMeasures = this.configPanel.querySelector('.panoptes-pivot-zone-measures');
            const zoneAvailable = this.configPanel.querySelector('.panoptes-pivot-available-fields');

            if (!zoneRows || !zoneCols || !zoneMeasures || !zoneAvailable) return;

            zoneRows.innerHTML = '';
            zoneCols.innerHTML = '';
            zoneMeasures.innerHTML = '';
            zoneAvailable.innerHTML = '';

            const usedFields = new Set([...this.rows, ...this.columns, ...this.measures]);

            // Helper to render pill
            const createPill = (fieldName, currentArea) => {
                const fieldObj = this.fields.find(f => f.Name === fieldName) || { Name: fieldName, Title: fieldName };
                const pill = document.createElement('div');
                pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 shadow-2xs text-slate-700 hover:border-blue-400 transition';
                pill.innerHTML = `
                    <span>${fieldObj.Title}</span>
                    <button type="button" class="text-slate-400 hover:text-rose-600 transition" title="Kaldır">&times;</button>
                `;

                pill.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeField(fieldName, currentArea);
                });
                return pill;
            };

            // Populate Rows
            this.rows.forEach(r => zoneRows.appendChild(createPill(r, 'row')));
            // Populate Columns
            this.columns.forEach(c => zoneCols.appendChild(createPill(c, 'column')));
            // Populate Measures
            this.measures.forEach(m => zoneMeasures.appendChild(createPill(m, 'measure')));

            // Available unused fields
            this.fields.forEach(f => {
                if (!usedFields.has(f.Name)) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition flex items-center gap-1';
                    btn.innerHTML = `+ ${f.Title}`;
                    btn.addEventListener('click', () => {
                        if (f.Type === 'number') {
                            this.measures.push(f.Name);
                        } else if (this.rows.length <= this.columns.length) {
                            this.rows.push(f.Name);
                        } else {
                            this.columns.push(f.Name);
                        }
                        this.renderConfigurator();
                        this.recalculateAndRender();
                    });
                    zoneAvailable.appendChild(btn);
                }
            });
        }

        removeField(fieldName, area) {
            if (area === 'row') {
                this.rows = this.rows.filter(x => x !== fieldName);
            } else if (area === 'column') {
                this.columns = this.columns.filter(x => x !== fieldName);
            } else if (area === 'measure') {
                this.measures = this.measures.filter(x => x !== fieldName);
            }
            this.renderConfigurator();
            this.recalculateAndRender();
        }

        recalculateAndRender() {
            if (!this.rawData || this.rawData.length === 0) {
                this.tableContainer.innerHTML = '<div class="p-8 text-center text-slate-400">Görüntülenecek veri bulunamadı.</div>';
                return;
            }

            if (this.measures.length === 0) {
                this.tableContainer.innerHTML = '<div class="p-8 text-center text-slate-400">Lütfen en az bir Değer / Metrik (Measure) seçin.</div>';
                return;
            }

            // 1. Distinct Row tuples
            const rowKeys = [];
            const rowKeySet = new Set();
            this.rawData.forEach(item => {
                const key = this.rows.map(r => item[r] ?? '').join(' __ ');
                if (!rowKeySet.has(key)) {
                    rowKeySet.add(key);
                    rowKeys.push(key);
                }
            });
            rowKeys.sort();

            // 2. Distinct Col tuples
            const colKeys = [];
            const colKeySet = new Set();
            this.rawData.forEach(item => {
                const key = this.columns.map(c => item[c] ?? '').join(' __ ');
                if (!colKeySet.has(key)) {
                    colKeySet.add(key);
                    colKeys.push(key);
                }
            });
            colKeys.sort();

            // 3. Aggregate values into matrix: matrix[rowKey][colKey][measure]
            const matrix = {};
            const colTotals = {};
            const rowTotals = {};
            let grandTotal = {};
            this.measures.forEach(m => {
                grandTotal[m] = 0;
            });

            rowKeys.forEach(rk => {
                matrix[rk] = {};
                rowTotals[rk] = {};
                this.measures.forEach(m => { rowTotals[rk][m] = 0; });

                colKeys.forEach(ck => {
                    matrix[rk][ck] = {};
                    this.measures.forEach(m => { matrix[rk][ck][m] = 0; });
                });
            });

            colKeys.forEach(ck => {
                colTotals[ck] = {};
                this.measures.forEach(m => { colTotals[ck][m] = 0; });
            });

            this.rawData.forEach(item => {
                const rk = this.rows.map(r => item[r] ?? '').join(' __ ');
                const ck = this.columns.map(c => item[c] ?? '').join(' __ ');

                this.measures.forEach(m => {
                    const val = parseFloat(item[m]) || 0;
                    if (matrix[rk] && matrix[rk][ck]) {
                        matrix[rk][ck][m] += val;
                        rowTotals[rk][m] += val;
                        colTotals[ck][m] += val;
                        grandTotal[m] += val;
                    }
                });
            });

            // 4. Build Table HTML
            let html = '<table class="w-full text-left border-collapse text-xs select-none min-w-[700px]">';

            // THEAD
            html += '<thead class="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-semibold">';
            html += '<tr>';

            // Corner Headers (Row Dimension titles)
            const rowTitles = this.rows.map(r => {
                const f = this.fields.find(x => x.Name === r);
                return f ? f.Title : r;
            }).join(' / ') || 'Özet Boyut';

            html += `<th class="py-3 px-4 bg-slate-200/80 border-r border-slate-300 text-slate-800" rowspan="2">${rowTitles}</th>`;

            // Column dimension headers
            colKeys.forEach(ck => {
                const colTitle = ck.replace(/ __ /g, ' - ') || '(Tümü)';
                html += `<th class="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-100 font-bold" colspan="${this.measures.length}">${colTitle}</th>`;
            });

            // Grand Total Col Header
            html += `<th class="py-2.5 px-4 text-center bg-indigo-50/80 text-indigo-900 border-l border-indigo-200 font-bold" colspan="${this.measures.length}">Genel Toplam</th>`;
            html += '</tr>';

            // Sub-row for Measure titles under each column
            html += '<tr class="border-b border-slate-200 text-[11px] text-slate-500 bg-slate-50">';
            colKeys.forEach(() => {
                this.measures.forEach(m => {
                    const mf = this.fields.find(x => x.Name === m);
                    html += `<th class="py-1.5 px-3 text-right font-medium border-r border-slate-200">${mf ? mf.Title : m}</th>`;
                });
            });
            this.measures.forEach(m => {
                const mf = this.fields.find(x => x.Name === m);
                html += `<th class="py-1.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/60">${mf ? mf.Title : m}</th>`;
            });
            html += '</tr>';
            html += '</thead>';

            // TBODY
            html += '<tbody class="divide-y divide-slate-100 text-slate-700 font-sans">';

            rowKeys.forEach(rk => {
                html += '<tr class="hover:bg-blue-50/40 transition">';
                // Row Dimension header
                const displayRow = rk.replace(/ __ /g, ' &rsaquo; ') || '(Tümü)';
                html += `<td class="py-2 px-4 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50">${displayRow}</td>`;

                // Cell values per col
                colKeys.forEach(ck => {
                    this.measures.forEach(m => {
                        const val = matrix[rk][ck][m];
                        html += `<td class="py-2 px-3 text-right font-mono border-r border-slate-100">${this.formatValue(val, m)}</td>`;
                    });
                });

                // Row total
                this.measures.forEach(m => {
                    const rTot = rowTotals[rk][m];
                    html += `<td class="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/80 border-l border-slate-200">${this.formatValue(rTot, m)}</td>`;
                });

                html += '</tr>';
            });

            // Column Grand Total Row (Footer)
            html += '<tr class="bg-indigo-50/70 border-t-2 border-indigo-200 font-bold text-indigo-950">';
            html += '<td class="py-2.5 px-4 text-slate-900 uppercase tracking-wider text-[11px]">Genel Toplam</td>';

            colKeys.forEach(ck => {
                this.measures.forEach(m => {
                    const cTot = colTotals[ck][m];
                    html += `<td class="py-2.5 px-3 text-right font-mono border-r border-indigo-100 text-indigo-900">${this.formatValue(cTot, m)}</td>`;
                });
            });

            // Matrix Grand Total Cell
            this.measures.forEach(m => {
                const gTot = grandTotal[m];
                html += `<td class="py-2.5 px-3 text-right font-mono font-black text-indigo-900 bg-indigo-100/80 border-l border-indigo-300 text-xs">${this.formatValue(gTot, m)}</td>`;
            });

            html += '</tr>';
            html += '</tbody>';
            html += '</table>';

            this.tableContainer.innerHTML = html;

            this.triggerCallback(this.onUpdate, {
                rows: this.rows,
                columns: this.columns,
                measures: this.measures
            });
        }

        formatValue(num, measureName) {
            const field = this.fields.find(f => f.Name === measureName);
            if (field && (field.Name.toLowerCase().includes('revenue') || field.Name.toLowerCase().includes('ciro') || field.Name.toLowerCase().includes('price') || field.Name.toLowerCase().includes('fiyat') || field.Title.includes('₺'))) {
                return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
            }
            return num.toLocaleString('tr-TR');
        }

        exportCsv() {
            const table = this.tableContainer.querySelector('table');
            if (!table) return;

            let csv = [];
            const rows = table.querySelectorAll('tr');
            rows.forEach(r => {
                const cols = r.querySelectorAll('th, td');
                const rowData = [];
                cols.forEach(c => {
                    let text = c.innerText.replace(/"/g, '""').trim();
                    rowData.push(`"${text}"`);
                });
                csv.push(rowData.join(';'));
            });

            const blob = new Blob(["\uFEFF" + csv.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Panoptes_Pivot_${new Date().toISOString().substring(0, 10)}.csv`;
            link.click();
        }

        setConfiguration(config) {
            if (config.rows) this.rows = config.rows;
            if (config.columns) this.columns = config.columns;
            if (config.measures) this.measures = config.measures;
            this.renderConfigurator();
            this.recalculateAndRender();
        }

        triggerCallback(callbackName, data) {
            if (!callbackName) return;
            if (typeof window[callbackName] === 'function') {
                window[callbackName](data);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.Panoptes.PivotGrid.initAll();
    });
})();
