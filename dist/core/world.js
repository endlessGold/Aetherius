import { EventLoop } from './eventLoop.js';
import { EventBus } from './events/eventBus.js'; // New Event System
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
export class World {
    constructor(id) {
        this.nodes = new Map();
        this.eventLoop = new EventLoop(); // Legacy, to be migrated
        this.eventBus = new EventBus(); // New Advanced Event System
        this.id = id;
        // Create a 100x100 grid for demonstration (10,000 cells * 16 layers = 160,000 parameters)
        // Scale up to 1000x1000 for "billion" scale logic if memory allows
        this.environment = new EnvironmentGrid(100, 100);
        this.natureSystem = new NatureSystem(this.environment);
        this.natureSystem.initializeWorld();
        // Register Systems to EventBus
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Example: Log all system events
        this.eventBus.subscribeCategory('System', (event) => {
            // console.log(`[System] ${event.type} occurred.`);
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
