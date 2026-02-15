import { NodeInterface } from './interfaces.js';
import { EventLoop } from './eventLoop.js';
import { Event } from './interfaces.js';

export class World {
  id: string;
  nodes: Map<string, NodeInterface> = new Map();
  eventLoop: EventLoop = new EventLoop();

  constructor(id: string) {
    this.id = id;
  }

  addNode(node: NodeInterface): void {
    this.nodes.set(node.id, node);
  }

  // Helper to retrieve node
  getNode(id: string): NodeInterface | undefined {
    return this.nodes.get(id);
  }

  tick(): void {
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
