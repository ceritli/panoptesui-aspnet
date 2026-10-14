/**
 * Panoptes Slider & RangeSlider Component
 * Pure vanilla JS, touch-enabled, keyboard-accessible slider engine
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.Slider = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-slider="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new SliderComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        getValue: function(id) {
            const inst = this.get(id);
            return inst ? inst.getValue() : null;
        },

        setValue: function(id, val) {
            const inst = this.get(id);
            if (inst) inst.setValue(val);
        },

        setValues: function(id, start, end) {
            const inst = this.get(id);
            if (inst) inst.setValues(start, end);
        }
    };

    class SliderComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.isRange = element.dataset.isRange === 'true';
            this.min = parseFloat(element.dataset.min) || 0;
            this.max = parseFloat(element.dataset.max) || 100;
            this.step = parseFloat(element.dataset.step) || 1;
            this.showTooltip = element.dataset.showTooltip === 'true';
            this.onChangeCallback = element.dataset.onChange || null;
            this.onSlideCallback = element.dataset.onSlide || null;

            this.trackWrap = element.querySelector('.panoptes-slider-track-wrap');
            this.highlightTrack = element.querySelector('.panoptes-slider-highlight-track');
            this.thumb1 = element.querySelector('.panoptes-slider-thumb-1');
            this.thumb2 = element.querySelector('.panoptes-slider-thumb-2');
            this.valueDisplay = element.querySelector('.panoptes-slider-value-display');
            this.inputSingle = element.querySelector(`#${this.id}_input`);
            this.inputStart = element.querySelector(`#${this.id}_input_start`);
            this.inputEnd = element.querySelector(`#${this.id}_input_end`);

            this.tooltip1 = this.thumb1 ? this.thumb1.querySelector('.panoptes-slider-tooltip') : null;
            this.tooltip2 = this.thumb2 ? this.thumb2.querySelector('.panoptes-slider-tooltip') : null;

            this.btnMinus = element.querySelector('.panoptes-slider-btn-minus');
            this.btnPlus = element.querySelector('.panoptes-slider-btn-plus');

            if (this.isRange) {
                this.valStart = parseFloat(element.dataset.valStart ?? this.min);
                this.valEnd = parseFloat(element.dataset.valEnd ?? this.max);
            } else {
                this.val = parseFloat(element.dataset.val ?? this.min);
            }

            this.activeThumb = null;
            this.isDragging = false;

            this.bindEvents();
            this.render();
        }

        bindEvents() {
            // Track click
            if (this.trackWrap) {
                this.trackWrap.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.panoptes-slider-thumb')) return;
                    this.handleTrackClick(e);
                });
            }

            // Thumb 1 Dragging
            if (this.thumb1) {
                this.setupDrag(this.thumb1, 1);
                this.setupKeyboard(this.thumb1, 1);
            }

            // Thumb 2 Dragging (Range)
            if (this.thumb2) {
                this.setupDrag(this.thumb2, 2);
                this.setupKeyboard(this.thumb2, 2);
            }

            // Stepper buttons
            if (this.btnMinus) {
                this.btnMinus.addEventListener('click', () => {
                    this.stepChange(-1);
                });
            }
            if (this.btnPlus) {
                this.btnPlus.addEventListener('click', () => {
                    this.stepChange(1);
                });
            }
        }

        setupDrag(thumb, index) {
            const startDrag = (clientX) => {
                this.isDragging = true;
                this.activeThumb = index;
                this.dragRect = this.trackWrap ? this.trackWrap.getBoundingClientRect() : null;
                thumb.classList.add('cursor-grabbing');
                this.container.classList.add('panoptes-slider-dragging');
                if (index === 1 && this.tooltip1) this.tooltip1.classList.remove('opacity-0');
                if (index === 2 && this.tooltip2) this.tooltip2.classList.remove('opacity-0');

                const onMove = (moveEvt) => {
                    if (!this.isDragging) return;
                    const x = moveEvt.touches && moveEvt.touches.length > 0 ? moveEvt.touches[0].clientX : moveEvt.clientX;
                    this.moveThumbToClientX(x, this.activeThumb);
                };

                const onEnd = () => {
                    if (!this.isDragging) return;
                    this.isDragging = false;
                    this.dragRect = null;
                    thumb.classList.remove('cursor-grabbing');
                    this.container.classList.remove('panoptes-slider-dragging');
                    if (index === 1 && this.tooltip1) this.tooltip1.classList.add('opacity-0');
                    if (index === 2 && this.tooltip2) this.tooltip2.classList.add('opacity-0');
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onEnd);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onEnd);
                    this.triggerChange();
                };

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            };

            thumb.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startDrag(e.clientX);
            });

            thumb.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                if (e.touches.length > 0) startDrag(e.touches[0].clientX);
            }, { passive: false });

            // Tooltip hover
            thumb.addEventListener('mouseenter', () => {
                if (index === 1 && this.tooltip1) this.tooltip1.classList.remove('opacity-0');
                if (index === 2 && this.tooltip2) this.tooltip2.classList.remove('opacity-0');
            });
            thumb.addEventListener('mouseleave', () => {
                if (!this.isDragging) {
                    if (index === 1 && this.tooltip1) this.tooltip1.classList.add('opacity-0');
                    if (index === 2 && this.tooltip2) this.tooltip2.classList.add('opacity-0');
                }
            });
        }

        setupKeyboard(thumb, index) {
            thumb.addEventListener('keydown', (e) => {
                let delta = 0;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -this.step;
                else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = this.step;
                else if (e.key === 'Home') {
                    if (this.isRange) {
                        if (index === 1) this.valStart = this.min;
                    } else {
                        this.val = this.min;
                    }
                    this.render();
                    this.triggerChange();
                    return;
                } else if (e.key === 'End') {
                    if (this.isRange) {
                        if (index === 2) this.valEnd = this.max;
                    } else {
                        this.val = this.max;
                    }
                    this.render();
                    this.triggerChange();
                    return;
                }

                if (delta !== 0) {
                    e.preventDefault();
                    if (this.isRange) {
                        if (index === 1) {
                            this.valStart = this.clamp(this.roundToStep(this.valStart + delta), this.min, this.valEnd);
                        } else {
                            this.valEnd = this.clamp(this.roundToStep(this.valEnd + delta), this.valStart, this.max);
                        }
                    } else {
                        this.val = this.clamp(this.roundToStep(this.val + delta), this.min, this.max);
                    }
                    this.render();
                    this.triggerChange();
                }
            });
        }

        handleTrackClick(e) {
            const rect = this.trackWrap.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = this.clamp(clickX / rect.width, 0, 1);
            const rawVal = this.min + ratio * (this.max - this.min);
            const steppedVal = this.roundToStep(rawVal);

            if (this.isRange) {
                // Determine closer thumb
                const dist1 = Math.abs(steppedVal - this.valStart);
                const dist2 = Math.abs(steppedVal - this.valEnd);
                if (dist1 <= dist2) {
                    this.valStart = Math.min(steppedVal, this.valEnd);
                } else {
                    this.valEnd = Math.max(steppedVal, this.valStart);
                }
            } else {
                this.val = this.clamp(steppedVal, this.min, this.max);
            }

            this.render();
            this.triggerChange();
        }

        stepChange(multiplier) {
            if (this.isRange) return;
            const nextVal = this.roundToStep(this.val + multiplier * this.step);
            this.val = this.clamp(nextVal, this.min, this.max);
            this.render();
            this.triggerChange();
        }

        moveThumbToClientX(clientX, thumbIndex) {
            const rect = this.dragRect || (this.trackWrap ? this.trackWrap.getBoundingClientRect() : null);
            if (!rect || rect.width <= 0) return;
            const ratio = this.clamp((clientX - rect.left) / rect.width, 0, 1);
            const rawVal = this.min + ratio * (this.max - this.min);
            const steppedVal = this.roundToStep(rawVal);

            if (this.isRange) {
                if (thumbIndex === 1) {
                    this.valStart = this.clamp(steppedVal, this.min, this.valEnd);
                } else {
                    this.valEnd = this.clamp(steppedVal, this.valStart, this.max);
                }
            } else {
                this.val = this.clamp(steppedVal, this.min, this.max);
            }

            this.render();
            this.triggerSlide();
        }

        roundToStep(value) {
            const steps = Math.round((value - this.min) / this.step);
            const precision = (this.step.toString().split('.')[1] || '').length;
            const val = this.min + steps * this.step;
            return parseFloat(val.toFixed(precision));
        }

        clamp(num, min, max) {
            return Math.min(Math.max(num, min), max);
        }

        render() {
            const range = this.max - this.min || 1;

            if (this.isRange) {
                const pStart = ((this.valStart - this.min) / range) * 100;
                const pEnd = ((this.valEnd - this.min) / range) * 100;

                if (this.thumb1) this.thumb1.style.left = `${pStart}%`;
                if (this.thumb2) this.thumb2.style.left = `${pEnd}%`;

                if (this.highlightTrack) {
                    this.highlightTrack.style.position = 'absolute';
                    this.highlightTrack.style.top = '0';
                    this.highlightTrack.style.bottom = '0';
                    this.highlightTrack.style.left = `${pStart}%`;
                    this.highlightTrack.style.width = `${Math.max(0, pEnd - pStart)}%`;
                }

                if (this.tooltip1) this.tooltip1.textContent = this.valStart;
                if (this.tooltip2) this.tooltip2.textContent = this.valEnd;

                if (this.valueDisplay) {
                    this.valueDisplay.textContent = `${this.valStart} - ${this.valEnd}`;
                }

                if (this.inputStart) this.inputStart.value = this.valStart;
                if (this.inputEnd) this.inputEnd.value = this.valEnd;
            } else {
                const p = ((this.val - this.min) / range) * 100;

                if (this.thumb1) this.thumb1.style.left = `${p}%`;

                if (this.highlightTrack) {
                    this.highlightTrack.style.position = 'absolute';
                    this.highlightTrack.style.top = '0';
                    this.highlightTrack.style.bottom = '0';
                    this.highlightTrack.style.left = '0%';
                    this.highlightTrack.style.width = `${p}%`;
                }

                if (this.tooltip1) this.tooltip1.textContent = this.val;

                if (this.valueDisplay) {
                    this.valueDisplay.textContent = this.val;
                }

                if (this.inputSingle) this.inputSingle.value = this.val;
            }
        }

        triggerSlide() {
            const value = this.getValue();
            if (this.onSlideCallback && typeof window[this.onSlideCallback] === 'function') {
                window[this.onSlideCallback](value, this);
            }
            this.container.dispatchEvent(new CustomEvent('panoptes-slide', {
                detail: { value: value, slider: this }
            }));
        }

        triggerChange() {
            const value = this.getValue();
            if (this.onChangeCallback && typeof window[this.onChangeCallback] === 'function') {
                window[this.onChangeCallback](value, this);
            }
            this.container.dispatchEvent(new CustomEvent('panoptes-change', {
                detail: { value: value, slider: this }
            }));
        }

        getValue() {
            return this.isRange ? [this.valStart, this.valEnd] : this.val;
        }

        setValue(val) {
            if (this.isRange) return;
            this.val = this.clamp(this.roundToStep(parseFloat(val)), this.min, this.max);
            this.render();
            this.triggerChange();
        }

        setValues(start, end) {
            if (!this.isRange) return;
            const s = this.clamp(this.roundToStep(parseFloat(start)), this.min, this.max);
            const e = this.clamp(this.roundToStep(parseFloat(end)), this.min, this.max);
            this.valStart = Math.min(s, e);
            this.valEnd = Math.max(s, e);
            this.render();
            this.triggerChange();
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.Slider.init());
    } else {
        window.Panoptes.Slider.init();
    }
})();
