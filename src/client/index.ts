import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import amqp from "amqplib";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

async function main() {
  console.log("Connecting...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Connection succesful!");

  const username = await clientWelcome()
  const declaration = await declareAndBind(conn, ExchangePerilDirect, `pause.${username}`, PauseKey, SimpleQueueType.Transient);

  process.on('SIGINT', () => {
    console.log('Shutting down...');
    conn.close()
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});