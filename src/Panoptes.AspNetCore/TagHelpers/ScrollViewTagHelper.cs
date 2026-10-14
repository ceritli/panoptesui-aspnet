using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Json;
using System.Threading.Tasks;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-scrollview")]
    public class ScrollViewTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; } = string.Empty;

        [HtmlAttributeName("width")]
        public string Width { get; set; } = "100%";

        [HtmlAttributeName("height")]
        public string Height { get; set; } = "400px";

        [HtmlAttributeName("page-size")]
        public int PageSize { get; set; } = 1;

        [HtmlAttributeName("autoplay")]
        public bool Autoplay { get; set; } = false;

        [HtmlAttributeName("autoplay-interval")]
        public int AutoplayInterval { get; set; } = 5000;

        [HtmlAttributeName("enable-pager")]
        public bool EnablePager { get; set; } = true;

        [HtmlAttributeName("enable-nav-buttons")]
        public bool EnableNavButtons { get; set; } = true;

        [HtmlAttributeName("loop")]
        public bool Loop { get; set; } = true;

        [HtmlAttributeName("gap")]
        public string Gap { get; set; } = "1rem";

        [HtmlAttributeName("drag")]
        public bool Drag { get; set; } = true;

        [HtmlAttributeName("direction")]
        public string Direction { get; set; } = "ltr"; // ltr, rtl, ttb

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            
            if (string.IsNullOrEmpty(Id))
            {
                Id = "scrollview_" + System.Guid.NewGuid().ToString("N").Substring(0, 8);
            }
            
            output.Attributes.SetAttribute("id", Id);
            output.Attributes.SetAttribute("class", "panoptes-scrollview " + (output.Attributes.ContainsName("class") ? output.Attributes["class"].Value : ""));
            output.Attributes.SetAttribute("style", $"width: {Width}; height: {Height}; position: relative; overflow: hidden;");

            var options = new
            {
                pageSize = PageSize,
                autoplay = Autoplay,
                autoplayInterval = AutoplayInterval,
                enablePager = EnablePager,
                enableNavButtons = EnableNavButtons,
                loop = Loop,
                gap = Gap,
                drag = Drag,
                direction = Direction
            };

            output.Attributes.SetAttribute("data-options", JsonSerializer.Serialize(options));

            var childContent = await output.GetChildContentAsync();

            var script = $@"
<script>
    document.addEventListener('DOMContentLoaded', function() {{
        if (window.Panoptes && window.Panoptes.ScrollView) {{
            new window.Panoptes.ScrollView('{Id}');
        }} else {{
            console.error('Panoptes.ScrollView is not loaded.');
        }}
    }});
</script>";

            output.Content.SetHtmlContent($@"
                <div class=""panoptes-scrollview-track"" style=""display: flex; gap: {Gap}; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); height: 100%; will-change: transform; {(Direction == "ttb" ? "flex-direction: column;" : "")}"">
                    {childContent.GetContent()}
                </div>
            ");

            output.PostElement.AppendHtml(script);
        }
    }
}
