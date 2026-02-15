import express from 'express';
import { WorldSession } from './worldSession.js';
import { handlePostCommand } from './routes/postCommand.js';
import { handleGetStatus } from './routes/getStatus.js';
import { handlePostTick } from './routes/postTick.js';

export const createRouter = (session: WorldSession): express.Router => {
    const router = express.Router();

    // Health Check
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now(), worldId: session.world.id });
    });

    // Command Execution
    router.post('/command', handlePostCommand(session));
    
    // Status Check
    router.get('/status/:id?', handleGetStatus(session));
    
    // Manual Tick
    router.post('/tick', handlePostTick(session));

    return router;
};
