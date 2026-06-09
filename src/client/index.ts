import { clientWelcome, commandStatus, getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import amqp from "amqplib";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";

async function main() {
  console.log("Connecting...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Connection succesful!");

  const username = await clientWelcome()
  const declaration = await declareAndBind(conn, ExchangePerilDirect, `pause.${username}`, PauseKey, SimpleQueueType.Transient);
  const gameState = new GameState(username);

  const gameStatus = true;

  while (gameState) {
    const inputArray = await getInput();

    if (!inputArray) {
      continue;
    }

    const firstWord = inputArray[0];

    if (firstWord == "spawn") {
      commandSpawn(gameState, inputArray);
    }

    else if (firstWord == "move") {
      commandMove(gameState, inputArray);
    }

    else if (firstWord == "status") {
      commandStatus(gameState);
    }

    else if (firstWord == "help") {
      printClientHelp();
    }

    else if (firstWord == "spam") {
      console.log("Spamming not allowed yet!");
    }

    else if (firstWord == "quit") {
      printQuit();
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