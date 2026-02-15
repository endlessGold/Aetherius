import { EventLoop } from './eventLoop.js';
import { EnvironmentGrid } from './environment/environmentGrid.js';
import { NatureSystem } from './environment/natureSystem.js';
export class World {
    constructor(id) {
        this.nodes = new Map();
        this.eventLoop = new EventLoop();
        this.id = id;
        // Create a 100x100 grid for demonstration (10,000 cells * 16 layers = 160,000 parameters)
        // Scale up to 1000x1000 for "billion" scale logic if memory allows
        this.environment = new EnvironmentGrid(100, 100);
        this.natureSystem = new NatureSystem(this.environment);
        this.natureSystem.initializeWorld();
    }
    addNode(node) {
        this.nodes.set(node.id, node);
    }
    // Helper to retrieve node
    getNode(id) {
        return this.nodes.get(id);
    }
    tick() {
        // 1. Process Event Loop (Global events)
        this.eventLoop.tick();
        // 2. Simulate High-Res Physics
        this.natureSystem.simulate(Date.now());
        // 3. Propagate Tick event to all nodes
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
