import { World } from '../core/world.js';
import { AssembleManager, BehaviorNode } from './assembly.js';
import { CreatureEntity, CreatureBehavior } from './behaviors.js';
import { CreatureData } from '../components/entityData.js';
import { GoalGAState, GoalGenome, GoalKind } from '../components/goalGaComponent.js';
import { PRNG, hashStringToSeed } from '../ai/prng.js';
import { Layer } from '../core/environment/environmentGrid.js';

type Candidate = { node: BehaviorNode<CreatureData>; fitness: number };
type OffspringAgg = { sumFitness: number; count: number };

export class EvolutionSystem {
  private evolutionIntervalTicks: number;

  constructor(evolutionIntervalTicks: number = 20) {
    this.evolutionIntervalTicks = evolutionIntervalTicks;
  }

  tick(manager: AssembleManager, world: World): void {
    this.cleanupDeadEntities(manager);

    const agents = this.getAgents(manager);
    if (agents.length === 0) return;

    const offspringByParent = new Map<string, OffspringAgg>();
    for (const agent of agents) {
      const state = agent.components.goalGA;
      if (!state) continue;
      this.ensureLineage(state);
      if (state.lineage.role !== 'Offspring' || !state.lineage.parentId) continue;
      const existing = offspringByParent.get(state.lineage.parentId) ?? { sumFitness: 0, count: 0 };
      existing.sumFitness += state.metrics.fitness;
      existing.count += 1;
      offspringByParent.set(state.lineage.parentId, existing);
    }

    for (const agent of agents) {
      if (!agent.components.goalGA) continue;
      this.stepAgent(manager, world, agent, agent.components.goalGA, offspringByParent.get(agent.id));
    }

    if (world.tickCount > 0 && world.tickCount % this.evolutionIntervalTicks === 0) {
      this.evolve(world, agents);
      this.logEvolutionStats(world, agents);
    }
  }

  private cleanupDeadEntities(manager: AssembleManager) {
    for (let i = manager.entities.length - 1; i >= 0; i--) {
      const entity = manager.entities[i];
      let isDead = false;
      for (const child of entity.children) {
        const comp = (child as any).components;
        if (comp && comp.vitality && comp.vitality.hp <= 0) {
          isDead = true;
          break;
        }
      }

      if (isDead) {
        manager.releaseEntity(entity);
      }
    }
  }

  private getAgents(manager: AssembleManager): BehaviorNode<CreatureData>[] {
    const agents: BehaviorNode<CreatureData>[] = [];
    for (const entity of manager.entities) {
      for (const child of entity.children) {
        const comp = (child as any).components;
        if (comp && comp.goalGA) {
          if (!child.id) child.id = entity.id;
          agents.push(child as BehaviorNode<CreatureData>);
        }
      }
    }
    return agents;
  }

  private spawnOffspring(manager: AssembleManager, world: World, parent: BehaviorNode<CreatureData>, state: GoalGAState): void {
    const parentId = parent.id;
    state.lineage.offspringCount++;
    const offspringId = world.nextId(`${parentId}_off_${state.lineage.offspringCount}`);

    const childGenome = JSON.parse(JSON.stringify(state.genome));
    const childX = parent.components.position.x + (world.random01() - 0.5) * 5;
    const childY = parent.components.position.y + (world.random01() - 0.5) * 5;

    manager.createEntity(
      CreatureEntity,
      offspringId,
      [],
      [{
        NodeClass: CreatureBehavior,
        components: {
          position: { x: childX, y: childY },
          vitality: { hp: 60 },
          energy: { energy: 40 },
          age: { age: 0 },
          goalGA: {
            genome: childGenome,
            purpose: { kind: 'Survive', target: 1 },
            physiology: { energy: 40, hydration: 50 },
            growth: { biomass: 0 },
            position: { x: childX, y: childY },
            metrics: { ageTicks: 0, fitness: 0, purposeAchievement: 0, lastAction: 'Spawned' },
            lineage: {
              role: 'Offspring',
              parentId: parentId,
              offspringCount: 0,
              generation: state.lineage.generation
            }
          }
        } as CreatureData
      }]
    );
  }

