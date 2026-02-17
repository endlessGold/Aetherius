import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { Command, Simulation } from '../events/eventTypes.js';
import { createEntityByAssemblyWithManager } from '../../entities/catalog.js';

export class EntityRegistrarSystem extends BaseSystem {
  private world: World;

  constructor(world: World) {
    super('EntityRegistrarSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void {
    this.subscribe(Command.EntityCreateRequested, this.handleEntityCreateRequested);
    this.subscribe(Command.AssemblyCreateRequested, this.handleEntityCreateRequested);
  }

  private handleEntityCreateRequested(event: Simulation.Event<any>) {
    const p = event.payload as { id?: string; assemblyType?: string; items?: Array<{ id: string; assemblyType: string }> };
    if (Array.isArray(p.items) && p.items.length > 0) {
      for (const item of p.items) {
        this.publish(new Command.AssemblyCreateRequested(item.id, item.assemblyType, event.sourceId));
      }
      return;
    }

    if (!p.id || !p.assemblyType) return;
    // New system: Entity is created and managed by AssembleManager automatically.
    // We don't need to add it to World explicitly as World nodes.
    // But we might want to log it or ensure it's tracked.
    createEntityByAssemblyWithManager(this.world.getAssembleManager(), p.assemblyType, p.id);
    
    // Note: createEntityByAssembly calls AssembleManager.createEntity which adds it to AssembleManager.
    // So no further action is needed here for the new system.
    // Legacy World.addNode is skipped.
  }
}
