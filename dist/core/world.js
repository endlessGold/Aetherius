import { EventLoop } from './eventLoop.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { System } from './events/eventTypes.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
import { GoalGASystem } from './systems/goalGASystem.js';
import { InteractionSystem } from './systems/interactionSystem.js';
import { SensorSystem } from './systems/sensorSystem.js';
import { ActuatorSystem } from './systems/actuatorSystem.js';
import { DivineSystem } from './systems/divineSystem.js';
import { EntityRegistrarSystem } from './systems/entityRegistrarSystem.js';
import { EventNodeSystem } from './systems/eventNodeSystem.js';
import { createPersistenceFromEnv } from '../data/persistence.js';
import { TensorFlowModel } from '../ai/tensorFlowModel.js';
import { AutoGodSystem } from './systems/autoGodSystem.js';
import { MazeSystem } from './maze/mazeNetwork.js';
import { AIEventOrchestratorSystem } from './systems/aiEventOrchestratorSystem.js';
import { WormholeSystem } from './systems/wormholeSystem.js';
import { AssembleManager as AssembleManagerClass } from '../entities/assembly.js';
import { PRNG } from '../ai/prng.js';
import { loadWorldConfig } from './config/worldConfig.js';
export class World {
    constructor(id, options) {
        this.nodes = new Map();
        this.eventLoop = new EventLoop(); // Legacy, to be migrated
        this.eventBus = new EventBus(); // New Advanced Event System
        this.tickCount = 0;
        this.idSeq = 0;
        this.isTicking = false;
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
    setupEventHandlers() {
        // Example: Log all system events - Disabled to reduce spam
        // this.eventBus.subscribeCategory(EventCategory.System, (event) => {
        //   console.log(`[System] ${event.type} occurred.`);
        // });
    }
    addNode(node) {
        this.nodes.set(node.id, node);
        if (node.type === 'EventNode') {
            this.eventNodeSystem.registerNode(node);
        }
    }
    // Helper to retrieve node
    getNode(id) {
        return this.nodes.get(id);
    }
    getAssembleManager() {
        return this.assembleManager;
    }
    nextId(prefix) {
        this.idSeq += 1;
        return `${prefix}_${this.id}_${this.tickCount}_${this.idSeq}`;
    }
    random01() {
        return this.rng.nextFloat01();
    }
    randomInt(maxExclusive) {
        return this.rng.nextInt(maxExclusive);
    }
    async tick() {
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
            this.natureSystem.simulate(this.tickCount);
            // 4. Goal-generating GA tick
            this.goalGASystem.tick(this);
            // 5. AI God tick
            await this.autoGodSystem.tick();
            // 6. Maze Evolution
            this.mazeSystem.tick();
            await this.eventBus.processQueue();
            const predictions = {};
            for (const node of this.nodes.values()) {
                const pred = this.tfModel.predictForNode(node);
                if (pred)
                    predictions[node.id] = pred;
            }
            const timestamp = this.config.deterministic ? this.tickCount * this.config.tickDurationMs : Date.now();
            const snapshot = this.buildSnapshot(timestamp, Object.keys(predictions).length > 0 ? predictions : undefined);
            await this.persistence.saveTickSnapshot(snapshot);
        }
        finally {
            this.isTicking = false;
        }
    }
    buildSnapshot(timestamp, predictions) {
        const nodes = [];
        for (const node of this.nodes.values()) {
            const components = {};
            node.components.forEach((comp, key) => {
                components[key] = JSON.parse(JSON.stringify(comp.state));
            });
            nodes.push({ id: node.id, type: node.type, components });
        }
        const entities = JSON.parse(JSON.stringify(this.assembleManager?.entities?.map((e) => ({
            id: e.id,
            children: (e.children || []).map((c) => ({ id: c.id || e.id, components: c.components }))
        })) || []));
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
