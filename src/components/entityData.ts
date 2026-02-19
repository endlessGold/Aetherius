import { DirectionGAState } from './directionGaComponent.js';

export interface Position {
  x: number;
  y: number;
}

export interface Vitality {
  hp: number;
}

export interface Energy {
  energy: number;
}

export interface Age {
  age: number;
}

export interface Growth {
  growthRateBase: number;
  stage: 'seed' | 'sprout' | 'mature' | 'decaying';
}

export interface Species {
  speciesName: string;
}

export interface ClassificationData {
  category: 'Biotic' | 'Abiotic' | 'Hybrid';
  subtype: string;
  material: { organicFraction: number; inorganicFraction: number; waterFraction: number };
  tags?: string[];
}

export interface LifeStageData {
  level: 'Cell' | 'Microbe' | 'Multicellular';
  complexity: number;
  trophicRole: 'Producer' | 'Consumer' | 'Decomposer' | 'Parasite' | 'Symbiont';
}

export interface TaxonomyData {
  domain: 'Prokaryote' | 'Eukaryote' | 'Synthetic';
  kingdom: 'Microbe' | 'Plantae' | 'Animalia' | 'FungiLike' | 'ProtozoaLike';
  clade: string;
  speciesId: string;
  compatibilityKey: string;
  hybridOf?: { a: string; b: string };
}

export interface DiseaseData {
  status: 'S' | 'E' | 'I' | 'R';
  strainId?: string;
  load: number;
  immunity: number;
  incubationTicks: number;
  infectedAtTick?: number;
}

export interface WeatherState {
  condition: 'Sunny' | 'Rainy' | 'Stormy' | 'Cloudy' | 'Drought';
  temperature: number;
  humidity: number;
  windSpeed: number;
  sunlightIntensity: number;
  precipitation: number;
  co2Level?: number;
}

export interface WeatherData {
  weather: WeatherState;
}

export interface PlantData {
  identity: Species;
  growth: Growth;
  vitality: Vitality;
  age: Age;
  position: Position;
  classification?: ClassificationData;
  lifeStage?: LifeStageData;
  taxonomy?: TaxonomyData;
  disease?: DiseaseData;
}

export interface CreatureData {
  position: Position;
  vitality: Vitality;
  energy: Energy;
  age: Age;
  directionGA?: DirectionGAState;
  classification?: ClassificationData;
  lifeStage?: LifeStageData;
  taxonomy?: TaxonomyData;
  disease?: DiseaseData;
}

export interface DroneData {
  identity: { owner: string; role: string };
  position: Position;
  energy: Energy;
  mission: { mode: string; text?: string };
  camera: { intervalTicks: number; radius: number; lastShotTick: number };
  intervention: { intervalTicks: number; lastTick: number; enabled: boolean };
}

export interface CorpseData {
  classification: ClassificationData;
  position: Position;
  biomass: number;
  nutrients: { n: number; p: number; k: number; organicMatter: number };
  pathogenLoad: number;
  decayStage: number;
  createdTick: number;
}

export interface PlaceData {
  identity: { name: string; type: string };
  position: Position;
  environmentRecipeId?: string;
  maze: {
    radius: number;
    activityLevel: number;
    connections: Map<string, number>;
    createdAt: number;
  };
}
