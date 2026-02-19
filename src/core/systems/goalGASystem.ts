import { World } from '../world.js';
import { NodeInterface } from '../interfaces.js';
import { Entity } from '../node.js';
import { Layer } from '../environment/environmentGrid.js';
import { GoalGAComponent, GoalKind, GoalGenome } from '../../components/goalGaComponent.js';
import { PRNG, hashStringToSeed } from '../../ai/prng.js';
import { NodePool } from '../nodePool.js';

type Candidate = { node: NodeInterface; fitness: number };
type OffspringAgg = { sumFitness: number; count: number };

export class GoalGASystem {
  private evolutionIntervalTicks: number;
  private maxOffspringPerProgenitor: number = 3;
  private maxOffspringTotal: number = 200;

  constructor(evolutionIntervalTicks: number = 20) {
    this.evolutionIntervalTicks = evolutionIntervalTicks;
  }

  tick(world: World): void {
    const agents = this.getAgents(world);
    if (agents.length === 0) return;

    const offspringByParent = new Map<string, OffspringAgg>();
    let totalOffspring = 0;
    for (const agent of agents) {
      const comp = agent.components.get('GoalGA') as GoalGAComponent | undefined;
      if (!comp) continue;
      this.ensureLineage(comp);
      if (comp.state.lineage.role !== 'Offspring' || !comp.state.lineage.parentId) continue;
      totalOffspring += 1;
      const existing = offspringByParent.get(comp.state.lineage.parentId) ?? { sumFitness: 0, count: 0 };
      existing.sumFitness += comp.state.metrics.fitness;
      existing.count += 1;
      offspringByParent.set(comp.state.lineage.parentId, existing);
    }

    for (const agent of agents) {
      const comp = agent.components.get('GoalGA') as GoalGAComponent | undefined;
      if (!comp) continue;

      this.stepAgent(world, agent, comp, offspringByParent.get(agent.id), totalOffspring);
    }

    if (world.tickCount > 0 && world.tickCount % this.evolutionIntervalTicks === 0) {
      this.evolve(world, agents);
      this.logEvolutionStats(world, agents);
    }
  }

  private getAgents(world: World): NodeInterface[] {
    return Array.from(world.nodes.values()).filter((n) => n.components.has('GoalGA'));
  }

  private stepAgent(
    world: World,
    agent: NodeInterface,
    comp: GoalGAComponent,
    offspringAgg: OffspringAgg | undefined,
    totalOffspring: number
  ): void {
    const s = comp.state;
    this.ensureLineage(comp);
    s.metrics.ageTicks += 1;

    const env = this.sampleEnvironment(world, s.position.x, s.position.y);
    const deficits = {
      energy: clamp01((60 - s.physiology.energy) / 60),
      hydration: clamp01((60 - s.physiology.hydration) / 60)
    };

    if (s.lineage.role === 'Offspring' && s.lineage.parentId) {
      const parent = world.getNode(s.lineage.parentId);
      if (!parent) {
        s.lineage.role = 'Progenitor';
        s.lineage.parentId = undefined;
      }
    }

    if (s.lineage.role === 'Progenitor') {
      const activeOffspringCount = offspringAgg?.count ?? 0;
      if (
        s.physiology.energy > 80 &&
        activeOffspringCount < this.maxOffspringPerProgenitor &&
        totalOffspring < this.maxOffspringTotal
      ) {
        this.spawnOffspring(world, agent, comp);
        s.physiology.energy = clamp0_100(s.physiology.energy - 30);
      }
    }

    const purpose = this.selectPurpose(s.genome, deficits);
    s.purpose.kind = purpose.kind;
    s.purpose.target = purpose.target;

    const achievementBefore = s.metrics.purposeAchievement;
    this.performAction(world, agent.id, comp, env);
    const achievementAfter = this.computePurposeAchievement(s, deficits);
    s.metrics.purposeAchievement = achievementAfter;

    const deltaAchievement = achievementAfter - achievementBefore;
    const offspringAvgFitness = offspringAgg && offspringAgg.count > 0 ? offspringAgg.sumFitness / offspringAgg.count : 0;
    s.metrics.fitness = this.computeFitness(s, deltaAchievement, offspringAvgFitness);
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
    agentId: string,
    comp: GoalGAComponent,
    env: { temperature: number; humidity: number; soilMoisture: number; light: number; nitrogen: number }
  ): void {
    const s = comp.state;
    const prng = new PRNG(hashStringToSeed(`${world.id}:${agentId}:${world.tickCount}`));

    if (s.purpose.kind === 'Survive') {
      const waterGain = clamp01(env.soilMoisture) * 8;
      const energyGain = clamp01(env.nitrogen) * 6 + clamp01(env.light / 1000) * 4;
      s.physiology.hydration = clamp0_100(s.physiology.hydration + waterGain - 1.5);
      s.physiology.energy = clamp0_100(s.physiology.energy + energyGain - 1.0);
      s.metrics.lastAction = 'Forage';
      return;
    }

    if (s.purpose.kind === 'Grow') {
      const growthPotential = clamp01(env.light / 1000) * 0.6 + clamp01(env.nitrogen) * 0.4;
      const cost = 2.0;
      if (s.physiology.energy >= cost) {
        s.physiology.energy = clamp0_100(s.physiology.energy - cost);
        s.growth.biomass += growthPotential;
        s.metrics.lastAction = 'Grow';
      } else {
        s.metrics.lastAction = 'Rest';
        s.physiology.energy = clamp0_100(s.physiology.energy + 0.5);
      }
      s.physiology.hydration = clamp0_100(s.physiology.hydration - 0.8);
      return;
    }

    const stepX = prng.nextInt(3) - 1;
    const stepY = prng.nextInt(3) - 1;
    s.position.x = wrap(s.position.x + stepX, world.environment.width);
    s.position.y = wrap(s.position.y + stepY, world.environment.height);
    s.physiology.energy = clamp0_100(s.physiology.energy - 0.8);
    s.physiology.hydration = clamp0_100(s.physiology.hydration - 0.6);
    s.metrics.lastAction = `Explore(${stepX},${stepY})`;
  }

