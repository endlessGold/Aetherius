import type { World } from '../world.js';
import type { AssembleManager, Entity } from '../../entities/assembly.js';

export type WorldHandle = {
  worldId: string;
  world: World;
  manager: AssembleManager;
};

export type Wormhole = {
  id: string;
  a: string;
  b: string;
  createdAtTick: number;
  expiresAtTick: number;
  stability: number; // 0..1
};

export class UniverseRegistry {
  private worlds: Map<string, WorldHandle> = new Map();
  private primaryWorldId: string | null = null;
  private wormholes: Map<string, Wormhole> = new Map();

  registerWorld(handle: WorldHandle) {
    this.worlds.set(handle.worldId, handle);
    if (!this.primaryWorldId) this.primaryWorldId = handle.worldId;
  }

  getWorld(worldId: string): WorldHandle | undefined {
    return this.worlds.get(worldId);
  }

  listWorldIds(): string[] {
    return Array.from(this.worlds.keys());
  }

  isPrimary(worldId: string): boolean {
    return this.primaryWorldId === worldId;
  }

  upsertWormhole(w: Wormhole) {
    this.wormholes.set(w.id, w);
  }

  removeWormhole(id: string) {
    this.wormholes.delete(id);
  }

  listWormholes(): Wormhole[] {
    return Array.from(this.wormholes.values());
  }

  listWormholesForWorld(worldId: string): Wormhole[] {
    return this.listWormholes().filter(w => w.a === worldId || w.b === worldId);
  }

  getOtherEnd(w: Wormhole, worldId: string): string | null {
    if (w.a === worldId) return w.b;
    if (w.b === worldId) return w.a;
    return null;
  }

  pickRandomOtherWorldId(worldId: string, random01: () => number = Math.random): string | null {
    const ids = this.listWorldIds().filter(id => id !== worldId);
    if (ids.length === 0) return null;
    return ids[Math.floor(random01() * ids.length)];
  }

  findEntityAcrossWorlds(entityId: string): { worldId: string; manager: AssembleManager; entity: Entity<any> } | null {
    for (const [worldId, handle] of this.worlds) {
      const found = handle.manager.getEntity(entityId);
      if (found) return { worldId, manager: handle.manager, entity: found };
    }
    return null;
  }

  transferEntity(entityId: string, fromWorldId: string, toWorldId: string): boolean {
    const from = this.worlds.get(fromWorldId);
    const to = this.worlds.get(toWorldId);
    if (!from || !to) return false;
    const entity = from.manager.getEntity(entityId);
    if (!entity) return false;

    from.manager.detachEntity(entity);
    to.manager.attachEntity(entity);
    return true;
  }
}

export const universeRegistry = new UniverseRegistry();
