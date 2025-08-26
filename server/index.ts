import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '..')));

// API routes
app.use(routes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;