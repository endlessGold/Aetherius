/**
 * EcologicalEngine — 생태적 존재를 위한 기하학적 역학
 *
 * 채굴→광합성/흡수, 가공→영양분 합성, 거래→영역 확장·영양분 찬탈.
 * Environmental Witness: 환경 엔터티가 보증인 역할 가능.
 * 환경(날씨 등)이 Vertic 소모량에 배율 적용 가능.
 * @see docs/ECONOMY_BIO_SPEC.md
 */

import type { Economant, BioEntity, Poly } from './types.js';
import { AetheriusEngine } from './engine.js';
import { WITNESS_FEE_RATIO_DEFAULT } from './engine.js';
import type { EnvironmentState } from './environment.js';
import { DEFAULT_ENVIRONMENT, applyVCostMultiplier } from './environment.js';

export class EcologicalEngine extends AetheriusEngine {
  private env: EnvironmentState;

  constructor(environment?: EnvironmentState) {
    super();
    this.env = environment ?? DEFAULT_ENVIRONMENT;
  }

  /** 환경 설정. 가뭄 등 시 vCostMultiplier > 1. */
  setEnvironment(env: EnvironmentState): void {
    this.env = env;
  }

  /**
   * [생태] Vertic 소모 시 환경 배율 적용. 1V 기준 행동이 가뭄 시 2V 등으로 증가 가능.
   */
  override spendVertic(subject: Economant, amount: number = 1): Economant {
    const effective = applyVCostMultiplier(amount, this.env);
    return super.spendVertic(subject, effective);
  }

  /**
   * 기회 소모 (생태적: 생물학적 시간·대사).
   * 모든 행동은 이 경유로 V를 소비한다. (Existence is Action)
   */
  spendOpportunity(entity: BioEntity, amount: number = 1): BioEntity {
    return this.spendVertic(entity, amount) as BioEntity;
  }

  /**
   * 광합성/흡수 (채굴에 해당).
   * 태양광·수분 흡수 → 기회(V) 소모, 영양분(Poly) 원료 확보.
   */
  photosynthesis(entity: BioEntity): BioEntity {
    return super.photosynthesis(entity as Economant) as BioEntity;
  }

  /**
   * 영양분(유기물) 합성 (가공에 해당).
   * 원료를 포도당·열매 등 고정 형태(Poly)로 결정화. complexity = area.
   */
  synthesizeNutrient(entity: BioEntity, complexity: number): BioEntity {
    return this.craft(entity as Economant, complexity, 0.5) as BioEntity;
  }

  /**
   * 영양분 찬탈/거래 (뿌리 확장·영역 침범).
   * 공격자(attacker)가 방어자(defender)의 Poly를 가져감.
   * 환경/미생물(environmentWitness)이 보증인 역할 → 수수료(에너지) 소모.
   */
  competeForResource(
    attacker: BioEntity,
    defender: BioEntity,
    polyIndex: number,
    resourceAmount: number,
    environmentWitness: BioEntity
  ): { attacker: BioEntity; defender: BioEntity; witness: BioEntity; transferred: Poly | null } {
    const res = this.transferPoly(
      defender as Economant,
      attacker as Economant,
      polyIndex,
      resourceAmount,
      environmentWitness as Economant,
      WITNESS_FEE_RATIO_DEFAULT
    );
    return {
      attacker: res.buyer as BioEntity,
      defender: res.seller as BioEntity,
      witness: (res.witness ?? environmentWitness) as BioEntity,
      transferred: res.transferredPoly,
    };
  }
}
