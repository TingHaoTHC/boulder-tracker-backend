const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});


const initDb = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS boulders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(10) NOT NULL,
      location VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'Project',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
initDb();

// REST API ENDPOINTS (CRUD)
app.get('/api/boulders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boulders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/boulders', async (req, res) => {
  const { name, grade, location, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO boulders (name, grade, location, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, grade, location, status || 'Project']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/boulders/:id', async (req, res) => {
  const { id } = req.params;
  const { name, grade, location, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE boulders SET name = $1, grade = $2, location = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, grade, location, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Climb not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/boulders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM boulders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Climb not found' });
    res.json({ message: 'Climb deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Open-Meteo Weather)
// Fetches outdoor climbing conditions based on latitude/longitude
app.get('/api/weather', async (req, res) => {
  const { lat = '40.7128', lon = '-74.0060' } = req.query; 
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      {
        headers: { 
          'User-Agent': 'BoulderTracker-SaaS/1.0' 
        }
      }
    );
    const data = await response.json();
    
    if (!data.current_weather) {
      console.error('Open-Meteo Error:', data);
      return res.status(500).json({ error: 'Weather API rejected the request' });
    }

    res.json(data.current_weather);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/', (req, res) => {
  res.send('Boulder Tracker Backend API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;