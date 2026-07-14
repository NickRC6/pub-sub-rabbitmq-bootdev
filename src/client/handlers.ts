import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import { type PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import type { AckType } from "../internal/pubsub/consume.js";
import { MoveOutcome } from "../internal/gamelogic/move.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";
import type { ConfirmChannel } from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { publishGameLog } from "./index.js";


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

export function handlerWar(gs: GameState, ch: ConfirmChannel): (rw: RecognitionOfWar) => Promise<AckType> {
    return async function (rw: RecognitionOfWar) {
        try {
            const warOutcome = handleWar(gs, rw);
            const player = gs.getPlayerSnap();

            if (warOutcome.result === WarOutcome.NotInvolved) {
                return "NackRequeue";
            }

            if (warOutcome.result === WarOutcome.NoUnits) {
                return "NackDiscard";
            }

            if (warOutcome.result === WarOutcome.OpponentWon) {
                const msg = `${warOutcome.winner} won a war against ${warOutcome.loser}`;
                try {
                    await publishGameLog(ch, player.username, msg);
                    return "Ack";
                    } catch (err) {
                    return "NackRequeue";
                }
            }

            if (warOutcome.result === WarOutcome.YouWon) {
                const msg = `${warOutcome.winner} won a war against ${warOutcome.loser}`;
                try {
                    await publishGameLog(ch, player.username, msg);
                    return "Ack";
                    } catch (err) {
                    return "NackRequeue";
                }
            }

            if (warOutcome.result === WarOutcome.Draw) {
                const msg = `A war between ${warOutcome.attacker} and ${warOutcome.defender} resulted in a draw`
                try {
                    await publishGameLog(ch, player.username, msg);
                    return "Ack";
                    } catch (err) {
                    return "NackRequeue";
                }
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
