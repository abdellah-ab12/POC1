using System.Net;

namespace Orders.Api.Clients;

public class UsersApiClient : IUsersApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UsersApiClient> _logger;

    public UsersApiClient(HttpClient httpClient, ILogger<UsersApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> UserExistsAsync(Guid userId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"api/users/{userId}");

            if (response.StatusCode == HttpStatusCode.NotFound)
                return false;

            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Impossible de contacter Users.Api pour vérifier l'utilisateur {UserId}", userId);
            throw;
        }
    }
}
