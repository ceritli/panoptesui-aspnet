namespace Panoptes.AspNetCore.Demo.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public string Supplier { get; set; } = "TechCorp";
    public DateTime CreatedAt { get; set; }
    public DateTime CreatedDate
    {
        get => CreatedAt;
        set => CreatedAt = value;
    }

    // Enterprise Grid Fields
    public string ImageUrl { get; set; } = string.Empty;
    public int CustomerRating { get; set; } = 4;
    public string Country { get; set; } = "Türkiye";
    public string CountryCode { get; set; } = "tr";
    public decimal TotalSales { get; set; }
    public int TargetSales { get; set; } = 85;
    public bool Discontinued { get; set; }
}
