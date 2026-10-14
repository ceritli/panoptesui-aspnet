using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class TreeViewController : Controller
{
    public IActionResult Index()
    {
        // Modelden bağlama için örnek hiyerarşik klasör ağacı
        var hierarchicalData = new List<TreeViewItemModel>
        {
            new()
            {
                Id = "proj_src",
                Text = "src (Kaynak Kodlar)",
                Icon = "folder",
                Expanded = true,
                Children = new List<TreeViewItemModel>
                {
                    new()
                    {
                        Id = "proj_core",
                        Text = "Panoptes.Core",
                        Icon = "folder",
                        Expanded = true,
                        Children = new List<TreeViewItemModel>
                        {
                            new() { Id = "file_grid", Text = "GridModel.cs", Icon = "code", Badge = "C#", BadgeColor = "emerald" },
                            new() { Id = "file_filter", Text = "FilterDescriptor.cs", Icon = "code", Badge = "C#", BadgeColor = "emerald" }
                        }
                    },
                    new()
                    {
                        Id = "proj_web",
                        Text = "Panoptes.AspNetCore",
                        Icon = "folder",
                        Expanded = true,
                        Children = new List<TreeViewItemModel>
                        {
                            new() { Id = "file_taghelper", Text = "TreeViewTagHelper.cs", Icon = "code" },
                            new() { Id = "file_js", Text = "panoptes-treeview.js", Icon = "document", Badge = "JS", BadgeColor = "amber" }
                        }
                    }
                }
            },
            new()
            {
                Id = "proj_docs",
                Text = "docs (Dokümantasyon)",
                Icon = "folder",
                Children = new List<TreeViewItemModel>
                {
                    new() { Id = "doc_readme", Text = "README.md", Icon = "file" },
                    new() { Id = "doc_api", Text = "API_Reference.pdf", Icon = "document" }
                }
            }
        };

        return View(hierarchicalData);
    }
}
