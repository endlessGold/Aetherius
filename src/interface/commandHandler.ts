import { World } from '../core/world.js';
import { Entity } from '../core/node.js';
import { createEntityByAssemblyWithManager } from '../entities/catalog.js';
import { v4 as uuidv4 } from 'uuid';
import { EnvLayer } from '../core/environment/environmentGrid.js';
import { Environment, System } from '../core/events/eventTypes.js';
import { WeatherData } from '../components/entityData.js';
import { promises as fs } from 'fs';
import path from 'path';
import { universeRegistry } from '../core/space/universeRegistry.js';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

import { ScienceOrchestrator } from '../ai/orchestrator.js';

export class CommandHandler {
  private world: World;
  private weatherEntity: any; // Use any for new Entity compatibility
  private scienceOrchestrator: ScienceOrchestrator;

  constructor(world: World, weatherEntity: any) {
    this.world = world;
    this.weatherEntity = weatherEntity;
    this.scienceOrchestrator = new ScienceOrchestrator();
  }

  private getManager() {
    return this.world.getAssembleManager();
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
          return await this.handleAdvanceTick(args);
        case 'spawn_entity':
          return this.handleSpawnEntity(args);
        case 'warp_evolution':
          return await this.handleWarpEvolution(args);
        case 'change_environment':
          return this.handleChangeEnvironment(args);
        case 'status':
          return this.handleStatus(args);
        case 'latest_snapshot':
          return await this.handleLatestSnapshot();
        case 'inspect_pos':
          return this.handleInspectPos(args);
        case 'smite':
          return this.handleSmite(args);
        case 'bless':
          return this.handleBless(args);
        case 'flood':
          return this.handleFlood(args);
        case 'ice_age':
          return this.handleIceAge(args);
        case 'meteor':
          return this.handleMeteor(args);
        case 'oracle':
          return this.handleOracle();
        case 'watch':
          return this.handleWatch(args);
        case 'map':
          return this.handleMap(args);
        case 'auto_god':
          return this.handleAutoGod(args);
        case 'explore_loc':
          return this.handleExploreLoc(args);
        case 'ask_science':
          return await this.handleAskScience(args);
        case 'ai_events':
          return this.handleAiEvents(args);
        case 'space':
          return this.handleSpace(args);
        case 'warp':
          return this.handleWarp(args);
        case 'deploy_drone':
          return this.handleDeployDrone(args);
        case 'drones':
          return this.handleDrones(args);
        case 'drone_mission':
          return this.handleDroneMission(args);
        case 'taxonomy':
          return this.handleTaxonomy(args);
        case 'disease_stats':
          return this.handleDiseaseStats(args);
        case 'corpses':
          return this.handleCorpses(args);
        case 'migration_stats':
          return this.handleMigrationStats(args);
        case 'help':
          return this.handleHelp();
        default:
          return { success: false, message: `Unknown command: ${command}. The heavens are silent.` };
      }
    } catch (error: any) {
      return { success: false, message: `Divine intervention failed: ${error.message}` };
    }
  }

  private async handleAdvanceTick(args: string[]): Promise<CommandResult> {
    const count = parseInt(args[0], 10) || 1;
    for (let i = 0; i < count; i++) {
      await this.world.tick();
    }
    return { success: true, message: `Advanced ${count} ticks. (worldTick=${this.world.tickCount})` };
  }

  private async handleWarpEvolution(args: string[]): Promise<CommandResult> {
    const ticks = parseInt(args[0], 10) || 1000;
    console.log(`⏳ Warping time by ${ticks} ticks... (Simulating Evolution)`);

    const startTime = Date.now();
    const updateInterval = Math.max(1, Math.floor(ticks / 20)); // Update every 5%

    // Fast-forward loop (minimal logging is handled by systems themselves)
    for (let i = 0; i < ticks; i++) {
      await this.world.tick();

      if (i % updateInterval === 0 || i === ticks - 1) {
        const progress = Math.round(((i + 1) / ticks) * 100);
        const bar = '█'.repeat(Math.floor(progress / 5)).padEnd(20, '░');
        // Use process.stdout.write to update on same line if possible, but standard log is safer for now
        // Clear line char might not work in all terminals, so we just log progress
        // Or we can try to be fancy with \r
        if (typeof process !== 'undefined' && process.stdout && process.stdout.isTTY) {
          process.stdout.write(`\r[${bar}] ${progress}% (Tick ${i + 1}/${ticks}) `);
        } else {
          // Fallback for non-TTY
          if (progress % 25 === 0) console.log(`[${bar}] ${progress}%`);
        }
      }
    }

    if (typeof process !== 'undefined' && process.stdout && process.stdout.isTTY) {
      process.stdout.write('\n'); // New line after progress bar
    }

    const duration = Date.now() - startTime;
    return {
      success: true,
      message: `⚡ Warped ${ticks} ticks in ${duration}ms. World is now at tick ${this.world.tickCount}. Check logs for evolutionary changes.`
    };
  }

  private handleSpawnEntity(args: string[]): CommandResult {
    const type = args[0]?.toLowerCase();
    const name = args[1] || `Entity_${uuidv4().slice(0, 8)}`;

    if (!type) {
      return { success: false, message: "Usage: spawn_entity <plant|ga|basic> [name]" };
    }

    if (type === 'plant') {
      const entity = createEntityByAssemblyWithManager(this.getManager(), 'Plant_Species_001', name);
      return { success: true, message: `Spawned entity '${name}' of type '${type}'.`, data: { id: entity.id } };
    }

    if (type === 'ga') {
      const entity = createEntityByAssemblyWithManager(this.getManager(), 'Creature_Type_001', name);
      return { success: true, message: `Spawned entity '${name}' of type '${type}'.`, data: { id: entity.id } };
    }

    // Fallback or Basic not fully supported in new system yet
    return { success: false, message: `Entity type '${type}' not supported in new system yet.` };
  }

  private handleChangeEnvironment(args: string[]): CommandResult {
    if (args.length < 2) {
      return { success: false, message: "Usage: change_environment <parameter> <value>" };
    }

    const key = args[0];
    const value = args[1];

    // Access weather component from new Entity structure
    const weatherBehavior = this.weatherEntity.children[0];
    if (!weatherBehavior || !weatherBehavior.components) {
      return { success: false, message: "Weather components not found." };
    }
    const components = weatherBehavior.components as WeatherData;
    const weather = components.weather;

    switch (key.toLowerCase()) {
      case 'condition':
        weather.condition = value as any;
        break;
      case 'temp':
      case 'temperature':
        weather.temperature = parseFloat(value);
        break;
      case 'humidity':
        weather.humidity = parseFloat(value);
        break;
      case 'rain':
        weather.precipitation = parseFloat(value);
        break;
      case 'wind':
        weather.windSpeed = parseFloat(value);
        break;
      case 'co2':
        weather.co2Level = parseFloat(value);
        break;
      default:
        return { success: false, message: `Unknown environment parameter: ${key}` };
    }

    return { success: true, message: `Environment '${key}' set to '${value}'.` };
  }

  private handleStatus(args: string[]): CommandResult {
    const targetId = args[0];
    if (targetId) {
      // Find specific entity in AssembleManager
      const entity = this.getManager().getEntity(targetId);

      if (!entity) return { success: false, message: "Entity not found." };

      // Serialize state from BehaviorNode components
      const components: any = {};
      if (entity.children && entity.children.length > 0) {
        // Assume first child is main behavior
        const behavior = entity.children[0] as any;
        if (behavior.components) {
          Object.assign(components, behavior.components);
        }
      }

      return {
        success: true,
        message: `Status for ${targetId}`,
        data: { id: entity.id, components }
      };
    } else {
      // Global status
      const manager = this.getManager();
      return {
        success: true,
        message: `AssembleManager contains ${manager.entities.length} entities.`,
        data: {
          nodeCount: manager.entities.length,
          nodeIds: manager.entities.map(e => e.id)
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

  private async handleLatestSnapshot(): Promise<CommandResult> {
    const snap = await this.world.persistence.getLatestSnapshot(this.world.id);
    if (!snap) return { success: false, message: 'No snapshot saved yet.' };
    return { success: true, message: `Latest snapshot (driver=${this.world.persistence.driver})`, data: snap };
  }

  private handleSmite(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);
    const radius = parseFloat(args[2]) || 5;

    if (isNaN(x) || isNaN(y)) return { success: false, message: "Usage: smite <x> <y> [radius]" };

    // Apply devastation
    this.world.environment.add(x, y, EnvLayer.Temperature, 100); // Scorch earth
    this.world.environment.add(x, y, EnvLayer.SoilMoisture, -50); // Evaporate water

    // Kill entities in range
    let killCount = 0;
    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.position) {
        const pos = behavior.components.position;
        const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        if (dist <= radius) {
          if (behavior.components.vitality) {
            behavior.components.vitality.hp = 0;
            killCount++;
          }
        }
      }
    });

    return {
      success: true,
      message: `THUNDERBOLT! You struck (${x},${y}). ${killCount} souls have perished in your wrath. The ground is scorched.`
    };
  }

  private handleBless(args: string[]): CommandResult {
    const target = args[0]; // 'all' or 'plants' or 'creatures'

    let count = 0;
    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.vitality) {
        // Simple filter logic
        let match = false;
        if (target === 'all') match = true;
        // Check type by components (heuristic)
        if (target === 'plants' && behavior.components.growth) match = true;
        if (target === 'creatures' && behavior.components.goalGA) match = true;

        if (match) {
          behavior.components.vitality.hp = 100;
          if (behavior.components.energy) behavior.components.energy.energy = 100;
          count++;
        }
      }
    });

    return {
      success: true,
      message: `DIVINE GRACE! You have healed ${count} beings. They rejoice in your name.`
    };
  }

  private handleFlood(args: string[]): CommandResult {
    const waterLevel = parseFloat(args[0]) || 80;
    let drownedCount = 0;
    this.world.eventBus.publish(new Environment.GlobalParameterChange(EnvLayer.SoilMoisture, 0.5, 'CommandHandler'));

    // Kill creatures on "low ground" (random logic or actual height map if we had one)
    // We'll simulate low ground as moisture > 90
    const grid = this.world.environment;
    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.vitality) {
        const pos = behavior.components.position;
        const moisture = grid.get(pos.x, pos.y, EnvLayer.SoilMoisture);

        // If moisture is extreme, non-aquatic things drown
        if (moisture > waterLevel) {
          // Check if they have 'Swim' gene? (Not implemented yet, so random chance)
          if (Math.random() < 0.7) {
            behavior.components.vitality.hp = 0;
            drownedCount++;
          }
        }
      }
    });

    return {
      success: true,
      message: `THE GREAT FLOOD! Water covers the earth. ${drownedCount} land-dwellers have drowned.`
    };
  }

  private handleIceAge(args: string[]): CommandResult {
    let frozenCount = 0;
    this.world.eventBus.publish(new Environment.GlobalParameterChange(EnvLayer.Temperature, -5, 'CommandHandler'));

    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.vitality) {
        // Cold kills
        if (Math.random() < 0.6) {
          behavior.components.vitality.hp = 0;
          frozenCount++;
        }
      }
    });

    return {
      success: true,
      message: `WINTER IS HERE. The world freezes over. ${frozenCount} souls succumbed to the cold.`
    };
  }

  private handleMeteor(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);

    if (isNaN(x) || isNaN(y)) return { success: false, message: "Usage: meteor <x> <y>" };

    // Massive impact
    const radius = 15;
    this.world.environment.add(x, y, EnvLayer.Temperature, 500);

    let obliterated = 0;
    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.position) {
        const pos = behavior.components.position;
        const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        if (dist <= radius) {
          behavior.components.vitality.hp = 0;
          obliterated++;
        }
      }
    });

    return {
      success: true,
      message: `STARFALL! A meteor impacts at (${x},${y}). ${obliterated} lives were extinguished in an instant.`
    };
  }

  private handleOracle(): CommandResult {
    const entityCount = this.getManager().entities.length;
    const tick = this.world.tickCount;
    // Simple analysis
    let advice = "";
    if (entityCount < 10) advice = "The world is barren. Consider 'spawn_entity' or 'bless'.";
    else if (entityCount > 200) advice = "Life teems uncontrollably. A 'smite' might restore balance.";
    else advice = "The world is in harmony. Watch and wait.";

    return {
      success: true,
      message: `The Oracle speaks: "In the year ${tick}, ${entityCount} souls wander. ${advice}"`
    };
  }

  private handleWatch(args: string[]): CommandResult {
    const targetId = args[0];
    if (!targetId) return { success: false, message: "Usage: watch <id>" };

    const entity = this.getManager().getEntity(targetId);
    if (!entity) return { success: false, message: "Entity not found." };

    // Get component state
    const behavior = entity.children[0] as any;
    const comp = behavior.components;

    let info = `👁️ WATCHING: ${targetId}\n`;
    if (comp.vitality) info += `HP: ${comp.vitality.hp.toFixed(1)} | `;
    if (comp.energy) info += `Energy: ${comp.energy.energy.toFixed(1)} | `;
    if (comp.position) info += `Pos: (${comp.position.x.toFixed(1)}, ${comp.position.y.toFixed(1)})\n`;

    if (comp.goalGA) {
      const ga = comp.goalGA;
      info += `Purpose: ${ga.purpose.kind} (Target: ${ga.purpose.target.toFixed(2)})\n`;
      info += `Last Action: ${ga.metrics.lastAction}\n`;
      info += `Genes: Size=${ga.genome.stats.size.toFixed(2)} Speed=${ga.genome.stats.speed.toFixed(2)} ColdRes=${ga.genome.stats.coldResist.toFixed(2)}`;
    }

    return { success: true, message: info };
  }

  private handleMap(args: string[]): CommandResult {
    const type = args[0] || 'life';
    const grid = this.world.environment;
    const scale = 5; // Downsample for CLI
    const w = Math.floor(100 / scale);
    const h = Math.floor(100 / scale);

    let mapStr = `\n🗺️ WORLD MAP (${type.toUpperCase()})\n`;
    mapStr += '┌' + '─'.repeat(w) + '┐\n';

    const counts = new Array(w * h).fill(0);

    // Aggregate data
    this.getManager().entities.forEach(entity => {
      const behavior = entity.children[0] as any;
      if (behavior && behavior.components && behavior.components.position) {
        const pos = behavior.components.position;
        const mx = Math.floor(Math.min(99, Math.max(0, pos.x)) / scale);
        const my = Math.floor(Math.min(99, Math.max(0, pos.y)) / scale);
        counts[my * w + mx]++;
      }
    });

    for (let y = 0; y < h; y++) {
      mapStr += '│';
      for (let x = 0; x < w; x++) {
        const count = counts[y * w + x];
        let char = ' ';
        if (count > 0) char = '.';
        if (count > 2) char = ':';
        if (count > 5) char = 'o';
        if (count > 10) char = 'O';
        if (count > 20) char = '@';
        mapStr += char;
      }
      mapStr += '│\n';
    }
    mapStr += '└' + '─'.repeat(w) + '┘\n';

    return { success: true, message: mapStr };
  }

  private handleAutoGod(args: string[]): CommandResult {
    const state = args[0]?.toLowerCase();
    const autoGod = (this.world as any).autoGodSystem;

    if (!autoGod) return { success: false, message: "Auto God System not initialized." };

    if (state === 'on') {
      autoGod.toggle(true);
      return { success: true, message: "The AI God has awakened. It will now intervene periodically." };
    } else if (state === 'off') {
      autoGod.toggle(false);
      return { success: true, message: "The AI God slumbers. You are in control." };
    } else {
      return { success: false, message: "Usage: auto_god <on|off>" };
    }
  }

  private handleExploreLoc(args: string[]): CommandResult {
    const mazeSystem = (this.world as any).mazeSystem;
    if (!mazeSystem) return { success: false, message: "Maze System not active." };

    const network = mazeSystem.network;
    const count = network.nodes.size;
    const active = Array.from(network.nodes.values()).filter((n: any) => n.maze.activityLevel > 10).length;

    // If user provides 'list'
    if (args[0] === 'list') {
      let msg = `\n🏰 DISCOVERED PLACES (${count} total, ${active} active):\n`;
      network.nodes.forEach((node: any) => {
        if (node.maze.activityLevel > 0) {
          msg += `- [${node.id}] ${node.data.identity.name} @ (${node.position.x.toFixed(0)},${node.position.y.toFixed(0)}) Activity: ${node.maze.activityLevel.toFixed(1)}\n`;
          if (node.maze.connections.size > 0) {
            msg += `  Routes: ${Array.from(node.maze.connections.keys()).join(', ')}\n`;
          }
        }
      });
      return { success: true, message: msg };
    }

    return { success: true, message: `The world contains ${count} places linked by creature trails. Type 'explore_loc list' to see them.` };
  }

  private async handleAskScience(args: string[]): Promise<CommandResult> {
    const query = args.join(' ');
    if (!query) return { success: false, message: "Usage: ask_science <question>" };

    try {
      const projectContext = this.buildScienceContext();
      const report = await this.scienceOrchestrator.processQuery(query, projectContext);
      const markdown = this.renderScienceReportMarkdown(report);

      const details = JSON.stringify({
        kind: 'science_report',
        query,
        tick: this.world.tickCount,
        report
      });

      await this.world.persistence.saveWorldEvent({
        worldId: this.world.id,
        tick: this.world.tickCount,
        type: 'OTHER',
        location: { x: 0, y: 0 },
        details
      });

      await this.appendScienceReportToFile({ worldId: this.world.id, tick: this.world.tickCount, query, report });

      return { success: true, message: markdown };
    } catch (e: any) {
      return { success: false, message: `Science failed: ${e.message}` };
    }
  }

  private buildScienceContext(): string {
    const manager = this.getManager();
    const entities = manager.entities ?? [];
    const places = entities.filter((e: any) => e?.type === 'Place').length;
    const plants = entities.filter((e: any) => {
      const b = e?.children?.[0] as any;
      return b?.components?.growth;
    }).length;
    const creatures = entities.filter((e: any) => {
      const b = e?.children?.[0] as any;
      return b?.components?.goalGA;
    }).length;

    let totalHp = 0;
    let totalEnergy = 0;
    let counted = 0;
    for (const e of entities) {
      const b = (e as any)?.children?.[0] as any;
      const c = b?.components;
      if (!c) continue;
      if (c.vitality?.hp != null) totalHp += c.vitality.hp;
      if (c.energy?.energy != null) totalEnergy += c.energy.energy;
      counted++;
    }

    const maze = (this.world as any).mazeSystem?.network;
    const nodeCount = maze?.nodes?.size ?? 0;
    const edgeCount = maze
      ? Array.from(maze.nodes.values()).reduce((sum: number, n: any) => sum + (n?.maze?.connections?.size ?? 0), 0) / 2
      : 0;

    const env = this.world.environment;
    const temp = env.get(50, 50, EnvLayer.Temperature);
    const moisture = env.get(50, 50, EnvLayer.SoilMoisture);
    const light = env.get(50, 50, EnvLayer.LightIntensity);

    return [
      `Project: Aetherius (life simulation + evolving maze places)`,
      `Tick: ${this.world.tickCount}`,
      `Population: entities=${entities.length} places=${places} plants=${plants} creatures=${creatures}`,
      `AvgStats: hp=${counted ? (totalHp / counted).toFixed(2) : 'n/a'} energy=${counted ? (totalEnergy / counted).toFixed(2) : 'n/a'}`,
      `Maze: nodes=${nodeCount} edges=${Math.floor(edgeCount)}`,
      `Env(center): temp=${temp.toFixed(2)} moisture=${moisture.toFixed(2)} light=${light.toFixed(2)}`
    ].join('\n');
  }

  private renderScienceReportMarkdown(report: any): string {
    const header = `\n📄 [Aetherius Science Report]\n- Tick: ${this.world.tickCount}\n- Query: ${report.query}\n\n`;
    const agents = report.hypotheses
      .map((h: any) => `## ${h.agent}\n${h.content}\n`)
      .join('\n');
    const reviews = report.reviews
      .map((r: any) => `- ${r.reviewer} → ${r.target}\n${r.critique}\n`)
      .join('\n');
    const synthesis = `# Synthesis\n${report.synthesis}\n`;
    return `${header}# Context\n${report.projectContext}\n\n# Hypotheses\n${agents}\n# Peer Review\n${reviews}\n${synthesis}`;
  }

  private async appendScienceReportToFile(entry: any): Promise<void> {
    const dir = path.join(process.cwd(), 'data', 'reports');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'science_reports.jsonl');
    await fs.appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
  }

  private handleAiEvents(args: string[]): CommandResult {
    const state = args[0]?.toLowerCase();
    const sys = (this.world as any).aiEventOrchestratorSystem;
    if (!sys) return { success: false, message: 'AI event system not initialized.' };

    if (state === 'on') {
      sys.toggle(true);
      return { success: true, message: 'AI event handling enabled.' };
    }
    if (state === 'off') {
      sys.toggle(false);
      return { success: true, message: 'AI event handling disabled.' };
    }

    return { success: false, message: 'Usage: ai_events <on|off>' };
  }

  private handleSpace(args: string[]): CommandResult {
    const worldIds = universeRegistry.listWorldIds();
    const wormholes = universeRegistry.listWormholes();
    const lines: string[] = [];
    lines.push(`\n🪐 [SPACE STATUS]`);
    lines.push(`Worlds: ${worldIds.length ? worldIds.join(', ') : '(none registered)'}`);
    if (wormholes.length === 0) {
      lines.push(`Wormholes: (none)`);
    } else {
      lines.push(`Wormholes:`);
      for (const w of wormholes) {
        lines.push(`- ${w.id}: ${w.a} <-> ${w.b} (expires@${w.expiresAtTick}, stability=${w.stability.toFixed(2)})`);
      }
    }
    return { success: true, message: lines.join('\n') };
  }

  private handleWarp(args: string[]): CommandResult {
    const entityId = args[0];
    const targetWorldId = args[1];
    if (!entityId || !targetWorldId) return { success: false, message: 'Usage: warp <entityId> <targetWorldId>' };

    const found = universeRegistry.findEntityAcrossWorlds(entityId);
    if (!found) return { success: false, message: `Entity not found across worlds: ${entityId}` };
    if (found.worldId === targetWorldId) return { success: false, message: `Entity already in world ${targetWorldId}` };

    const ok = universeRegistry.transferEntity(entityId, found.worldId, targetWorldId);
    if (!ok) return { success: false, message: `Warp failed: ${entityId} ${found.worldId} -> ${targetWorldId}` };

    return { success: true, message: `Warped ${entityId}: ${found.worldId} -> ${targetWorldId}` };
  }

  private handleDeployDrone(args: string[]): CommandResult {
    const role = args[0] || 'Observer';
    const worldId = args[1] || this.world.id;
    const mode = args[2] || 'survey';

    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();

    const id = `${worldId}_Drone_${uuidv4().slice(0, 8)}`;
    const entity = createEntityByAssemblyWithManager(manager as any, 'Drone_Observer_001', id);
    const behavior = entity.children[0] as any;
    if (behavior?.components) {
      behavior.components.identity.owner = 'ScientistCouncil';
      behavior.components.identity.role = role;
      behavior.components.mission.mode = mode;
      behavior.components.intervention.enabled = mode !== 'documentary';
    }

    return { success: true, message: `Deployed drone ${id} in world ${worldId} (role=${role}, mode=${mode})` };
  }

  private handleDrones(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const drones = (manager.entities ?? []).filter((e: any) => e?.children?.[0]?.components?.mission && e?.children?.[0]?.components?.camera);

    if (drones.length === 0) return { success: true, message: `No drones found in world ${worldId}.` };

    const lines = drones.map((e: any) => {
      const c = (e.children[0] as any).components;
      return `- ${e.id} role=${c.identity?.role} mode=${c.mission?.mode} energy=${c.energy?.energy?.toFixed?.(1) ?? c.energy?.energy}`;
    });
    return { success: true, message: `\n📡 [DRONES @ ${worldId}]\n${lines.join('\n')}` };
  }

  private handleDroneMission(args: string[]): CommandResult {
    const droneId = args[0];
    const mode = args[1];
    const text = args.slice(2).join(' ');
    if (!droneId || !mode) return { success: false, message: 'Usage: drone_mission <droneId> <mode> [text...]' };

    const found = universeRegistry.findEntityAcrossWorlds(droneId);
    if (!found) return { success: false, message: `Drone not found: ${droneId}` };
    const behavior = (found.entity.children[0] as any);
    const c = behavior?.components;
    if (!c?.mission) return { success: false, message: `Entity is not a drone: ${droneId}` };

    c.mission.mode = mode;
    c.mission.text = text || undefined;
    c.intervention.enabled = mode !== 'documentary';

    return { success: true, message: `Updated drone ${droneId}: mode=${mode}` };
  }

  private handleTaxonomy(args: string[]): CommandResult {
    const entityId = args[0];
    if (!entityId) return { success: false, message: 'Usage: taxonomy <entityId>' };
    const found = universeRegistry.findEntityAcrossWorlds(entityId);
    if (!found) return { success: false, message: `Entity not found: ${entityId}` };
    const c = (found.entity.children?.[0] as any)?.components;
    const snapshot = {
      worldId: found.worldId,
      id: entityId,
      classification: c?.classification,
      lifeStage: c?.lifeStage,
      taxonomy: c?.taxonomy,
      disease: c?.disease,
      position: c?.position,
      vitality: c?.vitality,
      energy: c?.energy,
      goalGA: c?.goalGA
    };
    return { success: true, message: JSON.stringify(snapshot, null, 2) };
  }

  private handleDiseaseStats(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const eco = (handle?.world as any)?.ecosystemSystem;
    if (!eco?.getDiseaseStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getDiseaseStats(manager);
    return { success: true, message: `\n🦠 [DISEASE @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleCorpses(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const eco = (handle?.world as any)?.ecosystemSystem;
    if (!eco?.getCorpseStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getCorpseStats(manager);
    return { success: true, message: `\n🪦 [CORPSES @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleMigrationStats(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const eco = (handle?.world as any)?.ecosystemSystem;
    if (!eco?.getMigrationStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getMigrationStats();
    return { success: true, message: `\n🧭 [MIGRATION @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleHelp(): CommandResult {
    return {
      success: true,
      message: `Divine Powers:
  - advance_tick [count]: Let time flow
  - warp_evolution [count]: Fast-forward eons
  - smite <x> <y> [radius]: Strike with lightning
  - bless <all|plants|creatures>: Heal your creations
  - flood [level]: Raise water levels
  - ice_age: Freeze the world
  - meteor <x> <y>: Cause mass extinction
  - oracle: Seek wisdom about the world
  - auto_god <on|off>: Awaken the AI God
  - watch <id>: Observe a soul
  - map [life]: View the world
  - explore_loc [list]: Discover places formed by life
  - ask_science <query>: Consult the council of scientists
  - ai_events <on|off>: Let AI handle events
  - space: View worlds and wormholes
  - warp <entityId> <worldId>: Move an entity between worlds
  - deploy_drone [role] [worldId] [mode]: Send a scientist drone (modes: documentary|survey|irrigate|cool|heat|seed_place)
  - drones [worldId]: List drones
  - drone_mission <droneId> <mode> [text]: Update drone mission
  - taxonomy <entityId>: Inspect classification/taxonomy/disease
  - disease_stats [worldId]: Disease summary
  - corpses [worldId]: Corpse summary
  - migration_stats [worldId]: Place population summary
  - spawn_entity <plant|ga> [name]: Create life
  - change_environment <param> <value>: Alter the sky
  - inspect_pos <x> <y>: Gaze at the earth
  - status [id]: Know a soul
  - help`
    };
  }
}
