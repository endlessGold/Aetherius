import type { World } from '../world.js';
import { BaseSystem } from './baseSystem.js';
import { System } from '../events/eventTypes.js';
import { universeRegistry } from '../space/universeRegistry.js';
import { promises as fs } from 'fs';
import path from 'path';

export class WormholeSystem extends BaseSystem {
  private world: World;
  private openChancePerTick: number;
  private travelChancePerTick: number;
  private wormholeTtlTicks: number;

  constructor(world: World) {
    super('WormholeSystem', world.eventBus);
    this.world = world;
    this.openChancePerTick = Number.parseFloat(process.env.AETHERIUS_WORMHOLE_OPEN_CHANCE || '0.01');
    this.travelChancePerTick = Number.parseFloat(process.env.AETHERIUS_WORMHOLE_TRAVEL_CHANCE || '0.05');
    this.wormholeTtlTicks = Number.parseInt(process.env.AETHERIUS_WORMHOLE_TTL_TICKS || '120', 10);
  }

  protected registerHandlers(): void {
    this.subscribe(System.Tick, this.handleTick);
  }

  private async handleTick() {
    if (!universeRegistry.isPrimary(this.world.id)) return;

    await this.maybeOpenRandomWormhole();
    await this.maybeCloseExpiredWormholes();
    await this.maybeTravelThroughWormholes();
  }

  private async maybeOpenRandomWormhole() {
    const worldIds = universeRegistry.listWorldIds();
    if (worldIds.length < 2) return;
    if (Math.random() >= this.openChancePerTick) return;

    const a = this.world.id;
    const b = universeRegistry.pickRandomOtherWorldId(a);
    if (!b) return;

    const stability = Math.max(0.1, Math.min(1, 0.5 + (Math.random() - 0.5) * 0.4));
    const wormholeId = `WH_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAtTick = this.world.tickCount + this.wormholeTtlTicks;

    universeRegistry.upsertWormhole({
      id: wormholeId,
      a,
      b,
      createdAtTick: this.world.tickCount,
      expiresAtTick,
      stability
    });

    this.publish(new System.WormholeOpened(wormholeId, a, b, expiresAtTick, stability, this.id));

    await this.logToWorlds(a, b, {
      kind: 'wormhole_opened',
      wormholeId,
      a,
      b,
      tick: this.world.tickCount,
      expiresAtTick,
      stability
    });
  }

  private async maybeCloseExpiredWormholes() {
    const now = this.world.tickCount;
    for (const w of universeRegistry.listWormholes()) {
      if (w.expiresAtTick > now) continue;
      universeRegistry.removeWormhole(w.id);
      this.publish(new System.WormholeClosed(w.id, w.a, w.b, this.id));
      await this.logToWorlds(w.a, w.b, { kind: 'wormhole_closed', wormholeId: w.id, a: w.a, b: w.b, tick: now });
    }
  }

  private async maybeTravelThroughWormholes() {
    if (Math.random() >= this.travelChancePerTick) return;

    const wormholes = universeRegistry.listWormholes();
    if (wormholes.length === 0) return;
    const w = wormholes[Math.floor(Math.random() * wormholes.length)];

    const fromWorldId = Math.random() < 0.5 ? w.a : w.b;
    const toWorldId = fromWorldId === w.a ? w.b : w.a;

    const from = universeRegistry.getWorld(fromWorldId);
    const to = universeRegistry.getWorld(toWorldId);
    if (!from || !to) return;

    const candidates = from.manager.entities.filter((e: any) => {
      const behavior = e.children?.[0] as any;
      return Boolean(behavior?.components?.goalGA);
    });

    if (candidates.length === 0) return;
    const entity = candidates[Math.floor(Math.random() * candidates.length)];

    const ok = universeRegistry.transferEntity(entity.id, fromWorldId, toWorldId);
    if (!ok) return;

    const behavior = entity.children?.[0] as any;
    if (behavior?.components?.position) {
      behavior.components.position.x = Math.random() * 100;
      behavior.components.position.y = Math.random() * 100;
    }

    this.publish(new System.WormholeTravel(w.id, fromWorldId, toWorldId, entity.id, this.id));

    await this.logToWorlds(fromWorldId, toWorldId, {
      kind: 'wormhole_travel',
      wormholeId: w.id,
      fromWorldId,
      toWorldId,
      entityId: entity.id,
      tick: this.world.tickCount
    });
  }

  private async logToWorlds(a: string, b: string, entry: any) {
    const wa = universeRegistry.getWorld(a)?.world;
    const wb = universeRegistry.getWorld(b)?.world;
    if (wa) {
      await wa.persistence.saveWorldEvent({
        worldId: wa.id,
        tick: wa.tickCount,
        type: 'OTHER',
        location: { x: 0, y: 0 },
        details: JSON.stringify(entry)
      });
    }
    if (wb) {
      await wb.persistence.saveWorldEvent({
        worldId: wb.id,
        tick: wb.tickCount,
        type: 'OTHER',
        location: { x: 0, y: 0 },
        details: JSON.stringify(entry)
      });
    }

    const dir = path.join(process.cwd(), 'data', 'reports');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'wormholes.jsonl');
    await fs.appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
  }
}
