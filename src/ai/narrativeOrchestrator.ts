/**
 * 역사학자·기록학자·스토리텔러 협업 오케스트레이션.
 * getNarrative: 과거 수집 → Historian → Chronicler → Storyteller → { past, present, future, combined }
 */

import type { World } from '../core/world.js';
import { EnvironmentLayer } from '../core/environment/environmentGrid.js';
import { createDefaultLLMService } from './llmService.js';
import { HistorianAgent, ChroniclerAgent, StorytellerAgent } from './agents/narrativeAgents.js';

export interface NarrativeResult {
  past: string;
  present: string;
  future: string;
  combined: string;
}

const PAST_EVENTS_LIMIT = 100;

function buildCurrentSummary(world: World): string {
  const manager = world.getAssembleManager();
  const entities = manager.entities ?? [];
  const places = entities.filter((e: unknown) => (e as { type?: string })?.type === 'Place').length;
  const plants = entities.filter((e: unknown) => (e as { children?: Array<{ components?: { growth?: unknown } }> })?.children?.[0]?.components?.growth).length;
  const creatures = entities.filter((e: unknown) => (e as { children?: Array<{ components?: { goalGA?: unknown } }> })?.children?.[0]?.components?.goalGA).length;
  let totalHp = 0, totalEnergy = 0, counted = 0;
  for (const e of entities) {
    const c = (e as { children?: Array<{ components?: { vitality?: { hp: number }; energy?: { energy: number } } }> })?.children?.[0]?.components;
    if (!c) continue;
    if (c.vitality?.hp != null) totalHp += c.vitality.hp;
    if (c.energy?.energy != null) totalEnergy += c.energy.energy;
    counted++;
  }
  const maze = (world as World & { mazeSystem?: { network: { nodes: Map<unknown, unknown> } } }).mazeSystem?.network;
  const nodeCount = maze?.nodes?.size ?? 0;
  const edgeCount = maze ? Array.from(maze.nodes.values()).reduce((sum: number, n: unknown) => sum + ((n as { maze?: { connections?: { size: number } } })?.maze?.connections?.size ?? 0), 0) / 2 : 0;
  const env = world.environment;
  return [
    `Project: Aetherius (life simulation + evolving maze places)`,
    `Tick: ${world.tickCount}`,
    `Population: entities=${entities.length} places=${places} plants=${plants} creatures=${creatures}`,
    `AvgStats: hp=${counted ? (totalHp / counted).toFixed(2) : 'n/a'} energy=${counted ? (totalEnergy / counted).toFixed(2) : 'n/a'}`,
    `Maze: nodes=${nodeCount} edges=${Math.floor(edgeCount)}`,
    `Env(center): temp=${env.get(50, 50, EnvironmentLayer.Temperature).toFixed(2)} moisture=${env.get(50, 50, EnvironmentLayer.SoilMoisture).toFixed(2)} light=${env.get(50, 50, EnvironmentLayer.LightIntensity).toFixed(2)}`
  ].join('\n');
}

function buildPastSummary(events: Array<{ tick: number; type: string; details?: string }>): string {
  if (events.length === 0) return '';
  const lines = events.map((e) => `tick ${e.tick} [${e.type}] ${(e.details ?? '').slice(0, 200)}`);
  return lines.join('\n');
}

export class NarrativeOrchestrator {
  private historian: HistorianAgent;
  private chronicler: ChroniclerAgent;
  private storyteller: StorytellerAgent;

  constructor() {
    const llm = createDefaultLLMService();
    this.historian = new HistorianAgent(llm);
    this.chronicler = new ChroniclerAgent(llm);
    this.storyteller = new StorytellerAgent(llm);
  }

  /**
   * 세계의 과거·현재·미래 서사를 생성한다.
   * persistence는 world.persistence 사용. 과거는 getWorldEvents(worldId, { toTick: tick - 1, limit })로 수집.
   */
  async getNarrative(world: World): Promise<NarrativeResult> {
    const tick = world.tickCount;
    const events = await world.persistence.getWorldEvents(world.id, {
      toTick: tick - 1,
      limit: PAST_EVENTS_LIMIT
    });
    const pastSummary = buildPastSummary(events);
    const currentSummary = buildCurrentSummary(world);

    const [past, present] = await Promise.all([
      this.historian.describePast(pastSummary),
      this.chronicler.recordPresent(currentSummary)
    ]);
    const future = await this.storyteller.planFuture(present, past);

    const combined = `[과거] ${past}\n\n[현재] ${present}\n\n[미래] ${future}`;
    return { past, present, future, combined };
  }
}
