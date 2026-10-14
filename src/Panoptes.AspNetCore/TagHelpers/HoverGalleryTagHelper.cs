using Microsoft.AspNetCore.Razor.TagHelpers;
using System;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-hovergallery")]
    public class HoverGalleryTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; } = $"panoptes-hovergallery-{Guid.NewGuid():N}";

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            output.Attributes.SetAttribute("id", Id);
            
            // Append class
            var existingClass = output.Attributes["class"]?.Value.ToString() ?? string.Empty;
            output.Attributes.SetAttribute("class", $"panoptes-hovergallery {existingClass}".Trim());

            var script = $@"
<script>
    document.addEventListener('DOMContentLoaded', function() {{
        if (window.Panoptes && window.Panoptes.HoverGallery) {{
            new window.Panoptes.HoverGallery('{Id}');
        }}
    }});
</script>";
            output.PostElement.AppendHtml(script);
        }
    }
}
