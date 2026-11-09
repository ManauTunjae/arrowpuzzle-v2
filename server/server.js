import express from 'express';
import path from 'node:path';
import { rootDir } from './db/db.js';
import campaignsRouter from './routes/campaigns.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Simple health check, useful to test the server.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/campaigns', campaignsRouter);

// Express also serves the files in client/.
app.use(express.static(path.join(rootDir, 'client')));

// Unknown API route -> JSON error.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
