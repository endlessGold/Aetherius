import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { System } from '../events/eventTypes.js';
import { BioStateComponent } from '../../components/bioStateComponent.js';
import { ActionParamsComponent } from '../../components/actionParamsComponent.js';
import { DirectionGAComponent } from '../../components/directionGaComponent.js';
import { EnvironmentLayer } from '../environment/environmentGrid.js';

export class SensorSystem extends BaseSystem {
  private world: World;

  constructor(world: World) {
    super('SensorSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void {
    this.subscribe(System.Tick, this.handleTick);
  }

  private handleTick() {
    for (const node of this.world.nodes.values()) {
      const bio = node.components.get('BioState') as BioStateComponent | undefined;
      const params = node.components.get('ActionParams') as ActionParamsComponent | undefined;
      if (!bio || !params) continue;

      const ga = node.components.get('DirectionGA') as DirectionGAComponent | undefined;
      const env = ga
        ? {
          temperature: this.world.environment.get(ga.state.position.x, ga.state.position.y, EnvironmentLayer.Temperature),
          humidity: this.world.environment.get(ga.state.position.x, ga.state.position.y, EnvironmentLayer.Humidity),
          light: this.world.environment.get(ga.state.position.x, ga.state.position.y, EnvironmentLayer.LightIntensity),
          soilMoisture: this.world.environment.get(ga.state.position.x, ga.state.position.y, EnvironmentLayer.SoilMoisture)
        }
        : undefined;

      this.publish(
        new System.AIAgentSense({
          targetId: node.id,
          bioState: { ...bio.state },
          actionParams: { ...params.state },
          environment: env
        })
      );
    }
  }
}
