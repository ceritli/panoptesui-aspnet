using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class BreadcrumbItemModel
{
    public string? Text { get; set; }
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public bool IsCurrent { get; set; }
    public bool Disabled { get; set; }
}

public class BreadcrumbContext
{
    public string? Id { get; set; }
    public string Delimiter { get; set; } = "chevron"; // chevron, slash, arrow
    public bool ShowRootIcon { get; set; } = true;
    public List<BreadcrumbItemModel> Items { get; set; } = new();
}
