import { NodeInterface } from './interfaces.js';
import { EventLoop } from './eventLoop.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { EventCategory } from './events/eventTypes.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
import { GoalGASystem } from './systems/goalGASystem.js';
import { createPersistenceFromEnv, Persistence } from '../data/persistence.js';
import { NodeSnapshot, TickSnapshot } from '../data/noSqlAdapter.js';
import { TensorFlowModel } from '../ai/tensorFlowModel.js';

export class World {
  id: string;
  nodes: Map<string, NodeInterface> = new Map();
  eventLoop: EventLoop = new EventLoop(); // Legacy, to be migrated
  eventBus: EventBus = new EventBus(); // New Advanced Event System
  tickCount: number = 0;
  persistence: Persistence;
  tfModel: TensorFlowModel;
  private tickPayloadProvider: () => Record<string, any>;
  
  // High-Resolution Simulation Components
  environment: EnvironmentGrid;
  natureSystem: NatureSystem;
  goalGASystem: GoalGASystem;

  constructor(id: string, options?: { persistence?: Persistence; tickPayloadProvider?: () => Record<string, any> }) {
    this.id = id;
    this.persistence = options?.persistence ?? createPersistenceFromEnv();
    this.tfModel = new TensorFlowModel();
    this.tickPayloadProvider = options?.tickPayloadProvider ?? (() => ({}));
    
    // Create a massive world grid (7000x7000 default)
    // 21 layers * 49M cells ≈ 1 Billion parameters
    // Chunk system handles memory efficiently
    this.environment = new EnvironmentGrid(); 
    this.natureSystem = new NatureSystem(this.environment);
    this.natureSystem.initializeWorld();
    this.goalGASystem = new GoalGASystem();

    // Register Systems to EventBus
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Example: Log all system events
    this.eventBus.subscribeCategory(EventCategory.System, (event) => {
        console.log(`[System] ${event.type} occurred.`);
    });
  }

  addNode(node: NodeInterface): void {
    this.nodes.set(node.id, node);
  }

  // Helper to retrieve node
  getNode(id: string): NodeInterface | undefined {
    return this.nodes.get(id);
  }

  async tick(): Promise<void> {
    this.tickCount += 1;
    // 1. Process Legacy Event Loop (Global events)
    this.eventLoop.tick();

    // 2. Process New Event Bus Queue
    await this.eventBus.processQueue();

    // 3. Simulate High-Res Physics
    this.natureSystem.simulate(Date.now());

    // 4. Goal-generating GA tick
    this.goalGASystem.tick(this);

    // 5. Propagate Tick event to all nodes
    // In a massive world, we might want to optimize this (e.g., chunks, active regions)
    const tickEvent = {
      type: 'Tick',
      payload: { ...this.tickPayloadProvider(), tickCount: this.tickCount },
      timestamp: Date.now()
    };

    this.nodes.forEach((node) => {
      node.handleEvent(tickEvent);
    });

    const predictions: Record<string, any> = {};
    for (const node of this.nodes.values()) {
      const pred = this.tfModel.predictForNode(node);
      if (pred) predictions[node.id] = pred;
    }

    const snapshot = this.buildSnapshot(Date.now(), Object.keys(predictions).length > 0 ? predictions : undefined);
    await this.persistence.saveTickSnapshot(snapshot);
  }

  private buildSnapshot(timestamp: number, predictions?: Record<string, any>): TickSnapshot {
    const nodes: NodeSnapshot[] = [];
    for (const node of this.nodes.values()) {
      const components: Record<string, any> = {};
      node.components.forEach((comp, key) => {
        components[key] = comp.state;
      });
      nodes.push({ id: node.id, type: node.type, components });
    }
    return { worldId: this.id, tick: this.tickCount, timestamp, nodes, predictions };
  }
}
