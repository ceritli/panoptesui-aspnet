namespace Panoptes.AspNetCore.Demo.Models;

public class StockMovement
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string MovementType { get; set; } = "Giriş"; // Giriş, Çıkış, Transfer
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public string Warehouse { get; set; } = "İstanbul Merkez Depo";
    public string ReferenceNo { get; set; } = "";
    public string Description
    {
        get => string.IsNullOrEmpty(ReferenceNo) ? $"{MovementType} İşlemi - Depo: {Warehouse}" : ReferenceNo;
        set => ReferenceNo = value;
    }
    public DateTime CreatedAt { get; set; }
    public DateTime MovementDate
    {
        get => CreatedAt;
        set => CreatedAt = value;
    }
}
