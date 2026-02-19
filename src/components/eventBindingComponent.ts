import { ComponentBase } from '../core/interfaces.js';
import { EventCtor } from '../core/events/eventTypes.js';

export interface EventBindingState {
  eventType: EventCtor;
  targetId: string;
  requiredComponents: string[];
}

export class EventBindingComponent extends ComponentBase<EventBindingState> {
  name = 'EventBinding';

  constructor(eventType: EventCtor, targetId: string, requiredComponents: string[] = []) {
    super({ eventType, targetId, requiredComponents });
  }
}
