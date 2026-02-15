export class EventLoop {
    constructor() {
        this.registry = new Map();
        this.queue = [];
    }
    // Register a global handler for a specific event type
    register(eventType, handler) {
        // If multiple handlers are needed per type, this should be Map<string, Handler[]>
        // For simplicity, we use one global handler or handle via Node structure
        this.registry.set(eventType, handler);
    }
    // Add event to queue
    emit(event) {
        this.queue.push(event);
    }
    // Process all events in queue
    tick() {
        const eventsToProcess = [...this.queue];
        this.queue = []; // Clear queue for next tick additions
        for (const event of eventsToProcess) {
            // 1. Global registry handlers
            const handler = this.registry.get(event.type);
            if (handler) {
                handler(event);
            }
            // 2. We might want to broadcast specific events to all listeners/nodes
            // This part is handled by the World typically
        }
    }
}