  private stepAgent(
    manager: AssembleManager,
    world: World,
    agent: BehaviorNode<CreatureData>,
    state: GoalGAState,
    offspringAgg?: OffspringAgg
  ): void {
    const c = agent.components;
    if (!state.genome?.stats) return;

    this.ensureLineage(state);
    state.physiology.energy = c.energy.energy;
    state.position.x = c.position.x;
    state.position.y = c.position.y;
    state.metrics.ageTicks += 1;

    if (state.lineage.role === 'Offspring' && state.lineage.parentId) {
      const parentEntity = manager.getEntity(state.lineage.parentId);
      if (!parentEntity) {
        state.lineage.role = 'Progenitor';
        state.lineage.parentId = undefined;
      }
    }

    if (state.lineage.role === 'Progenitor') {
      const activeOffspringCount = offspringAgg?.count ?? 0;
      if (c.energy.energy > 80 && activeOffspringCount < 3) {
        this.spawnOffspring(manager, world, agent, state);
        c.energy.energy -= 30;
        state.physiology.energy = c.energy.energy;
      }
    }

    const env = this.sampleEnvironment(world, c.position.x, c.position.y);

    // Calculate deficits based on CreatureData
    const energyVal = isNaN(c.energy.energy) ? 50 : c.energy.energy;
    const hpVal = isNaN(c.vitality.hp) ? 100 : c.vitality.hp;

    const energyDeficit = clamp01((100 - energyVal) / 100);
    const hpDeficit = clamp01((100 - hpVal) / 100);

    const deficits = {
      energy: energyDeficit,
      hydration: hpDeficit
    };

    const purpose = this.selectPurpose(state.genome, deficits);
    state.purpose.kind = purpose.kind;
    state.purpose.target = purpose.target;

    const achievementBefore = state.metrics.purposeAchievement;
    this.performAction(world, agent, env);
    const achievementAfter = this.computePurposeAchievement(c, state, deficits);
    state.metrics.purposeAchievement = achievementAfter;

    const deltaAchievement = achievementAfter - achievementBefore;
    const offspringAvgFitness = offspringAgg && offspringAgg.count > 0 ? offspringAgg.sumFitness / offspringAgg.count : 0;
    state.metrics.fitness = this.computeFitness(c, state, deltaAchievement, offspringAvgFitness);
  }

  private sampleEnvironment(world: World, x: number, y: number) {
    const grid = world.environment;
    const temperature = grid.get(x, y, Layer.Temperature);
    const humidity = grid.get(x, y, Layer.Humidity);
    const soilMoisture = grid.get(x, y, Layer.SoilMoisture);
    const light = grid.get(x, y, Layer.LightIntensity);
    const nitrogen = grid.get(x, y, Layer.SoilNitrogen);
    return { temperature, humidity, soilMoisture, light, nitrogen };
  }

  private selectPurpose(genome: GoalGenome, deficits: { energy: number; hydration: number }) {
    const surviveNeed = Math.max(deficits.energy, deficits.hydration);
    const growNeed = clamp01(1 - surviveNeed) * 0.6;
    const exploreNeed = clamp01(1 - surviveNeed) * 0.4;

    const scoreSurvive = genome.weights.survive * (0.4 + surviveNeed);
    const scoreGrow = genome.weights.grow * (0.2 + growNeed);
    const scoreExplore = genome.weights.explore * (0.2 + exploreNeed);

    let kind: GoalKind = 'Survive';
    let target = surviveNeed;
    if (scoreGrow >= scoreSurvive && scoreGrow >= scoreExplore) {
      kind = 'Grow';
      target = growNeed;
    } else if (scoreExplore >= scoreSurvive && scoreExplore >= scoreGrow) {
      kind = 'Explore';
      target = exploreNeed;
    }

    return { kind, target };
  }

  private performAction(
    world: World,
    agent: BehaviorNode<CreatureData>,
    env: { temperature: number; humidity: number; soilMoisture: number; light: number; nitrogen: number }
  ): void {
    const c = agent.components;
    const s = c.goalGA!;
    if (!s.genome?.stats) return;
    const prng = new PRNG(hashStringToSeed(`${world.id}:${agent.id}:${world.tickCount}`));

    const speed = s.genome.stats.speed;
    const size = s.genome.stats.size;

    const metabolicCost = 0.5 + 0.2 * speed + 0.3 * size;
    c.energy.energy = clamp0_100(c.energy.energy - metabolicCost);

    if (env.temperature < 0) {
      const dmg = Math.max(0, (-env.temperature * 0.5) - (s.genome.stats.coldResist * 10));
      if (dmg > 0) {
        c.vitality.hp = clamp0_100(c.vitality.hp - dmg);
      }
    }

    if (s.purpose.kind === 'Survive') {
      // Forage
      const nitrogen = isNaN(env.nitrogen) ? 0 : env.nitrogen;
      const light = isNaN(env.light) ? 0 : env.light;

      // Speed bonus to foraging (cover more ground)
      const forageBonus = speed * 1.2;
      const food = (clamp01(nitrogen) * 10 + clamp01(light / 1000) * 5) * forageBonus;

      c.energy.energy = clamp0_100(c.energy.energy + food);
      c.vitality.hp = clamp0_100(c.vitality.hp + 0.5 * size);
      s.metrics.lastAction = 'Forage';
      return;
    }

    if (s.purpose.kind === 'Grow') {
      const cost = 5.0;
      if (c.energy.energy >= cost) {
        c.energy.energy = clamp0_100(c.energy.energy - cost);
        s.metrics.lastAction = 'Grow';
      } else {
        s.metrics.lastAction = 'Rest';
        c.energy.energy = clamp0_100(c.energy.energy + 2.0);
      }
      return;
    }

    // Explore
    const stepX = prng.nextInt(3) - 1;
    const stepY = prng.nextInt(3) - 1;
    c.position.x = wrap(c.position.x + stepX, world.environment.width);
    c.position.y = wrap(c.position.y + stepY, world.environment.height);
    c.energy.energy = clamp0_100(c.energy.energy - 1.5);
    s.metrics.lastAction = `Explore(${stepX},${stepY})`;
  }

