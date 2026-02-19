import { Entity } from '../core/node.js';
import { BioStateComponent } from '../components/bioStateComponent.js';
import { ActionParamsComponent } from '../components/actionParamsComponent.js';
import { DirectionGAComponent } from '../components/directionGaComponent.js';
import { CreatureOptions, EntityFactory } from './blueprints.js';

export class CreatureFactory implements EntityFactory<CreatureOptions> {
  create(id: string, options?: CreatureOptions): Entity {
    const entity = new Entity(id);
    entity.addComponent(new BioStateComponent());
    entity.addComponent(new ActionParamsComponent());
    if (options?.withGoalGA) {
      entity.addComponent(new DirectionGAComponent({ position: options.position ?? { x: 0, y: 0 } }));
    }
    return entity;
  }
}

export function createCreatureEntity(id: string, options?: CreatureOptions): Entity {
  return new CreatureFactory().create(id, options);
}
