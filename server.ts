import fs from 'fs';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = createApp();

// Direct health endpoint for platform monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      const cleanPath = req.path.replace(/^\/+|\/+$/g, '');
      if (cleanPath && !cleanPath.includes('..')) {
        const flatHtml = path.join(distDir, `${cleanPath}.html`);
        if (flatHtml.startsWith(distDir + path.sep) && fs.existsSync(flatHtml)) {
          return res.status(200).sendFile(flatHtml);
        }
      }
      return res.status(200).sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DugdhSar Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[DugdhSar Server] Node/Express + Vite SPA dev server active.`);
  });

  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer();
