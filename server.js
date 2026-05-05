const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined in environment.");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ═══════════════════════════ STATIC FILES ═══════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════ DATABASE ═══════════════════════════
const { pool } = require('./db');

const initDB = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name VARCHAR(255) DEFAULT '',
      city VARCHAR(255) DEFAULT '',
      latitude REAL DEFAULT 48.8566,
      longitude REAL DEFAULT 2.3522,
      calc_method INTEGER DEFAULT 3,
      data TEXT DEFAULT '{}',
      location TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Migrations for columns
    const cols = [
      ['name', "VARCHAR(255) DEFAULT ''"],
      ['city', "VARCHAR(255) DEFAULT ''"],
      ['latitude', "REAL DEFAULT 48.8566"],
      ['longitude', "REAL DEFAULT 2.3522"],
      ['calc_method', "INTEGER DEFAULT 3"],
      ['created_at', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
      ['updated_at', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"]
    ];
    for (const [col, type] of cols) {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => {});
    }
    console.log('✅ Base de données structurée (users)');
  } catch (err) {
    console.error('❌ Erreur initialisation DB:', err);
  }
};
initDB();

// ═══════════════════════════ MIDDLEWARE ═══════════════════════════
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Simple rate limiting
const rateLimits = {};
const rateLimit = (key, maxReqs = 10, windowMs = 60000) => {
  const now = Date.now();
  if (!rateLimits[key]) rateLimits[key] = [];
  rateLimits[key] = rateLimits[key].filter(t => now - t < windowMs);
  if (rateLimits[key].length >= maxReqs) return false;
  rateLimits[key].push(now);
  return true;
};

// ═══════════════════════════ AUTH ROUTES ═══════════════════════════

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, city } = req.body;
  const ip = req.ip;

  if (!rateLimit(`reg_${ip}`, 5, 300000)) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie dans 5 minutes' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password, name, city) VALUES ($1, $2, $3, $4) RETURNING id`,
      [email.toLowerCase().trim(), hashedPassword, name || '', city || '']
    );
    const newUserId = result.rows[0].id;
    const token = jwt.sign({ id: newUserId, email: email.toLowerCase() }, SECRET_KEY, { expiresIn: '90d' });
    res.json({ token, message: 'Compte créé avec succès ! بارك الله فيك' });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  if (!rateLimit(`login_${ip}`, 10, 300000)) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie dans 5 minutes' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Identifiants incorrects' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '90d' });
    res.json({ token, message: 'Connexion réussie ! مرحبا' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════ PROFILE ROUTES ═══════════════════════════

// Get Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, city, latitude, longitude, calc_method, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, city, latitude, longitude, calc_method } = req.body;

  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (name !== undefined) { updates.push(`name = $${paramIdx++}`); values.push(String(name).substring(0, 100)); }
  if (city !== undefined) { updates.push(`city = $${paramIdx++}`); values.push(String(city).substring(0, 100)); }
  if (latitude !== undefined && !isNaN(latitude)) { updates.push(`latitude = $${paramIdx++}`); values.push(Number(latitude)); }
  if (longitude !== undefined && !isNaN(longitude)) { updates.push(`longitude = $${paramIdx++}`); values.push(Number(longitude)); }
  if (calc_method !== undefined && Number.isInteger(Number(calc_method))) { updates.push(`calc_method = $${paramIdx++}`); values.push(Number(calc_method)); }

  if (updates.length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.user.id);

  try {
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);
    const { rows } = await pool.query(
      `SELECT id, email, name, city, latitude, longitude, calc_method FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ message: 'Profil mis à jour ✅', profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Change Password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Mots de passe requis' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Min. 6 caractères' });

  try {
    const { rows } = await pool.query(`SELECT password FROM users WHERE id = $1`, [req.user.id]);
    if (rows.length === 0) return res.status(500).json({ error: 'Erreur serveur' });
    
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [hashed, req.user.id]);
    res.json({ message: 'Mot de passe modifié ✅' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════ DATA ROUTES ═══════════════════════════

// Get Data
app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT data, location FROM users WHERE id = $1`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({
      data: rows[0].data ? JSON.parse(rows[0].data) : {},
      location: rows[0].location ? JSON.parse(rows[0].location) : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Save Data
app.post('/api/data', authenticateToken, async (req, res) => {
  const { data, location } = req.body;
  try {
    await pool.query(
      `UPDATE users SET data = $1, location = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [JSON.stringify(data || {}), JSON.stringify(location || null), req.user.id]
    );
    res.json({ message: 'Sauvegardé ✅' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Delete Account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.user.id]);
    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════ HEALTHCHECK ═══════════════════════════
app.get('/api/test-db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json({ status: 'success', time: rows[0].now, message: '✅ Connecté à Neon PostgreSQL' });
  } catch (err) {
    console.error('❌ Test DB error:', err);
    res.status(500).json({ status: 'error', details: err.message });
  }
});

// ═══════════════════════════ FALLBACK ═══════════════════════════
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════ START ═══════════════════════════
app.listen(PORT, () => {
  console.log(`\n🕌 Shajara Al-Iman — Serveur démarré`);
  console.log(`   ➜ http://localhost:${PORT}`);
  console.log(`   ➜ API: http://localhost:${PORT}/api\n`);
});
