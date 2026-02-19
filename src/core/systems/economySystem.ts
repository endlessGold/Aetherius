/**
 * 기하학적 생존 역학(Economy)을 World.tick·EventBus에 연동하는 시스템.
 * 1틱당 1라운드(runOneStep) 실행 후 Economy.ActionApplied / Economy.DefaultOccurred 발행.
 * stepsPerGeneration 경계에서 nextGeneration 호출.
 */

import type { World } from '../world.js';
import { Economy } from '../events/eventTypes.js';
import {
  AetheriusEngine,
  createPopulation,
  nextGeneration,
  runOneStep,
  DEFAULT_EVOLUTION_CONFIG,
  type EconomyAgent,
  type NutrientPool,
  type EconomyEvolutionConfig,
} from '../../economy/index.js';
import { PRNG } from '../../ai/prng.js';

export interface EconomySystemConfig {
  enabled: boolean;
  stepsPerGeneration: number;
  populationSize: number;
  seed: number;
}

const DEFAULT_ECONOMY_SYSTEM_CONFIG: EconomySystemConfig = {
  enabled: false,
  stepsPerGeneration: DEFAULT_EVOLUTION_CONFIG.stepsPerGeneration,
  populationSize: DEFAULT_EVOLUTION_CONFIG.populationSize,
  seed: DEFAULT_EVOLUTION_CONFIG.seed,
};

export class EconomySystem {
  private config: EconomySystemConfig;
  private population: EconomyAgent[];
  private engine: AetheriusEngine;
  private nutrientPool: NutrientPool;
  private rng: PRNG;
  private stepIndex: number = 0;
  private generation: number = 0;

  constructor(partial: Partial<EconomySystemConfig> = {}) {
    this.config = { ...DEFAULT_ECONOMY_SYSTEM_CONFIG, ...partial };
    this.rng = new PRNG(this.config.seed);
    this.engine = new AetheriusEngine();
    this.nutrientPool = { p: [] };
    this.population = createPopulation(this.config.populationSize, undefined, this.rng);
  }

  tick(world: World): void {
    if (!this.config.enabled) return;

    const result = runOneStep(
      this.population,
      this.engine,
      this.rng,
      this.nutrientPool
    );

    const tickCount = world.tickCount;
    for (const { entityId, actionKind } of result.actions) {
      world.eventBus.publish(new Economy.ActionApplied(entityId, actionKind, tickCount, 'EconomySystem'));
    }
    for (const { entityId, rehabCount } of result.defaults) {
      world.eventBus.publish(new Economy.DefaultOccurred(entityId, rehabCount, 'EconomySystem'));
    }

    this.stepIndex += 1;
    if (this.stepIndex >= this.config.stepsPerGeneration) {
      const evolutionConfig: EconomyEvolutionConfig = {
        populationSize: this.config.populationSize,
        stepsPerGeneration: this.config.stepsPerGeneration,
        eliteCount: DEFAULT_EVOLUTION_CONFIG.eliteCount,
        seed: this.config.seed,
      };
      this.population = nextGeneration(this.population, evolutionConfig, this.rng);
      this.stepIndex = 0;
      this.generation += 1;
    }
  }

  getGeneration(): number {
    return this.generation;
  }

  getStepIndex(): number {
    return this.stepIndex;
  }
}
