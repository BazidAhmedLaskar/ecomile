import express from 'express';
import { createServer } from 'http';
import path from 'path';
import routes from './routes';

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd())));

// API routes
app.use(routes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;