using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Json;
using System.Threading.Tasks;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-lightbox")]
    public class LightboxTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; } = string.Empty;

        [HtmlAttributeName("selector")]
        public string Selector { get; set; } = "a[data-lightbox]";

        [HtmlAttributeName("enable-zoom")]
        public bool EnableZoom { get; set; } = true;

        [HtmlAttributeName("enable-download")]
        public bool EnableDownload { get; set; } = true;

        [HtmlAttributeName("enable-counter")]
        public bool EnableCounter { get; set; } = true;

        [HtmlAttributeName("enable-thumbnails")]
        public bool EnableThumbnails { get; set; } = true;

        [HtmlAttributeName("enable-rotation")]
        public bool EnableRotation { get; set; } = true;

        [HtmlAttributeName("loop")]
        public bool Loop { get; set; } = true;

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            
            if (string.IsNullOrEmpty(Id))
            {
                Id = "lightbox_" + System.Guid.NewGuid().ToString("N").Substring(0, 8);
            }
            
            output.Attributes.SetAttribute("id", Id);
            output.Attributes.SetAttribute("class", "panoptes-lightbox-container " + (output.Attributes.ContainsName("class") ? output.Attributes["class"].Value : ""));

            var options = new
            {
                selector = Selector,
                enableZoom = EnableZoom,
                enableDownload = EnableDownload,
                enableCounter = EnableCounter,
                enableThumbnails = EnableThumbnails,
                enableRotation = EnableRotation,
                loop = Loop
            };

            output.Attributes.SetAttribute("data-options", JsonSerializer.Serialize(options));

            var childContent = await output.GetChildContentAsync();
            output.Content.SetHtmlContent(childContent.GetContent());

            var script = $@"
<script>
    document.addEventListener('DOMContentLoaded', function() {{
        if (window.Panoptes && window.Panoptes.Lightbox) {{
            new window.Panoptes.Lightbox('{Id}');
        }} else {{
            console.error('Panoptes.Lightbox is not loaded.');
        }}
    }});
</script>";

            output.PostElement.AppendHtml(script);
        }
    }
}
