import { Request, Response } from 'express';
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
      res.status(400).json({ success: false, message: 'Missing "jsonl" string.' });
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

    res.json({ success: true, file: path.relative(root, filePath), committed: doCommit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
