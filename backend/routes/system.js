const express = require('express');
const os = require('os');
const { exec } = require('child_process');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Auth middleware for all system routes
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
});

/**
 * Calculate CPU usage by sampling over 500ms
 */
function getCpuUsage() {
  return new Promise((resolve) => {
    const sample1 = os.cpus();

    setTimeout(() => {
      const sample2 = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      for (let i = 0; i < sample1.length; i++) {
        const s1 = sample1[i].times;
        const s2 = sample2[i].times;

        const idleDiff = s2.idle - s1.idle;
        const totalDiff =
          (s2.user - s1.user) +
          (s2.nice - s1.nice) +
          (s2.sys - s1.sys) +
          (s2.idle - s1.idle) +
          (s2.irq - s1.irq);

        totalIdle += idleDiff;
        totalTick += totalDiff;
      }

      const usage = totalTick === 0 ? 0 : ((totalTick - totalIdle) / totalTick) * 100;
      resolve(Math.round(usage * 10) / 10);
    }, 500);
  });
}

/**
 * Get disk usage via df command
 */
function getDiskUsage() {
  return new Promise((resolve) => {
    exec('df -BG / 2>/dev/null', (err, stdout) => {
      if (err) {
        resolve({ total: 0, used: 0, free: 0, percent: 0 });
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) {
          resolve({ total: 0, used: 0, free: 0, percent: 0 });
          return;
        }

        // Parse line like: /dev/sda1  500G  120G  380G  24% /
        const parts = lines[1].split(/\s+/);
        const total = parseInt(parts[1]) || 0;
        const used = parseInt(parts[2]) || 0;
        const free = parseInt(parts[3]) || 0;
        const percent = parseFloat(parts[4]) || 0;

        resolve({ total, used, free, percent });
      } catch (_) {
        resolve({ total: 0, used: 0, free: 0, percent: 0 });
      }
    });
  });
}

/**
 * GET /api/system/metrics
 * Returns real-time system metrics: CPU, RAM, Disk, Uptime
 */
router.get('/metrics', async (req, res) => {
  try {
    const [cpuUsage, disk] = await Promise.all([
      getCpuUsage(),
      getDiskUsage(),
    ]);

    const cpus = os.cpus();
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);  // MB
    const freeMem = Math.round(os.freemem() / 1024 / 1024);    // MB
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 1000) / 10;

    res.json({
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: memPercent,
      },
      disk: {
        total: disk.total,
        used: disk.used,
        free: disk.free,
        percent: disk.percent,
      },
      uptime: Math.floor(os.uptime()),   // system uptime in seconds
      platform: os.platform(),
      hostname: os.hostname(),
    });
  } catch (err) {
    console.error('Error getting system metrics:', err);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

/**
 * GET /api/system/subagents
 * Returns count of active subagents.
 * TODO: Implement proper detection via OpenClaw internal API or log parsing.
 * For now returns a hardcoded count of 0.
 */
router.get('/subagents', (req, res) => {
  // TODO: Parse /home/kai/.openclaw/workspace/memory/ logs or query
  // the OpenClaw internal API to get active subagent count.
  res.json({ count: 0 });
});

module.exports = router;
