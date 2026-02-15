import {
  InMemoryNoSqlAdapter,
  MongoNoSqlAdapter,
  NoSqlAdapter,
  NoSqlDriver,
  RedisNoSqlAdapter,
  TickSnapshot
} from './noSqlAdapter.js';

export class Persistence {
  private adapter: NoSqlAdapter;

  constructor(adapter: NoSqlAdapter) {
    this.adapter = adapter;
  }

  get driver(): NoSqlDriver {
    return this.adapter.driver;
  }

  async saveTickSnapshot(snapshot: TickSnapshot): Promise<void> {
    await this.adapter.saveTickSnapshot(snapshot);
  }

  async getLatestSnapshot(worldId: string): Promise<TickSnapshot | null> {
    return this.adapter.getLatestSnapshot(worldId);
  }
}

export function createPersistenceFromEnv(): Persistence {
  const driver = (process.env.AETHERIUS_NOSQL_DRIVER || 'inmemory').toLowerCase() as NoSqlDriver;

  if (driver === 'mongodb') {
    const uri = process.env.AETHERIUS_MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const db = process.env.AETHERIUS_MONGODB_DB || 'aetherius';
    return new Persistence(new MongoNoSqlAdapter(uri, db));
  }

  if (driver === 'redis') {
    const url = process.env.AETHERIUS_REDIS_URL || 'redis://127.0.0.1:6379';
    return new Persistence(new RedisNoSqlAdapter(url));
  }

  return new Persistence(new InMemoryNoSqlAdapter());
}

