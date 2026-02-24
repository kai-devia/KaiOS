const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

// Protect all vault routes with JWT auth
router.use(authMiddleware);

const SECRETS_DIR = process.env.VAULT_SECRETS_DIR || '/app/vault-secrets';
const SECRETS_FILES = {
  CORE: process.env.VAULT_SECRETS_PATH || `${SECRETS_DIR}/accounts.env`,
  PO:   `${SECRETS_DIR}/po-secrets.env`,
};

const VALID_MODES = ['CORE', 'PO'];

function resolveMode(req) {
  const m = req.query.mode || req.body?.mode || 'CORE';
  return VALID_MODES.includes(m) ? m : 'CORE';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashPin(pin) {
  return crypto.createHash('sha256').update(`vault-kai-2026:${pin}`).digest('hex');
}

function getVaultConfig(mode) {
  if (mode === 'PO') {
    // Separate table for PO vault PIN
    db.exec(`CREATE TABLE IF NOT EXISTS vault_config_po (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    return db.prepare('SELECT * FROM vault_config_po WHERE id = 1').get() || null;
  }
  // CORE (default)
  db.exec(`CREATE TABLE IF NOT EXISTS vault_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pin_hash TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  return db.prepare('SELECT * FROM vault_config WHERE id = 1').get() || null;
}

function saveVaultConfig(mode, pinHash) {
  const table = mode === 'PO' ? 'vault_config_po' : 'vault_config';
  const config = getVaultConfig(mode);
  if (config) {
    db.prepare(`UPDATE ${table} SET pin_hash = ? WHERE id = 1`).run(pinHash);
  } else {
    db.prepare(`INSERT INTO ${table} (id, pin_hash) VALUES (1, ?)`).run(pinHash);
  }
}

/**
 * Parse .env file preserving structure (comments, blank lines, sections).
 * Returns array of { type: 'comment'|'blank'|'entry', key?, value?, raw }
 */
function parseEnvFile(content) {
  const lines = content.split('\n');
  const result = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === '') {
      result.push({ type: 'blank', raw });
    } else if (trimmed.startsWith('#')) {
      result.push({ type: 'comment', raw, text: trimmed.slice(1).trim() });
    } else {
      const eqIdx = raw.indexOf('=');
      if (eqIdx > 0) {
        const key = raw.slice(0, eqIdx).trim();
        let value = raw.slice(eqIdx + 1);
        // Strip surrounding quotes
        const unquoted = value.replace(/^["']|["']$/g, '');
        result.push({ type: 'entry', key, value: unquoted, raw });
      } else {
        // Unrecognized line — keep as-is
        result.push({ type: 'blank', raw });
      }
    }
  }

  return result;
}

function maskValue(value) {
  if (!value || value.length <= 4) return '••••';
  return value.slice(0, 3) + '•'.repeat(Math.min(value.length - 3, 20));
}

function getSecretsFilePath(mode) {
  return SECRETS_FILES[mode] || SECRETS_FILES.CORE;
}

function readSecretsFile(mode) {
  const filePath = getSecretsFilePath(mode);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function writeSecretsFile(content, mode) {
  const filePath = getSecretsFilePath(mode);
  fs.writeFileSync(filePath, content, 'utf8');
}

function updateKeyInFile(key, newValue, mode) {
  const content = readSecretsFile(mode);
  const lines = content.split('\n');
  let found = false;

  const updated = lines.map(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0 && line.slice(0, eqIdx).trim() === key) {
      found = true;
      // Preserve quotes if value has spaces
      const needsQuotes = newValue.includes(' ');
      return `${key}=${needsQuotes ? `"${newValue}"` : newValue}`;
    }
    return line;
  });

  if (!found) {
    // Append new key
    updated.push(`${key}=${newValue}`);
  }

  writeSecretsFile(updated.join('\n'), mode);
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/vault/status?mode=CORE|PO
 * Returns whether PIN is configured for the given mode
 */
router.get('/status', (req, res) => {
  const mode = resolveMode(req);
  const config = getVaultConfig(mode);
  res.json({ pinConfigured: !!(config && config.pin_hash), mode });
});

/**
 * POST /api/vault/setup-pin
 * Body: { pin: "1234", mode: "CORE"|"PO" }
 */
router.post('/setup-pin', (req, res) => {
  const { pin } = req.body;
  const mode = resolveMode(req);

  if (!pin || pin.length < 4) {
    return res.status(400).json({ error: 'PIN debe tener al menos 4 dígitos' });
  }

  const pinHash = hashPin(String(pin));
  saveVaultConfig(mode, pinHash);
  res.json({ ok: true });
});

/**
 * POST /api/vault/verify-pin
 * Body: { pin: "1234", mode: "CORE"|"PO" }
 */
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  const mode = resolveMode(req);
  const config = getVaultConfig(mode);
  if (!config || !config.pin_hash) {
    return res.status(400).json({ error: 'PIN no configurado' });
  }
  const valid = config.pin_hash === hashPin(String(pin));
  res.json({ valid });
});

/**
 * GET /api/vault/entries?mode=CORE|PO
 * Returns entries with masked values (no PIN required — list is safe to show)
 */
router.get('/entries', (req, res) => {
  const mode = resolveMode(req);
  const content = readSecretsFile(mode);
  const parsed = parseEnvFile(content);

  const entries = parsed.map(item => {
    if (item.type === 'entry') {
      return { type: 'entry', key: item.key, masked: maskValue(item.value) };
    }
    return item;
  });

  res.json({ entries });
});

/**
 * POST /api/vault/reveal
 * Body: { key: "GITHUB_TOKEN", pin: "1234", mode: "CORE"|"PO" }
 */
router.post('/reveal', (req, res) => {
  const { key, pin } = req.body;
  const mode = resolveMode(req);
  if (!key || !pin) return res.status(400).json({ error: 'key y pin requeridos' });

  const config = getVaultConfig(mode);
  if (!config || config.pin_hash !== hashPin(String(pin))) {
    return res.status(403).json({ error: 'PIN incorrecto' });
  }

  const content = readSecretsFile(mode);
  const parsed = parseEnvFile(content);
  const entry = parsed.find(e => e.type === 'entry' && e.key === key);

  if (!entry) return res.status(404).json({ error: 'Clave no encontrada' });
  res.json({ key, value: entry.value });
});

/**
 * PATCH /api/vault/entries/:key
 * Body: { value: "new-value", pin: "1234", mode: "CORE"|"PO" }
 */
router.patch('/entries/:key', (req, res) => {
  const { key } = req.params;
  const { value, pin } = req.body;
  const mode = resolveMode(req);

  if (!pin) return res.status(400).json({ error: 'PIN requerido' });
  if (value === undefined) return res.status(400).json({ error: 'value requerido' });

  const config = getVaultConfig(mode);
  if (!config || config.pin_hash !== hashPin(String(pin))) {
    return res.status(403).json({ error: 'PIN incorrecto' });
  }

  try {
    updateKeyInFile(key, value, mode);
    res.json({ ok: true, key, masked: maskValue(value) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
