/**
 * Panoptes Enterprise Form Components v1.0.0
 * Pure Vanilla JS + Tailwind CSS compliance
 * Zero external commercial dependencies
 */
(function (window) {
  'use strict';

  window.Panoptes = window.Panoptes || {};

  const MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const DAY_NAMES_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

  function parseDate(str) {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
    const parts = str.split(/[-./]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        // DD.MM.YYYY
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(d, fmt = 'DD.MM.YYYY') {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (fmt === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    return `${day}.${month}.${year}`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, "&quot;")
      .replace(/'/g, '&#39;');
  }

  // Universal Floating Popover Manager (escapes overflow:hidden / overflow:auto of any parent)
  function openFloatingPopover(targetElement, popoverElement, options = {}) {
    const rect = targetElement.getBoundingClientRect();
    const popoverWidth = options.matchWidth ? rect.width : (popoverElement.offsetWidth || 260);
    const popoverHeight = popoverElement.offsetHeight || 280;

    let initialLeft = rect.left;
    if (initialLeft + popoverWidth > window.innerWidth - 8) {
      initialLeft = window.innerWidth - popoverWidth - 8;
    }
    if (initialLeft < 8) initialLeft = 8;

    let initialTop = rect.bottom + 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
      initialTop = rect.top - popoverHeight - 4;
    }

    // Set position immediately on the element before mounting so it NEVER flies or animates from (0,0)
    popoverElement.style.position = 'fixed';
    popoverElement.style.zIndex = '999999';
    popoverElement.style.transition = 'none';
    popoverElement.style.animation = 'none';
    popoverElement.style.left = `${initialLeft}px`;
    popoverElement.style.top = `${initialTop}px`;
    if (options.matchWidth) {
      popoverElement.style.width = `${rect.width}px`;
    }

    const dialogParent = targetElement.closest('dialog');
    if (dialogParent) {
      dialogParent.appendChild(popoverElement);
    } else {
      document.body.appendChild(popoverElement);
    }

    const updatePosition = () => {
      if (!popoverElement.isConnected) return;
      const curRect = targetElement.getBoundingClientRect();
      const curWidth = options.matchWidth ? curRect.width : (popoverElement.offsetWidth || 260);
      const curHeight = popoverElement.offsetHeight || 280;

      let left = curRect.left;
      if (left + curWidth > window.innerWidth - 8) {
        left = window.innerWidth - curWidth - 8;
      }
      if (left < 8) left = 8;

      let top = curRect.bottom + 4;
      const curSpaceBelow = window.innerHeight - curRect.bottom;
      if (curSpaceBelow < curHeight && curRect.top > curHeight) {
        top = curRect.top - curHeight - 4;
      }

      popoverElement.style.left = `${left}px`;
      popoverElement.style.top = `${top}px`;
      if (options.matchWidth) {
        popoverElement.style.width = `${curRect.width}px`;
      }
    };
    popoverElement._updatePosition = updatePosition;

    const onScrollResize = () => updatePosition();
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);

    return () => {
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
    };
  }

  // ==========================================
  // 1. DATE PICKER
  // ==========================================
  // ==========================================
  // 1. DATE PICKER (Enterprise Feature Set)
  // ==========================================
  class DatePickerInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-datepicker-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-calendar"]');
      this.clearBtn = this.wrapper.querySelector('.panoptes-datepicker-clear');

      this.minDate = parseDate(this.config.min);
      this.maxDate = parseDate(this.config.max);
      this.selectedDate = parseDate(this.config.value);
      this.currentMonth = this.selectedDate ? new Date(this.selectedDate) : new Date();
      this.viewMode = 'month'; // 'month', 'year', 'decade'
      this.isOpen = false;
      this.popover = null;

      this.bindEvents();
      this.updateClearBtn();
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.config.disabled) return;
          this.toggle();
        });
      }

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setValue('');
        });
      }

      if (this.input) {
        this.input.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.config.disabled || this.config.readonlyMode) return;
          if (!this.isOpen) this.open();
        });

        this.input.addEventListener('change', () => {
          const d = parseDate(this.input.value);
          if (d) {
            this.selectedDate = d;
            this.currentMonth = new Date(d);
            this.triggerChange();
          } else if (!this.input.value) {
            this.selectedDate = null;
            this.triggerChange();
          }
          this.updateClearBtn();
        });

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.isOpen) {
            e.preventDefault();
            this.close();
          } else if (e.key === 'Enter') {
            if (this.isOpen) {
              e.preventDefault();
              this.close();
            }
          }
        });
      }
    }

    updateClearBtn() {
      if (this.clearBtn) {
        this.clearBtn.style.display = (this.input && this.input.value && this.config.clearable !== false && !this.config.disabled) ? 'inline-block' : 'none';
      }
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    open() {
      if (this.isOpen || this.config.disabled || this.config.readonlyMode) return;
      this.isOpen = true;
      this.viewMode = 'month';
      this.renderCalendar();

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
          document.removeEventListener('mousedown', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', onDocClick), 50);
    }

    close() {
      if (!this.isOpen) return;
      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
      this.isOpen = false;

      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    isDateDisabled(d) {
      if (!d) return false;
      // Min date check
      if (this.minDate) {
        const minZero = new Date(this.minDate.getFullYear(), this.minDate.getMonth(), this.minDate.getDate());
        const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (dZero < minZero) return true;
      }
      // Max date check
      if (this.maxDate) {
        const maxZero = new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), this.maxDate.getDate());
        const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (dZero > maxZero) return true;
      }
      // Custom disable-dates
      const dd = this.config.disableDates;
      if (dd) {
        if (dd === 'weekend' || dd === 'weekends') {
          const day = d.getDay();
          if (day === 0 || day === 6) return true; // Pazar veya Cumartesi
        } else if (typeof window[dd] === 'function') {
          if (window[dd](d)) return true;
        } else if (typeof dd === 'string' && dd.includes(',')) {
          const formatted = formatDate(d, this.config.format);
          if (dd.split(',').map(s => s.trim()).includes(formatted)) return true;
        }
      }
      return false;
    }

    getWeekNumber(d) {
      const target = new Date(d.valueOf());
      const dayNr = (d.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      return 1 + Math.ceil((firstThursday - target) / 604800000);
    }

    renderCalendar() {
      if (this.popover) this.popover.remove();

      this.popover = document.createElement('div');
      // No sliding animation! Pure solid fixed placement
      this.popover.className = 'panoptes-calendar-popover fixed z-[999999] bg-white border border-slate-200 rounded-xl shadow-2xl p-3 text-sm text-slate-800 select-none';
      this.popover.style.width = this.config.weekNumber ? '290px' : '260px';

      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();

      // View Mode 1: Month View (Standard Days)
      if (this.viewMode === 'month') {
        const firstDayOrig = new Date(year, month, 1).getDay();
        const firstDay = firstDayOrig === 0 ? 6 : firstDayOrig - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let headerHtml = `
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <button type="button" class="panoptes-cal-prev p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" class="panoptes-cal-switch-view font-bold text-slate-800 hover:text-blue-600 transition px-2 py-0.5 rounded-md hover:bg-slate-100">
              ${MONTH_NAMES_TR[month]} ${year}
            </button>
            <button type="button" class="panoptes-cal-next p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div class="grid ${this.config.weekNumber ? 'grid-cols-8' : 'grid-cols-7'} gap-1 text-center text-xs font-semibold text-slate-400 mb-1">
            ${this.config.weekNumber ? '<div class="text-[10px] text-slate-300">#</div>' : ''}
            ${DAY_NAMES_TR.map(d => `<div>${d}</div>`).join('')}
          </div>
        `;

        let daysHtml = `<div class="grid ${this.config.weekNumber ? 'grid-cols-8' : 'grid-cols-7'} gap-1 text-center text-xs">`;
        
        let currentWeekDay = 0;
        if (this.config.weekNumber) {
          const wNum = this.getWeekNumber(new Date(year, month, 1));
          daysHtml += `<div class="p-1.5 text-[10px] font-mono text-slate-300 flex items-center justify-center">${wNum}</div>`;
        }

        for (let i = 0; i < firstDay; i++) {
          daysHtml += '<div class="p-1.5 text-slate-300"></div>';
          currentWeekDay++;
        }

        const todayStr = formatDate(new Date());
        const selectedStr = formatDate(this.selectedDate);

        for (let d = 1; d <= daysInMonth; d++) {
          if (this.config.weekNumber && currentWeekDay > 0 && currentWeekDay % 7 === 0) {
            const wNum = this.getWeekNumber(new Date(year, month, d));
            daysHtml += `<div class="p-1.5 text-[10px] font-mono text-slate-300 flex items-center justify-center">${wNum}</div>`;
          }

          const currentDate = new Date(year, month, d);
          const curStr = formatDate(currentDate);
          const isSelected = curStr === selectedStr;
          const isToday = curStr === todayStr;
          const isDisabled = this.isDateDisabled(currentDate);

          daysHtml += `
            <button type="button" 
                    class="panoptes-cal-day p-1.5 rounded-lg transition font-medium ${isSelected ? 'bg-blue-600 text-white font-bold shadow-xs' : isToday ? 'border border-blue-500 text-blue-600 hover:bg-blue-50' : 'hover:bg-slate-100 text-slate-700'} ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent pointer-events-none' : ''}" 
                    data-day="${d}"
                    ${isDisabled ? 'disabled' : ''}>
              ${d}
            </button>
          `;
          currentWeekDay++;
        }
        daysHtml += '</div>';

        const footerHtml = `
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button type="button" class="panoptes-cal-today text-blue-600 hover:text-blue-800 font-semibold px-1 py-0.5 rounded hover:bg-blue-50 transition">Bugün</button>
            <button type="button" class="panoptes-cal-clear text-slate-400 hover:text-rose-600 font-semibold px-1 py-0.5 rounded hover:bg-rose-50 transition">Temizle</button>
          </div>
        `;

        this.popover.innerHTML = headerHtml + daysHtml + footerHtml;

        // Month view bindings
        this.popover.querySelector('.panoptes-cal-prev').addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
          this.renderCalendar();
        });

        this.popover.querySelector('.panoptes-cal-next').addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
          this.renderCalendar();
        });

        this.popover.querySelector('.panoptes-cal-switch-view').addEventListener('click', (e) => {
          e.stopPropagation();
          this.viewMode = 'year';
          this.renderCalendar();
        });

        this.popover.querySelectorAll('.panoptes-cal-day:not([disabled])').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = parseInt(btn.getAttribute('data-day'), 10);
            this.selectedDate = new Date(year, month, day);
            this.setValue(formatDate(this.selectedDate, this.config.format));
            this.close();
          });
        });

        this.popover.querySelector('.panoptes-cal-today').addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectedDate = new Date();
          this.setValue(formatDate(this.selectedDate, this.config.format));
          this.close();
        });

        this.popover.querySelector('.panoptes-cal-clear').addEventListener('click', (e) => {
          e.stopPropagation();
          this.setValue('');
          this.close();
        });

      } else if (this.viewMode === 'year') {
        // View Mode 2: Year View (12 Months)
        let headerHtml = `
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <button type="button" class="panoptes-cal-prev-year p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class="font-bold text-slate-800">${year}</span>
            <button type="button" class="panoptes-cal-next-year p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            ${MONTH_NAMES_TR.map((mName, mIdx) => `
              <button type="button" class="panoptes-cal-month-btn py-2 px-1 rounded-lg hover:bg-blue-50 hover:text-blue-700 font-medium transition ${mIdx === month ? 'bg-blue-600 text-white font-bold' : 'text-slate-700'}" data-month="${mIdx}">
                ${mName.slice(0, 3)}
              </button>
            `).join('')}
          </div>
        `;
        this.popover.innerHTML = headerHtml;

        this.popover.querySelector('.panoptes-cal-prev-year').onclick = (e) => {
          e.stopPropagation();
          this.currentMonth.setFullYear(year - 1);
          this.renderCalendar();
        };
        this.popover.querySelector('.panoptes-cal-next-year').onclick = (e) => {
          e.stopPropagation();
          this.currentMonth.setFullYear(year + 1);
          this.renderCalendar();
        };
        this.popover.querySelectorAll('.panoptes-cal-month-btn').forEach(b => {
          b.onclick = (e) => {
            e.stopPropagation();
            const m = parseInt(b.getAttribute('data-month'), 10);
            this.currentMonth.setMonth(m);
            this.viewMode = 'month';
            this.renderCalendar();
          };
        });
      }

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover);
    }

    triggerChange() {
      if (this._isTriggeringChange) return;
      this._isTriggeringChange = true;
      if (this.input) {
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const event = new CustomEvent('change', { detail: { value: this.input ? this.input.value : '', date: this.selectedDate }, bubbles: true });
      this.wrapper.dispatchEvent(event);
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](this.input ? this.input.value : '');
      }
      this._isTriggeringChange = false;
    }

    getValue() {
      return this.input ? this.input.value : '';
    }

    value(val) {
      if (val !== undefined) {
        this.setValue(val);
      }
      return this.getValue();
    }

    setValue(val) {
      if (this.input) {
        this.input.value = val || '';
        this.selectedDate = parseDate(val);
        if (this.selectedDate) this.currentMonth = new Date(this.selectedDate);
        this.triggerChange();
        this.updateClearBtn();
      }
    }

    min(val) {
      if (val !== undefined) {
        this.minDate = parseDate(val);
        this.config.min = val;
      }
      return this.minDate;
    }

    max(val) {
      if (val !== undefined) {
        this.maxDate = parseDate(val);
        this.config.max = val;
      }
      return this.maxDate;
    }

    enable(state = true) {
      this.config.disabled = !state;
      if (this.input) this.input.disabled = !state;
      if (this.toggleBtn) this.toggleBtn.disabled = !state;
      this.updateClearBtn();
    }

    readonly(state = true) {
      this.config.readonlyMode = state;
      if (this.input) this.input.readOnly = state;
    }
  }

  // ==========================================
  // 2. DATE RANGE PICKER
  // ==========================================
  class DateRangePickerInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;
      if (this.wrapper.dataset.panoptesInitialized === 'true') return;
      this.wrapper.dataset.panoptesInitialized = 'true';

      const script = this.wrapper.querySelector(`script[data-panoptes-daterangepicker-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.startInput = this.wrapper.querySelector(`#${id}-start`);
      this.endInput = this.wrapper.querySelector(`#${id}-end`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-rangepicker"]');

      this.startDate = parseDate(this.config.startDate);
      this.endDate = parseDate(this.config.endDate);
      this.tempStartDate = null;
      this.currentMonth = this.startDate ? new Date(this.startDate) : new Date();
      this.isOpen = false;
      this.popover = null;
      this.cleanupFloating = null;
      this.onDocClick = null;

      this.bindEvents();
    }

    bindEvents() {
      if (this.input) {
        this.input.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }
    }

    open() {
      if (this.isOpen || this.config.disabled) return;
      this.isOpen = true;

      // Sync latest dates from hidden inputs if they exist
      if (this.startInput && this.startInput.value) {
        this.startDate = parseDate(this.startInput.value);
      }
      if (this.endInput && this.endInput.value) {
        this.endDate = parseDate(this.endInput.value);
      }
      this.tempStartDate = null;
      if (this.startDate) {
        this.currentMonth = new Date(this.startDate);
      }

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-daterange-popover absolute z-[999999] bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 text-sm text-slate-800 select-none';
      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover);

      this.render();

      this.onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
        }
      };
      setTimeout(() => document.addEventListener('mousedown', this.onDocClick), 50);
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      if (this.onDocClick) {
        document.removeEventListener('mousedown', this.onDocClick);
        this.onDocClick = null;
      }
      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
    }

    render() {
      if (!this.popover) return;

      const presetsHtml = this.config.presets ? `
        <div class="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 text-xs font-medium text-slate-600 min-w-[120px]">
          <span class="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Hızlı Aralıklar</span>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="today">Bugün</button>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="yesterday">Dün</button>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="last7">Son 7 Gün</button>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="last30">Son 30 Gün</button>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="thisMonth">Bu Ay</button>
          <button type="button" class="panoptes-preset-btn text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition" data-preset="lastMonth">Geçen Ay</button>
        </div>
      ` : '';

      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      let firstDay = new Date(year, month, 1).getDay();
      firstDay = firstDay === 0 ? 6 : firstDay - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      let calHtml = `
        <div class="flex-1 w-64">
          <div class="flex items-center justify-between mb-2">
            <button type="button" class="panoptes-range-prev p-1 rounded hover:bg-slate-100 text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class="font-semibold text-slate-800">${MONTH_NAMES_TR[month]} ${year}</span>
            <button type="button" class="panoptes-range-next p-1 rounded hover:bg-slate-100 text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-1">
            ${DAY_NAMES_TR.map(d => `<div>${d}</div>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-xs">
      `;

      for (let i = 0; i < firstDay; i++) {
        calHtml += '<div class="p-1.5"></div>';
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const curDate = new Date(year, month, d);
        let cellClass = 'hover:bg-slate-100 text-slate-700';

        const isStart = this.startDate && formatDate(curDate) === formatDate(this.startDate);
        const isEnd = this.endDate && formatDate(curDate) === formatDate(this.endDate);
        const inRange = this.startDate && this.endDate && curDate > this.startDate && curDate < this.endDate;

        if (isStart || isEnd) {
          cellClass = 'bg-blue-600 text-white font-bold rounded-lg shadow-sm';
        } else if (inRange) {
          cellClass = 'bg-blue-50 text-blue-700 rounded-none';
        } else {
          cellClass = 'rounded-lg';
        }

        calHtml += `
          <button type="button" class="panoptes-range-day p-1.5 transition text-xs font-medium ${cellClass}" data-day="${d}">
            ${d}
          </button>
        `;
      }

      const activeRangeText = this.startDate 
        ? (this.endDate ? `${formatDate(this.startDate)} → ${formatDate(this.endDate)}` : `${formatDate(this.startDate)} → ${formatDate(this.startDate)}`)
        : 'Aralık Seçin';

      calHtml += `
          </div>
          <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500 text-[11px] font-medium">${activeRangeText}</span>
            <button type="button" class="panoptes-range-apply px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition shadow-2xs">Uygula</button>
          </div>
        </div>
      `;

      this.popover.innerHTML = presetsHtml + calHtml;

      // Event handlers
      this.popover.querySelector('.panoptes-range-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.render();
      });

      this.popover.querySelector('.panoptes-range-next').addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.render();
      });

      this.popover.querySelectorAll('.panoptes-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const p = btn.getAttribute('data-preset');
          const now = new Date();
          if (p === 'today') {
            this.setRange(now, now);
          } else if (p === 'yesterday') {
            const y = new Date(now); y.setDate(y.getDate() - 1);
            this.setRange(y, y);
          } else if (p === 'last7') {
            const s = new Date(now); s.setDate(s.getDate() - 6);
            this.setRange(s, now);
          } else if (p === 'last30') {
            const s = new Date(now); s.setDate(s.getDate() - 29);
            this.setRange(s, now);
          } else if (p === 'thisMonth') {
            const s = new Date(now.getFullYear(), now.getMonth(), 1);
            const en = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            this.setRange(s, en);
          } else if (p === 'lastMonth') {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const en = new Date(now.getFullYear(), now.getMonth(), 0);
            this.setRange(s, en);
          }
          this.close();
        });
      });

      this.popover.querySelectorAll('.panoptes-range-day').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const day = parseInt(btn.getAttribute('data-day'), 10);
          const clickedDate = new Date(year, month, day);

          if (!this.tempStartDate || (this.tempStartDate && this.endDate)) {
            // First click: begins new range selection
            this.tempStartDate = clickedDate;
            this.startDate = clickedDate;
            this.endDate = null;
          } else {
            // Second click: completes range
            if (clickedDate < this.tempStartDate) {
              this.startDate = clickedDate;
              this.endDate = this.tempStartDate;
            } else {
              this.startDate = this.tempStartDate;
              this.endDate = clickedDate;
            }
            this.tempStartDate = null;
          }
          this.render();
        });
      });

      this.popover.querySelector('.panoptes-range-apply').addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyRange();
        this.close();
      });
    }

    setRange(s, en) {
      this.startDate = s ? (typeof s === 'string' ? parseDate(s) : new Date(s)) : null;
      this.endDate = en ? (typeof en === 'string' ? parseDate(en) : new Date(en)) : null;
      this.tempStartDate = null;
      this.applyRange();
    }

    applyRange() {
      // If user selected only one date and hits "Uygula", make it a single-day range
      if (this.startDate && !this.endDate) {
        this.endDate = new Date(this.startDate);
      }
      this.tempStartDate = null;

      const sStr = formatDate(this.startDate, this.config.format);
      const eStr = formatDate(this.endDate, this.config.format);
      if (this.startInput) this.startInput.value = sStr;
      if (this.endInput) this.endInput.value = eStr;
      if (this.input) {
        this.input.value = sStr && eStr ? `${sStr}${this.config.separator || ' - '}${eStr}` : sStr;
      }
      const event = new CustomEvent('change', { detail: { start: sStr, end: eStr } });
      this.wrapper.dispatchEvent(event);
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](sStr, eStr);
      }
    }


    getValue() {
      return {
        start: this.startInput ? this.startInput.value : '',
        end: this.endInput ? this.endInput.value : '',
        text: this.input ? this.input.value : ''
      };
    }

    setValue(start, end) {
      this.startDate = parseDate(start);
      this.endDate = parseDate(end);
      this.applyRange();
    }

    enable(enabled = true) {
      this.config.disabled = !enabled;
      if (this.input) {
        this.input.disabled = !enabled;
        if (!enabled) {
          this.input.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        } else {
          this.input.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        }
      }
      if (this.toggleBtn) {
        this.toggleBtn.disabled = !enabled;
      }
    }
  }

  // ==========================================
  // 3. SELECT (SEARCHABLE DROPDOWN)
  // ==========================================
  // ==========================================
  // 3. SELECT / DROPDOWNLIST (Enterprise Feature Set)
  // ==========================================
  class SelectInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-select-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.control = this.wrapper.querySelector('.panoptes-select-control');
      this.display = this.wrapper.querySelector('.panoptes-select-display');
      this.hiddenInput = this.wrapper.querySelector(`#${id}-value`);
      this.clearBtn = this.wrapper.querySelector('.panoptes-select-clear');
      this.arrowIcon = this.wrapper.querySelector('.panoptes-select-control svg:last-child');

      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';

      this.rawOptions = this.parseOptions();
      this.options = [...this.rawOptions];
      this.value = this.config.value || (this.hiddenInput ? this.hiddenInput.value : '');
      this.selectedItem = null;
      this.isOpen = false;
      this.dropdown = null;
      this.itemsContainer = null;
      this.searchInput = null;
      this.highlightedIndex = -1;

      this.init();
    }

    parseOptions() {
      if (!this.config.options) return [];
      let raw = this.config.options;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            raw = JSON.parse(trimmed);
          } catch (e) {
            raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (Array.isArray(raw)) {
        return raw.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              text: item[this.dataTextField] ?? item.text ?? item.title ?? item.name ?? String(item.value ?? ''),
              value: String(item[this.dataValueField] ?? item.value ?? item.id ?? item.text ?? ''),
              group: item.group || item.category || null,
              disabled: !!item.disabled,
              icon: item.icon || null,
              desc: item.desc || item.description || null,
              raw: item
            };
          }
          return {
            text: String(item),
            value: String(item),
            group: null,
            disabled: false,
            raw: item
          };
        });
      }
      return [];
    }

    async init() {
      // Remote data binding if url is provided
      if (this.config.url) {
        await this.loadRemoteData(this.config.url);
      }

      // Check cascading dependency
      if (this.config.cascadeFrom) {
        this.initCascading();
      }

      // Sync initial display
      this.syncDisplay();

      // Bind events
      this.bindEvents();
    }

    async loadRemoteData(url) {
      try {
        if (this.display) this.display.textContent = 'Yükleniyor...';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.data || data.Data || (Array.isArray(data) ? data : []);
        this.rawOptions = items.map(item => ({
          text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.id ?? ''),
          value: String(item[this.dataValueField] ?? item.id ?? item.value ?? item.name ?? ''),
          group: item.group || item.category || null,
          disabled: !!item.disabled,
          icon: item.icon || null,
          desc: item.desc || item.description || null,
          raw: item
        }));
        this.options = [...this.rawOptions];
        this.syncDisplay();

        if (this.config.onDataBound && typeof window[this.config.onDataBound] === 'function') {
          window[this.config.onDataBound](this.options);
        }
      } catch (err) {
        console.error('[Panoptes Select] Remote data fetch failed:', err);
        if (this.display) this.display.textContent = this.config.placeholder || 'Seçiniz...';
      }
    }

    initCascading() {
      const parentSelect = window.Panoptes?.Select?.instances?.get(this.config.cascadeFrom);
      const parentEl = document.getElementById(this.config.cascadeFrom);

      const handleParentChange = (parentVal) => {
        if (!parentVal) {
          this.options = [];
          this.setValue('');
          this.enable(false);
          return;
        }

        const filterField = this.config.cascadeFromField || 'parentId';
        this.options = this.rawOptions.filter(opt => {
          const raw = opt.raw || {};
          const matched = String(raw[filterField] || opt.group || '') === String(parentVal);
          return matched;
        });

        this.setValue('');
        this.enable(this.options.length > 0);
      };

      if (parentSelect) {
        const initialParentVal = parentSelect.getValue();
        if (!initialParentVal) {
          this.enable(false);
        } else {
          handleParentChange(initialParentVal);
        }
      } else if (parentEl) {
        this.enable(false);
      }

      // Listen for parent changes
      if (parentEl) {
        parentEl.addEventListener('change', (e) => {
          const val = e.detail?.value !== undefined ? e.detail.value : (parentEl.querySelector('input[type="hidden"]')?.value || '');
          handleParentChange(val);
        });
      }
    }

    syncDisplay() {
      const found = this.options.find(o => String(o.value) === String(this.value));
      this.selectedItem = found || null;

      if (this.display) {
        if (found) {
          if (this.config.valueTemplate && typeof window[this.config.valueTemplate] === 'function') {
            this.display.innerHTML = window[this.config.valueTemplate](found);
          } else if (found.icon) {
            this.display.innerHTML = `<span class="inline-flex items-center gap-1.5"><span class="shrink-0">${found.icon}</span><span>${escapeHtml(found.text)}</span></span>`;
          } else {
            this.display.textContent = found.text;
          }
        } else {
          this.display.textContent = this.value ? this.value : (this.config.placeholder || 'Seçiniz...');
        }
      }

      if (this.clearBtn) {
        this.clearBtn.style.display = (this.value && this.config.clearable !== false && !this.config.disabled) ? 'inline-block' : 'none';
      }
    }

    bindEvents() {
      // Toggle on click
      this.control.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.config.disabled || this.config.readonly) return;
        if (this.isOpen) this.close();
        else this.open();
      });

      // Clear button
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setValue('');
        });
      }

      // Keyboard navigation on control
      this.control.addEventListener('keydown', (e) => {
        if (this.config.disabled || this.config.readonly) return;

        if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          if (!this.isOpen) {
            this.open();
          } else {
            this.moveHighlight(1);
          }
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
          e.preventDefault();
          if (!this.isOpen) {
            this.open();
          } else {
            this.moveHighlight(-1);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.isOpen && this.highlightedIndex >= 0) {
            const items = this.itemsContainer ? this.itemsContainer.querySelectorAll('.panoptes-select-item:not(.is-disabled)') : [];
            if (items[this.highlightedIndex]) {
              const val = items[this.highlightedIndex].getAttribute('data-value');
              this.setValue(val);
              this.close();
            }
          } else {
            this.toggle();
          }
        } else if (e.key === 'Escape') {
          if (this.isOpen) {
            e.preventDefault();
            this.close();
          }
        }
      });
    }

    moveHighlight(delta) {
      if (!this.itemsContainer) return;
      const items = Array.from(this.itemsContainer.querySelectorAll('.panoptes-select-item:not(.is-disabled)'));
      if (items.length === 0) return;

      this.highlightedIndex += delta;
      if (this.highlightedIndex >= items.length) this.highlightedIndex = 0;
      if (this.highlightedIndex < 0) this.highlightedIndex = items.length - 1;

      items.forEach((it, idx) => {
        if (idx === this.highlightedIndex) {
          it.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
        }
      });
    }

    open() {
      if (this.isOpen || this.config.disabled || this.config.readonly) return;
      this.isOpen = true;
      this.highlightedIndex = -1;

      if (this.arrowIcon) {
        this.arrowIcon.classList.add('rotate-180');
      }

      this.renderDropdown();

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.dropdown || !this.dropdown.contains(e.target))) {
          this.close();
          document.removeEventListener('mousedown', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', onDocClick), 50);
    }

    close() {
      if (!this.isOpen) return;
      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }
      if (this.dropdown) {
        this.dropdown.remove();
        this.dropdown = null;
        this.itemsContainer = null;
        this.searchInput = null;
      }
      if (this.arrowIcon) {
        this.arrowIcon.classList.remove('rotate-180');
      }
      this.isOpen = false;

      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    renderDropdown() {
      if (this.dropdown) this.dropdown.remove();

      this.dropdown = document.createElement('div');
      // No sliding animations! Pure clean fixed positioning directly under the input!
      this.dropdown.className = 'panoptes-select-dropdown fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 text-sm text-slate-800 select-none';

      // 1. Header Template
      let headerHtml = '';
      if (this.config.headerTemplate) {
        if (typeof window[this.config.headerTemplate] === 'function') {
          headerHtml = window[this.config.headerTemplate]();
        } else {
          headerHtml = `<div class="panoptes-select-header px-2.5 py-1.5 text-xs font-bold text-slate-700 border-b border-slate-100 mb-1 bg-slate-50 rounded-t-lg">${this.config.headerTemplate}</div>`;
        }
      }

      // 2. Search / Filter Input
      let searchHtml = '';
      if (this.config.searchable !== false) {
        searchHtml = `
          <div class="p-1 border-b border-slate-100 mb-1">
            <div class="relative flex items-center">
              <input type="text" 
                     class="panoptes-select-search w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 transition" 
                     placeholder="Listede ara..." 
                     autocomplete="off" />
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        `;
      }

      // 3. Footer Template
      let footerHtml = '';
      if (this.config.footerTemplate) {
        if (typeof window[this.config.footerTemplate] === 'function') {
          footerHtml = window[this.config.footerTemplate]({ total: this.options.length });
        } else {
          footerHtml = `<div class="panoptes-select-footer px-2.5 py-1.5 text-[11px] text-slate-500 border-t border-slate-100 mt-1 bg-slate-50 rounded-b-lg flex justify-between items-center">${this.config.footerTemplate}</div>`;
        }
      }

      this.dropdown.innerHTML = `
        ${headerHtml}
        ${searchHtml}
        <div class="panoptes-select-items max-h-56 overflow-y-auto space-y-0.5 overscroll-contain"></div>
        ${footerHtml}
      `;

      // Mount directly using openFloatingPopover with no transition / no sliding
      this.cleanupFloating = openFloatingPopover(this.wrapper, this.dropdown, { matchWidth: true });
      this.itemsContainer = this.dropdown.querySelector('.panoptes-select-items');
      this.searchInput = this.dropdown.querySelector('.panoptes-select-search');

      this.updateItems('');

      if (this.searchInput) {
        this.searchInput.addEventListener('click', (e) => e.stopPropagation());
        this.searchInput.addEventListener('input', (e) => {
          e.stopPropagation();
          const query = this.searchInput.value;
          if (this.config.serverFiltering && this.config.url) {
            clearTimeout(this.searchDebounce);
            const minLen = this.config.minFilterLength || 0;
            if (query.length < minLen) {
              if (this.itemsContainer) {
                this.itemsContainer.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 font-medium">Aramak için en az ${minLen} karakter yazınız</div>`;
              }
              return;
            }
            if (this.itemsContainer) {
              this.itemsContainer.innerHTML = `
                <div class="p-3 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                  <svg class="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  <span>Sunucudan aranıyor...</span>
                </div>
              `;
            }
            this.searchDebounce = setTimeout(async () => {
              const separator = this.config.url.includes('?') ? '&' : '?';
              const searchUrl = `${this.config.url}${separator}filter=${encodeURIComponent(query)}&quickSearch=${encodeURIComponent(query)}`;
              await this.loadRemoteData(searchUrl);
              this.updateItems('');
            }, 300);
          } else {
            this.updateItems(query);
          }
        });
        this.searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'Down') {
            e.preventDefault();
            this.moveHighlight(1);
          } else if (e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            this.moveHighlight(-1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const items = this.itemsContainer ? this.itemsContainer.querySelectorAll('.panoptes-select-item:not(.is-disabled)') : [];
            if (this.highlightedIndex >= 0 && items[this.highlightedIndex]) {
              const val = items[this.highlightedIndex].getAttribute('data-value');
              this.setValue(val);
              this.close();
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
          }
        });
        setTimeout(() => this.searchInput.focus(), 20);
      }
    }

    updateItems(filterText = '') {
      if (!this.itemsContainer) return;

      const q = (filterText || '').trim().toLowerCase();
      const filterMode = this.config.filter || 'contains';

      const filtered = this.options.filter(opt => {
        const text = String(opt.text || '').toLowerCase();
        if (!q) return true;
        if (filterMode === 'startswith') return text.startsWith(q);
        return text.includes(q);
      });

      if (filtered.length === 0) {
        if (this.config.noDataTemplate) {
          this.itemsContainer.innerHTML = typeof window[this.config.noDataTemplate] === 'function'
            ? window[this.config.noDataTemplate]()
            : `<div class="p-3 text-center text-xs text-slate-400 font-medium">${this.config.noDataTemplate}</div>`;
        } else {
          this.itemsContainer.innerHTML = '<div class="p-3 text-center text-xs text-slate-400 font-medium">Sonuç bulunamadı</div>';
        }
        return;
      }

      // Check if grouping is active
      const hasGroups = filtered.some(o => !!o.group);

      if (hasGroups) {
        const groups = {};
        filtered.forEach(item => {
          const gName = item.group || 'Diğer';
          if (!groups[gName]) groups[gName] = [];
          groups[gName].push(item);
        });

        let groupHtml = '';
        Object.keys(groups).forEach(gName => {
          groupHtml += `
            <div class="panoptes-select-group-header px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 backdrop-blur-xs rounded">
              ${escapeHtml(gName)}
            </div>
          `;
          groups[gName].forEach(opt => {
            groupHtml += this.renderSingleItem(opt);
          });
        });
        this.itemsContainer.innerHTML = groupHtml;
      } else {
        this.itemsContainer.innerHTML = filtered.map(opt => this.renderSingleItem(opt)).join('');
      }

      // Bind item click handlers
      this.itemsContainer.querySelectorAll('.panoptes-select-item:not(.is-disabled)').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
        });
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = item.getAttribute('data-value');
          this.setValue(val);
          this.close();
        });
      });
    }

    renderSingleItem(opt) {
      const isSelected = String(opt.value).toLowerCase() === String(this.value).toLowerCase();
      const isDisabled = !!opt.disabled;

      // Custom item template support
      if (this.config.itemTemplate && typeof window[this.config.itemTemplate] === 'function') {
        const customContent = window[this.config.itemTemplate](opt, isSelected);
        return `
          <div class="panoptes-select-item flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'} ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none is-disabled' : ''}" data-value="${opt.value}">
            ${customContent}
            ${isSelected ? '<svg class="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>' : ''}
          </div>
        `;
      }

      let inner = `<span>${escapeHtml(opt.text)}</span>`;
      if (opt.icon || opt.desc) {
        inner = `
          <div class="flex items-center gap-2">
            ${opt.icon ? `<span class="shrink-0 text-slate-500">${opt.icon}</span>` : ''}
            <div>
              <div class="font-medium ${isSelected ? 'text-blue-700' : 'text-slate-800'}">${escapeHtml(opt.text)}</div>
              ${opt.desc ? `<div class="text-[11px] text-slate-400 font-normal leading-tight">${escapeHtml(opt.desc)}</div>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="panoptes-select-item flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'} ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none is-disabled' : ''}" data-value="${opt.value}">
          ${inner}
          ${isSelected ? '<svg class="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>' : ''}
        </div>
      `;
    }

    setValue(val) {
      this.value = val;
      if (this.hiddenInput) {
        this.hiddenInput.value = val;
        this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      this.syncDisplay();

      // Trigger custom and DOM change events
      const selectedItem = this.options.find(o => String(o.value) === String(val)) || null;
      const event = new CustomEvent('change', { detail: { value: val, item: selectedItem }, bubbles: true });
      this.wrapper.dispatchEvent(event);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](val, selectedItem);
      }
      if (this.config.onSelect && typeof window[this.config.onSelect] === 'function') {
        window[this.config.onSelect]({ value: val, item: selectedItem });
      }
    }

    // Panoptes Compatible JavaScript APIs
    getValue() {
      return this.value;
    }

    text() {
      const found = this.options.find(o => String(o.value) === String(this.value));
      return found ? found.text : '';
    }

    dataItem() {
      return this.selectedItem || this.options.find(o => String(o.value) === String(this.value)) || null;
    }

    enable(state = true) {
      this.config.disabled = !state;
      if (!state) {
        this.control.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60', 'pointer-events-none');
        if (this.clearBtn) this.clearBtn.style.display = 'none';
      } else {
        this.control.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60', 'pointer-events-none');
        if (this.clearBtn && this.value) this.clearBtn.style.display = 'inline-block';
      }
    }

    readonly(state = true) {
      this.config.readonly = state;
    }

    focus() {
      if (this.control) this.control.focus();
    }
  }

  // ==========================================
  // 4. MULTI-SELECT (Enterprise Feature Set)
  // ==========================================
  class MultiSelectInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-multiselect-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.control = this.wrapper.querySelector('.panoptes-multiselect-control');
      this.chipsContainer = this.wrapper.querySelector('.panoptes-multiselect-chips');
      this.input = this.wrapper.querySelector('.panoptes-multiselect-input');
      this.hiddenInput = this.wrapper.querySelector(`#${id}-values`);
      this.clearBtn = this.wrapper.querySelector('.panoptes-multiselect-clear');
      this.arrowIcon = this.wrapper.querySelector('.panoptes-multiselect-control svg:last-child');

      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';

      this.rawOptions = this.parseOptions();
      this.options = [...this.rawOptions];
      this.selectedValues = new Set();
      this.isOpen = false;
      this.dropdown = null;
      this.highlightedIndex = -1;

      this.init();
    }

    parseOptions() {
      if (!this.config.options) return [];
      let raw = this.config.options;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            raw = JSON.parse(trimmed);
          } catch (e) {
            raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (Array.isArray(raw)) {
        return raw.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              text: item[this.dataTextField] ?? item.text ?? item.title ?? item.name ?? String(item.value ?? ''),
              value: String(item[this.dataValueField] ?? item.value ?? item.id ?? item.text ?? ''),
              group: item.group || item.category || null,
              disabled: !!item.disabled,
              icon: item.icon || null,
              raw: item
            };
          }
          return {
            text: String(item),
            value: String(item),
            group: null,
            disabled: false,
            raw: item
          };
        });
      }
      return [];
    }

    async init() {
      // Remote data
      if (this.config.url) {
        await this.loadRemoteData(this.config.url);
      }

      // Initial values
      const initVals = this.config.values ? String(this.config.values).split(',').map(s => s.trim()).filter(Boolean) : [];
      initVals.forEach(v => this.selectedValues.add(v));

      this.renderChips();
      this.bindEvents();
    }

    async loadRemoteData(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.data || data.Data || (Array.isArray(data) ? data : []);
        this.rawOptions = items.map(item => ({
          text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.id ?? ''),
          value: String(item[this.dataValueField] ?? item.id ?? item.value ?? item.name ?? ''),
          group: item.group || item.category || null,
          disabled: !!item.disabled,
          icon: item.icon || null,
          raw: item
        }));
        this.options = [...this.rawOptions];
        this.renderChips();
      } catch (e) {
        console.error('[Panoptes MultiSelect] Remote data error:', e);
      }
    }

    bindEvents() {
      this.control.addEventListener('click', (e) => {
        if (e.target.closest('.panoptes-chip-remove')) return;
        if (this.config.disabled) return;
        this.input.focus();
        if (!this.isOpen) this.open();
      });

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearAll();
        });
      }

      this.input.addEventListener('focus', () => {
        if (!this.config.disabled && !this.isOpen) this.open();
      });

      this.input.addEventListener('input', () => {
        if (!this.isOpen) this.open();
        this.renderDropdownItems(this.input.value);
      });

      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !this.input.value && this.selectedValues.size > 0) {
          const lastVal = Array.from(this.selectedValues).pop();
          this.removeValue(lastVal);
        } else if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          if (!this.isOpen) this.open();
          else this.moveHighlight(1);
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
          e.preventDefault();
          if (this.isOpen) this.moveHighlight(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.isOpen && this.highlightedIndex >= 0) {
            const items = this.dropdown ? this.dropdown.querySelectorAll('.panoptes-multi-item:not(.is-disabled)') : [];
            if (items[this.highlightedIndex]) {
              const val = items[this.highlightedIndex].getAttribute('data-value');
              this.toggleValue(val);
            }
          }
        } else if (e.key === 'Escape') {
          if (this.isOpen) {
            e.preventDefault();
            this.close();
          }
        }
      });
    }

    moveHighlight(delta) {
      if (!this.dropdown) return;
      const items = Array.from(this.dropdown.querySelectorAll('.panoptes-multi-item:not(.is-disabled)'));
      if (items.length === 0) return;

      this.highlightedIndex += delta;
      if (this.highlightedIndex >= items.length) this.highlightedIndex = 0;
      if (this.highlightedIndex < 0) this.highlightedIndex = items.length - 1;

      items.forEach((it, idx) => {
        if (idx === this.highlightedIndex) {
          it.classList.add('bg-blue-50', 'text-blue-700');
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.classList.remove('bg-blue-50', 'text-blue-700');
        }
      });
    }

    open() {
      if (this.isOpen || this.config.disabled) return;
      this.isOpen = true;
      this.highlightedIndex = -1;

      if (this.arrowIcon) this.arrowIcon.classList.add('rotate-180');

      this.renderDropdown();

      if (this._onDocClick) {
        document.removeEventListener('mousedown', this._onDocClick);
      }

      this._onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.dropdown || !this.dropdown.contains(e.target))) {
          this.close();
        }
      };
      setTimeout(() => {
        if (this.isOpen) {
          document.addEventListener('mousedown', this._onDocClick);
        }
      }, 50);
    }

    close() {
      if (!this.isOpen) return;
      if (this._onDocClick) {
        document.removeEventListener('mousedown', this._onDocClick);
        this._onDocClick = null;
      }
      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }
      if (this.dropdown) {
        this.dropdown.remove();
        this.dropdown = null;
      }
      if (this.arrowIcon) this.arrowIcon.classList.remove('rotate-180');
      this.isOpen = false;
      if (this.input) this.input.value = '';
    }

    toggleValue(val) {
      val = String(val);
      if (this.selectedValues.has(val)) {
        this.selectedValues.delete(val);
      } else {
        if (this.config.maxSelected && this.selectedValues.size >= this.config.maxSelected) {
          alert(`En fazla ${this.config.maxSelected} adet seçim yapabilirsiniz.`);
          return;
        }
        this.selectedValues.add(val);
      }
      this.syncState();
      if (this.input) {
        this.input.value = '';
        this.input.focus();
      }
      this.renderDropdownItems('');
      if (this.dropdown && this.dropdown._updatePosition) {
        this.dropdown._updatePosition();
      }
    }

    removeValue(val) {
      val = String(val);
      this.selectedValues.delete(val);
      this.syncState();
      if (this.isOpen) {
        this.renderDropdownItems(this.input ? this.input.value : '');
        if (this.dropdown && this.dropdown._updatePosition) {
          this.dropdown._updatePosition();
        }
      }
    }

    clearAll() {
      this.selectedValues.clear();
      this.syncState();
      if (this.isOpen) {
        this.renderDropdownItems('');
        if (this.dropdown && this.dropdown._updatePosition) {
          this.dropdown._updatePosition();
        }
      }
    }

    syncState() {
      const arr = Array.from(this.selectedValues);
      this.hiddenInput.value = arr.join(',');
      this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

      this.renderChips();

      const event = new CustomEvent('change', { detail: { values: arr }, bubbles: true });
      this.wrapper.dispatchEvent(event);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](arr);
      }
    }

    renderChips() {
      this.chipsContainer.innerHTML = '';
      const count = this.selectedValues.size;

      if (this.clearBtn) {
        this.clearBtn.style.display = count > 0 && this.config.clearable !== false && !this.config.disabled ? 'inline-block' : 'none';
      }

      if (count === 0) {
        this.input.placeholder = this.config.placeholder || 'Birden fazla seçin...';
        return;
      }

      // Tag Mode: Single (Summary mode, e.g. "3 öğe seçildi")
      if (this.config.tagMode === 'single') {
        this.input.placeholder = '';
        const summaryBadge = document.createElement('span');
        summaryBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200';
        summaryBadge.innerHTML = `<span>${count} öğe seçildi</span>`;
        this.chipsContainer.appendChild(summaryBadge);
        return;
      }

      // Tag Mode: Multiple (individual chips)
      this.input.placeholder = '';
      this.selectedValues.forEach(val => {
        const opt = this.options.find(o => String(o.value) === String(val));
        const text = opt ? opt.text : val;

        const chip = document.createElement('span');
        chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs animate-in fade-in zoom-in-95 duration-75';
        chip.innerHTML = `
          <span class="truncate max-w-[120px]">${escapeHtml(text)}</span>
          ${!this.config.disabled ? `
            <button type="button" class="panoptes-chip-remove text-slate-400 hover:text-rose-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-200 transition">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ` : ''}
        `;

        const removeBtn = chip.querySelector('.panoptes-chip-remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeValue(val);
          });
        }

        this.chipsContainer.appendChild(chip);
      });
    }

    renderDropdown() {
      if (this.dropdown) this.dropdown.remove();

      this.dropdown = document.createElement('div');
      // No sliding animation! Pure fixed position directly under input
      this.dropdown.className = 'panoptes-multiselect-dropdown fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 text-sm text-slate-800 select-none';

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.dropdown, { matchWidth: true });
      this.renderDropdownItems('');
    }

    renderDropdownItems(filterText = '') {
      if (!this.dropdown) return;
      const q = (filterText || '').trim().toLowerCase();

      const filtered = this.options.filter(opt => {
        const txt = String(opt.text || '').toLowerCase();
        return txt.includes(q);
      });

      if (filtered.length === 0) {
        this.dropdown.innerHTML = '<div class="p-3 text-center text-xs text-slate-400 font-medium">Sonuç bulunamadı</div>';
        return;
      }

      const hasGroups = filtered.some(o => !!o.group);

      if (hasGroups) {
        const groups = {};
        filtered.forEach(item => {
          const gName = item.group || 'Diğer';
          if (!groups[gName]) groups[gName] = [];
          groups[gName].push(item);
        });

        let groupHtml = '<div class="max-h-56 overflow-y-auto space-y-0.5 overscroll-contain">';
        Object.keys(groups).forEach(gName => {
          groupHtml += `
            <div class="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 backdrop-blur-xs rounded">
              ${escapeHtml(gName)}
            </div>
          `;
          groups[gName].forEach(opt => {
            groupHtml += this.renderItemHtml(opt);
          });
        });
        groupHtml += '</div>';
        this.dropdown.innerHTML = groupHtml;
      } else {
        this.dropdown.innerHTML = `
          <div class="max-h-56 overflow-y-auto space-y-0.5 overscroll-contain">
            ${filtered.map(opt => this.renderItemHtml(opt)).join('')}
          </div>
        `;
      }

      this.dropdown.querySelectorAll('.panoptes-multi-item:not(.is-disabled)').forEach(item => {
        // Prevent mousedown from stealing input focus or causing browser to drop click event
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
        });

        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = item.getAttribute('data-value');
          this.toggleValue(val);
        });
      });
    }

    renderItemHtml(opt) {
      const isSelected = this.selectedValues.has(String(opt.value));
      const isDisabled = !!opt.disabled;

      return `
        <div class="panoptes-multi-item flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'} ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none is-disabled' : ''}" data-value="${opt.value}">
          <div class="flex items-center gap-2 pointer-events-none">
            <span class="w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}">
              ${isSelected ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>' : ''}
            </span>
            <span class="select-none">${escapeHtml(opt.text)}</span>
          </div>
        </div>
      `;
    }

    // API
    getValue() {
      return Array.from(this.selectedValues);
    }

    value(arr) {
      if (arr !== undefined) {
        this.selectedValues.clear();
        if (Array.isArray(arr)) arr.forEach(v => this.selectedValues.add(String(v)));
        else if (typeof arr === 'string') arr.split(',').forEach(v => this.selectedValues.add(v.trim()));
        this.syncState();
      }
      return this.getValue();
    }

    enable(state = true) {
      this.config.disabled = !state;
      if (this.input) this.input.disabled = !state;
      this.renderChips();
    }
  }

  class NumericTextBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-numeric-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.displayInput = this.wrapper.querySelector(`#${id}-display`) || 
                          this.wrapper.querySelector(`#${id}-input`) || 
                          this.wrapper.querySelector('input:not([type="hidden"])') || 
                          this.wrapper.querySelector('input');
      this.hiddenInput = this.wrapper.querySelector(`#${id}-value`) || 
                         this.wrapper.querySelector('input[type="hidden"]') || 
                         this.displayInput;
      this.spinUp = this.wrapper.querySelector('[data-action="spin-up"]');
      this.spinDown = this.wrapper.querySelector('[data-action="spin-down"]');

      this.value = this.config.value != null ? Number(this.config.value) : (this.hiddenInput && this.hiddenInput.value !== '' ? Number(this.hiddenInput.value) : null);
      this.step = Number(this.config.step) || 1;
      this.min = this.config.min != null ? Number(this.config.min) : null;
      this.max = this.config.max != null ? Number(this.config.max) : null;
      this.decimals = this.config.decimals != null ? Number(this.config.decimals) : 2;

      this.updateDisplay();
      this.bindEvents();
    }

    formatVal(n) {
      if (n == null || isNaN(n)) return '';
      if (this.config.format === 'currency') {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
      } else if (this.config.format === 'percent') {
        return `%${n.toFixed(this.decimals)}`;
      }
      return n.toLocaleString('tr-TR', { minimumFractionDigits: this.decimals, maximumFractionDigits: this.decimals });
    }

    updateDisplay() {
      if (this.displayInput) {
        if (this.displayInput.type === 'number') {
          this.displayInput.value = this.value != null ? this.value : '';
        } else {
          this.displayInput.value = this.formatVal(this.value);
        }
      }
      if (this.hiddenInput && this.hiddenInput !== this.displayInput) {
        this.hiddenInput.value = this.value != null ? this.value : '';
      }
    }

    bindEvents() {
      if (this.spinUp) {
        this.spinUp.addEventListener('click', (e) => {
          e.stopPropagation();
          this.stepBy(this.step);
        });
      }

      if (this.spinDown) {
        this.spinDown.addEventListener('click', (e) => {
          e.stopPropagation();
          this.stepBy(-this.step);
        });
      }

      if (this.displayInput) {
        this.displayInput.addEventListener('focus', () => {
          if (this.value != null && this.displayInput.type !== 'number') {
            this.displayInput.value = this.value;
            this.displayInput.select();
          }
        });

        this.displayInput.addEventListener('blur', () => {
          let raw = this.displayInput.value.replace(/[^0-9.-]/g, '');
          let parsed = parseFloat(raw);
          if (!isNaN(parsed)) {
            this.setValue(parsed);
          } else {
            this.updateDisplay();
          }
        });

        this.displayInput.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.stepBy(this.step);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.stepBy(-this.step);
          }
        });
      }
    }

    stepBy(amount) {
      let cur = this.value != null ? this.value : 0;
      let next = cur + amount;
      this.setValue(next);
    }

    setValue(val) {
      if (this.min != null && val < this.min) val = this.min;
      if (this.max != null && val > this.max) val = this.max;
      this.value = Math.round(val * Math.pow(10, this.decimals)) / Math.pow(10, this.decimals);
      this.updateDisplay();

      if (this.hiddenInput) {
        this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (this.displayInput) {
        this.displayInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const event = new CustomEvent('change', { detail: { value: this.value } });
      this.wrapper.dispatchEvent(event);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](this.value);
      }
    }

    getValue() {
      return this.value;
    }
  }


  // ==========================================
  // 6. SWITCH (TOGGLE)
  // ==========================================
  class SwitchInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-switch-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.track = this.wrapper.querySelector('.panoptes-switch-track');
      this.thumb = this.wrapper.querySelector('.panoptes-switch-thumb');
      this.label = this.wrapper.querySelector('.panoptes-switch-label');
      this.hiddenInput = this.wrapper.querySelector(`#${id}-value`);

      this.isChecked = this.config.isChecked === true || this.hiddenInput.value === 'true';
      this.bindEvents();
    }

    bindEvents() {
      this.wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.config.disabled) return;
        this.toggle();
      });
    }

    toggle() {
      this.setValue(!this.isChecked);
    }

    setValue(val) {
      this.isChecked = !!val;
      this.hiddenInput.value = this.isChecked ? 'true' : 'false';

      if (this.isChecked) {
        this.track.classList.remove('bg-slate-300');
        this.track.classList.add('bg-blue-600');
        this.thumb.classList.remove('translate-x-0');
        this.thumb.classList.add('translate-x-5');
        if (this.label) this.label.textContent = this.config.onLabel || 'Açık';
      } else {
        this.track.classList.remove('bg-blue-600');
        this.track.classList.add('bg-slate-300');
        this.thumb.classList.remove('translate-x-5');
        this.thumb.classList.add('translate-x-0');
        if (this.label) this.label.textContent = this.config.offLabel || 'Kapalı';
      }

      const event = new CustomEvent('change', { detail: { checked: this.isChecked, value: this.isChecked } });
      this.wrapper.dispatchEvent(event);
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](this.isChecked);
      }
    }

    getValue() {
      return this.isChecked;
    }

    setValue(val) {
      this.isChecked = !!val;
      if (this.hiddenInput) this.hiddenInput.value = this.isChecked ? 'true' : 'false';
      if (this.isChecked) {
        if (this.track) {
          this.track.classList.remove('bg-slate-300');
          this.track.classList.add('bg-blue-600');
        }
        if (this.thumb) {
          this.thumb.classList.remove('translate-x-0');
          this.thumb.classList.add('translate-x-5');
        }
        if (this.label) this.label.textContent = this.config.onLabel || 'Açık';
      } else {
        if (this.track) {
          this.track.classList.remove('bg-blue-600');
          this.track.classList.add('bg-slate-300');
        }
        if (this.thumb) {
          this.thumb.classList.remove('translate-x-5');
          this.thumb.classList.add('translate-x-0');
        }
        if (this.label) this.label.textContent = this.config.offLabel || 'Kapalı';
      }
    }
  }

  // ==========================================
  // 7. TEXTBOX
  // ==========================================
  class TextBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-textbox-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.clearBtn = this.wrapper.querySelector('[data-action="clear-text"]');

      this.bindEvents();
    }

    bindEvents() {
      if (this.clearBtn) {
        this.input.addEventListener('input', () => {
          this.clearBtn.style.display = this.input.value ? 'inline-block' : 'none';
        });

        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.input.value = '';
          this.clearBtn.style.display = 'none';
          this.input.focus();
          const event = new Event('change', { bubbles: true });
          this.input.dispatchEvent(event);
        });
      }
    }

    setValue(val) {
      if (this.input) {
        this.input.value = val || '';
      }
      if (this.clearBtn) {
        this.clearBtn.style.display = val ? 'inline-block' : 'none';
      }
    }

    getValue() {
      return this.input ? this.input.value : '';
    }
  }

  // ==========================================
  // 8. COMBOBOX
  // ==========================================
  class ComboBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-combobox-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-combobox"]');
      this.clearBtn = this.wrapper.querySelector('[data-action="clear-combobox"]') || this.wrapper.querySelector('.panoptes-combobox-clear');
      
      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';

      this.rawOptions = this.parseOptions();
      this.options = [...this.rawOptions];
      this.isOpen = false;
      this.dropdown = null;
      this.highlightedIndex = -1;

      if (this.config.url) {
        this.loadRemoteData(this.config.url);
      }

      if (this.config.cascadeFrom) {
        this.initCascading();
      }

      this.bindEvents();
    }

    parseOptions() {
      if (!this.config.options) return [];
      let raw = this.config.options;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            raw = JSON.parse(trimmed);
          } catch (e) {
            raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (Array.isArray(raw)) {
        return raw.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              text: item[this.dataTextField] ?? item.text ?? item.title ?? item.name ?? String(item.value ?? ''),
              value: String(item[this.dataValueField] ?? item.value ?? item.id ?? item.text ?? ''),
              group: item.group || item.category || null,
              disabled: !!item.disabled,
              icon: item.icon || null,
              badge: item.badge || null,
              desc: item.desc || item.description || item.subtitle || null,
              raw: item
            };
          }
          return {
            text: String(item),
            value: String(item),
            group: null,
            disabled: false,
            icon: null,
            badge: null,
            desc: null,
            raw: item
          };
        });
      }
      return [];
    }

    async loadRemoteData(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.data || data.Data || (Array.isArray(data) ? data : []);
        this.rawOptions = items.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.id ?? ''),
              value: String(item[this.dataValueField] ?? item.id ?? item.value ?? item.name ?? ''),
              group: item.group || item.category || null,
              disabled: !!item.disabled,
              icon: item.icon || null,
              badge: item.badge || null,
              desc: item.desc || item.description || item.subtitle || null,
              raw: item
            };
          }
          return {
            text: String(item),
            value: String(item),
            group: null,
            disabled: false,
            icon: null,
            badge: null,
            desc: null,
            raw: item
          };
        });
        this.options = [...this.rawOptions];
      } catch (err) {
        console.error('Panoptes ComboBox remote data error:', err);
      }
    }

    initCascading() {
      const parentCb = window.Panoptes?.ComboBox?.instances?.get(this.config.cascadeFrom);
      const parentSelect = window.Panoptes?.Select?.instances?.get(this.config.cascadeFrom);
      const parentEl = document.getElementById(this.config.cascadeFrom);

      const handleParentChange = (parentVal) => {
        if (!parentVal) {
          this.options = [];
          this.setValue('');
          this.enable(false);
          return;
        }

        const filterField = this.config.cascadeFromField || 'parentId';
        this.options = this.rawOptions.filter(opt => {
          const raw = opt.raw || {};
          const matched = String(raw[filterField] || opt.group || '') === String(parentVal);
          return matched;
        });

        this.setValue('');
        this.enable(this.options.length > 0);
      };

      if (parentCb) {
        const val = parentCb.getValue();
        if (!val) this.enable(false);
        else handleParentChange(val);
      } else if (parentSelect) {
        const val = parentSelect.getValue();
        if (!val) this.enable(false);
        else handleParentChange(val);
      } else if (parentEl) {
        this.enable(false);
      }

      if (parentEl) {
        parentEl.addEventListener('change', (e) => {
          const val = e.detail?.value !== undefined ? e.detail.value : (e.target.value || '');
          handleParentChange(val);
        });
      }
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setValue('');
          this.input.focus();
        });
      }

      if (this.input) {
        this.input.addEventListener('input', () => {
          const val = this.input.value;
          this.updateClearBtn(val);
          
          if (this.config.serverFiltering && this.config.url) {
            clearTimeout(this.searchDebounce);
            const minLen = this.config.minFilterLength || 0;
            if (val.length < minLen) {
              return;
            }
            this.searchDebounce = setTimeout(async () => {
              try {
                const sep = this.config.url.includes('?') ? '&' : '?';
                const res = await fetch(`${this.config.url}${sep}filter=${encodeURIComponent(val)}`);
                const data = await res.json();
                const items = data.data || data.Data || (Array.isArray(data) ? data : []);
                this.options = items.map(item => ({
                  text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.id ?? ''),
                  value: String(item[this.dataValueField] ?? item.id ?? item.value ?? item.name ?? ''),
                  group: item.group || item.category || null,
                  disabled: !!item.disabled,
                  icon: item.icon || null,
                  badge: item.badge || null,
                  desc: item.desc || item.description || null,
                  raw: item
                }));
                if (!this.isOpen) this.open();
                else this.renderDropdownItems(val);
              } catch (e) {
                console.error(e);
              }
            }, 250);
          } else {
            if (!this.isOpen) this.open();
            else this.renderDropdownItems(val);
          }
        });

        this.input.addEventListener('keydown', (e) => {
          if (!this.isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              this.open();
            }
            return;
          }

          const items = this.dropdown ? this.dropdown.querySelectorAll('.panoptes-combobox-item:not(.is-disabled)') : [];
          if (!items.length) {
            if (e.key === 'Escape') this.close();
            return;
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.highlightedIndex = (this.highlightedIndex + 1) % items.length;
            this.updateHighlight(items);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.highlightedIndex = (this.highlightedIndex - 1 + items.length) % items.length;
            this.updateHighlight(items);
          } else if (e.key === 'Enter') {
            if (this.highlightedIndex >= 0 && this.highlightedIndex < items.length) {
              e.preventDefault();
              items[this.highlightedIndex].click();
            } else {
              this.close();
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
          }
        });

        this.input.addEventListener('focus', () => {
          if (!this.isOpen && this.options.length > 0 && !this.config.disabled && !this.config.readonly) {
            this.open();
          }
        });
      }
    }

    updateHighlight(items) {
      items.forEach((it, idx) => {
        if (idx === this.highlightedIndex) {
          it.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
        }
      });
    }

    updateClearBtn(val) {
      if (!this.clearBtn) return;
      if (val && !this.config.disabled && !this.config.readonly) {
        this.clearBtn.style.display = '';
      } else {
        this.clearBtn.style.display = 'none';
      }
    }

    open() {
      if (this.isOpen || this.config.disabled || this.config.readonly) return;
      this.isOpen = true;
      this.highlightedIndex = -1;

      this.renderDropdown();

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.dropdown || !this.dropdown.contains(e.target))) {
          this.close();
          document.removeEventListener('mousedown', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', onDocClick), 50);
    }

    close() {
      if (!this.isOpen) return;
      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }
      if (this.dropdown) {
        this.dropdown.remove();
        this.dropdown = null;
      }
      this.isOpen = false;

      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    renderDropdown() {
      if (this.dropdown) this.dropdown.remove();

      this.dropdown = document.createElement('div');
      this.dropdown.className = 'panoptes-combobox-dropdown fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 text-sm text-slate-800 select-none';

      let headerHtml = '';
      if (this.config.headerTemplate) {
        if (typeof window[this.config.headerTemplate] === 'function') {
          headerHtml = window[this.config.headerTemplate]();
        } else {
          headerHtml = `<div class="panoptes-cb-header px-2.5 py-1.5 text-xs font-bold text-slate-700 border-b border-slate-100 mb-1 bg-slate-50 rounded-t-lg">${this.config.headerTemplate}</div>`;
        }
      }

      let footerHtml = '';
      if (this.config.footerTemplate) {
        if (typeof window[this.config.footerTemplate] === 'function') {
          footerHtml = window[this.config.footerTemplate]({ total: this.options.length });
        } else {
          footerHtml = `<div class="panoptes-cb-footer px-2.5 py-1.5 text-[11px] text-slate-500 border-t border-slate-100 mt-1 bg-slate-50 rounded-b-lg flex justify-between items-center">${this.config.footerTemplate}</div>`;
        }
      }

      this.dropdown.innerHTML = `
        ${headerHtml}
        <div class="panoptes-combobox-items max-h-56 overflow-y-auto space-y-0.5 overscroll-contain"></div>
        ${footerHtml}
      `;

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.dropdown, { matchWidth: true });
      this.renderDropdownItems(this.input ? this.input.value : '');
    }

    renderDropdownItems(filterText = '') {
      if (!this.dropdown) return;
      const container = this.dropdown.querySelector('.panoptes-combobox-items');
      if (!container) return;

      const q = (filterText || '').toLowerCase().trim();
      const filterMode = this.config.filter || 'contains';

      const filtered = this.options.filter(opt => {
        if (!q) return true;
        const txt = (opt.text || '').toLowerCase();
        if (filterMode === 'startswith') return txt.startsWith(q);
        return txt.includes(q);
      });

      if (filtered.length === 0) {
        let noDataMsg = 'Öneri bulunamadı (serbest metin geçerli)';
        if (this.config.noDataTemplate) {
          noDataMsg = typeof window[this.config.noDataTemplate] === 'function' 
            ? window[this.config.noDataTemplate]() 
            : this.config.noDataTemplate;
        }
        container.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 font-medium">${noDataMsg}</div>`;
        this.highlightedIndex = -1;
        return;
      }

      let html = '';
      let currentGroup = null;

      filtered.forEach((opt, idx) => {
        if (this.config.groupBy && opt.group && opt.group !== currentGroup) {
          currentGroup = opt.group;
          html += `<div class="panoptes-cb-group-header px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 backdrop-blur-xs rounded">${escapeHtml(currentGroup)}</div>`;
        }

        let itemContent = '';
        if (this.config.itemTemplate && typeof window[this.config.itemTemplate] === 'function') {
          itemContent = window[this.config.itemTemplate](opt);
        } else {
          const iconHtml = opt.icon ? `<span class="shrink-0 text-base">${opt.icon}</span>` : '';
          const badgeHtml = opt.badge ? `<span class="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">${escapeHtml(opt.badge)}</span>` : '';
          const descHtml = opt.desc ? `<div class="text-[11px] text-slate-400 font-normal leading-tight">${escapeHtml(opt.desc)}</div>` : '';
          
          let displayTxt = escapeHtml(opt.text);
          if (q) {
            displayTxt = displayTxt.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-yellow-200 text-slate-900 rounded-xs px-0.5 font-bold">$1</mark>');
          }

          itemContent = `
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              ${iconHtml}
              <div class="flex-1 min-w-0">
                <div class="truncate font-medium">${displayTxt}</div>
                ${descHtml}
              </div>
              ${badgeHtml}
            </div>
          `;
        }

        const disabledCls = opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none is-disabled' : '';

        html += `
          <div class="panoptes-combobox-item flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs text-slate-700 hover:bg-slate-50 transition group ${disabledCls}" 
               data-idx="${idx}"
               data-value="${escapeHtml(opt.value)}" 
               data-text="${escapeHtml(opt.text)}">
            ${itemContent}
          </div>
        `;
      });

      container.innerHTML = html;
      this.highlightedIndex = -1;

      container.querySelectorAll('.panoptes-combobox-item:not(.is-disabled)').forEach(el => {
        el.addEventListener('mousedown', (e) => e.preventDefault());
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = el.getAttribute('data-value');
          const txt = el.getAttribute('data-text');
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          const selected = filtered[idx];

          this.setValue(txt || val);
          this.close();

          if (this.config.onSelect && typeof window[this.config.onSelect] === 'function') {
            window[this.config.onSelect]({ dataItem: selected, sender: this });
          }
        });
      });
    }

    value(val) {
      if (val === undefined) return this.getValue();
      this.setValue(val);
      return this;
    }

    text(txt) {
      if (txt === undefined) return this.getValue();
      this.setValue(txt);
      return this;
    }

    getValue() {
      return this.input ? this.input.value : '';
    }

    setValue(val) {
      if (!this.input) return;
      this.input.value = val || '';
      this.updateClearBtn(val);

      const event = new CustomEvent('change', { detail: { value: val }, bubbles: true });
      this.input.dispatchEvent(event);
      this.wrapper.dispatchEvent(event);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange]({ value: val, sender: this });
      }
    }

    enable(enabled = true) {
      this.config.disabled = !enabled;
      if (this.input) {
        this.input.disabled = !enabled;
        if (!enabled) {
          this.input.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        } else {
          this.input.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        }
      }
      if (this.toggleBtn) {
        this.toggleBtn.disabled = !enabled;
      }
      this.updateClearBtn(this.getValue());
    }

    setDataSource(items) {
      this.config.options = items;
      this.rawOptions = this.parseOptions();
      this.options = [...this.rawOptions];
      if (this.isOpen) {
        this.renderDropdownItems(this.input ? this.input.value : '');
      }
    }
  }

  // ==========================================
  // MULTICOLUMN COMBOBOX (Enterprise Feature Set)
  // ==========================================
  class MultiColumnComboBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;
      if (this.wrapper.dataset.panoptesInitialized === 'true') return;
      this.wrapper.dataset.panoptesInitialized = 'true';

      const script = this.wrapper.querySelector(`script[data-panoptes-mccb-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.hiddenInput = this.wrapper.querySelector(`#${id}-value`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-mccb"]');
      this.clearBtn = this.wrapper.querySelector('[data-action="clear-mccb"]');

      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';
      this.columns = this.parseColumns();
      this.filterFields = this.parseFilterFields();
      this.filterMode = this.config.filter || 'contains';

      this.rawOptions = this.parseOptions();
      this.filteredOptions = [...this.rawOptions];
      this.selectedItem = null;
      this.highlightedIndex = -1;
      this.isOpen = false;
      this.popover = null;
      this.cleanupFloating = null;
      this.onDocClick = null;

      // Find initial selection from value or text
      if (this.config.value) {
        this.selectByValue(this.config.value, false);
      } else if (this.config.text) {
        if (this.input) this.input.value = this.config.text;
      }

      if (this.config.url) {
        this.loadRemoteData(this.config.url);
      }

      this.bindEvents();
    }

    parseColumns() {
      let cols = this.config.columns;
      if (typeof cols === 'string') {
        try { cols = JSON.parse(cols); } catch { cols = []; }
      }
      if (Array.isArray(cols) && cols.length > 0) {
        return cols.map(c => ({
          field: c.field || c.Field,
          title: c.title || c.Title || c.field || c.Field,
          width: c.width || c.Width || null,
          template: c.template || c.Template || null,
          align: c.align || c.Align || 'left',
          headerClass: c.headerClass || c.HeaderClass || '',
          class: c.class || c.Class || '',
          format: c.format || c.Format || null
        }));
      }
      return [
        { field: this.dataTextField, title: 'Başlık', width: 'auto', align: 'left' }
      ];
    }

    parseFilterFields() {
      const ff = this.config.filterFields;
      if (!ff) return null;
      if (Array.isArray(ff)) return ff;
      if (typeof ff === 'string') {
        if (ff.startsWith('[') && ff.endsWith(']')) {
          try { return JSON.parse(ff); } catch {}
        }
        return ff.split(',').map(s => s.trim()).filter(Boolean);
      }
      return null;
    }

    parseOptions() {
      if (!this.config.options) return [];
      let raw = this.config.options;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            raw = JSON.parse(trimmed);
          } catch (e) {
            raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (Array.isArray(raw)) {
        return raw.map(item => {
          if (typeof item === 'object' && item !== null) {
            return item;
          }
          return {
            [this.dataTextField]: String(item),
            [this.dataValueField]: String(item)
          };
        });
      }
      return [];
    }

    async loadRemoteData(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.data || data.Data || (Array.isArray(data) ? data : []);
        this.rawOptions = items;
        this.filteredOptions = [...this.rawOptions];
        if (this.config.value) this.selectByValue(this.config.value, false);
      } catch (err) {
        console.error(`Panoptes MultiColumnComboBox [${this.id}] Remote Load Error:`, err);
      }
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      }

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clear();
        });
      }

      if (this.input) {
        this.input.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!this.isOpen) this.open();
        });

        this.input.addEventListener('input', () => {
          this.updateClearBtn();
          const query = this.input.value;
          if (this.config.minFilterLength && query.length < this.config.minFilterLength) {
            this.filteredOptions = [...this.rawOptions];
          } else {
            this.filterItems(query);
          }
          if (!this.isOpen) this.open();
          else this.renderTableRows();
        });

        this.input.addEventListener('keydown', (e) => {
          if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            this.open();
            return;
          }

          if (!this.isOpen) return;

          const rows = this.popover ? this.popover.querySelectorAll('.panoptes-mccb-row') : [];
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.highlightedIndex < rows.length - 1) {
              this.highlightedIndex++;
              this.updateRowHighlight(rows);
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.highlightedIndex > 0) {
              this.highlightedIndex--;
              this.updateRowHighlight(rows);
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
              this.selectItem(this.filteredOptions[this.highlightedIndex]);
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
          } else if (e.key === 'Tab') {
            if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
              this.selectItem(this.filteredOptions[this.highlightedIndex]);
            }
            this.close();
          }
        });
      }
    }

    filterItems(query) {
      if (!query || query.trim() === '') {
        this.filteredOptions = [...this.rawOptions];
        this.highlightedIndex = -1;
        return;
      }

      const q = query.toLowerCase().trim();
      const fieldsToSearch = this.filterFields || this.columns.map(c => c.field).filter(Boolean);

      this.filteredOptions = this.rawOptions.filter(item => {
        return fieldsToSearch.some(field => {
          const val = item[field];
          if (val === null || val === undefined) return false;
          const s = String(val).toLowerCase();
          return this.filterMode === 'startswith' ? s.startsWith(q) : s.includes(q);
        });
      });
      this.highlightedIndex = this.filteredOptions.length > 0 ? 0 : -1;
    }

    updateRowHighlight(rows) {
      rows.forEach((row, i) => {
        if (i === this.highlightedIndex) {
          row.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
          row.scrollIntoView({ block: 'nearest' });
        } else {
          row.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
        }
      });
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    open() {
      if (this.isOpen || this.config.disabled || this.config.readonlyMode) return;
      this.isOpen = true;

      if (this.toggleBtn) {
        const svg = this.toggleBtn.querySelector('svg');
        if (svg) svg.classList.add('rotate-180');
      }

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-mccb-popover fixed z-[999999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100';
      this.popover.style.width = this.config.dropdownWidth || '560px';
      this.popover.style.maxHeight = this.config.dropdownHeight || '340px';

      this.renderPopoverStructure();
      this.renderTableRows();

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover, { matchWidth: false });

      this.onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
        }
      };
      setTimeout(() => document.addEventListener('mousedown', this.onDocClick), 50);

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;

      if (this.toggleBtn) {
        const svg = this.toggleBtn.querySelector('svg');
        if (svg) svg.classList.remove('rotate-180');
      }

      if (this.onDocClick) {
        document.removeEventListener('mousedown', this.onDocClick);
        this.onDocClick = null;
      }

      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }

      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }

      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    renderPopoverStructure() {
      const headerHtml = this.config.headerTemplate ? `
        <div class="panoptes-mccb-header p-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-semibold">
          ${this.config.headerTemplate}
        </div>
      ` : '';

      const thsHtml = this.columns.map(col => {
        const wStyle = col.width ? `style="width:${col.width}; min-width:${col.width}; max-width:${col.width};"` : '';
        const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
        return `
          <th class="py-2.5 px-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] ${alignClass} ${col.headerClass || ''}" ${wStyle}>
            ${col.title}
          </th>
        `;
      }).join('');

      this.popover.innerHTML = `
        ${headerHtml}
        <div class="panoptes-mccb-scroll-container overflow-y-auto overflow-x-auto flex-1 divide-y divide-slate-100">
          <table class="w-full border-collapse text-left text-xs">
            <thead class="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-2xs">
              <tr>${thsHtml}</tr>
            </thead>
            <tbody class="panoptes-mccb-tbody divide-y divide-slate-100 bg-white">
            </tbody>
          </table>
          <div class="panoptes-mccb-nodata hidden p-8 text-center text-slate-400">
            ${this.config.noDataTemplate || `
              <svg class="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div class="font-medium text-xs text-slate-500">Kayıt Bulunamadı</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Arama kriterlerine uygun sonuç yok.</div>
            `}
          </div>
        </div>
        <div class="panoptes-mccb-footer px-3 py-1.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span class="panoptes-mccb-count font-medium"></span>
          <span class="text-[10px] text-slate-400 font-mono">Çok Sütunlu ComboBox</span>
        </div>
      `;
    }

    renderTableRows() {
      if (!this.popover) return;
      const tbody = this.popover.querySelector('.panoptes-mccb-tbody');
      const noDataEl = this.popover.querySelector('.panoptes-mccb-nodata');
      const countEl = this.popover.querySelector('.panoptes-mccb-count');
      if (!tbody) return;

      tbody.innerHTML = '';

      if (this.filteredOptions.length === 0) {
        noDataEl.classList.remove('hidden');
        if (countEl) countEl.textContent = '0 kayıt';
        return;
      }

      noDataEl.classList.add('hidden');
      if (countEl) {
        countEl.textContent = this.filteredOptions.length === this.rawOptions.length 
          ? `Toplam ${this.rawOptions.length} kayıt`
          : `${this.filteredOptions.length} / ${this.rawOptions.length} kayıt`;
      }

      const q = (this.input ? this.input.value : '').toLowerCase().trim();

      this.filteredOptions.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const isSelected = this.selectedItem && String(this.selectedItem[this.dataValueField]) === String(item[this.dataValueField]);
        const isHighlighted = idx === this.highlightedIndex;

        tr.className = `panoptes-mccb-row cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50/60 font-semibold' : ''} ${isHighlighted ? 'bg-blue-50 text-blue-700 font-medium' : ''}`;
        tr.setAttribute('data-index', idx);

        let tdsHtml = '';
        this.columns.forEach(col => {
          const wStyle = col.width ? `style="width:${col.width}; min-width:${col.width}; max-width:${col.width};"` : '';
          const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
          
          let cellContent = '';
          if (col.template) {
            if (typeof col.template === 'function') {
              cellContent = col.template(item);
            } else if (typeof window[col.template] === 'function') {
              cellContent = window[col.template](item);
            } else {
              let tpl = col.template;
              if (tpl.includes('&lt;') || tpl.includes('&gt;') || tpl.includes('&quot;') || tpl.includes('&#39;')) {
                const txt = document.createElement('textarea');
                txt.innerHTML = tpl;
                tpl = txt.value;
              }
              cellContent = tpl.replace(/#[=:]\s*([a-zA-Z0-9_]+)\s*#/g, (_, prop) => {
                return item[prop] ?? '';
              });
            }
          } else {
            const rawVal = item[col.field] ?? '';
            cellContent = String(rawVal);
            if (q && cellContent.toLowerCase().includes(q)) {
              const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
              cellContent = cellContent.replace(regex, '<mark class="bg-amber-100 text-slate-900 rounded-xs px-0.5 font-bold">$1</mark>');
            }
          }

          tdsHtml += `<td class="py-2.5 px-3 ${col.template ? '' : 'truncate'} ${alignClass} ${col.class || ''}" ${wStyle}>${cellContent}</td>`;
        });

        tr.innerHTML = tdsHtml;

        tr.addEventListener('mouseenter', () => {
          this.highlightedIndex = idx;
          const allRows = tbody.querySelectorAll('.panoptes-mccb-row');
          allRows.forEach((r, i) => {
            if (i === idx) r.classList.add('bg-blue-50', 'text-blue-700');
            else r.classList.remove('bg-blue-50', 'text-blue-700');
          });
        });

        tr.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectItem(item);
        });

        tbody.appendChild(tr);
      });
    }

    selectItem(item) {
      if (!item) return;
      this.selectedItem = item;
      const textVal = String(item[this.dataTextField] ?? '');
      const valueVal = String(item[this.dataValueField] ?? '');

      if (this.input) this.input.value = textVal;
      if (this.hiddenInput) this.hiddenInput.value = valueVal;
      this.updateClearBtn();

      const eventDetail = { value: valueVal, text: textVal, dataItem: item, sender: this };
      const changeEvt = new CustomEvent('change', { detail: eventDetail, bubbles: true });
      const selectEvt = new CustomEvent('select', { detail: eventDetail, bubbles: true });

      if (this.input) {
        this.input.dispatchEvent(changeEvt);
        this.input.dispatchEvent(selectEvt);
      }
      this.wrapper.dispatchEvent(changeEvt);
      this.wrapper.dispatchEvent(selectEvt);

      if (this.config.onSelect && typeof window[this.config.onSelect] === 'function') {
        window[this.config.onSelect](eventDetail);
      }
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](eventDetail);
      }

      this.close();
    }

    selectByValue(val, triggerEvents = true) {
      const found = this.rawOptions.find(it => String(it[this.dataValueField]) === String(val));
      if (found) {
        if (triggerEvents) this.selectItem(found);
        else {
          this.selectedItem = found;
          if (this.input) this.input.value = String(found[this.dataTextField] ?? '');
          if (this.hiddenInput) this.hiddenInput.value = String(found[this.dataValueField] ?? '');
          this.updateClearBtn();
        }
      } else {
        if (this.hiddenInput) this.hiddenInput.value = val || '';
        this.updateClearBtn();
      }
    }

    clear() {
      this.selectedItem = null;
      this.highlightedIndex = -1;
      if (this.input) this.input.value = '';
      if (this.hiddenInput) this.hiddenInput.value = '';
      this.filteredOptions = [...this.rawOptions];
      this.updateClearBtn();

      const eventDetail = { value: '', text: '', dataItem: null, sender: this };
      const changeEvt = new CustomEvent('change', { detail: eventDetail, bubbles: true });
      if (this.input) this.input.dispatchEvent(changeEvt);
      this.wrapper.dispatchEvent(changeEvt);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](eventDetail);
      }
      if (this.isOpen) this.renderTableRows();
    }

    updateClearBtn() {
      if (this.clearBtn) {
        const hasVal = this.input && this.input.value && this.input.value.trim().length > 0;
        if (hasVal && this.config.clearable !== false && !this.config.disabled && !this.config.readonlyMode) {
          this.clearBtn.classList.remove('hidden');
        } else {
          this.clearBtn.classList.add('hidden');
        }
      }
    }

    value(val) {
      if (val === undefined) {
        return this.hiddenInput ? this.hiddenInput.value : '';
      }
      this.selectByValue(val, true);
    }

    text(txt) {
      if (txt === undefined) {
        return this.input ? this.input.value : '';
      }
      if (this.input) this.input.value = txt;
      this.updateClearBtn();
    }

    dataItem() {
      return this.selectedItem;
    }

    setDataSource(items) {
      this.config.options = items;
      this.rawOptions = this.parseOptions();
      this.filteredOptions = [...this.rawOptions];
      if (this.isOpen) this.renderTableRows();
    }

    enable(enabled = true) {
      this.config.disabled = !enabled;
      if (this.input) {
        this.input.disabled = !enabled;
        if (!enabled) this.input.classList.add('bg-slate-100', 'cursor-not-allowed', 'text-slate-400');
        else this.input.classList.remove('bg-slate-100', 'cursor-not-allowed', 'text-slate-400');
      }
      if (this.toggleBtn) this.toggleBtn.disabled = !enabled;
      this.updateClearBtn();
    }

    readonly(state = true) {
      this.config.readonlyMode = state;
      if (this.input) {
        this.input.readOnly = state;
        if (state) this.input.classList.add('bg-slate-50', 'cursor-default');
        else this.input.classList.remove('bg-slate-50', 'cursor-default');
      }
      this.updateClearBtn();
    }

    focus() {
      if (this.input) this.input.focus();
    }
  }

  window.Panoptes.MultiColumnComboBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new MultiColumnComboBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  // ==========================================
  // DROPDOWNTREE (Enterprise Feature Set)
  // ==========================================
  class DropDownTreeInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;
      if (this.wrapper.dataset.panoptesInitialized === 'true') return;
      this.wrapper.dataset.panoptesInitialized = 'true';

      const script = this.wrapper.querySelector(`script[data-panoptes-ddt-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.trigger = this.wrapper.querySelector('.panoptes-ddt-trigger');
      this.selectionContainer = this.wrapper.querySelector('.panoptes-ddt-selection');
      this.hiddenInput = this.wrapper.querySelector(`#${id}-value`);
      this.clearBtn = this.wrapper.querySelector('[data-action="clear-ddt"]');
      this.arrow = this.wrapper.querySelector('.panoptes-ddt-arrow');
      this.floatingLabel = this.wrapper.querySelector('.panoptes-ddt-floating-label');

      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';
      this.isCheckboxes = Boolean(this.config.checkboxes);
      this.checkChildren = this.config.checkChildren !== false;
      this.autoClose = this.config.autoClose !== undefined ? Boolean(this.config.autoClose) : !this.isCheckboxes;

      this.items = [];
      this.nodeMap = new Map();
      this.selectedNode = null;
      this.checkedKeys = new Set();
      this.indeterminateKeys = new Set();
      this.filterQuery = '';
      this.visibleNodes = [];
      this.focusedIndex = -1;

      this.isOpen = false;
      this.popover = null;
      this.backdrop = null;
      this.cleanupFloating = null;
      this.onDocClick = null;

      this.initData();
      this.bindEvents();
    }

    initData() {
      if (this.config.data) {
        this.items = this.parseData(this.config.data);
        this.buildNodeIndex();
        this.applyInitialValue();
        this.renderSelection();
      } else if (this.config.url) {
        this.loadRemoteData(this.config.url);
      } else {
        this.renderSelection();
      }
    }

    loadRemoteData(url) {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          this.items = this.parseData(data);
          this.buildNodeIndex();
          this.applyInitialValue();
          this.renderSelection();
          if (this.config.onDataBound && typeof window[this.config.onDataBound] === 'function') {
            window[this.config.onDataBound]({ sender: this });
          }
        })
        .catch(err => {
          console.error(`Panoptes DropDownTree [${this.id}] Remote Load Error:`, err);
        });
    }

    parseData(raw) {
      if (!raw) return [];
      let data = raw;
      if (typeof raw === 'string') {
        try { data = JSON.parse(raw); } catch { return []; }
      }
      if (!Array.isArray(data)) return [];

      const mapNode = (item, level = 0) => {
        const val = item[this.dataValueField] ?? item.id ?? item.Id ?? item.value ?? item.Value ?? item[this.dataTextField] ?? '';
        const txt = item[this.dataTextField] ?? item.text ?? item.Text ?? item.name ?? item.Name ?? String(val);
        const children = (item.children || item.Children || item.items || item.Items || []).map(ch => mapNode(ch, level + 1));
        
        return {
          id: String(val),
          value: String(val),
          text: String(txt),
          icon: item.icon || item.Icon || null,
          imageUrl: item.imageUrl || item.ImageUrl || null,
          expanded: Boolean(item.expanded || item.Expanded),
          checked: Boolean(item.checked || item.Checked),
          selected: Boolean(item.selected || item.Selected),
          disabled: Boolean(item.disabled || item.Disabled),
          badge: item.badge || item.Badge || null,
          badgeColor: item.badgeColor || item.BadgeColor || 'blue',
          url: item.url || item.Url || null,
          level: level,
          children: children,
          parent: null
        };
      };

      return data.map(item => mapNode(item, 0));
    }

    buildNodeIndex() {
      this.nodeMap.clear();
      const traverse = (node, parent = null) => {
        node.parent = parent;
        this.nodeMap.set(node.value, node);
        if (node.children && node.children.length > 0) {
          node.children.forEach(ch => traverse(ch, node));
        }
      };
      this.items.forEach(item => traverse(item, null));
    }

    applyInitialValue() {
      if (this.config.value) {
        if (this.isCheckboxes) {
          const vals = Array.isArray(this.config.value) 
            ? this.config.value.map(String) 
            : String(this.config.value).split(',').map(s => s.trim()).filter(Boolean);
          vals.forEach(v => {
            const node = this.nodeMap.get(v);
            if (node) this.checkedKeys.add(v);
          });
          if (this.checkChildren) {
            this.updateParentCheckStates();
          }
        } else {
          const val = String(this.config.value);
          const node = this.nodeMap.get(val);
          if (node) {
            this.selectedNode = node;
          }
        }
      } else if (this.config.text && !this.isCheckboxes) {
        // Fallback text without value
        if (this.selectionContainer) {
          this.selectionContainer.innerHTML = `<span class="panoptes-ddt-text text-slate-800 font-medium truncate">${this.config.text}</span>`;
        }
      }
    }

    bindEvents() {
      if (this.trigger) {
        this.trigger.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="clear-ddt"]') || e.target.closest('[data-remove-key]')) return;
          this.toggle();
        });

        this.trigger.addEventListener('keydown', (e) => {
          if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            this.open();
            return;
          }
          if (this.isOpen) {
            this.handleKeydown(e);
          }
        });
      }

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clear();
        });
      }

      if (this.selectionContainer) {
        this.selectionContainer.addEventListener('click', (e) => {
          const removeBtn = e.target.closest('[data-remove-key]');
          if (removeBtn) {
            e.stopPropagation();
            const key = removeBtn.getAttribute('data-remove-key');
            if (key) {
              const node = this.nodeMap.get(key);
              if (node) {
                this.toggleNodeCheck(node, false);
              }
            }
          }
        });
      }
    }

    renderSelection() {
      if (!this.selectionContainer) return;
      const placeholder = this.config.placeholder || 'Seçiniz...';

      if (this.isCheckboxes) {
        if (this.checkedKeys.size === 0) {
          this.selectionContainer.innerHTML = `<span class="panoptes-ddt-placeholder text-slate-400 select-none truncate">${placeholder}</span>`;
          if (this.clearBtn) this.clearBtn.classList.add('hidden');
          if (this.hiddenInput) this.hiddenInput.value = '';
          this.updateFloatingLabel(false);
          return;
        }

        // Render chips for selected nodes
        let chipsHtml = '';
        this.checkedKeys.forEach(key => {
          const node = this.nodeMap.get(key);
          if (node) {
            chipsHtml += `
              <span class="panoptes-ddt-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 shadow-2xs">
                <span class="truncate max-w-[140px]">${node.text}</span>
                <button type="button" class="hover:text-blue-900 hover:bg-blue-100 rounded p-0.5 transition" data-remove-key="${node.value}" title="Kaldır">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </span>
            `;
          }
        });

        this.selectionContainer.innerHTML = chipsHtml;
        if (this.clearBtn && this.config.clearable) this.clearBtn.classList.remove('hidden');
        if (this.hiddenInput) this.hiddenInput.value = [...this.checkedKeys].join(',');
        this.updateFloatingLabel(true);
      } else {
        if (!this.selectedNode) {
          this.selectionContainer.innerHTML = `<span class="panoptes-ddt-placeholder text-slate-400 select-none truncate">${placeholder}</span>`;
          if (this.clearBtn) this.clearBtn.classList.add('hidden');
          if (this.hiddenInput) this.hiddenInput.value = '';
          this.updateFloatingLabel(false);
          return;
        }

        let content = this.selectedNode.text;
        if (this.config.valueTemplate) {
          if (typeof window[this.config.valueTemplate] === 'function') {
            content = window[this.config.valueTemplate](this.selectedNode);
          } else {
            content = this.evaluateTemplate(this.config.valueTemplate, this.selectedNode);
          }
        }

        const iconHtml = this.renderNodeIcon(this.selectedNode, false);
        this.selectionContainer.innerHTML = `
          <div class="flex items-center gap-2 text-slate-800 font-medium text-xs truncate">
            ${iconHtml ? `<span class="shrink-0">${iconHtml}</span>` : ''}
            <span class="truncate">${content}</span>
          </div>
        `;
        if (this.clearBtn && this.config.clearable) this.clearBtn.classList.remove('hidden');
        if (this.hiddenInput) this.hiddenInput.value = this.selectedNode.value;
        this.updateFloatingLabel(true);
      }
    }

    updateFloatingLabel(hasValue) {
      if (!this.floatingLabel) return;
      if (hasValue || this.isOpen) {
        this.floatingLabel.classList.add('-top-2.5', 'left-2.5', 'text-[10px]', 'bg-white', 'px-1.5', 'text-blue-600', 'font-semibold', 'shadow-2xs');
        this.floatingLabel.classList.remove('top-2.5', 'text-slate-400', 'text-xs');
      } else {
        this.floatingLabel.classList.remove('-top-2.5', 'left-2.5', 'text-[10px]', 'bg-white', 'px-1.5', 'text-blue-600', 'font-semibold', 'shadow-2xs');
        this.floatingLabel.classList.add('top-2.5', 'text-slate-400', 'text-xs');
      }
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    open() {
      if (this.isOpen || this.config.disabled || this.config.readonlyMode) return;
      this.isOpen = true;
      this.updateFloatingLabel(true);

      if (this.arrow) {
        const svg = this.arrow.querySelector('svg');
        if (svg) svg.classList.add('rotate-180');
      }

      const isMobile = this.config.adaptiveMode !== 'none' && window.innerWidth < 768;

      if (isMobile) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'panoptes-ddt-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[999998] animate-in fade-in duration-200';
        document.body.appendChild(this.backdrop);
        this.backdrop.addEventListener('click', () => this.close());

        this.popover = document.createElement('div');
        this.popover.className = 'panoptes-ddt-popover fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl shadow-2xl z-[999999] flex flex-col animate-in slide-in-from-bottom duration-200 overflow-hidden';
        document.body.appendChild(this.popover);
      } else {
        this.popover = document.createElement('div');
        this.popover.className = 'panoptes-ddt-popover fixed z-[999999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100';
        this.popover.style.width = this.config.dropdownWidth || '360px';
        this.popover.style.maxHeight = this.config.dropdownHeight || '340px';
        if (this.config.dir === 'rtl') this.popover.setAttribute('dir', 'rtl');

        this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover, { matchWidth: false });

        this.onDocClick = (e) => {
          if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
            this.close();
          }
        };
        setTimeout(() => document.addEventListener('mousedown', this.onDocClick), 50);
      }

      this.renderPopoverStructure(isMobile);
      this.renderTreeNodes();

      const searchInput = this.popover.querySelector('.panoptes-ddt-search');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 80);
      }

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.updateFloatingLabel(Boolean(this.selectedNode || this.checkedKeys.size > 0));

      if (this.arrow) {
        const svg = this.arrow.querySelector('svg');
        if (svg) svg.classList.remove('rotate-180');
      }

      if (this.onDocClick) {
        document.removeEventListener('mousedown', this.onDocClick);
        this.onDocClick = null;
      }

      if (this.cleanupFloating) {
        this.cleanupFloating();
        this.cleanupFloating = null;
      }

      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }

      if (this.backdrop) {
        this.backdrop.remove();
        this.backdrop = null;
      }

      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    renderPopoverStructure(isMobile = false) {
      let mobileHeaderHtml = '';
      if (isMobile) {
        mobileHeaderHtml = `
          <div class="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
            <span class="font-bold text-sm text-slate-800">${this.config.placeholder || 'Seçim Yapınız'}</span>
            <button type="button" class="panoptes-ddt-mobile-close px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold rounded-lg text-xs transition">Kapat</button>
          </div>
        `;
      }

      const headerCustomHtml = this.config.headerTemplate ? `
        <div class="panoptes-ddt-custom-header p-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-semibold">
          ${this.config.headerTemplate}
        </div>
      ` : '';

      const filterHtml = this.config.filter ? `
        <div class="p-2 border-b border-slate-200 bg-slate-50/80">
          <div class="relative flex items-center">
            <svg class="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" class="panoptes-ddt-search w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white placeholder-slate-400 transition" placeholder="${this.config.filterPlaceholder || 'Ağaçta ara...'}" value="${this.filterQuery}" />
            ${this.filterQuery ? `<button type="button" class="panoptes-ddt-clear-filter absolute right-2 text-slate-400 hover:text-slate-600">&times;</button>` : ''}
          </div>
        </div>
      ` : '';

      this.popover.innerHTML = `
        ${mobileHeaderHtml}
        ${headerCustomHtml}
        ${filterHtml}
        <div class="panoptes-ddt-scroll-container overflow-y-auto flex-1 p-1.5 divide-y divide-transparent">
          <ul class="panoptes-ddt-tree-list space-y-0.5"></ul>
          <div class="panoptes-ddt-nodata hidden p-6 text-center text-slate-400">
            ${this.config.noDataTemplate || `
              <svg class="w-7 h-7 mx-auto text-slate-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div class="font-medium text-xs text-slate-500">Kayıt Bulunamadı</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Arama kriterlerine uygun düğüm yok.</div>
            `}
          </div>
        </div>
        <div class="panoptes-ddt-footer px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span class="panoptes-ddt-count font-medium"></span>
          ${this.isCheckboxes ? `<button type="button" class="panoptes-ddt-clear-all text-blue-600 hover:underline font-semibold">Tümünü Temizle</button>` : `<span class="text-slate-400">Açılır Ağaç</span>`}
        </div>
      `;

      if (isMobile) {
        const closeBtn = this.popover.querySelector('.panoptes-ddt-mobile-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
      }

      const searchInput = this.popover.querySelector('.panoptes-ddt-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterQuery = e.target.value;
          this.renderTreeNodes();
        });
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.focusedIndex = 0;
            this.updateNodeFocus();
          }
        });
      }

      const clearAllBtn = this.popover.querySelector('.panoptes-ddt-clear-all');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          this.clear();
          this.renderTreeNodes();
        });
      }
    }

    renderTreeNodes() {
      if (!this.popover) return;
      const listEl = this.popover.querySelector('.panoptes-ddt-tree-list');
      const noDataEl = this.popover.querySelector('.panoptes-ddt-nodata');
      const countEl = this.popover.querySelector('.panoptes-ddt-count');
      if (!listEl) return;

      listEl.innerHTML = '';
      this.visibleNodes = [];

      const q = (this.filterQuery || '').toLowerCase().trim();

      // Deep filtering logic: a node matches if its text matches or any descendant matches
      const nodeMatches = (node) => {
        if (!q) return true;
        const txt = node.text.toLowerCase();
        const selfMatch = this.config.filter === 'startswith' ? txt.startsWith(q) : txt.includes(q);
        if (selfMatch) return true;
        if (node.children && node.children.length > 0) {
          return node.children.some(ch => nodeMatches(ch));
        }
        return false;
      };

      // Flatten tree nodes according to expanded state & filter matches
      const collectVisibleNodes = (nodeList) => {
        nodeList.forEach(node => {
          if (q && !nodeMatches(node)) return;

          // If filtering and a child matches, auto-expand node
          if (q && node.children && node.children.length > 0) {
            node.expanded = true;
          }

          this.visibleNodes.push(node);

          if (node.expanded && node.children && node.children.length > 0) {
            collectVisibleNodes(node.children);
          }
        });
      };

      collectVisibleNodes(this.items);

      if (this.visibleNodes.length === 0) {
        if (noDataEl) noDataEl.classList.remove('hidden');
        if (countEl) countEl.textContent = '0 sonuç';
        return;
      }

      if (noDataEl) noDataEl.classList.add('hidden');
      if (countEl) {
        if (this.isCheckboxes) {
          countEl.textContent = `${this.checkedKeys.size} öğe seçili`;
        } else {
          countEl.textContent = `${this.visibleNodes.length} düğüm`;
        }
      }

      this.visibleNodes.forEach((node, idx) => {
        const li = document.createElement('li');
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = !this.isCheckboxes && this.selectedNode && this.selectedNode.value === node.value;
        const isChecked = this.isCheckboxes && this.checkedKeys.has(node.value);
        const isIndeterminate = this.isCheckboxes && this.indeterminateKeys.has(node.value);

        li.className = `panoptes-ddt-node group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition select-none text-xs ${node.disabled ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-100'} ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`;
        li.setAttribute('data-node-value', node.value);
        li.setAttribute('data-index', idx);

        const indentPx = node.level * 18 + 4;
        if (this.config.dir === 'rtl') {
          li.style.paddingRight = `${indentPx}px`;
        } else {
          li.style.paddingLeft = `${indentPx}px`;
        }

        // Caret Button (expand/collapse)
        let caretHtml = '';
        if (hasChildren) {
          const rotateClass = node.expanded ? 'rotate-90' : '';
          caretHtml = `
            <button type="button" class="panoptes-ddt-caret p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition" data-action="toggle-expand">
              <svg class="w-3.5 h-3.5 transition-transform duration-150 ${rotateClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          `;
        } else {
          caretHtml = `<span class="w-4 h-4 shrink-0 inline-block"></span>`;
        }

        // Checkbox (if multi-select)
        let checkboxHtml = '';
        if (this.isCheckboxes) {
          if (isChecked) {
            checkboxHtml = `
              <span class="w-4 h-4 rounded bg-blue-600 border border-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </span>
            `;
          } else if (isIndeterminate) {
            checkboxHtml = `
              <span class="w-4 h-4 rounded bg-blue-600 border border-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12h14"/></svg>
              </span>
            `;
          } else {
            checkboxHtml = `
              <span class="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 group-hover:border-slate-400"></span>
            `;
          }
        }

        // Icon / Image
        const iconHtml = this.renderNodeIcon(node, hasChildren);

        // Text & Template
        let textHtml = node.text;
        if (this.config.itemTemplate) {
          if (typeof window[this.config.itemTemplate] === 'function') {
            textHtml = window[this.config.itemTemplate](node);
          } else {
            textHtml = this.evaluateTemplate(this.config.itemTemplate, node);
          }
        } else if (q && textHtml.toLowerCase().includes(q)) {
          const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          textHtml = textHtml.replace(regex, '<mark class="bg-amber-100 text-slate-900 rounded-xs px-0.5 font-bold">$1</mark>');
        }

        // Badge
        let badgeHtml = '';
        if (node.badge) {
          const badgeColorMap = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            rose: 'bg-rose-50 text-rose-700 border-rose-200',
            purple: 'bg-purple-50 text-purple-700 border-purple-200'
          };
          const bColor = badgeColorMap[node.badgeColor] || badgeColorMap.blue;
          badgeHtml = `<span class="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${bColor}">${node.badge}</span>`;
        }

        li.innerHTML = `
          ${caretHtml}
          ${checkboxHtml}
          ${iconHtml ? `<span class="shrink-0 flex items-center">${iconHtml}</span>` : ''}
          <span class="panoptes-ddt-node-text flex-1 truncate">${textHtml}</span>
          ${badgeHtml}
        `;

        // Click on Caret -> toggle expand/collapse
        const caretBtn = li.querySelector('[data-action="toggle-expand"]');
        if (caretBtn) {
          caretBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            node.expanded = !node.expanded;
            this.renderTreeNodes();
          });
        }

        // Click on Row -> select or check
        li.addEventListener('click', (e) => {
          if (node.disabled) return;
          if (e.target.closest('[data-action="toggle-expand"]')) return;

          if (this.isCheckboxes) {
            const nextChecked = !this.checkedKeys.has(node.value);
            this.toggleNodeCheck(node, nextChecked);
            this.renderTreeNodes();
            if (this.autoClose) this.close();
          } else {
            this.selectNode(node);
          }
        });

        listEl.appendChild(li);
      });

      this.updateNodeFocus();
    }

    renderNodeIcon(node, hasChildren) {
      if (node.imageUrl) {
        return `<img src="${node.imageUrl}" alt="" class="w-4 h-4 rounded-full object-cover shrink-0" />`;
      }
      if (node.icon) {
        const ic = node.icon.toLowerCase();
        if (ic === 'folder' || ic === 'directory') {
          return node.expanded
            ? `<svg class="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-1.5V9a3 3 0 00-3-3h-4.636a3 3 0 01-2.121-.879l-.879-.879A3 3 0 005.243 3.364H4.5A3 3 0 001.5 6.364v11.636A3 3 0 004.5 21h15z"/></svg>`
            : `<svg class="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-1.5V9a3 3 0 00-3-3h-4.636a3 3 0 01-2.121-.879l-.879-.879A3 3 0 005.243 3.364H4.5A3 3 0 001.5 6.364v11.636A3 3 0 004.5 21h15z"/></svg>`;
        }
        if (ic === 'file' || ic === 'document') {
          return `<svg class="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
        }
        if (ic === 'code') {
          return `<svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`;
        }
        if (ic === 'image' || ic === 'photo') {
          return `<svg class="w-4 h-4 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
        }
        if (ic === 'chart' || ic === 'analytics') {
          return `<svg class="w-4 h-4 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`;
        }
        if (ic === 'user' || ic === 'person') {
          return `<svg class="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
        }
      }
      if (hasChildren) {
        return `<svg class="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-1.5V9a3 3 0 00-3-3h-4.636a3 3 0 01-2.121-.879l-.879-.879A3 3 0 005.243 3.364H4.5A3 3 0 001.5 6.364v11.636A3 3 0 004.5 21h15z"/></svg>`;
      }
      return `<svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
    }

    evaluateTemplate(tpl, item) {
      if (!tpl) return '';
      let str = tpl;
      if (str.includes('&lt;') || str.includes('&gt;') || str.includes('&quot;') || str.includes('&#39;')) {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        str = txt.value;
      }
      return str.replace(/#[=:]\s*([a-zA-Z0-9_]+)\s*#/g, (_, prop) => {
        return item[prop] ?? '';
      });
    }

    toggleNodeCheck(node, isChecked) {
      if (isChecked) {
        this.checkedKeys.add(node.value);
      } else {
        this.checkedKeys.delete(node.value);
      }

      if (this.checkChildren && node.children && node.children.length > 0) {
        const cascade = (children) => {
          children.forEach(ch => {
            if (isChecked) this.checkedKeys.add(ch.value);
            else this.checkedKeys.delete(ch.value);
            if (ch.children && ch.children.length > 0) cascade(ch.children);
          });
        };
        cascade(node.children);
      }

      if (this.checkChildren) {
        this.updateParentCheckStates();
      }

      this.renderSelection();

      // Trigger events
      const checkedArray = [...this.checkedKeys];
      const eventDetail = {
        sender: this,
        node: node,
        checked: isChecked,
        values: checkedArray
      };
      this.wrapper.dispatchEvent(new CustomEvent('check', { detail: eventDetail }));
      this.wrapper.dispatchEvent(new CustomEvent('change', { detail: { value: checkedArray.join(','), values: checkedArray } }));

      if (this.config.onCheck && typeof window[this.config.onCheck] === 'function') {
        window[this.config.onCheck](eventDetail);
      }
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](eventDetail);
      }
    }

    updateParentCheckStates() {
      this.indeterminateKeys.clear();
      
      const evaluateNode = (node) => {
        if (!node.children || node.children.length === 0) {
          return this.checkedKeys.has(node.value) ? 'checked' : 'unchecked';
        }

        let hasChecked = false;
        let hasUnchecked = false;
        let hasIndeterminate = false;

        node.children.forEach(ch => {
          const st = evaluateNode(ch);
          if (st === 'checked') hasChecked = true;
          else if (st === 'unchecked') hasUnchecked = true;
          else if (st === 'indeterminate') hasIndeterminate = true;
        });

        if (hasIndeterminate || (hasChecked && hasUnchecked)) {
          this.indeterminateKeys.add(node.value);
          this.checkedKeys.delete(node.value);
          return 'indeterminate';
        } else if (hasChecked && !hasUnchecked) {
          this.checkedKeys.add(node.value);
          this.indeterminateKeys.delete(node.value);
          return 'checked';
        } else {
          this.checkedKeys.delete(node.value);
          this.indeterminateKeys.delete(node.value);
          return 'unchecked';
        }
      };

      this.items.forEach(rootNode => evaluateNode(rootNode));
    }

    selectNode(node) {
      this.selectedNode = node;
      this.renderSelection();
      this.renderTreeNodes();

      const eventDetail = {
        sender: this,
        node: node,
        value: node.value,
        text: node.text
      };
      this.wrapper.dispatchEvent(new CustomEvent('select', { detail: eventDetail }));
      this.wrapper.dispatchEvent(new CustomEvent('change', { detail: eventDetail }));

      if (this.config.onSelect && typeof window[this.config.onSelect] === 'function') {
        window[this.config.onSelect](eventDetail);
      }
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](eventDetail);
      }

      if (this.autoClose) {
        this.close();
      }
    }

    clear() {
      this.selectedNode = null;
      this.checkedKeys.clear();
      this.indeterminateKeys.clear();
      this.renderSelection();

      this.wrapper.dispatchEvent(new CustomEvent('change', { detail: { value: '', text: '' } }));
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange]({ sender: this, value: '', text: '' });
      }
    }

    handleKeydown(e) {
      if (this.visibleNodes.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.focusedIndex < this.visibleNodes.length - 1) {
          this.focusedIndex++;
          this.updateNodeFocus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.focusedIndex > 0) {
          this.focusedIndex--;
          this.updateNodeFocus();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < this.visibleNodes.length) {
          const node = this.visibleNodes[this.focusedIndex];
          if (node.children && node.children.length > 0 && !node.expanded) {
            node.expanded = true;
            this.renderTreeNodes();
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < this.visibleNodes.length) {
          const node = this.visibleNodes[this.focusedIndex];
          if (node.children && node.children.length > 0 && node.expanded) {
            node.expanded = false;
            this.renderTreeNodes();
          } else if (node.parent) {
            const pIdx = this.visibleNodes.indexOf(node.parent);
            if (pIdx >= 0) {
              this.focusedIndex = pIdx;
              this.updateNodeFocus();
            }
          }
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < this.visibleNodes.length) {
          const node = this.visibleNodes[this.focusedIndex];
          if (this.isCheckboxes) {
            this.toggleNodeCheck(node, !this.checkedKeys.has(node.value));
            this.renderTreeNodes();
          } else {
            this.selectNode(node);
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < this.visibleNodes.length) {
          const node = this.visibleNodes[this.focusedIndex];
          if (this.isCheckboxes) {
            this.toggleNodeCheck(node, !this.checkedKeys.has(node.value));
            this.renderTreeNodes();
            if (this.autoClose) this.close();
          } else {
            this.selectNode(node);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    }

    updateNodeFocus() {
      if (!this.popover) return;
      const rows = this.popover.querySelectorAll('.panoptes-ddt-node');
      rows.forEach((row, i) => {
        if (i === this.focusedIndex) {
          row.classList.add('bg-blue-50', 'text-blue-700', 'font-medium', 'ring-1', 'ring-blue-500/30');
          row.scrollIntoView({ block: 'nearest' });
        } else {
          row.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium', 'ring-1', 'ring-blue-500/30');
        }
      });
    }

    // Client-side API
    value(val) {
      if (val === undefined) {
        if (this.isCheckboxes) return [...this.checkedKeys];
        return this.selectedNode ? this.selectedNode.value : (this.hiddenInput ? this.hiddenInput.value : '');
      }

      if (this.isCheckboxes) {
        this.checkedKeys.clear();
        const arr = Array.isArray(val) ? val.map(String) : String(val).split(',').map(s => s.trim()).filter(Boolean);
        arr.forEach(k => {
          if (this.nodeMap.has(k)) this.checkedKeys.add(k);
        });
        if (this.checkChildren) this.updateParentCheckStates();
        this.renderSelection();
      } else {
        const node = this.nodeMap.get(String(val));
        if (node) {
          this.selectedNode = node;
        } else {
          this.selectedNode = null;
        }
        this.renderSelection();
      }
      return this;
    }

    text(txt) {
      if (txt === undefined) {
        if (this.isCheckboxes) {
          return [...this.checkedKeys].map(k => this.nodeMap.get(k)?.text).filter(Boolean).join(', ');
        }
        return this.selectedNode ? this.selectedNode.text : '';
      }
      if (this.selectionContainer && !this.isCheckboxes) {
        this.selectionContainer.innerHTML = `<span class="panoptes-ddt-text text-slate-800 font-medium truncate">${txt}</span>`;
      }
      return this;
    }

    dataItem() {
      if (this.isCheckboxes) {
        return [...this.checkedKeys].map(k => this.nodeMap.get(k)).filter(Boolean);
      }
      return this.selectedNode;
    }

    enable(state = true) {
      this.config.disabled = !state;
      if (this.trigger) {
        if (!state) {
          this.trigger.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
          this.trigger.setAttribute('tabindex', '-1');
        } else {
          this.trigger.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
          this.trigger.setAttribute('tabindex', '0');
        }
      }
      return this;
    }

    readonly(state = true) {
      this.config.readonlyMode = state;
      if (this.trigger) {
        if (state) {
          this.trigger.classList.add('bg-slate-50', 'cursor-default');
        } else {
          this.trigger.classList.remove('bg-slate-50', 'cursor-default');
        }
      }
      return this;
    }

    filter(query) {
      this.filterQuery = query || '';
      if (this.isOpen) {
        const searchInput = this.popover ? this.popover.querySelector('.panoptes-ddt-search') : null;
        if (searchInput) searchInput.value = this.filterQuery;
        this.renderTreeNodes();
      }
      return this;
    }

    expandAll() {
      this.nodeMap.forEach(n => { n.expanded = true; });
      if (this.isOpen) this.renderTreeNodes();
      return this;
    }

    collapseAll() {
      this.nodeMap.forEach(n => { n.expanded = false; });
      if (this.isOpen) this.renderTreeNodes();
      return this;
    }
  }

  window.Panoptes.DropDownTree = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new DropDownTreeInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.DatePicker = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new DatePickerInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.DateRangePicker = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new DateRangePickerInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.Select = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new SelectInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.MultiSelect = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new MultiSelectInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.NumericTextBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new NumericTextBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.Switch = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new SwitchInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.TextBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new TextBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.ComboBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new ComboBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };


  // ==========================================
  // 9. TimePicker Component
  // ==========================================
  class TimePickerInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-timepicker-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-time"]');
      this.format = this.config.format || 'HH:mm';
      this.step = this.config.step || 30;
      this.isOpen = false;
      this.popover = null;

      this.bindEvents();
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }

      if (this.input) {
        this.input.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!this.isOpen) this.open();
        });
      }
    }

    open() {
      if (this.isOpen || this.config.disabled) return;
      this.isOpen = true;
      this.renderPopover();

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('click', onDocClick), 50);
    }

    close() {
      this.isOpen = false;
      if (this.cleanupFloating) { this.cleanupFloating(); this.cleanupFloating = null; }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
    }

    renderPopover() {
      if (this.popover) this.popover.remove();

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-timepicker-popover absolute z-[10005] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 animate-in fade-in zoom-in-95 duration-100';

      let currentVal = this.input.value || '';
      let [currentH, currentM] = currentVal.includes(':') ? currentVal.split(':').map(Number) : [new Date().getHours(), 0];

      // Hours options: 00 to 23
      const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
      // Minutes options based on step
      const minutes = [];
      for (let m = 0; m < 60; m += this.step) {
        minutes.push(String(m).padStart(2, '0'));
      }
      if (minutes.indexOf('00') === -1) minutes.unshift('00');

      this.popover.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <span class="text-xs font-bold text-slate-800">Saat Seçimi</span>
          <button type="button" class="panoptes-time-now text-[11px] font-semibold text-blue-600 hover:text-blue-700">Şimdi</button>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saat</div>
            <div class="panoptes-time-hours max-h-44 overflow-y-auto space-y-1 pr-1 border-r border-slate-100">
              ${hours.map(h => `
                <button type="button" class="w-full py-1 text-xs rounded font-medium transition ${Number(h) === currentH ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'}" data-hour="${h}">${h}</button>
              `).join('')}
            </div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dakika</div>
            <div class="panoptes-time-minutes max-h-44 overflow-y-auto space-y-1">
              ${minutes.map(m => `
                <button type="button" class="w-full py-1 text-xs rounded font-medium transition ${Number(m) === currentM ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'}" data-minute="${m}">${m}</button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
          <button type="button" class="panoptes-time-clear text-xs text-slate-500 hover:text-red-600 font-medium">Temizle</button>
          <button type="button" class="panoptes-time-apply text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transition">Uygula</button>
        </div>
      `;

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover);

      let selectedH = String(currentH).padStart(2, '0');
      let selectedM = String(currentM).padStart(2, '0');

      this.popover.querySelectorAll('[data-hour]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.popover.querySelectorAll('[data-hour]').forEach(b => {
            b.className = 'w-full py-1 text-xs rounded font-medium transition text-slate-700 hover:bg-slate-100';
          });
          btn.className = 'w-full py-1 text-xs rounded font-bold transition bg-blue-600 text-white';
          selectedH = btn.getAttribute('data-hour');
        };
      });

      this.popover.querySelectorAll('[data-minute]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.popover.querySelectorAll('[data-minute]').forEach(b => {
            b.className = 'w-full py-1 text-xs rounded font-medium transition text-slate-700 hover:bg-slate-100';
          });
          btn.className = 'w-full py-1 text-xs rounded font-bold transition bg-blue-600 text-white';
          selectedM = btn.getAttribute('data-minute');
        };
      });

      this.popover.querySelector('.panoptes-time-now').onclick = (e) => {
        e.stopPropagation();
        const now = new Date();
        this.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        this.close();
      };

      this.popover.querySelector('.panoptes-time-clear').onclick = (e) => {
        e.stopPropagation();
        this.setValue('');
        this.close();
      };

      this.popover.querySelector('.panoptes-time-apply').onclick = (e) => {
        e.stopPropagation();
        this.setValue(`${selectedH}:${selectedM}`);
        this.close();
      };
    }

    setValue(val) {
      this.input.value = val;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](val);
      }
    }

    getValue() {
      return this.input.value;
    }

    enable(enabled = true) {
      this.config.disabled = !enabled;
      if (this.input) {
        this.input.disabled = !enabled;
        if (!enabled) {
          this.input.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        } else {
          this.input.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        }
      }
      if (this.toggleBtn) {
        this.toggleBtn.disabled = !enabled;
      }
    }
  }

  // ==========================================
  // 10. DateTimePicker Component
  // ==========================================
  class DateTimePickerInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-datetimepicker-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.toggleBtn = this.wrapper.querySelector('[data-action="toggle-datetime"]');
      this.currentDate = new Date();
      this.activeTab = 'date'; // 'date' | 'time'
      this.isOpen = false;
      this.popover = null;

      this.bindEvents();
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }

      if (this.input) {
        this.input.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!this.isOpen) this.open();
        });
      }
    }

    open() {
      if (this.isOpen || this.config.disabled) return;
      this.isOpen = true;
      this.renderPopover();

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('click', onDocClick), 50);
    }

    close() {
      this.isOpen = false;
      if (this.cleanupFloating) { this.cleanupFloating(); this.cleanupFloating = null; }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
    }

    renderPopover() {
      if (this.popover) this.popover.remove();

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-datetimepicker-popover absolute z-[10005] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 w-72 animate-in fade-in zoom-in-95 duration-100';

      let parsed = new Date();
      if (this.input.value) {
        const parts = this.input.value.split(' ');
        if (parts[0]) {
          const dParts = parts[0].split(/[./-]/);
          if (dParts.length === 3) {
            parsed = new Date(dParts[2], dParts[1] - 1, dParts[0]);
          }
        }
        if (parts[1]) {
          const tParts = parts[1].split(':');
          parsed.setHours(Number(tParts[0]) || 0);
          parsed.setMinutes(Number(tParts[1]) || 0);
        }
      }

      this.selectedDate = new Date(parsed);

      const renderContent = () => {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayOrig = new Date(year, month, 1).getDay();
        const firstDay = firstDayOrig === 0 ? 6 : firstDayOrig - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let calendarHtml = `
          <div class="flex items-center justify-between mb-2">
            <button type="button" class="panoptes-dt-prev p-1 rounded hover:bg-slate-100 text-slate-600">‹</button>
            <span class="text-xs font-bold text-slate-800">${months[month]} ${year}</span>
            <button type="button" class="panoptes-dt-next p-1 rounded hover:bg-slate-100 text-slate-600">›</button>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center mb-1">
            ${days.map(d => `<span class="text-[10px] font-bold text-slate-400">${d}</span>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1 text-center">
            ${Array.from({ length: firstDay }, () => '<span></span>').join('')}
            ${Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected = this.selectedDate && 
                this.selectedDate.getDate() === day && 
                this.selectedDate.getMonth() === month && 
                this.selectedDate.getFullYear() === year;
              return `<button type="button" class="panoptes-dt-day py-1 text-xs rounded transition ${isSelected ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100 font-medium'}" data-day="${day}">${day}</button>`;
            }).join('')}
          </div>
        `;

        const curH = String(this.selectedDate.getHours()).padStart(2, '0');
        const curM = String(this.selectedDate.getMinutes()).padStart(2, '0');

        let timeHtml = `
          <div class="p-2 space-y-3">
            <div class="flex items-center justify-center gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase text-center mb-1">Saat</label>
                <select class="panoptes-dt-hour-select px-2 py-1.5 border border-slate-300 rounded text-sm font-bold bg-white text-slate-800">
                  ${Array.from({ length: 24 }, (_, i) => {
                    const h = String(i).padStart(2, '0');
                    return `<option value="${h}" ${h === curH ? 'selected' : ''}>${h}</option>`;
                  }).join('')}
                </select>
              </div>
              <span class="text-lg font-bold text-slate-400 mt-3">:</span>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase text-center mb-1">Dakika</label>
                <select class="panoptes-dt-min-select px-2 py-1.5 border border-slate-300 rounded text-sm font-bold bg-white text-slate-800">
                  ${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => {
                    return `<option value="${m}" ${m === curM ? 'selected' : ''}>${m}</option>`;
                  }).join('')}
                </select>
              </div>
            </div>
            <div class="text-center">
              <span class="text-xs text-slate-500 font-medium">Seçili Saat: </span>
              <span class="text-xs font-bold text-blue-600">${curH}:${curM}</span>
            </div>
          </div>
        `;

        this.popover.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button type="button" class="panoptes-dt-tab-date px-2 py-0.5 rounded ${this.activeTab === 'date' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-600'}">📅 Tarih</button>
              <button type="button" class="panoptes-dt-tab-time px-2 py-0.5 rounded ${this.activeTab === 'time' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-600'}">🕒 Saat</button>
            </div>
            <button type="button" class="panoptes-dt-now text-[11px] font-semibold text-blue-600 hover:text-blue-700">Şimdi</button>
          </div>
          <div class="panoptes-dt-body">
            ${this.activeTab === 'date' ? calendarHtml : timeHtml}
          </div>
          <div class="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
            <button type="button" class="panoptes-dt-clear text-xs text-slate-500 hover:text-red-600 font-medium">Temizle</button>
            <button type="button" class="panoptes-dt-apply text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transition">Uygula</button>
          </div>
        `;

        // Event bindings
        this.popover.querySelector('.panoptes-dt-tab-date').onclick = (e) => {
          e.stopPropagation();
          this.activeTab = 'date';
          renderContent();
        };

        this.popover.querySelector('.panoptes-dt-tab-time').onclick = (e) => {
          e.stopPropagation();
          this.activeTab = 'time';
          renderContent();
        };

        if (this.activeTab === 'date') {
          this.popover.querySelector('.panoptes-dt-prev').onclick = (e) => {
            e.stopPropagation();
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            renderContent();
          };
          this.popover.querySelector('.panoptes-dt-next').onclick = (e) => {
            e.stopPropagation();
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            renderContent();
          };
          this.popover.querySelectorAll('.panoptes-dt-day').forEach(b => {
            b.onclick = (e) => {
              e.stopPropagation();
              const day = Number(b.getAttribute('data-day'));
              this.selectedDate.setDate(day);
              this.selectedDate.setMonth(this.currentDate.getMonth());
              this.selectedDate.setFullYear(this.currentDate.getFullYear());
              this.activeTab = 'time';
              renderContent();
            };
          });
        } else {
          const hSel = this.popover.querySelector('.panoptes-dt-hour-select');
          const mSel = this.popover.querySelector('.panoptes-dt-min-select');
          if (hSel) {
            hSel.onchange = () => this.selectedDate.setHours(Number(hSel.value));
          }
          if (mSel) {
            mSel.onchange = () => this.selectedDate.setMinutes(Number(mSel.value));
          }
        }

        this.popover.querySelector('.panoptes-dt-now').onclick = (e) => {
          e.stopPropagation();
          this.selectedDate = new Date();
          this.commit();
        };

        this.popover.querySelector('.panoptes-dt-clear').onclick = (e) => {
          e.stopPropagation();
          this.setValue('');
          this.close();
        };

        this.popover.querySelector('.panoptes-dt-apply').onclick = (e) => {
          e.stopPropagation();
          this.commit();
        };
      };

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover);
      renderContent();
    }

    commit() {
      const d = String(this.selectedDate.getDate()).padStart(2, '0');
      const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
      const y = this.selectedDate.getFullYear();
      const hh = String(this.selectedDate.getHours()).padStart(2, '0');
      const mm = String(this.selectedDate.getMinutes()).padStart(2, '0');
      this.setValue(`${d}.${m}.${y} ${hh}:${mm}`);
      this.close();
    }

    setValue(val) {
      this.input.value = val;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](val);
      }
    }

    getValue() {
      return this.input.value;
    }
  }

  // ==========================================
  // 11. AutoComplete Component
  // ==========================================
  class AutoCompleteInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-autocomplete-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.clearBtn = this.wrapper.querySelector(`#${id}-clear`) || this.wrapper.querySelector('.panoptes-autocomplete-clear');
      
      this.dataTextField = this.config.dataTextField || 'text';
      this.dataValueField = this.config.dataValueField || 'value';

      this.options = this.parseOptions();
      this.minLength = this.config.minLength || 1;
      this.separator = this.config.separator || null;
      this.filterMode = this.config.filter || 'startswith';
      this.isOpen = false;
      this.popover = null;
      this.highlightedIndex = -1;

      this.bindEvents();
    }

    parseOptions() {
      if (!this.config.options) return [];
      let raw = this.config.options;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            raw = JSON.parse(trimmed);
          } catch (e) {
            raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          raw = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (Array.isArray(raw)) {
        return raw.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.value ?? ''),
              value: String(item[this.dataValueField] ?? item.value ?? item.id ?? item.text ?? ''),
              icon: item.icon || null,
              badge: item.badge || null,
              desc: item.desc || item.description || item.subtitle || null,
              raw: item
            };
          }
          return {
            text: String(item),
            value: String(item),
            icon: null,
            badge: null,
            desc: null,
            raw: item
          };
        });
      }
      return [];
    }

    bindEvents() {
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setValue('');
          this.close();
          this.input.focus();
        });
      }

      if (this.input) {
        this.input.addEventListener('input', () => {
          const val = this.input.value;
          this.updateClearBtn(val);

          const query = this.getCurrentQuery(val);
          if (query.length >= this.minLength) {
            this.search(query);
          } else {
            this.close();
          }
        });

        this.input.addEventListener('keydown', (e) => {
          if (!this.isOpen) return;
          const items = this.popover ? this.popover.querySelectorAll('.panoptes-ac-item') : [];
          if (!items.length) {
            if (e.key === 'Escape') this.close();
            return;
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.highlightedIndex = (this.highlightedIndex + 1) % items.length;
            this.updateHighlight(items);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.highlightedIndex = (this.highlightedIndex - 1 + items.length) % items.length;
            this.updateHighlight(items);
          } else if (e.key === 'Enter') {
            if (this.highlightedIndex >= 0 && this.highlightedIndex < items.length) {
              e.preventDefault();
              items[this.highlightedIndex].click();
            } else {
              this.close();
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
          }
        });
      }
    }

    getCurrentQuery(fullVal) {
      if (!this.separator) return fullVal.trim();
      const parts = fullVal.split(this.separator);
      return parts[parts.length - 1].trim();
    }

    updateHighlight(items) {
      items.forEach((it, idx) => {
        if (idx === this.highlightedIndex) {
          it.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
        }
      });
    }

    updateClearBtn(val) {
      if (!this.clearBtn) return;
      if (val && !this.config.disabled && !this.config.readonly) {
        this.clearBtn.classList.remove('hidden');
      } else {
        this.clearBtn.classList.add('hidden');
      }
    }

    async search(query) {
      let filtered = [];
      if (this.config.dataUrl) {
        try {
          const sep = this.config.dataUrl.includes('?') ? '&' : '?';
          const res = await fetch(`${this.config.dataUrl}${sep}filter=${encodeURIComponent(query)}`);
          const data = await res.json();
          const items = data.data || data.Data || (Array.isArray(data) ? data : []);
          filtered = items.map(item => {
            if (typeof item === 'object' && item !== null) {
              return {
                text: item[this.dataTextField] ?? item.name ?? item.title ?? item.text ?? String(item.id ?? ''),
                value: String(item[this.dataValueField] ?? item.id ?? item.value ?? item.name ?? ''),
                icon: item.icon || null,
                badge: item.badge || null,
                desc: item.desc || item.description || null,
                raw: item
              };
            }
            return { text: String(item), value: String(item), icon: null, badge: null, desc: null, raw: item };
          });
        } catch (e) {
          filtered = [];
        }
      } else {
        const q = query.toLowerCase();
        filtered = this.options.filter(opt => {
          const txt = (opt.text || '').toLowerCase();
          if (this.filterMode === 'contains') return txt.includes(q);
          return txt.startsWith(q);
        });
      }

      if (!filtered.length) {
        if (this.config.noDataTemplate) {
          this.renderDropdown([], query);
        } else {
          this.close();
        }
        return;
      }

      this.renderDropdown(filtered, query);
    }

    renderDropdown(items, query) {
      if (this.popover) this.popover.remove();

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-autocomplete-popover fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-1 text-sm text-slate-800 select-none max-h-56 overflow-y-auto overscroll-contain z-[999999]';

      if (!items.length) {
        let msg = typeof window[this.config.noDataTemplate] === 'function' ? window[this.config.noDataTemplate]() : this.config.noDataTemplate;
        this.popover.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 font-medium">${msg}</div>`;
      } else {
        this.popover.innerHTML = items.map((it, idx) => {
          let itemContent = '';
          if (this.config.itemTemplate && typeof window[this.config.itemTemplate] === 'function') {
            itemContent = window[this.config.itemTemplate](it);
          } else {
            const iconHtml = it.icon ? `<span class="shrink-0 text-base">${it.icon}</span>` : '';
            const badgeHtml = it.badge ? `<span class="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">${escapeHtml(it.badge)}</span>` : '';
            const descHtml = it.desc ? `<div class="text-[11px] text-slate-400 font-normal leading-tight">${escapeHtml(it.desc)}</div>` : '';
            
            let displayTxt = escapeHtml(it.text);
            if (query) {
              displayTxt = displayTxt.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-yellow-200 text-slate-900 rounded-xs px-0.5 font-bold">$1</mark>');
            }

            itemContent = `
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                ${iconHtml}
                <div class="flex-1 min-w-0">
                  <div class="truncate font-medium">${displayTxt}</div>
                  ${descHtml}
                </div>
                ${badgeHtml}
              </div>
            `;
          }

          return `
            <div class="panoptes-ac-item px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none flex items-center justify-between" 
                 data-idx="${idx}"
                 data-value="${escapeHtml(it.value)}" 
                 data-text="${escapeHtml(it.text)}">
              ${itemContent}
            </div>
          `;
        }).join('');
      }

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover, { matchWidth: true });
      this.isOpen = true;
      this.highlightedIndex = -1;

      if (this.config.onOpen && typeof window[this.config.onOpen] === 'function') {
        window[this.config.onOpen]({ sender: this });
      }

      this.popover.querySelectorAll('.panoptes-ac-item').forEach(el => {
        el.addEventListener('mousedown', (e) => e.preventDefault());
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const txt = el.getAttribute('data-text') || el.getAttribute('data-value');
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          const selected = items[idx];

          this.applySelectedValue(txt);
          this.close();

          if (this.config.onSelect && typeof window[this.config.onSelect] === 'function') {
            window[this.config.onSelect]({ dataItem: selected, sender: this });
          }
        });
      });

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
          document.removeEventListener('mousedown', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', onDocClick), 50);
    }

    applySelectedValue(txt) {
      if (!this.separator) {
        this.setValue(txt);
      } else {
        const cur = this.input.value;
        const parts = cur.split(this.separator);
        parts.pop();
        parts.push(' ' + txt);
        const nextVal = parts.map(p => p.trim()).filter(Boolean).join(this.separator + ' ') + this.separator + ' ';
        this.setValue(nextVal);
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      if (this.cleanupFloating) { this.cleanupFloating(); this.cleanupFloating = null; }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
      if (this.config.onClose && typeof window[this.config.onClose] === 'function') {
        window[this.config.onClose]({ sender: this });
      }
    }

    value(val) {
      if (val === undefined) return this.getValue();
      this.setValue(val);
      return this;
    }

    setValue(val) {
      if (!this.input) return;
      this.input.value = val || '';
      this.updateClearBtn(val);
      
      const event = new CustomEvent('change', { detail: { value: val }, bubbles: true });
      this.input.dispatchEvent(event);
      this.wrapper.dispatchEvent(event);

      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange]({ value: val, sender: this });
      }
    }

    getValue() {
      return this.input ? this.input.value : '';
    }

    enable(enabled = true) {
      this.config.disabled = !enabled;
      if (this.input) {
        this.input.disabled = !enabled;
        if (!enabled) {
          this.input.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        } else {
          this.input.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
        }
      }
      this.updateClearBtn(this.getValue());
    }
  }

  // ==========================================
  // 12. TextArea Component
  // ==========================================
  class TextAreaInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-textarea-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.textarea = this.wrapper.querySelector(`#${id}-input`);
      this.counter = this.wrapper.querySelector(`#${id}-counter`);

      this.bindEvents();
    }

    bindEvents() {
      this.textarea.addEventListener('input', () => {
        if (this.counter && this.config.maxLength) {
          this.counter.textContent = this.textarea.value.length;
        }

        if (this.config.autoResize) {
          this.textarea.style.height = 'auto';
          this.textarea.style.height = this.textarea.scrollHeight + 'px';
        }
      });
    }

    setValue(val) {
      this.textarea.value = val;
      if (this.counter && this.config.maxLength) {
        this.counter.textContent = this.textarea.value.length;
      }
      if (this.config.autoResize) {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = this.textarea.scrollHeight + 'px';
      }
    }

    getValue() {
      return this.textarea.value;
    }
  }

  // ==========================================
  // 13. CheckBox Component
  // ==========================================
  class CheckBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.bindEvents();
    }

    bindEvents() {
      this.input.addEventListener('change', () => {
        if (this.config && this.config.onChange && typeof window[this.config.onChange] === 'function') {
          window[this.config.onChange](this.input.checked);
        }
      });
    }

    setValue(val) {
      this.input.checked = !!val;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    getValue() {
      return this.input.checked;
    }
  }

  // ==========================================
  // 14. RadioGroup Component
  // ==========================================
  class RadioGroupInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;
      this.bindEvents();
    }

    bindEvents() {
      this.wrapper.querySelectorAll('input[type="radio"]').forEach(r => {
        r.addEventListener('change', () => {
          if (r.checked) {
            // fire custom event if needed
          }
        });
      });
    }

    setValue(val) {
      const target = this.wrapper.querySelector(`input[type="radio"][value="${val}"]`);
      if (target) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    getValue() {
      const checked = this.wrapper.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : null;
    }
  }

  // ==========================================
  // 15. MaskedTextBox Component
  // ==========================================
  class MaskedTextBoxInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-maskedtextbox-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.input = this.wrapper.querySelector(`#${id}-input`);
      this.mask = this.config.mask || '(000) 000-0000';

      this.bindEvents();
    }

    bindEvents() {
      if (this.input) {
        this.input.addEventListener('input', (e) => {
        const raw = this.input.value.replace(/[^0-9]/g, '');
        let formatted = '';
        let rawIdx = 0;

        for (let i = 0; i < this.mask.length && rawIdx < raw.length; i++) {
          const m = this.mask[i];
          if (m === '0' || m === '9') {
            formatted += raw[rawIdx++];
          } else {
            formatted += m;
          }
        }

        this.input.value = formatted;
        });
      }
    }

    setValue(val) {
      this.input.value = val;
      this.input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    getValue() {
      return this.input.value;
    }

    getRawValue() {
      return this.input.value.replace(/[^0-9]/g, '');
    }
  }

  // ==========================================
  // 16. ColorPicker Component
  // ==========================================
  class ColorPickerInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      const script = this.wrapper.querySelector(`script[data-panoptes-colorpicker-config="${id}"]`);
      this.config = script ? JSON.parse(script.textContent) : {};

      this.trigger = this.wrapper.querySelector(`#${id}-trigger`);
      this.preview = this.wrapper.querySelector(`#${id}-preview`);
      this.label = this.wrapper.querySelector(`#${id}-label`);
      this.hiddenInput = this.wrapper.querySelector(`#${id}-input`);

      this.palette = this.config.palette || [
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
        '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
        '#0f172a', '#ffffff', '#dc2626', '#16a34a', '#2563eb'
      ];

      this.isOpen = false;
      this.popover = null;

      this.bindEvents();
    }

    bindEvents() {
      if (this.trigger) {
        this.trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isOpen) this.close();
          else this.open();
        });
      }
    }

    open() {
      if (this.isOpen || this.config.disabled) return;
      this.isOpen = true;
      this.renderPopover();

      const onDocClick = (e) => {
        if (!this.wrapper.contains(e.target) && (!this.popover || !this.popover.contains(e.target))) {
          this.close();
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => document.addEventListener('click', onDocClick), 50);
    }

    close() {
      this.isOpen = false;
      if (this.cleanupFloating) { this.cleanupFloating(); this.cleanupFloating = null; }
      if (this.popover) {
        this.popover.remove();
        this.popover = null;
      }
    }

    renderPopover() {
      if (this.popover) this.popover.remove();

      this.popover = document.createElement('div');
      this.popover.className = 'panoptes-colorpicker-popover absolute z-[10005] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 animate-in fade-in zoom-in-95 duration-100';

      this.popover.innerHTML = `
        <div class="text-xs font-bold text-slate-800 mb-2">Renk Paleti</div>
        <div class="grid grid-cols-5 gap-1.5 mb-3">
          ${this.palette.map(c => `
            <button type="button" class="panoptes-color-swatch w-8 h-8 rounded-lg border border-slate-200 shadow-xs hover:scale-110 transition flex items-center justify-center" style="background-color: ${c};" data-color="${c}">
              ${c.toLowerCase() === this.getValue().toLowerCase() ? '<span class="text-xs text-white drop-shadow">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input type="text" class="panoptes-hex-input font-mono text-xs w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 uppercase" value="${this.getValue()}" maxlength="7" />
          <button type="button" class="panoptes-color-apply text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold transition">Seç</button>
        </div>
      `;

      this.cleanupFloating = openFloatingPopover(this.wrapper, this.popover);

      this.popover.querySelectorAll('.panoptes-color-swatch').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const col = btn.getAttribute('data-color');
          this.setValue(col);
          this.close();
        };
      });

      const hexInput = this.popover.querySelector('.panoptes-hex-input');
      this.popover.querySelector('.panoptes-color-apply').onclick = (e) => {
        e.stopPropagation();
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        this.setValue(val);
        this.close();
      };
    }

    setValue(color) {
      this.preview.style.backgroundColor = color;
      this.label.textContent = color;
      this.hiddenInput.value = color;
      this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      if (this.config.onChange && typeof window[this.config.onChange] === 'function') {
        window[this.config.onChange](color);
      }
    }

    getValue() {
      return this.hiddenInput.value;
    }
  }

  // ==========================================
  // Universal Panoptes Component Registry & Helpers
  // ==========================================
  window.Panoptes = window.Panoptes || {};

  window.Panoptes.TimePicker = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new TimePickerInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.DateTimePicker = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new DateTimePickerInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.AutoComplete = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new AutoCompleteInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.TextArea = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new TextAreaInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.CheckBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new CheckBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.RadioGroup = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new RadioGroupInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.MaskedTextBox = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new MaskedTextBoxInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  window.Panoptes.ColorPicker = {
    instances: new Map(),
    init: function (id) {
      if (this.instances.has(id)) return this.instances.get(id);
      const instance = new ColorPickerInstance(id);
      this.instances.set(id, instance);
      return instance;
    }
  };

  // Global helper to initialize all Panoptes components in any DOM root
  window.Panoptes.initAll = function (root = document) {
    if (!root) return;
    
    // 1. DatePicker
    root.querySelectorAll('.panoptes-datepicker-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.DatePicker.init(w.id);
      }
    });

    // 2. DateRangePicker
    root.querySelectorAll('.panoptes-daterangepicker-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.DateRangePicker.init(w.id);
      }
    });

    // 3. TimePicker
    root.querySelectorAll('.panoptes-timepicker-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.TimePicker.init(w.id);
      }
    });

    // 4. DateTimePicker
    root.querySelectorAll('.panoptes-datetimepicker-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.DateTimePicker.init(w.id);
      }
    });

    // 5. Select
    root.querySelectorAll('.panoptes-select-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.Select.init(w.id);
      }
    });

    // 6. MultiSelect
    root.querySelectorAll('.panoptes-multiselect-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.MultiSelect.init(w.id);
      }
    });

    // 7. NumericTextBox
    root.querySelectorAll('.panoptes-numeric-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.NumericTextBox.init(w.id);
      }
    });

    // 8. Switch
    root.querySelectorAll('.panoptes-switch-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.Switch.init(w.id);
      }
    });

    // 9. TextBox
    root.querySelectorAll('.panoptes-textbox-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.TextBox.init(w.id);
      }
    });

    // 10. ComboBox
    root.querySelectorAll('.panoptes-combobox-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.ComboBox.init(w.id);
      }
    });

    // 10b. MultiColumnComboBox
    root.querySelectorAll('.panoptes-mccb-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        window.Panoptes.MultiColumnComboBox.init(w.id);
      }
    });

    // 10c. DropDownTree
    root.querySelectorAll('.panoptes-ddt-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        window.Panoptes.DropDownTree.init(w.id);
      }
    });

    // 11. AutoComplete
    root.querySelectorAll('.panoptes-autocomplete-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.AutoComplete.init(w.id);
      }
    });

    // 12. TextArea
    root.querySelectorAll('.panoptes-textarea-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.TextArea.init(w.id);
      }
    });

    // 13. MaskedTextBox
    root.querySelectorAll('.panoptes-maskedtextbox-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.MaskedTextBox.init(w.id);
      }
    });

    // 14. ColorPicker
    root.querySelectorAll('.panoptes-colorpicker-wrapper').forEach(w => {
      if (w.id && !w.dataset.panoptesInitialized) {
        w.dataset.panoptesInitialized = 'true';
        window.Panoptes.ColorPicker.init(w.id);
      }
    });
  };

  // Universal value retriever from any Panoptes component container
  window.Panoptes.getValue = function(wrapperOrInput) {
    if (!wrapperOrInput) return null;
    const w = wrapperOrInput.closest ? (wrapperOrInput.closest('[class*="panoptes-"]') || wrapperOrInput) : wrapperOrInput;
    const id = w.id;

    const getFrom = (module) => {
      if (module && module.instances && module.instances.has(id)) {
        const inst = module.instances.get(id);
        if (inst && typeof inst.getValue === 'function') {
          return inst.getValue();
        }
      }
      return undefined;
    };

    if (w.classList.contains('panoptes-switch-wrapper')) {
      const v = getFrom(window.Panoptes.Switch);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-numeric-wrapper')) {
      const v = getFrom(window.Panoptes.NumericTextBox);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-select-wrapper')) {
      const v = getFrom(window.Panoptes.Select);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-multiselect-wrapper')) {
      const v = getFrom(window.Panoptes.MultiSelect);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-datepicker-wrapper')) {
      const v = getFrom(window.Panoptes.DatePicker);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-daterangepicker-wrapper')) {
      const v = getFrom(window.Panoptes.DateRangePicker);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-timepicker-wrapper')) {
      const v = getFrom(window.Panoptes.TimePicker);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-datetimepicker-wrapper')) {
      const v = getFrom(window.Panoptes.DateTimePicker);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-textbox-wrapper')) {
      const v = getFrom(window.Panoptes.TextBox);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-combobox-wrapper')) {
      const v = getFrom(window.Panoptes.ComboBox);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-autocomplete-wrapper')) {
      const v = getFrom(window.Panoptes.AutoComplete);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-textarea-wrapper')) {
      const v = getFrom(window.Panoptes.TextArea);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-checkbox-wrapper')) {
      const v = getFrom(window.Panoptes.CheckBox);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-radiogroup-wrapper')) {
      const v = getFrom(window.Panoptes.RadioGroup);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-maskedtextbox-wrapper')) {
      const v = getFrom(window.Panoptes.MaskedTextBox);
      if (v !== undefined) return v;
    }
    if (w.classList.contains('panoptes-colorpicker-wrapper')) {
      const v = getFrom(window.Panoptes.ColorPicker);
      if (v !== undefined) return v;
    }

    // Fallback: search for hidden or text input
    const input = w.querySelector ? (w.querySelector('input[type="hidden"], input:not([type="button"]):not([type="submit"]), textarea, select') || w) : w;
    if (input) {
      if (input.type === 'checkbox') return input.checked;
      return input.value;
    }
    return null;
  };

  // Auto-init on page load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.Panoptes.initAll());
    } else {
      window.Panoptes.initAll();
    }
  }

})(window);
