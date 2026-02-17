import express from 'express';
import path from 'path';
import { CommandHandler } from '../commandHandler.js';
import { WorldManager } from './worldManager.js';
import { WorldSession } from './worldSession.js';
import { AsyncCommandHandler } from './asyncCommandHandler.js';
import { createRouter } from './router.js';

export class Server {
  private app: express.Application;
  private port: number;

  private worldManager: WorldManager;
  private session: WorldSession;
  private asyncCommandHandler: AsyncCommandHandler;

  constructor(handler: CommandHandler, port: number = 3000) {
    this.port = port;
    this.app = express();

    this.worldManager = new WorldManager();
    const defaultWorld = handler.getWorld();

    this.session = new WorldSession(defaultWorld);
    this.asyncCommandHandler = new AsyncCommandHandler(defaultWorld, handler);

    this.asyncCommandHandler.registerHandlers();

    const intervalMs = parseInt(process.env.AETHERIUS_TICK_INTERVAL_MS || '1000', 10);
    if (intervalMs > 0) {
      this.session.startLoop(intervalMs);
    }

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.url}`);
      next();
    });
    this.app.use('/tools', express.static(path.join(process.cwd(), 'tools')));
  }

  private setupRoutes() {
    const apiRouter = createRouter(this.session);
    this.app.use('/api', apiRouter);
  }

  public start() {
    this.app.listen(this.port, () => {
      console.log(`🌍 Aetherius Server running on http://localhost:${this.port}`);
      console.log(`   - POST /api/command { "cmd": "..." }`);
      console.log(`   - GET /api/status`);
    });
  }
}
