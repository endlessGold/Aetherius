import { Entity } from '../core/node.js';
import { PlantComponent } from '../components/plantComponent.js';
import { BioStateComponent } from '../components/bioStateComponent.js';
import { ActionParamsComponent } from '../components/actionParamsComponent.js';
import { PlantOptions, EntityFactory } from './blueprints.js';

export class PlantFactory implements EntityFactory<PlantOptions> {
  create(id: string, options?: PlantOptions): Entity {
    const entity = new Entity(id);
    entity.addComponent(new PlantComponent(options?.speciesName ?? 'GenericPlant', options?.growthRateBase ?? 0.5));
    entity.addComponent(new BioStateComponent());
    entity.addComponent(new ActionParamsComponent());
    return entity;
  }
}

export function createPlantEntity(id: string, options?: PlantOptions): Entity {
  return new PlantFactory().create(id, options);
}

