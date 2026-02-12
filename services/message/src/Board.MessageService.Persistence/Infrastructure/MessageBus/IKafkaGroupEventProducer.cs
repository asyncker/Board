using Board.MessageService.Persistence.Domain.Events;

namespace Board.MessageService.Persistence.Infrastructure.MessageBus;

public interface IKafkaGroupEventProducer
{
    Task ProduceCreateEventAsync(GroupEventData eventData, CancellationToken cancellationToken);
}