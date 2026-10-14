using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Panoptes.AspNetCore.Demo.Data;
using Panoptes.AspNetCore.Demo.Models;
using Panoptes.Core.Data;
using Panoptes.Core.Extensions;

namespace Panoptes.AspNetCore.Demo.Controllers;

[ApiController]
[Route("api/stockmovements")]
public class StockMovementsApiController : ControllerBase
{
    private readonly DemoDbContext _db;

    public StockMovementsApiController(DemoDbContext db)
    {
        _db = db;
    }

    private static readonly Dictionary<string, string> MoveTypeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Giriş"] = "Inbound",
        ["Çıkış"] = "Outbound",
        ["Transfer"] = "Transfer",
        ["İade"] = "Return"
    };

    private static readonly Dictionary<string, string> WarehouseMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["İstanbul Merkez"] = "Istanbul Central",
        ["Ankara Lojistik"] = "Ankara Logistics",
        ["İzmir Bölge"] = "Izmir Regional",
        ["Bursa Depo"] = "Bursa Warehouse"
    };

    private bool IsEnglish()
    {
        var referer = Request.Headers.Referer.ToString();
        if (referer.Contains("/en/", StringComparison.OrdinalIgnoreCase) || referer.EndsWith("/en", StringComparison.OrdinalIgnoreCase))
            return true;
        if (Request.Query["culture"].ToString().StartsWith("en", StringComparison.OrdinalIgnoreCase))
            return true;
        if (Request.Headers["Accept-Language"].ToString().StartsWith("en", StringComparison.OrdinalIgnoreCase))
            return true;
        return false;
    }

    private StockMovement LocalizeMovement(StockMovement m)
    {
        var moveType = MoveTypeMap.TryGetValue(m.MovementType, out var mt) ? mt : m.MovementType;
        var warehouse = WarehouseMap.TryGetValue(m.Warehouse, out var wh) ? wh : m.Warehouse;
        return new StockMovement
        {
            Id = m.Id,
            ProductId = m.ProductId,
            MovementType = moveType,
            Quantity = m.Quantity,
            UnitCost = m.UnitCost,
            Warehouse = warehouse,
            ReferenceNo = m.ReferenceNo,
            CreatedAt = m.CreatedAt
        };
    }

    [HttpGet("")]
    [HttpGet("read")]
    public async Task<IActionResult> Get([FromQuery] int? productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _db.StockMovements.AsQueryable();
        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }
        var request = new DataSourceRequest { Page = page <= 0 ? 1 : page, PageSize = pageSize <= 0 ? 10 : pageSize };
        var result = await query.ToDataSourceResultAsync(request);
        if (IsEnglish() && result.Data != null)
        {
            result.Data = result.Data.Cast<StockMovement>().Select(LocalizeMovement).ToList();
        }
        return Ok(result);
    }

    [HttpPost("")]
    [HttpPost("read")]
    public async Task<IActionResult> Read([FromBody] DataSourceRequest? postRequest, [FromQuery] int? productId)
    {
        var request = postRequest ?? new DataSourceRequest { Page = 1, PageSize = 10 };
        var query = _db.StockMovements.AsQueryable();
        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }
        var result = await query.ToDataSourceResultAsync(request);
        if (IsEnglish() && result.Data != null)
        {
            result.Data = result.Data.Cast<StockMovement>().Select(LocalizeMovement).ToList();
        }
        return Ok(result);
    }
}
