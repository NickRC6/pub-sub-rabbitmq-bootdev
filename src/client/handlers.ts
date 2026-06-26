import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import { type PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import type { AckType } from "../internal/pubsub/subscribeJSON.js";
import { MoveOutcome } from "../internal/gamelogic/move.js";


export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
    return function (ps: PlayingState) {
        handlePause(gs, ps);
        process.stdout.write("> ");
        return "Ack";
    };
}

export function handlerMove(gs: GameState): (mv: ArmyMove) => AckType {
    return function (mv: ArmyMove) {
        const outcome = handleMove(gs, mv);
        process.stdout.write("> ");

        if (outcome === MoveOutcome.Safe || outcome === MoveOutcome.MakeWar) {
            return "Ack";
        }
        return "NackDiscard";
    };
}

