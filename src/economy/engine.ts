/**
 * Aetherius Geometric Life Engine
 * [Mathematical Economic Specification]
 *
 * - State Consistency: 모든 상태 변화는 spendVertic() 경유. 내부에 if (v<=0) handleDefault() 원자적 구현.
 * - Transaction: transferPoly는 Witness 선택; 없으면 SYSTEM_BURNING_RATE(β=0.5) 적용. F = k×α(보증) 또는 k×β(무보증).
 * - 정산: E_B -= (k+F), E_S += k, E_W += F (보증인 없으면 F 소각).
 * - Poly 활성화: G(P)=1+(Area×ρ). Recovery는 소수점 첫째 자리, Vertic.current는 정수 올림. V≥1일 때만 복구 가능.
 * - 파산 시 Edges·Poly 소유권 시스템 이전(삭제).
 */

import type { Economant, Poly } from './types.js';
import { GENESIS_V, createVertic, createEdges } from './types.js';
import { nextPolyId } from './idGen.js';

/** Vertic=0 리셋 후 적용할 종별 추가 패널티. (subject: 리셋 전, afterReset: 기초수급 직후) */
export type BankruptcyPenaltyFn = (subject: Economant, afterReset: Economant) => Economant;

/** β 시스템 벌금율 (보증인 없을 때). 수수료 소각. */
export const SYSTEM_BURNING_RATE = 0.5;
/** α 시장 수수료율 (보증인 있을 때, 통상 0.1) */
export const WITNESS_FEE_RATIO_DEFAULT = 0.1;

/** @deprecated 동일 값이면 SYSTEM_BURNING_RATE 사용 권장 */
export const SYSTEM_FEE_RATIO = SYSTEM_BURNING_RATE;

export class AetheriusEngine {
  private readonly genesisV = GENESIS_V;
  private bankruptcyPenalty: BankruptcyPenaltyFn | null = null;

  /** 종별 추가 패널티 등록. Vertic=0 리셋·기초수급 후 호출됨. */
  setBankruptcyPenalty(fn: BankruptcyPenaltyFn | null): void {
    this.bankruptcyPenalty = fn;
  }

  /**
   * [파산·복구] Default Logic. Asset Seizure: E←0, P←∅. State Reset: V←3, rehabCount+1.
   * Data Ownership: 파산 시 모든 Edges·Poly 소유권 시스템 이전(삭제).
   */
  handleDefault(subject: Economant): Economant {
    const afterReset: Economant = {
      ...subject,
      v: createVertic(this.genesisV),
      e: createEdges(),
      p: [],
      status: 'ACTIVE',
      rehabCount: subject.rehabCount + 1,
    };
    if (this.bankruptcyPenalty != null) {
      return this.bankruptcyPenalty(subject, afterReset);
    }
    return afterReset;
  }

  /** @deprecated handleDefault 사용 권장 */
  processBankruptcy(subject: Economant): Economant {
    return this.handleDefault(subject);
  }

  /**
   * [State Consistency] 모든 Economant 상태 변화의 단일 진입점.
   * V 소모 후 v <= 0 이면 handleDefault() 원자적 실행.
   */
  spendVertic(subject: Economant, amount: number = 1): Economant {
    const nextValue = Math.floor(subject.v.current) - amount;
    if (nextValue <= 0) {
      return this.handleDefault(subject);
    }
    return {
      ...subject,
      v: { ...subject.v, current: Math.min(3, nextValue) },
      status: 'ACTIVE',
    };
  }

  /** @deprecated spendVertic 사용 권장 */
  useVertic(subject: Economant, amount: number = 1): Economant {
    return this.spendVertic(subject, amount);
  }

  /** 핸들 1: 채굴 (고정 비용 1 Vertic) */
  mine(subject: Economant): Economant {
    return this.spendVertic(subject, 1);
  }

  /** 핸들 2: 가공 — Poly 연성. 발급: Area = f(Compute, Complexity), Economant가 기회 소모로 직접 생성. */
  craft(subject: Economant, area: number, energyDensity: number = 0.5): Economant {
    const afterCost = this.spendVertic(subject, 1);
    const newPoly: Poly = {
      id: nextPolyId(subject.id),
      area,
      energyDensity,
      creatorId: subject.id,
    };
    return {
      ...afterCost,
      p: [...afterCost.p, newPoly],
    };
  }

  /**
   * P 구매 거래: B가 S에게 가액 k로 P 구매.
   * 수수료 F: 보증인 W 있음 F=k×α, 없음 F=k×β(소각).
   * 정산: E_B -= (k+F), E_S += k, E_W += F(있을 때). 참가자 각 1V 소모.
   */
  trade(
    buyer: Economant,
    seller: Economant,
    price: number,
    witness?: Economant,
    witnessFeeRatio: number = WITNESS_FEE_RATIO_DEFAULT
  ): { buyer: Economant; seller: Economant; witness?: Economant } {
    let b = this.spendVertic(buyer, 1);
    let s = this.spendVertic(seller, 1);

    const feeRatio = witness != null ? witnessFeeRatio : SYSTEM_BURNING_RATE;
    const fee = price * feeRatio;

    let w: Economant | undefined;
    if (witness != null) {
      w = this.spendVertic(witness, 1);
      w = {
        ...w,
        e: {
          balance: w.e.balance + fee,
          reputation: w.e.reputation + 1,
        },
      };
    }

    b = {
      ...b,
      e: { ...b.e, balance: Math.max(0, b.e.balance - (price + fee)) },
    };
    s = {
      ...s,
      e: { ...s.e, balance: s.e.balance + price },
    };

    const out: { buyer: Economant; seller: Economant; witness?: Economant } = { buyer: b, seller: s };
    if (w != null) out.witness = w;
    return out;
  }

