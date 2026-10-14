using Microsoft.AspNetCore.Mvc.Rendering;

namespace Panoptes.AspNetCore.Fluent;

public class PanoptesHelper<TModel>
{
    private readonly IHtmlHelper<TModel> _htmlHelper;

    public PanoptesHelper(IHtmlHelper<TModel> htmlHelper)
    {
        _htmlHelper = htmlHelper;
    }

    public GridBuilder<T> Grid<T>(string name = "grid")
    {
        return new GridBuilder<T>(name);
    }
}

public static class PanoptesHtmlHelperExtensions
{
    public static PanoptesHelper<TModel> Panoptes<TModel>(this IHtmlHelper<TModel> helper)
    {
        return new PanoptesHelper<TModel>(helper);
    }
}
