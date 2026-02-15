export class Node {
    constructor(id, type) {
        this.children = [];
        this.components = new Map();
        this.id = id;
        this.type = type;
    }
    addComponent(component) {
        this.components.set(component.name, component);
    }
    handleEvent(event) {
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
    constructor(id) {
        super(id, 'Entity');
    }
}
