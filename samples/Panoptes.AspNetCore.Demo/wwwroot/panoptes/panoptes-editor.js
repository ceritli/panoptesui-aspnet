/**
 * Panoptes WYSIWYG Rich Text Editor Component
 * Pure vanilla JS, clean HTML formatting, Table, Image, Link, Source Code mode
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Editor = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-editor="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new EditorComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        getHTML: function(id) {
            const inst = this.get(id);
            return inst ? inst.getHTML() : '';
        },

        setHTML: function(id, html) {
            const inst = this.get(id);
            if (inst) inst.setHTML(html);
        },

        getText: function(id) {
            const inst = this.get(id);
            return inst ? inst.getText() : '';
        },

        executeCommand: function(id, cmd, val) {
            const inst = this.get(id);
            if (inst) inst.execute(cmd, val);
        }
    };

    class EditorComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.readOnly = element.dataset.readonly === 'true';
            this.onChangeCallback = element.dataset.onChange || null;

            this.body = element.querySelector('.panoptes-editor-body');
            this.sourceTextarea = element.querySelector('.panoptes-editor-source-textarea');
            this.input = element.querySelector(`#${this.id}_input`);
            this.formatSelect = element.querySelector('.panoptes-editor-cmd-format');
            this.btnSource = element.querySelector('.panoptes-editor-btn-source');
            this.wordCountEl = element.querySelector('.panoptes-editor-word-count');
            this.charCountEl = element.querySelector('.panoptes-editor-char-count');

            this.isSourceMode = false;

            this.bindEvents();
            this.updateStats();
        }

        bindEvents() {
            if (!this.body) return;

            // Toolbar buttons
            const buttons = this.container.querySelectorAll('.panoptes-editor-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const cmd = btn.dataset.cmd;
                    this.handleCommand(cmd);
                });
            });

            // Format dropdown (h1, h2, p, etc.)
            if (this.formatSelect) {
                this.formatSelect.addEventListener('change', () => {
                    const tag = this.formatSelect.value;
                    document.execCommand('formatBlock', false, `<${tag}>`);
                    this.body.focus();
                    this.onContentChange();
                });
            }

            // Source Mode Toggle
            if (this.btnSource) {
                this.btnSource.addEventListener('click', () => {
                    this.toggleSourceMode();
                });
            }

            // Body input / keyup
            this.body.addEventListener('input', () => this.onContentChange());
            this.body.addEventListener('keyup', () => this.onContentChange());

            // Source textarea input
            if (this.sourceTextarea) {
                this.sourceTextarea.addEventListener('input', () => {
                    this.body.innerHTML = this.sourceTextarea.value;
                    this.onContentChange(false);
                });
            }

            // Keyboard shortcut support (Ctrl+B, Ctrl+I, Ctrl+U)
            this.body.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'b' || e.key === 'B') {
                        e.preventDefault();
                        this.execute('bold');
                    } else if (e.key === 'i' || e.key === 'I') {
                        e.preventDefault();
                        this.execute('italic');
                    } else if (e.key === 'u' || e.key === 'U') {
                        e.preventDefault();
                        this.execute('underline');
                    }
                }
            });
        }

        handleCommand(cmd) {
            if (this.isSourceMode) return;

            if (cmd === 'createLink') {
                const url = prompt('Bağlantı adresini (URL) giriniz:', 'https://');
                if (url && url !== 'https://') {
                    document.execCommand('createLink', false, url);
                }
            } else if (cmd === 'insertImage') {
                const url = prompt('Görsel web adresini (URL) giriniz:', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop');
                if (url) {
                    document.execCommand('insertImage', false, url);
                }
            } else if (cmd === 'insertTable') {
                const tableHtml = `
                    <table class="w-full my-3 border-collapse border border-slate-300 text-xs">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300">
                                <th class="border border-slate-300 px-3 py-2 text-left font-bold">Başlık 1</th>
                                <th class="border border-slate-300 px-3 py-2 text-left font-bold">Başlık 2</th>
                                <th class="border border-slate-300 px-3 py-2 text-left font-bold">Başlık 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border border-slate-300 px-3 py-2">Veri A1</td>
                                <td class="border border-slate-300 px-3 py-2">Veri B1</td>
                                <td class="border border-slate-300 px-3 py-2">Veri C1</td>
                            </tr>
                            <tr>
                                <td class="border border-slate-300 px-3 py-2">Veri A2</td>
                                <td class="border border-slate-300 px-3 py-2">Veri B2</td>
                                <td class="border border-slate-300 px-3 py-2">Veri C2</td>
                            </tr>
                        </tbody>
                    </table>
                    <p><br></p>
                `;
                document.execCommand('insertHTML', false, tableHtml);
            } else {
                document.execCommand(cmd, false, null);
            }

            this.body.focus();
            this.onContentChange();
        }

        execute(cmd, val) {
            document.execCommand(cmd, false, val || null);
            this.body.focus();
            this.onContentChange();
        }

        toggleSourceMode() {
            this.isSourceMode = !this.isSourceMode;

            if (this.isSourceMode) {
                // Switch to HTML source
                this.sourceTextarea.value = this.body.innerHTML;
                this.body.classList.add('hidden');
                this.sourceTextarea.classList.remove('hidden');
                this.btnSource.classList.add('bg-blue-600', 'text-white');
                this.btnSource.textContent = '👁 Görsel Mod';
                this.sourceTextarea.focus();
            } else {
                // Switch back to WYSIWYG
                this.body.innerHTML = this.sourceTextarea.value;
                this.sourceTextarea.classList.add('hidden');
                this.body.classList.remove('hidden');
                this.btnSource.classList.remove('bg-blue-600', 'text-white');
                this.btnSource.textContent = '</> HTML';
                this.body.focus();
            }
            this.onContentChange();
        }

        onContentChange(updateSource = true) {
            const html = this.body.innerHTML;
            if (this.input) this.input.value = html;

            if (updateSource && this.sourceTextarea && !this.isSourceMode) {
                this.sourceTextarea.value = html;
            }

            this.updateStats();

            if (this.onChangeCallback && typeof window[this.onChangeCallback] === 'function') {
                window[this.onChangeCallback](html, this);
            }

            this.container.dispatchEvent(new CustomEvent('panoptes-editor-change', {
                detail: { html: html, text: this.getText(), editor: this }
            }));
        }

        updateStats() {
            const text = (this.body.innerText || '').trim();
            const words = text ? text.split(/\s+/).length : 0;
            const chars = text.length;

            if (this.wordCountEl) this.wordCountEl.textContent = `${words} kelime`;
            if (this.charCountEl) this.charCountEl.textContent = `${chars} karakter`;
        }

        getHTML() {
            return this.body.innerHTML;
        }

        setHTML(html) {
            this.body.innerHTML = html;
            if (this.sourceTextarea) this.sourceTextarea.value = html;
            this.onContentChange();
        }

        getText() {
            return (this.body.innerText || '').trim();
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.Editor.init());
    } else {
        window.Panoptes.Editor.init();
    }
})();
