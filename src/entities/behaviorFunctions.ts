
// 4. Catastrophe Functions (재앙)

// Wildfire: Burns if temperature is high and moisture is low
export function wildfire(node: BehaviorNode<PlantData>, context: UpdateContext): void {
  const components = node.components;
  const temp = context.world.environment.get(components.position.x, components.position.y, EnvLayer.Temperature);
  const moisture = context.world.environment.get(components.position.x, components.position.y, EnvLayer.SoilMoisture);

  // Ignition condition: High temp (>35) & Low moisture (<10)
  if (temp > 35 && moisture < 10) {
    if (Math.random() < 0.01) { // 1% chance per tick to ignite
      console.log(`🔥 [WILDFIRE] Plant ${node.id} caught fire at (${components.position.x.toFixed(1)}, ${components.position.y.toFixed(1)})!`);
      components.vitality.hp -= 20 * context.deltaTime;

      // Heat up surrounding area
      context.world.environment.add(components.position.x, components.position.y, EnvLayer.Temperature, 5);
    }
  }
}

// Flood: Damages if too much water
export function floodDamage(node: BehaviorNode<PlantData | CreatureData>, context: UpdateContext): void {
  const components = node.components;
  const moisture = context.world.environment.get(components.position.x, components.position.y, EnvLayer.SoilMoisture);

  if (moisture > 90) {
    if (Math.random() < 0.05) {
      console.log(`🌊 [FLOOD] Entity ${node.id} is drowning at (${components.position.x.toFixed(1)}, ${components.position.y.toFixed(1)})!`);
      components.vitality.hp -= 5 * context.deltaTime;
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
      console.log(`🍖 [HUNT] Predator ${node.id} caught prey!`);
      c.energy.energy += 50;
    }
  }
}
