/**
 * 경제 유전 학습: 집단이 더 많은 V, E, P를 확보하도록 세대 진화.
 * 매 세대: 행동 선택 → 엔진 적용 → 적합도 평가 → 선택·교차·변이 → 다음 세대.
 */

import { AetheriusEngine } from './engine.js';
import { createEconomant, type NutrientPool } from './types.js';
import { nextPolyId } from './idGen.js';
import { createEconomyGenome, fitness, mutate, crossover } from './genome.js';
import type { EconomyGenome } from './genome.js';
import type { EconomyAgent, EconomyAction } from './agent.js';
import { selectAction } from './agent.js';
import { PRNG } from '../ai/prng.js';

export interface EconomyEvolutionConfig {
  populationSize: number;
  stepsPerGeneration: number;
  eliteCount: number;
  seed: number;
}

export const DEFAULT_EVOLUTION_CONFIG: EconomyEvolutionConfig = {
  populationSize: 24,
  stepsPerGeneration: 60,
  eliteCount: 4,
  seed: 42,
};

const DEFAULT_CONFIG = DEFAULT_EVOLUTION_CONFIG;

/** 스텝마다 주변 영양분 풀에 추가할 Poly 개수 (식물용). */
const NUTRIENT_POOL_REFILL_PER_STEP = 4;

export function refillNutrientPool(pool: NutrientPool): void {
  for (let i = 0; i < NUTRIENT_POOL_REFILL_PER_STEP; i++) {
    pool.p.push({
      id: nextPolyId('env'),
      area: 0.5,
      energyDensity: 0.5,
      creatorId: 'env',
    });
  }
}

/** 1틱당 1라운드 실행 시 발생한 행동/파산 정보 (EventBus 발행용). */
export interface RunOneStepResult {
  actions: Array<{ entityId: string; actionKind: string }>;
  defaults: Array<{ entityId: string; rehabCount: number }>;
}

/**
 * 1라운드 실행: 풀 보충 + 에이전트 순서 셔플 후 각자 행동 선택·적용.
 * 행동/파산 시 콜백 호출. (Tick·EventBus 연동용)
 */
export function runOneStep(
  population: EconomyAgent[],
  engine: AetheriusEngine,
  rng: PRNG,
  nutrientPool: NutrientPool,
  callbacks?: {
    onAction?(entityId: string, actionKind: string): void;
    onDefault?(entityId: string, rehabCount: number): void;
  }
): RunOneStepResult {
  const result: RunOneStepResult = { actions: [], defaults: [] };
  const map = new Map<string, EconomyAgent>();
  for (const a of population) map.set(a.id, a);
  const get = (id: string): EconomyAgent | undefined => map.get(id);

  refillNutrientPool(nutrientPool);
  const order = [...population].sort(() => rng.nextFloat01() - 0.5);

  for (const agent of order) {
    const rehabBefore = agent.economant.rehabCount;
    const action = selectAction(agent, population, rng, nutrientPool);
    const e = agent.economant;

    switch (action.kind) {
        case 'PHOTOSYNTHESIS': {
          const next = engine.photosynthesis(e);
          agent.economant = next;
          break;
        }
        case 'PROCESS_NUTRIENT': {
          const next = engine.processNutrient(e, action.polyIndex);
          agent.economant = next;
          break;
        }
        case 'COMPETE_NUTRIENT': {
          const res = engine.takeNutrientFromPool(e, nutrientPool, 0.2);
          agent.economant = res.subject;
          nutrientPool.p = res.pool.p;
          break;
        }
        case 'MINE': {
          const next = engine.mine(e);
          agent.economant = next;
          break;
        }
        case 'CRAFT': {
          const area = agent.genome.craftArea;
          const next = engine.craft(e, area, 0.5);
          agent.economant = next;
          break;
        }
        case 'CONSUME': {
          const next = engine.consume(e, action.polyIndex);
          agent.economant = next;
          break;
        }
        case 'TRADE_BUY': {
          const sellerAgent = get(action.sellerId);
          if (!sellerAgent) break;
          const res = engine.transferPoly(
            sellerAgent.economant,
            e,
            action.sellerPolyIndex,
            action.price,
            undefined
          );
          if (res.transferredPoly) {
            agent.economant = res.buyer;
            sellerAgent.economant = res.seller;
          }
          break;
        }
        case 'TRADE_SELL': {
          const buyerAgent = get(action.buyerId);
          if (!buyerAgent) break;
          const res = engine.transferPoly(
            e,
            buyerAgent.economant,
            action.polyIndex,
            action.price,
            undefined
          );
          if (res.transferredPoly) {
            agent.economant = res.seller;
            buyerAgent.economant = res.buyer;
          }
          break;
        }
        case 'WITNESS': {
          const buyerAgent = get(action.buyerId);
          const sellerAgent = get(action.sellerId);
          if (!buyerAgent || !sellerAgent || sellerAgent.economant.p.length === 0) break;
          const res = engine.transferPoly(
            sellerAgent.economant,
            buyerAgent.economant,
            0,
            action.price,
            e,
            0.1
          );
          if (res.transferredPoly && res.witness != null) {
            agent.economant = res.witness;
            buyerAgent.economant = res.buyer;
            sellerAgent.economant = res.seller;
          }
          break;
        }
        case 'IDLE':
          break;
      }

    if (action.kind !== 'IDLE') {
      result.actions.push({ entityId: agent.id, actionKind: action.kind });
      callbacks?.onAction?.(agent.id, action.kind);
    }
    if (agent.economant.rehabCount > rehabBefore) {
      result.defaults.push({
        entityId: agent.id,
        rehabCount: agent.economant.rehabCount,
      });
      callbacks?.onDefault?.(agent.id, agent.economant.rehabCount);
    }
  }

  return result;
}

