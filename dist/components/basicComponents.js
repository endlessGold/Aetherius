export * from './weatherComponent.js';
export * from './plantComponent.js';
export * from './goalGaComponent.js';
export * from './bioStateComponent.js';
export * from './actionParamsComponent.js';
import { ComponentBase } from '../core/interfaces.js';
import { System } from '../core/events/eventTypes.js';
export class SpeciesComponent extends ComponentBase {
    constructor(speciesName, initialPop, growthRate) {
        super({
            speciesName,
            population: initialPop,
            growthRate
        });
        this.name = 'Species';
    }
    handleEvent(event) {
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
export class BasicComponent extends ComponentBase {
    constructor() {
        super({});
        this.name = 'Basic';
    }
}
