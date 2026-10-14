/**
 * Panoptes OtpInput Component JavaScript Engine
 * Akıllı odaklanma, pano yapıştırma (paste) ve tamamlama destekli SMS doğrulama motoru
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Panoptes = root.Panoptes || {};
        root.Panoptes.OtpInput = factory();
        root.panoptesOtp = root.Panoptes.OtpInput;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var instances = new Map();

    var OtpInstance = function (element, options) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.element) return;

        this.id = this.element.id;
        this.options = options || {};
        this.inputs = Array.from(this.element.querySelectorAll('input[data-otp-index]'));
        this.hiddenInput = this.element.querySelector('input[type="hidden"]');

        this.init();
    };

    OtpInstance.prototype.init = function () {
        var rawConfig = this.element.getAttribute('data-config');
        if (rawConfig) {
            try {
                this.config = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[Panoptes OTP] JSON konfigürasyon çözümlenemedi:', e);
                this.config = {};
            }
        } else {
            this.config = this.options;
        }

        this.length = Number(this.config.length || this.inputs.length || 6);
        this.isNumberOnly = (this.config.type || 'number').toLowerCase() === 'number';

        this.bindEvents();

        if (this.config.autoFocus && this.inputs.length > 0) {
            this.inputs[0].focus();
        }
    };

    OtpInstance.prototype.bindEvents = function () {
        var self = this;

        this.inputs.forEach(function (input, idx) {
            // Klavye Girişi
            input.addEventListener('input', function (e) {
                var val = input.value;

                if (self.isNumberOnly) {
                    val = val.replace(/[^0-9]/g, '');
                    input.value = val;
                }

                if (val.length > 0) {
                    input.value = val[val.length - 1]; // Tek karakter tut
                    if (idx < self.inputs.length - 1) {
                        self.inputs[idx + 1].focus();
                    }
                }

                self.updateState();
            });

            // Özel Tuşlar (Backspace, Sol, Sağ)
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace') {
                    if (input.value === '' && idx > 0) {
                        self.inputs[idx - 1].focus();
                        self.inputs[idx - 1].value = '';
                    } else {
                        input.value = '';
                    }
                    self.updateState();
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft' && idx > 0) {
                    self.inputs[idx - 1].focus();
                    e.preventDefault();
                } else if (e.key === 'ArrowRight' && idx < self.inputs.length - 1) {
                    self.inputs[idx + 1].focus();
                    e.preventDefault();
                }
            });

            // Panodan Yapıştırma (Paste) Desteği
            input.addEventListener('paste', function (e) {
                e.preventDefault();
                var pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
                if (self.isNumberOnly) {
                    pasteData = pasteData.replace(/[^0-9]/g, '');
                }

                if (!pasteData) return;

                for (var i = 0; i < self.inputs.length; i++) {
                    if (i < pasteData.length) {
                        self.inputs[i].value = pasteData[i];
                    }
                }

                var focusIdx = Math.min(pasteData.length, self.inputs.length) - 1;
                if (focusIdx >= 0 && focusIdx < self.inputs.length) {
                    self.inputs[focusIdx].focus();
                }

                self.updateState();
            });

            // Tıklanınca içeriği seç
            input.addEventListener('focus', function () {
                input.select();
            });
        });
    };

    OtpInstance.prototype.updateState = function () {
        var fullVal = this.inputs.map(function (inp) { return inp.value; }).join('');

        if (this.hiddenInput) {
            this.hiddenInput.value = fullVal;
        }

        // Değişiklik CustomEvent
        var changeEv = new CustomEvent('change', {
            detail: { value: fullVal },
            bubbles: true
        });
        this.element.dispatchEvent(changeEv);

        // Tamamlandı mı?
        if (fullVal.length === this.length) {
            var completeEv = new CustomEvent('complete', {
                detail: { value: fullVal },
                bubbles: true
            });
            this.element.dispatchEvent(completeEv);

            var cb = this.config.onComplete;
            if (cb) {
                if (typeof window[cb] === 'function') {
                    window[cb](fullVal);
                } else if (typeof cb === 'function') {
                    cb(fullVal);
                }
            }
        }
    };

    OtpInstance.prototype.setValue = function (code) {
        var val = (code || '').toString().trim();
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].value = i < val.length ? val[i] : '';
        }
        this.updateState();
    };

    OtpInstance.prototype.getValue = function () {
        return this.inputs.map(function (inp) { return inp.value; }).join('');
    };

    OtpInstance.prototype.clear = function () {
        this.inputs.forEach(function (inp) { inp.value = ''; });
        this.updateState();
        if (this.inputs.length > 0) {
            this.inputs[0].focus();
        }
    };

    OtpInstance.prototype.focus = function () {
        if (this.inputs.length > 0) {
            this.inputs[0].focus();
        }
    };

    return {
        init: function (elementOrId, options) {
            var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
            if (!el) return null;

            if (instances.has(el.id)) {
                return instances.get(el.id);
            }

            var instance = new OtpInstance(el, options);
            instances.set(el.id, instance);
            return instance;
        },
        getInstance: function (id) {
            return instances.get(id);
        },
        autoInit: function () {
            var elements = document.querySelectorAll('[data-panoptes-otp="true"]');
            elements.forEach(function (el) {
                if (!instances.has(el.id)) {
                    var instance = new OtpInstance(el);
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
            if (window.Panoptes && window.Panoptes.OtpInput) {
                window.Panoptes.OtpInput.autoInit();
            }
        });
    } else {
        if (window.Panoptes && window.Panoptes.OtpInput) {
            window.Panoptes.OtpInput.autoInit();
        }
    }
}
