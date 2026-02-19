/**
 * Persistence 레이어: env 기반 드라이버 선택.
 * - inmemory: 프로세스 메모리 (기본값, DB 없음, 선택적으로 로컬 파일에 영구 저장)
 * - mongodb: AETHERIUS_MONGODB_URI 설정 시 MongoDB Atlas 연동
 * - redis: AETHERIUS_REDIS_URL 설정 시 Redis 연동
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  TickSnapshot,
  WorldEventPayload,
  EvolutionStatsPayload,
  ExperimentMetadataPayload
} from './noSqlAdapter.js';

export type { TickSnapshot, NodeSnapshot } from './noSqlAdapter.js';

export interface GetWorldEventsOptions {
  fromTick?: number;
  toTick?: number;
  limit?: number;
}

export interface Persistence {
  readonly driver: string;
  saveTickSnapshot(snapshot: TickSnapshot): Promise<void>;
  getLatestSnapshot(worldId: string): Promise<TickSnapshot | null>;
  saveWorldEvent(payload: WorldEventPayload): Promise<void>;
  getWorldEventCount(worldId: string): Promise<number>;
  getWorldEvents(worldId: string, options?: GetWorldEventsOptions): Promise<WorldEventPayload[]>;
  saveEvolutionStats(payload: EvolutionStatsPayload): Promise<void>;
  saveExperimentMetadata(payload: ExperimentMetadataPayload): Promise<void>;
}

type InMemoryPersistenceOptions = {
  persistToDisk?: boolean;
  dir?: string;
};

/** 인메모리 드라이버: 기본은 프로세스 메모리, 옵션에 따라 로컬 파일에 영구 저장 */
class InMemoryPersistence implements Persistence {
  readonly driver = 'inmemory';
  private latestByWorld = new Map<string, TickSnapshot>();
  private worldEvents = new Map<string, WorldEventPayload[]>();
  private evolutionStats: EvolutionStatsPayload[] = [];
  private experimentMetadata: ExperimentMetadataPayload[] = [];

  private readonly persistToDisk: boolean;
  private readonly dir: string;
  private readonly files: {
    snapshots: string;
    events: string;
    evolution: string;
    experiments: string;
  };

  constructor(options?: InMemoryPersistenceOptions) {
    this.persistToDisk = options?.persistToDisk === true;
    this.dir = options?.dir || path.join(process.cwd(), 'data', 'persistence');
    this.files = {
      snapshots: path.join(this.dir, 'snapshots.jsonl'),
      events: path.join(this.dir, 'events.jsonl'),
      evolution: path.join(this.dir, 'evolution.jsonl'),
      experiments: path.join(this.dir, 'experiments.jsonl')
    };

    if (this.persistToDisk) {
      this.loadFromDisk();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.files.snapshots)) {
        const raw = fs.readFileSync(this.files.snapshots, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const snap = JSON.parse(trimmed) as TickSnapshot;
            this.latestByWorld.set(snap.worldId, snap);
          } catch {
          }
        }
      }
    } catch {
    }

    try {
      if (fs.existsSync(this.files.events)) {
        const raw = fs.readFileSync(this.files.events, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const ev = JSON.parse(trimmed) as WorldEventPayload;
            const list = this.worldEvents.get(ev.worldId) ?? [];
            list.push(ev);
            this.worldEvents.set(ev.worldId, list);
          } catch {
          }
        }
      }
    } catch {
    }

    try {
      if (fs.existsSync(this.files.evolution)) {
        const raw = fs.readFileSync(this.files.evolution, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const e = JSON.parse(trimmed) as EvolutionStatsPayload;
            this.evolutionStats.push(e);
          } catch {
          }
        }
      }
    } catch {
    }

    try {
      if (fs.existsSync(this.files.experiments)) {
        const raw = fs.readFileSync(this.files.experiments, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const e = JSON.parse(trimmed) as ExperimentMetadataPayload;
            this.experimentMetadata.push(e);
          } catch {
          }
        }
      }
    } catch {
    }
  }

  private async appendJsonl(kind: keyof InMemoryPersistence['files'], payload: unknown): Promise<void> {
    if (!this.persistToDisk) return;
    try {
      await fs.promises.mkdir(this.dir, { recursive: true });
      await fs.promises.appendFile(this.files[kind], `${JSON.stringify(payload)}\n`, 'utf8');
    } catch {
    }
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    this.latestByWorld.set(snapshot.worldId, snapshot);
    await this.appendJsonl('snapshots', snapshot);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    return this.latestByWorld.get(worldId) ?? null;
  }

  async saveWorldEvent(payload: WorldEventPayload): Promise<void> {
    const list = this.worldEvents.get(payload.worldId) ?? [];
    list.push(payload);
    this.worldEvents.set(payload.worldId, list);
    await this.appendJsonl('events', payload);
  }

  async getWorldEventCount(worldId: string): Promise<number> {
    return (this.worldEvents.get(worldId) ?? []).length;
  }

  async getWorldEvents(
    worldId: string,
    options?: GetWorldEventsOptions
  ): Promise<WorldEventPayload[]> {
    let list = (this.worldEvents.get(worldId) ?? []).slice();
    const from = options?.fromTick;
    const to = options?.toTick;
    if (from != null) list = list.filter((e) => e.tick >= from);
    if (to != null) list = list.filter((e) => e.tick <= to);
    list.sort((a, b) => a.tick - b.tick);
    const limit = options?.limit ?? list.length;
    return list.slice(0, limit);
  }

  async saveEvolutionStats(payload: EvolutionStatsPayload): Promise<void> {
    this.evolutionStats.push(payload);
    await this.appendJsonl('evolution', payload);
  }

  async saveExperimentMetadata(payload: ExperimentMetadataPayload): Promise<void> {
    this.experimentMetadata.push(payload);
    await this.appendJsonl('experiments', payload);
  }
}

