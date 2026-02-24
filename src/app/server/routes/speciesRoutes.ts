
import { Request, Response } from 'express';
import { SpeciesLibrary } from '../../../gamedata/species.js';
import { BiologicalEntity } from '../../../core/bio/types.js';

/**
 * GET /api/species
 * List all registered species models.
 * Query:
 * - format: 'json' (default) | 'jsonl' (download)
 */
export const handleGetSpecies = () => async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string)?.toLowerCase();

    if (format === 'jsonl') {
      const lines = SpeciesLibrary.map((s: BiologicalEntity) => JSON.stringify(s));
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Content-Disposition', `attachment; filename="species-library-${Date.now()}.jsonl"`);
      res.send(lines.join('\n'));
      return;
    }

    res.json({
      success: true,
      count: SpeciesLibrary.length,
      data: SpeciesLibrary
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: msg });
  }
};

/**
 * POST /api/species
 * Add or update a species model.
 * Body: BiologicalEntity (JSON)
 */
export const handlePostSpecies = () => async (req: Request, res: Response) => {
  try {
    const model = req.body as BiologicalEntity;

    // Basic validation
    if (!model || !model.entity_id || !model.metabolic_engine) {
      res.status(400).json({ success: false, message: 'Invalid BiologicalEntity model.' });
      return;
    }

    // Check if exists
    const existingIdx = SpeciesLibrary.findIndex((s: BiologicalEntity) => s.entity_id === model.entity_id);
    if (existingIdx >= 0) {
      SpeciesLibrary[existingIdx] = model;
      res.json({ success: true, message: `Updated species: ${model.entity_id}`, mode: 'update' });
    } else {
      SpeciesLibrary.push(model);
      res.status(201).json({ success: true, message: `Registered new species: ${model.entity_id}`, mode: 'create' });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: msg });
  }
};
