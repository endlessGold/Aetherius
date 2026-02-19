/**
 * NoSQL 어댑터 공통 타입 정의.
 * 스냅샷·이벤트 등 저장소에 넣는 데이터 구조.
 */

export interface NodeSnapshot {
  id: string;
  type: string;
  components: Record<string, unknown>;
}

export interface TickSnapshot {
  worldId: string;
  tick: number;
  timestamp: number;
  nodes: NodeSnapshot[];
  predictions?: Record<string, unknown>;
  seed?: number;
  rngState?: unknown;
  config?: unknown;
  entities?: unknown[];
}

export interface WorldEventPayload {
  worldId: string;
  tick: number;
  type: string;
  location: { x: number; y: number };
  details?: string;
}

export interface EvolutionStatsPayload {
  worldId: string;
  generation: number;
  tick: number;
  avgFitness: number;
  weights: { survive: number; grow: number; explore: number };
  populationCount: number;
}

export interface ExperimentMetadataPayload {
  id: string;
  config: Record<string, unknown>;
  startedAt: number;
  totalGenerations: number;
}
