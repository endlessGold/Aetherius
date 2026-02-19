import express from 'express';
import { WorldSession } from './worldSession.js';
import { handlePostCommand } from './routes/postCommand.js';
import { handleGetScience } from './routes/getScience.js';
import { handleGetStatus } from './routes/getStatus.js';
import { handlePostTick } from './routes/postTick.js';
import { handleGetLatestSnapshot } from './routes/getLatestSnapshot.js';
import { handleGetNarrative } from './routes/getNarrative.js';
import { handlePostLinearModel } from './routes/postLinearModel.js';
import { handlePostDatasetBackup } from './routes/postDatasetBackup.js';
import { handleGetDatasetExport } from './routes/getDatasetExport.js';
import { handlePostSnapshots } from './routes/postSnapshots.js';
import { handlePostEvents } from './routes/postEvents.js';

export const createRouter = (session: WorldSession): express.Router => {
    const router = express.Router();

    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now(), worldId: session.world.id });
    });

    router.post('/command', handlePostCommand(session));
    router.get('/science', handleGetScience(session));
    router.post('/science', handleGetScience(session));
    router.get('/status/:id?', handleGetStatus(session));
    router.post('/tick', handlePostTick(session));
    router.get('/snapshot/latest', handleGetLatestSnapshot(session));
    router.get('/narrative', handleGetNarrative(session));
    router.post('/snapshots', handlePostSnapshots(session));
    router.post('/events', handlePostEvents(session));
    router.post('/model/linear', handlePostLinearModel(session));
    router.post('/dataset/backup', handlePostDatasetBackup());
    router.get('/dataset/export', handleGetDatasetExport(session));

    return router;
};
