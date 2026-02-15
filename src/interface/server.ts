import express from 'express';
import { CommandHandler } from './commandHandler.js';
import { WorldManager } from '../server/worldManager.js';
import { WorldSession } from '../server/worldSession.js';
import { AsyncCommandHandler } from '../server/asyncCommandHandler.js';

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
    // Use the handler's world as the default world
    // Note: CommandHandler is tightly coupled to a single world in current design.
    // Ideally, we should decouple it, but for now we reuse the existing one.
    // To support multi-world properly, CommandHandler needs to be instantiated per world or take worldId as arg.
    
    // For this implementation, we will wrap the existing handler's world
    const defaultWorld = (handler as any).world; // Access private world if possible, or we might need a getter
    
    // If we can't access it easily, let's create a session around it
    // Assuming handler.world is accessible via some way or we refactor CommandHandler.
    // Let's assume we can get it or we just use the one passed in `handler`.
    
    // Actually, to follow the "Authoritative State" principle, the Server should own the World.
    // But since `main.ts` creates CLI/Server with a shared CommandHandler, 
    // we will adapt to that.
    
    this.session = new WorldSession(defaultWorld);
    this.asyncCommandHandler = new AsyncCommandHandler(defaultWorld, handler);
    
    // Register handlers to the event loop
    this.asyncCommandHandler.registerHandlers();
    
    // Start the game loop
    this.session.startLoop(1000); // 1 tick per second

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
