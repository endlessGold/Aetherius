import express from 'express';
import { handlePostCommand } from './routes/postCommand.js';
import { handleGetStatus } from './routes/getStatus.js';
import { handlePostTick } from './routes/postTick.js';
import { handleGetLatestSnapshot } from './routes/getLatestSnapshot.js';
import { handlePostLinearModel } from './routes/postLinearModel.js';
import { handlePostDatasetBackup } from './routes/postDatasetBackup.js';
export const createRouter = (session) => {
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
    // Latest Snapshot (NoSQL)
    router.get('/snapshot/latest', handleGetLatestSnapshot(session));
    // Model Update (Linear)
    router.post('/model/linear', handlePostLinearModel(session));
    // Dataset Backup (JSONL -> Git)
    router.post('/dataset/backup', handlePostDatasetBackup());
    return router;
};
