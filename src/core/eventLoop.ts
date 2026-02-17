import { Event, NodeInterface } from './interfaces.js';
import { EventCtor } from './events/eventTypes.js';

export class EventLoop {
  private registry: Map<EventCtor, (event: Event) => void> = new Map();
  private queue: Event[] = [];

  // Register a global handler for a specific event type
  register(eventType: EventCtor, handler: (event: Event) => void): void {
    // If multiple handlers are needed per type, this should be Map<string, Handler[]>
    // For simplicity, we use one global handler or handle via Node structure
    this.registry.set(eventType, handler);
  }

  // Add event to queue
  emit(event: Event): void {
    this.queue.push(event);
  }

  // Process all events in queue
  tick(): void {
    const eventsToProcess = [...this.queue];
    this.queue = []; // Clear queue for next tick additions

    for (const event of eventsToProcess) {
      // 1. Global registry handlers
      const handler = this.registry.get(event.constructor as EventCtor);
      if (handler) {
        handler(event);
      }

      // 2. We might want to broadcast specific events to all listeners/nodes
      // This part is handled by the World typically
    }
  }
}
