using System.Linq.Expressions;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Fluent;

public class GridColumnBuilder<T>
{
    public GridColumn Column { get; } = new();

    public GridColumnBuilder(string? field = null)
    {
        Column.Field = field;
        Column.Title = field;
    }

    public GridColumnBuilder<T> Title(string title) { Column.Title = title; return this; }
    public GridColumnBuilder<T> Width(string width) { Column.Width = width; return this; }
    public GridColumnBuilder<T> Sortable(bool sortable = true) { Column.Sortable = sortable; return this; }
    public GridColumnBuilder<T> Filterable(bool filterable = true) { Column.Filterable = filterable; return this; }
    public GridColumnBuilder<T> Frozen(bool frozen = true) { Column.Frozen = frozen; return this; }
    public GridColumnBuilder<T> Editable(bool editable = true) { Column.Editable = editable; return this; }
    public GridColumnBuilder<T> EditorType(string editorType) { Column.EditorType = editorType; return this; }
    public GridColumnBuilder<T> Format(string format) { Column.Format = format; return this; }
    public GridColumnBuilder<T> Align(string align) { Column.Align = align; return this; }
    public GridColumnBuilder<T> Template(string template) { Column.Template = template; return this; }
    public GridColumnBuilder<T> Hidden(bool hidden = true) { Column.Hidden = hidden; return this; }

    // Multi-column header support
    public GridColumnBuilder<T> Columns(Action<GridColumnsFactory<T>> config)
    {
        var factory = new GridColumnsFactory<T>();
        config(factory);
        Column.Columns.AddRange(factory.Columns);
        return this;
    }
}

public class GridColumnsFactory<T>
{
    public List<GridColumn> Columns { get; } = new();

    public GridColumnBuilder<T> Bound<TProp>(Expression<Func<T, TProp>> expression)
    {
        string? field = null;
        if (expression.Body is MemberExpression memberExpr)
        {
            field = memberExpr.Member.Name;
        }
        else if (expression.Body is UnaryExpression unary && unary.Operand is MemberExpression innerMember)
        {
            field = innerMember.Member.Name;
        }

        var builder = new GridColumnBuilder<T>(field);
        Columns.Add(builder.Column);
        return builder;
    }

    public GridColumnBuilder<T> Bound(string field)
    {
        var builder = new GridColumnBuilder<T>(field);
        Columns.Add(builder.Column);
        return builder;
    }

    public GridColumnBuilder<T> Group(string title, Action<GridColumnsFactory<T>> config)
    {
        var builder = new GridColumnBuilder<T> { Column = { Title = title } };
        builder.Columns(config);
        Columns.Add(builder.Column);
        return builder;
    }
}
