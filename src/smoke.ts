import { World } from './core/world.js';
import { Entity } from './core/node.js';
import { GoalGAComponent, PlantComponent, WeatherComponent } from './components/basicComponents.js';

async function run() {
  const weatherEntity = new Entity('global_weather');
  const weatherComp = new WeatherComponent();
  weatherEntity.addComponent(weatherComp);

  const world = new World('Smoke', {
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

  const plant = new Entity('Plant_Smoke');
  plant.addComponent(new PlantComponent('Plant_Smoke'));
  world.addNode(plant);

  const ga = new Entity('GA_Smoke');
  ga.addComponent(new GoalGAComponent({ position: { x: 10, y: 10 } }));
  world.addNode(ga);

  await world.tick();
  await world.tick();

  const snap = await world.persistence.getLatestSnapshot(world.id);
  console.log(
    JSON.stringify(
      {
        driver: world.persistence.driver,
        tick: snap?.tick,
        nodeCount: snap?.nodes.length,
        predictions: snap?.predictions
      },
      null,
      2
    )
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

