export * from './weatherComponent.js';
export * from './plantComponent.js';
export class SpeciesComponent {
    constructor(speciesName, initialPop, growthRate) {
        this.name = 'Species';
        this.state = {
            speciesName,
            population: initialPop,
            growthRate
        };
    }
    handleEvent(event) {
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
