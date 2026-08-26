# Quick Respawn

A lightweight **CLEO Redux JavaScript mod for GTA San Andreas Classic** that lets you skip the normal **WASTED** and **BUSTED** screen delays with any fresh keyboard, mouse, or supported controller input.

Quick Respawn keeps GTA San Andreas in control of the actual hospital and police-station restart logic instead of manually recreating those systems.

## Features

- Skip **WASTED** with any fresh supported input.
- Skip **BUSTED** with any fresh supported input.
- Supports keyboard, mouse, and GTA-mapped controller buttons.
- Ignores input already being held when WASTED/BUSTED begins.
- Preserves GTA's normal hospital and police-station restart behavior.
- Preserves normal death/arrest penalties and restart-point selection.
- Stops CJ's current arrest speech when BUSTED is skipped.
- Restores CJ's speech automatically afterward.

## Input Support

### Keyboard

Any fresh keyboard key can trigger the skip.

### Mouse

Supported mouse buttons:

- Left click
- Right click
- Middle click
- Mouse 4
- Mouse 5

### Controller

Quick Respawn reads **GTA San Andreas' mapped Pad 1 actions** rather than relying on Xbox-specific hardware codes.

Supported digital controller input includes:

- face buttons
- D-pad
- shoulder / mapped action buttons
- Select / camera
- left and right stick clicks

**Start/Pause is intentionally excluded** so it does not both skip the transition and open the pause menu.

Analog stick movement is not used as skip input.

## Fresh Input Behavior

Input that is already being held when WASTED or BUSTED begins is ignored.

For example, if CJ dies while you are holding **W**:

1. WASTED begins.
2. Quick Respawn recognizes that **W** was already held.
3. Continuing to hold **W** does nothing.
4. Release **W** and press it again — or use another fresh supported input.
5. The WASTED delay is skipped.

The same rule applies to mouse and controller buttons.

This prevents normal gameplay input from accidentally skipping the screen immediately.

## Installation

1. Install **CLEO Redux** for GTA San Andreas Classic.
2. Copy `QuickRespawn[mem].js` into your CLEO directory.
3. Start GTA San Andreas.
4. When WASTED or BUSTED appears, use any fresh supported input.

> **Important:** Keep `[mem]` in the filename. The BUSTED functionality requires CLEO Redux memory permission.

## How WASTED Works

GTA San Andreas exposes a native script command named `FORCE_DEATH_RESTART`.

When fresh input is received while CJ is WASTED, Quick Respawn calls GTA's own death-restart command and finishes the transition fade immediately.

GTA remains responsible for:

- hospital restart selection
- normal death penalties
- resurrection
- restart logic

The mod does not manually teleport or revive CJ.

## How BUSTED Works

GTA San Andreas does **not** expose an equivalent `FORCE_ARREST_RESTART` script command.

The normal BUSTED sequence waits several seconds before continuing into GTA's police-station restart routine.

Quick Respawn advances the game's existing internal BUSTED event timestamp past that wait. GTA then continues through its own original arrest-restart logic.

The mod does **not** manually:

- choose a police station
- teleport CJ
- resurrect CJ
- remove weapons
- apply arrest penalties

Those systems remain handled by GTA San Andreas itself.

## Arrest Speech

When BUSTED is skipped, CJ's current arrest speech is stopped so it does not continue over the accelerated transition.

His speech is automatically restored after GTA leaves the BUSTED state.

## Why `[mem]` Is Required

The WASTED functionality itself does not require direct memory access.

The BUSTED functionality does, because GTA does not expose a native arrest-restart command and the mod must access GTA's internal BUSTED state/timer.

CLEO Redux requires explicit memory permission, so the filename must remain:

`QuickRespawn[mem].js`

## Compatibility

Designed for:

- **Grand Theft Auto: San Andreas Classic**
- **GTA SA 1.0 US executable / memory layout**
- **CLEO Redux JavaScript**

Because the BUSTED functionality uses fixed GTA SA memory addresses, compatibility should **not** be assumed for other executable versions or **Grand Theft Auto: San Andreas – The Definitive Edition** without adapting those addresses.

## For Learners

The source is intentionally commented and readable.

It demonstrates two different ways of working with GTA San Andreas through CLEO Redux:

- using a native game command when one exists
- carefully interacting with existing game state when no equivalent command is exposed
- edge-triggered keyboard and mouse input
- fresh-press controller detection
- preserving GTA's original restart systems rather than reimplementing them

## License

Released under the **MIT License**. See `LICENSE` for details.
