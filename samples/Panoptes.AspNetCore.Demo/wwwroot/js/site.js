// Panoptes UI Enterprise Documentation & Code Viewer Standard (Prime Pattern)

// 1. Tabbed Top Navigation Switcher (Features | API Reference | Accessibility)
function switchMainDocTab(tabName) {
    document.querySelectorAll('.main-doc-tab').forEach(b => {
        b.classList.remove('text-blue-600', 'border-blue-600', 'font-bold', 'bg-blue-50/40');
        b.classList.add('font-semibold', 'text-slate-600', 'hover:text-slate-900', 'border-transparent');
    });
    const activeBtn = document.getElementById('tab-btn-' + tabName);
    if (activeBtn) {
        activeBtn.classList.remove('font-semibold', 'text-slate-600', 'hover:text-slate-900', 'border-transparent');
        activeBtn.classList.add('text-blue-600', 'border-blue-600', 'font-bold', 'bg-blue-50/40');
    }
    document.querySelectorAll('.main-doc-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById('panel-' + tabName);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        if (typeof initPanoptesLightCodeBlocks === 'function') {
            initPanoptesLightCodeBlocks();
        }
    }
}

// 2. Code Snippet Sub-tab Switcher (Razor TagHelper | HTML Output / C# Model)
function switchCodeTab(btn, tabId) {
    const parent = btn.closest('.panoptes-code-block');
    if (!parent) return;
    parent.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-blue-600', 'bg-white', 'border', 'border-slate-200', 'shadow-2xs', 'font-semibold');
        b.classList.add('text-slate-600', 'font-medium');
    });
    btn.classList.add('text-blue-600', 'bg-white', 'border', 'border-slate-200', 'shadow-2xs', 'font-semibold');
    btn.classList.remove('text-slate-600', 'font-medium');

    parent.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    const target = parent.querySelector('#' + tabId);
    if (target) {
        target.classList.remove('hidden');
        initPanoptesLightCodeBlocks();
    }
}

// 3. Tokenizer & Syntax Highlighter for Light-themed Code Display (Prime standard)
function tokenizeLine(line) {
    if (!line) return '';
    let s = line;
    const tokens = [];
    let i = 0;
    while (i < s.length) {
        const commentMatch = s.slice(i).match(/^(\/\/.*|<!--.*?-->|\/\*[\s\S]*?\*\/)/);
        if (commentMatch) {
            tokens.push({ type: 'comment', text: commentMatch[0] });
            i += commentMatch[0].length;
            continue;
        }
        const strMatch = s.slice(i).match(/^("[^"]*"|'[^']*'|`[^`]*`)/);
        if (strMatch) {
            tokens.push({ type: 'string', text: strMatch[0] });
            i += strMatch[0].length;
            continue;
        }
        const tagMatch = s.slice(i).match(/^<\/?[a-zA-Z0-9_\-]+/);
        if (tagMatch) {
            tokens.push({ type: 'tag', text: tagMatch[0] });
            i += tagMatch[0].length;
            continue;
        }
        const closeMatch = s.slice(i).match(/^\/?>/);
        if (closeMatch) {
            tokens.push({ type: 'tag', text: closeMatch[0] });
            i += closeMatch[0].length;
            continue;
        }
        const attrMatch = s.slice(i).match(/^([a-zA-Z0-9_\-:]+)(?=\=)/);
        if (attrMatch) {
            tokens.push({ type: 'attr', text: attrMatch[0] });
            i += attrMatch[0].length;
            continue;
        }
        const kwMatch = s.slice(i).match(/^(import|from|const|let|var|function|return|true|false|new|public|void|string|bool|int|double|decimal|class|model|using|namespace)\b/);
        if (kwMatch) {
            tokens.push({ type: 'kw', text: kwMatch[0] });
            i += kwMatch[0].length;
            continue;
        }
        tokens.push({ type: 'plain', text: s[i] });
        i++;
    }
    return tokens.map(t => {
        const esc = t.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        if (t.type === 'tag') return `<span class="text-emerald-600 font-medium">${esc}</span>`;
        if (t.type === 'attr') return `<span class="text-purple-600">${esc}</span>`;
        if (t.type === 'string') return `<span class="text-sky-700">${esc}</span>`;
        if (t.type === 'kw') return `<span class="text-rose-600 font-semibold">${esc}</span>`;
        if (t.type === 'comment') return `<span class="text-slate-400 italic">${esc}</span>`;
        return esc;
    }).join('');
}

// 4. Light Code Block Initializer with Line Numbers
function initPanoptesLightCodeBlocks() {
    document.querySelectorAll('.panoptes-code-viewer').forEach(container => {
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';
        
        const rawPre = container.querySelector('.panoptes-raw-code code');
        if (!rawPre) return;
        
        const rawText = rawPre.textContent.replace(/^\n+|\n+$/g, '');
        const lines = rawText.split('\n');
        
        let tableHtml = '<div class="overflow-x-auto"><table class="w-full border-collapse font-mono text-xs leading-relaxed select-text">';
        tableHtml += '<tbody>';
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const highlighted = tokenizeLine(line);
            tableHtml += `
                <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="w-10 select-none text-right pr-4 text-slate-400 font-mono text-xs align-top py-0.5">${lineNum}</td>
                    <td class="font-mono text-xs text-slate-800 whitespace-pre align-top py-0.5">${highlighted || '&nbsp;'}</td>
                </tr>`;
        });
        
        tableHtml += '</tbody></table></div>';
        
        const displayDiv = document.createElement('div');
        displayDiv.className = 'panoptes-code-display p-4 bg-white';
        displayDiv.innerHTML = tableHtml;
        container.appendChild(displayDiv);
    });
}

// 5. Copy Code Helper with Visual Feedback
function copyPanoptesCode(btn) {
    const block = btn.closest('.panoptes-code-block');
    if (!block) return;
    const activePane = block.querySelector('.tab-pane:not(.hidden)');
    const rawCode = activePane ? activePane.querySelector('.panoptes-raw-code code') : block.querySelector('.panoptes-raw-code code');
    const textToCopy = rawCode ? rawCode.innerText.trim() : (activePane ? activePane.innerText.trim() : '');
    if (!textToCopy) return;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="text-emerald-600 font-bold">Kopyalandı!</span>`;
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    });
}

// Auto init on page load
document.addEventListener('DOMContentLoaded', function () {
    initPanoptesLightCodeBlocks();
});