/** env에서 드라이버를 읽어 Persistence 인스턴스 생성 */
export function createPersistenceFromEnv(): Persistence {
  const driver = (process.env.AETHERIUS_NOSQL_DRIVER ?? 'inmemory').toLowerCase();
  if (driver === 'mongodb' && process.env.AETHERIUS_MONGODB_URI) {
    return createMongoPersistence();
  }
  if (driver === 'redis' && process.env.AETHERIUS_REDIS_URL) {
    return createRedisPersistence();
  }
  const persistFlag = process.env.AETHERIUS_INMEMORY_PERSIST ?? '1';
  const persistToDisk = persistFlag === '1';
  const dir = process.env.AETHERIUS_INMEMORY_PERSIST_DIR || path.join(process.cwd(), 'data', 'persistence');
  return new InMemoryPersistence({ persistToDisk, dir });
}

function createMongoPersistence(): Persistence {
  const uri = process.env.AETHERIUS_MONGODB_URI!;
  const dbName = process.env.AETHERIUS_MONGODB_DB ?? 'aetherius';
  return new MongoPersistence(uri, dbName);
}

function createRedisPersistence(): Persistence {
  const url = process.env.AETHERIUS_REDIS_URL!;
  return new RedisPersistence(url);
}

/** MongoDB 드라이버 (Atlas 등) */
class MongoPersistence implements Persistence {
  readonly driver = 'mongodb';
  private client: import('mongodb').MongoClient | null = null;
  private db: import('mongodb').Db | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly uri: string,
    private readonly dbName: string
  ) {}

  private async ensureClient(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = (async () => {
      const { MongoClient } = await import('mongodb');
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    })();
    await this.initPromise;
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    await this.ensureClient();
    await this.db!.collection<TickSnapshot>('snapshots').updateOne(
      { worldId: snapshot.worldId },
      { $set: { ...snapshot, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    await this.ensureClient();
    const doc = await this.db!.collection<TickSnapshot>('snapshots').findOne(
      { worldId },
      { sort: { tick: -1 } }
    );
    if (!doc) return null;
    const { updatedAt: _, ...rest } = doc as TickSnapshot & { updatedAt?: Date };
    return rest as TickSnapshot;
  }

  async saveWorldEvent(payload: WorldEventPayload): Promise<void> {
    await this.ensureClient();
    await this.db!.collection('world_events').insertOne({
      ...payload,
      _createdAt: new Date()
    } as WorldEventPayload & { _createdAt: Date });
  }

  async getWorldEventCount(worldId: string): Promise<number> {
    await this.ensureClient();
    return this.db!.collection('world_events').countDocuments({ worldId });
  }

  async getWorldEvents(
    worldId: string,
    options?: GetWorldEventsOptions
  ): Promise<WorldEventPayload[]> {
    await this.ensureClient();
    const filter: Record<string, unknown> = { worldId };
    if (options?.fromTick != null || options?.toTick != null) {
      filter.tick = {};
      if (options.fromTick != null) (filter.tick as Record<string, number>).$gte = options.fromTick;
      if (options.toTick != null) (filter.tick as Record<string, number>).$lte = options.toTick;
    }
    const cursor = this.db!
      .collection<WorldEventPayload>('world_events')
      .find(filter)
      .sort({ tick: 1 });
    if (options?.limit != null && options.limit > 0) cursor.limit(options.limit);
    const list = await cursor.toArray();
    return list.map((doc) => {
      const { _id: _u, _createdAt: _c, ...rest } = doc as WorldEventPayload & { _id?: unknown; _createdAt?: Date };
      return rest as WorldEventPayload;
    });
  }

  async saveEvolutionStats(payload: EvolutionStatsPayload): Promise<void> {
    await this.ensureClient();
    await this.db!.collection('evolution_stats').insertOne({
      ...payload,
      _createdAt: new Date()
    } as EvolutionStatsPayload & { _createdAt: Date });
  }

  async saveExperimentMetadata(payload: ExperimentMetadataPayload): Promise<void> {
    await this.ensureClient();
    await this.db!.collection<ExperimentMetadataPayload>('experiment_metadata').updateOne(
      { id: payload.id },
      { $set: { ...payload, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

/** Redis 드라이버 (Upstash 등) */
class RedisPersistence implements Persistence {
  readonly driver = 'redis';
  private client: import('redis').RedisClientType | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly keyPrefix = 'aetherius:';

  constructor(private readonly url: string) {}

  private async ensureClient(): Promise<void> {
    if (this.client) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = (async () => {
      const { createClient } = await import('redis');
      this.client = createClient({ url: this.url });
      await this.client.connect();
    })();
    await this.initPromise;
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    await this.ensureClient();
    const key = `${this.keyPrefix}snapshot:${snapshot.worldId}`;
    await this.client!.set(key, JSON.stringify(snapshot));
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    await this.ensureClient();
    const key = `${this.keyPrefix}snapshot:${worldId}`;
    const raw = await this.client!.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as TickSnapshot;
  }

  async saveWorldEvent(payload: WorldEventPayload): Promise<void> {
    await this.ensureClient();
    const key = `${this.keyPrefix}events:${payload.worldId}`;
    await this.client!.rPush(key, JSON.stringify(payload));
  }

  async getWorldEventCount(worldId: string): Promise<number> {
    await this.ensureClient();
    const key = `${this.keyPrefix}events:${worldId}`;
    return this.client!.lLen(key);
  }

  async getWorldEvents(
    worldId: string,
    options?: GetWorldEventsOptions
  ): Promise<WorldEventPayload[]> {
    await this.ensureClient();
    const key = `${this.keyPrefix}events:${worldId}`;
    const rawList = await this.client!.lRange(key, 0, -1);
    let list = rawList.map((s) => JSON.parse(s) as WorldEventPayload);
    const from = options?.fromTick;
    const to = options?.toTick;
    if (from != null) list = list.filter((e) => e.tick >= from);
    if (to != null) list = list.filter((e) => e.tick <= to);
    list.sort((a, b) => a.tick - b.tick);
    const limit = options?.limit ?? list.length;
    return list.slice(0, limit);
  }

  async saveEvolutionStats(payload: EvolutionStatsPayload): Promise<void> {
    await this.ensureClient();
    const key = `${this.keyPrefix}evolution:${payload.worldId}`;
    await this.client!.rPush(key, JSON.stringify(payload));
  }

  async saveExperimentMetadata(payload: ExperimentMetadataPayload): Promise<void> {
    await this.ensureClient();
    const key = `${this.keyPrefix}exp:${payload.id}`;
    await this.client!.set(key, JSON.stringify(payload));
  }
}
