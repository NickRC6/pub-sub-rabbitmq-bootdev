import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import { type PlayingState, GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";


export function handlerPause(gs: GameState): (ps: PlayingState) => void {
    return function (ps: PlayingState) {
        handlePause(gs, ps);
        process.stdout.write("> ");
    };
}

export function handlerMove(gs: GameState): (mv: ArmyMove) => void {
    return function (mv: ArmyMove) {
        handleMove(gs, mv);
        process.stdout.write("> ");
    };
}

