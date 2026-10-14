namespace Panoptes.AspNetCore.Models;

public enum DialogType
{
    Alert,
    Confirm,
    Prompt
}

public class DialogModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public DialogType Type { get; set; } = DialogType.Alert;
    public string? OkText { get; set; } = "Tamam";
    public string? CancelText { get; set; } = "İptal";
    public string? PromptPlaceholder { get; set; }
    public string? PromptDefaultValue { get; set; }
    public bool Closable { get; set; } = true;
    public string? Width { get; set; } = "440px";
}
