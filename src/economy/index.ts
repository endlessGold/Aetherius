/**
 * Aetherius Geometric Life Conditions
 *
 * 화폐로 은유한, 모든 생명이 가져야 할 조건(점·선·면).
 * 목표: 생존 + 더 많은 Vertic, Edges, Poly.
 * Vertic=0 → 리셋·기초수급 (추가 패널티는 종별로 확장).
 * 유전 학습: EconomyEvolution으로 집단이 V·E·P 극대화 정책을 진화.
 */

export type { Vertic, Edges, Poly, Economant, NutrientPool } from './types.js';
export {
  GENESIS_V,
  createVertic,
  createEdges,
  createEconomant,
} from './types.js';
export { resetPolySequence, nextPolyId } from './idGen.js';
export type { BankruptcyPenaltyFn } from './engine.js';
export {
  AetheriusEngine,
  SYSTEM_BURNING_RATE,
  SYSTEM_FEE_RATIO,
  WITNESS_FEE_RATIO_DEFAULT,
} from './engine.js';

export type { EconomyGenome, EconomyActionKind } from './genome.js';
export {
  createEconomyGenome,
  fitness,
  mutate,
  crossover,
  polyValue,
} from './genome.js';
export type { EconomyAgent, EconomyAction } from './agent.js';
export { selectAction } from './agent.js';
export type { EconomyEvolutionConfig, RunOneStepResult } from './evolution.js';
export {
  EconomyEvolution,
  DEFAULT_EVOLUTION_CONFIG,
  runOneStep,
  refillNutrientPool,
  createPopulation,
  nextGeneration,
} from './evolution.js';
export type { SpeciesRole, PlantActionKind } from './concepts.js';
export { getSpeciesRole, PLANT_ACTIONS, DEFAULT_ACTIONS } from './concepts.js';
export type { BioEntity } from './types.js';
export { EcologicalEngine } from './ecologicalEngine.js';
export type { EnvironmentState } from './environment.js';
export { DEFAULT_ENVIRONMENT, applyVCostMultiplier } from './environment.js';
export type { RootNetwork } from './colony.js';
export { createRootNetwork, connect, areConnected, neighbours } from './colony.js';
