import { Entity } from '../core/node.js';
import { WeatherComponent } from '../components/weatherComponent.js';
import { WeatherControllerOptions, EntityFactory } from './blueprints.js';

export class WeatherControllerFactory implements EntityFactory<WeatherControllerOptions> {
  create(id: string, options?: WeatherControllerOptions): Entity {
    const entity = new Entity(id);
    const weather = new WeatherComponent();
    if (options) {
      weather.state = { ...weather.state, ...options } as any;
    }
    entity.addComponent(weather);
    return entity;
  }
}

export function createWeatherControllerEntity(id: string, options?: WeatherControllerOptions): Entity {
  return new WeatherControllerFactory().create(id, options);
}

