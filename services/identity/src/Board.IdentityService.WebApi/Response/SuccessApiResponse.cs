namespace Board.IdentityService.WebApi.Response;

public class SuccessApiResponse<T>
{
    public SuccessApiResponse(T data)
    {
        Data = data;
    }
    public bool Success { get; set; } = true;
    public T Data { get; set; }
}