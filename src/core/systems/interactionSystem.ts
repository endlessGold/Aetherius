import { BaseSystem } from './baseSystem.js';
import { World } from '../world.js';
import { Simulation, Interaction, Biological } from '../events/eventTypes.js';
import { NodeInterface } from '../interfaces.js';
import { BioStateComponent } from '../../components/bioStateComponent.js';
import { PlantComponent } from '../../components/plantComponent.js';

export class InteractionSystem extends BaseSystem {
  private world: World;

  constructor(world: World) {
    super('InteractionSystem', world.eventBus);
    this.world = world;
  }

  protected registerHandlers(): void {
    this.subscribe(Interaction.Eat, this.handleEat);
    this.subscribe(Interaction.Attack, this.handleAttack);
    this.subscribe(Interaction.Mate, this.handleMate);
    this.subscribe(Interaction.Communicate, this.handleCommunicate);
  }

  private handleEat(event: Simulation.Event<any>) {
    const { targetId, amount } = event.payload as { targetId: string; amount: number };
    const source = event.sourceId ? this.world.getNode(event.sourceId) : undefined;
    const target = this.world.getNode(targetId);

    if (source) {
      const bio = this.getBioState(source);
      if (bio) {
        bio.state.energy = clamp01_100(bio.state.energy + amount);
        bio.state.hunger = clamp01_100(bio.state.hunger - amount * 0.5);
        bio.state.stress = clamp01_100(bio.state.stress - amount * 0.2);
      }
    }

    if (target) {
      const plant = target.components.get('Plant') as PlantComponent | undefined;
      if (plant) {
        plant.state.health = clamp01_100(plant.state.health - amount);
        if (plant.state.health <= 0) {
          plant.state.alive = false;
        }
      }

      const targetBio = this.getBioState(target);
      if (targetBio) {
        targetBio.state.health = clamp01_100(targetBio.state.health - amount);
      }
    }
  }

  private handleAttack(event: Simulation.Event<any>) {
    const { targetId, damage } = event.payload as { targetId: string; damage: number };
    const target = this.world.getNode(targetId);
    if (!target) return;

    const bio = this.getBioState(target);
    if (bio) {
      bio.state.health = clamp01_100(bio.state.health - damage);
      bio.state.stress = clamp01_100(bio.state.stress + damage * 0.4);
    }

    if (event.sourceId) {
      const source = this.world.getNode(event.sourceId);
      const sourceBio = source ? this.getBioState(source) : undefined;
      if (sourceBio) {
        sourceBio.state.energy = clamp01_100(sourceBio.state.energy - damage * 0.2);
        sourceBio.state.stress = clamp01_100(sourceBio.state.stress + damage * 0.1);
      }
    }
  }

  private handleMate(event: Simulation.Event<any>) {
    const { targetId } = event.payload as { targetId: string };
    const source = event.sourceId ? this.world.getNode(event.sourceId) : undefined;
    const target = this.world.getNode(targetId);

    const sourceBio = source ? this.getBioState(source) : undefined;
    const targetBio = target ? this.getBioState(target) : undefined;

    if (sourceBio) {
      sourceBio.state.energy = clamp01_100(sourceBio.state.energy - 5);
      sourceBio.state.stress = clamp01_100(sourceBio.state.stress - 3);
    }
    if (targetBio) {
      targetBio.state.energy = clamp01_100(targetBio.state.energy - 5);
      targetBio.state.stress = clamp01_100(targetBio.state.stress - 3);
    }

    if (source && target) {
      this.publish(new Biological.EntitySpawn('Creature', 0, 0, source.id));
    }
  }

  private handleCommunicate(event: Simulation.Event<any>) {
    const { targetId } = event.payload as { targetId?: string };
    if (!targetId) return;
    const target = this.world.getNode(targetId);
    const targetBio = target ? this.getBioState(target) : undefined;
    if (targetBio) {
      targetBio.state.stress = clamp01_100(targetBio.state.stress - 1);
    }
  }

  private getBioState(node: NodeInterface): BioStateComponent | undefined {
    return node.components.get('BioState') as BioStateComponent | undefined;
  }
}

function clamp01_100(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
