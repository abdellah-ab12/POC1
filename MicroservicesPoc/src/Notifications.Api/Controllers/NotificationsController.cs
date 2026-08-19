using Microsoft.AspNetCore.Mvc;
using Notifications.Api.Models;

namespace Notifications.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ILogger<NotificationsController> logger)
    {
        _logger = logger;
    }

    // POST api/notifications
    [HttpPost]
    public IActionResult SendNotification(NotificationRequest request)
    {
        _logger.LogInformation(
            "Notification envoyée -> Destinataire: {RecipientId} | Type: {Type} | Message: {Message}",
            request.RecipientId, request.Type, request.Message);

        return Accepted(new
        {
            status = "queued",
            recipientId = request.RecipientId,
            type = request.Type
        });
    }
}