/**
 * 한 세대 시뮬레이션: runOneStep을 stepsPerGeneration번 호출.
 */
function stepGeneration(
  population: EconomyAgent[],
  engine: AetheriusEngine,
  rng: PRNG,
  nutrientPool: NutrientPool
): void {
  for (let step = 0; step < DEFAULT_CONFIG.stepsPerGeneration; step++) {
    runOneStep(population, engine, rng, nutrientPool);
  }
}

/**
 * 적합도 기준 정렬 후 상위 elite + 나머지 자손(교차+변이)으로 다음 세대 구성.
 */
export function nextGeneration(
  population: EconomyAgent[],
  config: EconomyEvolutionConfig,
  rng: PRNG
): EconomyAgent[] {
  const withFitness = population.map((a) => ({ agent: a, f: fitness(a.economant) }));
  withFitness.sort((a, b) => b.f - a.f);

  const next: EconomyAgent[] = [];
  const eliteCount = Math.min(config.eliteCount, population.length);

  for (let i = 0; i < eliteCount; i++) {
    const { agent } = withFitness[i];
    const econ = createEconomant(agent.id, agent.economant.speciesId);
    econ.e.balance = INITIAL_E_BALANCE;
    next.push({ id: agent.id, economant: econ, genome: { ...agent.genome } });
  }

  const totalF = withFitness.reduce((s, x) => s + x.f, 0) || 1;
  const pickParent = (): EconomyAgent => {
    let r = rng.nextFloat01() * totalF;
    for (const { agent, f } of withFitness) {
      r -= f;
      if (r <= 0) return agent;
    }
    return withFitness[withFitness.length - 1].agent;
  };

  while (next.length < config.populationSize) {
    const parentA = pickParent();
    const parentB = pickParent();
    const childGenome = mutate(
      crossover(parentA.genome, parentB.genome, rng),
      rng
    );
    const childId = `eco-${next.length}-g${childGenome.generation}`;
    const childEcon = createEconomant(childId, parentA.economant.speciesId);
    childEcon.e.balance = INITIAL_E_BALANCE;
    next.push({ id: childId, economant: childEcon, genome: childGenome });
  }

  return next;
}

/**
 * 초기 집단 생성.
 */
/** 초기 E 잔액 (거래가 일어나도록 소량 부여). */
const INITIAL_E_BALANCE = 1.0;

export function createPopulation(
  size: number,
  baseGenome: EconomyGenome | undefined,
  rng: PRNG
): EconomyAgent[] {
  const agents: EconomyAgent[] = [];
  const genome = baseGenome ?? createEconomyGenome();
  for (let i = 0; i < size; i++) {
    const id = `eco-${i}`;
    const economant = createEconomant(id, 'default');
    economant.e.balance = INITIAL_E_BALANCE;
    agents.push({
      id,
      economant,
      genome: { ...genome, weights: { ...genome.weights } },
    });
  }
  return agents;
}

export class EconomyEvolution {
  private config: EconomyEvolutionConfig;
  private rng: PRNG;
  private engine: AetheriusEngine;
  private population: EconomyAgent[];
  private generation: number = 0;
  /** 직전 tick에서 시뮬레이션한 세대의 적합도 (교체 전). */
  private lastStats: { meanFitness: number; maxFitness: number } = { meanFitness: 0, maxFitness: 0 };

  constructor(config: Partial<EconomyEvolutionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = new PRNG(this.config.seed);
    this.engine = new AetheriusEngine();
    this.population = createPopulation(
      this.config.populationSize,
      undefined,
      this.rng
    );
  }

  /** 한 세대 진행: step → 평가(기록) → 선택·교차·변이 → 다음 세대. */
  tick(): void {
    const nutrientPool: NutrientPool = { p: [] };
    stepGeneration(this.population, this.engine, this.rng, nutrientPool);
    this.lastStats = this.computeStats(this.population);
    this.population = nextGeneration(this.population, this.config, this.rng);
    this.generation += 1;
  }

  private computeStats(pop: EconomyAgent[]): { meanFitness: number; maxFitness: number } {
    if (pop.length === 0) return { meanFitness: 0, maxFitness: 0 };
    const scores = pop.map((a) => fitness(a.economant));
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      meanFitness: sum / scores.length,
      maxFitness: Math.max(...scores),
    };
  }

  /** 현재 집단 (참조만 반환, 내부 상태 변경 가능). */
  getPopulation(): EconomyAgent[] {
    return this.population;
  }

  /** 현재 세대 번호. */
  getGeneration(): number {
    return this.generation;
  }

  /** 직전 tick에서 시뮬레이션한 세대의 평균·최대 적합도. (로그용) */
  getLastStats(): { meanFitness: number; maxFitness: number } {
    return this.lastStats;
  }

  /** 현재 집단의 평균·최대 적합도 (대부분 새로 생성된 세대이므로 3 근처). */
  getStats(): { meanFitness: number; maxFitness: number } {
    return this.computeStats(this.population);
  }
}
