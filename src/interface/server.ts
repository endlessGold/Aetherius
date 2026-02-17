import express from 'express';
import { CommandHandler } from './commandHandler.js';
import { WorldManager } from '../server/worldManager.js';
import { WorldSession } from '../server/worldSession.js';
import { AsyncCommandHandler } from '../server/asyncCommandHandler.js';
import { createRouter } from '../server/router.js';
import path from 'path';

export class Server {
  private app: express.Application;
  private port: number;
  
  // Single World for now, but scalable to Multi-World
  private worldManager: WorldManager;
  private session: WorldSession;
  private asyncCommandHandler: AsyncCommandHandler;

  constructor(handler: CommandHandler, port: number = 3000) {
    this.port = port;
    this.app = express();
    
    // Initialize World System
    this.worldManager = new WorldManager();
    const defaultWorld = handler.getWorld(); 
    
    this.session = new WorldSession(defaultWorld);
    this.asyncCommandHandler = new AsyncCommandHandler(defaultWorld, handler);
    
    // Register handlers to the event loop
    this.asyncCommandHandler.registerHandlers();
    
    // Start the game loop
    const intervalMs = parseInt(process.env.AETHERIUS_TICK_INTERVAL_MS || '1000', 10);
    if (intervalMs > 0) {
      this.session.startLoop(intervalMs);
    }

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    // Basic logging middleware
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.url}`);
      next();
    });
    this.app.use('/tools', express.static(path.join(process.cwd(), 'tools')));
  }

  private setupRoutes() {
    // Mount the API router
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
