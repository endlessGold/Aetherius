import { NodeInterface } from './interfaces.js';
import { EventLoop } from './eventLoop.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { EventCategory, System } from './events/eventTypes.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
import { GoalGASystem } from './systems/goalGASystem.js';
import { InteractionSystem } from './systems/interactionSystem.js';
import { SensorSystem } from './systems/sensorSystem.js';
import { ActuatorSystem } from './systems/actuatorSystem.js';
import { DivineSystem } from './systems/divineSystem.js';
import { EntityRegistrarSystem } from './systems/entityRegistrarSystem.js';
import { EventNodeSystem } from './systems/eventNodeSystem.js';
import { createPersistenceFromEnv, Persistence } from '../data/persistence.js';
import { NodeSnapshot, TickSnapshot } from '../data/noSqlAdapter.js';
import { TensorFlowModel } from '../ai/tensorFlowModel.js';
import { AutoGodSystem } from './systems/autoGodSystem.js';
import { MazeSystem } from './maze/mazeNetwork.js';
import { AIEventOrchestratorSystem } from './systems/aiEventOrchestratorSystem.js';
import { WormholeSystem } from './systems/wormholeSystem.js';
import type { AssembleManager } from '../entities/assembly.js';
import { AssembleManager as AssembleManagerClass } from '../entities/assembly.js';

export class World {
  id: string;
  nodes: Map<string, NodeInterface> = new Map();
  eventLoop: EventLoop = new EventLoop(); // Legacy, to be migrated
  eventBus: EventBus = new EventBus(); // New Advanced Event System
  tickCount: number = 0;
  persistence: Persistence;
  tfModel: TensorFlowModel;
  private tickPayloadProvider: () => Record<string, any>;
  assembleManager?: AssembleManager;
  private isTicking: boolean = false;

  // High-Resolution Simulation Components
  environment: EnvironmentGrid;
  natureSystem: NatureSystem;
  goalGASystem: GoalGASystem;
  interactionSystem: InteractionSystem;
  sensorSystem: SensorSystem;
  actuatorSystem: ActuatorSystem;
  divineSystem: DivineSystem;
  registrarSystem: EntityRegistrarSystem;
  eventNodeSystem: EventNodeSystem;
  autoGodSystem: AutoGodSystem;
  mazeSystem: MazeSystem;
  aiEventOrchestratorSystem: AIEventOrchestratorSystem;
  wormholeSystem: WormholeSystem;

  constructor(id: string, options?: { persistence?: Persistence; tickPayloadProvider?: () => Record<string, any>; assembleManager?: AssembleManager }) {
    this.id = id;
    this.persistence = options?.persistence ?? createPersistenceFromEnv();
    this.tfModel = new TensorFlowModel();
    this.tickPayloadProvider = options?.tickPayloadProvider ?? (() => ({}));
    this.assembleManager = options?.assembleManager;

    // Create a massive world grid (7000x7000 default)
    // 21 layers * 49M cells ≈ 1 Billion parameters
    // Chunk system handles memory efficiently
    this.environment = new EnvironmentGrid();
    this.natureSystem = new NatureSystem(this.environment);
    this.natureSystem.initializeWorld();
    this.goalGASystem = new GoalGASystem();
    this.interactionSystem = new InteractionSystem(this);
    this.sensorSystem = new SensorSystem(this);
    this.actuatorSystem = new ActuatorSystem(this);
    this.divineSystem = new DivineSystem(this);
    this.registrarSystem = new EntityRegistrarSystem(this);
    this.eventNodeSystem = new EventNodeSystem(this);
    this.autoGodSystem = new AutoGodSystem(this);
    this.mazeSystem = new MazeSystem(this);
    this.aiEventOrchestratorSystem = new AIEventOrchestratorSystem(this);
    this.wormholeSystem = new WormholeSystem(this);

    // Register Systems to EventBus
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Example: Log all system events - Disabled to reduce spam
    // this.eventBus.subscribeCategory(EventCategory.System, (event) => {
    //   console.log(`[System] ${event.type} occurred.`);
    // });
  }

  addNode(node: NodeInterface): void {
    this.nodes.set(node.id, node);
    if (node.type === 'EventNode') {
      this.eventNodeSystem.registerNode(node);
    }
  }

  // Helper to retrieve node
  getNode(id: string): NodeInterface | undefined {
    return this.nodes.get(id);
  }

  getAssembleManager(): AssembleManager {
    return this.assembleManager ?? AssembleManagerClass.getInstance();
  }

  async tick(): Promise<void> {
    if (this.isTicking) {
      throw new Error(`World.tick() re-entry detected (worldId=${this.id})`);
    }
    this.isTicking = true;
    try {
    this.tickCount += 1;
    // 1. Process Legacy Event Loop (Global events)
    this.eventLoop.tick();

    const tickPayload = this.tickPayloadProvider();
    this.eventBus.publish(new System.Tick(this.tickCount, 1, tickPayload.environment));

    // 2. Process New Event Bus Queue
    await this.eventBus.processQueue();

    // 3. Simulate High-Res Physics
    this.natureSystem.simulate(Date.now());

    // 4. Goal-generating GA tick
    this.goalGASystem.tick(this);

    // 5. AI God tick
    await this.autoGodSystem.tick();
    
    // 6. Maze Evolution
    this.mazeSystem.tick();

    await this.eventBus.processQueue();

    const predictions: Record<string, any> = {};
    for (const node of this.nodes.values()) {
      const pred = this.tfModel.predictForNode(node);
      if (pred) predictions[node.id] = pred;
    }

    const snapshot = this.buildSnapshot(Date.now(), Object.keys(predictions).length > 0 ? predictions : undefined);
    await this.persistence.saveTickSnapshot(snapshot);
    } finally {
      this.isTicking = false;
    }
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
