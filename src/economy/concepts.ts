/**
 * 종별 행동 컨셉: 같은 V/E/P 메커니즘을 생태에 맞게 해석.
 * 식물·나무는 거래하지 않음. 광합성·가공·영양분 경쟁으로 은유.
 */

/** 종 역할: 행동 세트와 의미가 다름. */
export type SpeciesRole = 'plant' | 'default';

/**
 * 식물(·나무) — 거래 없음
 * - 광합성: Vertic -1, "채굴"에 해당. 영양분(소량 Poly) 생성.
 * - 가공: Vertic -1, 보유 영양분을 "영향"으로 가공(질 향상).
 * - 영양분 빼앗기: Vertic -1, 에지스를 쓰고(낸다) 주변 영양분 풀에서 Poly 1개 획득. (거래로 은유 가능.)
 */
export const PLANT_ACTIONS = {
  /** 광합성: V-1, 영양분 Poly 1개 생성. */
  PHOTOSYNTHESIS: 'PHOTOSYNTHESIS',
  /** 가공: V-1, 영양분 → 영향(고품질 Poly). */
  PROCESS_NUTRIENT: 'PROCESS_NUTRIENT',
  /** 영양분 빼앗기: V-1, E 소모, 주변 풀에서 Poly 획득. */
  COMPETE_NUTRIENT: 'COMPETE_NUTRIENT',
  /** 섭취: Poly 소모로 V 회복. */
  CONSUME: 'CONSUME',
  IDLE: 'IDLE',
} as const;

export type PlantActionKind = keyof typeof PLANT_ACTIONS;

/**
 * 기본(동물·에이전트) — 시장 거래
 * - 채굴, 가공, 거래(매수/매도/보증), 섭취.
 */
export const DEFAULT_ACTIONS = {
  MINE: 'MINE',
  CRAFT: 'CRAFT',
  CONSUME: 'CONSUME',
  TRADE_BUY: 'TRADE_BUY',
  TRADE_SELL: 'TRADE_SELL',
  WITNESS: 'WITNESS',
  IDLE: 'IDLE',
} as const;

/** speciesId → 역할. */
export function getSpeciesRole(speciesId: string): SpeciesRole {
  return speciesId === 'plant' ? 'plant' : 'default';
}
