export * from './weatherComponent.js';
export * from './plantComponent.js';
export * from './goalGaComponent.js';
export * from './bioStateComponent.js';
export * from './actionParamsComponent.js';

import { ComponentBase, Event } from '../core/interfaces.js';
import { System } from '../core/events/eventTypes.js';

export class SpeciesComponent extends ComponentBase<{
  speciesName: string;
  population: number;
  growthRate: number;
}> {
  name = 'Species';

  constructor(speciesName: string, initialPop: number, growthRate: number) {
    super({
      speciesName,
      population: initialPop,
      growthRate
    });
  }

  handleEvent(event: Event): void {
    if (event instanceof System.Tick) {
      // Simple logistic growth or exponential for now
      // pop = pop * (1 + rate)
      const growth = Math.floor(this.state.population * this.state.growthRate);
      this.state.population += growth;

      // Prevent infinite explosion for demo
      if (this.state.population > 1000000) {
        this.state.population = 1000000;
      }
    }
  }
}

export class BasicComponent extends ComponentBase<{}> {
  name = 'Basic';

  constructor() {
    super({});
  }
}
