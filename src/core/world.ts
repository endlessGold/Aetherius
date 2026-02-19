import { NodeInterface } from './interfaces.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { EventCategory, System } from './events/eventTypes.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
import { DirectionSystem } from './systems/goalGASystem.js';
import { InteractionSystem } from './systems/interactionSystem.js';
import { SensorSystem } from './systems/sensorSystem.js';
import { ActuatorSystem } from './systems/actuatorSystem.js';
import { DivineSystem } from './systems/divineSystem.js';
import { EntityRegistrarSystem } from './systems/entityRegistrarSystem.js';
import { EventNodeSystem } from './systems/eventNodeSystem.js';
import { createPersistenceFromEnv, Persistence } from '../data/persistence.js';
import { NodeSnapshot, TickSnapshot } from '../data/noSqlAdapter.js';
import { TensorFlowModel } from '../ai/tensorFlowModel.js';
import { AutoSystem } from './systems/autoSystem.js';
import { MazeSystem } from './maze/mazeNetwork.js';
import { AIEventOrchestratorSystem } from './systems/aiEventOrchestratorSystem.js';
import { WormholeSystem } from './systems/wormholeSystem.js';
import type { AssembleManager } from '../entities/assembly.js';
import { AssembleManager as AssembleManagerClass } from '../entities/assembly.js';
import { PRNG } from '../ai/prng.js';
import { loadWorldConfig, WorldConfig } from './config/worldConfig.js';

export class World {
  id: string;
  nodes: Map<string, NodeInterface> = new Map();
  eventBus: EventBus = new EventBus(); // New Advanced Event System
  tickCount: number = 0;
  persistence: Persistence;
  tfModel: TensorFlowModel;
  private tickPayloadProvider: () => Record<string, any>;
  assembleManager: AssembleManager;
  config: WorldConfig;
  rng: PRNG;
  private idSeq: number = 0;
  private isTicking: boolean = false;

  // High-Resolution Simulation Components
  environment: EnvironmentGrid;
  natureSystem: NatureSystem;
  directionSystem: DirectionSystem;
  interactionSystem: InteractionSystem;
  sensorSystem: SensorSystem;
  actuatorSystem: ActuatorSystem;
  divineSystem: DivineSystem;
  registrarSystem: EntityRegistrarSystem;
  eventNodeSystem: EventNodeSystem;
  autoSystem: AutoSystem;
  mazeSystem: MazeSystem;
  aiEventOrchestratorSystem: AIEventOrchestratorSystem;
  wormHoleSystem: WormholeSystem;

  constructor(
    id: string,
    options?: {
      persistence?: Persistence;
      tickPayloadProvider?: () => Record<string, any>;
      assembleManager?: AssembleManager;
      config?: Partial<WorldConfig>;
    }
  ) {
    this.id = id;
    this.config = loadWorldConfig(id, options?.config);
    this.rng = new PRNG(this.config.seed);
    this.persistence = options?.persistence ?? createPersistenceFromEnv();
    this.tfModel = new TensorFlowModel();
    this.tickPayloadProvider = options?.tickPayloadProvider ?? (() => ({}));
    this.assembleManager = options?.assembleManager ?? new AssembleManagerClass();

    // Create a massive world grid (7000x7000 default)
    // 21 layers * 49M cells ≈ 1 Billion parameters
    // Chunk system handles memory efficiently
    this.environment = new EnvironmentGrid();
    this.natureSystem = new NatureSystem(this.environment);
    this.natureSystem.initializeWorld(this.rng);
    this.directionSystem = new DirectionSystem();
    this.interactionSystem = new InteractionSystem(this);
    this.sensorSystem = new SensorSystem(this);
    this.actuatorSystem = new ActuatorSystem(this);
    this.divineSystem = new DivineSystem(this);
    this.registrarSystem = new EntityRegistrarSystem(this);
    this.eventNodeSystem = new EventNodeSystem(this);
    this.autoSystem = new AutoSystem(this);
    this.mazeSystem = new MazeSystem(this);
    this.aiEventOrchestratorSystem = new AIEventOrchestratorSystem(this);
    this.wormHoleSystem = new WormholeSystem(this);

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
    return this.assembleManager;
  }

  nextId(prefix: string): string {
    this.idSeq += 1;
    return `${prefix}_${this.id}_${this.tickCount}_${this.idSeq}`;
  }

  random01(): number {
    return this.rng.nextFloat01();
  }

  randomInt(maxExclusive: number): number {
    return this.rng.nextInt(maxExclusive);
  }

  async tick(): Promise<void> {
    if (this.isTicking) {
      throw new Error(`World.tick() re-entry detected (worldId=${this.id})`);
    }
    this.isTicking = true;
    try {
      this.tickCount += 1;
      // AsyncRequest 등 명령은 EventBus 큐에서 processQueue() 시 처리됨 (EventLoop 레거시 대체)

      const tickPayload = this.tickPayloadProvider();
      this.eventBus.publish(new System.Tick(this.tickCount, 1, tickPayload.environment));

      // 2. Process New Event Bus Queue
      await this.eventBus.processQueue();

      // 3. Simulate High-Res Physics
      this.natureSystem.simulate(this.tickCount);

      // 4. Direction-generating GA tick
      this.directionSystem.tick(this);

      // 5. AI God tick
      await this.autoSystem.tick();

      // 6. Maze Evolution
      this.mazeSystem.tick();

      await this.eventBus.processQueue();

      const predictions: Record<string, any> = {};
      for (const node of this.nodes.values()) {
        const pred = this.tfModel.predictForNode(node);
        if (pred) predictions[node.id] = pred;
      }

      const timestamp = this.config.deterministic ? this.tickCount * this.config.tickDurationMs : Date.now();
      const snapshot = this.buildSnapshot(timestamp, Object.keys(predictions).length > 0 ? predictions : undefined);
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
        components[key] = JSON.parse(JSON.stringify(comp.state));
      });
      nodes.push({ id: node.id, type: node.type, components });
    }
    const entities = JSON.parse(
      JSON.stringify(
        this.assembleManager?.entities?.map((e: any) => ({
          id: e.id,
          children: (e.children || []).map((c: any) => ({ id: c.id || e.id, components: c.components }))
        })) || []
      )
    );
    return {
      worldId: this.id,
      tick: this.tickCount,
      timestamp,
      nodes,
      predictions,
      seed: this.config.seed,
      rngState: this.rng.getState(),
      config: this.config,
      entities
    };
  }
}
