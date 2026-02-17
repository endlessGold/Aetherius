import { Entity, AssembleManager } from './assembly.js';
import { PlantEntity, CreatureEntity, WeatherEntity, DroneEntity, CorpseEntity, PlantBehavior, CreatureBehavior, WeatherBehavior, DroneBehavior, CorpseBehavior } from './behaviors.js';
import { PlantData, CreatureData, WeatherData, DroneData, CorpseData } from '../components/entityData.js';
import { NameGenerator } from '../ai/nameGenerator.js';

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
    const nameGen = new NameGenerator(999);
    const generatedNames = new Set<string>();

    const getUniqueName = (generator: () => string): string => {
        let name = generator();
        let attempts = 0;
        while (generatedNames.has(name) && attempts < 10) {
            name = generator();
            attempts++;
        }
        if (generatedNames.has(name)) {
            name = `${name}_${pad3(generatedNames.size)}`;
        }
        generatedNames.add(name);
        return name;
    };

    range(60).forEach((i) => {
        const speciesName = getUniqueName(() => nameGen.generatePlantName());
        // We use the generated name as the key, but also keep a legacy-style key or alias if needed
        // For now, let's just use the generated name as the primary key.
        // But main.ts asks for 'Plant_Species_001', so we need to maintain compatibility or update main.ts
        // Let's register BOTH keys to be safe.
        const legacyKey = `Plant_Species_${pad3(i)}`;

        const rate = 0.3 + (i % 10) * 0.05;

        const factory: FactoryFn = (id) =>
            manager.createEntity(
                PlantEntity,
                id,
                [],
                [{
                    NodeClass: PlantBehavior,
                    components: {
                        identity: {
                            speciesName: speciesName
                        },
                        classification: {
                            category: 'Biotic',
                            subtype: 'Plant',
                            material: { organicFraction: 0.9, inorganicFraction: 0.05, waterFraction: 0.05 },
                            tags: ['multicellular', 'producer']
                        },
                        lifeStage: { level: 'Multicellular', complexity: 0.6, trophicRole: 'Producer' },
                        taxonomy: {
                            domain: 'Eukaryote',
                            kingdom: 'Plantae',
                            clade: 'ProceduralPlant',
                            speciesId: legacyKey,
                            compatibilityKey: `Plantae:${legacyKey}`
                        },
                        disease: { status: 'S', load: 0, immunity: 0.2, incubationTicks: 0 },
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
            );

        m.set(legacyKey, factory);
        m.set(speciesName, factory);
    });

    range(40).forEach((i) => {
        const speciesName = getUniqueName(() => nameGen.generateCreatureName());
        const legacyKey = `Creature_Type_${pad3(i)}`;

        const x = (i * 13) % 100;
        const y = (i * 7) % 100;

        // Randomize initial stats slightly
        const energyEfficiency = 0.3 + Math.random() * 0.1;

        const factory: FactoryFn = (id) =>
            manager.createEntity(
                CreatureEntity,
                id,
                [],
                [{
                    NodeClass: CreatureBehavior,
                    components: {
                        position: { x, y },
                        classification: {
                            category: 'Biotic',
                            subtype: 'Creature',
                            material: { organicFraction: 0.85, inorganicFraction: 0.05, waterFraction: 0.1 },
                            tags: ['multicellular', 'consumer']
                        },
                        lifeStage: { level: 'Multicellular', complexity: 0.7, trophicRole: 'Consumer' },
                        taxonomy: {
                            domain: 'Eukaryote',
                            kingdom: 'Animalia',
                            clade: 'ProceduralCreature',
                            speciesId: legacyKey,
                            compatibilityKey: `Animalia:${legacyKey}`
                        },
                        disease: { status: 'S', load: 0, immunity: 0.15, incubationTicks: 0 },
                        vitality: {
                            hp: 100
                        },
                        energy: {
                            energy: 100
                        },
                        age: {
                            age: 0
                        },
                        goalGA: {
                            genome: {
                                weights: {
                                    survive: 0.3 + Math.random() * 0.1,
                                    grow: 0.3 + Math.random() * 0.1,
                                    explore: 0.3 + Math.random() * 0.1
                                },
                                mutationRate: 0.05
                            },
                            purpose: { kind: 'Survive', target: 1 },
                            physiology: { energy: 100, hydration: 100 },
                            growth: { biomass: 0 },
                            position: { x, y },
                            metrics: { ageTicks: 0, fitness: 0, purposeAchievement: 0, lastAction: 'Init' }
                        }
                    } as CreatureData
                }]
            );

        m.set(legacyKey, factory);
        m.set(speciesName, factory);
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
                        classification: {
                            category: 'Biotic',
                            subtype: 'Microbe',
                            material: { organicFraction: 0.6, inorganicFraction: 0.1, waterFraction: 0.3 },
                            tags: ['cellular', 'microbial', 'decomposer']
                        },
                        lifeStage: { level: 'Microbe', complexity: 0.15, trophicRole: 'Decomposer' },
                        taxonomy: {
                            domain: 'Prokaryote',
                            kingdom: 'Microbe',
                            clade: 'ProceduralMicrobe',
                            speciesId: key,
                            compatibilityKey: `Microbe:${key}`
                        },
                        disease: { status: 'S', load: 0, immunity: 0.05, incubationTicks: 0 },
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

    m.set('Drone_Observer_001', (id) =>
        manager.createEntity(
            DroneEntity,
            id,
            [],
            [{
                NodeClass: DroneBehavior,
                components: {
                    identity: { owner: 'Scientist', role: 'Observer' },
                    position: { x: Math.random() * 100, y: Math.random() * 100 },
                    energy: { energy: 100 },
                    mission: { mode: 'survey' },
                    camera: { intervalTicks: 20, radius: 10, lastShotTick: 0 },
                    intervention: { intervalTicks: 30, lastTick: 0, enabled: false }
                } as DroneData
            }]
        )
    );

    m.set('Corpse_Organic_001', (id) =>
        manager.createEntity(
            CorpseEntity,
            id,
            [],
            [{
                NodeClass: CorpseBehavior,
                components: {
                    classification: {
                        category: 'Hybrid',
                        subtype: 'Corpse',
                        material: { organicFraction: 0.8, inorganicFraction: 0.05, waterFraction: 0.15 },
                        tags: ['detritus']
                    },
                    position: { x: 0, y: 0 },
                    biomass: 10,
                    nutrients: { n: 1, p: 0.5, k: 0.5, organicMatter: 5 },
                    pathogenLoad: 0,
                    decayStage: 0,
                    createdTick: 0
                } as CorpseData
            }]
        )
    );

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
