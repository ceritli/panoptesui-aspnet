/**
 * Panoptes Gantt Component JavaScript Engine
 * Modern, hafif ve tam etkileşimli Proje Çizelgesi & Zaman Tüneli Motoru
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.Gantt = factory();
        root.panoptesGantt = root.Panoptes.Gantt;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    var GanttInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.tasks = [];
        this.timelineEl = this.element.querySelector('.panoptes-gantt-timeline');

        this.init();
    };

    GanttInstance.prototype.init = function () {
        var rawTasks = this.element.getAttribute('data-tasks');
        if (rawTasks) {
            try {
                this.tasks = JSON.parse(rawTasks);
            } catch (e) {
                console.error('[Panoptes Gantt] JSON görev verisi çözümlenemedi:', e);
                this.tasks = [];
            }
        }

        if (this.options.tasks) {
            this.tasks = this.options.tasks;
        }

        this.onTaskClickCallback = this.options.onTaskClick || this.element.getAttribute('data-on-task-click');

        this.renderTimeline();
        this.bindEvents();
    };

    GanttInstance.prototype.renderTimeline = function () {
        if (!this.timelineEl || !this.tasks || this.tasks.length === 0) return;

        // Min ve Max tarihleri hesapla
        var minDate = null;
        var maxDate = null;

        var parsedTasks = this.tasks.map(function (t) {
            var s = new Date(t.start);
            var e = new Date(t.end);
            // Gün başı ve sonu normalizasyonu
            s.setHours(0, 0, 0, 0);
            e.setHours(23, 59, 59, 999);

            if (!minDate || s < minDate) minDate = new Date(s);
            if (!maxDate || e > maxDate) maxDate = new Date(e);

            return {
                raw: t,
                id: t.id,
                title: t.title,
                start: s,
                end: e,
                percent: Math.min(100, Math.max(0, t.percentComplete || 0)),
                summary: !!t.summary,
                colorClass: t.colorClass || 'bg-blue-600'
            };
        });

        if (!minDate || !maxDate) return;

        // Minimum 14 gün genişlikte bir pencere oluştur
        var totalDays = Math.max(14, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        var dayWidth = 44; // px per day
        var totalWidth = totalDays * dayWidth;

        this.timelineEl.innerHTML = '';
        var innerWrapper = document.createElement('div');
        innerWrapper.className = 'panoptes-gantt-inner relative select-none';
        innerWrapper.style.width = totalWidth + 'px';
        innerWrapper.style.minWidth = '100%';

        // 1. Günlük Başlık Çizgisi (Header Days)
        var header = document.createElement('div');
        header.className = 'flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 sticky top-0 z-10';
        header.style.height = '41px';

        var dayCursor = new Date(minDate);
        var trMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        for (var i = 0; i < totalDays; i++) {
            var dayCell = document.createElement('div');
            dayCell.className = 'shrink-0 border-r border-slate-200 flex flex-col items-center justify-center text-center';
            dayCell.style.width = dayWidth + 'px';

            var isWeekend = dayCursor.getDay() === 0 || dayCursor.getDay() === 6;
            if (isWeekend) {
                dayCell.classList.add('bg-slate-100/60');
            }

            var dayNum = dayCursor.getDate();
            var monthName = trMonths[dayCursor.getMonth()];
            dayCell.innerHTML = '<span class="text-[10px] text-slate-400 font-normal leading-none">' + monthName + '</span>' +
                                '<span class="text-[11px] ' + (isWeekend ? 'text-rose-500' : 'text-slate-700') + ' font-bold leading-tight">' + dayNum + '</span>';

            header.appendChild(dayCell);
            dayCursor.setDate(dayCursor.getDate() + 1);
        }
        innerWrapper.appendChild(header);

        // 2. Dikey Izgara Çizgileri Arka Planı (Grid Lines)
        var gridBg = document.createElement('div');
        gridBg.className = 'absolute inset-0 top-[41px] flex pointer-events-none';
        dayCursor = new Date(minDate);

        for (var d = 0; d < totalDays; d++) {
            var gridLine = document.createElement('div');
            gridLine.className = 'shrink-0 border-r border-slate-100 h-full';
            gridLine.style.width = dayWidth + 'px';
            if (dayCursor.getDay() === 0 || dayCursor.getDay() === 6) {
                gridLine.classList.add('bg-slate-50/50');
            }
            gridBg.appendChild(gridLine);
            dayCursor.setDate(dayCursor.getDate() + 1);
        }
        innerWrapper.appendChild(gridBg);

        // 3. Görev Çubukları Satırları (Task Bars Rows)
        var rowsContainer = document.createElement('div');
        rowsContainer.className = 'relative z-1 divide-y divide-slate-100';

        var msPerDay = 1000 * 60 * 60 * 24;
        var self = this;

        parsedTasks.forEach(function (task) {
            var rowEl = document.createElement('div');
            rowEl.className = 'relative h-[41px] flex items-center px-1 hover:bg-blue-50/20 transition-colors';
            rowEl.setAttribute('data-timeline-task-id', task.id);

            // Başlangıç ofseti ve süresi hesapla
            var startDiffDays = (task.start.getTime() - minDate.getTime()) / msPerDay;
            var durationDays = Math.max(1, (task.end.getTime() - task.start.getTime()) / msPerDay);

            var leftPx = Math.max(4, startDiffDays * dayWidth);
            var widthPx = Math.max(dayWidth * 0.8, durationDays * dayWidth - 8);

            // Görev Barı
            var bar = document.createElement('div');
            bar.className = 'absolute h-7 rounded-lg shadow-xs flex items-center px-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md overflow-hidden text-white font-medium text-[11px] group ' + task.colorClass;
            bar.style.left = leftPx + 'px';
            bar.style.width = widthPx + 'px';
            bar.title = task.title + ' (%' + task.percent + ' Tamamlandı)\n' + task.raw.start + ' ~ ' + task.raw.end;

            // İlerleme dolgusu
            var progressFill = document.createElement('div');
            progressFill.className = 'absolute inset-0 bg-black/20 pointer-events-none rounded-lg';
            progressFill.style.width = task.percent + '%';
            bar.appendChild(progressFill);

            // Metin ve Yüzde
            var label = document.createElement('div');
            label.className = 'relative z-1 flex items-center justify-between w-full truncate gap-1';
            label.innerHTML = '<span class="truncate drop-shadow-xs">' + task.title + '</span>' +
                              '<span class="text-[10px] font-mono opacity-90 drop-shadow-xs shrink-0">%' + task.percent + '</span>';
            bar.appendChild(label);

            // Tıklama Olayı
            bar.addEventListener('click', function (e) {
                e.stopPropagation();
                self.handleTaskClick(task.raw);
            });

            rowEl.appendChild(bar);
            rowsContainer.appendChild(rowEl);
        });

        innerWrapper.appendChild(rowsContainer);
        this.timelineEl.appendChild(innerWrapper);
    };

    GanttInstance.prototype.bindEvents = function () {
        var self = this;
        var treeRows = this.element.querySelectorAll('.panoptes-gantt-tree [data-task-id]');

        treeRows.forEach(function (row) {
            var taskId = row.getAttribute('data-task-id');
            row.addEventListener('click', function () {
                var found = self.tasks.find(function (t) { return t.id === taskId; });
                if (found) {
                    self.handleTaskClick(found);
                }
            });

            // Hover senkronizasyonu
            row.addEventListener('mouseenter', function () {
                var barRow = self.element.querySelector('[data-timeline-task-id="' + taskId + '"]');
                if (barRow) barRow.classList.add('bg-blue-50/50');
            });
            row.addEventListener('mouseleave', function () {
                var barRow = self.element.querySelector('[data-timeline-task-id="' + taskId + '"]');
                if (barRow) barRow.classList.remove('bg-blue-50/50');
            });
        });
    };

    GanttInstance.prototype.handleTaskClick = function (task) {
        // CustomEvent tetikle
        var event = new CustomEvent('taskClick', {
            detail: { task: task },
            bubbles: true
        });
        this.element.dispatchEvent(event);

        if (this.onTaskClickCallback) {
            if (typeof window[this.onTaskClickCallback] === 'function') {
                window[this.onTaskClickCallback](task);
            } else if (typeof this.onTaskClickCallback === 'function') {
                this.onTaskClickCallback(task);
            }
        }
    };

    GanttInstance.prototype.addTask = function (task) {
        this.tasks.push(task);
        this.renderTimeline();
        this.bindEvents();
    };

    GanttInstance.prototype.getTasks = function () {
        return this.tasks;
    };

    GanttInstance.prototype.refresh = function () {
        this.renderTimeline();
        this.bindEvents();
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new GanttInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-gantt="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new GanttInstance(el);
                    instances.set(el.id, instance);
                }
            });
        }
    };
}));

// Sayfa yüklendiğinde otomatik başlat
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Panoptes && window.Panoptes.Gantt) {
                window.Panoptes.Gantt.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.Gantt) {
            window.Panoptes.Gantt.autoInit();
        }
    }
}
