import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/config/db';
import apiRouter from './server/routes/api';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database and schemas
  try {
    await initDb();
    console.log('Database initialized and verified successfully.');
  } catch (err) {
    console.error('Critical Error: Failed to initialize SQLite database:', err);
    process.exit(1);
  }

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Router registration
  app.use('/api', apiRouter);

  // Serve static assets / React integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Booting in DEVELOPMENT mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Booting in PRODUCTION mode. Serving pre-built static client assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback React routing handler
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`Nexahr Server successfully listening on:`);
    console.log(`👉 http://0.0.0.0:${PORT}`);
    console.log(`========================================`);
  });
}

startServer();
