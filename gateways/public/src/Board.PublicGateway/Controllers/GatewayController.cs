using Microsoft.AspNetCore.Mvc;

namespace Board.PublicGateway.Controllers;

[ApiController]
[Route("[controller]")]
public class GatewayController : ControllerBase
{
    private readonly IConfiguration _configuration;
    public GatewayController(IConfiguration configuration)
    {
        _configuration = configuration;
    }
}