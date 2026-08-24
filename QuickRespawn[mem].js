// Quick Respawn
// GTA San Andreas Classic 1.0 + CLEO Redux JavaScript
//
// Press ENTER while WASTED to immediately begin GTA SA's normal hospital restart.
// Press ENTER while BUSTED to immediately begin GTA SA's normal police-station restart.
//
// The WASTED path uses GTA SA's native FORCE_DEATH_RESTART command.
// The BUSTED path requires [mem] because GTA SA does not expose an equivalent
// FORCE_ARREST_RESTART command.
//
// When BUSTED is skipped, CJ's current arrest speech is stopped so it does not
// continue over the accelerated transition. Speech is restored afterward.

/// <reference path=".config/sa.d.ts" />

const PLAYER_ID = 0;
const VK_RETURN = 13; // Keyboard Enter

// GTA SA Classic 1.0 US - CGameLogic globals.
// The normal BUSTED logic waits until 4000 ms have passed since TimeOfLastEvent.
const GAMELOGIC_TIME_OF_LAST_EVENT = 0x96A8AC;
const GAMELOGIC_STATE = 0x96A8B0;
const GAMELOGIC_STATE_BUSTED = 2;

let enterWasDown = false;
let wastedRestartTriggered = false;
let bustedRestartTriggered = false;
let speechSuppressed = false;

log("[QuickRespawn] loaded - press ENTER while WASTED or BUSTED.");

while (true) {
    wait(0);

    const enterDown = native("IS_KEY_PRESSED", VK_RETURN);
    const enterJustPressed = enterDown && !enterWasDown;
    enterWasDown = enterDown;

    const playerChar = native("GET_PLAYER_CHAR", PLAYER_ID);
    const playerDead = native("IS_PLAYER_DEAD", PLAYER_ID);
    const playerArrested = native("HAS_CHAR_BEEN_ARRESTED", playerChar);

    // -------------------------
    // WASTED
    // -------------------------
    //
    // FORCE_DEATH_RESTART lets GTA keep control of the normal hospital restart,
    // including restart-point selection and the game's usual death penalties.
    if (playerDead) {
        if (enterJustPressed && !wastedRestartTriggered) {
            wastedRestartTriggered = true;

            native("FORCE_DEATH_RESTART");

            // Finish the fade-to-black immediately so GTA can proceed into its
            // normal hospital restart without the usual long transition.
            native("DO_FADE", 0, 0);

            log("[QuickRespawn] ENTER pressed while WASTED - forced hospital restart.");
        }
    } else {
        // CJ is alive again, so allow the next WASTED sequence to be skipped.
        wastedRestartTriggered = false;
    }

    // -------------------------
    // BUSTED
    // -------------------------
    //
    // HAS_CHAR_BEEN_ARRESTED is paired with GTA's own CGameLogic state as an
    // additional safety check before modifying the internal arrest timer.
    const gameLogicState = Memory.ReadU8(GAMELOGIC_STATE, false);
    const busted = playerArrested && gameLogicState === GAMELOGIC_STATE_BUSTED;

    if (!busted) {
        // If this script muted CJ during the accelerated arrest transition,
        // restore his speech as soon as GTA leaves the BUSTED state.
        if (speechSuppressed) {
            native("ENABLE_CHAR_SPEECH", playerChar);
            speechSuppressed = false;
            log("[QuickRespawn] CJ speech restored.");
        }

        bustedRestartTriggered = false;
        continue;
    }

    if (enterJustPressed && !bustedRestartTriggered) {
        const gameTimer = native("GET_GAME_TIMER");
        const lastEvent = Memory.ReadI32(GAMELOGIC_TIME_OF_LAST_EVENT, false);
        const elapsed = gameTimer - lastEvent;

        // During a normal BUSTED sequence this timestamp should only be a few
        // seconds old. Refuse to write if the value looks unreasonable.
        if (elapsed >= 0 && elapsed < 10000) {
            bustedRestartTriggered = true;

            // Stop CJ's current arrest line and prevent another one from
            // beginning during the accelerated BUSTED transition.
            native("DISABLE_CHAR_SPEECH", playerChar, true);
            speechSuppressed = true;

            // GTA's BUSTED branch continues once 4000 ms have elapsed.
            // Move only that timestamp back and leave GTA responsible for the
            // police station, resurrection, wanted logic, weapons, and money.
            Memory.WriteI32(
                GAMELOGIC_TIME_OF_LAST_EVENT,
                gameTimer - 4001,
                false
            );

            // Finish the fade-to-black immediately. GTA can then perform its
            // normal police-station restart on the next game-logic update.
            native("DO_FADE", 0, 0);

            log("[QuickRespawn] ENTER pressed while BUSTED - accelerated police restart.");
        } else {
            log("[QuickRespawn] Safety check failed - arrest timer was not modified.");
        }
    }
}
