/**
 * Panoptes Filter (Visual Query Builder) Component
 * Pure vanilla JS, recursive AND/OR logic groups, SQL & JSON AST generator
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Filter = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-filter="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new FilterBuilderComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        getExpression: function(id) {
            const inst = this.get(id);
            return inst ? inst.getExpression() : null;
        },

        getSQL: function(id) {
            const inst = this.get(id);
            return inst ? inst.getSQL() : '';
        },

        clear: function(id) {
            const inst = this.get(id);
            if (inst) inst.clear();
        }
    };

    class FilterBuilderComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.fields = JSON.parse(element.dataset.fields || '[]');
            this.onChangeCb = element.dataset.onChange || null;
            this.onApplyCb = element.dataset.onApply || null;

            this.treeEl = element.querySelector('.panoptes-filter-tree');
            this.inputEl = element.querySelector(`#${this.id}_input`);
            this.summaryEl = element.querySelector('.panoptes-filter-summary');
            this.btnApply = element.querySelector('.panoptes-filter-btn-apply');
            this.btnClear = element.querySelector('.panoptes-filter-btn-clear');

            // Root logic group structure
            this.rootGroup = {
                id: 'g_' + Math.random().toString(36).substr(2, 9),
                logic: 'AND',
                rules: []
            };

            this.initDefaultRules();
            this.bindEvents();
            this.render();
        }

        initDefaultRules() {
            if (this.fields.length > 0) {
                this.rootGroup.rules.push({
                    id: 'r_1',
                    field: this.fields[0].Name,
                    operator: 'contains',
                    value: ''
                });
            }
        }

        bindEvents() {
            if (this.btnApply) {
                this.btnApply.addEventListener('click', () => {
                    const expr = this.getExpression();
                    const sql = this.getSQL();
                    if (this.onApplyCb && typeof window[this.onApplyCb] === 'function') {
                        window[this.onApplyCb](expr, sql, this);
                    }
                    this.container.dispatchEvent(new CustomEvent('panoptes-filter-apply', {
                        detail: { expression: expr, sql: sql, filter: this }
                    }));
                });
            }

            if (this.btnClear) {
                this.btnClear.addEventListener('click', () => {
                    this.clear();
                });
            }
        }

        render() {
            if (!this.treeEl) return;
            this.treeEl.innerHTML = '';
            const rootNodeEl = this.createGroupDOM(this.rootGroup, true);
            this.treeEl.appendChild(rootNodeEl);
            this.updateState();
        }

        createGroupDOM(group, isRoot) {
            const groupCard = document.createElement('div');
            groupCard.className = `panoptes-filter-group p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 ${isRoot ? 'border-l-4 border-l-blue-600' : 'border-l-4 border-l-indigo-500 ml-4'}`;

            // Group header
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between gap-2';

            const leftControls = document.createElement('div');
            leftControls.className = 'flex items-center gap-2';

            // Logic switch button (AND / OR)
            const btnLogic = document.createElement('button');
            btnLogic.type = 'button';
            btnLogic.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition active:scale-95 ${group.logic === 'AND' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`;
            btnLogic.textContent = group.logic === 'AND' ? 'VE (AND)' : 'VEYA (OR)';
            btnLogic.addEventListener('click', () => {
                group.logic = group.logic === 'AND' ? 'OR' : 'AND';
                this.render();
            });
            leftControls.appendChild(btnLogic);

            // Add Rule button
            const btnAddRule = document.createElement('button');
            btnAddRule.type = 'button';
            btnAddRule.className = 'px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition active:scale-95 flex items-center gap-1';
            btnAddRule.innerHTML = '<span class="text-blue-600 font-bold">+</span> Kural Ekle';
            btnAddRule.addEventListener('click', () => {
                const defaultF = this.fields[0];
                group.rules.push({
                    id: 'r_' + Math.random().toString(36).substr(2, 9),
                    field: defaultF ? defaultF.Name : '',
                    operator: this.getDefaultOperator(defaultF ? defaultF.Type : 'string'),
                    value: ''
                });
                this.render();
            });
            leftControls.appendChild(btnAddRule);

            // Add Sub-Group button
            const btnAddGroup = document.createElement('button');
            btnAddGroup.type = 'button';
            btnAddGroup.className = 'px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition active:scale-95 flex items-center gap-1';
            btnAddGroup.innerHTML = '<span class="text-indigo-600 font-bold">+</span> Alt Grup Ekle';
            btnAddGroup.addEventListener('click', () => {
                group.rules.push({
                    id: 'g_' + Math.random().toString(36).substr(2, 9),
                    logic: 'AND',
                    rules: [
                        {
                            id: 'r_' + Math.random().toString(36).substr(2, 9),
                            field: this.fields[0]?.Name || '',
                            operator: 'contains',
                            value: ''
                        }
                    ]
                });
                this.render();
            });
            leftControls.appendChild(btnAddGroup);

            header.appendChild(leftControls);

            // Delete group button (if not root)
            if (!isRoot) {
                const btnDelGroup = document.createElement('button');
                btnDelGroup.type = 'button';
                btnDelGroup.className = 'p-1 text-slate-400 hover:text-rose-600 rounded transition';
                btnDelGroup.title = 'Grubu Sil';
                btnDelGroup.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
                btnDelGroup.addEventListener('click', () => {
                    this.removeRuleOrGroup(this.rootGroup, group.id);
                    this.render();
                });
                header.appendChild(btnDelGroup);
            }

            groupCard.appendChild(header);

            // Rules container
            const rulesWrap = document.createElement('div');
            rulesWrap.className = 'space-y-2';

            for (const rule of group.rules) {
                if (rule.logic) {
                    // Nested Group
                    const subGroupEl = this.createGroupDOM(rule, false);
                    rulesWrap.appendChild(subGroupEl);
                } else {
                    // Single Rule
                    const ruleRow = this.createRuleDOM(rule, group);
                    rulesWrap.appendChild(ruleRow);
                }
            }

            groupCard.appendChild(rulesWrap);
            return groupCard;
        }

        createRuleDOM(rule, parentGroup) {
            const row = document.createElement('div');
            row.className = 'panoptes-filter-rule-row flex flex-wrap items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs';

            const fieldDef = this.fields.find(f => f.Name === rule.field) || this.fields[0] || { Type: 'string' };

            // Field Select
            const selField = document.createElement('select');
            selField.className = 'bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 outline-none hover:border-slate-300';
            for (const f of this.fields) {
                const opt = document.createElement('option');
                opt.value = f.Name;
                opt.textContent = f.Title;
                if (f.Name === rule.field) opt.selected = true;
                selField.appendChild(opt);
            }
            selField.addEventListener('change', () => {
                rule.field = selField.value;
                const newFieldDef = this.fields.find(f => f.Name === rule.field);
                rule.operator = this.getDefaultOperator(newFieldDef ? newFieldDef.Type : 'string');
                rule.value = '';
                this.render();
            });
            row.appendChild(selField);

            // Operator Select
            const selOp = document.createElement('select');
            selOp.className = 'bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none hover:border-slate-300';
            const operators = this.getOperatorsForType(fieldDef.Type);
            for (const op of operators) {
                const opt = document.createElement('option');
                opt.value = op.value;
                opt.textContent = op.label;
                if (op.value === rule.operator) opt.selected = true;
                selOp.appendChild(opt);
            }
            selOp.addEventListener('change', () => {
                rule.operator = selOp.value;
                this.updateState();
            });
            row.appendChild(selOp);

            // Value Input
            if (fieldDef.Type === 'boolean') {
                const selBool = document.createElement('select');
                selBool.className = 'bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none hover:border-slate-300';
                selBool.innerHTML = '<option value="true">Evet / Aktif</option><option value="false">Hayır / Pasif</option>';
                selBool.value = rule.value === 'false' ? 'false' : 'true';
                selBool.addEventListener('change', () => {
                    rule.value = selBool.value;
                    this.updateState();
                });
                row.appendChild(selBool);
            } else {
                const inputVal = document.createElement('input');
                inputVal.type = (fieldDef.Type === 'number') ? 'number' : ((fieldDef.Type === 'date') ? 'date' : 'text');
                inputVal.className = 'bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500 font-medium flex-1 min-w-[120px]';
                inputVal.placeholder = 'Değer girin...';
                inputVal.value = rule.value || '';
                inputVal.addEventListener('input', () => {
                    rule.value = inputVal.value;
                    this.updateState();
                });
                row.appendChild(inputVal);
            }

            // Delete Rule Button
            const btnDelRule = document.createElement('button');
            btnDelRule.type = 'button';
            btnDelRule.className = 'p-1 text-slate-400 hover:text-rose-600 rounded transition ml-auto';
            btnDelRule.title = 'Kuralı Sil';
            btnDelRule.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
            btnDelRule.addEventListener('click', () => {
                const idx = parentGroup.rules.findIndex(r => r.id === rule.id);
                if (idx !== -1) {
                    parentGroup.rules.splice(idx, 1);
                    this.render();
                }
            });
            row.appendChild(btnDelRule);

            return row;
        }

        removeRuleOrGroup(parent, targetId) {
            for (let i = 0; i < parent.rules.length; i++) {
                if (parent.rules[i].id === targetId) {
                    parent.rules.splice(i, 1);
                    return true;
                }
                if (parent.rules[i].rules) {
                    if (this.removeRuleOrGroup(parent.rules[i], targetId)) return true;
                }
            }
            return false;
        }

        getOperatorsForType(type) {
            if (type === 'number') {
                return [
                    { value: 'eq', label: 'Eşittir (=)' },
                    { value: 'neq', label: 'Eşit Değildir (!=)' },
                    { value: 'gte', label: 'Büyük Eşittir (>=)' },
                    { value: 'gt', label: 'Büyüktür (>)' },
                    { value: 'lte', label: 'Küçük Eşittir (<=)' },
                    { value: 'lt', label: 'Küçüktür (<)' }
                ];
            } else if (type === 'date') {
                return [
                    { value: 'eq', label: 'Tarihinde' },
                    { value: 'gte', label: 'Sonrasında / Tarihinde' },
                    { value: 'lte', label: 'Öncesinde / Tarihinde' }
                ];
            } else if (type === 'boolean') {
                return [
                    { value: 'eq', label: 'Eşittir' }
                ];
            }
            // default string
            return [
                { value: 'contains', label: 'İçerir' },
                { value: 'doesNotContain', label: 'İçermez' },
                { value: 'startsWith', label: 'İle Başlar' },
                { value: 'endsWith', label: 'İle Biter' },
                { value: 'eq', label: 'Tam Eşittir' },
                { value: 'neq', label: 'Eşit Değildir' }
            ];
        }

        getDefaultOperator(type) {
            if (type === 'number') return 'gte';
            if (type === 'date') return 'gte';
            if (type === 'boolean') return 'eq';
            return 'contains';
        }

        updateState() {
            const expr = this.getExpression();
            const sql = this.getSQL();

            if (this.inputEl) {
                this.inputEl.value = JSON.stringify(expr);
            }

            if (this.summaryEl) {
                this.summaryEl.textContent = sql ? `SQL WHERE: ${sql}` : 'Tüm kayıtlar listeleniyor';
            }

            if (this.onChangeCb && typeof window[this.onChangeCb] === 'function') {
                window[this.onChangeCb](expr, sql, this);
            }

            this.container.dispatchEvent(new CustomEvent('panoptes-filter-change', {
                detail: { expression: expr, sql: sql, filter: this }
            }));
        }

        getExpression() {
            return JSON.parse(JSON.stringify(this.rootGroup));
        }

        getSQL() {
            return this.buildSQLGroup(this.rootGroup);
        }

        buildSQLGroup(group) {
            if (!group || !group.rules || group.rules.length === 0) return '';
            const clauses = [];

            for (const r of group.rules) {
                if (r.logic) {
                    const subSql = this.buildSQLGroup(r);
                    if (subSql) clauses.push(`(${subSql})`);
                } else {
                    if (r.value !== '' && r.value !== undefined && r.value !== null) {
                        clauses.push(this.buildSQLRule(r));
                    }
                }
            }

            return clauses.join(` ${group.logic} `);
        }

        buildSQLRule(rule) {
            const field = rule.field;
            const op = rule.operator;
            const val = rule.value;

            switch (op) {
                case 'contains': return `[${field}] LIKE '%${val}%'`;
                case 'doesNotContain': return `[${field}] NOT LIKE '%${val}%'`;
                case 'startsWith': return `[${field}] LIKE '${val}%'`;
                case 'endsWith': return `[${field}] LIKE '%${val}'`;
                case 'eq': return `[${field}] = '${val}'`;
                case 'neq': return `[${field}] != '${val}'`;
                case 'gte': return `[${field}] >= ${val}`;
                case 'gt': return `[${field}] > ${val}`;
                case 'lte': return `[${field}] <= ${val}`;
                case 'lt': return `[${field}] < ${val}`;
                default: return `[${field}] = '${val}'`;
            }
        }

        clear() {
            this.rootGroup.rules = [];
            this.initDefaultRules();
            this.render();
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.Filter.init());
    } else {
        window.Panoptes.Filter.init();
    }
})();
