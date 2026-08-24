# Quick Respawn

A lightweight **CLEO Redux JavaScript mod for GTA San Andreas Classic** that lets you skip the long **WASTED** and **BUSTED** screen delays by pressing **Enter**.

The mod keeps GTA San Andreas in control of its normal hospital and police-station restart systems instead of manually recreating them.

## Features

- Press **Enter** while **WASTED** to immediately begin the normal hospital restart.
- Press **Enter** while **BUSTED** to immediately begin the normal police-station restart.
- Uses GTA SA's native death restart behavior for WASTED.
- Keeps GTA responsible for normal restart locations and penalties.
- Stops CJ's current arrest speech when a BUSTED skip is activated.
- Restores CJ's speech automatically after the BUSTED state ends.
- Does not manually teleport or resurrect CJ.

## Installation

1. Install **CLEO Redux** for GTA San Andreas Classic.
2. Copy `QuickRespawn[mem].js` into your CLEO directory.
3. Start GTA San Andreas.
4. When CJ is WASTED or BUSTED, press **Enter**.

> **Important:** Keep `[mem]` in the filename. The combined mod needs CLEO Redux memory permission for the BUSTED functionality.

## How WASTED Works

GTA San Andreas exposes a native script command named `FORCE_DEATH_RESTART`.

When Enter is pressed while CJ is dead, Quick Respawn calls that command and finishes the fade immediately. GTA then continues through its own normal hospital restart logic.

The script does not manually select the hospital, teleport CJ, or recreate the game's death penalties.

## How BUSTED Works

GTA San Andreas does **not** expose an equivalent `FORCE_ARREST_RESTART` command.

The normal BUSTED sequence waits roughly four seconds before GTA continues into its police-station restart routine.

Quick Respawn advances the game's existing internal BUSTED event timestamp past that waiting period. GTA's own code then performs the normal arrest restart.

The script does **not** manually:

- choose a police station
- teleport CJ
- resurrect CJ
- remove weapons
- apply arrest penalties

Those parts remain handled by GTA San Andreas itself.

## Why `[mem]` Is Required

The BUSTED event timestamp and state are stored in GTA San Andreas memory.

CLEO Redux requires explicit permission before scripts can access game memory, so the filename must contain:

`[mem]`

For example:

`QuickRespawn[mem].js`

The WASTED functionality itself does not need memory access, but the combined script still requires `[mem]` because the BUSTED functionality does.

## Compatibility

Designed for:

- **Grand Theft Auto: San Andreas Classic**
- **GTA SA 1.0 US executable / memory layout**
- **CLEO Redux JavaScript**

Because the BUSTED functionality uses memory addresses, compatibility should **not** be assumed for other GTA SA executable versions or **Grand Theft Auto: San Andreas – The Definitive Edition** without adapting the addresses.

## Testing

### WASTED

1. Get CJ killed outside a mission.
2. Wait until the WASTED sequence begins.
3. Press **Enter**.
4. Confirm that GTA proceeds into the normal hospital restart.

### BUSTED

1. Get arrested outside a mission.
2. Wait until the BUSTED sequence begins.
3. Press **Enter**.
4. Confirm that GTA proceeds into the normal police-station restart.
5. After respawning, confirm that CJ can speak normally again.

## Purpose

This project is intentionally small and readable.

Besides being a gameplay tweak, the source demonstrates two different approaches to working with GTA San Andreas through CLEO Redux:

- using a native game command when one exists
- carefully interacting with existing game state when no equivalent command is exposed

The goal is to preserve GTA's original systems rather than unnecessarily recreating them.

Feel free to study, modify, and build on the source in accordance with the repository's license.
