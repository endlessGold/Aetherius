/**
 * 결정론적 ID 생성. 동일 seed + sequence → 동일 ID.
 * LLM 에이전트가 결과를 수학적으로 예측할 수 있도록 사용.
 */
let polySequence = 0;

export function resetPolySequence(seed: number = 0): void {
  polySequence = seed;
}

export function nextPolyId(creatorId: string): string {
  polySequence += 1;
  return `PLY-${creatorId}-${polySequence}`;
}
