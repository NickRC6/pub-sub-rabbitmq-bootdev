import { clientWelcome, commandStatus, getInput, printClientHelp, printQuit, commandSpam } from "../internal/gamelogic/gamelogic.js";
import amqp, { type ConfirmChannel } from "amqplib";
import { subscribeJSON } from "../internal/pubsub/consume.js";
import { SimpleQueueType } from "../internal/pubsub/declareAndBind.js";
import { ArmyMovesPrefix, ExchangePerilDirect, ExchangePerilTopic, PauseKey, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { handlerPause, handlerMove, handlerWar } from "./handlers.js";
import { publishJSON, publishMsgPack } from "../internal/pubsub/publish.js";
import type { GameLog } from "../internal/gamelogic/logs.js";
import { GameLogSlug } from "../internal/routing/routing.js";
import { getMaliciousLog } from "../internal/gamelogic/gamelogic.js";

export function publishGameLog(ch: ConfirmChannel, username: string, message: string) {
  const log: GameLog = {
    username: username,
    message: message,
    currentTime: new Date(),
  }

  publishMsgPack(ch, ExchangePerilTopic, `${GameLogSlug}.${username}`, log); 
}

async function main() {
  console.log("Connecting...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const confChannel = await conn.createConfirmChannel()
  console.log("Connection succesful!");

  const username = await clientWelcome()
  const gameState = new GameState(username);

  subscribeJSON(conn, ExchangePerilDirect, `pause.${username}`, PauseKey, SimpleQueueType.Transient, handlerPause(gameState));
  subscribeJSON(conn, ExchangePerilTopic, `${ArmyMovesPrefix}.${username}`, `${ArmyMovesPrefix}.*` , SimpleQueueType.Transient, handlerMove(gameState, confChannel));
  subscribeJSON(conn, ExchangePerilTopic, "war", `${WarRecognitionsPrefix}.*`, SimpleQueueType.Durable, handlerWar(gameState, confChannel));

  while (true) {
    const inputArray = await getInput();

    if (!inputArray) {
      continue;
    }

    const firstWord = inputArray[0];

    if (firstWord == "spawn") {
      commandSpawn(gameState, inputArray);
    }

    else if (firstWord == "move") {
      const move = commandMove(gameState, inputArray);
      publishJSON(confChannel, ExchangePerilTopic, `${ArmyMovesPrefix}.${username}`, move);
      console.log("Move published successfully.")
    }

    else if (firstWord == "status") {
      commandStatus(gameState);
    }

    else if (firstWord == "help") {
      printClientHelp();
    }

    else if (firstWord == "spam") {
      const num = commandSpam(inputArray);

      for (let i = 0; i < num; i++) {
        const message = getMaliciousLog();
        const log: GameLog = {
          username: username,
          message: message,
          currentTime: new Date(),
        }
        publishMsgPack(confChannel, ExchangePerilTopic, `${GameLogSlug}.${username}`, log);
      }

      console.log('Spamming...')
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