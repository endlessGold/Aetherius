import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { Simulation, Environment } from '../events/eventTypes.js';

export class DivineSystem extends BaseSystem {
  private world: World;

  constructor(world: World) {
    super('DivineSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void {
    this.subscribe(Environment.GlobalParameterChange, this.handleGlobalParameterChange);
  }

  private handleGlobalParameterChange(event: Simulation.Event<any>) {
    const { layer, delta } = event.payload as { layer: number; delta: number };
    this.world.environment.forEachActiveChunk((chunk, _cx, _cy, w, h) => {
      const cells = w * h;
      const layers = chunk.length / cells;
      for (let i = 0; i < cells; i++) {
        const idx = i * layers + layer;
        if (idx >= 0 && idx < chunk.length) {
          chunk[idx] += delta;
        }
      }
    });
  }
}
