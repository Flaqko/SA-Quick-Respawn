// Quick Respawn
// GTA San Andreas Classic 1.0 US + CLEO Redux JavaScript
//
// While CJ is WASTED or BUSTED, use any NEW keyboard key, mouse button, or
// supported controller button to skip the normal screen delay and immediately
// continue into GTA SA's normal restart routine.
//
// Input already held when the WASTED/BUSTED sequence begins is ignored.
// It must be released and pressed again before it can trigger a skip.
//
// The WASTED path uses GTA SA's native FORCE_DEATH_RESTART command.
// The BUSTED path requires [mem] because GTA SA does not expose an equivalent
// FORCE_ARREST_RESTART command.
//
// When BUSTED is skipped, CJ's current arrest speech is stopped so it does not
// continue over the accelerated transition. Speech is restored afterward.

/// <reference path=".config/sa.d.ts" />

const PLAYER_ID = 0;

// GTA SA Classic 1.0 US - CGameLogic globals.
// The normal BUSTED logic waits until 4000 ms have passed since TimeOfLastEvent.
const GAMELOGIC_TIME_OF_LAST_EVENT = 0x96A8AC;
const GAMELOGIC_STATE = 0x96A8B0;
const GAMELOGIC_STATE_BUSTED = 2;

// Keyboard virtual-key range.
const FIRST_KEYBOARD_VK = 0x08;
const LAST_KEYBOARD_VK = 0xFE;

// Mouse buttons supported by CLEO Input's IS_KEY_DOWN.
const MOUSE_BUTTONS = [
    0x01, // Left
    0x02, // Right
    0x04, // Middle
    0x05, // Mouse 4
    0x06  // Mouse 5
];

// GTA Pad 1 digital action buttons.
//
// These are GTA's mapped game actions rather than Xbox-specific hardware
// inputs, so any controller GTA itself recognizes can use them.
//
// Analogue-stick axes (0-3) are deliberately excluded.
// START/Pause (12) is excluded so skipping does not also open the pause menu.
const PAD_ID = 0;
const CONTROLLER_BUTTONS = [
    4, 5, 6, 7,       // shoulder / mapped actions
    8, 9, 10, 11,     // D-pad
    13,                // Select / camera
    14, 15, 16, 17,   // face buttons
    18, 19             // stick clicks
];

const controllerWasDown = new Array(20).fill(false);

let activeScene = 0; // 0 = none, 1 = WASTED, 2 = BUSTED
let wastedRestartTriggered = false;
let bustedRestartTriggered = false;
let speechSuppressed = false;

function snapshotControllerButtons() {
    for (const button of CONTROLLER_BUTTONS) {
        controllerWasDown[button] =
            native("IS_BUTTON_PRESSED", PAD_ID, button);
    }
}

function getFreshInputSource() {
    // CLEO Input's IS_KEY_DOWN is edge-triggered. Keyboard/mouse input already
    // held before this frame will not count until released and pressed again.

    for (const vk of MOUSE_BUTTONS) {
        if (native("IS_KEY_DOWN", vk)) {
            return "mouse";
        }
    }

    for (let vk = FIRST_KEYBOARD_VK; vk <= LAST_KEYBOARD_VK; vk++) {
        if (native("IS_KEY_DOWN", vk)) {
            return "keyboard";
        }
    }

    // GTA's IS_BUTTON_PRESSED is a held-state check, so create our own
    // UP -> DOWN detection for controller buttons.
    for (const button of CONTROLLER_BUTTONS) {
        const down = native("IS_BUTTON_PRESSED", PAD_ID, button);

        if (down && !controllerWasDown[button]) {
            controllerWasDown[button] = down;
            return "controller button " + button;
        }

        controllerWasDown[button] = down;
    }

    return "";
}

function beginScene(sceneType) {
    activeScene = sceneType;

    // Record controller buttons that are already held when WASTED/BUSTED
    // begins. They must be released and pressed again before they can skip.
    snapshotControllerButtons();
}

log("[QuickRespawn] loaded - fresh keyboard, mouse, or controller input skips WASTED/BUSTED.");

while (true) {
    wait(0);

    const playerChar = native("GET_PLAYER_CHAR", PLAYER_ID);
    const playerDead = native("IS_PLAYER_DEAD", PLAYER_ID);
    const playerArrested = native("HAS_CHAR_BEEN_ARRESTED", playerChar);

    // Pair HAS_CHAR_BEEN_ARRESTED with GTA's own CGameLogic state as an
    // additional safety check before modifying the internal arrest timer.
    const gameLogicState = Memory.ReadU8(GAMELOGIC_STATE, false);
    const busted = playerArrested && gameLogicState === GAMELOGIC_STATE_BUSTED;

    // WASTED takes priority if GTA ever reports both states during a transition.
    const currentScene = playerDead ? 1 : (busted ? 2 : 0);

    // Detect the beginning of a new WASTED/BUSTED sequence and snapshot keys.
    if (currentScene !== activeScene) {
        if (currentScene === 1) {
            beginScene(1);
            log("[QuickRespawn] WASTED detected - waiting for fresh keyboard, mouse, or controller input.");
        } else if (currentScene === 2) {
            beginScene(2);
            log("[QuickRespawn] BUSTED detected - waiting for fresh keyboard, mouse, or controller input.");
        } else {
            activeScene = 0;
        }
    }

    // Restore CJ's speech as soon as GTA leaves the BUSTED state.
    if (!busted && speechSuppressed) {
        native("ENABLE_CHAR_SPEECH", playerChar);
        speechSuppressed = false;
        log("[QuickRespawn] CJ speech restored.");
    }

    // Reset the one-scene guards after GTA leaves each state.
    if (!playerDead) {
        wastedRestartTriggered = false;
    }

    if (!busted) {
        bustedRestartTriggered = false;
    }

    // Do not scan the keyboard during normal gameplay.
    if (currentScene === 0) {
        continue;
    }

    // Only fresh input after the scene began can skip it.
    const inputSource = getFreshInputSource();
    const skipPressed = inputSource !== "";

    // -------------------------
    // WASTED
    // -------------------------
    if (currentScene === 1 && skipPressed && !wastedRestartTriggered) {
        wastedRestartTriggered = true;

        // GTA retains control of the normal hospital restart, including
        // restart-point selection and the game's usual death penalties.
        native("FORCE_DEATH_RESTART");

        // Finish the fade-to-black immediately so GTA can continue without the
        // usual long WASTED transition.
        native("DO_FADE", 0, 0);

        log("[QuickRespawn] Fresh " + inputSource + " input while WASTED - forced hospital restart.");
        continue;
    }

    // -------------------------
    // BUSTED
    // -------------------------
    if (currentScene === 2 && skipPressed && !bustedRestartTriggered) {
        const gameTimer = native("GET_GAME_TIMER");
        const lastEvent = Memory.ReadI32(GAMELOGIC_TIME_OF_LAST_EVENT, false);
        const elapsed = gameTimer - lastEvent;

        // During a normal BUSTED sequence this timestamp should only be a few
        // seconds old. Refuse to write if the value looks unreasonable.
        if (elapsed >= 0 && elapsed < 10000) {
            bustedRestartTriggered = true;

            // Stop CJ's current arrest line and prevent another one from
            // beginning during the accelerated transition.
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

            log("[QuickRespawn] Fresh " + inputSource + " input while BUSTED - accelerated police restart.");
        } else {
            log("[QuickRespawn] Safety check failed - arrest timer was not modified.");
        }
    }
}
