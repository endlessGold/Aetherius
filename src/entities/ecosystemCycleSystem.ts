import { AssembleManager } from './assembly.js';
import { World } from '../core/world.js';
import { EnvLayer } from '../core/environment/environmentGrid.js';
import { createEntityByAssemblyWithManager } from './catalog.js';
import { Biological, System, Interaction } from '../core/events/eventTypes.js';
import { v4 as uuidv4 } from 'uuid';

type SeasonState = {
  seasonIndex: number;
  seasonLengthTicks: number;
  tickInSeason: number;
};

type DiseaseStrain = {
  id: string;
  transmissibility: number;
  lethality: number;
  mutationRate: number;
  hostCompatibilityKey: string;
  preferredClimate: { minTemp: number; maxTemp: number; minHumidity: number; maxHumidity: number };
};

type SpatialIndex = {
  cellSize: number;
  buckets: Map<string, any[]>;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function keyForCell(cx: number, cy: number) {
  return `${cx},${cy}`;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class EcosystemCycleSystem {
  private season: SeasonState = { seasonIndex: 0, seasonLengthTicks: 300, tickInSeason: 0 };
  private spatial: SpatialIndex = { cellSize: 5, buckets: new Map() };
  private strains: Map<string, DiseaseStrain> = new Map();
  private lastPlaceIdByEntity: Map<string, string> = new Map();
  private migrationTargetByEntity: Map<string, { x: number; y: number; placeId?: string; untilTick: number; reason: string }> = new Map();

  constructor() {
    const seasonLength = Number.parseInt(process.env.AETHERIUS_SEASON_TICKS || '300', 10);
    if (Number.isFinite(seasonLength) && seasonLength > 10) {
      this.season.seasonLengthTicks = seasonLength;
    }
    const base: DiseaseStrain = {
      id: 'Strain_Alpha',
      transmissibility: 0.08,
      lethality: 0.02,
      mutationRate: 0.005,
      hostCompatibilityKey: 'Animalia',
      preferredClimate: { minTemp: 10, maxTemp: 35, minHumidity: 0.2, maxHumidity: 0.95 }
    };
    this.strains.set(base.id, base);
  }

  async tick(manager: AssembleManager, world: World): Promise<void> {
    await this.tickSeason(world);
    this.buildSpatialIndex(manager);
    await this.tickMigration(manager, world);
    await this.tickDisease(manager, world);
    await this.tickHybridization(manager, world);
    await this.tickDeathsAndCorpses(manager, world);
    await this.tickDecomposition(manager, world);
  }

  getSeasonSnapshot() {
    const names = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const seasonName = names[this.season.seasonIndex] || 'Unknown';
    return { ...this.season, seasonName };
  }

  getDiseaseStats(manager: AssembleManager) {
    const counts = { S: 0, E: 0, I: 0, R: 0 };
    const activeStrains = new Set<string>();
    for (const entity of manager.entities) {
      const c = (entity.children?.[0] as any)?.components;
      const d = c?.disease;
      if (!d) continue;
      if (d.status in counts) (counts as any)[d.status] += 1;
      if (d.strainId) activeStrains.add(d.strainId);
    }
    return { counts, strains: Array.from(activeStrains), knownStrains: Array.from(this.strains.keys()) };
  }

  getCorpseStats(manager: AssembleManager) {
    let count = 0;
    let biomassSum = 0;
    let pathogenSum = 0;
    for (const entity of manager.entities) {
      const c = (entity.children?.[0] as any)?.components;
      if (c?.classification?.subtype !== 'Corpse') continue;
      count += 1;
      biomassSum += Number(c.biomass) || 0;
      pathogenSum += Number(c.pathogenLoad) || 0;
    }
    return { count, avgBiomass: count ? biomassSum / count : 0, avgPathogenLoad: count ? pathogenSum / count : 0 };
  }

  getMigrationStats() {
    const byPlace: Record<string, number> = {};
    for (const [, placeId] of this.lastPlaceIdByEntity) {
      byPlace[placeId] = (byPlace[placeId] || 0) + 1;
    }
    return { byPlace, activeTargets: this.migrationTargetByEntity.size };
  }

  private async tickSeason(world: World) {
    this.season.tickInSeason += 1;
    if (this.season.tickInSeason < this.season.seasonLengthTicks) return;
    this.season.tickInSeason = 0;
    this.season.seasonIndex = (this.season.seasonIndex + 1) % 4;

    const names = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const seasonName = names[this.season.seasonIndex] || 'Unknown';
    world.eventBus.publish(new System.SeasonChanged(this.season.seasonIndex, seasonName, this.season.seasonLengthTicks, 'EcosystemCycleSystem'));

    await world.persistence.saveWorldEvent({
      worldId: world.id,
      tick: world.tickCount,
      type: 'OTHER',
      location: { x: 0, y: 0 },
      details: JSON.stringify({ kind: 'season_changed', seasonIndex: this.season.seasonIndex, seasonName, seasonLengthTicks: this.season.seasonLengthTicks, tick: world.tickCount })
    });
  }

  private buildSpatialIndex(manager: AssembleManager) {
    const cellSize = this.spatial.cellSize;
    const buckets = new Map<string, any[]>();

    for (const entity of manager.entities) {
      const behavior = entity.children?.[0] as any;
      const c = behavior?.components;
      if (!c?.position) continue;
      const x = c.position.x;
      const y = c.position.y;
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      const k = keyForCell(cx, cy);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(entity);
    }

    this.spatial.buckets = buckets;
  }

  private queryNeighbors(pos: { x: number; y: number }, radius: number): any[] {
    const cellSize = this.spatial.cellSize;
    const buckets = this.spatial.buckets;
    const cx = Math.floor(pos.x / cellSize);
    const cy = Math.floor(pos.y / cellSize);
    const cr = Math.ceil(radius / cellSize);

    const out: any[] = [];
    for (let dy = -cr; dy <= cr; dy++) {
      for (let dx = -cr; dx <= cr; dx++) {
        const k = keyForCell(cx + dx, cy + dy);
        const list = buckets.get(k);
        if (!list) continue;
        out.push(...list);
      }
    }
    return out;
  }

  private async tickMigration(manager: AssembleManager, world: World) {
    const network = (world as any).mazeSystem?.network;
    if (!network) return;

    for (const entity of manager.entities) {
      const behavior = entity.children?.[0] as any;
      const c = behavior?.components;
      if (!c?.position) continue;
      if (c.classification?.subtype === 'Corpse') continue;

      const isMobile = Boolean(c.goalGA) || c.classification?.subtype === 'Creature';
      if (!isMobile) continue;

      const nearest = network.getNearestNode(c.position.x, c.position.y, 12);
      if (nearest) {
        const last = this.lastPlaceIdByEntity.get(entity.id);
        if (last && last !== nearest.id) {
          world.eventBus.publish(
            new Biological.EntityMoved(
              entity.id,
              { x: c.position.x, y: c.position.y, placeId: last },
              { x: c.position.x, y: c.position.y, placeId: nearest.id },
              'place_transition',
              'EcosystemCycleSystem'
            )
          );
          await world.persistence.saveWorldEvent({
            worldId: world.id,
            tick: world.tickCount,
            type: 'OTHER',
            location: { x: c.position.x, y: c.position.y },
            details: JSON.stringify({ kind: 'entity_moved', entityId: entity.id, fromPlaceId: last, toPlaceId: nearest.id, tick: world.tickCount })
          });
        }
        this.lastPlaceIdByEntity.set(entity.id, nearest.id);
      }

      const shouldAssign = this.season.tickInSeason === 1 || !this.migrationTargetByEntity.has(entity.id) || (this.migrationTargetByEntity.get(entity.id)!.untilTick <= world.tickCount);
      if (shouldAssign) {
        const urge = this.computeMigrationUrge(c, world);
        if (urge < 0.6) continue;
        const target = this.pickMigrationTarget(c.position, network);
        if (!target) continue;
        this.migrationTargetByEntity.set(entity.id, { ...target, untilTick: world.tickCount + 200, reason: 'seasonal_migration' });
      }

      const target = this.migrationTargetByEntity.get(entity.id);
      if (!target) continue;

      const dirX = target.x - c.position.x;
      const dirY = target.y - c.position.y;
      const d = Math.sqrt(dirX * dirX + dirY * dirY);
      if (d < 1) continue;

      const speed = 0.5 + (c.goalGA?.genome?.stats?.speed || 0) * 0.05;
      c.position.x += (dirX / d) * speed;
      c.position.y += (dirY / d) * speed;
      c.position.x = Math.max(0, Math.min(100, c.position.x));
      c.position.y = Math.max(0, Math.min(100, c.position.y));
    }

  }

  private computeMigrationUrge(components: any, world: World) {
    const pos = components.position;
    const temp = world.environment.get(pos.x, pos.y, EnvLayer.Temperature);
    const moisture = world.environment.get(pos.x, pos.y, EnvLayer.SoilMoisture);
    const tempStress = this.season.seasonIndex === 3 ? clamp01((10 - temp) / 10) : clamp01((temp - 38) / 8);
    const waterStress = clamp01((10 - moisture) / 10);
    const social = components.goalGA?.genome?.stats?.sociability ?? 0.5;
    const wander = components.goalGA?.genome?.stats?.wanderlust ?? 0.5;
    return clamp01(0.35 * tempStress + 0.35 * waterStress + 0.15 * wander + 0.15 * (1 - social));
  }

  private pickMigrationTarget(pos: { x: number; y: number }, network: any): { x: number; y: number; placeId?: string } | null {
    const current = network.getNearestNode(pos.x, pos.y, 15) || null;
    if (!current) {
      const rnd = Array.from(network.nodes.values()) as any[];
      if (rnd.length === 0) return null;
      const n = rnd[Math.floor(Math.random() * rnd.length)] as any;
      return { x: n.position.x, y: n.position.y, placeId: n.id };
    }

    const options = Array.from(current.maze.connections.keys());
    if (options.length > 0 && Math.random() < 0.7) {
      const toId = options[Math.floor(Math.random() * options.length)];
      const to = network.nodes.get(toId);
      if (to) return { x: to.position.x, y: to.position.y, placeId: to.id };
    }

    const all = (Array.from(network.nodes.values()) as any[]).filter((n: any) => n.id !== current.id);
    if (all.length === 0) return null;
    const n = all[Math.floor(Math.random() * all.length)] as any;
    return { x: n.position.x, y: n.position.y, placeId: n.id };
  }

  private async tickDisease(manager: AssembleManager, world: World) {
    const strains = Array.from(this.strains.values());
    if (strains.length === 0) return;

    for (const entity of manager.entities) {
      const behavior = entity.children?.[0] as any;
      const c = behavior?.components;
      if (!c?.position) continue;
      if (!c?.disease) continue;
      if (c.classification?.subtype === 'Corpse') continue;

      const disease = c.disease;
      const pos = c.position;

      const humidity = world.environment.get(pos.x, pos.y, EnvLayer.Humidity);
      const temperature = world.environment.get(pos.x, pos.y, EnvLayer.Temperature);

      if (disease.status === 'S') {
        const neighbors = this.queryNeighbors(pos, 3);
        let exposure = 0;
        let picked: DiseaseStrain | null = null;

        for (const other of neighbors) {
          if (other.id === entity.id) continue;
          const oc = (other.children?.[0] as any)?.components;
          const od = oc?.disease;
          if (!od || od.status !== 'I' || !od.strainId) continue;
          const strain = this.strains.get(od.strainId);
          if (!strain) continue;

          const hostKey = c.taxonomy?.kingdom || c.taxonomy?.compatibilityKey?.split(':')[0] || '';
          const compatible = strain.hostCompatibilityKey === hostKey || strain.hostCompatibilityKey === 'Any';
          if (!compatible) continue;

          const climateOk =
            temperature >= strain.preferredClimate.minTemp &&
            temperature <= strain.preferredClimate.maxTemp &&
            humidity >= strain.preferredClimate.minHumidity &&
            humidity <= strain.preferredClimate.maxHumidity;

          const climateFactor = climateOk ? 1 : 0.35;
          const immunity = clamp01(disease.immunity);
          const dist = distance(pos, oc.position);
          const distFactor = dist <= 1 ? 1 : dist <= 2 ? 0.6 : 0.3;
          exposure += strain.transmissibility * climateFactor * distFactor * (1 - immunity);
          picked = strain;
        }

        if (picked && exposure > 0 && Math.random() < clamp01(exposure)) {
          disease.status = 'E';
          disease.strainId = picked.id;
          disease.load = 0.1;
          disease.incubationTicks = 10 + Math.floor(Math.random() * 20);
          disease.infectedAtTick = world.tickCount;
          world.eventBus.publish(new Biological.InfectionContracted(entity.id, picked.id, 'EcosystemCycleSystem'));
          await world.persistence.saveWorldEvent({
            worldId: world.id,
            tick: world.tickCount,
            type: 'OTHER',
            location: { x: pos.x, y: pos.y },
            details: JSON.stringify({ kind: 'infection_contracted', entityId: entity.id, strainId: picked.id, tick: world.tickCount })
          });

          if (Math.random() < picked.mutationRate) {
            const mutated = this.mutateStrain(picked);
            this.strains.set(mutated.id, mutated);
            world.eventBus.publish(new Biological.NewStrainDiscovered(mutated.id, this.summarizeStrain(mutated), picked.id, 'EcosystemCycleSystem'));
          }
        }
      } else if (disease.status === 'E') {
        disease.incubationTicks -= 1;
        disease.load = Math.min(1, disease.load + 0.03);
        if (disease.incubationTicks <= 0) {
          disease.status = 'I';
          world.eventBus.publish(new Biological.InfectionExposed(entity.id, disease.strainId || 'Unknown', disease.load, 'EcosystemCycleSystem'));
        }
      } else if (disease.status === 'I') {
        const strain = disease.strainId ? this.strains.get(disease.strainId) : null;
        disease.load = Math.min(1, disease.load + 0.02);
        disease.immunity = clamp01(disease.immunity + 0.005);

        const lethality = strain ? strain.lethality : 0.01;
        const damage = lethality * (0.5 + disease.load);
        if (c.vitality?.hp != null) c.vitality.hp -= damage;

        if (c.vitality?.hp != null && c.vitality.hp <= 0) {
          world.eventBus.publish(new Biological.DiedOfDisease(entity.id, disease.strainId || 'Unknown', 'EcosystemCycleSystem'));
        } else if (Math.random() < 0.02 + disease.immunity * 0.05) {
          disease.status = 'R';
          disease.load = 0;
          world.eventBus.publish(new Biological.Recovered(entity.id, disease.strainId || 'Unknown', 'EcosystemCycleSystem'));
        }
      } else if (disease.status === 'R') {
        disease.immunity = clamp01(disease.immunity - 0.0005);
      }
    }

  }

  private summarizeStrain(s: DiseaseStrain) {
    return { transmissibility: s.transmissibility, lethality: s.lethality, mutationRate: s.mutationRate, host: s.hostCompatibilityKey };
  }

  private mutateStrain(parent: DiseaseStrain): DiseaseStrain {
    const id = `Strain_${Math.random().toString(36).slice(2, 8)}`;
    const mutate = (v: number, amp: number) => Math.max(0, v + (Math.random() - 0.5) * amp);
    return {
      ...parent,
      id,
      transmissibility: clamp01(mutate(parent.transmissibility, 0.05)),
      lethality: clamp01(mutate(parent.lethality, 0.03)),
      mutationRate: clamp01(mutate(parent.mutationRate, 0.01))
    };
  }

  private async tickHybridization(manager: AssembleManager, world: World) {
    if (this.season.seasonIndex !== 0) return;
    if (Math.random() > 0.15) return;

    const candidates = manager.entities.filter((e: any) => {
      const c = (e.children?.[0] as any)?.components;
      if (!c?.position) return false;
      if (c.classification?.subtype !== 'Creature') return false;
      if (!c.taxonomy?.speciesId) return false;
      if (c.vitality?.hp != null && c.vitality.hp <= 0) return false;
      if (c.energy?.energy != null && c.energy.energy < 30) return false;
      return true;
    });

    if (candidates.length < 2) return;
    const a = candidates[Math.floor(Math.random() * candidates.length)];
    const ac = (a.children[0] as any).components;
    const neighbors = this.queryNeighbors(ac.position, 4).filter((e: any) => e.id !== a.id);
    const b = neighbors.find((e: any) => {
      const bc = (e.children?.[0] as any)?.components;
      if (!bc?.taxonomy?.speciesId) return false;
      if (bc.taxonomy.speciesId === ac.taxonomy.speciesId) return false;
      if (bc.energy?.energy != null && bc.energy.energy < 30) return false;
      return true;
    });

    if (!b) return;
    const bc = (b.children[0] as any).components;

    const compatA = (ac.taxonomy.compatibilityKey || '').split(':')[0] || ac.taxonomy.kingdom;
    const compatB = (bc.taxonomy.compatibilityKey || '').split(':')[0] || bc.taxonomy.kingdom;
    const base = compatA === compatB ? 0.02 : 0.001;
    const healthA = clamp01((ac.vitality?.hp ?? 100) / 100);
    const healthB = clamp01((bc.vitality?.hp ?? 100) / 100);
    const diseasePenalty = clamp01((ac.disease?.load ?? 0) + (bc.disease?.load ?? 0));
    const probability = clamp01(base * healthA * healthB * (1 - 0.5 * diseasePenalty));
    const success = Math.random() < probability;

    world.eventBus.publish(new Interaction.InterspeciesMatingAttempted(a.id, b.id, probability, success, 'EcosystemCycleSystem'));
    if (!success) {
      return;
    }

    const offspringId = `${world.id}_Hybrid_${uuidv4().slice(0, 8)}`;
    const offspring = createEntityByAssemblyWithManager(manager, 'Creature_Type_001', offspringId);
    const oc = (offspring.children[0] as any).components;

    oc.classification = {
      category: 'Hybrid',
      subtype: 'HybridCreature',
      material: { organicFraction: 0.85, inorganicFraction: 0.05, waterFraction: 0.1 },
      tags: ['multicellular', 'consumer', 'hybrid']
    };
    oc.taxonomy = {
      domain: 'Eukaryote',
      kingdom: 'Animalia',
      clade: 'Hybrid',
      speciesId: `Hybrid:${ac.taxonomy.speciesId}+${bc.taxonomy.speciesId}`,
      compatibilityKey: `Animalia:Hybrid`,
      hybridOf: { a: ac.taxonomy.speciesId, b: bc.taxonomy.speciesId }
    };

    oc.position.x = (ac.position.x + bc.position.x) / 2;
    oc.position.y = (ac.position.y + bc.position.y) / 2;
    if (oc.goalGA?.genome?.weights && ac.goalGA?.genome?.weights && bc.goalGA?.genome?.weights) {
      oc.goalGA.genome.weights.survive = (ac.goalGA.genome.weights.survive + bc.goalGA.genome.weights.survive) / 2;
      oc.goalGA.genome.weights.grow = (ac.goalGA.genome.weights.grow + bc.goalGA.genome.weights.grow) / 2;
      oc.goalGA.genome.weights.explore = (ac.goalGA.genome.weights.explore + bc.goalGA.genome.weights.explore) / 2;
    }

    world.eventBus.publish(new Biological.HybridOffspringBorn(offspringId, a.id, b.id, world.id, 'EcosystemCycleSystem'));

    await world.persistence.saveWorldEvent({
      worldId: world.id,
      tick: world.tickCount,
      type: 'OTHER',
      location: { x: oc.position.x, y: oc.position.y },
      details: JSON.stringify({ kind: 'hybrid_offspring', offspringId, parentA: a.id, parentB: b.id, tick: world.tickCount })
    });
  }

  private async tickDeathsAndCorpses(manager: AssembleManager, world: World) {
    const dead: any[] = [];
    for (const entity of manager.entities) {
      const c = (entity.children?.[0] as any)?.components;
      if (!c?.vitality) continue;
      if (c.classification?.subtype === 'Corpse') continue;
      if (c.vitality.hp <= 0) dead.push(entity);
    }

    for (const entity of dead) {
      const c = (entity.children?.[0] as any)?.components;
      const pos = c.position || { x: 0, y: 0 };
      const biomass = c.classification?.subtype === 'Plant' ? 8 : 12;
      const pathogenLoad = c.disease?.load ?? 0;
      world.eventBus.publish(new Biological.Death(entity.id, 'hp_zero', { x: pos.x, y: pos.y }, biomass, pathogenLoad, 'EcosystemCycleSystem'));

      const corpseId = `${world.id}_Corpse_${uuidv4().slice(0, 8)}`;
      const corpse = createEntityByAssemblyWithManager(manager, 'Corpse_Organic_001', corpseId);
      const cc = (corpse.children[0] as any).components;
      cc.position.x = pos.x;
      cc.position.y = pos.y;
      cc.biomass = biomass;
      cc.pathogenLoad = pathogenLoad;
      cc.createdTick = world.tickCount;
      cc.decayStage = 0;

      world.eventBus.publish(new Biological.CorpseCreated(corpseId, entity.id, { x: pos.x, y: pos.y }, 'EcosystemCycleSystem'));
      manager.releaseEntity(entity);

      if (Math.random() < 0.25) {
        const microbeId = `${world.id}_Microbe_${uuidv4().slice(0, 8)}`;
        const microbeType = `Microbe_Type_${String(1 + Math.floor(Math.random() * 20)).padStart(3, '0')}`;
        const microbe = createEntityByAssemblyWithManager(manager, microbeType, microbeId);
        const mc = (microbe.children[0] as any).components;
        mc.position.x = Math.max(0, Math.min(100, pos.x + (Math.random() - 0.5) * 4));
        mc.position.y = Math.max(0, Math.min(100, pos.y + (Math.random() - 0.5) * 4));
      }

      await world.persistence.saveWorldEvent({
        worldId: world.id,
        tick: world.tickCount,
        type: 'OTHER',
        location: { x: pos.x, y: pos.y },
        details: JSON.stringify({ kind: 'death', entityId: entity.id, corpseId, tick: world.tickCount })
      });
    }

    if (dead.length > 0) {
    }
  }

  private async tickDecomposition(manager: AssembleManager, world: World) {
    const corpses = manager.entities.filter((e: any) => {
      const c = (e.children?.[0] as any)?.components;
      return c?.classification?.subtype === 'Corpse';
    });
    if (corpses.length === 0) return;

    const toRemove: any[] = [];

    for (const corpse of corpses) {
      const c = (corpse.children[0] as any).components;
      const pos = c.position;
      const temp = world.environment.get(pos.x, pos.y, EnvLayer.Temperature);
      const humidity = world.environment.get(pos.x, pos.y, EnvLayer.Humidity);
      const moisture = world.environment.get(pos.x, pos.y, EnvLayer.SoilMoisture);

      const baseRate = 0.015;
      const tempFactor = clamp01((temp - 5) / 30);
      const waterFactor = clamp01((humidity + moisture) / 2);
      const microbesNear = this.queryNeighbors(pos, 3).filter((e: any) => {
        const oc = (e.children?.[0] as any)?.components;
        return oc?.classification?.subtype === 'Microbe';
      }).length;
      const microbeFactor = 1 + Math.min(2, microbesNear * 0.15);

      const rate = baseRate * (0.4 + 0.6 * tempFactor) * (0.4 + 0.6 * waterFactor) * microbeFactor;

      const delta = Math.min(c.biomass, c.biomass * rate);
      c.biomass = Math.max(0, c.biomass - delta);
      c.decayStage = clamp01(c.decayStage + rate * 0.5);

      const n = delta * 0.2;
      const organicMatter = delta * 0.6;
      const microbial = delta * 0.05;

      world.environment.add(pos.x, pos.y, EnvLayer.SoilNitrogen, n);
      world.environment.add(pos.x, pos.y, EnvLayer.OrganicMatter, organicMatter);
      world.environment.add(pos.x, pos.y, EnvLayer.MicrobialActivity, microbial);

      world.eventBus.publish(new Biological.DecompositionApplied(corpse.id, { x: pos.x, y: pos.y }, { n, organicMatter, microbial }, 'EcosystemCycleSystem'));

      if (c.biomass <= 0.5 || world.tickCount - c.createdTick > 800) {
        toRemove.push(corpse);
      }
    }

    if (toRemove.length > 0) {
      for (const corpse of toRemove) manager.releaseEntity(corpse);
    }

  }
}
