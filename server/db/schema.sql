-- SQLite schema. Booleans = INTEGER 0/1, JSON = TEXT, dates = TEXT (ISO).

CREATE TABLE IF NOT EXISTS campaigns (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  org_name      TEXT NOT NULL,
  swish_number  TEXT NOT NULL,
  goal_amount   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  theme         TEXT NOT NULL DEFAULT '{}',
  content       TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS players (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id      INTEGER NOT NULL REFERENCES campaigns(id),
  token            TEXT NOT NULL UNIQUE,
  nickname         TEXT NOT NULL,
  unlocked_level   INTEGER NOT NULL DEFAULT 1,
  invited_by_code  TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
  player_id       INTEGER NOT NULL REFERENCES players(id),
  level           INTEGER NOT NULL DEFAULT 1,
  score           INTEGER NOT NULL DEFAULT 0,
  candles_lit     INTEGER NOT NULL DEFAULT 0,
  levels_cleared  INTEGER NOT NULL DEFAULT 0,
  hearts_left     INTEGER NOT NULL DEFAULT 3,
  started_at      TEXT NOT NULL,
  finished_at     TEXT
);

CREATE TABLE IF NOT EXISTS invites (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id         INTEGER NOT NULL REFERENCES campaigns(id),
  inviter_player_id   INTEGER NOT NULL REFERENCES players(id),
  code                TEXT NOT NULL UNIQUE,
  clicks              INTEGER NOT NULL DEFAULT 0,
  invited_player_id   INTEGER REFERENCES players(id),
  completed_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS donation_intents (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id),
  session_id   INTEGER REFERENCES game_sessions(id),
  amount       INTEGER NOT NULL,
  method       TEXT NOT NULL CHECK (method IN ('qr', 'swish_link')),
  status       TEXT NOT NULL DEFAULT 'shown' CHECK (status IN ('shown', 'clicked', 'simulated_paid')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sms_leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id),
  player_id    INTEGER REFERENCES players(id),
  phone        TEXT NOT NULL,
  consent      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
