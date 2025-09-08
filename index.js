
import express from 'express';
import dotenv from 'dotenv';
import scraperRoutes from './src/routes/scraper.js';
import statusMonitor from 'express-status-monitor';
import basicAuth from 'express-basic-auth';

dotenv.config();

// Basic Auth Configuration
const users = {};
const user = process.env.STATUS_USER;
const pass = process.env.STATUS_PASSWORD;

if (user && pass) {
  users[user] = pass;
} else {
  console.warn('STATUS_USER or STATUS_PASSWORD environment variables are not set. The status page will not be protected.');
}

const authMiddleware = basicAuth({
  users,
  challenge: true, // This will cause the browser to show a login dialog.
});


const app = express();

// Apply the status monitor middleware first
app.use(statusMonitor());

// Protect the /status route with basic auth
// The status monitor is available by default at /status
app.use('/status', authMiddleware);


app.use(express.json());

// Middleware para la ruta raíz según el modo de test
app.get('/', (req, res, next) => {
  if (process.env.TEST_MODE === 'true') {
    // Si estamos en modo test, sirve la carpeta public
    express.static('public')(req, res, next);
  } else {
    // En modo producción o normal, devuelve el estado de la API
    res.json({ status: 'ok', message: 'API is running' });
  }
});

app.use('/api/scraper', scraperRoutes);

// Servir archivos estáticos para todas las demás rutas (si es necesario)
// Si / es la única ruta de test, puedes eliminar esto y solo usar el middleware anterior.
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
