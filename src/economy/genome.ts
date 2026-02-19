/**
 * 유전체: 생명이 더 많은 V, E, P를 확보하도록 진화하는 행동 가중치.
 * 목표 = 생존 + V·E·P 극대화.
 */

import type { Economant, Poly } from './types.js';

/** 행동 종류. 동물=거래, 식물=광합성·가공·영양분 경쟁. */
export type EconomyActionKind =
  | 'MINE'
  | 'CRAFT'
  | 'CONSUME'
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'WITNESS'
  | 'IDLE'
  | 'PHOTOSYNTHESIS'
  | 'PROCESS_NUTRIENT'
  | 'COMPETE_NUTRIENT';

/** Economy 유전체: 행동 가중치 + 가공 시 area 파라미터. */
export interface EconomyGenome {
  /** 행동별 선호도. 종별로 사용하는 키만 사용(식물은 거래 없음). */
  weights: Record<string, number>;
  /** 가공(CRAFT) / 영양분 가공 시 area (0.5 ~ 2.0). */
  craftArea: number;
  /** 변이율 (0~1). 자손 유전체에 적용. */
  mutationRate: number;
  /** 세대 번호. */
  generation: number;
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  MINE: 0.8,
  CRAFT: 1.2,
  CONSUME: 1,
  TRADE_BUY: 0.6,
  TRADE_SELL: 0.6,
  WITNESS: 0.4,
  IDLE: 0.1,
  PHOTOSYNTHESIS: 0,
  PROCESS_NUTRIENT: 0,
  COMPETE_NUTRIENT: 0,
};

const PLANT_WEIGHTS: Record<string, number> = {
  PHOTOSYNTHESIS: 1.2,
  PROCESS_NUTRIENT: 1,
  COMPETE_NUTRIENT: 0.8,
  CONSUME: 1,
  IDLE: 0.1,
  MINE: 0,
  CRAFT: 0,
  TRADE_BUY: 0,
  TRADE_SELL: 0,
  WITNESS: 0,
};

export function createEconomyGenome(
  overrides?: Partial<EconomyGenome>,
  speciesId?: string
): EconomyGenome {
  const isPlant = speciesId === 'plant';
  return {
    weights: { ...(isPlant ? PLANT_WEIGHTS : DEFAULT_WEIGHTS) },
    craftArea: 1.0,
    mutationRate: 0.08,
    generation: 0,
    ...overrides,
  };
}

/** G(P) = 1 + (Area × ρ). Poly 하나의 Vertic 회복 가치. */
export function polyValue(p: Poly): number {
  return 1 + p.area * p.energyDensity;
}

/**
 * 적합도: V + E + Σ G(P). 더 많은 V, E, P를 가질수록 높음.
 * 생존·축적 목표와 일치.
 */
export function fitness(e: Economant): number {
  const v = e.v.current;
  const edge = e.e.balance + e.e.reputation * 0.5; // reputation도 신용으로 반영
  const pSum = e.p.reduce((acc, poly) => acc + polyValue(poly), 0);
  return v + edge + pSum;
}

/**
 * 변이: 가중치·craftArea에 작은 노이즈. 결정론적 재현을 위해 rng 주입.
 */
export function mutate(
  genome: EconomyGenome,
  rng: { nextFloat01(): number }
): EconomyGenome {
  const next = (x: number, rate: number): number => {
    if (rng.nextFloat01() > rate) return x;
    const delta = (rng.nextFloat01() - 0.5) * 0.4;
    return Math.max(0.01, x + delta);
  };
  const newWeights = { ...genome.weights };
  for (const k of Object.keys(newWeights)) {
    newWeights[k] = next(newWeights[k], genome.mutationRate);
  }
  const craftArea = Math.max(0.5, Math.min(2, genome.craftArea + (rng.nextFloat01() - 0.5) * 0.2));
  return {
    weights: newWeights,
    craftArea,
    mutationRate: genome.mutationRate,
    generation: genome.generation,
  };
}

/**
 * 교차: 두 유전체에서 각 좌표를 부모 중 하나에서 선택. generation은 max+1.
 */
export function crossover(
  a: EconomyGenome,
  b: EconomyGenome,
  rng: { nextFloat01(): number }
): EconomyGenome {
  const keys = new Set([...Object.keys(a.weights), ...Object.keys(b.weights)]);
  const weights: Record<string, number> = {};
  for (const k of keys) {
    weights[k] = rng.nextFloat01() > 0.5 ? (b.weights[k] ?? a.weights[k]) : a.weights[k];
  }
  const craftArea = rng.nextFloat01() > 0.5 ? a.craftArea : b.craftArea;
  const mutationRate = rng.nextFloat01() > 0.5 ? a.mutationRate : b.mutationRate;
  return {
    weights,
    craftArea,
    mutationRate,
    generation: Math.max(a.generation, b.generation) + 1,
  };
}
