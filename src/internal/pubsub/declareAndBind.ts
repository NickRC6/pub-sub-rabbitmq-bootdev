import amqp from "amqplib";

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[amqp.Channel, amqp.Replies.AssertQueue]> {

    const isPersistent = queueType === SimpleQueueType.Durable;

    const options = {
    arguments: {
      "x-dead-letter-exchange": "peril_dlx",
    },
    durable: isPersistent,      
    autoDelete: !isPersistent,      
    exclusive: !isPersistent,       
    };

    const channel = await conn.createChannel();
    const queue = await channel.assertQueue(queueName, options);

    await channel.bindQueue(queueName, exchange, key);

    return [channel, queue];
}  

export enum SimpleQueueType {
  Durable,
  Transient,
}