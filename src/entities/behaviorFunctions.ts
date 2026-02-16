import { BehaviorNode, UpdateContext } from './assembly.js';
import { PlantData, CreatureData } from '../components/entityData.js';
import { EnvLayer } from '../core/environment/environmentGrid.js';

// ======================================================
// Behavior Function Library
// ======================================================

// 1. Biological Functions

// Photosynthesis: Generates energy from light
export function photosynthesis(node: BehaviorNode<PlantData & { energy?: { energy: number } }>, context: UpdateContext): void {
  const components = node.components;
  const light = context.world.environment.get(components.position.x, components.position.y, EnvLayer.LightIntensity);

  if (light > 50 && components.energy) {
    components.energy.energy += 0.1 * context.deltaTime;
  }
}

// Metabolism: Consumes energy for survival
export function metabolism(node: BehaviorNode<CreatureData>, context: UpdateContext): void {
  const components = node.components;

  components.energy.energy -= 0.05 * context.deltaTime;
  if (components.energy.energy <= 0) {
    components.vitality.hp -= 1 * context.deltaTime;
  }
}

// Aging: Increases age over time
export function agingProcess<T extends { age: { age: number } }>(node: BehaviorNode<T>, context: UpdateContext): void {
  const components = node.components;
  components.age.age += 0.001 * context.deltaTime;
}

// 2. Physical/Movement Functions

// Random Walk: Moves randomly if energy permits
export function randomWalk(node: BehaviorNode<CreatureData>, context: UpdateContext): void {
  const components = node.components;

  if (components.energy.energy > 10) {
    components.position.x += (Math.random() - 0.5) * 2 * context.deltaTime;
    components.position.y += (Math.random() - 0.5) * 2 * context.deltaTime;
  }
}

// Keep Bounds: Restricts position to 0-100 range
export function keepBounds<T extends { position: { x: number; y: number } }>(node: BehaviorNode<T>, context: UpdateContext): void {
  const components = node.components;
  components.position.x = Math.max(0, Math.min(100, components.position.x));
  components.position.y = Math.max(0, Math.min(100, components.position.y));
}

// 3. Environmental Functions

// Absorb Water: Absorbs soil moisture to recover HP
export function absorbWater(node: BehaviorNode<PlantData>, context: UpdateContext): void {
  const components = node.components;
  const moisture = context.world.environment.get(components.position.x, components.position.y, EnvLayer.SoilMoisture);

  if (moisture > 20) {
    context.world.environment.add(components.position.x, components.position.y, EnvLayer.SoilMoisture, -0.1);
    components.vitality.hp = Math.min(100, components.vitality.hp + 0.1);
  }
}
