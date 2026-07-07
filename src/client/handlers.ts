import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import { type PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import type { AckType } from "../internal/pubsub/subscribeJSON.js";
import { MoveOutcome } from "../internal/gamelogic/move.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";
import type { ConfirmChannel } from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";


export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
    return function (ps: PlayingState) {
        handlePause(gs, ps);
        process.stdout.write("> ");
        return "Ack";
    };
}

export function handlerMove(gs: GameState, cs: ConfirmChannel): (mv: ArmyMove) => Promise<AckType> {
    return async function (mv: ArmyMove) {
        const outcome = handleMove(gs, mv);
        process.stdout.write("> ");

        if (outcome === MoveOutcome.Safe) {
            return "Ack";
        }

        if (outcome === MoveOutcome.MakeWar) {
            const attacker = mv.player
            const defender = gs.getPlayerSnap()
            const rw: RecognitionOfWar = {
                attacker: attacker,
                defender: defender
            }
            try
            {
                await publishJSON(
                cs,
                ExchangePerilTopic,
                `${WarRecognitionsPrefix}.${defender.username}`,
                rw,
            )
                return "Ack"
            }
            catch (err) {
                console.error("Error publishing war recognition:", err);
                return "NackRequeue";
            }
        }

        return "NackDiscard";
    };
}

export function handlerWar(gs: GameState): (rw: RecognitionOfWar) => Promise<AckType> {
    return async function (rw: RecognitionOfWar) {
        try {
            const warOutcome = handleWar(gs, rw).result;

            if (warOutcome === WarOutcome.NotInvolved) {
                return "NackRequeue";
            }

            if (warOutcome === WarOutcome.NoUnits) {
                return "NackDiscard";
            }

            if (warOutcome === WarOutcome.OpponentWon) {
                return "Ack";
            }

            if (warOutcome === WarOutcome.YouWon) {
                return "Ack";
            }

            if (warOutcome === WarOutcome.Draw) {
                return "Ack";
            }

            else {
                console.error("Unexpected war outcome");
                return "NackDiscard";
            }
        }
        finally {
            process.stdout.write("> ");
        }
    };
}
