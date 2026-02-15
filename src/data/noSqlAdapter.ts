export type NoSqlDriver = 'inmemory' | 'mongodb' | 'redis';

export interface NodeSnapshot {
  id: string;
  type: string;
  components: Record<string, any>;
}

export interface TickSnapshot {
  worldId: string;
  tick: number;
  timestamp: number;
  nodes: NodeSnapshot[];
  predictions?: Record<string, any>;
}

export interface NoSqlAdapter {
  driver: NoSqlDriver;
  saveTickSnapshot(snapshot: TickSnapshot): Promise<void>;
  getLatestSnapshot(worldId: string): Promise<TickSnapshot | null>;
}

export class InMemoryNoSqlAdapter implements NoSqlAdapter {
  driver: NoSqlDriver = 'inmemory';
  private latestByWorld: Map<string, TickSnapshot> = new Map();

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    this.latestByWorld.set(snapshot.worldId, snapshot);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    return this.latestByWorld.get(worldId) ?? null;
  }
}

export class MongoNoSqlAdapter implements NoSqlAdapter {
  driver: NoSqlDriver = 'mongodb';
  private uri: string;
  private dbName: string;
  private client: any | null = null;

  constructor(uri: string, dbName: string) {
    this.uri = uri;
    this.dbName = dbName;
  }

  private async getCollection() {
    const { MongoClient } = await import('mongodb');
    if (!this.client) {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
    }
    const db = this.client.db(this.dbName);
    const col = db.collection('tickSnapshots');
    await col.createIndex({ worldId: 1, tick: 1 }, { unique: true });
    await col.createIndex({ worldId: 1, timestamp: -1 });
    return col;
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { worldId: snapshot.worldId, tick: snapshot.tick },
      { $set: snapshot },
      { upsert: true }
    );
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ worldId }, { sort: { tick: -1 } });
    return (doc as TickSnapshot | null) ?? null;
  }
}

export class RedisNoSqlAdapter implements NoSqlAdapter {
  driver: NoSqlDriver = 'redis';
  private url: string;
  private client: any | null = null;

  constructor(url: string) {
    this.url = url;
  }

  private async getClient() {
    const redis = await import('redis');
    if (!this.client) {
      this.client = redis.createClient({ url: this.url });
      this.client.on('error', () => {});
      await this.client.connect();
    }
    return this.client;
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    const client = await this.getClient();
    const tickKey = `aetherius:world:${snapshot.worldId}:tick:${snapshot.tick}`;
    const latestKey = `aetherius:world:${snapshot.worldId}:latest`;
    await client.set(tickKey, JSON.stringify(snapshot));
    await client.set(latestKey, tickKey);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    const client = await this.getClient();
    const latestKey = `aetherius:world:${worldId}:latest`;
    const tickKey = await client.get(latestKey);
    if (!tickKey) return null;
    const raw = await client.get(tickKey);
    if (!raw) return null;
    return JSON.parse(raw) as TickSnapshot;
  }
}

