const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("✅ Base de données connectée (Neon PostgreSQL)"))
  .catch(err => console.error("❌ Erreur DB:", err));

pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur un client PostgreSQL inactif:', err);
});

module.exports = { pool };
