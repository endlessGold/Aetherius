import { Event, Component, NodeInterface } from './interfaces.js';

export class Node implements NodeInterface {
  id: string;
  type: string;
  parent?: NodeInterface;
  children: NodeInterface[] = [];
  components: Map<string, Component> = new Map();

  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }

  addComponent(component: Component): void {
    this.components.set(component.name, component);
  }

  handleEvent(event: Event): void {
    // 1. Handle event in components
    this.components.forEach((comp) => {
      if (comp.handleEvent) {
        comp.handleEvent(event);
      }
    });

    // 2. Propagate to children (optional, depending on event type?)
    // For now, we let the World/EventLoop manage distribution, 
    // or implementing specific propagation logic here.
    // In this simple version, we don't auto-propagate to children to avoid double handling if the loop iterates all nodes.
  }
}

export class Entity extends Node {
  constructor(id: string) {
    super(id, 'Entity');
  }
}
