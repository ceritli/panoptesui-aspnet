/**
 * Panoptes PDFViewer Component
 * Interactive PDF Document Reader, Page Navigation, Zoom, Print, Download
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.PDFViewer = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-pdfviewer="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new PDFViewerComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        nextPage: function(id) {
            const inst = this.get(id);
            if (inst) inst.nextPage();
        },

        prevPage: function(id) {
            const inst = this.get(id);
            if (inst) inst.prevPage();
        },

        goToPage: function(id, num) {
            const inst = this.get(id);
            if (inst) inst.goToPage(num);
        },

        setZoom: function(id, scale) {
            const inst = this.get(id);
            if (inst) inst.setZoom(scale);
        },

        print: function(id) {
            const inst = this.get(id);
            if (inst) inst.print();
        },

        download: function(id) {
            const inst = this.get(id);
            if (inst) inst.download();
        }
    };

    class PDFViewerComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.totalPages = parseInt(element.dataset.totalPages) || 3;
            this.source = element.dataset.src || null;
            this.onPageChangeCb = element.dataset.onPageChange || null;

            this.currentPage = 1;
            this.zoomScale = 1.0;

            this.btnPrev = element.querySelector('.panoptes-pdf-btn-prev');
            this.btnNext = element.querySelector('.panoptes-pdf-btn-next');
            this.pageInput = element.querySelector('.panoptes-pdf-page-input');
            this.btnZoomIn = element.querySelector('.panoptes-pdf-btn-zoom-in');
            this.btnZoomOut = element.querySelector('.panoptes-pdf-btn-zoom-out');
            this.btnZoomFit = element.querySelector('.panoptes-pdf-btn-zoom-fit');
            this.zoomLabel = element.querySelector('.panoptes-pdf-zoom-label');
            this.btnPrint = element.querySelector('.panoptes-pdf-btn-print');
            this.btnDownload = element.querySelector('.panoptes-pdf-btn-download');

            this.stage = element.querySelector('.panoptes-pdf-stage');
            this.pageContent = element.querySelector('.panoptes-pdf-page-content');

            this.bindEvents();
            this.renderPage(1);
        }

        bindEvents() {
            if (this.btnPrev) {
                this.btnPrev.addEventListener('click', () => this.prevPage());
            }

            if (this.btnNext) {
                this.btnNext.addEventListener('click', () => this.nextPage());
            }

            if (this.pageInput) {
                this.pageInput.addEventListener('change', () => {
                    const num = parseInt(this.pageInput.value) || 1;
                    this.goToPage(num);
                });
            }

            if (this.btnZoomIn) {
                this.btnZoomIn.addEventListener('click', () => this.setZoom(this.zoomScale + 0.15));
            }

            if (this.btnZoomOut) {
                this.btnZoomOut.addEventListener('click', () => this.setZoom(this.zoomScale - 0.15));
            }

            if (this.btnZoomFit) {
                this.btnZoomFit.addEventListener('click', () => this.setZoom(1.0));
            }

            if (this.btnPrint) {
                this.btnPrint.addEventListener('click', () => this.print());
            }

            if (this.btnDownload) {
                this.btnDownload.addEventListener('click', () => this.download());
            }
        }

        prevPage() {
            if (this.currentPage > 1) {
                this.goToPage(this.currentPage - 1);
            }
        }

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.goToPage(this.currentPage + 1);
            }
        }

        goToPage(pageNum) {
            pageNum = Math.max(1, Math.min(this.totalPages, pageNum));
            this.currentPage = pageNum;
            if (this.pageInput) this.pageInput.value = pageNum;

            if (this.btnPrev) this.btnPrev.disabled = (this.currentPage <= 1);
            if (this.btnNext) this.btnNext.disabled = (this.currentPage >= this.totalPages);

            this.renderPage(pageNum);

            if (this.onPageChangeCb && typeof window[this.onPageChangeCb] === 'function') {
                window[this.onPageChangeCb](pageNum, this);
            }

            this.container.dispatchEvent(new CustomEvent('panoptes-pdfviewer-page', {
                detail: { page: pageNum, totalPages: this.totalPages, viewer: this }
            }));
        }

        setZoom(scale) {
            this.zoomScale = Math.max(0.5, Math.min(2.5, scale));
            if (this.stage) {
                this.stage.style.transform = `scale(${this.zoomScale})`;
            }
            if (this.zoomLabel) {
                this.zoomLabel.textContent = `${Math.round(this.zoomScale * 100)}%`;
            }
        }

        print() {
            window.print();
        }

        download() {
            if (this.source) {
                const a = document.createElement('a');
                a.href = this.source;
                a.download = 'dokuman.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert('Döküman indirme işlemi başlatıldı.');
            }
        }

        renderPage(pageNum) {
            if (!this.pageContent) return;

            if (pageNum === 1) {
                this.pageContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                            <div>
                                <h1 class="text-xl font-black text-slate-900 tracking-tight">PANOPTES YAZILIM HİZMETLERİ</h1>
                                <p class="text-xs text-slate-500">Kurumsal Yazılım Çerçevesi ve Bileşen Kütüphanesi</p>
                            </div>
                            <span class="text-xs font-mono font-bold text-slate-400">SAYFA 1 / ${this.totalPages}</span>
                        </div>

                        <div class="pt-2">
                            <h2 class="text-base font-bold text-slate-800 uppercase tracking-wide">Yazılım Lisans ve Hizmet Sözleşmesi</h2>
                            <p class="text-xs text-slate-500 mt-1">Sözleşme No: <strong>PNP-2026-X88</strong> • Düzenleme Tarihi: <strong>10.10.2026</strong></p>
                        </div>

                        <div class="space-y-3 text-xs text-slate-700 leading-relaxed">
                            <p><strong>1. TARAFLAR:</strong> İşbu sözleşme, bir tarafta <em>Panoptes Teknoloji A.Ş.</em> (bundan böyle "Hizmet Sağlayıcı" olarak anılacaktır) ile diğer tarafta kullanıcı kurumu temsil eden yetkili müşteri arasında akdedilmiştir.</p>
                            
                            <p><strong>2. SÖZLEŞMENİN KONUSU:</strong> Panoptes ASP.NET Core UI bileşen setinin kurumsal intranet, bulut portalları ve B2B iş uygulamalarında ticari kullanım hakları, teknik destek garantisi ve lisanslama şartlarını kapsar.</p>

                            <p><strong>3. GÜVENLİK VE GİZLİLİK:</strong> Panoptes kütüphanesi hiçbir harici üçüncü taraf sunucuya veri sızdırmaz; tamamen kurum içi (On-Premise) ve özel bulut ortamlarında bağımsız çalışacak biçimde mimarilendirilmiştir.</p>
                        </div>

                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                            <div class="font-bold text-slate-800 mb-1">Kurumsal Taahhüt Özeti:</div>
                            <p>Tüm arayüz bileşenleri modern kurumsal standartlarda eksiksiz yetenekler sağlamakta olup sıfır harici kütüphane ve sıfır jQuery bağımlılığı garantisi sunar.</p>
                        </div>
                    </div>

                    <div class="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PANOPTES ENTERPRISE SOFTWARE SUITE</span>
                        <span>DÖKÜMAN GÜVENLİK SINIFI: TİCARİ GİZLİ</span>
                    </div>
                `;
            } else if (pageNum === 2) {
                this.pageContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                            <div>
                                <h1 class="text-xl font-black text-slate-900 tracking-tight">HİZMET KAPSAMI VE FİYATLANDIRMA</h1>
                                <p class="text-xs text-slate-500">Bileşen Modülleri ve SLA Garanti Şartları</p>
                            </div>
                            <span class="text-xs font-mono font-bold text-slate-400">SAYFA 2 / ${this.totalPages}</span>
                        </div>

                        <div class="space-y-3 text-xs text-slate-700 leading-relaxed">
                            <p><strong>4. MODÜL VE HİZMET LİSTESİ:</strong> Lisans kapsamında yer alan Panoptes bileşenleri ve teknik destek seviyeleri aşağıdaki tabloda detaylandırılmıştır.</p>
                        </div>

                        <table class="w-full border-collapse border border-slate-300 text-xs">
                            <thead>
                                <tr class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                    <th class="border border-slate-300 p-2 text-left">Paket / Modül</th>
                                    <th class="border border-slate-300 p-2 text-left">Bileşen Seti</th>
                                    <th class="border border-slate-300 p-2 text-center">SLA Desteği</th>
                                    <th class="border border-slate-300 p-2 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                                <tr>
                                    <td class="border border-slate-300 p-2 font-bold">Data & Grid Suite</td>
                                    <td class="border border-slate-300 p-2">Grid, TreeList, PivotGrid, ListView</td>
                                    <td class="border border-slate-300 p-2 text-center font-mono">7/24 Öncelikli</td>
                                    <td class="border border-slate-300 p-2 text-right text-emerald-600 font-bold">Aktif</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-300 p-2 font-bold">Navigation & Layout</td>
                                    <td class="border border-slate-300 p-2">Drawer, Splitter, TabStrip, Stepper</td>
                                    <td class="border border-slate-300 p-2 text-center font-mono">Standart</td>
                                    <td class="border border-slate-300 p-2 text-right text-emerald-600 font-bold">Aktif</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-300 p-2 font-bold">Media & Documents</td>
                                    <td class="border border-slate-300 p-2">PDFViewer, MediaPlayer, Signature, Upload</td>
                                    <td class="border border-slate-300 p-2 text-center font-mono">7/24 Öncelikli</td>
                                    <td class="border border-slate-300 p-2 text-right text-emerald-600 font-bold">Aktif</td>
                                </tr>
                            </tbody>
                        </table>

                        <p class="text-xs text-slate-600">Yukarıdaki fiyatlandırma 1 (bir) yıllık kurumsal sınırsız geliştirici lisansını ve sürüm güncellemelerini kapsar.</p>
                    </div>

                    <div class="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PANOPTES ENTERPRISE SOFTWARE SUITE</span>
                        <span>SAYFA 2 / ${this.totalPages}</span>
                    </div>
                `;
            } else {
                this.pageContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                            <div>
                                <h1 class="text-xl font-black text-slate-900 tracking-tight">İMZA VE YÜRÜRLÜK PROTOKOLÜ</h1>
                                <p class="text-xs text-slate-500">Resmi Onay ve Yetkili İmzalar</p>
                            </div>
                            <span class="text-xs font-mono font-bold text-slate-400">SAYFA 3 / ${this.totalPages}</span>
                        </div>

                        <div class="space-y-3 text-xs text-slate-700 leading-relaxed">
                            <p><strong>5. YÜRÜRLÜK:</strong> 3 sayfadan müteşekkil işbu sözleşme taraflarca okunup mutabık kalınarak 10.10.2026 tarihinde elektronik ortamda onaylanmış ve yürürlüğe girmiştir.</p>
                        </div>

                        <div class="grid grid-cols-2 gap-8 pt-8">
                            <div class="p-4 border border-slate-300 rounded-xl space-y-3 bg-slate-50/50">
                                <div class="text-xs font-bold text-slate-800 uppercase">Hizmet Sağlayıcı:</div>
                                <div class="text-xs text-slate-600 font-semibold">Panoptes Teknoloji A.Ş.</div>
                                <div class="h-20 border-b border-dashed border-slate-400 flex items-end pb-2">
                                    <span class="font-serif italic text-blue-700 text-lg">Panoptes Signature Core</span>
                                </div>
                                <div class="text-[10px] text-slate-400">Tarih: 10.10.2026 • Kaşe & İmza</div>
                            </div>

                            <div class="p-4 border border-slate-300 rounded-xl space-y-3 bg-slate-50/50">
                                <div class="text-xs font-bold text-slate-800 uppercase">Müşteri / Kurum:</div>
                                <div class="text-xs text-slate-600 font-semibold">Yetkili Kurumsal Müşteri</div>
                                <div class="h-20 border-b border-dashed border-slate-400 flex items-end pb-2">
                                    <span class="font-serif italic text-emerald-700 text-lg">Onaylandı</span>
                                </div>
                                <div class="text-[10px] text-slate-400">Tarih: 10.10.2026 • Kaşe & İmza</div>
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PANOPTES ENTERPRISE SOFTWARE SUITE</span>
                        <span>SAYFA 3 / ${this.totalPages} • PROTOKOL TAMAMLANDI</span>
                    </div>
                `;
            }
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.PDFViewer.init());
    } else {
        window.Panoptes.PDFViewer.init();
    }
})();