  /**
   * transferPoly: B가 S에게서 Poly 1개를 가액 k로 구매. Witness 없으면 SYSTEM_BURNING_RATE 적용.
   * 선결 조건: buyer.e >= k+F, buyer.v≥1, seller.v≥1, seller.p[polyIndex] 존재.
   */
  transferPoly(
    seller: Economant,
    buyer: Economant,
    polyIndex: number,
    price: number,
    witness?: Economant,
    witnessFeeRatio: number = WITNESS_FEE_RATIO_DEFAULT
  ): { buyer: Economant; seller: Economant; witness?: Economant; transferredPoly: Poly | null } {
    const poly = seller.p[polyIndex];
    if (poly == null) {
      return { buyer, seller, transferredPoly: null };
    }
    const fee = price * (witness != null ? witnessFeeRatio : SYSTEM_BURNING_RATE);
    if (buyer.e.balance < price + fee || buyer.v.current < 1 || seller.v.current < 1) {
      return { buyer, seller, transferredPoly: null };
    }
    if (witness != null && witness.v.current < 1) {
      return { buyer, seller, transferredPoly: null };
    }

    const sellerP = seller.p.slice(0, polyIndex).concat(seller.p.slice(polyIndex + 1));
    const transferred: Poly = { ...poly, verifiedBy: witness?.id };
    const buyerP = [...buyer.p, transferred];
    const newSeller: Economant = { ...seller, p: sellerP };
    const newBuyer: Economant = { ...buyer, p: buyerP };

    const result = this.trade(newBuyer, newSeller, price, witness, witnessFeeRatio);
    return { ...result, transferredPoly: transferred };
  }

  /**
   * [식물] 광합성: Vertic -1, 영양분(소량 Poly) 1개 생성. 채굴에 해당.
   */
  photosynthesis(subject: Economant): Economant {
    const afterCost = this.spendVertic(subject, 1);
    const nutrient: Poly = {
      id: nextPolyId(subject.id),
      area: 0.5,
      energyDensity: 0.5,
      creatorId: subject.id,
    };
    return { ...afterCost, p: [...afterCost.p, nutrient] };
  }

  /**
   * [식물] 가공: Vertic -1, 영양분 Poly 1개를 "영향"으로 가공(질 향상).
   * 제거한 Poly의 area×1.2, 동일 density로 새 Poly 추가.
   */
  processNutrient(subject: Economant, polyIndex: number): Economant {
    const target = subject.p[polyIndex];
    if (target == null || subject.v.current < 1) return subject;
    const afterCost = this.spendVertic(subject, 1);
    const newP = afterCost.p.slice(0, polyIndex).concat(afterCost.p.slice(polyIndex + 1));
    const processed: Poly = {
      id: nextPolyId(subject.id),
      area: Math.round((target.area * 1.2) * 10) / 10,
      energyDensity: target.energyDensity,
      creatorId: subject.id,
    };
    return { ...afterCost, p: [...newP, processed] };
  }

  /**
   * [식물] 영양분 빼앗기: Vertic -1, 에지스를 주고(소모) 주변 풀에서 Poly 1개 획득. 거래로 은유.
   * E 소모량은 선택(0 가능). 풀에 P가 있어야 함.
   */
  takeNutrientFromPool(subject: Economant, pool: { p: Poly[] }, edgeCost: number = 0.2): { subject: Economant; pool: { p: Poly[] } } {
    if (subject.v.current < 1 || pool.p.length === 0) return { subject, pool };
    const afterCost = this.spendVertic(subject, 1);
    const pay = Math.min(edgeCost, afterCost.e.balance);
    const taken = pool.p[pool.p.length - 1];
    const newPool = { p: pool.p.slice(0, -1) };
    return {
      subject: {
        ...afterCost,
        e: { ...afterCost.e, balance: Math.max(0, afterCost.e.balance - pay) },
        p: [...afterCost.p, { ...taken }],
      },
      pool: newPool,
    };
  }

  /**
   * 핸들 4: 기회 복구 (Opportunity Recovery). P 활성화로 V 재충전.
   * G(P) = 1 + (Area × ρ). 결과 소수점 첫째 자리 유지, Vertic.current는 정수 올림. V≥1일 때만 복구 가능.
   */
  consume(subject: Economant, polyIndex: number): Economant {
    if (subject.v.current < 1) return subject;
    const target = subject.p[polyIndex];
    if (target == null) return subject;

    const recoveryRaw = 1 + target.area * target.energyDensity;
    const recovery = Math.round(recoveryRaw * 10) / 10;
    const nextV = Math.min(3, Math.ceil(subject.v.current + recovery));

    const newP = subject.p.slice(0, polyIndex).concat(subject.p.slice(polyIndex + 1));

    return {
      ...subject,
      v: { ...subject.v, current: nextV },
      p: newP,
    };
  }
}
