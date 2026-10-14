using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// DropDownTree içinde hiyerarşik bir ağaç düğümünü temsil eden model.
/// </summary>
public class DropDownTreeItemModel
{
    public string? Id { get; set; }
    public string? Value { get; set; }
    public string? Text { get; set; }
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public bool Expanded { get; set; }
    public bool Checked { get; set; }
    public bool Selected { get; set; }
    public bool Disabled { get; set; }
    public string? Url { get; set; }
    public string? Badge { get; set; }
    public string BadgeColor { get; set; } = "blue";
    public List<DropDownTreeItemModel> Children { get; set; } = new();

    public DropDownTreeItemModel() { }

    public DropDownTreeItemModel(string text, string? value = null, string? icon = null)
    {
        Text = text;
        Value = value ?? text;
        Id = Value;
        Icon = icon;
    }
}

/// <summary>
/// Çoklu seçim ve onay kutusu (checkboxes) ayarları.
/// </summary>
public class DropDownTreeCheckboxesConfig
{
    public bool Enabled { get; set; } = true;
    public bool CheckChildren { get; set; } = true;
    public string? Name { get; set; }
    public string? Template { get; set; }
}

/// <summary>
/// TagHelper işlem bağlamı.
/// </summary>
public class DropDownTreeContext
{
    public string? Id { get; set; }
    public List<DropDownTreeItemModel> Items { get; set; } = new();
}
