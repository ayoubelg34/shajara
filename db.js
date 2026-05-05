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

module.exports = { pool };
