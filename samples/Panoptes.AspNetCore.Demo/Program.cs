using Microsoft.EntityFrameworkCore;
using Panoptes.AspNetCore.Demo.Data;
using Panoptes.AspNetCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddPanoptesLocalization();
builder.Services.AddDbContext<DemoDbContext>(opt => opt.UseInMemoryDatabase("PanoptesDemoDb"));

var app = builder.Build();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DemoDbContext>();
    DemoDbContext.Seed(db);
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UsePanoptesLocalization();

// /en URL prefix middleware for language routing
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    if (path.Equals("/en", StringComparison.OrdinalIgnoreCase))
    {
        var culture = new System.Globalization.CultureInfo("en-US");
        System.Globalization.CultureInfo.CurrentCulture = culture;
        System.Globalization.CultureInfo.CurrentUICulture = culture;
        context.Request.Path = "/";
        context.Items["IsEn"] = true;
    }
    else if (path.StartsWith("/en/", StringComparison.OrdinalIgnoreCase))
    {
        var culture = new System.Globalization.CultureInfo("en-US");
        System.Globalization.CultureInfo.CurrentCulture = culture;
        System.Globalization.CultureInfo.CurrentUICulture = culture;
        context.Request.Path = path.Substring(3); // strip /en prefix
        context.Items["IsEn"] = true;
    }

    await next();
});

// HTML Translation Middleware for /en requests
app.Use(async (context, next) =>
{
    var isEn = context.Items.ContainsKey("IsEn") && (bool)context.Items["IsEn"]!;
    if (!isEn)
    {
        await next();
        return;
    }

    var originalBodyStream = context.Response.Body;
    await using var memoryStream = new MemoryStream();
    context.Response.Body = memoryStream;

    await next();

    memoryStream.Seek(0, SeekOrigin.Begin);
    var contentType = context.Response.ContentType ?? "";
    if (contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase))
    {
        using var reader = new StreamReader(memoryStream, System.Text.Encoding.UTF8, leaveOpen: true);
        var html = await reader.ReadToEndAsync();
        var translatedHtml = Panoptes.AspNetCore.Demo.Services.PanoptesPageTranslator.TranslateHtml(html);
        var bytes = System.Text.Encoding.UTF8.GetBytes(translatedHtml);

        context.Response.Body = originalBodyStream;
        context.Response.ContentLength = bytes.Length;
        await originalBodyStream.WriteAsync(bytes);
    }
    else
    {
        context.Response.Body = originalBodyStream;
        await memoryStream.CopyToAsync(originalBodyStream);
    }
});

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
