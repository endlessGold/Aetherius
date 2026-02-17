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

// 4. Catastrophe Functions (재앙)

// Wildfire: Burns if temperature is high and moisture is low
export function wildfire(node: BehaviorNode<PlantData>, context: UpdateContext): void {
  const components = node.components;
  const temp = context.world.environment.get(components.position.x, components.position.y, EnvLayer.Temperature);
  const moisture = context.world.environment.get(components.position.x, components.position.y, EnvLayer.SoilMoisture);

  // Ignition condition: High temp (>35) & Low moisture (<10)
  if (temp > 35 && moisture < 10) {
    if (Math.random() < 0.01) { // 1% chance per tick to ignite
      const details = `Plant ${node.id} caught fire at (${components.position.x.toFixed(1)}, ${components.position.y.toFixed(1)})`;
      console.log(`🔥 [WILDFIRE] ${details}`);
      components.vitality.hp -= 20 * context.deltaTime;

      // Heat up surrounding area
      context.world.environment.add(components.position.x, components.position.y, EnvLayer.Temperature, 5);

      // Save Event
      context.world.persistence.saveWorldEvent({
        worldId: context.world.id,
        tick: context.world.tickCount,
        type: 'WILDFIRE',
        location: { x: components.position.x, y: components.position.y },
        details
      }).catch(err => console.error(err));
      
      console.log(`\n🚨 BREAKING NEWS: INFERNO ERUPTS! 🚨\n"${details}" - Witnesses say it's hot!`);
    }
  }
}

// Flood: Damages if too much water
export function floodDamage(node: BehaviorNode<any>, context: UpdateContext): void {
  const components = node.components;
  const moisture = context.world.environment.get(components.position.x, components.position.y, EnvLayer.SoilMoisture);

  if (moisture > 90 && components.vitality) {
    if (Math.random() < 0.05) {
      const details = `Entity ${node.id} is drowning at (${components.position.x.toFixed(1)}, ${components.position.y.toFixed(1)})`;
      console.log(`🌊 [FLOOD] ${details}`);
      components.vitality.hp -= 5 * context.deltaTime;

      context.world.persistence.saveWorldEvent({
        worldId: context.world.id,
        tick: context.world.tickCount,
        type: 'FLOOD',
        location: { x: components.position.x, y: components.position.y },
        details
      }).catch(err => console.error(err));

      console.log(`\n☔ WEATHER ALERT: MASSIVE FLOODING! ☔\n"${details}" - Bring an umbrella!`);
    }
  }
}

// 5. Special Entity Functions

// Carnivore Hunting: Attack nearby creatures
export function huntPrey(node: BehaviorNode<CreatureData>, context: UpdateContext): void {
  // This requires access to other entities, which we don't have efficiently yet.
  // For now, we simulate hunting success randomly if energy is low
  const c = node.components;
  if (c.energy.energy < 30) {
    if (Math.random() < 0.02) {
      const details = `Predator ${node.id} caught prey!`;
      console.log(`🍖 [HUNT] ${details}`);
      c.energy.energy += 50;

      context.world.persistence.saveWorldEvent({
        worldId: context.world.id,
        tick: context.world.tickCount,
        type: 'HUNT',
        location: { x: c.position.x, y: c.position.y },
        details
      }).catch(err => console.error(err));

      console.log(`\n⚔️ NATURE IS METAL: HUNT SUCCESSFUL! ⚔️\n"${details}" - Survival of the fittest!`);
    }
  }
}
