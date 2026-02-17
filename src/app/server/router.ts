import express from 'express';
import { WorldSession } from './worldSession.js';
import { handlePostCommand } from './routes/postCommand.js';
import { handleGetStatus } from './routes/getStatus.js';
import { handlePostTick } from './routes/postTick.js';
import { handleGetLatestSnapshot } from './routes/getLatestSnapshot.js';
import { handlePostLinearModel } from './routes/postLinearModel.js';
import { handlePostDatasetBackup } from './routes/postDatasetBackup.js';

export const createRouter = (session: WorldSession): express.Router => {
    const router = express.Router();

    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now(), worldId: session.world.id });
    });

    router.post('/command', handlePostCommand(session));
    router.get('/status/:id?', handleGetStatus(session));
    router.post('/tick', handlePostTick(session));
    router.get('/snapshot/latest', handleGetLatestSnapshot(session));
    router.post('/model/linear', handlePostLinearModel(session));
    router.post('/dataset/backup', handlePostDatasetBackup());

    return router;
};
