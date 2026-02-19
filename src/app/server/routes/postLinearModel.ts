import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';

function execFileAsync(file: string, args: string[], cwd: string): Promise<{ code: number }> {
  return new Promise((resolve) => {
    execFile(file, args, { cwd }, (error) => {
      resolve({ code: error ? 1 : 0 });
    });
  });
}

export const handlePostLinearModel = (session: WorldSession) => async (req: Request, res: Response) => {
  try {
    session.world.tfModel.setFromJson(req.body);

    const root = process.cwd();
    const dir = path.join(root, 'models');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, 'linear-latest.json');
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8');

    const doCommit = process.env.AETHERIUS_MODEL_GIT_COMMIT === '1';
    if (doCommit) {
      await execFileAsync('git', ['add', filePath], root);
      await execFileAsync('git', ['commit', '-m', `Model update: ${path.basename(filePath)}`], root);
    }

    const body = { success: true, file: path.relative(root, filePath), committed: doCommit };
    const format = (req.query.format as string | undefined)?.toLowerCase();
    const wantJson5 = format === 'json5' || (typeof req.headers['accept'] === 'string' && req.headers['accept'].includes('application/json5'));
    if (wantJson5) {
      res.setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(body));
      return;
    }
    res.json(body);
  } catch (error: any) {
    const body = { success: false, message: error.message };
    const format = (req.query.format as string | undefined)?.toLowerCase();
    const wantJson5 = format === 'json5' || (typeof req.headers['accept'] === 'string' && req.headers['accept'].includes('application/json5'));
    if (wantJson5) {
      res.status(500).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(body));
      return;
    }
    res.status(500).json(body);
  }
};
