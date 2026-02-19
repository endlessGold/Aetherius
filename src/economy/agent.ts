/**
 * 유전체 기반 행동 선택: 현재 상태(V,E,P)와 가능한 행동만 고려하여
 * genome 가중치로 확률적 행동을 선택. 목표 = 더 많은 V, E, P.
 */

import type { Economant, NutrientPool } from './types.js';
import type { EconomyGenome, EconomyActionKind } from './genome.js';
import { polyValue } from './genome.js';
import { getSpeciesRole } from './concepts.js';

function w(genome: EconomyGenome, k: string): number {
  return genome.weights[k] ?? 0;
}

export interface EconomyAgent {
  economant: Economant;
  genome: EconomyGenome;
  id: string;
}

export type EconomyAction =
  | { kind: 'MINE' }
  | { kind: 'CRAFT' }
  | { kind: 'CONSUME'; polyIndex: number }
  | { kind: 'TRADE_BUY'; sellerId: string; sellerPolyIndex: number; price: number }
  | { kind: 'TRADE_SELL'; buyerId: string; polyIndex: number; price: number }
  | { kind: 'WITNESS'; buyerId: string; sellerId: string; price: number }
  | { kind: 'PHOTOSYNTHESIS' }
  | { kind: 'PROCESS_NUTRIENT'; polyIndex: number }
  | { kind: 'COMPETE_NUTRIENT' }
  | { kind: 'IDLE' };

/**
 * 주어진 에이전트가 현재 수행 가능한 행동만 필터링한 뒤,
 * genome weights로 확률적 선택. (가능한 행동이 없으면 IDLE)
 */
export function selectAction(
  agent: EconomyAgent,
  population: EconomyAgent[],
  rng: { nextFloat01(): number },
  pool?: NutrientPool
): EconomyAction {
  const e = agent.economant;
  if (getSpeciesRole(e.speciesId) === 'plant') {
    return selectPlantAction(agent, pool, rng);
  }

  const others = population.filter((a) => a.id !== agent.id);
  const possible: { kind: EconomyActionKind; weight: number; payload?: unknown }[] = [];

  if (e.v.current >= 1) {
    possible.push({ kind: 'MINE', weight: w(agent.genome, 'MINE') });
    possible.push({ kind: 'CRAFT', weight: w(agent.genome, 'CRAFT') });
  }
  if (e.v.current >= 1 && e.p.length > 0) {
    const bestIdx = e.p.reduce((best, _, i) =>
      polyValue(e.p[i]) > polyValue(e.p[best]) ? i : best
    , 0);
    possible.push({ kind: 'CONSUME', weight: w(agent.genome, 'CONSUME'), payload: bestIdx });
  }

  // TRADE_BUY: 다른 에이전트 중 p.length>0 인 seller 선택 가능
  if (e.v.current >= 1 && e.e.balance >= 1) {
    const sellers = others.filter((a) => a.economant.p.length > 0 && a.economant.v.current >= 1);
    if (sellers.length > 0) {
      const seller = sellers[rng.nextFloat01() * sellers.length | 0];
      const price = 0.5 + rng.nextFloat01() * 0.5; // 0.5~1.0
      const fee = price * 0.5; // no witness
      if (e.e.balance >= price + fee) {
        possible.push({
          kind: 'TRADE_BUY',
          weight: w(agent.genome, 'TRADE_BUY'),
          payload: { sellerId: seller.id, sellerPolyIndex: 0, price },
        });
      }
    }
  }

  // TRADE_SELL: 다른 에이전트 중 balance 있는 buyer
  if (e.v.current >= 1 && e.p.length > 0) {
    const buyers = others.filter((a) => a.economant.e.balance >= 1 && a.economant.v.current >= 1);
    if (buyers.length > 0) {
      const buyer = buyers[rng.nextFloat01() * buyers.length | 0];
      const price = 0.5 + rng.nextFloat01() * 0.5;
      possible.push({
        kind: 'TRADE_SELL',
        weight: w(agent.genome, 'TRADE_SELL'),
        payload: { buyerId: buyer.id, polyIndex: 0, price },
      });
    }
  }

  // WITNESS: 두 다른 에이전트가 거래할 때 관측 가능 (간소화: buyer/seller 조합)
  if (e.v.current >= 1 && others.length >= 2) {
    const withBalance = others.filter((a) => a.economant.e.balance >= 0.5 && a.economant.v.current >= 1);
    const withPoly = others.filter((a) => a.economant.p.length > 0 && a.economant.v.current >= 1);
    if (withBalance.length > 0 && withPoly.length > 0) {
      const buyer = withBalance[rng.nextFloat01() * withBalance.length | 0];
      const seller = withPoly.find((a) => a.id !== buyer.id) ?? withPoly[0];
      if (seller && seller.id !== buyer.id) {
        possible.push({
          kind: 'WITNESS',
          weight: w(agent.genome, 'WITNESS'),
          payload: { buyerId: buyer.id, sellerId: seller.id, price: 0.5 },
        });
      }
    }
  }

  possible.push({ kind: 'IDLE', weight: w(agent.genome, 'IDLE') });

  const total = possible.reduce((s, x) => s + x.weight, 0);
  if (total <= 0) return { kind: 'IDLE' };

  let r = rng.nextFloat01() * total;
  for (const x of possible) {
    r -= x.weight;
    if (r <= 0) {
      switch (x.kind) {
        case 'CONSUME':
          return { kind: 'CONSUME', polyIndex: x.payload as number };
        case 'TRADE_BUY': {
          const p = x.payload as { sellerId: string; sellerPolyIndex: number; price: number };
          return { kind: 'TRADE_BUY', sellerId: p.sellerId, sellerPolyIndex: p.sellerPolyIndex, price: p.price };
        }
        case 'TRADE_SELL': {
          const p = x.payload as { buyerId: string; polyIndex: number; price: number };
          return { kind: 'TRADE_SELL', buyerId: p.buyerId, polyIndex: p.polyIndex, price: p.price };
        }
        case 'WITNESS': {
          const p = x.payload as { buyerId: string; sellerId: string; price: number };
          return { kind: 'WITNESS', buyerId: p.buyerId, sellerId: p.sellerId, price: p.price };
        }
        default:
          return { kind: x.kind } as EconomyAction;
      }
    }
  }
  return { kind: 'IDLE' };
}

