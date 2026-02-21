const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, authUser, authPass, jwtExpiry } = require('../config/env');

const router = express.Router();

// Hash password on startup for comparison
const hashedPass = bcrypt.hashSync(authPass, 10);

/**
 * POST /api/auth/login
 * Body: { user: string, password: string }
 * Returns: { token: string }
 */
router.post('/login', (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (user !== authUser) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  if (!bcrypt.compareSync(password, hashedPass)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ user }, jwtSecret, { expiresIn: jwtExpiry });

  res.json({ token });
});

module.exports = router;
