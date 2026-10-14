using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

[Route("Components")]
public class ComponentsController : Controller
{

    [HttpGet("DateRangePicker")]
    public IActionResult DateRangePicker() => View();

    [HttpGet("TimePicker")]
    public IActionResult TimePicker() => View();

    [HttpGet("DateTimePicker")]
    public IActionResult DateTimePicker() => View();


    [HttpGet("MultiSelect")]
    public IActionResult MultiSelect() => View();

    [HttpGet("ComboBox")]
    public IActionResult ComboBox() => View();

    [HttpGet("MultiColumnComboBox")]
    public IActionResult MultiColumnComboBox() => View();

    [HttpGet("AutoComplete")]
    public IActionResult AutoComplete() => View();

    [HttpGet("NumericTextBox")]
    public IActionResult NumericTextBox() => View();

    [HttpGet("TextBox")]
    public IActionResult TextBox() => View();

    [HttpGet("TextArea")]
    public IActionResult TextArea() => View();

    [HttpGet("Switch")]
    public IActionResult Switch() => View();

    [HttpGet("CheckBox")]
    public IActionResult CheckBox() => View();

    [HttpGet("RadioGroup")]
    public IActionResult RadioGroup() => View();

    [HttpGet("MaskedTextBox")]
    public IActionResult MaskedTextBox() => View();

    [HttpGet("ColorPicker")]
    public IActionResult ColorPicker() => View();
}
