import { EventLoop } from './eventLoop.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { EventCategory } from './events/eventTypes.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
export class World {
    constructor(id) {
        this.nodes = new Map();
        this.eventLoop = new EventLoop(); // Legacy, to be migrated
        this.eventBus = new EventBus(); // New Advanced Event System
        this.id = id;
        // Create a massive world grid (7000x7000 default)
        // 21 layers * 49M cells ≈ 1 Billion parameters
        // Chunk system handles memory efficiently
        this.environment = new EnvironmentGrid();
        this.natureSystem = new NatureSystem(this.environment);
        this.natureSystem.initializeWorld();
        // Register Systems to EventBus
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Example: Log all system events
        this.eventBus.subscribeCategory(EventCategory.System, (event) => {
            console.log(`[System] ${event.type} occurred.`);
        });
    }
    addNode(node) {
        this.nodes.set(node.id, node);
    }
    // Helper to retrieve node
    getNode(id) {
        return this.nodes.get(id);
    }
    async tick() {
        // 1. Process Legacy Event Loop (Global events)
        this.eventLoop.tick();
        // 2. Process New Event Bus Queue
        await this.eventBus.processQueue();
        // 3. Simulate High-Res Physics
        this.natureSystem.simulate(Date.now());
        // 4. Propagate Tick event to all nodes
        // In a massive world, we might want to optimize this (e.g., chunks, active regions)
        const tickEvent = {
            type: 'Tick',
            payload: {},
            timestamp: Date.now()
        };
        this.nodes.forEach((node) => {
            node.handleEvent(tickEvent);
        });
    }
}
