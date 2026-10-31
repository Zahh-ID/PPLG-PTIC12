# Vertical slice notes

One 160-column world, 16px terrain, editable workshop, inventory, remote avatars and an atomic example-circuit command. Edits are serialized, checked for bounds, range, occupancy, player overlap, inventory and feedback, saved, then broadcast. Full snapshots are used initially; visibility subscriptions and deltas remain future work.

## Protocol v1

JSON messages have `v: 1`. Maximum payload 4KB; 50 messages/second per connection; server pings every ten seconds; maximum eight joined players.

| Client message | Fields |
| --- | --- |
| `join` | Optional reconnect `token` |
| `move` | Finite pixel `x`, `y`, sent at 10Hz |
| `place` | `kind`, integer grid `x`, `y` |
| `toggle`, `remove` | Device `id` |
| `example` | Build predefined AND circuit transaction |
| `ping` | Application heartbeat |

Server messages: `welcome` (identity, token, inventory, spawn), `world` (revision, devices, signals), `presence`, `inventory`, `correction`, `error`, `pong`. Browser sessionStorage holds each tab's token. Duplicate active identities are rejected. Rejoining returns to spawn with existing inventory and the saved world; positions are transient.

## Decisions and limits

- Custom `ws` transport follows Trello card 06's custom-adapter option. Colyseus matchmaking/schema replication is deferred.
- Atomic versioned JSON saves test restart/rejoin without a database dependency. Use one server process per save directory. Malformed saves fail startup rather than being silently discarded. PostgreSQL, migrations and personal quest progress remain card 08 work.
- Four-way wire tiles form undirected nets; device ports are directional. Multiple sources on a net combine with OR. Feedback loops are rejected. Gates temporarily occupy 32x48 to separate inputs with an empty row. Final 32x16 art needs wire orientation or insulation rules before reducing the footprint.
- Movement uses local GDevelop physics and interpolated remote sprites. Speed and bounds checks do not provide authoritative collision/anti-cheat simulation. Edits and circuit state are authoritative.
- Original code-authored sprites are development placeholders. Card 05's animation, metadata and accessible state-cue requirements remain incomplete.

Remaining: full tilemap and three regions (01/02), richer inventory UX and exploit tests (03), final art (05), eight-player testing/subscriptions (07), PostgreSQL (08), quests and assessments (09–12), staging deployment/database operations (13). Trello cards stay open until their full acceptance criteria pass.
