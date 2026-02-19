/**
 * 군집(뿌리 네트워크): 식물이 Edges(뿌리)로 형성하는 연결 그래프.
 * 연결된 개체 간에만 영양분(Poly) 공유·찬탈 가능.
 * @see docs/ECONOMY_BIO_SPEC.md
 */

export interface RootNetwork {
  /** (fromId, toId) 쌍. 무방향이면 양쪽 모두 저장하거나, from < to 규칙으로 하나만. */
  edges: Array<{ a: string; b: string }>;
}

export function createRootNetwork(): RootNetwork {
  return { edges: [] };
}

export function connect(net: RootNetwork, idA: string, idB: string): void {
  const key = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const k = key(idA, idB);
  if (net.edges.some((e) => key(e.a, e.b) === k)) return;
  net.edges.push({ a: idA, b: idB });
}

export function areConnected(net: RootNetwork, idA: string, idB: string): boolean {
  return net.edges.some(
    (e) => (e.a === idA && e.b === idB) || (e.a === idB && e.b === idA)
  );
}

/** id와 연결된 모든 이웃 ID. */
export function neighbours(net: RootNetwork, id: string): string[] {
  const set = new Set<string>();
  for (const e of net.edges) {
    if (e.a === id) set.add(e.b);
    if (e.b === id) set.add(e.a);
  }
  return [...set];
}
