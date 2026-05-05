const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'shajara_secret_iman_2026';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ═══════════════════════════ STATIC FILES ═══════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════ DATABASE ═══════════════════════════
const db = new sqlite3.Database('./shajara.db', (err) => {
  if (err) console.error('❌ Erreur DB:', err);
  else {
    console.log('✅ Base de données connectée');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT DEFAULT '',
      city TEXT DEFAULT '',
      latitude REAL DEFAULT 48.8566,
      longitude REAL DEFAULT 2.3522,
      calc_method INTEGER DEFAULT 3,
      data TEXT DEFAULT '{}',
      location TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err && !err.message.includes('already exists')) console.error(err);
      // Add new columns if they don't exist (migration)
      const cols = ['name', 'city', 'latitude', 'longitude', 'calc_method', 'created_at', 'updated_at'];
      cols.forEach(col => {
        let type = 'TEXT DEFAULT \'\'';
        if (col === 'latitude') type = 'REAL DEFAULT 48.8566';
        else if (col === 'longitude') type = 'REAL DEFAULT 2.3522';
        else if (col === 'calc_method') type = 'INTEGER DEFAULT 3';
        else if (col.includes('_at')) type = 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        db.run(`ALTER TABLE users ADD COLUMN ${col} ${type}`, () => {});
      });
    });
  }
});

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
    db.run(
      `INSERT INTO users (email, password, name, city) VALUES (?, ?, ?, ?)`,
      [email.toLowerCase().trim(), hashedPassword, name || '', city || ''],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
          }
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        const token = jwt.sign({ id: this.lastID, email: email.toLowerCase() }, SECRET_KEY, { expiresIn: '90d' });
        res.json({ token, message: 'Compte créé avec succès ! بارك الله فيك' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  if (!rateLimit(`login_${ip}`, 10, 300000)) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie dans 5 minutes' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (!user) return res.status(400).json({ error: 'Identifiants incorrects' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '90d' });
    res.json({ token, message: 'Connexion réussie ! مرحبا' });
  });
});

// ═══════════════════════════ PROFILE ROUTES ═══════════════════════════

// Get Profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, email, name, city, latitude, longitude, calc_method, created_at FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      if (!row) return res.status(404).json({ error: 'Utilisateur introuvable' });
      res.json(row);
    }
  );
});

// Update Profile
app.put('/api/profile', authenticateToken, (req, res) => {
  const { name, city, latitude, longitude, calc_method } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(String(name).substring(0, 100)); }
  if (city !== undefined) { updates.push('city = ?'); values.push(String(city).substring(0, 100)); }
  if (latitude !== undefined && !isNaN(latitude)) { updates.push('latitude = ?'); values.push(Number(latitude)); }
  if (longitude !== undefined && !isNaN(longitude)) { updates.push('longitude = ?'); values.push(Number(longitude)); }
  if (calc_method !== undefined && Number.isInteger(Number(calc_method))) { updates.push('calc_method = ?'); values.push(Number(calc_method)); }

  if (updates.length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.user.id);

  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    // Return updated profile
    db.get(
      `SELECT id, email, name, city, latitude, longitude, calc_method FROM users WHERE id = ?`,
      [req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        res.json({ message: 'Profil mis à jour ✅', profile: row });
      }
    );
  });
});

// Change Password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Mots de passe requis' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Min. 6 caractères' });

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], async (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Erreur serveur' });
    const valid = await bcrypt.compare(currentPassword, row.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    db.run(`UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hashed, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json({ message: 'Mot de passe modifié ✅' });
    });
  });
});

// ═══════════════════════════ DATA ROUTES ═══════════════════════════

// Get Data
app.get('/api/data', authenticateToken, (req, res) => {
  db.get(`SELECT data, location FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (!row) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({
      data: row.data ? JSON.parse(row.data) : {},
      location: row.location ? JSON.parse(row.location) : null
    });
  });
});

// Save Data
app.post('/api/data', authenticateToken, (req, res) => {
  const { data, location } = req.body;
  db.run(
    `UPDATE users SET data = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [JSON.stringify(data || {}), JSON.stringify(location || null), req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
      res.json({ message: 'Sauvegardé ✅' });
    }
  );
});

// Delete Account
app.delete('/api/auth/account', authenticateToken, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    res.json({ message: 'Compte supprimé' });
  });
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
