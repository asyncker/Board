namespace Board.SearchService.WebApi.Response;

public class ErrorApiResponse
{
    public ErrorApiResponse(string message, int statusCode)
    {
        Error = new ErrorInfo
        {
            Code = statusCode,
            Message = message
        };
    }
    public bool Success { get; set; } = false;
    public ErrorInfo Error { get; set; }

    public class ErrorInfo
    {
        public int Code { get; set; }
        public string Message { get; set; }
    }
}