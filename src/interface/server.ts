import express from 'express';
import { CommandHandler } from './commandHandler.js';

export class Server {
  private app: express.Application;
  private handler: CommandHandler;
  private port: number;

  constructor(handler: CommandHandler, port: number = 3000) {
    this.handler = handler;
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    // Basic logging middleware
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Execute arbitrary command
    // POST /api/command { "cmd": "advance_tick 1" }
    this.app.post('/api/command', async (req, res) => {
      const { cmd } = req.body;
      if (!cmd) {
        res.status(400).json({ success: false, message: 'Missing "cmd" field in body.' });
        return;
      }

      const result = await this.handler.execute(cmd);
      res.json(result);
    });

    // Shortcuts for specific actions
    this.app.get('/api/status/:id?', async (req, res) => {
      const id = (req.params as any).id || '';
      const result = await this.handler.execute(`status ${id}`);
      res.json(result);
    });

    this.app.post('/api/tick', async (req, res) => {
      const count = req.body.count || 1;
      const result = await this.handler.execute(`advance_tick ${count}`);
      res.json(result);
    });
  }

  public start() {
    this.app.listen(this.port, () => {
      console.log(`🌍 Aetherius Server running on http://localhost:${this.port}`);
      console.log(`   - POST /api/command { "cmd": "..." }`);
      console.log(`   - GET /api/status`);
    });
  }
}
