import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, ExchangePerilTopic, GameLogSlug, PauseKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";


async function main() {
  console.log("Starting Peril server...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Connection succesful!");
  const confChannel = await conn.createConfirmChannel()
  const declareQueue = await declareAndBind(conn, ExchangePerilTopic, GameLogSlug, `${GameLogSlug}.*`, SimpleQueueType.Durable);

  printServerHelp()

  while (true) {
    const inputArray = await getInput();

    if (!inputArray) {
      continue;
    }

    const firstWord = inputArray[0];

    if (firstWord == "pause") {
      console.log("Sending pause message...");
      publishJSON(confChannel, ExchangePerilDirect, PauseKey, { isPaused: true } )
    }

    else if (firstWord == "resume") {
      console.log("Sending resume message...");
      publishJSON(confChannel, ExchangePerilDirect, PauseKey, { isPaused: false } )
    }

    else if (firstWord == "quit") {
      console.log("Exiting...");
      break;
    }

    else {
      console.log("Unknown command!");
    }
  }

  process.on('SIGINT', () => {
    console.log('Shutting down...');
    conn.close()
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
