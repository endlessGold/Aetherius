import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { System, Interaction, Simulation } from '../events/eventTypes.js';
import { BioStateComponent } from '../../components/bioStateComponent.js';
import { ActionParamsComponent } from '../../components/actionParamsComponent.js';

export class ActuatorSystem extends BaseSystem {
  private world: World;

  constructor(world: World) {
    super('ActuatorSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void {
    this.subscribe(System.AIAgentSense, this.handleSense);
    this.subscribe(System.ParameterChange, this.handleParameterChange);
  }

  private handleSense(event: Simulation.Event<any>) {
    const { targetId, bioState } = event.payload as {
      targetId: string;
      bioState: { hunger: number; energy: number; stress: number; health: number };
    };

    if (bioState.energy < 25 || bioState.hunger > 60) {
      this.publish(new System.ParameterChange(targetId, 'BioState', { hunger: -8, energy: 6 }, targetId));
      return;
    }

    if (bioState.stress > 70) {
      this.publish(new System.ParameterChange(targetId, 'BioState', { stress: -5 }, targetId));
      return;
    }

    if (bioState.health < 40) {
      this.publish(new Interaction.Communicate('NeedSupport', targetId, targetId));
      return;
    }

    this.publish(new System.ParameterChange(targetId, 'ActionParams', { aggression: -0.05 }, targetId));
  }

  private handleParameterChange(event: Simulation.Event<any>) {
    const { targetId, component, changes } = event.payload as {
      targetId: string;
      component: string;
      changes: Record<string, number>;
    };

    const node = this.world.getNode(targetId);
    if (!node) return;

    if (component === 'BioState') {
      const bio = node.components.get('BioState') as BioStateComponent | undefined;
      if (!bio) return;
      for (const [key, delta] of Object.entries(changes)) {
        const value = (bio.state as any)[key];
        if (typeof value !== 'number') continue;
        (bio.state as any)[key] = clampValue(value + delta, 0, 100);
      }
    }

    if (component === 'ActionParams') {
      const params = node.components.get('ActionParams') as ActionParamsComponent | undefined;
      if (!params) return;
      for (const [key, delta] of Object.entries(changes)) {
        const value = (params.state as any)[key];
        if (typeof value !== 'number') continue;
        (params.state as any)[key] = clampValue(value + delta, 0, 100);
      }
    }
  }
}

function clampValue(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
