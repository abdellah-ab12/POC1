using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Orders.Api.Clients;
using Orders.Api.Data;
using Orders.Api.Models;

namespace Orders.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrdersDbContext _context;
    private readonly IUsersApiClient _usersApiClient;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(OrdersDbContext context, IUsersApiClient usersApiClient, ILogger<OrdersController> logger)
    {
        _context = context;
        _usersApiClient = usersApiClient;
        _logger = logger;
    }

    // GET api/orders
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
    {
        var orders = await _context.Orders.ToListAsync();
        return Ok(orders);
    }

    // GET api/orders/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Order>> GetOrder(Guid id)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order is null)
            return NotFound(new { message = $"Commande {id} introuvable." });

        return Ok(order);
    }

    // POST api/orders
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderRequest request)
    {
        bool userExists;
        try
        {
            userExists = await _usersApiClient.UserExistsAsync(request.UserId);
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Users.Api est indisponible, impossible de valider l'utilisateur." });
        }

        if (!userExists)
            return BadRequest(new { message = $"L'utilisateur {request.UserId} n'existe pas." });

        var order = new Order
        {
            UserId = request.UserId,
            ProductName = request.ProductName,
            Quantity = request.Quantity
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Commande {OrderId} créée pour l'utilisateur {UserId}", order.Id, order.UserId);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }
}

public record CreateOrderRequest(Guid UserId, string ProductName, int Quantity);
