/**
 * 환경 상태: Vertic 소모량에 대한 배율.
 * 날씨(가뭄·양호)·계절 등이 기회 비용에 영향. Existence is Action — 행동 비용이 환경에 따라 변동.
 * @see docs/ECONOMY_BIO_SPEC.md
 */

export interface EnvironmentState {
  /** 행동당 Vertic 소모 배율. 1.0 = 기준, >1 = 가뭄 등(비용 증가), <1 = 양호. */
  vCostMultiplier: number;
}

export const DEFAULT_ENVIRONMENT: EnvironmentState = {
  vCostMultiplier: 1.0,
};

export function applyVCostMultiplier(baseAmount: number, env: EnvironmentState): number {
  const effective = baseAmount * env.vCostMultiplier;
  return Math.max(1, Math.ceil(effective));
}
