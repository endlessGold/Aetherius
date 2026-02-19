import { hashStringToSeed } from '../../ai/prng.js';

export type WorldConfig = {
  deterministic: boolean;
  seed: number;
  tickDurationMs: number;
  wormhole: {
    openChancePerTick: number;
    travelChancePerTick: number;
    ttlTicks: number;
  };
  telemetry: {
    writeJsonlToDisk: boolean;
  };
};

export function loadWorldConfig(worldId: string, overrides?: Partial<WorldConfig>): WorldConfig {
  const deterministic = (process.env.AETHERIUS_DETERMINISTIC || '0') === '1';
  const seed = Number.isFinite(Number(process.env.AETHERIUS_WORLD_SEED))
    ? Number(process.env.AETHERIUS_WORLD_SEED)
    : hashStringToSeed(worldId);

  const base: WorldConfig = {
    deterministic,
    seed,
    tickDurationMs: Number.parseInt(process.env.AETHERIUS_TICK_DURATION_MS || '1000', 10),
    wormhole: {
      openChancePerTick: Number.parseFloat(process.env.AETHERIUS_WORMHOLE_OPEN_CHANCE || '0.01'),
      travelChancePerTick: Number.parseFloat(process.env.AETHERIUS_WORMHOLE_TRAVEL_CHANCE || '0.05'),
      ttlTicks: Number.parseInt(process.env.AETHERIUS_WORMHOLE_TTL_TICKS || '120', 10)
    },
    telemetry: {
      writeJsonlToDisk: (process.env.AETHERIUS_TELEMETRY_JSONL || '0') === '1'
    }
  };

  return {
    ...base,
    ...overrides,
    wormhole: { ...base.wormhole, ...(overrides?.wormhole || {}) },
    telemetry: { ...base.telemetry, ...(overrides?.telemetry || {}) }
  };
}