  private computePurposeAchievement(
    c: CreatureData,
    state: GoalGAState,
    deficits: { energy: number; hydration: number }
  ): number {
    if (state.purpose.kind === 'Survive') {
      const okEnergy = clamp01(c.energy.energy / 100);
      const okHp = clamp01(c.vitality.hp / 100);
      return 0.5 * okEnergy + 0.5 * okHp;
    }
    if (state.purpose.kind === 'Grow') {
      return 0.5; // Placeholder
    }
    const pressure = Math.max(deficits.energy, deficits.hydration);
    return clamp01(1 - pressure);
  }

  private computeFitness(c: CreatureData, state: GoalGAState, deltaAchievement: number, offspringAvgFitness: number): number {
    const survival = 0.5 * clamp01(c.energy.energy / 100) + 0.5 * clamp01(c.vitality.hp / 100);
    const longevity = clamp01(state.metrics.ageTicks / 200);
    const novelty = deltaAchievement > 0 ? clamp01(deltaAchievement) : 0;
    const offspring = clamp01(offspringAvgFitness);
    return clamp01(0.55 * survival + 0.15 * longevity + 0.15 * novelty + 0.15 * offspring);
  }

  private evolve(world: World, agents: BehaviorNode<CreatureData>[]): void {
    const candidates: Candidate[] = [];
    for (const node of agents) {
      if (!node.components.goalGA) continue;
      if (node.components.goalGA.lineage?.role === 'Offspring') continue;

      candidates.push({ node, fitness: node.components.goalGA.metrics.fitness });
    }
    if (candidates.length < 2) return;

    candidates.sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(1, Math.floor(candidates.length * 0.1));
    const survivors = candidates.slice(0, Math.ceil(candidates.length / 2));
    const replacees = candidates.slice(Math.ceil(candidates.length / 2));

    const prng = new PRNG(hashStringToSeed(`${world.id}:evolve:${world.tickCount}`));

    const avgFitness = candidates.reduce((sum, c) => sum + c.fitness, 0) / candidates.length;
    const mutationBoost = avgFitness < 0.2 ? 0.2 : 0;

    for (const target of replacees) {
      const parentA = this.tournamentSelect(survivors, prng).node;
      const parentB = this.tournamentSelect(survivors, prng).node;

      const compA = parentA.components.goalGA!.genome;
      const compB = parentB.components.goalGA!.genome;

      let childGenome = this.crossoverGenome(compA, compB, prng);
      childGenome = this.mutateGenome(childGenome, prng, mutationBoost);

      const comp = target.node.components;
      comp.goalGA!.genome = childGenome;
      comp.goalGA!.metrics.fitness = 0;
      comp.goalGA!.metrics.purposeAchievement = 0;

      comp.energy.energy = 50;
      comp.vitality.hp = 100;
    }
  }

  private ensureLineage(state: GoalGAState) {
    if (state.lineage) return;
    state.lineage = { role: 'Progenitor', offspringCount: 0, generation: 0 };
  }

  private tournamentSelect(candidates: Candidate[], prng: PRNG): Candidate {
    const size = 3;
    let best = candidates[prng.nextInt(candidates.length)];
    for (let i = 0; i < size - 1; i++) {
      const next = candidates[prng.nextInt(candidates.length)];
      if (next.fitness > best.fitness) best = next;
    }
    return best;
  }

