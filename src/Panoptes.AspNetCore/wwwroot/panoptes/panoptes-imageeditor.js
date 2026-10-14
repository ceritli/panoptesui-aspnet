document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.panoptes-imageeditor').forEach(initImageEditor);
});

function initImageEditor(editorEl) {
    const canvas = editorEl.querySelector('.ie-canvas');
    const ctx = canvas.getContext('2d');
    const wrapper = editorEl.querySelector('.ie-canvas-wrapper');
    
    // UI Elements
    const btnOpen = editorEl.querySelector('.ie-open');
    const fileInput = editorEl.querySelector('.ie-file-input');
    const btnSave = editorEl.querySelector('.ie-save');
    const btnUndo = editorEl.querySelector('.ie-undo');
    const btnRedo = editorEl.querySelector('.ie-redo');
    const btnCrop = editorEl.querySelector('.ie-tool-crop');
    const btnResize = editorEl.querySelector('.ie-tool-resize');
    const btnColors = editorEl.querySelector('.ie-tool-colors');
    const btnFilters = editorEl.querySelector('.ie-tool-filters');
    const btnZoomOut = editorEl.querySelector('.ie-zoom-out');
    const btnZoomIn = editorEl.querySelector('.ie-zoom-in');
    const selZoom = editorEl.querySelector('.ie-zoom-sel');
    const container = editorEl.querySelector('.ie-canvas-container');
    
    // Right Pane Elements
    const rightPane = editorEl.querySelector('.ie-right-pane');
    const paneTitle = editorEl.querySelector('.ie-pane-title');
    const paneClose = editorEl.querySelector('.ie-pane-close');
    const paneApply = editorEl.querySelector('.ie-pane-apply');
    const paneCancel = editorEl.querySelector('.ie-pane-cancel');
    
    const paneContentResize = editorEl.querySelector('.ie-pane-resize');
    const paneContentCrop = editorEl.querySelector('.ie-pane-crop');
    const paneContentColors = editorEl.querySelector('.ie-pane-colors');
    const paneContentFilters = editorEl.querySelector('.ie-pane-filters');
    const paneContentExport = editorEl.querySelector('.ie-pane-export');
    const presetBtns = editorEl.querySelectorAll('.ie-preset-btn');
    const paneFooter = editorEl.querySelector('.ie-pane-footer');
    
    // Resize Controls
    const inputW = editorEl.querySelector('.ie-resize-w');
    const inputH = editorEl.querySelector('.ie-resize-h');
    const chkAspect = editorEl.querySelector('.ie-resize-aspect');

    // Crop Controls
    const cropBox = editorEl.querySelector('.ie-crop-box');
    const inputCX = editorEl.querySelector('.ie-crop-x');
    const inputCY = editorEl.querySelector('.ie-crop-y');
    const inputCW = editorEl.querySelector('.ie-crop-w');
    const inputCH = editorEl.querySelector('.ie-crop-h');

    // Color Controls
    const rngBright = editorEl.querySelector('.ie-range-bright');
    const valBright = editorEl.querySelector('.ie-val-bright');
    const rngContrast = editorEl.querySelector('.ie-range-contrast');
    const valContrast = editorEl.querySelector('.ie-val-contrast');
    const rngSaturate = editorEl.querySelector('.ie-range-saturate');
    const valSaturate = editorEl.querySelector('.ie-val-saturate');

    // Export Controls
    const expName = editorEl.querySelector('.ie-export-name');
    const expFormat = editorEl.querySelector('.ie-export-format');
    const expQuality = editorEl.querySelector('.ie-export-quality');
    const expQualityVal = editorEl.querySelector('.ie-export-quality-val');
    const expQualityContainer = editorEl.querySelector('.ie-export-quality-container');
    const btnDownload = editorEl.querySelector('.ie-btn-download');
    
    const expW = editorEl.querySelector('.ie-export-w');
    const expH = editorEl.querySelector('.ie-export-h');
    const expAspect = editorEl.querySelector('.ie-export-aspect');
    const expSizeVal = editorEl.querySelector('.ie-export-size-val');

    let img = new Image();
    
    // State
    let currentState = {
        dataUrl: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        presetFilter: 'none',
        filters: {
            brightness: 100,
            contrast: 100,
            saturate: 100
        }
    };

    let history = [];
    let historyIndex = -1;

    function saveState(imageDataUrl) {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(imageDataUrl);
        historyIndex = history.length - 1;
        currentState.dataUrl = imageDataUrl;
        updateButtons();
    }

    function updateButtons() {
        btnUndo.disabled = historyIndex <= 0;
        btnRedo.disabled = historyIndex >= history.length - 1;
        
        let zVal = Math.round(currentState.zoom * 100) / 100;
        let found = false;
        Array.from(selZoom.options).forEach(opt => {
            if (parseFloat(opt.value) === zVal) {
                opt.selected = true;
                found = true;
            }
        });
        if (!found) {
            let opt = document.createElement('option');
            opt.value = zVal;
            opt.text = Math.round(zVal * 100) + '%';
            opt.selected = true;
            selZoom.add(opt);
        }
    }

    function render() {
        if (!img.complete || img.naturalWidth === 0) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        wrapper.style.width = canvas.width + 'px';
        wrapper.style.height = canvas.height + 'px';
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply filters
        let baseF = `brightness(${currentState.filters.brightness}%) contrast(${currentState.filters.contrast}%) saturate(${currentState.filters.saturate}%)`;
        let finalF = currentState.presetFilter !== 'none' ? `${currentState.presetFilter} ${baseF}` : baseF;
        
        ctx.filter = finalF;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none'; // reset for future drawings

        wrapper.style.transform = `translate(${currentState.panX}px, ${currentState.panY}px) scale(${currentState.zoom})`;
        
        updateButtons();
    }

    function loadImage(url, isNewFile = false) {
        img.onload = () => {
            if (isNewFile) {
                const cWidth = container.clientWidth;
                const cHeight = container.clientHeight;
                const scaleX = (cWidth - 40) / img.naturalWidth;
                const scaleY = (cHeight - 40) / img.naturalHeight;
                currentState.zoom = Math.min(scaleX, scaleY, 1);
                currentState.panX = 0;
                currentState.panY = 0;
                
                const tempC = document.createElement('canvas');
                tempC.width = img.naturalWidth;
                tempC.height = img.naturalHeight;
                tempC.getContext('2d').drawImage(img, 0, 0);
                saveState(tempC.toDataURL('image/png'));
            }
            render();
        };
        img.onerror = () => {
            console.error("Image could not be loaded. CORS issue or invalid URL.");
        };
        img.crossOrigin = "Anonymous";
        img.src = url;
    }

    const initialUrl = editorEl.dataset.imageUrl;
    if (initialUrl) {
        loadImage(initialUrl, true);
    }

    // Tools Pane Logic
    let activeTool = null;
    
    function openPane(tool, title) {
        activeTool = tool;
        paneTitle.textContent = title;
        rightPane.classList.remove('hidden');
        
        paneContentResize.classList.add('hidden');
        paneContentCrop.classList.add('hidden');
        paneContentColors.classList.add('hidden');
        paneContentFilters.classList.add('hidden');
        paneContentExport.classList.add('hidden');
        cropBox.classList.add('hidden');
        paneFooter.classList.remove('hidden');
        
        if (tool === 'resize') {
            paneContentResize.classList.remove('hidden');
            inputW.value = canvas.width;
            inputH.value = canvas.height;
        } else if (tool === 'crop') {
            paneContentCrop.classList.remove('hidden');
            cropBox.classList.remove('hidden');
            
            const cw = Math.min(200, canvas.width);
            const ch = Math.min(200, canvas.height);
            const cx = (canvas.width - cw) / 2;
            const cy = (canvas.height - ch) / 2;
            
            updateCropBox(cx, cy, cw, ch);
        } else if (tool === 'colors') {
            paneContentColors.classList.remove('hidden');
            // reset sliders for current image baseline
            currentState.filters = { brightness: 100, contrast: 100, saturate: 100 };
            rngBright.value = 100;
            rngContrast.value = 100;
            rngSaturate.value = 100;
            updateColorLabels();
            render();
        } else if (tool === 'filters') {
            paneContentFilters.classList.remove('hidden');
            currentState.presetFilter = 'none';
            render();
        } else if (tool === 'export') {
            paneContentExport.classList.remove('hidden');
            paneFooter.classList.add('hidden');
            expW.value = canvas.width;
            expH.value = canvas.height;
            syncExportQualityVisibility();
            calculateExportSize();
        }
    }
    
    function closePane() {
        if (activeTool === 'colors') {
            currentState.filters = { brightness: 100, contrast: 100, saturate: 100 };
            render();
        } else if (activeTool === 'filters') {
            currentState.presetFilter = 'none';
            render();
        }
        rightPane.classList.add('hidden');
        cropBox.classList.add('hidden');
        activeTool = null;
    }

    paneClose.addEventListener('click', closePane);
    paneCancel.addEventListener('click', closePane);
    
    btnResize.addEventListener('click', () => openPane('resize', 'Yeniden Boyutlandır'));
    btnCrop.addEventListener('click', () => openPane('crop', 'Kırp'));
    btnColors.addEventListener('click', () => openPane('colors', 'Renk Ayarları'));
    btnFilters.addEventListener('click', () => openPane('filters', 'Instagram Filtreleri'));
    btnSave.addEventListener('click', () => openPane('export', 'Kaydet / Dışa Aktar'));

    // Export Logic
    function syncExportQualityVisibility() {
        if (expFormat.value === 'image/png') {
            expQualityContainer.classList.add('opacity-50', 'pointer-events-none');
        } else {
            expQualityContainer.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    let calcTimeout = null;
    function calculateExportSize() {
        if (calcTimeout) clearTimeout(calcTimeout);
        expSizeVal.textContent = "Hesaplanıyor...";
        
        calcTimeout = setTimeout(() => {
            let format = expFormat.value;
            let quality = parseInt(expQuality.value) / 100;
            let w = parseInt(expW.value) || canvas.width;
            let h = parseInt(expH.value) || canvas.height;

            const tempC = document.createElement('canvas');
            tempC.width = w;
            tempC.height = h;
            tempC.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
            
            const dataUrl = tempC.toDataURL(format, quality);
            const bytes = Math.round((dataUrl.length * 3) / 4);
            
            if (bytes > 1024 * 1024) {
                expSizeVal.textContent = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            } else {
                expSizeVal.textContent = (bytes / 1024).toFixed(1) + ' KB';
            }
        }, 300); // debounce
    }

    expW.addEventListener('input', () => {
        if (expAspect.checked && canvas.width > 0) {
            const ratio = canvas.height / canvas.width;
            expH.value = Math.round(expW.value * ratio);
        }
        calculateExportSize();
    });
    
    expH.addEventListener('input', () => {
        if (expAspect.checked && canvas.height > 0) {
            const ratio = canvas.width / canvas.height;
            expW.value = Math.round(expH.value * ratio);
        }
        calculateExportSize();
    });

    expFormat.addEventListener('change', () => {
        syncExportQualityVisibility();
        calculateExportSize();
    });
    
    expQuality.addEventListener('input', () => {
        expQualityVal.textContent = expQuality.value + '%';
        calculateExportSize();
    });

    btnDownload.addEventListener('click', () => {
        let name = expName.value.trim() || 'duzenlenmis-resim';
        let format = expFormat.value;
        let quality = parseInt(expQuality.value) / 100;
        let w = parseInt(expW.value) || canvas.width;
        let h = parseInt(expH.value) || canvas.height;
        
        // Append correct extension if not provided
        let ext = format === 'image/jpeg' ? '.jpg' : format === 'image/png' ? '.png' : '.webp';
        if (!name.toLowerCase().endsWith(ext)) {
            name += ext;
        }
        
        const tempC = document.createElement('canvas');
        tempC.width = w;
        tempC.height = h;
        tempC.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);

        const a = document.createElement('a');
        a.href = tempC.toDataURL(format, quality);
        a.download = name;
        a.click();
        
        closePane();
    });

    // Presets
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // highlight logic
            presetBtns.forEach(b => {
                b.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
                b.classList.add('bg-slate-100');
            });
            btn.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            btn.classList.remove('bg-slate-100');
            
            currentState.presetFilter = btn.dataset.filter || 'none';
            render();
        });
    });

    // Color UI Sync
    function updateColorLabels() {
        valBright.textContent = rngBright.value + '%';
        valContrast.textContent = rngContrast.value + '%';
        valSaturate.textContent = rngSaturate.value + '%';
    }
    
    [rngBright, rngContrast, rngSaturate].forEach(rng => {
        rng.addEventListener('input', () => {
            currentState.filters.brightness = parseInt(rngBright.value);
            currentState.filters.contrast = parseInt(rngContrast.value);
            currentState.filters.saturate = parseInt(rngSaturate.value);
            updateColorLabels();
            render();
        });
    });

    // Resize inputs
    inputW.addEventListener('input', () => {
        if (chkAspect.checked && canvas.width > 0) {
            const ratio = canvas.height / canvas.width;
            inputH.value = Math.round(inputW.value * ratio);
        }
    });
    inputH.addEventListener('input', () => {
        if (chkAspect.checked && canvas.height > 0) {
            const ratio = canvas.width / canvas.height;
            inputW.value = Math.round(inputH.value * ratio);
        }
    });

    // Crop UI Sync
    function updateCropBox(x, y, w, h) {
        cropBox.style.left = x + 'px';
        cropBox.style.top = y + 'px';
        cropBox.style.width = w + 'px';
        cropBox.style.height = h + 'px';
        
        inputCX.value = Math.round(x);
        inputCY.value = Math.round(y);
        inputCW.value = Math.round(w);
        inputCH.value = Math.round(h);
    }

    // Draggable Crop Box
    let isDraggingCrop = false;
    let cropDragStart = {x:0, y:0, cx:0, cy:0};
    cropBox.addEventListener('mousedown', (e) => {
        if (e.offsetX > cropBox.clientWidth - 15 && e.offsetY > cropBox.clientHeight - 15) {
            return; // resizing
        }
        isDraggingCrop = true;
        e.stopPropagation();
        cropDragStart = {
            x: e.clientX,
            y: e.clientY,
            cx: parseFloat(cropBox.style.left) || 0,
            cy: parseFloat(cropBox.style.top) || 0
        };
    });
    window.addEventListener('mousemove', (e) => {
        if (isDraggingCrop) {
            const dx = (e.clientX - cropDragStart.x) / currentState.zoom;
            const dy = (e.clientY - cropDragStart.y) / currentState.zoom;
            updateCropBox(cropDragStart.cx + dx, cropDragStart.cy + dy, parseFloat(cropBox.style.width), parseFloat(cropBox.style.height));
        }
    });
    window.addEventListener('mouseup', () => {
        if (isDraggingCrop) isDraggingCrop = false;
    });
    new ResizeObserver(() => {
        if (activeTool === 'crop' && !isDraggingCrop) {
            inputCW.value = cropBox.clientWidth;
            inputCH.value = cropBox.clientHeight;
        }
    }).observe(cropBox);
    
    [inputCX, inputCY, inputCW, inputCH].forEach(inp => {
        inp.addEventListener('input', () => {
            updateCropBox(
                parseFloat(inputCX.value)||0, 
                parseFloat(inputCY.value)||0, 
                parseFloat(inputCW.value)||0, 
                parseFloat(inputCH.value)||0
            );
        });
    });

    paneApply.addEventListener('click', () => {
        if (activeTool === 'resize') {
            const w = parseInt(inputW.value);
            const h = parseInt(inputH.value);
            if (w > 0 && h > 0) {
                const tempC = document.createElement('canvas');
                tempC.width = w;
                tempC.height = h;
                tempC.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
                saveAndReload(tempC.toDataURL('image/png'));
            }
        } else if (activeTool === 'crop') {
            const x = parseInt(inputCX.value);
            const y = parseInt(inputCY.value);
            const w = parseInt(inputCW.value);
            const h = parseInt(inputCH.value);
            if (w > 0 && h > 0) {
                const tempC = document.createElement('canvas');
                tempC.width = w;
                tempC.height = h;
                tempC.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
                saveAndReload(tempC.toDataURL('image/png'));
            }
        } else if (activeTool === 'colors' || activeTool === 'filters') {
            // Filters are already applied to canvas in render()!
            // We just need to extract current canvas to save it
            saveAndReload(canvas.toDataURL('image/png'));
            currentState.filters = { brightness: 100, contrast: 100, saturate: 100 }; 
            currentState.presetFilter = 'none';
        }
        
        // do not call closePane() which reverts filters, we manually hide
        rightPane.classList.add('hidden');
        cropBox.classList.add('hidden');
        activeTool = null;
    });

    function saveAndReload(dataUrl) {
        saveState(dataUrl);
        img = new Image();
        img.onload = () => render();
        img.src = dataUrl;
    }

    // Open File
    btnOpen.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                img = new Image();
                history = [];
                historyIndex = -1;
                currentState.filters = { brightness: 100, contrast: 100, saturate: 100 };
                currentState.presetFilter = 'none';
                loadImage(ev.target.result, true);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // History
    btnUndo.addEventListener('click', () => {
        if (historyIndex > 0) {
            historyIndex--;
            img = new Image();
            img.onload = () => render();
            img.src = history[historyIndex];
            currentState.dataUrl = history[historyIndex];
            currentState.filters = { brightness: 100, contrast: 100, saturate: 100 };
            currentState.presetFilter = 'none';
            updateButtons();
        }
    });

    btnRedo.addEventListener('click', () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            img = new Image();
            img.onload = () => render();
            img.src = history[historyIndex];
            currentState.dataUrl = history[historyIndex];
            currentState.filters = { brightness: 100, contrast: 100, saturate: 100 };
            updateButtons();
        }
    });

    // Zoom
    btnZoomIn.addEventListener('click', () => { currentState.zoom *= 1.2; render(); });
    btnZoomOut.addEventListener('click', () => { currentState.zoom /= 1.2; render(); });
    selZoom.addEventListener('change', (e) => {
        currentState.zoom = parseFloat(e.target.value);
        render();
    });

    // Panning
    let isDragging = false;
    let startX, startY, initPanX, initPanY;

    container.addEventListener('mousedown', (e) => {
        if (e.target !== container && e.target !== wrapper && e.target !== canvas) return;
        if (activeTool === 'crop') return; 
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initPanX = currentState.panX;
        initPanY = currentState.panY;
        container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        currentState.panX = initPanX + dx;
        currentState.panY = initPanY + dy;
        render();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'move';
        }
    });

    window.addEventListener('resize', render);
}
