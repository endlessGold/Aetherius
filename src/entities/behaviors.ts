import { BehaviorNode, SystemEvent, Entity, UpdateContext } from './assembly.js';
import { WeatherData, PlantData, CreatureData, DroneData, CorpseData } from '../components/entityData.js';
import { EnvLayer } from '../core/environment/environmentGrid.js';
import { photosynthesis, absorbWater, metabolism, randomWalk, agingProcess, keepBounds, wildfire, floodDamage, huntPrey } from './behaviorFunctions.js';
import { universeRegistry } from '../core/space/universeRegistry.js';
import { promises as fs } from 'fs';
import path from 'path';

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
        this.use(wildfire);
        this.use(floodDamage);

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
        this.use(floodDamage);
        this.use(huntPrey);
    }

}

export class DroneBehavior extends BehaviorNode<DroneData> {
    constructor(components: DroneData) {
        super(components);

        this.on(SystemEvent.ListenUpdate, (c, context) => {
            if (c.energy.energy <= 0) return;

            const speed = c.mission.mode === 'survey' ? 2.5 : 1.5;
            c.position.x += (Math.random() - 0.5) * speed * context.deltaTime;
            c.position.y += (Math.random() - 0.5) * speed * context.deltaTime;
            c.position.x = Math.max(0, Math.min(100, c.position.x));
            c.position.y = Math.max(0, Math.min(100, c.position.y));

            c.energy.energy = Math.max(0, c.energy.energy - 0.02 * context.deltaTime);

            if (context.world.tickCount - c.camera.lastShotTick >= c.camera.intervalTicks) {
                c.camera.lastShotTick = context.world.tickCount;
                this.capture(context).catch(() => {});
            }

            if (c.intervention.enabled && context.world.tickCount - c.intervention.lastTick >= c.intervention.intervalTicks) {
                c.intervention.lastTick = context.world.tickCount;
                this.intervene(context);
            }
        });
    }

    private async capture(context: UpdateContext) {
        const c = this.components;
        const env = context.world.environment;

        const temperature = env.get(c.position.x, c.position.y, EnvLayer.Temperature);
        const moisture = env.get(c.position.x, c.position.y, EnvLayer.SoilMoisture);
        const light = env.get(c.position.x, c.position.y, EnvLayer.LightIntensity);

        const handle = universeRegistry.getWorld(context.world.id);
        const entities = handle?.manager.entities ?? [];
        const near = entities
            .map((e: any) => e.children?.[0]?.components)
            .filter((comp: any) => comp?.position)
            .filter((comp: any) => {
                const dx = comp.position.x - c.position.x;
                const dy = comp.position.y - c.position.y;
                return Math.sqrt(dx * dx + dy * dy) <= c.camera.radius;
            });

        const plants = near.filter((comp: any) => Boolean(comp.growth)).length;
        const creatures = near.filter((comp: any) => Boolean(comp.goalGA)).length;

        const clip = {
            kind: 'documentary_clip',
            worldId: context.world.id,
            tick: context.world.tickCount,
            droneId: this.id,
            owner: c.identity.owner,
            role: c.identity.role,
            mission: c.mission,
            position: { x: c.position.x, y: c.position.y },
            env: { temperature, moisture, light },
            nearby: { total: near.length, plants, creatures }
        };

        await context.world.persistence.saveWorldEvent({
            worldId: context.world.id,
            tick: context.world.tickCount,
            type: 'OTHER',
            location: { x: c.position.x, y: c.position.y },
            details: JSON.stringify(clip)
        });

        const dir = path.join(process.cwd(), 'data', 'reports');
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, 'documentary.jsonl');
        await fs.appendFile(file, `${JSON.stringify(clip)}\n`, 'utf8');
    }

    private intervene(context: UpdateContext) {
        const c = this.components;
        const env = context.world.environment;

        const mode = c.mission.mode;
        if (mode === 'irrigate') {
            env.add(c.position.x, c.position.y, EnvLayer.SoilMoisture, 2);
            return;
        }
        if (mode === 'cool') {
            env.add(c.position.x, c.position.y, EnvLayer.Temperature, -1);
            return;
        }
        if (mode === 'heat') {
            env.add(c.position.x, c.position.y, EnvLayer.Temperature, 1);
            return;
        }
        if (mode === 'seed_place') {
            const maze = (context.world as any).mazeSystem?.network;
            if (maze?.createNode) maze.createNode(c.position.x, c.position.y);
            return;
        }
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

export class DroneEntity extends Entity<BehaviorNode<DroneData>> {
    constructor(id: string) {
        super(id);
    }
}

export class CorpseBehavior extends BehaviorNode<CorpseData> {
    constructor(components: CorpseData) {
        super(components);
    }
}

export class CorpseEntity extends Entity<BehaviorNode<CorpseData>> {
    constructor(id: string) {
        super(id);
    }
}
