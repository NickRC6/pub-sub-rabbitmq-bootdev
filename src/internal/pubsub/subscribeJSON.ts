import amqp from "amqplib";
import { declareAndBind, SimpleQueueType } from "../pubsub/declareAndBind.js";

export type AckType = "Ack" | "NackRequeue" | "NackDiscard";

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => AckType,
): Promise<void> {

    const [ch, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);

    ch.consume(queue.queue, function (msg: amqp.ConsumeMessage | null) {
        if (msg == null) {
            return;
        }

        const parsedMessage = JSON.parse(msg.content.toString());
        const ackType = handler(parsedMessage);

        switch (ackType) {
            case "Ack":
                console.log("ACK: message processed successfully");
                ch.ack(msg);
                break;
            case "NackRequeue":
                console.log("NACK (requeue): message returned to queue");
                ch.nack(msg, false, true);
                break;
            case "NackDiscard":
                console.log("NACK (discard): message dropped");
                ch.nack(msg, false, false);
                break;
        }
    });
}