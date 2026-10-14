using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public class TaskBoardCardModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public string? Category { get; set; }
    public string? AssigneeName { get; set; }
    public string? AssigneeAvatar { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? ColumnId { get; set; }
    public int Order { get; set; }
}

public class TaskBoardColumnModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? BadgeColor { get; set; } = "bg-blue-500";
    public List<TaskBoardCardModel> Cards { get; set; } = new();
}

public class TaskBoardContext
{
    public string? Id { get; set; }
    public string? OnCardMoved { get; set; }
    public List<TaskBoardColumnModel> Columns { get; set; } = new();
}
