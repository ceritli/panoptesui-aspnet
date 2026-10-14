using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Fluent;

public class CrudActionBuilder
{
    private readonly Action<string?, string?> _setAction;

    public CrudActionBuilder(Action<string?, string?> setAction)
    {
        _setAction = setAction;
    }

    public CrudActionBuilder Url(string url, string method = "POST")
    {
        _setAction(url, method);
        return this;
    }
}

public class DataSourceBuilder
{
    public GridDataSourceConfig Config { get; } = new();
    public int PageSizeValue { get; set; } = 10;

    public DataSourceBuilder Ajax()
    {
        Config.Type = "ajax";
        return this;
    }

    public DataSourceBuilder Read(Action<CrudActionBuilder> config)
    {
        var builder = new CrudActionBuilder((url, method) => {
            Config.ReadUrl = url;
            Config.ReadMethod = method;
        });
        config(builder);
        return this;
    }

    public DataSourceBuilder Create(Action<CrudActionBuilder> config)
    {
        var builder = new CrudActionBuilder((url, method) => {
            Config.CreateUrl = url;
            Config.CreateMethod = method;
        });
        config(builder);
        return this;
    }

    public DataSourceBuilder Update(Action<CrudActionBuilder> config)
    {
        var builder = new CrudActionBuilder((url, method) => {
            Config.UpdateUrl = url;
            Config.UpdateMethod = method;
        });
        config(builder);
        return this;
    }

    public DataSourceBuilder Destroy(Action<CrudActionBuilder> config)
    {
        var builder = new CrudActionBuilder((url, method) => {
            Config.DestroyUrl = url;
            Config.DestroyMethod = method;
        });
        config(builder);
        return this;
    }

    public DataSourceBuilder Batch(Action<CrudActionBuilder> config)
    {
        var builder = new CrudActionBuilder((url, method) => {
            Config.BatchUrl = url;
            Config.BatchMethod = method;
        });
        config(builder);
        return this;
    }

    public DataSourceBuilder PageSize(int pageSize)
    {
        PageSizeValue = pageSize;
        return this;
    }
}
