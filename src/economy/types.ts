/**
 * Aetherius Geometric Life Conditions
 * [Mathematical Economic Specification]
 *
 * 상태 벡터: S_{i,t} = {V_{i,t}, E_{i,t}, P_{i,t}}
 * - V: 실행 기회 수량 (이산), V ∈ {0,1,2,3}. 발급/회생 시 V_new = 3. 소멸: 행동 A 시 V_{t+1} = V_t - 1.
 * - E: 유동 신용 잔액 (실수), E ≥ 0. 유통: 제로섬 전송 또는 시스템 수수료 소각.
 * - P: 결정화 자산. 가치 G(P) = 1 + (Area(P) × ρ). 속성 {ID, Area, OwnerID, VerifiedBy}.
 *
 * 모든 생명의 목표: 생존 + 더 많은 V, E, P. Vertic=0 → 리셋·기초수급 (종별 추가 패널티 확장).
 */

/** [점] V (Vertic): 실행 기회 수량. 이산 정수, V ∈ {0,1,2,3}. current가 0이면 즉시 파산·기초수급. */
export interface Vertic {
  current: number; // 정수 0..3
  max: number;
}

/** [선] E (Edges): 유동 신용 잔액. 실수형, E ≥ 0. 시스템 내 지불 수단·관측 지표. */
export interface Edges {
  balance: number;
  reputation: number;
}

/** [면] P (Poly): 결정화 자산. 기회의 저장체·복구 도구. G(P) = 1 + (Area × ρ). */
export interface Poly {
  id: string;
  area: number;
  /** ρ 에너지 밀도 계수. 기본 0.5 */
  energyDensity: number;
  /** OwnerID. 생성자. */
  creatorId: string;
  /** 보증·검증자 ID (거래 시 Witness 등). */
  verifiedBy?: string;
}

/** 주변 영양분 풀 (식물이 "에지스를 주고 빼앗는" 대상). 공유 자원. */
export interface NutrientPool {
  p: Poly[];
}

/** 생명 엔티티 본체. 점(v)·선(e)·면(p)으로 상태가 정의됨. 종별 추가 패널티는 speciesId로 구분. */
export interface Economant {
  id: string;
  /** 종 식별자 (예: 'OakTree', 'WildFlower', 'plant', 'default'). Vertic=0 시 추가 패널티 구분. */
  speciesId: string;
  v: Vertic;
  e: Edges;
  p: Poly[];
  status: 'ACTIVE' | 'BANKRUPT';
  /** Vertic=0 리셋 후 기초수급 받은 횟수 (역사 기록) */
  rehabCount: number;
}

/** 생태적 존재. Economant와 동일 구조. speciesId = 생물 종(예: OakTree, WildFlower). */
export type BioEntity = Economant;

export const GENESIS_V = 3;
const V_MIN = 0;
const V_MAX = 3;

export function createVertic(current: number = GENESIS_V): Vertic {
  const c = Math.floor(Number(current));
  const clamped = Math.max(V_MIN, Math.min(V_MAX, c));
  return { current: clamped, max: GENESIS_V };
}

export function createEdges(): Edges {
  return { balance: 0, reputation: 0 };
}

export function createEconomant(id: string, speciesId: string = 'default'): Economant {
  return {
    id,
    speciesId,
    v: createVertic(),
    e: createEdges(),
    p: [],
    status: 'ACTIVE',
    rehabCount: 0,
  };
}
