/**
 * Persistence 레이어: env 기반 드라이버 선택.
 * - inmemory: 프로세스 메모리 (기본값, DB 없음)
 * - mongodb: AETHERIUS_MONGODB_URI 설정 시 MongoDB Atlas 연동
 * - redis: AETHERIUS_REDIS_URL 설정 시 Redis 연동
 */

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

/** 인메모리 드라이버: 프로세스 종료 시 데이터 소실 (개발·테스트용) */
class InMemoryPersistence implements Persistence {
  readonly driver = 'inmemory';
  private latestByWorld = new Map<string, TickSnapshot>();
  private worldEvents = new Map<string, WorldEventPayload[]>();
  private evolutionStats: EvolutionStatsPayload[] = [];
  private experimentMetadata: ExperimentMetadataPayload[] = [];

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    this.latestByWorld.set(snapshot.worldId, snapshot);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    return this.latestByWorld.get(worldId) ?? null;
  }

  async saveWorldEvent(payload: WorldEventPayload): Promise<void> {
    const list = this.worldEvents.get(payload.worldId) ?? [];
    list.push(payload);
    this.worldEvents.set(payload.worldId, list);
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
  }

  async saveExperimentMetadata(payload: ExperimentMetadataPayload): Promise<void> {
    this.experimentMetadata.push(payload);
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
  return new InMemoryPersistence();
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
