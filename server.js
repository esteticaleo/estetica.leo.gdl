const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const bcrypt = require('bcrypt');

const db = require('./config/database');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/login', authController.login);
app.post('/api/registrar', authController.registrarEstilista);

app.use('/api/clientes', require('./routes/clienteRoutes'));
app.use('/api/estado', require('./routes/estadoRoutes'));
app.use('/api/visitas', require('./routes/visitaRoutes'));

try {
  const agendaRoutes = require('./routes/agendaRoutes');
  app.use('/api/agenda', agendaRoutes);
} catch (err) {
  console.error('Error cargando agendaRoutes:', err);
}

app.get('/api/estilistas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre FROM estilistas ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/servicios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, precio FROM servicios ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mantenimiento/reset-passwords', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, pass_hash FROM estilistas');
    for (let u of usuarios) {
      if (!u.pass_hash.startsWith('$2b$')) {
        const nuevoHash = await bcrypt.hash(u.pass_hash, 10);
        await db.query('UPDATE estilistas SET pass_hash = ? WHERE id = ?', [nuevoHash, u.id]);
      }
    }
    res.send('¡Listo! Hashes actualizados.');
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

const angularDir = path.join(__dirname, '../../frontend/frontend/dist/frontend/browser');
const angularIndex = path.join(angularDir, 'index.html');

if (fs.existsSync(angularIndex)) {
  app.use(express.static(angularDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(angularIndex, (err) => next(err));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      mensaje:
        'API en marcha. Para ver la app en http://localhost:3000 compila el frontend: cd frontend/frontend && npm run build'
    });
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  if (fs.existsSync(angularIndex)) {
    console.log('Sirviendo también el Angular desde dist/frontend/browser');
  }
});
