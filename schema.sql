-- Brainy Bunch — Cloudflare D1 database schema
-- Apply with:  wrangler d1 execute brainy-bunch-db --file=./schema.sql --remote

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT UNIQUE NOT NULL,   -- lowercased, used for login + uniqueness
  display_name TEXT NOT NULL,          -- original casing, shown on leaderboard
  pass_hash    TEXT NOT NULL,          -- PBKDF2-SHA256 hash (hex)
  pass_salt    TEXT NOT NULL,          -- per-user salt (hex)
  phrase_hash  TEXT,                   -- optional security phrase hash (hex)
  phrase_salt  TEXT,                   -- optional security phrase salt (hex)
  save_data    TEXT,                   -- JSON blob of the whole game state
  coins        INTEGER NOT NULL DEFAULT 0,  -- denormalised for fast leaderboard
  level        INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- Sessions: random opaque tokens, so no signing secret is needed.
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leaderboard reads sort by coins; index keeps it fast as users grow.
CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
