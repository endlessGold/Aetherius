import express, { Request, Response } from 'express';
import JSON5 from 'json5';
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

function wantsJson5(req: Request): boolean {
    const format = (req.query.format as string | undefined)?.toLowerCase();
    if (format === 'json5') return true;
    const accept = req.headers['accept'];
    if (typeof accept === 'string' && accept.includes('application/json5')) return true;
    if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
    return false;
}

export const createRouter = (session: WorldSession): express.Router => {
    const router = express.Router();

    router.get('/health', (req: Request, res: Response) => {
        const body = { status: 'ok', timestamp: Date.now(), worldId: session.world.id };
        if (wantsJson5(req)) {
            res.setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(body));
            return;
        }
        res.json(body);
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
