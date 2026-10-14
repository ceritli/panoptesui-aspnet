using System.Collections;
using System.Linq.Dynamic.Core;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Panoptes.Core.Data;

namespace Panoptes.Core.Extensions;

public static class QueryableExtensions
{
    public static DataSourceResult ToDataSourceResult<T>(this IQueryable<T> query, DataSourceRequest request)
    {
        var filteredQuery = query.ApplyQuickSearch(request.QuickSearch).ApplyFiltering(request.Filter);
        var total = filteredQuery.Count();

        var aggregates = CalculateAggregates(filteredQuery, request.Aggregates);

        // Grouping handling
        if (request.Groups != null && request.Groups.Count > 0)
        {
            var rawList = filteredQuery.ApplySorting(request.Sorts).ToList();
            var groupedData = ApplyGroupingInMemory(rawList, request.Groups, request.Page, request.PageSize);
            return new DataSourceResult
            {
                Data = groupedData,
                Total = total,
                Aggregates = aggregates
            };
        }

        var sortedQuery = filteredQuery.ApplySorting(request.Sorts);
        var pagedQuery = sortedQuery.ApplyPaging(request.Page, request.PageSize);

        var data = pagedQuery.ToList();

        return new DataSourceResult
        {
            Data = data,
            Total = total,
            Aggregates = aggregates
        };
    }

    public static async Task<DataSourceResult> ToDataSourceResultAsync<T>(
        this IQueryable<T> query,
        DataSourceRequest request,
        CancellationToken cancellationToken = default)
    {
        var filteredQuery = query.ApplyQuickSearch(request.QuickSearch).ApplyFiltering(request.Filter);
        
        int total;
        try
        {
            total = await filteredQuery.CountAsync(cancellationToken);
        }
        catch (InvalidOperationException)
        {
            total = filteredQuery.Count();
        }

        var aggregates = CalculateAggregates(filteredQuery, request.Aggregates);

        // Grouping handling
        if (request.Groups != null && request.Groups.Count > 0)
        {
            List<T> rawList;
            try
            {
                rawList = await filteredQuery.ApplySorting(request.Sorts).ToListAsync(cancellationToken);
            }
            catch (InvalidOperationException)
            {
                rawList = filteredQuery.ApplySorting(request.Sorts).ToList();
            }

            var groupedData = ApplyGroupingInMemory(rawList, request.Groups, request.Page, request.PageSize);
            return new DataSourceResult
            {
                Data = groupedData,
                Total = total,
                Aggregates = aggregates
            };
        }

        var sortedQuery = filteredQuery.ApplySorting(request.Sorts);
        var pagedQuery = sortedQuery.ApplyPaging(request.Page, request.PageSize);

        List<T> data;
        try
        {
            data = await pagedQuery.ToListAsync(cancellationToken);
        }
        catch (InvalidOperationException)
        {
            data = pagedQuery.ToList();
        }

        return new DataSourceResult
        {
            Data = data,
            Total = total,
            Aggregates = aggregates
        };
    }


    public static IQueryable<T> ApplyQuickSearch<T>(this IQueryable<T> query, string? term)
    {
        if (string.IsNullOrWhiteSpace(term)) return query;
        term = term.Trim().ToLowerInvariant();

        var stringProps = typeof(T).GetProperties()
            .Where(p => p.PropertyType == typeof(string) && p.CanRead)
            .ToList();

        if (stringProps.Count == 0) return query;

        var predicateParts = stringProps.Select(p => $"({p.Name} != null and {p.Name}.ToLower().Contains(@0))");
        var predicate = string.Join(" or ", predicateParts);

        return query.Where(predicate, term);
    }

    public static IQueryable<T> ApplyFiltering<T>(this IQueryable<T> query, FilterDescriptor? filter)
    {
        if (filter == null) return query;

        var parameters = new List<object>();
        var predicate = BuildFilterExpression(filter, parameters);

        if (string.IsNullOrWhiteSpace(predicate)) return query;

        return query.Where(predicate, parameters.ToArray());
    }

    public static IQueryable<T> ApplySorting<T>(this IQueryable<T> query, List<SortDescriptor>? sorts)
    {
        if (sorts == null || sorts.Count == 0) return query;

        var validSorts = sorts
            .Where(s => !string.IsNullOrWhiteSpace(s.Field))
            .Select(s => $"{s.Field} {(s.IsAscending ? "asc" : "desc")}");

        var sortExpression = string.Join(", ", validSorts);
        if (string.IsNullOrWhiteSpace(sortExpression)) return query;

        return query.OrderBy(sortExpression);
    }

    public static IQueryable<T> ApplyPaging<T>(this IQueryable<T> query, int page, int pageSize)
    {
        if (pageSize <= 0) return query;

        var currentPage = Math.Max(1, page);
        var skip = (currentPage - 1) * pageSize;
        return query.Skip(skip).Take(pageSize);
    }

