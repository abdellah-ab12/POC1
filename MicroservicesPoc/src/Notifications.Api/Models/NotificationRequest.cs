namespace Notifications.Api.Models;

public record NotificationRequest(Guid RecipientId, string Type, string Message);
