using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class TabStripController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    /// <summary>
    /// AJAX / Lazy loading ile dinamik çağrılan sunucu içeriği.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> LazyData()
    {
        // Gerçekçi bir gecikme simülasyonu (300ms)
        await Task.Delay(300);

        var serverTime = DateTime.Now.ToString("HH:mm:ss.fff");
        var html = $@"
            <div class=""space-y-4"">
                <div class=""flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl"">
                    <div class=""flex items-center gap-3"">
                        <span class=""w-3 h-3 rounded-full bg-emerald-500 animate-pulse""></span>
                        <div>
                            <div class=""text-xs font-bold text-emerald-900"">Sunucu Tarafından Canlı Yüklendi (AJAX / Lazy Partial)</div>
                            <div class=""text-[11px] text-emerald-700"">Yanıt Üretim Zamanı: <strong>{serverTime}</strong></div>
                        </div>
                    </div>
                    <span class=""px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900"">HTTP 200 OK</span>
                </div>

                <div class=""grid grid-cols-1 sm:grid-cols-3 gap-3"">
                    <div class=""p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center"">
                        <div class=""text-xs text-slate-500 font-medium"">Aktif Oturumlar</div>
                        <div class=""text-lg font-black text-slate-900 mt-1"">1.842</div>
                    </div>
                    <div class=""p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center"">
                        <div class=""text-xs text-slate-500 font-medium"">CPU Kullanımı</div>
                        <div class=""text-lg font-black text-blue-600 mt-1"">14.2%</div>
                    </div>
                    <div class=""p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center"">
                        <div class=""text-xs text-slate-500 font-medium"">Bellek Havuzu</div>
                        <div class=""text-lg font-black text-purple-600 mt-1"">512 MB / 4 GB</div>
                    </div>
                </div>

                <p class=""text-xs text-slate-600 leading-relaxed"">
                    Bu sekme ilk tıklandığında sunucudan <code class=""text-blue-600 font-mono"">/TabStrip/LazyData</code> adresine asenkron bir istek yapılmış ve sonuç pane içerisine dinamik olarak yerleştirilmiştir. Sonraki sekme geçişlerinde ise otomatik önbellek devrededir.
                </p>
            </div>
        ";

        return Content(html, "text/html; charset=utf-8");
    }
}
