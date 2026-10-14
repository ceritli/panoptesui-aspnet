using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// DropDownTree içinde hiyerarşik bir ağaç düğümünü temsil eden bildirimsel TagHelper.
/// Alt alta yuvalanarak (nested) derin dallar oluşturulabilir.
/// </summary>
[HtmlTargetElement("panoptes-dropdowntree-item")]
[HtmlTargetElement("panoptes-ddt-item")]
[HtmlTargetElement("ddt-item")]
public class DropDownTreeItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("image-url")]
    public string? ImageUrl { get; set; }

    [HtmlAttributeName("expanded")]
    public bool Expanded { get; set; }

    [HtmlAttributeName("checked")]
    public bool Checked { get; set; }

    [HtmlAttributeName("selected")]
    public bool Selected { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("badge-color")]
    public string BadgeColor { get; set; } = "blue";

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue("PanoptesDropDownTreeParentStack", out var stackObj) ||
            stackObj is not Stack<List<DropDownTreeItemModel>> parentStack ||
            parentStack.Count == 0)
        {
            output.SuppressOutput();
            return;
        }

        var node = new DropDownTreeItemModel
        {
            Id = Id ?? Value ?? Text,
            Value = Value ?? Id ?? Text,
            Text = Text ?? Value ?? Id ?? "Öğe",
            Icon = Icon,
            ImageUrl = ImageUrl,
            Expanded = Expanded,
            Checked = Checked,
            Selected = Selected,
            Disabled = Disabled,
            Badge = Badge,
            BadgeColor = BadgeColor,
            Url = Url,
            Children = new List<DropDownTreeItemModel>()
        };

        // Bu düğümü mevcut ebeveynin çocuk listesine ekle
        var currentParentChildren = parentStack.Peek();
        currentParentChildren.Add(node);

        // Kendi çocuk listesini yığına it
        parentStack.Push(node.Children);

        // İçerideki çocuk tag'leri çalıştır
        await output.GetChildContentAsync();

        // Yığından geri al
        parentStack.Pop();

        output.SuppressOutput();
    }
}