    private static IEnumerable ApplyGroupingInMemory<T>(List<T> items, List<GroupDescriptor> groups, int page, int pageSize)
    {
        var primaryGroup = groups.First();
        var field = primaryGroup.Field;
        var inMemoryQuery = items.AsQueryable();

        var dynamicQuery = inMemoryQuery.GroupBy(field, "it").Select("new (Key, Count() as Count, it as Items)");
        
        var list = new List<PanoptesGroupResult>();
        foreach (dynamic g in dynamicQuery)
        {
            var itemsList = new List<object>();
            foreach (var item in g.Items)
            {
                itemsList.Add(item);
            }

            list.Add(new PanoptesGroupResult
            {
                Field = field,
                Key = g.Key,
                Count = g.Count,
                Items = itemsList
            });
        }

        if (primaryGroup.IsAscending)
            list = list.OrderBy(x => x.Key?.ToString()).ToList();
        else
            list = list.OrderByDescending(x => x.Key?.ToString()).ToList();

        if (pageSize > 0)
        {
            var currentPage = Math.Max(1, page);
            return list.Skip((currentPage - 1) * pageSize).Take(pageSize).ToList();
        }

        return list;
    }

    private static Dictionary<string, object?>? CalculateAggregates<T>(IQueryable<T> query, List<AggregateDescriptor>? aggregates)
    {
        if (aggregates == null || aggregates.Count == 0) return null;

        var result = new Dictionary<string, object?>();
        foreach (var agg in aggregates)
        {
            if (string.IsNullOrWhiteSpace(agg.Field)) continue;
            var key = $"{agg.Field}_{agg.Aggregate.ToLowerInvariant()}";

            try
            {
                var val = agg.Aggregate.ToLowerInvariant() switch
                {
                    "count" => query.Select(agg.Field).Count(),
                    "sum" => query.Select(agg.Field).Sum(),
                    "average" or "avg" => query.Select(agg.Field).Average(),
                    "min" => query.Select(agg.Field).Min(),
                    "max" => query.Select(agg.Field).Max(),
                    _ => null
                };
                result[key] = val;
            }
            catch
            {
                // Soft fail on incompatible type for aggregate
            }
        }

        return result;
    }

    private static string BuildFilterExpression(FilterDescriptor filter, List<object> parameters)
    {
        if (filter.IsComposite)
        {
            var validFilters = filter.Filters
                .Select(child => BuildFilterExpression(child, parameters))
                .Where(expr => !string.IsNullOrWhiteSpace(expr))
                .ToList();

            if (validFilters.Count == 0) return string.Empty;

            var op = string.Equals(filter.Logic, "or", StringComparison.OrdinalIgnoreCase) ? " or " : " and ";
            return $"({string.Join(op, validFilters)})";
        }

        if (string.IsNullOrWhiteSpace(filter.Field)) return string.Empty;

        var field = filter.Field;
        var opType = (filter.Operator ?? "eq").ToLowerInvariant();
        var val = NormalizeFilterValue(filter.Value);

        if (opType is "isnull" or "is-null") return $"{field} == null";
        if (opType is "isnotnull" or "is-not-null") return $"{field} != null";
        if (opType is "isempty" or "is-empty") return $"{field} == \"\"";
        if (opType is "isnotempty" or "is-not-empty") return $"{field} != \"\"";

        if (val == null) return string.Empty;

        var paramIndex = parameters.Count;
        parameters.Add(val);

        return opType switch
        {
            "eq" or "isequalto" => $"{field} == @{paramIndex}",
            "neq" or "isnotequalto" => $"{field} != @{paramIndex}",
            "gt" or "isgreaterthan" => $"{field} > @{paramIndex}",
            "gte" or "isgreaterthanorequalto" => $"{field} >= @{paramIndex}",
            "lt" or "islessthan" => $"{field} < @{paramIndex}",
            "lte" or "islessthanorequalto" => $"{field} <= @{paramIndex}",
            "contains" => $"{field} != null && {field}.ToLower().Contains(@{paramIndex}.ToString().ToLower())",
            "doesnotcontain" => $"{field} == null || !{field}.ToLower().Contains(@{paramIndex}.ToString().ToLower())",
            "startswith" => $"{field} != null && {field}.ToLower().StartsWith(@{paramIndex}.ToString().ToLower())",
            "endswith" => $"{field} != null && {field}.ToLower().EndsWith(@{paramIndex}.ToString().ToLower())",
            _ => $"{field} == @{paramIndex}"
        };
    }

    private static object? NormalizeFilterValue(object? value)
    {
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.String => jsonElement.GetString(),
                JsonValueKind.Number when jsonElement.TryGetInt64(out var l) => l,
                JsonValueKind.Number when jsonElement.TryGetDouble(out var d) => d,
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                _ => jsonElement.ToString()
            };
        }
        return value;
    }
}
