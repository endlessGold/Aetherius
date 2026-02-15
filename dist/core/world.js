import { EventLoop } from './eventLoop.js';
export class World {
    constructor(id) {
        this.nodes = new Map();
        this.eventLoop = new EventLoop();
        this.id = id;
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
        // 2. Propagate Tick event to all nodes
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
