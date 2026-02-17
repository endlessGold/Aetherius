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

export interface EvolutionStats {
  worldId: string;
  generation: number;
  tick: number;
  avgFitness: number;
  weights: { survive: number; grow: number; explore: number };
  populationCount: number;
}

export interface WorldEvent {
  worldId: string;
  tick: number;
  type: 'WILDFIRE' | 'FLOOD' | 'HUNT' | 'OTHER';
  location: { x: number; y: number };
  details: string;
}

export interface ExperimentMetadata {
  id: string;
  config: Record<string, any>;
  startedAt: number;
  endedAt?: number;
  totalGenerations: number;
}

export interface NoSqlAdapter {
  driver: NoSqlDriver;
  saveTickSnapshot(snapshot: TickSnapshot): Promise<void>;
  getLatestSnapshot(worldId: string): Promise<TickSnapshot | null>;
  
  // Extended Evolution Support
  saveEvolutionStats(stats: EvolutionStats): Promise<void>;
  saveWorldEvent(event: WorldEvent): Promise<void>;
  
  // Experiment Management
  saveExperimentMetadata(meta: ExperimentMetadata): Promise<void>;
}

export class InMemoryNoSqlAdapter implements NoSqlAdapter {
  driver: NoSqlDriver = 'inmemory';
  private latestByWorld: Map<string, TickSnapshot> = new Map();
  private evolutionHistory: EvolutionStats[] = [];
  private eventHistory: WorldEvent[] = [];
  private experiments: Map<string, ExperimentMetadata> = new Map();

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    this.latestByWorld.set(snapshot.worldId, snapshot);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    return this.latestByWorld.get(worldId) ?? null;
  }

  async saveEvolutionStats(stats: EvolutionStats): Promise<void> {
    this.evolutionHistory.push(stats);
  }

  async saveWorldEvent(event: WorldEvent): Promise<void> {
    this.eventHistory.push(event);
  }

  async saveExperimentMetadata(meta: ExperimentMetadata): Promise<void> {
    this.experiments.set(meta.id, meta);
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

  async saveEvolutionStats(stats: EvolutionStats): Promise<void> {
    const db = (await this.getCollection()).dbName; // Reuse connection
    const client = this.client;
    const col = client.db(this.dbName).collection('evolution_history');
    
    // Lazy index creation (could be optimized)
    if (!this.client._indexesCreated) {
       await col.createIndex({ worldId: 1, generation: 1 });
       this.client._indexesCreated = true;
    }

    await col.updateOne(
        { worldId: stats.worldId, generation: stats.generation },
        { $set: stats },
        { upsert: true }
    );
  }

  async saveWorldEvent(event: WorldEvent): Promise<void> {
    const client = this.client;
    if (!client) await this.getCollection(); // Ensure connected
    
    const col = this.client.db(this.dbName).collection('world_events');
    await col.insertOne(event);
  }

  async saveExperimentMetadata(meta: ExperimentMetadata): Promise<void> {
    const client = this.client;
    if (!client) await this.getCollection();
    const col = client.db(this.dbName).collection('experiments');
    await col.updateOne({ id: meta.id }, { $set: meta }, { upsert: true });
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

  async saveEvolutionStats(stats: EvolutionStats): Promise<void> {
    const client = await this.getClient();
    const key = `aetherius:world:${stats.worldId}:evolution:${stats.generation}`;
    await client.set(key, JSON.stringify(stats));
    // Add to a list for history
    await client.rPush(`aetherius:world:${stats.worldId}:evolution_list`, JSON.stringify(stats));
  }

  async saveWorldEvent(event: WorldEvent): Promise<void> {
    const client = await this.getClient();
    // Use a stream or list for events
    await client.rPush(`aetherius:world:${event.worldId}:events`, JSON.stringify(event));
  }

  async saveExperimentMetadata(meta: ExperimentMetadata): Promise<void> {
    const client = await this.getClient();
    await client.set(`aetherius:experiment:${meta.id}`, JSON.stringify(meta));
  }
}

