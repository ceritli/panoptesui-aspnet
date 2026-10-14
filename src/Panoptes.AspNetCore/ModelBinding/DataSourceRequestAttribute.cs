using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.ModelBinding;

[AttributeUsage(AttributeTargets.Parameter)]
public class DataSourceRequestAttribute : ModelBinderAttribute
{
    public DataSourceRequestAttribute() : base(typeof(DataSourceRequestModelBinder))
    {
    }
}
