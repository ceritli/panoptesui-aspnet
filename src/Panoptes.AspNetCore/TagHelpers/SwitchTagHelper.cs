using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-switch")]
public class SwitchTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-switch-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("checked")]
    public bool Checked { get; set; } = false;

    [HtmlAttributeName("is-checked")]
    public bool IsChecked
    {
        get => Checked;
        set => Checked = value;
    }

    [HtmlAttributeName("on-label")]
    public string OnLabel { get; set; } = "Açık";

    [HtmlAttributeName("off-label")]
    public string OffLabel { get; set; } = "Kapalı";

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-switch-wrapper inline-flex items-center gap-2 cursor-pointer select-none {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            isChecked = Checked,
            onLabel = OnLabel,
            offLabel = OffLabel,
            disabled = Disabled,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        output.Content.SetHtmlContent($@"
<input type=""hidden"" id=""{Id}-value"" name=""{inputName}"" value=""{(Checked ? "true" : "false")}"" />
<div class=""panoptes-switch-track relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {(Checked ? "bg-blue-600" : "bg-slate-300")} {(Disabled ? "opacity-50 cursor-not-allowed" : "")}""
     data-action=""toggle-switch"">
    <span class=""panoptes-switch-thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {(Checked ? "translate-x-5" : "translate-x-0")}""></span>
</div>
<span class=""panoptes-switch-label text-xs font-medium text-slate-700 select-none"">{(Checked ? OnLabel : OffLabel)}</span>
<script type=""application/json"" data-panoptes-switch-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.Switch) {{
    window.Panoptes.Switch.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.Switch) {{
        window.Panoptes.Switch.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
