import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { Simulation } from '../events/eventTypes.js';
import { NodeInterface } from '../interfaces.js';
import { EventBindingComponent } from '../../components/eventBindingComponent.js';

export class EventNodeSystem extends BaseSystem {
  private world: World;
  private registered: Set<string> = new Set();

  constructor(world: World) {
    super('EventNodeSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void { }

  registerNode(node: NodeInterface): void {
    const comp = node.components.get('EventBinding') as EventBindingComponent | undefined;
    if (!comp) return;
    const key = `${node.id}:${comp.state.eventType.name}`;
    if (this.registered.has(key)) return;
    this.registered.add(key);

    this.eventBus.subscribe(comp.state.eventType, (event: Simulation.Event<any>) => {
      const target = this.world.getNode(comp.state.targetId);
      if (!target) return;
      target.handleEvent(event);
    });
  }
}
