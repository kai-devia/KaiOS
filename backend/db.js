const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'kai_doc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Migrations ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'BACKLOG',
    priority    TEXT    DEFAULT 'Medio',
    effort      TEXT    DEFAULT 'Medio',
    task_type   TEXT    DEFAULT '',
    project     TEXT    DEFAULT '',
    assignee    TEXT    DEFAULT '',
    started_at  TEXT,
    finished_at TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'FINALIZADO',
    owner       TEXT    DEFAULT 'Kai',
    notify      TEXT    DEFAULT 'NO',
    schedule    TEXT    DEFAULT '',
    last_run    TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Acumulado diario de tokens de Claude
  CREATE TABLE IF NOT EXISTS claude_daily_usage (
    date          TEXT PRIMARY KEY,
    input_tokens  INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0
  );

  -- Historial del chat PWA
  CREATE TABLE IF NOT EXISTS chat_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    role       TEXT NOT NULL,   -- 'user' | 'assistant'
    content    TEXT NOT NULL,
    agent_id   TEXT NOT NULL DEFAULT 'kai',  -- 'kai' | 'po-kai'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Último snapshot leído de sessions.json (para calcular deltas)
  CREATE TABLE IF NOT EXISTS claude_usage_snapshot (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    input_tokens  INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    captured_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Límites manuales de claude.ai (el usuario los actualiza desde settings)
  CREATE TABLE IF NOT EXISTS claude_web_limits (
    id                       INTEGER PRIMARY KEY CHECK (id = 1),
    session_pct              INTEGER NOT NULL DEFAULT 0,
    weekly_all_pct           INTEGER NOT NULL DEFAULT 0,
    weekly_sonnet_pct        INTEGER NOT NULL DEFAULT 0,
    session_resets_in        TEXT    DEFAULT '',
    weekly_resets_at         TEXT    DEFAULT '',
    estimated_weekly_limit   INTEGER DEFAULT NULL,
    calibrated_at            TEXT    DEFAULT NULL,
    updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Runtime migrations (ALTER TABLE para columnas añadidas después) ──────
const alterMigrations = [
  `ALTER TABLE claude_web_limits ADD COLUMN estimated_weekly_limit INTEGER DEFAULT NULL`,
  `ALTER TABLE claude_web_limits ADD COLUMN calibrated_at TEXT DEFAULT NULL`,
  `ALTER TABLE claude_web_limits ADD COLUMN session_expired INTEGER DEFAULT 0`,
  `ALTER TABLE claude_web_limits ADD COLUMN session_key TEXT DEFAULT NULL`,
  // Vault PIN storage
  `CREATE TABLE IF NOT EXISTS vault_config (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    pin_hash   TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Multi-agent support: add agent_id column to chat_messages
  `ALTER TABLE chat_messages ADD COLUMN agent_id TEXT NOT NULL DEFAULT 'kai'`,
  // Mode isolation: add mode column to tasks and events
  `ALTER TABLE tasks ADD COLUMN mode TEXT NOT NULL DEFAULT 'CORE'`,
  `ALTER TABLE events ADD COLUMN mode TEXT NOT NULL DEFAULT 'CORE'`,
  // Vault PIN for PO mode (separate table — vault_config has CHECK(id=1))
  `CREATE TABLE IF NOT EXISTS vault_config_po (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    pin_hash   TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Multi-profile Claude usage (personal, ntasys)
  `CREATE TABLE IF NOT EXISTS claude_web_limits_profiles (
    profile              TEXT PRIMARY KEY,
    session_pct          INTEGER NOT NULL DEFAULT 0,
    weekly_all_pct       INTEGER NOT NULL DEFAULT 0,
    weekly_sonnet_pct    INTEGER NOT NULL DEFAULT 0,
    session_resets_in    TEXT    DEFAULT '',
    weekly_resets_at     TEXT    DEFAULT '',
    session_expired      INTEGER DEFAULT 0,
    session_key          TEXT    DEFAULT NULL,
    updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
  )`,
  // Budget calculation columns for profiles
  `ALTER TABLE claude_web_limits_profiles ADD COLUMN weekly_resets_at_iso TEXT DEFAULT NULL`,
  `ALTER TABLE claude_web_limits_profiles ADD COLUMN weekly_available_pct REAL DEFAULT 0`,
  `ALTER TABLE claude_web_limits_profiles ADD COLUMN weekly_hours_until_reset REAL DEFAULT 0`,
  `ALTER TABLE claude_web_limits_profiles ADD COLUMN weekly_daily_budget_pct REAL DEFAULT 0`,
  // Agent settings: color, future display overrides
  `CREATE TABLE IF NOT EXISTS agent_settings (
    agent_id   TEXT PRIMARY KEY,
    color      TEXT NOT NULL DEFAULT '#00d4aa',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Agent runtime status: live | working | offline + optional task description
  `CREATE TABLE IF NOT EXISTS agent_status (
    agent_id   TEXT PRIMARY KEY,
    state      TEXT NOT NULL DEFAULT 'offline',
    task       TEXT DEFAULT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];
for (const sql of alterMigrations) {
  try { db.exec(sql); } catch { /* column already exists — ignore */ }
}

// ─── Cleanup ───────────────────────────────────────────────────────────────
db.prepare("DELETE FROM otp_codes WHERE expires_at < datetime('now')").run();

// ─── Seed ──────────────────────────────────────────────────────────────────
const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
if (eventsCount.count === 0) {
  db.prepare(`
    INSERT INTO events (name, description, status, owner, notify, schedule)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'Revisar Registro de Tareas',
    'Revisar tareas en LISTO PARA EMPEZAR asignadas a Kai y ejecutarlas',
    'FINALIZADO',
    'Kai',
    'NO',
    'cada 30 min'
  );
  console.log('📦 DB seeded: initial event created');
}

console.log(`✅ SQLite ready at ${dbPath}`);

module.exports = db;

// ── Agent Capabilities ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_capabilities (
    agent_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (agent_id, capability)
  )
`);

// Default capabilities
const DEFAULT_CAPABILITIES = {
  core: ['mail', 'jira', 'github'],
  po:   ['jira'],
  fe:   ['jira', 'github'],
  be:   ['jira', 'github'],
  ux:   ['jira'],
  qa:   ['jira', 'github'],
};

// Seed defaults if table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM agent_capabilities').get();
if (count.c === 0) {
  const insert = db.prepare('INSERT OR IGNORE INTO agent_capabilities (agent_id, capability, enabled) VALUES (?, ?, 1)');
  for (const [agentId, caps] of Object.entries(DEFAULT_CAPABILITIES)) {
    for (const cap of caps) {
      insert.run(agentId, cap);
    }
  }
}