/** 식물 전용: 광합성·가공·영양분 빼앗기·섭취·IDLE. 거래 없음. */
function selectPlantAction(
  agent: EconomyAgent,
  pool: NutrientPool | undefined,
  rng: { nextFloat01(): number }
): EconomyAction {
  const e = agent.economant;
  const possible: { kind: EconomyActionKind; weight: number; payload?: number }[] = [];

  if (e.v.current >= 1) {
    possible.push({ kind: 'PHOTOSYNTHESIS', weight: w(agent.genome, 'PHOTOSYNTHESIS') });
  }
  if (e.v.current >= 1 && e.p.length > 0) {
    const bestIdx = e.p.reduce((best, _, i) =>
      polyValue(e.p[i]) > polyValue(e.p[best]) ? i : best
    , 0);
    possible.push({ kind: 'PROCESS_NUTRIENT', weight: w(agent.genome, 'PROCESS_NUTRIENT'), payload: bestIdx });
  }
  if (e.v.current >= 1 && pool && pool.p.length > 0) {
    possible.push({ kind: 'COMPETE_NUTRIENT', weight: w(agent.genome, 'COMPETE_NUTRIENT') });
  }
  if (e.v.current >= 1 && e.p.length > 0) {
    const bestIdx = e.p.reduce((best, _, i) =>
      polyValue(e.p[i]) > polyValue(e.p[best]) ? i : best
    , 0);
    possible.push({ kind: 'CONSUME', weight: w(agent.genome, 'CONSUME'), payload: bestIdx });
  }
  possible.push({ kind: 'IDLE', weight: w(agent.genome, 'IDLE') });

  const total = possible.reduce((s, x) => s + x.weight, 0);
  if (total <= 0) return { kind: 'IDLE' };

  let r = rng.nextFloat01() * total;
  for (const x of possible) {
    r -= x.weight;
    if (r <= 0) {
      if (x.kind === 'PROCESS_NUTRIENT' && x.payload !== undefined)
        return { kind: 'PROCESS_NUTRIENT', polyIndex: x.payload };
      if (x.kind === 'CONSUME' && x.payload !== undefined)
        return { kind: 'CONSUME', polyIndex: x.payload };
      return { kind: x.kind } as EconomyAction;
    }
  }
  return { kind: 'IDLE' };
}
