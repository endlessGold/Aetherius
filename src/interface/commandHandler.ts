import { World } from '../core/world.js';
import { Entity } from '../core/node.js';
import { PlantComponent, WeatherComponent, GoalGAComponent } from '../components/basicComponents.js';
import { v4 as uuidv4 } from 'uuid';
import { EnvLayer } from '../core/environment/environmentGrid.js';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class CommandHandler {
  private world: World;
  private weatherEntity: Entity;

  constructor(world: World, weatherEntity: Entity) {
    this.world = world;
    this.weatherEntity = weatherEntity;
  }

  // Parses and executes a command string or object
  // Command Format: "command_name arg1 arg2 ..."
  public async execute(commandStr: string): Promise<CommandResult> {
    const parts = commandStr.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'advance_tick':
          return this.handleAdvanceTick(args);
        case 'spawn_entity':
          return this.handleSpawnEntity(args);
        case 'change_environment':
          return this.handleChangeEnvironment(args);
        case 'status':
          return this.handleStatus(args);
        case 'inspect_pos':
          return this.handleInspectPos(args);
        case 'help':
          return this.handleHelp();
        default:
          return { success: false, message: `Unknown command: ${command}` };
      }
    } catch (error: any) {
      return { success: false, message: `Error executing command: ${error.message}` };
    }
  }

  private handleAdvanceTick(args: string[]): CommandResult {
    const count = parseInt(args[0], 10) || 1;
    let currentTick = 0; // In a real app, world should track global tick
    
    // Simulate ticks
    for (let i = 0; i < count; i++) {
        // Construct payload. Ideally this comes from the WeatherEntity state.
        const weatherComp = this.weatherEntity.components.get('Weather') as WeatherComponent;
        const envData = this.getEnvironmentData(weatherComp);

        const tickEvent = {
            type: 'Tick',
            payload: { tick: Date.now(), environment: envData }, // Simple timestamp as tick ID for now
            timestamp: Date.now()
        };

        this.world.nodes.forEach(node => node.handleEvent(tickEvent));
    }

    return { success: true, message: `Advanced ${count} ticks.` };
  }

  private handleSpawnEntity(args: string[]): CommandResult {
    const type = args[0]?.toLowerCase();
    const name = args[1] || `Entity_${uuidv4().slice(0, 8)}`;

    if (!type) {
      return { success: false, message: "Usage: spawn_entity <plant|ga|basic> [name]" };
    }

    const entity = new Entity(name);
    
    if (type === 'plant') {
      entity.addComponent(new PlantComponent(name));
    } else if (type === 'ga') {
      const x = Math.floor(Math.random() * this.world.environment.width);
      const y = Math.floor(Math.random() * this.world.environment.height);
      entity.addComponent(
        new GoalGAComponent({
          position: { x, y }
        })
      );
    } else {
      // Basic empty entity or generic
    }

    this.world.addNode(entity);
    return { success: true, message: `Spawned entity '${name}' of type '${type}'.`, data: { id: entity.id } };
  }

  private handleChangeEnvironment(args: string[]): CommandResult {
    if (args.length < 2) {
      return { success: false, message: "Usage: change_environment <parameter> <value>" };
    }

    const key = args[0];
    const value = args[1];

    // Map common CLI keys to WeatherComponent state keys
    // Supported: condition, temp, rain, wind
    const payload: any = {};
    
    switch(key.toLowerCase()) {
        case 'condition': 
            payload.condition = value; // Sunny, Rainy, etc.
            break;
        case 'temp':
        case 'temperature':
            payload.temperature = parseFloat(value);
            break;
        case 'humidity':
            payload.humidity = parseFloat(value);
            break;
        case 'rain':
            payload.precipitation = parseFloat(value);
            break;
        case 'wind':
            payload.windSpeed = parseFloat(value);
            break;
        case 'co2':
            payload.co2Level = parseFloat(value);
            break;
        default:
             return { success: false, message: `Unknown environment parameter: ${key}` };
    }

    this.weatherEntity.handleEvent({
        type: 'ChangeWeather',
        payload: payload,
        timestamp: Date.now()
    });

    return { success: true, message: `Environment '${key}' set to '${value}'.` };
  }

  private handleStatus(args: string[]): CommandResult {
    const targetId = args[0];
    if (targetId) {
        // Find specific entity
        const allNodes = Array.from(this.world.nodes.values());
        const entity = allNodes.find((n: any) => n.id === targetId || n.name === targetId);
        
        if (!entity) return { success: false, message: "Entity not found." };
        
        // Serialize state
        const components: any = {};
        entity.components.forEach((comp: any, key: string) => {
            components[key] = comp.state;
        });

        return { 
            success: true, 
            message: `Status for ${targetId}`, 
            data: { id: entity.id, components } 
        };
    } else {
        // Global status
        const allNodes = Array.from(this.world.nodes.values());
        return { 
            success: true, 
            message: `World '${this.world.id}' contains ${this.world.nodes.size} entities.`,
            data: { 
                nodeCount: this.world.nodes.size,
                nodeIds: allNodes.map((n: any) => n.name || n.id)
            } 
        };
    }
  }

  private handleInspectPos(args: string[]): CommandResult {
    const x = parseInt(args[0]);
    const y = parseInt(args[1]);
    
    if (isNaN(x) || isNaN(y)) {
        return { success: false, message: "Usage: inspect_pos <x> <y>" };
    }

    if (x < 0 || x >= this.world.environment.width || y < 0 || y >= this.world.environment.height) {
        return { success: false, message: "Coordinates out of bounds." };
    }

    const grid = this.world.environment;
    const data = {
        Temperature: grid.get(x, y, EnvLayer.Temperature).toFixed(2) + "°C",
        Humidity: (grid.get(x, y, EnvLayer.Humidity) * 100).toFixed(1) + "%",
        SoilMoisture: (grid.get(x, y, EnvLayer.SoilMoisture) * 100).toFixed(1) + "%",
        Nitrogen: grid.get(x, y, EnvLayer.SoilNitrogen).toFixed(2),
        Light: grid.get(x, y, EnvLayer.LightIntensity).toFixed(0) + " Lux"
    };

    return { 
        success: true, 
        message: `Environment at (${x}, ${y}):`,
        data 
    };
  }

  private handleHelp(): CommandResult {
      return {
          success: true,
          message: `Available commands:
  - advance_tick [count]
  - spawn_entity <type> <name>: Create a new entity (types: plant, ga)
  - change_environment <param> <value>: Change global weather (Legacy)
  - inspect_pos <x> <y>: Check detailed environment at coordinates
  - status [id]: Check entity or world status
  - help`
      };
  }

  // Helper to extract environment for Tick payload
  private getEnvironmentData(weather: WeatherComponent) {
    return {
      soilMoisture: weather.state.condition === 'Rainy' || weather.state.condition === 'Stormy' ? 80 : (weather.state.condition === 'Drought' ? 10 : 40),
      light: weather.state.sunlightIntensity || 100,
      temperature: weather.state.temperature,
      soilNutrients: 50,
      co2Level: weather.state.co2Level || 400,
      windSpeed: weather.state.windSpeed || 0,
      humidity: weather.state.humidity || 50
    };
  }
}
