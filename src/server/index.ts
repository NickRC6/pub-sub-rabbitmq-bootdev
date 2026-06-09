import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";


async function main() {
  console.log("Starting Peril server...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Connection succesful!");
  const confChannel = await conn.createConfirmChannel()

  const serverState = true
  printServerHelp()

  while (serverState) {
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