  private computePurposeAchievement(
    state: GoalGAComponent['state'],
    deficits: { energy: number; hydration: number }
  ): number {
    if (state.purpose.kind === 'Survive') {
      const okEnergy = clamp01(state.physiology.energy / 100);
      const okHydration = clamp01(state.physiology.hydration / 100);
      return 0.5 * okEnergy + 0.5 * okHydration;
    }
    if (state.purpose.kind === 'Grow') {
      return clamp01(state.growth.biomass / 50);
    }
    const pressure = Math.max(deficits.energy, deficits.hydration);
    return clamp01(1 - pressure);
  }

  private computeFitness(state: GoalGAComponent['state'], deltaAchievement: number, offspringAvgFitness: number): number {
    const survival = 0.5 * clamp01(state.physiology.energy / 100) + 0.5 * clamp01(state.physiology.hydration / 100);
    const growth = clamp01(state.growth.biomass / 100);
    const longevity = clamp01(state.metrics.ageTicks / 200);
    const novelty = deltaAchievement > 0 ? clamp01(deltaAchievement) : 0;
    const base = 0.55 * survival + 0.25 * growth + 0.15 * longevity + 0.05 * novelty;
    const offspring = clamp01(offspringAvgFitness);
    const hiveBonus = state.lineage.role === 'Progenitor' ? 0.15 * offspring : 0;
    return clamp01(base + hiveBonus);
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

  private logEvolutionStats(world: World, agents: NodeInterface[]): void {
    const stats = { survive: 0, grow: 0, explore: 0, fitness: 0, count: 0 };

    for (const agent of agents) {
      const comp = agent.components.get('GoalGA') as GoalGAComponent;
      this.ensureLineage(comp);
      if (comp.state.lineage.role === 'Offspring') continue;
      stats.survive += comp.state.genome.weights.survive;
      stats.grow += comp.state.genome.weights.grow;
      stats.explore += comp.state.genome.weights.explore;
      stats.fitness += comp.state.metrics.fitness;
      stats.count++;
    }

    if (stats.count > 0) {
      // Use console.log with overwrite behavior if possible, but standard log is safer
      // We will use a visual bar chart style
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

      // Save evolution stats to DB
      world.persistence.saveEvolutionStats({
        worldId: world.id,
        generation: parseInt(gen),
        tick: world.tickCount,
        avgFitness: avgF,
        weights: { survive: avgS, grow: avgG, explore: avgE },
        populationCount: stats.count
      }).catch(err => console.error("Failed to save evolution stats:", err));

      // Auto-save experiment metadata periodically
      if (world.tickCount % 1000 === 0) {
        world.persistence.saveExperimentMetadata({
          id: `${world.id}_EXP_${new Date().toISOString().split('T')[0]}`,
          config: { mutationRateBase: 0.05, evolutionInterval: this.evolutionIntervalTicks },
          startedAt: Date.now(), // Approximate
          totalGenerations: parseInt(gen)
        }).catch(err => console.error("Failed to save exp metadata:", err));
      }
    }
  }

  private evolve(world: World, agents: NodeInterface[]): void {
    const candidates: Candidate[] = [];
    for (const node of agents) {
      const comp = node.components.get('GoalGA') as GoalGAComponent | undefined;
      if (!comp) continue;
      this.ensureLineage(comp);
      if (comp.state.lineage.role === 'Offspring') continue;
      candidates.push({ node, fitness: comp.state.metrics.fitness });
    }
    if (candidates.length < 2) return;

    candidates.sort((a, b) => b.fitness - a.fitness);

    // Elitism: Keep top 10% unchanged
    const eliteCount = Math.max(1, Math.floor(candidates.length * 0.1));
    const elites = candidates.slice(0, eliteCount);

    // Survivors: Top 50% can reproduce
    const survivors = candidates.slice(0, Math.ceil(candidates.length / 2));

    // Replacees: Bottom 50% are replaced
    const replacees = candidates.slice(Math.ceil(candidates.length / 2));

    const prng = new PRNG(hashStringToSeed(`${world.id}:evolve:${world.tickCount}`));

    // Hyper-Evolution: Adaptive Mutation Rate based on stagnation
    // If average fitness is low, boost mutation
    const avgFitness = candidates.reduce((sum, c) => sum + c.fitness, 0) / candidates.length;
    const mutationBoost = avgFitness < 0.2 ? 0.2 : 0; // Boost mutation if struggling

    for (const target of replacees) {
      // Tournament Selection for parents (more random than just picking top)
      const parentA = this.tournamentSelect(survivors, prng).node;
      const parentB = this.tournamentSelect(survivors, prng).node;

      const compA = (parentA.components.get('GoalGA') as GoalGAComponent).state.genome;
      const compB = (parentB.components.get('GoalGA') as GoalGAComponent).state.genome;

      let childGenome = this.crossoverGenome(compA, compB, prng);
      childGenome = this.mutateGenome(childGenome, prng, mutationBoost);

      const comp = target.node.components.get('GoalGA') as GoalGAComponent;
      comp.state.genome = childGenome;
      // Reset state for new generation
      comp.state.metrics.fitness = 0;
      comp.state.metrics.purposeAchievement = 0;
      comp.state.physiology.energy = 50; // Give a chance to survive
      comp.state.physiology.hydration = 50;
    }
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

  private mutateGenome(genome: GoalGenome, prng: PRNG, boost: number = 0): GoalGenome {
    const rate = genome.mutationRate + boost;
    const jitter = (v: number) => {
      if (prng.nextFloat01() > rate) return v;
      const delta = (prng.nextFloat01() - 0.5) * 0.4; // Increased mutation range
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

    // ... rest of mutation logic ...
    const sum = w.survive + w.grow + w.explore;
    const norm = sum > 0 ? sum : 1;
    return {
      weights: { survive: w.survive / norm, grow: w.grow / norm, explore: w.explore / norm },
      stats: s,
      mutationRate: clamp01(jitter(genome.mutationRate))
    };
  }

  private ensureLineage(comp: GoalGAComponent) {
    const s = comp.state as any;
    if (s.lineage) return;
    s.lineage = { role: 'Progenitor', offspringCount: 0, generation: 0 };
  }

  private cloneGenome(genome: GoalGenome): GoalGenome {
    return {
      weights: { survive: genome.weights.survive, grow: genome.weights.grow, explore: genome.weights.explore },
      stats: { size: genome.stats.size, speed: genome.stats.speed, coldResist: genome.stats.coldResist },
      mutationRate: genome.mutationRate
    };
  }

  private spawnOffspring(world: World, parent: NodeInterface, parentComp: GoalGAComponent): void {
    const s = parentComp.state;
    s.lineage.offspringCount += 1;
    const prng = new PRNG(hashStringToSeed(`${world.id}:${parent.id}:spawn:${world.tickCount}:${s.lineage.offspringCount}`));
    const suffix = prng.nextInt(1_000_000).toString().padStart(6, '0');
    const offspringId = `${parent.id}_off_${s.lineage.offspringCount}_${suffix}`;

    const childGenome = this.cloneGenome(s.genome);
    const childComp = new GoalGAComponent({
      genome: childGenome,
      lineage: {
        role: 'Offspring',
        parentId: parent.id,
        offspringCount: 0,
        generation: s.lineage.generation
      },
      purpose: { kind: 'Survive', target: 1 },
      physiology: { energy: 50, hydration: 50 },
      growth: { biomass: 0 },
      position: { x: s.position.x, y: s.position.y },
      metrics: { ageTicks: 0, fitness: 0, purposeAchievement: 0, lastAction: 'Spawned' }
    });

    const pool = NodePool.getInstance();
    const node = pool.acquire<Entity>(
      'WorldEntity',
      () => new Entity(offspringId, 'Entity'),
      (n) => {
        n.id = offspringId;
        n.type = 'Entity';
        n.parent = undefined;
        n.children = [];
        n.components.clear();
      }
    );

    node.addComponent(childComp);
    world.addNode(node);
  }
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function clamp0_100(v: number): number {
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

function wrap(v: number, max: number): number {
  const m = max <= 0 ? 1 : max;
  const r = v % m;
  return r < 0 ? r + m : r;
}
