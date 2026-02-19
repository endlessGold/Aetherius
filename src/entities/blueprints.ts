import { Entity } from '../core/node.js';

export interface EntityFactory<TOptions = unknown> {
  create(id: string, options?: TOptions): Entity;
}

export type PlantOptions = {
  speciesName?: string;
  growthRateBase?: number;
};

export type CreatureOptions = {
  withGoalGA?: boolean;
  position?: { x: number; y: number };
};

export type WeatherControllerOptions = {
  condition?: 'Sunny' | 'Rainy' | 'Stormy' | 'Cloudy' | 'Drought';
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  co2Level?: number;
  sunlightIntensity?: number;
  precipitation?: number;
};

