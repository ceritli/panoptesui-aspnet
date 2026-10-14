using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Threading.Tasks;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-imageeditor")]
    public class ImageEditorTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; }

        [HtmlAttributeName("image-url")]
        public string ImageUrl { get; set; }

        [HtmlAttributeName("width")]
        public string Width { get; set; } = "100%";

        [HtmlAttributeName("height")]
        public string Height { get; set; } = "600px";

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            
            output.Attributes.SetAttribute("id", Id);
            output.Attributes.SetAttribute("class", "panoptes-imageeditor flex flex-col bg-white border border-slate-300 shadow-sm overflow-hidden text-sm");
            output.Attributes.SetAttribute("style", $"width: {Width}; height: {Height};");
            output.Attributes.SetAttribute("data-image-url", ImageUrl);

            // Panoptes Toolbar
            var toolbarHtml = @"
                <div class=""flex items-center gap-1 px-2 py-2 bg-slate-50 border-b border-slate-200 select-none overflow-x-auto"">
                    <!-- File -->
                    <button type=""button"" class=""ie-btn ie-open flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition"" title=""Aç"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12""/></svg>
                    </button>
                    <button type=""button"" class=""ie-btn ie-save flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition"" title=""Kaydet"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4""/></svg>
                    </button>
                    <div class=""w-px h-5 bg-slate-300 mx-1""></div>
                    
                    <!-- History -->
                    <button type=""button"" class=""ie-btn ie-undo flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition disabled:opacity-30 disabled:hover:bg-transparent"" title=""Geri Al"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6""/></svg>
                    </button>
                    <button type=""button"" class=""ie-btn ie-redo flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition disabled:opacity-30 disabled:hover:bg-transparent"" title=""İleri Al"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6""/></svg>
                    </button>
                    <div class=""w-px h-5 bg-slate-300 mx-1""></div>

                    <!-- Tools -->
                    <button type=""button"" class=""ie-btn ie-tool-crop flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded transition font-medium"" title=""Kırp"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M14.348 5.652a2 2 0 00-2.828 0l-8.485 8.485a2 2 0 000 2.828l.707.707m15.556-4.95l-4.95-4.95m4.95 4.95l-8.485 8.485a2 2 0 01-2.828 0l-.707-.707m12.02-12.02L5.86 16.14""/></svg>
                        Kırp
                    </button>
                    <button type=""button"" class=""ie-btn ie-tool-resize flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded transition font-medium"" title=""Yeniden Boyutlandır"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4""/></svg>
                        Yeniden Boyutlandır
                    </button>
                    <button type=""button"" class=""ie-btn ie-tool-colors flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded transition font-medium"" title=""Renkler"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01""/></svg>
                        Renkler
                    </button>
                    <button type=""button"" class=""ie-btn ie-tool-filters flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded transition font-medium"" title=""Filtreler"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z""/></svg>
                        Filtreler
                    </button>
                    <div class=""w-px h-5 bg-slate-300 mx-1""></div>

                    <!-- Zoom -->
                    <button type=""button"" class=""ie-btn ie-zoom-out flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition"" title=""Uzaklaş"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7""/></svg>
                    </button>
                    <select class=""ie-zoom-sel bg-transparent border border-slate-300 text-slate-700 rounded px-2 py-1 mx-1 focus:ring-0 focus:border-blue-500"">
                        <option value=""0.25"">25%</option>
                        <option value=""0.5"">50%</option>
                        <option value=""0.75"">75%</option>
                        <option value=""1"" selected>100%</option>
                        <option value=""1.5"">150%</option>
                        <option value=""2"">200%</option>
                    </select>
                    <button type=""button"" class=""ie-btn ie-zoom-in flex items-center justify-center p-2 text-slate-600 hover:bg-slate-200 rounded transition"" title=""Yaklaş"">
                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7""/></svg>
                    </button>
                </div>
            ";

            var mainHtml = @"
                <div class=""flex-1 flex overflow-hidden relative"">
                    <!-- Canvas Area -->
                    <div class=""ie-canvas-container flex-1 bg-slate-100 relative overflow-auto flex items-center justify-center"" style=""background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;"">
                        <div class=""ie-canvas-wrapper relative cursor-move transition-transform duration-100 shadow-md"">
                            <canvas class=""ie-canvas block""></canvas>
                            <div class=""ie-crop-box hidden absolute border-2 border-dashed border-blue-500 bg-blue-500/10 cursor-move"" style=""resize: both; overflow: hidden; width: 100px; height: 100px; top: 0; left: 0;"">
                                <div class=""absolute bottom-0 right-0 w-4 h-4 bg-blue-600 cursor-se-resize""></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Pane (Options) -->
                    <div class=""ie-right-pane hidden w-64 bg-slate-50 border-l border-slate-200 flex flex-col z-10"">
                        <div class=""p-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center"">
                            <span class=""ie-pane-title"">Ayarlar</span>
                            <button type=""button"" class=""ie-pane-close text-slate-400 hover:text-slate-600"">
                                <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12""/></svg>
                            </button>
                        </div>
                        <div class=""p-4 flex-1 overflow-y-auto"">
                            
                            <!-- Crop Settings -->
                            <div class=""ie-pane-content ie-pane-crop hidden"">
                                <p class=""text-xs text-slate-500 mb-4"">Resim üzerindeki mavi kutuyu sürükleyerek veya boyutlandırarak kırpma alanını seçin.</p>
                                <div class=""mb-3 flex gap-2"">
                                    <div class=""flex-1"">
                                        <label class=""block text-[10px] font-medium text-slate-500 mb-1"">Genişlik</label>
                                        <input type=""number"" class=""ie-crop-w w-full border border-slate-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                    </div>
                                    <div class=""flex-1"">
                                        <label class=""block text-[10px] font-medium text-slate-500 mb-1"">Yükseklik</label>
                                        <input type=""number"" class=""ie-crop-h w-full border border-slate-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                    </div>
                                </div>
                                <div class=""mb-3 flex gap-2"">
                                    <div class=""flex-1"">
                                        <label class=""block text-[10px] font-medium text-slate-500 mb-1"">X Pozisyonu</label>
                                        <input type=""number"" class=""ie-crop-x w-full border border-slate-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                    </div>
                                    <div class=""flex-1"">
                                        <label class=""block text-[10px] font-medium text-slate-500 mb-1"">Y Pozisyonu</label>
                                        <input type=""number"" class=""ie-crop-y w-full border border-slate-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                    </div>
                                </div>
                            </div>

                            <!-- Resize Settings -->
                            <div class=""ie-pane-content ie-pane-resize hidden"">
                                <div class=""mb-3"">
                                    <label class=""block text-xs font-medium text-slate-500 mb-1"">Genişlik</label>
                                    <div class=""flex items-center"">
                                        <input type=""number"" class=""ie-resize-w flex-1 border border-slate-300 rounded-l px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                        <span class=""bg-slate-100 border border-l-0 border-slate-300 rounded-r px-2 py-1.5 text-slate-500"">px</span>
                                    </div>
                                </div>
                                <div class=""mb-4"">
                                    <label class=""block text-xs font-medium text-slate-500 mb-1"">Yükseklik</label>
                                    <div class=""flex items-center"">
                                        <input type=""number"" class=""ie-resize-h flex-1 border border-slate-300 rounded-l px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                        <span class=""bg-slate-100 border border-l-0 border-slate-300 rounded-r px-2 py-1.5 text-slate-500"">px</span>
                                    </div>
                                </div>
                                <div class=""mb-6"">
                                    <label class=""flex items-center gap-2 cursor-pointer"">
                                        <input type=""checkbox"" class=""ie-resize-aspect text-blue-600 rounded border-slate-300"" checked>
                                        <span class=""text-sm text-slate-700"">Orantıyı koru</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Colors Settings -->
                            <div class=""ie-pane-content ie-pane-colors hidden"">
                                <div class=""mb-4"">
                                    <div class=""flex justify-between items-center mb-1"">
                                        <label class=""text-xs font-medium text-slate-500"">Parlaklık</label>
                                        <span class=""ie-val-bright text-[10px] text-slate-400 font-mono"">100%</span>
                                    </div>
                                    <input type=""range"" class=""ie-range-bright w-full accent-blue-600"" min=""0"" max=""200"" value=""100"">
                                </div>
                                <div class=""mb-4"">
                                    <div class=""flex justify-between items-center mb-1"">
                                        <label class=""text-xs font-medium text-slate-500"">Kontrast</label>
                                        <span class=""ie-val-contrast text-[10px] text-slate-400 font-mono"">100%</span>
                                    </div>
                                    <input type=""range"" class=""ie-range-contrast w-full accent-blue-600"" min=""0"" max=""200"" value=""100"">
                                </div>
                                <div class=""mb-4"">
                                    <div class=""flex justify-between items-center mb-1"">
                                        <label class=""text-xs font-medium text-slate-500"">Doygunluk</label>
                                        <span class=""ie-val-saturate text-[10px] text-slate-400 font-mono"">100%</span>
                                    </div>
                                    <input type=""range"" class=""ie-range-saturate w-full accent-blue-600"" min=""0"" max=""200"" value=""100"">
                                </div>
                            </div>
                            
                            <!-- Instagram Filters Settings -->
                            <div class=""ie-pane-content ie-pane-filters hidden"">
                                <p class=""text-xs text-slate-500 mb-4"">Tek tıkla popüler filtrelerden birini uygulayın.</p>
                                <div class=""grid grid-cols-2 gap-2"">
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""none"">Normal</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""contrast(1.2) saturate(1.35)"">Clarendon</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""brightness(1.05) hue-rotate(-10deg)"">Gingham</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""grayscale(1) contrast(1.1) brightness(1.1)"">Moon</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""contrast(0.9) saturate(1.2)"">Lark</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)"">Reyes</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""saturate(1.2) contrast(1.1) hue-rotate(-15deg)"">Juno</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""saturate(0.66) brightness(1.05)"">Slumber</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""sepia(0.5) contrast(1.15) brightness(1.15)"">Crema</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""saturate(1.2) contrast(1.05)"">Ludwig</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)"">Aden</button>
                                    <button type=""button"" class=""ie-preset-btn bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs py-2 rounded transition"" data-filter=""contrast(1.1) brightness(1.1)"">Perpetua</button>
                                </div>
                            </div>
                            
                            <!-- Export/Save Settings -->
                            <div class=""ie-pane-content ie-pane-export hidden"">
                                <div class=""mb-4"">
                                    <label class=""block text-xs font-medium text-slate-500 mb-1"">Dosya Adı</label>
                                    <input type=""text"" class=""ie-export-name w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"" value=""duzenlenmis-resim"">
                                </div>
                                <div class=""mb-4"">
                                    <label class=""block text-xs font-medium text-slate-500 mb-2"">İndirme Boyutu (Piksel)</label>
                                    <div class=""flex gap-2 mb-2"">
                                        <div class=""flex-1"">
                                            <div class=""flex items-center"">
                                                <input type=""number"" class=""ie-export-w flex-1 border border-slate-300 rounded-l px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"">
                                                <span class=""bg-slate-100 border border-l-0 border-slate-300 rounded-r px-1 py-1 text-slate-500 text-[10px]"">W</span>
                                            </div>
                                        </div>
                                        <div class=""flex-1"">
                                            <div class=""flex items-center"">
                                                <input type=""number"" class=""ie-export-h flex-1 border border-slate-300 rounded-l px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"">
                                                <span class=""bg-slate-100 border border-l-0 border-slate-300 rounded-r px-1 py-1 text-slate-500 text-[10px]"">H</span>
                                            </div>
                                        </div>
                                    </div>
                                    <label class=""flex items-center gap-2 cursor-pointer"">
                                        <input type=""checkbox"" class=""ie-export-aspect text-blue-600 rounded border-slate-300"" checked>
                                        <span class=""text-[10px] text-slate-600"">Orantıyı koru</span>
                                    </label>
                                </div>
                                <div class=""mb-4"">
                                    <label class=""block text-xs font-medium text-slate-500 mb-1"">Format</label>
                                    <select class=""ie-export-format w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"">
                                        <option value=""image/jpeg"">JPEG (*.jpg)</option>
                                        <option value=""image/png"">PNG (*.png)</option>
                                        <option value=""image/webp"">WEBP (*.webp)</option>
                                    </select>
                                </div>
                                <div class=""mb-6 ie-export-quality-container"">
                                    <div class=""flex justify-between items-center mb-1"">
                                        <label class=""text-xs font-medium text-slate-500"">Kalite (Sıkıştırma)</label>
                                        <span class=""ie-export-quality-val text-[10px] text-slate-400 font-mono"">90%</span>
                                    </div>
                                    <input type=""range"" class=""ie-export-quality w-full accent-blue-600"" min=""10"" max=""100"" value=""90"">
                                </div>
                                <div class=""mb-4 p-2 bg-blue-50 border border-blue-100 rounded flex justify-between items-center"">
                                    <span class=""text-xs font-medium text-blue-800"">Tahmini Dosya Boyutu:</span>
                                    <span class=""ie-export-size-val text-xs font-bold text-blue-900"">Hesaplanıyor...</span>
                                </div>
                                <div class=""text-center"">
                                    <button type=""button"" class=""ie-btn-download w-full bg-green-600 text-white font-medium py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2"">
                                        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4""/></svg>
                                        Bilgisayara İndir
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class=""ie-pane-footer p-3 border-t border-slate-200 flex gap-2"">
                            <button type=""button"" class=""ie-pane-apply flex-1 bg-blue-600 text-white font-medium py-1.5 rounded hover:bg-blue-700 transition"">Uygula</button>
                            <button type=""button"" class=""ie-pane-cancel flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-1.5 rounded hover:bg-slate-50 transition"">İptal</button>
                        </div>
                    </div>
                </div>
                <input type=""file"" class=""ie-file-input hidden"" accept=""image/*"">
            ";

            output.Content.SetHtmlContent(toolbarHtml + mainHtml);
        }
    }
}
