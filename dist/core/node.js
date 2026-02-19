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
    getComponent(name) {
        return this.components.get(name);
    }
    handleEvent(event) {
        // 1. Handle event in components
        this.components.forEach((comp) => {
            if (comp.handleEvent) {
                comp.handleEvent(event);
            }
        });
        // 2. Propagate to children (optional, depending on event type?)
        // For now, we let the World manage distribution,
        // or implementing specific propagation logic here.
        // In this simple version, we don't auto-propagate to children to avoid double handling if the loop iterates all nodes.
    }
}
export class Entity extends Node {
    constructor(id, type = 'Entity') {
        super(id, type);
    }
}
export class EmptyNode extends Node {
    constructor(id) {
        super(id, 'EmptyNode');
    }
}
export class EventNode extends Node {
    constructor(id) {
        super(id, 'EventNode');
    }
}
