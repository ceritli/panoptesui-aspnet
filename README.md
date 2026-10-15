<div align="center">

# 🦅 Panoptes UI for ASP.NET Core
### Modern, Enterprise-Grade UI Components & Razor TagHelpers for .NET 8+

[![NuGet Version](https://img.shields.io/badge/nuget-v1.0.0-blue.svg?logo=nuget)](https://www.nuget.org)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg?logo=dotnet)](https://dotnet.microsoft.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ceritli/panoptesui-aspnet/pulls)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-welcome-orange.svg)](https://github.com/ceritli/panoptesui-aspnet)
[![Website](https://img.shields.io/badge/website-panoptesui.com-indigo.svg)](https://panoptesui.com)

**[🌐 Website](https://panoptesui.com)** &bull; **[🇬🇧 English](#-english-documentation)** &bull; **[🇹🇷 Türkçe](#-türkçe-dokümantasyon)**

</div>

---

## 🇬🇧 English Documentation

### Overview

**Panoptes UI** is an open-source, license-free, modern enterprise UI component ecosystem built for **ASP.NET Core (Razor & TagHelpers)** and Web APIs. It provides high-performance data presentation and management components (DataGrid, TreeList, Scheduler, Gantt, Form components, etc.) with **zero external JavaScript dependencies** and full **Tailwind CSS** compatibility.

Official website: **[https://panoptesui.com](https://panoptesui.com)**

---

### ✨ Key Features

- **🚀 Server-Side Data Engine:** Fast, database-level sorting, filtering, paging, and grouping on `IQueryable` via EF Core (`ToDataSourceResultAsync`).
- **🎯 Razor TagHelper Architecture:** Clean and expressive `<panoptes-grid>`, `<panoptes-column>` tags directly in your `.cshtml` views.
- **⚡ Zero External Dependencies:** Pure vanilla JS and clean CSS runtime without heavy jQuery or bulky external JS runtimes.
- **🎨 Tailwind CSS Native:** Styled for modern web design, fully customizable with Tailwind utility classes.
- **📊 40+ Enterprise Components:** DataGrid, TreeList, Spreadsheet, PivotGrid, Scheduler, Gantt, TaskBoard (Kanban), File Manager, Charts, and advanced form controls.
- **🌍 Built-in Internationalization (i18n):** 18 locales supported out of the box with automatic RTL support.
- **📑 Excel & PDF Export:** Client-side and server-side export engines included.
- **✏️ Flexible Editing Modes:** In-line, in-cell (batch), and modal popup editing.

---

### 📦 NuGet Packages

| Package | Description | Install Command |
| :--- | :--- | :--- |
| **`Panoptes.Core`** | Core dynamic LINQ query engine, DataSourceRequest/Result, sorting & filtering for EF Core & Web APIs. | `dotnet add package Panoptes.Core` |
| **`Panoptes.AspNetCore`** | Razor TagHelpers, UI components, Fluent API, and embedded client assets for ASP.NET Core MVC & Razor Pages. | `dotnet add package Panoptes.AspNetCore` |

---

### ⚡ Quick Start

#### 1. Install the NuGet Package
```bash
dotnet add package Panoptes.AspNetCore
```

#### 2. Register Services in `Program.cs`
```csharp
using Panoptes.AspNetCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddPanoptesLocalization(); // Optional: multi-language localization

var app = builder.Build();

app.UseStaticFiles(); // Required to serve embedded static web assets (_content/...)
app.UsePanoptesLocalization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
```

#### 3. Register TagHelpers in `Views/_ViewImports.cshtml`
```razor
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, Panoptes.AspNetCore
```

#### 4. Include CSS & JS in `Views/Shared/_Layout.cshtml`
```html
<!-- Inside <head> -->
<link rel="stylesheet" href="~/_content/Panoptes.AspNetCore/panoptes/panoptes.css" />

<!-- Before </body> -->
<script src="~/_content/Panoptes.AspNetCore/panoptes/panoptes-grid.js"></script>
```

#### 5. Controller Endpoint (Server-Side Dynamic LINQ)
```csharp
using Microsoft.AspNetCore.Mvc;
using Panoptes.Core.Models;
using Panoptes.Core.Extensions;

public class ProductsController : Controller
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Read([FromBody] DataSourceRequest request)
    {
        // Automatically applies paging, multi-sorting, filtering, and grouping on SQL
        var result = await _db.Products.ToDataSourceResultAsync(request);
        return Ok(result);
    }
}
```

#### 6. Razor View (`Index.cshtml`)
```html
<panoptes-grid id="productsGrid"
               url="/Products/Read"
               method="POST"
               page-size="10"
               page-sizes="10,25,50,100"
               sortable="true"
               filterable="true"
               selectable="true"
               exportable="true"
               searchable="true">
    <panoptes-column field="Id" title="ID" width="70px" align="center" />
    <panoptes-column field="Name" title="Product Name" sortable="true" filterable="true" />
    <panoptes-column field="Category" title="Category" width="160px" sortable="true" />
    <panoptes-column field="Price" title="Price" width="140px" format="currency" align="right" sortable="true" />
    <panoptes-column field="Stock" title="Stock" width="100px" align="center" sortable="true" />
    <panoptes-column field="IsActive" title="Status" width="110px" align="center" sortable="true" />
</panoptes-grid>
```

---

### 🚀 Running the Live Demo

A comprehensive demo application is included in this repository under `samples/Panoptes.AspNetCore.Demo`:

```bash
cd samples/Panoptes.AspNetCore.Demo
dotnet run
```
Navigate to `https://localhost:5001` to explore all 40+ components and live data scenarios.

The demo header has a **Tailwind | Bootstrap** switcher (top right, choice persists in `localStorage`) so you can preview every component under both themes.

---

### 🎨 Bootstrap 5 Theme

Prefer Bootstrap over Tailwind? Swap one stylesheet. `panoptes-bootstrap.css` is a drop-in replacement for `panoptes.css` written in the Bootstrap 5 visual language (colors, radii, focus rings, badges, pagination). The Scheduler inherits automatically through the shared `--panoptes-*` variables.

```html
<!-- Inside <head>, after Bootstrap -->
<link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
<link rel="stylesheet" href="~/_content/Panoptes.AspNetCore/panoptes/panoptes-bootstrap.css" />
<link rel="stylesheet" href="~/_content/Panoptes.AspNetCore/panoptes/panoptes-scheduler.css" />
```

No TagHelper or JS changes needed. The theme tracks Bootstrap's own CSS variables (with fallbacks), so custom Bootstrap palettes apply automatically.

---

### 🤝 Contributing & Community

**Panoptes UI is 100% open source, free, and community-driven!**
Contributions of all forms are warmly welcomed and deeply appreciated:

- 💡 **Suggest Features & Ideas:** Open an [Issue](https://github.com/ceritli/panoptesui-aspnet/issues) to request new components or enhancements.
- 🐛 **Report Bugs:** Help us improve by filing bug reports with steps to reproduce.
- 🚀 **Submit Pull Requests:** Whether it's adding a new component, optimizing performance, fixing documentation typos, or expanding unit tests, everyone is encouraged to submit PRs!
- 💬 **Discussions & Feedback:** Share your questions and project showcase on [GitHub Discussions](https://github.com/ceritli/panoptesui-aspnet/discussions) or visit [panoptesui.com](https://panoptesui.com).

---

<br />

## 🇹🇷 Türkçe Dokümantasyon

### Genel Bakış

**Panoptes UI**, ASP.NET Core (Razor & TagHelpers) ve Web API projeleri için geliştirilmiş, lisans maliyeti olmayan, modern ve kurumsal bir UI bileşen kütüphanesidir. Ağır dış kütüphanelere (jQuery vb.) ihtiyaç duymayan **sıfır bağımlılıklı saf JavaScript** altyapısı ve yerel **Tailwind CSS** desteği ile yüksek performanslı kurumsal arayüzler inşa etmenizi sağlar.

Resmi web sitesi: **[https://panoptesui.com](https://panoptesui.com)**

---

### ✨ Öne Çıkan Yetenekler

- **🚀 Veritabanı Seviyesinde Hız:** Entity Framework Core üzerinde `IQueryable` seviyesinde çalışan dinamik sıralama, filtreleme, sayfalama ve gruplama (`ToDataSourceResultAsync`).
- **🎯 Doğal Razor TagHelper:** `.cshtml` şablonlarında doğrudan `<panoptes-grid>` ve `<panoptes-column>` etiketleri ile deklaratif geliştirme.
- **⚡ Sıfır Dış Bağımlılık:** jQuery veya harici devasa JS kütüphaneleri gerektirmez; hafif, hızlı ve modern vanilla JS çekirdeğine sahiptir.
- **🎨 Tailwind CSS Uyumlu:** Modern kurumsal tasarım standartları, koyu/açık tema uyumu ve şık mikro animasyonlar. Bootstrap 5 severler için `panoptes-bootstrap.css` teması da dahildir.
- **📊 40+ Kurumsal Bileşen:** DataGrid, TreeList, Spreadsheet (Excel Benzeri Hesap Tablosu), PivotGrid, Scheduler (Randevu/Takvim), Gantt (İş Çizelgesi), TaskBoard (Kanban), FileManager, Vektörel Grafikler ve Zengin Form kontrolleri.
- **🌍 18 Dil ve RTL Desteği:** Türkçe, İngilizce, Almanca, Fransızca, Arapça (RTL) dahil 18 dilde otomatik lokalizasyon.
- **📑 Excel ve PDF Çıktısı:** Tablolarda tek tıkla Excel (.xlsx, .csv) ve PDF dışa aktarma.
- **✏️ Çoklu Düzenleme Modları:** Satır içi (In-line), hücre içi toplu (In-cell batch) ve modal pencere (Popup) düzenleme.

---

### 📦 NuGet Paketleri

| Paket | Açıklama | Kurulum Komutu |
| :--- | :--- | :--- |
| **`Panoptes.Core`** | Dinamik LINQ motoru, DataSourceRequest/Result, EF Core sorgulama ve filtreleme motoru. | `dotnet add package Panoptes.Core` |
| **`Panoptes.AspNetCore`** | Razor TagHelper'ları, UI bileşenleri, Fluent API ve gömülü web varlıkları (JS/CSS). | `dotnet add package Panoptes.AspNetCore` |

---

### ⚡ Hızlı Kurulum

#### 1. NuGet Paketini Ekleyin
```bash
dotnet add package Panoptes.AspNetCore
```

#### 2. `Program.cs` Servis ve Middleware Yapılandırması
```csharp
using Panoptes.AspNetCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddPanoptesLocalization(); // Çoklu dil desteği

var app = builder.Build();

app.UseStaticFiles(); // Gömülü statik dosyaların (_content/...) sunulması için şarttır
app.UsePanoptesLocalization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
```

#### 3. TagHelper Tanımı (`Views/_ViewImports.cshtml`)
```razor
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, Panoptes.AspNetCore
```

#### 4. Stil ve Script Bağlantıları (`Views/Shared/_Layout.cshtml`)
```html
<!-- <head> içine -->
<link rel="stylesheet" href="~/_content/Panoptes.AspNetCore/panoptes/panoptes.css" />

<!-- <body> sonuna -->
<script src="~/_content/Panoptes.AspNetCore/panoptes/panoptes-grid.js"></script>
```

#### 5. Controller (Veritabanı Sorgu Uç Noktası)
```csharp
using Microsoft.AspNetCore.Mvc;
using Panoptes.Core.Models;
using Panoptes.Core.Extensions;

public class UrunlerController : Controller
{
    private readonly AppDbContext _context;
    public UrunlerController(AppDbContext context) => _context = context;

    [HttpPost]
    public async Task<IActionResult> Read([FromBody] DataSourceRequest request)
    {
        // Gelen sayfalama, filtre ve sıralama parametreleri doğrudan SQL sorgusuna çevrilir:
        var result = await _context.Products.ToDataSourceResultAsync(request);
        return Ok(result);
    }
}
```

#### 6. Razor Görünümü (`Index.cshtml`)
```html
<panoptes-grid id="urunlerGrid"
               url="/Urunler/Read"
               method="POST"
               page-size="10"
               page-sizes="10,25,50,100"
               sortable="true"
               filterable="true"
               selectable="true"
               exportable="true"
               searchable="true">
    <panoptes-column field="Id" title="ID" width="70px" align="center" />
    <panoptes-column field="Name" title="Ürün Adı" sortable="true" filterable="true" />
    <panoptes-column field="Category" title="Kategori" width="160px" sortable="true" />
    <panoptes-column field="Price" title="Fiyat" width="130px" format="currency" align="right" sortable="true" />
    <panoptes-column field="Stock" title="Stok" width="90px" align="center" sortable="true" />
    <panoptes-column field="IsActive" title="Durum" width="110px" align="center" sortable="true" />
</panoptes-grid>
```

---

### 🚀 Canlı Demoyu Çalıştırma

Tüm bileşenleri ve kullanım senaryolarını canlı görmek için:

```bash
cd samples/Panoptes.AspNetCore.Demo
dotnet run
```
Tarayıcınızda `https://localhost:5001` adresine giderek 40'tan fazla bileşeni canlı olarak test edebilirsiniz.

---

### 🤝 Katkıda Bulunma (Herkesin Katkısına Tamamen Açık!)

**Panoptes UI %100 açık kaynaklıdır ve topluluk katkılarına sonuna kadar açıktır!**
Projeyi daha da geliştirmek ve büyütmek isteyen herkesin katılımını ve katkısını bekliyoruz. Deneyim seviyeniz ne olursa olsun aramıza katılabilirsiniz:

- 💡 **Fikir ve Özellik Önerileri:** Projede görmek istediğiniz yeni bir bileşen veya özellik mi var? Yeni bir [Issue (Konu)](https://github.com/ceritli/panoptesui-aspnet/issues) açarak bize iletebilirsiniz.
- 🐛 **Hata Bildirimi:** Karşılaştığınız herhangi bir sorunu detaylarıyla paylaşarak çözümüne katkı sağlayabilirsiniz.
- 🚀 **Pull Request (Kod ve Dokümantasyon Katkısı):** Repoyu fork edip dilediğiniz geliştirmeyi yaparak Pull Request gönderebilirsiniz. Dokümantasyondaki küçük bir yazım düzeltmesinden sıfırdan yeni bir UI bileşenine kadar her katkı bizim için çok kıymetlidir.
- 💬 **Geri Bildirim & İletişim:** Kullanım deneyimlerinizi, sorularınızı ve önerilerinizi [GitHub Discussions](https://github.com/ceritli/panoptesui-aspnet/discussions) üzerinden veya [panoptesui.com](https://panoptesui.com) adresinden paylaşabilirsiniz.

---

### 📄 Lisans

Bu proje **[MIT Lisansı](LICENSE)** ile lisanslanmıştır. Ticari ve kişisel projelerinizde lisans ücreti ödemeden özgürce kullanabilirsiniz.

Daha fazla bilgi ve dokümantasyon için: **[https://panoptesui.com](https://panoptesui.com)**
