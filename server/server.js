import express from 'express';
import path from 'node:path';
import { rootDir } from './db/db.js';
import campaignsRouter from './routes/campaigns.js';
import playersRouter from './routes/players.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Simple health check, useful to test the server.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/campaigns', campaignsRouter);
app.use('/api/players', playersRouter);
app.use('/api/sessions', sessionsRouter);

// Express also serves the files in client/.
app.use(express.static(path.join(rootDir, 'client')));

// Unknown API route -> JSON error.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler: always JSON, never show internal details.
app.use((err, req, res, next) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Server error' : 'Bad request' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
