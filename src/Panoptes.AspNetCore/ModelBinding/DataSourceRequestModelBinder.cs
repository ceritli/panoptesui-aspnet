using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Panoptes.Core.Data;

namespace Panoptes.AspNetCore.ModelBinding;

public class DataSourceRequestModelBinder : IModelBinder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var httpContext = bindingContext.HttpContext;
        var request = httpContext.Request;

        // 1. JSON Body support for POST / PUT
        if (request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true &&
            request.ContentLength > 0)
        {
            try
            {
                httpContext.Request.EnableBuffering();
                using var reader = new StreamReader(request.Body, leaveOpen: true);
                var bodyText = await reader.ReadToEndAsync();
                request.Body.Position = 0;

                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    var result = JsonSerializer.Deserialize<DataSourceRequest>(bodyText, JsonOptions);
                    bindingContext.Result = ModelBindingResult.Success(result ?? new DataSourceRequest());
                    return;
                }
            }
            catch
            {
                // Fall back to query params if JSON parsing fails
            }
        }

        // 2. Query String / Form Data support
        var query = request.Query;
        var dsRequest = new DataSourceRequest();

        if (query.TryGetValue("page", out var pageVal) && int.TryParse(pageVal, out var page))
            dsRequest.Page = Math.Max(1, page);

        if (query.TryGetValue("pageSize", out var pageSizeVal) && int.TryParse(pageSizeVal, out var pageSize))
            dsRequest.PageSize = pageSize;

        if (query.TryGetValue("quickSearch", out var qsVal))
            dsRequest.QuickSearch = qsVal.ToString();

        // Parsing Sorts: e.g. sort=name:asc,price:desc or sorts[0][field]=name&sorts[0][dir]=asc
        if (query.TryGetValue("sort", out var sortStr) && !string.IsNullOrWhiteSpace(sortStr))
        {
            foreach (var part in sortStr.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var sortParts = part.Split(':', StringSplitOptions.TrimEntries);
                if (sortParts.Length > 0 && !string.IsNullOrWhiteSpace(sortParts[0]))
                {
                    dsRequest.Sorts.Add(new SortDescriptor
                    {
                        Field = sortParts[0],
                        Dir = sortParts.Length > 1 ? sortParts[1] : "asc"
                    });
                }
            }
        }

        // Parsing Filter (quick search / single or json-encoded filter)
        if (query.TryGetValue("filter", out var filterStr) && !string.IsNullOrWhiteSpace(filterStr))
        {
            try
            {
                var parsedFilter = JsonSerializer.Deserialize<FilterDescriptor>(filterStr!, JsonOptions);
                if (parsedFilter != null) dsRequest.Filter = parsedFilter;
            }
            catch
            {
                // Simple search keyword fallback
                dsRequest.Filter = new FilterDescriptor
                {
                    Operator = "contains",
                    Value = filterStr.ToString()
                };
            }
        }

        bindingContext.Result = ModelBindingResult.Success(dsRequest);
    }
}
