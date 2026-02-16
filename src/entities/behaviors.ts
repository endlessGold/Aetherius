import { BehaviorNode, SystemEvent, Entity, UpdateContext } from './assembly.js';
import { WeatherData, PlantData, CreatureData } from '../components/entityData.js';
import { EnvLayer } from '../core/environment/environmentGrid.js';
import { photosynthesis, absorbWater, metabolism, randomWalk, agingProcess, keepBounds } from './behaviorFunctions.js';

// ======================================================
// Behavior Implementations
// ======================================================

export class WeatherBehavior extends BehaviorNode<WeatherData> {
    constructor(components: WeatherData) {
        super(components);
        this.on(SystemEvent.ListenUpdate, (c, context) => {
            // Weather affects global environment state in a simplified way
            // In a full simulation, this might apply changes to the grid over time

            // Example: Fluctuate temperature slightly
            if (Math.random() < 0.05) {
                c.weather.temperature += (Math.random() - 0.5) * 0.2 * context.deltaTime;
            }

            // Sync some global state if needed, or just let other systems query this entity
            // For now, we assume the World's tickPayloadProvider reads from this component as set up in main.ts
        });
    }

}

export class PlantBehavior extends BehaviorNode<PlantData> {
    constructor(components: PlantData) {
        super(components);
        
        // Use composable behavior functions
        this.use(photosynthesis);
        this.use(absorbWater);
        this.use(agingProcess);
        
        // Custom Logic specific to this plant (e.g., stage progression)
        this.on(SystemEvent.ListenUpdate, (c, context) => {
             if (c.vitality.hp <= 0) return;

             // Stage progression logic remains here as it's specific to this plant type for now
            if (c.age.age > 10 && c.growth.stage === 'seed') c.growth.stage = 'sprout';
            if (c.age.age > 50 && c.growth.stage === 'sprout') c.growth.stage = 'mature';
            if (c.age.age > 100) {
                c.growth.stage = 'decaying';
                c.vitality.hp -= 1 * context.deltaTime;
            }
        });
    }

}

export class CreatureBehavior extends BehaviorNode<CreatureData> {
    constructor(components: CreatureData) {
        super(components);
        
        // Use composable behavior functions
        this.use(metabolism);
        this.use(agingProcess);
        this.use(randomWalk);
        this.use(keepBounds);
    }

}

// ======================================================
// Concrete Entities
// ======================================================

export class WeatherEntity extends Entity<BehaviorNode<WeatherData>> {
    constructor(id: string) {
        super(id);
    }
}

export class PlantEntity extends Entity<BehaviorNode<PlantData>> {
    constructor(id: string) {
        super(id);
    }
}

export class CreatureEntity extends Entity<BehaviorNode<CreatureData>> {
    constructor(id: string) {
        super(id);
    }
}
