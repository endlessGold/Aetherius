import { EconomyActionKind } from './genome.js';

export enum SpeciesRole {
  plant,
  marketAgent,
  grazer,
  predator,
  decomposer,
}

export const PRIMARY_PRODUCER_ROLES = [SpeciesRole.plant] as const;
export const ANIMAL_SPECIES_ROLES = [
  SpeciesRole.marketAgent,
  SpeciesRole.grazer,
  SpeciesRole.predator,
  SpeciesRole.decomposer,
] as const;

export type PrimaryProducerRole = (typeof PRIMARY_PRODUCER_ROLES)[number];
export type PlantSpeciesRole = PrimaryProducerRole;
export type AnimalSpeciesRole = (typeof ANIMAL_SPECIES_ROLES)[number];

export type SpeciesRoleId = SpeciesRole;

/**
 * 식물(·나무) — 거래 없음
 * - 광합성: Vertic -1, "채굴"에 해당. 영양분(소량 Poly) 생성.
 * - 가공: Vertic -1, 보유 영양분을 "영향"으로 가공(질 향상).
 * - 영양분 빼앗기: Vertic -1, 에지스를 쓰고(낸다) 주변 영양분 풀에서 Poly 1개 획득. (거래로 은유 가능.)
 */
export const PLANT_ACTIONS = {
  PHOTOSYNTHESIS: EconomyActionKind.PHOTOSYNTHESIS,
  PROCESS_NUTRIENT: EconomyActionKind.PROCESS_NUTRIENT,
  COMPETE_NUTRIENT: EconomyActionKind.COMPETE_NUTRIENT,
  CONSUME: EconomyActionKind.CONSUME,
  IDLE: EconomyActionKind.IDLE,
} as const;

export type PlantActionKind = (typeof PLANT_ACTIONS)[keyof typeof PLANT_ACTIONS];

/**
 * 기본(동물·에이전트) — 시장 거래
 * - 채굴, 가공, 거래(매수/매도/보증), 섭취.
 */
export const DEFAULT_ACTIONS = {
  MINE: EconomyActionKind.MINE,
  CRAFT: EconomyActionKind.CRAFT,
  CONSUME: EconomyActionKind.CONSUME,
  TRADE_BUY: EconomyActionKind.TRADE_BUY,
  TRADE_SELL: EconomyActionKind.TRADE_SELL,
  WITNESS: EconomyActionKind.WITNESS,
  IDLE: EconomyActionKind.IDLE,
} as const;

export const GRAZER_ACTIONS = {
  GRAZE: EconomyActionKind.CONSUME,
  MIGRATE: EconomyActionKind.IDLE,
  FLEE: EconomyActionKind.IDLE,
  CONSUME: EconomyActionKind.CONSUME,
  IDLE: EconomyActionKind.IDLE,
} as const;

export type GrazerActionKind = (typeof GRAZER_ACTIONS)[keyof typeof GRAZER_ACTIONS];

export const PREDATOR_ACTIONS = {
  HUNT: EconomyActionKind.CONSUME,
  STALK: EconomyActionKind.IDLE,
  AMBUSH: EconomyActionKind.IDLE,
  CONSUME: EconomyActionKind.CONSUME,
  IDLE: EconomyActionKind.IDLE,
} as const;

export type PredatorActionKind = (typeof PREDATOR_ACTIONS)[keyof typeof PREDATOR_ACTIONS];

export const DECOMPOSER_ACTIONS = {
  SCAVENGE: EconomyActionKind.CONSUME,
  BREAKDOWN: EconomyActionKind.IDLE,
  ABSORB: EconomyActionKind.CONSUME,
  IDLE: EconomyActionKind.IDLE,
} as const;

export type DecomposerActionKind = (typeof DECOMPOSER_ACTIONS)[keyof typeof DECOMPOSER_ACTIONS];

export function getSpeciesRole(speciesId: string): SpeciesRole {
  return speciesId === 'plant' ? SpeciesRole.plant : SpeciesRole.marketAgent;
}

export function getSpeciesRoleId(speciesId: string): SpeciesRoleId {
  return getSpeciesRole(speciesId);
}

export namespace SpeciesRoleMeta {
  export type Id = SpeciesRoleId;
  export type Code = keyof typeof SpeciesRole;

  export function toId(role: SpeciesRole): Id {
    return role;
  }

  export function fromId(id: Id): SpeciesRole {
    return id;
  }

  export function toCode(role: SpeciesRole): Code {
    return SpeciesRole[role] as Code;
  }

  export function fromSpeciesId(speciesId: string): SpeciesRole {
    return getSpeciesRole(speciesId);
  }

  export function idFromSpeciesId(speciesId: string): Id {
    return getSpeciesRole(speciesId);
  }
}
