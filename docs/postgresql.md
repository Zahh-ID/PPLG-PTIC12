# PostgreSQL in Docker inside WSL

## Setup from Windows

WSL Ubuntu must have Docker Engine running and Docker Compose installed. The tooling uses `wsl -d Ubuntu -u root` because this machine's Linux user does not have Docker socket access. PostgreSQL itself runs as the image's postgres user. Windows PowerShell execution-policy changes are not required.

```sh
npm ci
npm run db:configure
npm run db:up
npm run db:migrate
npm start
```

`db:configure` writes a random password and DATABASE_URL to the ignored `.env`, preserving existing settings. Never print or commit it. The Compose file is `infra/compose.yaml`; project name is `logicworld`; the official image is `postgres:18`. Its named volume mounts at `/var/lib/postgresql`, the PostgreSQL 18+ layout. Port 5433 is bound to WSL localhost and forwarded by WSL to Windows localhost.

The `db:up` wrapper starts one hidden WSL keeper, protected by a Linux flock, because idle WSL can shut down Docker/systemd services after the command exits. It changes no system-wide WSL configuration. It remains until the distro shuts down. An open WSL terminal can also keep the distro active.

`npm run db:status`, `npm run db:restart`, `npm run db:stop` manage only this Compose project. Stop preserves the data volume. Start PostgreSQL before the game server. Restart the game server after restarting PostgreSQL; a broken database connection fails writes rather than falling back to a different save.

## Schema and migration

`server/migrations/001_initial.sql` defines worlds, ordered devices, player identities, inventories and JSON quest-progress storage. Startup applies missing migrations under a transaction lock. Every successful command updates devices and inventory in one transaction. A per-world advisory lock prevents two servers from overwriting each other's state. No database URL means explicit legacy JSON mode; a configured but unavailable database makes startup fail.

For a database world that does not yet exist, startup imports `DATA_DIR/world.json` if present and leaves the source untouched. Once a world exists in PostgreSQL, the JSON is never reimported. Keep the old file as a migration backup. WORLD_ID defaults to `workshop`; changing it selects a separate world.

## Tests

`npm run test:postgres` verifies import, migration idempotence, writer locks, transaction rollback, ordered device recovery, stored quest data and two-player server restart/rejoin. `npm run test:browser:postgres` verifies actual exported GDevelop clients. Each test uses a UUID-named world and removes only that world afterwards.

## Backup and recovery

From a WSL Ubuntu shell in this project's directory, create a consistent custom-format dump:

```sh
mkdir -p backups
sudo docker compose --env-file .env -f infra/compose.yaml exec -T postgres pg_dump -U logicworld -d logicworld -Fc > backups/logicworld.dump
```

The database contains reconnect tokens; keep dumps private. Restore into a NEW database, preserving the current one:

```sh
sudo docker compose --env-file .env -f infra/compose.yaml exec -T postgres createdb -U logicworld logicworld_restore
sudo docker compose --env-file .env -f infra/compose.yaml exec -T postgres pg_restore -U logicworld -d logicworld_restore --no-owner < backups/logicworld.dump
```

Stop the game server, change only the database name in local DATABASE_URL to `logicworld_restore`, then start and verify `/health` and the world. Do not remove the current database or volume to test recovery. Production backups and deployment automation remain future work.

References: [Docker's PostgreSQL guide](https://docs.docker.com/guides/postgresql), [node-postgres transactions](https://node-postgres.com/features/transactions).
