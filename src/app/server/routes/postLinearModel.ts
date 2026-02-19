import { Request, Response } from 'express';
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

    res.json({ success: true, file: path.relative(root, filePath), committed: doCommit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
