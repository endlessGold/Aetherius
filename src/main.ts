import { World } from './core/world.js';
import { Entity } from './core/node.js';
import { WeatherComponent, PlantComponent, GoalGAComponent } from './components/basicComponents.js';
import { CommandHandler } from './interface/commandHandler.js';
import { CLI } from './interface/cli.js';
import { Server } from './interface/server.js';

async function main() {
  console.log("🌌 Initializing Aetherius Engine Core...");

  // Create Global Weather Entity (The environment controller)
  const weatherEntity = new Entity("global_weather");
  const weatherComp = new WeatherComponent();
  weatherEntity.addComponent(weatherComp);

  const world = new World("Alpha", {
    tickPayloadProvider: () => ({
      environment: {
        soilMoisture:
          weatherComp.state.condition === 'Rainy' || weatherComp.state.condition === 'Stormy'
            ? 80
            : weatherComp.state.condition === 'Drought'
              ? 10
              : 40,
        light: weatherComp.state.sunlightIntensity || 100,
        temperature: weatherComp.state.temperature,
        soilNutrients: 50,
        co2Level: weatherComp.state.co2Level || 400,
        windSpeed: weatherComp.state.windSpeed || 0,
        humidity: weatherComp.state.humidity || 50
      }
    })
  });
  world.addNode(weatherEntity);


  // Pre-seed some entities for testing
  const plantA = new Entity("Plant_A_Ideal");
  plantA.addComponent(new PlantComponent("Sunflower_A"));
  world.addNode(plantA);

  const gaA = new Entity("GA_Alpha");
  gaA.addComponent(new GoalGAComponent({ position: { x: 10, y: 10 } }));
  world.addNode(gaA);

  // 2. Setup Command Handler (Virtual Command Layer)
  const commandHandler = new CommandHandler(world, weatherEntity);

  // 3. Determine Mode
  const args = process.argv.slice(2);
  const modeArg = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'cli';

  if (modeArg === 'server') {
    // Server Mode
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = new Server(commandHandler, port);
    server.start();
    // console.log("Server mode temporarily disabled for debugging.");
  } else {
    // CLI Mode (Default)
    const cli = new CLI(commandHandler);
    cli.start();
  }
}

main().catch(err => {
  console.error("Fatal Error:", err);
});
