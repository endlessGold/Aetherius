import { Request, Response } from 'express';
import JSON5 from 'json5';
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

function safeName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export const handlePostDatasetBackup = () => async (req: Request, res: Response) => {
  try {
    const { jsonl, name } = req.body || {};
    if (!jsonl || typeof jsonl !== 'string') {
      const body = { success: false, message: 'Missing "jsonl" string.' };
      const format = (req.query.format as string | undefined)?.toLowerCase();
      const wantJson5 = format === 'json5' || (typeof req.headers['accept'] === 'string' && req.headers['accept'].includes('application/json5'));
      if (wantJson5) {
        res.status(400).setHeader('Content-Type', 'application/json5; charset=utf-8');
        res.send(JSON5.stringify(body));
        return;
      }
      res.status(400).json(body);
      return;
    }

    const root = process.cwd();
    const dir = path.join(root, 'datasets');
    await fs.mkdir(dir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = safeName(name || `aetherius-dataset-${ts}.jsonl`);
    const filePath = path.join(dir, base.endsWith('.jsonl') ? base : `${base}.jsonl`);

    await fs.writeFile(filePath, jsonl, 'utf-8');

    const doCommit = process.env.AETHERIUS_DATASET_GIT_COMMIT === '1';
    if (doCommit) {
      await execFileAsync('git', ['add', filePath], root);
      await execFileAsync('git', ['commit', '-m', `Dataset backup: ${path.basename(filePath)}`], root);
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
