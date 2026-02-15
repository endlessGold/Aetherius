import { World } from '../world.js';
import { NodeInterface } from '../interfaces.js';
import { EnvLayer } from '../environment/environmentGrid.js';
import { GoalGAComponent, GoalKind, GoalGenome } from '../../components/goalGaComponent.js';
import { PRNG, hashStringToSeed } from '../../ai/prng.js';

type Candidate = { node: NodeInterface; fitness: number };

export class GoalGASystem {
  private evolutionIntervalTicks: number;

  constructor(evolutionIntervalTicks: number = 20) {
    this.evolutionIntervalTicks = evolutionIntervalTicks;
  }

  tick(world: World): void {
    const agents = this.getAgents(world);
    if (agents.length === 0) return;

    for (const agent of agents) {
      const comp = agent.components.get('GoalGA') as GoalGAComponent | undefined;
      if (!comp) continue;

      this.stepAgent(world, agent, comp);
    }

    if (world.tickCount > 0 && world.tickCount % this.evolutionIntervalTicks === 0) {
      this.evolve(world, agents);
    }
  }

  private getAgents(world: World): NodeInterface[] {
    return Array.from(world.nodes.values()).filter((n) => n.components.has('GoalGA'));
  }

  private stepAgent(world: World, agent: NodeInterface, comp: GoalGAComponent): void {
    const s = comp.state;
    s.metrics.ageTicks += 1;

    const env = this.sampleEnvironment(world, s.position.x, s.position.y);
    const deficits = {
      energy: clamp01((60 - s.physiology.energy) / 60),
      hydration: clamp01((60 - s.physiology.hydration) / 60)
    };

    const purpose = this.selectPurpose(s.genome, deficits);
    s.purpose.kind = purpose.kind;
    s.purpose.target = purpose.target;

    const achievementBefore = s.metrics.purposeAchievement;
    this.performAction(world, agent.id, comp, env);
    const achievementAfter = this.computePurposeAchievement(s, deficits);
    s.metrics.purposeAchievement = achievementAfter;

    const deltaAchievement = achievementAfter - achievementBefore;
    s.metrics.fitness = this.computeFitness(s, deltaAchievement);
  }

  private sampleEnvironment(world: World, x: number, y: number) {
    const grid = world.environment;
    const temperature = grid.get(x, y, EnvLayer.Temperature);
    const humidity = grid.get(x, y, EnvLayer.Humidity);
    const soilMoisture = grid.get(x, y, EnvLayer.SoilMoisture);
    const light = grid.get(x, y, EnvLayer.LightIntensity);
    const nitrogen = grid.get(x, y, EnvLayer.SoilNitrogen);
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

  private computeFitness(state: GoalGAComponent['state'], deltaAchievement: number): number {
    const survival = 0.5 * clamp01(state.physiology.energy / 100) + 0.5 * clamp01(state.physiology.hydration / 100);
    const growth = clamp01(state.growth.biomass / 100);
    const longevity = clamp01(state.metrics.ageTicks / 200);
    const novelty = deltaAchievement > 0 ? clamp01(deltaAchievement) : 0;
    return 0.55 * survival + 0.25 * growth + 0.15 * longevity + 0.05 * novelty;
  }

  private evolve(world: World, agents: NodeInterface[]): void {
    const candidates: Candidate[] = [];
    for (const node of agents) {
      const comp = node.components.get('GoalGA') as GoalGAComponent | undefined;
      if (!comp) continue;
      candidates.push({ node, fitness: comp.state.metrics.fitness });
    }
    if (candidates.length < 2) return;

    candidates.sort((a, b) => b.fitness - a.fitness);
    const survivors = candidates.slice(0, Math.ceil(candidates.length / 2));
    const replacees = candidates.slice(Math.ceil(candidates.length / 2));

    const prng = new PRNG(hashStringToSeed(`${world.id}:evolve:${world.tickCount}`));
    for (const target of replacees) {
      const parentA = survivors[prng.nextInt(survivors.length)].node;
      const parentB = survivors[prng.nextInt(survivors.length)].node;

      const a = (parentA.components.get('GoalGA') as GoalGAComponent).state.genome;
      const b = (parentB.components.get('GoalGA') as GoalGAComponent).state.genome;
      const child = this.mutateGenome(this.crossoverGenome(a, b, prng), prng);

      const comp = target.node.components.get('GoalGA') as GoalGAComponent;
      comp.state.genome = child;
      comp.state.metrics.fitness = 0;
      comp.state.metrics.purposeAchievement = 0;
    }
  }

  private crossoverGenome(a: GoalGenome, b: GoalGenome, prng: PRNG): GoalGenome {
    const pick = () => (prng.nextFloat01() < 0.5 ? a : b);
    const w = {
      survive: pick().weights.survive,
      grow: pick().weights.grow,
      explore: pick().weights.explore
    };
    const sum = w.survive + w.grow + w.explore;
    const norm = sum > 0 ? sum : 1;
    return {
      weights: { survive: w.survive / norm, grow: w.grow / norm, explore: w.explore / norm },
      mutationRate: clamp01((a.mutationRate + b.mutationRate) / 2)
    };
  }

  private mutateGenome(genome: GoalGenome, prng: PRNG): GoalGenome {
    const jitter = (v: number) => {
      if (prng.nextFloat01() > genome.mutationRate) return v;
      const delta = (prng.nextFloat01() - 0.5) * 0.2;
      return clamp01(v + delta);
    };

    const w = {
      survive: jitter(genome.weights.survive),
      grow: jitter(genome.weights.grow),
      explore: jitter(genome.weights.explore)
    };
    const sum = w.survive + w.grow + w.explore;
    const norm = sum > 0 ? sum : 1;
    return {
      weights: { survive: w.survive / norm, grow: w.grow / norm, explore: w.explore / norm },
      mutationRate: clamp01(jitter(genome.mutationRate))
    };
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

