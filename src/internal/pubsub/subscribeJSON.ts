import amqp from "amqplib";
import { declareAndBind, SimpleQueueType } from "../pubsub/declareAndBind.js";


export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {

    const [ch, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);

    ch.consume(queue.queue, function (msg: amqp.ConsumeMessage | null) {
        if (msg == null) {
            return;
        }

        const parsedMessage = JSON.parse(msg.content.toString());
        handler(parsedMessage);
        ch.ack(msg);
    });
}