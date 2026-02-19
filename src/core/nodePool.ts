
export class NodePool {
  private static instance: NodePool;
  private pools: Map<string, any[]> = new Map();

  private constructor() {}

  static getInstance(): NodePool {
    if (!NodePool.instance) {
      NodePool.instance = new NodePool();
    }
    return NodePool.instance;
  }

  acquire<T>(key: string, factory: () => T, reset?: (item: T) => void): T {
    let pool = this.pools.get(key);
    if (!pool) {
      pool = [];
      this.pools.set(key, pool);
    }

    if (pool.length > 0) {
      const item = pool.pop();
      if (reset) reset(item);
      return item;
    }

    return factory();
  }

  release<T>(key: string, item: T): void {
    let pool = this.pools.get(key);
    if (!pool) {
      pool = [];
      this.pools.set(key, pool);
    }
    pool.push(item);
  }

  getStats(): string {
    let stats = 'Node Pool Stats:\n';
    this.pools.forEach((pool, key) => {
      stats += `  ${key}: ${pool.length} available\n`;
    });
    return stats;
  }
}
