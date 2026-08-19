namespace Orders.Api.Clients;

public interface IUsersApiClient
{
    Task<bool> UserExistsAsync(Guid userId);
}
