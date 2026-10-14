using System.Globalization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Localization;
using Microsoft.Extensions.DependencyInjection;
using Panoptes.AspNetCore.Localization;
using Panoptes.Core.Localization;

namespace Panoptes.AspNetCore.Extensions
{
    public static class LocalizationExtensions
    {
        public static IServiceCollection AddPanoptesLocalization(this IServiceCollection services, string defaultCulture = "tr-TR")
        {
            services.AddLocalization();
            services.AddSingleton<IPanoptesLocalizer, PanoptesLocalizer>();

            var supportedCultures = PanoptesLocales.SupportedCultures
                .Select(c => new CultureInfo(c))
                .ToList();

            services.Configure<RequestLocalizationOptions>(options =>
            {
                options.DefaultRequestCulture = new RequestCulture(defaultCulture);
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;

                // Cookie, QueryString, Header
                options.RequestCultureProviders = new IRequestCultureProvider[]
                {
                    new QueryStringRequestCultureProvider { QueryStringKey = "culture", UIQueryStringKey = "ui-culture" },
                    new CookieRequestCultureProvider(),
                    new AcceptLanguageHeaderRequestCultureProvider()
                };
            });

            return services;
        }

        public static IApplicationBuilder UsePanoptesLocalization(this IApplicationBuilder app)
        {
            return app.UseRequestLocalization();
        }
    }
}
