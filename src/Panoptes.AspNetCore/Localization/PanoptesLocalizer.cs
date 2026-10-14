using System.Globalization;
using Panoptes.Core.Localization;

namespace Panoptes.AspNetCore.Localization
{
    public interface IPanoptesLocalizer
    {
        PanoptesLocaleInfo Current { get; }
        PanoptesLocaleInfo GetLocale(string codeOrCulture);
    }

    public class PanoptesLocalizer : IPanoptesLocalizer
    {
        public PanoptesLocaleInfo Current
        {
            get
            {
                var cultureName = CultureInfo.CurrentUICulture.Name;
                return PanoptesLocales.Get(cultureName);
            }
        }

        public PanoptesLocaleInfo GetLocale(string codeOrCulture)
        {
            return PanoptesLocales.Get(codeOrCulture);
        }
    }
}
