export * from './weatherComponent.js';
export * from './plantComponent.js';
export * from './goalGaComponent.js';

import { Component, Event } from '../core/interfaces.js';

export class SpeciesComponent implements Component {
  name = 'Species';
  state: {
    speciesName: string;
    population: number;
    growthRate: number;
  };

  constructor(speciesName: string, initialPop: number, growthRate: number) {
    this.state = {
      speciesName,
      population: initialPop,
      growthRate
    };
  }

  handleEvent(event: Event): void {
    if (event.type === 'Tick') {
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
