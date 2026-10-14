/**
 * Panoptes UI - TreeView Vanilla JavaScript Engine
 * Sıfır dış bağımlılık, ultra hafif, hiyerarşik klasör ağacı, tri-state checkbox ve seçim desteği.
 */
(function (window, document) {
    'use strict';

    window.Panoptes = window.Panoptes || {};

    const instances = new Map();

    class TreeViewInstance {
        constructor(element) {
            this.element = typeof element === 'string' ? document.getElementById(element) : element;
            if (!this.element) return;

            this.id = this.element.id;
            this.onSelectHandler = this.element.getAttribute('data-on-select');
            this.onCheckHandler = this.element.getAttribute('data-on-check');
            this.onExpandHandler = this.element.getAttribute('data-on-expand');
            this.onCollapseHandler = this.element.getAttribute('data-on-collapse');

            this.init();
            instances.set(this.id, this);
        }

        init() {
            // 1. Chevron Genişletme / Daraltma Dinleyicisi
            this.element.addEventListener('click', (e) => {
                const toggleBtn = e.target.closest('[data-tree-toggle]');
                if (toggleBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const nodeLi = toggleBtn.closest('.panoptes-treeview-node');
                    this.toggleNode(nodeLi);
                    return;
                }

                // 2. Satır Seçim Dinleyicisi
                const row = e.target.closest('[data-tree-row]');
                if (row && !e.target.closest('input[type="checkbox"]')) {
                    const nodeLi = row.closest('.panoptes-treeview-node');
                    this.selectNode(nodeLi);
                }
            });

            // 3. Checkbox Değişim Dinleyicisi
            this.element.addEventListener('change', (e) => {
                const checkbox = e.target.closest('[data-tree-checkbox]');
                if (checkbox) {
                    const nodeLi = checkbox.closest('.panoptes-treeview-node');
                    this.handleCheckboxChange(nodeLi, checkbox.checked);
                }
            });
        }

        toggleNode(nodeLi) {
            if (!nodeLi) return;
            const group = nodeLi.querySelector(':scope > [data-tree-group]');
            const toggleBtn = nodeLi.querySelector(':scope > [data-tree-row] [data-tree-toggle]');
            const textEl = nodeLi.querySelector(':scope > [data-tree-row] .panoptes-tree-text');
            const nodeId = nodeLi.getAttribute('data-node-id');
            const text = textEl ? textEl.textContent.trim() : '';

            if (!group) return;

            const isCurrentlyExpanded = !group.classList.contains('hidden');

            if (isCurrentlyExpanded) {
                // Daralt
                group.classList.add('hidden');
                if (toggleBtn) {
                    toggleBtn.classList.remove('rotate-90', 'text-blue-600');
                }
                this.triggerCallback(this.onCollapseHandler, { id: nodeId, text: text, node: nodeLi });
            } else {
                // Genişlet
                group.classList.remove('hidden');
                if (toggleBtn) {
                    toggleBtn.classList.add('rotate-90', 'text-blue-600');
                }
                this.triggerCallback(this.onExpandHandler, { id: nodeId, text: text, node: nodeLi });
            }
        }

        expandNode(nodeLi) {
            if (!nodeLi) return;
            const group = nodeLi.querySelector(':scope > [data-tree-group]');
            const toggleBtn = nodeLi.querySelector(':scope > [data-tree-row] [data-tree-toggle]');
            if (group && group.classList.contains('hidden')) {
                group.classList.remove('hidden');
                if (toggleBtn) toggleBtn.classList.add('rotate-90', 'text-blue-600');
            }
        }

        collapseNode(nodeLi) {
            if (!nodeLi) return;
            const group = nodeLi.querySelector(':scope > [data-tree-group]');
            const toggleBtn = nodeLi.querySelector(':scope > [data-tree-row] [data-tree-toggle]');
            if (group && !group.classList.contains('hidden')) {
                group.classList.add('hidden');
                if (toggleBtn) toggleBtn.classList.remove('rotate-90', 'text-blue-600');
            }
        }

        selectNode(nodeLi) {
            if (!nodeLi) return;
            // Diğer seçili satırları temizle
            this.element.querySelectorAll('.panoptes-treeview-row').forEach(r => {
                r.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
            });

            const row = nodeLi.querySelector(':scope > [data-tree-row]');
            if (row) {
                row.classList.add('bg-blue-50', 'text-blue-700', 'font-semibold');
            }

            const nodeId = nodeLi.getAttribute('data-node-id');
            const textEl = nodeLi.querySelector(':scope > [data-tree-row] .panoptes-tree-text');
            const text = textEl ? textEl.textContent.trim() : '';

            this.triggerCallback(this.onSelectHandler, { id: nodeId, text: text, node: nodeLi });
        }

        handleCheckboxChange(nodeLi, isChecked) {
            if (!nodeLi) return;

            // 1. Alt tüm çocukların checkbox'larını aynı yap
            const childCheckboxes = nodeLi.querySelectorAll('[data-tree-group] [data-tree-checkbox]');
            childCheckboxes.forEach(chk => {
                chk.checked = isChecked;
                chk.indeterminate = false;
            });

            // 2. Ebeveyn düğümleri yukarıya doğru tara ve güncelle
            this.updateParentCheckboxes(nodeLi);

            const nodeId = nodeLi.getAttribute('data-node-id');
            const textEl = nodeLi.querySelector(':scope > [data-tree-row] .panoptes-tree-text');
            const text = textEl ? textEl.textContent.trim() : '';

            this.triggerCallback(this.onCheckHandler, {
                id: nodeId,
                text: text,
                checked: isChecked,
                checkedIds: this.getCheckedIds()
            });
        }

        updateParentCheckboxes(nodeLi) {
            let parentNode = nodeLi.parentElement.closest('.panoptes-treeview-node');
            while (parentNode) {
                const parentCheckbox = parentNode.querySelector(':scope > [data-tree-row] [data-tree-checkbox]');
                const group = parentNode.querySelector(':scope > [data-tree-group]');
                if (parentCheckbox && group) {
                    const siblingCheckboxes = group.querySelectorAll(':scope > .panoptes-treeview-node > [data-tree-row] [data-tree-checkbox]');
                    const total = siblingCheckboxes.length;
                    let checkedCount = 0;
                    let indeterminateCount = 0;

                    siblingCheckboxes.forEach(chk => {
                        if (chk.checked) checkedCount++;
                        if (chk.indeterminate) indeterminateCount++;
                    });

                    if (checkedCount === total) {
                        parentCheckbox.checked = true;
                        parentCheckbox.indeterminate = false;
                    } else if (checkedCount > 0 || indeterminateCount > 0) {
                        parentCheckbox.checked = false;
                        parentCheckbox.indeterminate = true;
                    } else {
                        parentCheckbox.checked = false;
                        parentCheckbox.indeterminate = false;
                    }
                }
                parentNode = parentNode.parentElement.closest('.panoptes-treeview-node');
            }
        }

        expandAll() {
            this.element.querySelectorAll('.panoptes-treeview-node').forEach(node => this.expandNode(node));
        }

        collapseAll() {
            this.element.querySelectorAll('.panoptes-treeview-node').forEach(node => this.collapseNode(node));
        }

        checkAll() {
            this.element.querySelectorAll('[data-tree-checkbox]').forEach(chk => {
                chk.checked = true;
                chk.indeterminate = false;
            });
        }

        uncheckAll() {
            this.element.querySelectorAll('[data-tree-checkbox]').forEach(chk => {
                chk.checked = false;
                chk.indeterminate = false;
            });
        }

        getCheckedIds() {
            const checkedIds = [];
            this.element.querySelectorAll('[data-tree-checkbox]:checked').forEach(chk => {
                const node = chk.closest('.panoptes-treeview-node');
                if (node) {
                    const id = node.getAttribute('data-node-id');
                    if (id) checkedIds.push(id);
                }
            });
            return checkedIds;
        }

        triggerCallback(handlerName, payload) {
            if (!handlerName) return;
            if (typeof window[handlerName] === 'function') {
                try {
                    window[handlerName](payload);
                } catch (err) {
                    console.error('Panoptes TreeView callback error:', err);
                }
            }
        }
    }

    function getOrCreateInstance(id) {
        if (!id) return null;
        if (instances.has(id)) {
            return instances.get(id);
        }
        const el = document.getElementById(id);
        if (el) {
            return new TreeViewInstance(el);
        }
        return null;
    }

    const publicApi = {
        initAll: function () {
            document.querySelectorAll('[data-panoptes-treeview="true"]').forEach(el => {
                if (!instances.has(el.id)) {
                    new TreeViewInstance(el);
                }
            });
        },
        get: function (id) {
            return getOrCreateInstance(id);
        },
        getInstance: function (id) {
            return getOrCreateInstance(id);
        }
    };

    window.Panoptes.TreeView = publicApi;
    window.panoptesTreeView = publicApi;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => publicApi.initAll());
    } else {
        publicApi.initAll();
    }

})(window, document);
