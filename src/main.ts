import { World } from './core/world.js';
import { Entity } from './core/node.js';
import { SpeciesComponent, WeatherComponent, PlantComponent } from './components/basicComponents.js';
import { v4 as uuidv4 } from 'uuid';

console.log("🌌 Initializing Aetherius Multiverse (Plant Experiment)...");

// 1. Setup World
const world = new World("Alpha");
console.log(`🌍 Setting up World: ${world.id}`);

// 2. Global Weather Entity (Environmental Controller)
const weatherEntity = new Entity("global_weather");
const weatherComp = new WeatherComponent();
weatherEntity.addComponent(weatherComp);
world.addNode(weatherEntity);

// 3. Plant Experiment Entities
// Case A: Ideal Condition
const plantA = new Entity("Plant_A_Ideal");
const plantCompA = new PlantComponent("Sunflower_A");
plantA.addComponent(plantCompA);
world.addNode(plantA);

// Case B: Stress Condition (Drought)
const plantB = new Entity("Plant_B_Stress");
const plantCompB = new PlantComponent("Sunflower_B");
plantB.addComponent(plantCompB);
world.addNode(plantB);


// Helper to inject environment data into Tick
function getEnvironmentData(weather: WeatherComponent) {
  return {
    soilMoisture: weather.state.condition === 'Rainy' || weather.state.condition === 'Stormy' ? 80 : (weather.state.condition === 'Drought' ? 10 : 40),
    light: weather.state.sunlightIntensity,
    temperature: weather.state.temperature,
    soilNutrients: 50, // Static for now
    co2Level: weather.state.co2Level,
    windSpeed: weather.state.windSpeed,
    humidity: weather.state.humidity
  };
}

// 4. Run Simulation
console.log("\n🚀 Starting Plant Growth Experiment (10 Days)...");

async function runSimulation() {
  for (let tick = 1; tick <= 10; tick++) {
    console.log(`\n--- 📅 Day ${tick} ---`);

    // Dynamic Weather Changes
    if (tick === 3) {
      console.log("⚡ [Event] Weather Change: Heavy Rain");
      weatherEntity.handleEvent({
        type: 'ChangeWeather', 
        payload: { condition: 'Rainy', temperature: 18, humidity: 90 }, 
        timestamp: Date.now()
      });
    }
    if (tick === 7) {
      console.log("⚡ [Event] Weather Change: Heat Wave (Drought)");
      weatherEntity.handleEvent({
        type: 'ChangeWeather', 
        payload: { condition: 'Drought', temperature: 38, humidity: 20, sunlightIntensity: 100 }, 
        timestamp: Date.now()
      });
    }

    // Prepare Environment Payload from Weather Entity
    const currentEnv = getEnvironmentData(weatherComp);

    // Manual Tick with Environment Payload
    // Note: In a real engine, the World would aggregate this automatically.
    // Here we manually broadcast the Tick with the environment data.
    
    // We override the default world.tick() behavior slightly to inject payload
    // Or we just rely on world.tick() if we modify world.ts.
    // For now, let's manually dispatch to all nodes to ensure payload delivery.
    
    const tickEvent = { 
      type: 'Tick', 
      payload: { 
        tick, 
        environment: currentEnv 
      }, 
      timestamp: Date.now() 
    };

    // Propagate manually to ensure environment data is passed
    // (In future, World.tick() should accept payload)
    world.nodes.forEach(node => node.handleEvent(tickEvent));

    // Report Status
    logPlantStatus(plantCompA, "A (Ideal-ish)");
    logPlantStatus(plantCompB, "B (Identical Start)");
  }
  
  console.log("\n🏁 Experiment Complete.");
}

function logPlantStatus(plant: PlantComponent, label: string) {
  console.log(`[${label}] Height: ${plant.state.height.toFixed(2)}cm | Health: ${plant.state.health.toFixed(1)} | Stress(D/F): ${plant.state.droughtStress.toFixed(1)}/${plant.state.frostStress.toFixed(1)}`);
}

runSimulation();
