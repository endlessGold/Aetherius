import { Entity, AssembleManager } from './assembly.js';
import { PlantEntity, CreatureEntity, WeatherEntity, PlantBehavior, CreatureBehavior, WeatherBehavior } from './behaviors.js';
import { PlantData, CreatureData, WeatherData } from '../components/entityData.js';

// Global AssembleManager instance
export const assembleManager = AssembleManager.getInstance();

type FactoryFn = (id: string) => Entity<any>;

function range(n: number): number[] {
    const a: number[] = [];
    for (let i = 1; i <= n; i++) a.push(i);
    return a;
}

function pad3(i: number): string {
    return String(i).padStart(3, '0');
}

function buildCatalog(manager: AssembleManager): Map<string, FactoryFn> {
    const m = new Map<string, FactoryFn>();

    range(60).forEach((i) => {
        const key = `Plant_Species_${pad3(i)}`;
        const rate = 0.3 + (i % 10) * 0.05;
        m.set(key, (id) =>
            manager.createEntity(
                PlantEntity,
                id,
                [],
                [{
                    NodeClass: PlantBehavior,
                    components: {
                        identity: {
                            speciesName: key
                        },
                        growth: {
                            growthRateBase: rate,
                            stage: 'seed'
                        },
                        vitality: {
                            hp: 100
                        },
                        age: {
                            age: 0
                        },
                        position: {
                            x: 0,
                            y: 0
                        }
                    } as PlantData
                }]
            )
        );
    });

    range(40).forEach((i) => {
        const key = `Creature_Type_${pad3(i)}`;
        const x = (i * 13) % 100;
        const y = (i * 7) % 100;
        m.set(key, (id) =>
            manager.createEntity(
                CreatureEntity,
                id,
                [],
                [{
                    NodeClass: CreatureBehavior,
                    components: {
                        position: { x, y },
                        vitality: {
                            hp: 100
                        },
                        energy: {
                            energy: 100
                        },
                        age: {
                            age: 0
                        }
                    } as CreatureData
                }]
            )
        );
    });

    const weatherPresets: Array<WeatherData['weather'] & { name: string }> = [
        { name: 'Weather_Sunny_001', condition: 'Sunny', temperature: 28, humidity: 40, windSpeed: 2, sunlightIntensity: 100, precipitation: 0 },
        { name: 'Weather_Cloudy_001', condition: 'Cloudy', temperature: 22, humidity: 60, windSpeed: 3, sunlightIntensity: 60, precipitation: 0 },
        { name: 'Weather_Rainy_001', condition: 'Rainy', temperature: 20, humidity: 85, windSpeed: 5, sunlightIntensity: 40, precipitation: 15 },
        { name: 'Weather_Stormy_001', condition: 'Stormy', temperature: 18, humidity: 90, windSpeed: 12, sunlightIntensity: 30, precipitation: 40 },
        { name: 'Weather_Drought_001', condition: 'Drought', temperature: 35, humidity: 20, windSpeed: 4, sunlightIntensity: 95, precipitation: 0 },
        { name: 'Weather_Sunny_002', condition: 'Sunny', temperature: 30, humidity: 35, windSpeed: 1, sunlightIntensity: 100, precipitation: 0 },
        { name: 'Weather_Cloudy_002', condition: 'Cloudy', temperature: 19, humidity: 65, windSpeed: 2, sunlightIntensity: 55, precipitation: 0 },
        { name: 'Weather_Rainy_002', condition: 'Rainy', temperature: 17, humidity: 92, windSpeed: 6, sunlightIntensity: 35, precipitation: 25 },
        { name: 'Weather_Stormy_002', condition: 'Stormy', temperature: 16, humidity: 93, windSpeed: 14, sunlightIntensity: 25, precipitation: 50 },
        { name: 'Weather_Drought_002', condition: 'Drought', temperature: 38, humidity: 15, windSpeed: 3, sunlightIntensity: 100, precipitation: 0 }
    ];

    weatherPresets.forEach((p) => {
        m.set(p.name, (id) =>
            manager.createEntity(
                WeatherEntity,
                id,
                [],
                [{
                    NodeClass: WeatherBehavior,
                    components: {
                        weather: {
                            condition: p.condition,
                            temperature: p.temperature,
                            humidity: p.humidity,
                            windSpeed: p.windSpeed,
                            sunlightIntensity: p.sunlightIntensity,
                            precipitation: p.precipitation,
                            co2Level: p.co2Level
                        }
                    } as WeatherData
                }]
            )
        );
    });

    range(20).forEach((i) => {
        const key = `Microbe_Type_${pad3(i)}`;
        m.set(key, (id) =>
            manager.createEntity(
                CreatureEntity,
                id,
                [],
                [{
                    NodeClass: CreatureBehavior,
                    components: {
                        position: { x: 0, y: 0 },
                        vitality: {
                            hp: 10
                        },
                        energy: {
                            energy: 50
                        },
                        age: {
                            age: 0
                        }
                    } as CreatureData
                }]
            )
        );
    });

    return m;
}

const catalogCache = new WeakMap<AssembleManager, Map<string, FactoryFn>>();

function getCatalog(manager: AssembleManager): Map<string, FactoryFn> {
    const existing = catalogCache.get(manager);
    if (existing) return existing;
    const catalog = buildCatalog(manager);
    catalogCache.set(manager, catalog);
    return catalog;
}

const catalog = getCatalog(assembleManager);

export function getAssemblyTypes(): string[] {
    return Array.from(catalog.keys());
}

export function createEntityByAssembly(type: string, id: string): Entity<any> {
    const f = catalog.get(type);
    if (!f) throw new Error(`Unknown assembly type: ${type}`);
    return f(id);
}

export function createEntityByAssemblyWithManager(manager: AssembleManager, type: string, id: string): Entity<any> {
    const f = getCatalog(manager).get(type);
    if (!f) throw new Error(`Unknown assembly type: ${type}`);
    return f(id);
}

// Deprecated or Aliased for compatibility
export function createAssemblyByType(type: string, id: string): Entity<any> {
    return createEntityByAssembly(type, id);
}
