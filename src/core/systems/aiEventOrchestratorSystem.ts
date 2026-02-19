import type { World } from '../world.js';
import { BaseSystem } from './baseSystem.js';
import { EventCategory, Environment, System, Command, Biological, Interaction, Simulation } from '../events/eventTypes.js';
import { Layer } from '../environment/environmentGrid.js';
import { LLMService, createDefaultLLMService } from '../../ai/llmService.js';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

type BufferedEvent = {
  tick: number;
  category: string;
  type: string;
  payload: any;
  sourceId?: string;
};

type AIAction =
  | { kind: 'none'; reason: string }
  | { kind: 'env_global_delta'; layer: number; delta: number; reason: string }
  | { kind: 'spawn_entity'; assemblyType: string; x: number; y: number; reason: string }
  | { kind: 'spawn_place_near'; x: number; y: number; reason: string }
  | { kind: 'message'; text: string; reason: string };

export class AIEventOrchestratorSystem extends BaseSystem {
  private world: World;
  private llm: LLMService;
  private enabled: boolean = false;
  private eventBuffer: BufferedEvent[] = [];
  private lastDecisionTick: number = 0;
  private decisionIntervalTicks: number = 30;
  private maxBufferedEvents: number = 30;

  constructor(world: World) {
    super('AIEventOrchestratorSystem', world.eventBus);
    this.world = world;
    this.llm = createDefaultLLMService();
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }

  protected registerHandlers(): void {
    this.eventBus.subscribeCategory(EventCategory.Physics, this.handleAnyEvent.bind(this));
    this.eventBus.subscribeCategory(EventCategory.Biological, this.handleAnyEvent.bind(this));
    this.eventBus.subscribeCategory(EventCategory.Interaction, this.handleAnyEvent.bind(this));
    this.subscribe(System.Tick, this.handleTick);
  }

  private handleAnyEvent(event: Simulation.Event) {
    if (!this.enabled) return;
    if (event.type === 'Tick') return;
    const entry: BufferedEvent = {
      tick: this.world.tickCount,
      category: (event as any).category ?? 'Unknown',
      type: event.type,
      payload: event.payload,
      sourceId: (event as any).sourceId
    };
    this.eventBuffer.push(entry);
    if (this.eventBuffer.length > this.maxBufferedEvents) {
      this.eventBuffer.splice(0, this.eventBuffer.length - this.maxBufferedEvents);
    }
  }

  private async handleTick() {
    if (!this.enabled) return;
    if (this.world.tickCount - this.lastDecisionTick < this.decisionIntervalTicks) return;
    if (this.eventBuffer.length === 0) return;

    this.lastDecisionTick = this.world.tickCount;
    const context = this.buildContext();
    const events = this.eventBuffer.splice(0, this.eventBuffer.length);

    const prompt = this.buildPrompt(context, events);
    const decision = (await this.llm.generateDecision(prompt, null)) as { actions?: AIAction[] } | null | undefined;
    const actions: AIAction[] = Array.isArray(decision?.actions) ? decision.actions : [];

    if (actions.length === 0) return;

    for (const action of actions.slice(0, 3)) {
      await this.executeAction(action);
    }

    await this.persistDecision({ tick: this.world.tickCount, context, events, actions });
  }

