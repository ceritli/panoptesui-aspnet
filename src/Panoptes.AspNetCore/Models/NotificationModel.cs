namespace Panoptes.AspNetCore.Models;

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error
}

public enum NotificationPosition
{
    TopRight,
    TopLeft,
    BottomRight,
    BottomLeft,
    TopCenter,
    BottomCenter
}

public class NotificationModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
    public NotificationType Type { get; set; } = NotificationType.Info;
    public NotificationPosition Position { get; set; } = NotificationPosition.TopRight;
    public int AutoHideAfter { get; set; } = 5000; // ms cinsinden (0 ise otomatik kapanmaz)
    public bool Closable { get; set; } = true;
    public bool ShowIcon { get; set; } = true;
}