  private crossoverGenome(a: GoalGenome, b: GoalGenome, prng: PRNG): GoalGenome {
    const pick = () => (prng.nextFloat01() < 0.5 ? a : b);
    const w = {
      survive: pick().weights.survive,
      grow: pick().weights.grow,
      explore: pick().weights.explore
    };

    // Crossover stats
    const s = {
      size: pick().stats.size,
      speed: pick().stats.speed,
      coldResist: pick().stats.coldResist
    };

    const sum = w.survive + w.grow + w.explore;
    const norm = sum > 0 ? sum : 1;
    return {
      weights: { survive: w.survive / norm, grow: w.grow / norm, explore: w.explore / norm },
      stats: s,
      mutationRate: clamp01((a.mutationRate + b.mutationRate) / 2)
    };
  }

  private mutateGenome(genome: GoalGenome, prng: PRNG, boost: number = 0): GoalGenome {
    const rate = genome.mutationRate + boost;
    const jitter = (v: number) => {
      if (prng.nextFloat01() > rate) return v;
      const delta = (prng.nextFloat01() - 0.5) * 0.4;
      return clamp01(v + delta);
    };

    const jitterStat = (v: number, min: number, max: number) => {
      if (prng.nextFloat01() > rate) return v;
      const delta = (prng.nextFloat01() - 0.5) * 0.2;
      return Math.max(min, Math.min(max, v + delta));
    };

    const w = {
      survive: jitter(genome.weights.survive),
      grow: jitter(genome.weights.grow),
      explore: jitter(genome.weights.explore)
    };

    const s = {
      size: jitterStat(genome.stats.size, 0.1, 2.0),
      speed: jitterStat(genome.stats.speed, 0.1, 2.0),
      coldResist: jitterStat(genome.stats.coldResist, 0.0, 1.0)
    };

    const sum = w.survive + w.grow + w.explore;
    const norm = sum > 0 ? sum : 1;
    return {
      weights: { survive: w.survive / norm, grow: w.grow / norm, explore: w.explore / norm },
      stats: s,
      mutationRate: clamp01(jitter(genome.mutationRate))
    };
  }

  private logEvolutionStats(world: World, agents: BehaviorNode<CreatureData>[]): void {
    const stats = { survive: 0, grow: 0, explore: 0, fitness: 0, count: 0 };

    for (const agent of agents) {
      const s = agent.components.goalGA!;
      stats.survive += s.genome.weights.survive;
      stats.grow += s.genome.weights.grow;
      stats.explore += s.genome.weights.explore;
      stats.fitness += s.metrics.fitness;
      stats.count++;
    }

    if (stats.count > 0) {
      const gen = (world.tickCount / this.evolutionIntervalTicks).toFixed(0);
      const avgS = stats.survive / stats.count;
      const avgG = stats.grow / stats.count;
      const avgE = stats.explore / stats.count;
      const avgF = stats.fitness / stats.count;

      const bar = (val: number) => '█'.repeat(Math.round(val * 20)).padEnd(20, '░');

      console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
      console.log(`║ 🧬 EVOLUTION REPORT | Generation ${gen.padEnd(5)} | Tick ${world.tickCount.toString().padEnd(8)} ║`);
      console.log(`╠══════════════════════════════════════════════════════════════════╣`);
      console.log(`║ Survive : ${bar(avgS)} ${(avgS * 100).toFixed(1)}%`.padEnd(66) + '║');
      console.log(`║ Grow    : ${bar(avgG)} ${(avgG * 100).toFixed(1)}%`.padEnd(66) + '║');
      console.log(`║ Explore : ${bar(avgE)} ${(avgE * 100).toFixed(1)}%`.padEnd(66) + '║');
      console.log(`╟──────────────────────────────────────────────────────────────────╢`);
      console.log(`║ Avg Fitness: ${avgF.toFixed(4).padEnd(52)} ║`);
      console.log(`╚══════════════════════════════════════════════════════════════════╝`);

      world.persistence.saveEvolutionStats({
        worldId: world.id,
        generation: parseInt(gen),
        tick: world.tickCount,
        avgFitness: avgF,
        weights: { survive: avgS, grow: avgG, explore: avgE },
        populationCount: stats.count
      }).catch(err => console.error("Failed to save evolution stats:", err));

      if (world.tickCount % 1000 === 0) {
        world.persistence.saveExperimentMetadata({
          id: `${world.id}_EXP_${new Date().toISOString().split('T')[0]}`,
          config: { mutationRateBase: 0.05, evolutionInterval: this.evolutionIntervalTicks },
          startedAt: Date.now(),
          totalGenerations: parseInt(gen)
        }).catch(err => console.error("Failed to save exp metadata:", err));
      }
    }
  }
}

function clamp01(v: number): number {
  if (isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function clamp0_100(v: number): number {
  if (isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

function wrap(v: number, max: number): number {
  const m = max <= 0 ? 1 : max;
  const r = v % m;
  return r < 0 ? r + m : r;
}