  private buildContext(): string {
    const entities = this.world.getAssembleManager().entities ?? [];
    const places = entities.filter((e: any) => e?.type === 'Place').length;
    const plants = entities.filter((e: any) => {
      const b = e?.children?.[0] as any;
      return b?.components?.growth;
    }).length;
    const creatures = entities.filter((e: any) => {
      const b = e?.children?.[0] as any;
      return b?.components?.goalGA;
    }).length;

    const maze = (this.world as any).mazeSystem?.network;
    const nodeCount = maze?.nodes?.size ?? 0;
    const edgeCount = maze
      ? Array.from(maze.nodes.values()).reduce((sum: number, n: any) => sum + (n?.maze?.connections?.size ?? 0), 0) / 2
      : 0;

    const env = this.world.environment;
    const temp = env.get(50, 50, Layer.Temperature);
    const moisture = env.get(50, 50, Layer.SoilMoisture);
    const light = env.get(50, 50, Layer.LightIntensity);

    return [
      `Tick=${this.world.tickCount}`,
      `Entities=${entities.length} Places=${places} Plants=${plants} Creatures=${creatures}`,
      `MazeNodes=${nodeCount} MazeEdges=${Math.floor(edgeCount)}`,
      `Env(center): temp=${temp.toFixed(2)} moisture=${moisture.toFixed(2)} light=${light.toFixed(2)}`
    ].join('\n');
  }

  private buildPrompt(context: string, events: BufferedEvent[]): string {
    const recent = events.slice(-12).map(e => ({
      tick: e.tick,
      category: e.category,
      type: e.type,
      payload: e.payload,
      sourceId: e.sourceId
    }));

    return `You are an AI event handler for the Aetherius simulation. Your job is to react to recent simulation events with concrete, implementable actions.

Context:
${context}

Recent events (latest first):
${JSON.stringify(recent.reverse(), null, 2)}

Allowed actions:
- none
- env_global_delta: apply Environment.GlobalParameterChange(layer, delta). layer is an EnvLayer integer.
- spawn_entity: publish Command.EntityCreateRequested(id, assemblyType). Choose assemblyType from: Plant_Species_001, Creature_Type_001.
- spawn_place_near: create a new Place by calling world.mazeSystem.network.createNode(x,y).
- message: publish Interaction.Communicate(message).

Safety rules:
- At most 3 actions.
- Prefer minimal deltas: |delta| <= 5.
- Use x,y in 0..100 for spawn_entity/spawn_place_near.

Output JSON only:
{
  \"actions\": [
    { \"kind\": \"env_global_delta\", \"layer\": 3, \"delta\": 2, \"reason\": \"...\" }
  ]
}`;
  }

  private async executeAction(action: AIAction): Promise<void> {
    if (!action || typeof action !== 'object') return;

    if (action.kind === 'none') return;

    if (action.kind === 'env_global_delta') {
      const layer = Number(action.layer);
      const delta = Number(action.delta);
      if (!Number.isFinite(layer) || !Number.isFinite(delta)) return;
      if (Math.abs(delta) > 5) return;
      this.publish(new Environment.GlobalParameterChange(layer, delta, this.id));
      return;
    }

    if (action.kind === 'spawn_entity') {
      const assemblyType = String(action.assemblyType || '');
      if (!['Plant_Species_001', 'Creature_Type_001'].includes(assemblyType)) return;
      const id = uuidv4();
      this.publish(new Command.EntityCreateRequested(id, assemblyType, this.id));
      return;
    }

    if (action.kind === 'spawn_place_near') {
      const x = Number(action.x);
      const y = Number(action.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const maze = (this.world as any).mazeSystem?.network;
      if (!maze?.createNode) return;
      maze.createNode(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
      return;
    }

    if (action.kind === 'message') {
      const text = String(action.text || '');
      if (!text) return;
      this.publish(new Interaction.Communicate(text, undefined, this.id));
      return;
    }
  }

  private async persistDecision(entry: any): Promise<void> {
    const details = JSON.stringify({ kind: 'ai_event_handling', ...entry });
    await this.world.persistence.saveWorldEvent({
      worldId: this.world.id,
      tick: this.world.tickCount,
      type: 'OTHER',
      location: { x: 0, y: 0 },
      details
    });

    if (this.world.config.telemetry.writeJsonlToDisk) {
      const dir = path.join(process.cwd(), 'data', 'reports');
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, 'ai_event_decisions.jsonl');
      await fs.appendFile(file, `${details}\n`, 'utf8');
    }
  }
}
