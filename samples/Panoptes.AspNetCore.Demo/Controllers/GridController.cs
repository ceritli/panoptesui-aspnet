using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

[Route("Grid")]
public class GridController : Controller
{
    [HttpGet("")]
    [HttpGet("Index")]
    public IActionResult Index() => View();

    [HttpGet("Paging")]
    public IActionResult Paging() => View();

    [HttpGet("Sorting")]
    public IActionResult Sorting() => View();

    [HttpGet("Filtering")]
    public IActionResult Filtering() => View();

    [HttpGet("Grouping")]
    public IActionResult Grouping() => View();

    [HttpGet("Selection")]
    public IActionResult Selection() => View();

    [HttpGet("InlineEdit")]
    public IActionResult InlineEdit() => View();

    [HttpGet("IncellEdit")]
    public IActionResult IncellEdit() => View();

    [HttpGet("PopupEdit")]
    public IActionResult PopupEdit() => View();

    [HttpGet("Hierarchy")]
    public IActionResult Hierarchy() => View();

    [HttpGet("Columns")]
    public IActionResult Columns() => View();

    [HttpGet("Export")]
    public IActionResult Export() => View();

    [HttpGet("TagHelper")]
    public IActionResult TagHelper() => View();

    [HttpGet("Aggregates")]
    public IActionResult Aggregates() => View();

    [HttpGet("SearchPanel")]
    public IActionResult SearchPanel() => View();

    [HttpGet("Events")]
    public IActionResult Events() => View();

    [HttpGet("Api")]
    public IActionResult Api() => View();
}
