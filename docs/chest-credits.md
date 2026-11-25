# Developer credits

Credits are always available from the opening, pause, winner and game-over menus. There are no developer chests or keycard pickups in the eight gameplay levels, and credits grant no gameplay rewards.

| Developer | Role | NIM |
| --- | --- | --- |
| Syahruzzahid | Programmer | 2405336104 |
| Nazwa Hilmia Zida | Artist | 24053360454 |
| Syarifatus Sholihah | Level Design | 240533602750 |

The supplied portraits remain in `assets/developer-portraits-v1`. Names, roles and NIMs are editable text objects in each scene's interface folder. Closing credits returns to the pause menu when opened there; otherwise it returns to the current menu. Gameplay remains paused while credits are open.

The shared controller is `src/events/ui.js`. Run `npm run events:push` after editing readable event sources. The former chest artwork remains in the source asset archive for reuse; its objects, pickups, HUD indicator and reveal logic are no longer used.
