CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE worlds (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE players (
  world_id text NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  id uuid NOT NULL,
  reconnect_token text NOT NULL,
  inventory jsonb NOT NULL CHECK (jsonb_typeof(inventory) = 'object'),
  quest_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (world_id, id),
  UNIQUE (world_id, reconnect_token)
);
CREATE TABLE devices (
  world_id text NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('switch','wire','and','or','not','lamp','door','block')),
  x integer NOT NULL,
  y integer NOT NULL,
  is_on boolean NOT NULL DEFAULT false,
  sort_index integer NOT NULL,
  PRIMARY KEY (world_id, id),
  UNIQUE (world_id, x, y)
);
