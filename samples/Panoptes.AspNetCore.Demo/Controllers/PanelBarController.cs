using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class PanelBarController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    [HttpGet]
    public async Task<IActionResult> LazyContent(string section = "security")
    {
        // Simüle edilmiş AJAX gecikmesi (ağ hissi için)
        await Task.Delay(400);

        if (section == "security")
        {
            var html = @"
                <div class='p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-3'>
                    <div class='flex items-center gap-2 text-emerald-700 font-semibold'>
                        <svg class='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/></svg>
                        <span>İki Faktörlü Doğrulama (2FA) Aktif</span>
                    </div>
                    <p class='text-slate-600 leading-relaxed'>
                        Hesabınız Authenticator uygulaması ile korunmaktadır. Son oturum açma işlemi <strong>10.10.2026 04:12</strong> tarihinde İstanbul, Türkiye konumundan gerçekleşti.
                    </p>
                    <div class='flex items-center gap-3 pt-2 border-t border-slate-200 text-xs text-slate-500'>
                        <span class='inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium'>AJAX ile dinamik yüklendi</span>
                        <span>IP: 192.168.1.104</span>
                    </div>
                </div>";
            return Content(html, "text/html");
        }

        var defaultHtml = @"
            <div class='p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm'>
                <p class='text-slate-700 font-medium'>AJAX dinamik içerik başarıyla yüklendi.</p>
                <span class='text-xs text-slate-400'>Yüklenme zamanı: " + DateTime.Now.ToString("HH:mm:ss") + @"</span>
            </div>";
        return Content(defaultHtml, "text/html");
    }
}
