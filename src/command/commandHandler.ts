import { World } from '../core/world.js';
import { createEntityByAssemblyWithManager } from '../entities/catalog.js';
import { Layer } from '../core/environment/environmentGrid.js';
import { Environment, System } from '../core/events/eventTypes.js';
import { promises as fs } from 'fs';
import path from 'path';
import { universeRegistry } from '../core/space/universeRegistry.js';
import { ScienceOrchestrator } from '../ai/orchestrator.js';
import { NarrativeOrchestrator } from '../ai/narrativeOrchestrator.js';
import { LifeScienceAgent } from '../ai/agents/scientistAgents.js';
import { createDefaultLLMService } from '../ai/llmService.js';
import { translateToKorean } from '../ai/translate.js';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/** Commands science is allowed to recommend and execute (--execute / executeActions). */
const SCIENCE_ACTION_WHITELIST = new Set([
  'advance_tick', 'spawn_entity', 'change_environment', 'bless', 'flood', 'ice_age',
  'inspect_pos', 'status', 'map', 'deploy_drone', 'drones', 'drone_mission',
  'disease_stats', 'corpses', 'migration_stats', 'taxonomy', 'oracle', 'watch', 'explore_loc',
  'create_place', 'modify_terrain'
]);
const MAX_SCIENCE_ACTIONS = 10;

export class CommandHandler {
  private world: World;
  private weatherEntity: unknown;
  private scienceOrchestrator: ScienceOrchestrator;
  private narrativeOrchestrator: NarrativeOrchestrator;

  constructor(world: World, weatherEntity: unknown) {
    this.world = world;
    this.weatherEntity = weatherEntity;
    this.scienceOrchestrator = new ScienceOrchestrator({
      persistence: this.world.persistence,
      getWorldContext: () => ({ worldId: this.world.id, tick: this.world.tickCount })
    });
    this.narrativeOrchestrator = new NarrativeOrchestrator();

    this.world.eventBus.subscribe(System.ChangeWeather, (event) => {
      const weatherBehavior = (this.weatherEntity as { children?: Array<{ components?: { weather?: Record<string, unknown> } }> })?.children?.[0];
      const components = weatherBehavior?.components as { weather?: Record<string, unknown> } | undefined;
      const weather = components?.weather;
      if (!weather) return;
      Object.assign(weather, event.payload || {});
    });
  }

  getWorld(): World {
    return this.world;
  }

  private getManager() {
    return this.world.getAssembleManager();
  }

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
        case 'db_status':
          return await this.handleDbStatus();
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
        case 'narrative':
          return await this.handleNarrative(args);
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
        case 'life_science_discover':
          return await this.handleLifeScienceDiscover(args);
        case 'life_science_observe':
          return await this.handleLifeScienceObserve(args);
        case 'create_place':
          return this.handleCreatePlace(args);
        case 'modify_terrain':
          return this.handleModifyTerrain(args);
        case 'help':
          return this.handleHelp();
        default:
          return { success: false, message: `Unknown command: ${command}. The heavens are silent.` };
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Divine intervention failed: ${msg}` };
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
    const updateInterval = Math.max(1, Math.floor(ticks / 20));
    for (let i = 0; i < ticks; i++) {
      await this.world.tick();
      if (i % updateInterval === 0 || i === ticks - 1) {
        const progress = Math.round(((i + 1) / ticks) * 100);
        const bar = '█'.repeat(Math.floor(progress / 5)).padEnd(20, '░');
        if (typeof process !== 'undefined' && process.stdout?.isTTY) {
          process.stdout.write(`\r[${bar}] ${progress}% (Tick ${i + 1}/${ticks}) `);
        } else if (progress % 25 === 0) {
          console.log(`[${bar}] ${progress}%`);
        }
      }
    }
    if (typeof process !== 'undefined' && process.stdout?.isTTY) process.stdout.write('\n');
    const duration = Date.now() - startTime;
    return {
      success: true,
      message: `⚡ Warped ${ticks} ticks in ${duration}ms. World is now at tick ${this.world.tickCount}. Check logs for evolutionary changes.`
    };
  }

  private handleSpawnEntity(args: string[]): CommandResult {
    const type = args[0]?.toLowerCase();
    const name = args[1] || this.world.nextId('Entity');
    if (!type) return { success: false, message: "Usage: spawn_entity <plant|ga|basic> [name]" };
    if (type === 'plant') {
      const entity = createEntityByAssemblyWithManager(this.getManager(), 'Plant_Species_001', name);
      return { success: true, message: `Spawned entity '${name}' of type '${type}'.`, data: { id: entity.id } };
    }
    if (type === 'ga') {
      const entity = createEntityByAssemblyWithManager(this.getManager(), 'Creature_Type_001', name);
      return { success: true, message: `Spawned entity '${name}' of type '${type}'.`, data: { id: entity.id } };
    }
    return { success: false, message: `Entity type '${type}' not supported in new system yet.` };
  }

  private handleChangeEnvironment(args: string[]): CommandResult {
    if (args.length < 2) return { success: false, message: "Usage: change_environment <parameter> <value>" };
    const key = args[0];
    const value = args[1];
    const payload: Record<string, unknown> = {};
    switch (key.toLowerCase()) {
      case 'condition': payload.condition = value; break;
      case 'temp':
      case 'temperature': payload.temperature = parseFloat(value); break;
      case 'humidity': payload.humidity = parseFloat(value); break;
      case 'rain': payload.precipitation = parseFloat(value); break;
      case 'wind': payload.windSpeed = parseFloat(value); break;
      case 'co2': payload.co2Level = parseFloat(value); break;
      default: return { success: false, message: `Unknown environment parameter: ${key}` };
    }
    this.world.eventBus.publish(new System.ChangeWeather(payload));
    return { success: true, message: `Queued environment change: ${key}=${value} (applies on tick).` };
  }

  private handleStatus(args: string[]): CommandResult {
    const targetId = args[0];
    if (targetId) {
      const entity = this.getManager().getEntity(targetId);
      if (!entity) return { success: false, message: "Entity not found." };
      const components: Record<string, unknown> = {};
      const behavior = (entity as { children?: Array<{ components?: unknown }> })?.children?.[0];
      if (behavior?.components) Object.assign(components, behavior.components);
      return { success: true, message: `Status for ${targetId}`, data: { id: (entity as { id: string }).id, components } };
    }
    const manager = this.getManager();
    return {
      success: true,
      message: `AssembleManager contains ${manager.entities.length} entities.`,
      data: { nodeCount: manager.entities.length, nodeIds: manager.entities.map((e: { id: string }) => e.id) }
    };
  }

  private handleInspectPos(args: string[]): CommandResult {
    const x = parseInt(args[0]);
    const y = parseInt(args[1]);
    if (isNaN(x) || isNaN(y)) return { success: false, message: "Usage: inspect_pos <x> <y>" };
    if (x < 0 || x >= this.world.environment.width || y < 0 || y >= this.world.environment.height) {
      return { success: false, message: "Coordinates out of bounds." };
    }
    const grid = this.world.environment;
    const data = {
      Temperature: grid.get(x, y, Layer.Temperature).toFixed(2) + "°C",
      Humidity: (grid.get(x, y, Layer.Humidity) * 100).toFixed(1) + "%",
      SoilMoisture: (grid.get(x, y, Layer.SoilMoisture) * 100).toFixed(1) + "%",
      Nitrogen: grid.get(x, y, Layer.SoilNitrogen).toFixed(2),
      Light: grid.get(x, y, Layer.LightIntensity).toFixed(0) + " Lux"
    };
    return { success: true, message: `Environment at (${x}, ${y}):`, data };
  }

  private async handleLatestSnapshot(): Promise<CommandResult> {
    const snap = await this.world.persistence.getLatestSnapshot(this.world.id);
    if (!snap) return { success: false, message: 'No snapshot saved yet.' };
    return { success: true, message: `Latest snapshot (driver=${this.world.persistence.driver})`, data: snap };
  }

  private async handleDbStatus(): Promise<CommandResult> {
    const driver = this.world.persistence.driver;
    const worldId = this.world.id;
    const snap = await this.world.persistence.getLatestSnapshot(worldId);
    const envSource = process.env.AETHERIUS_NOSQL_DRIVER != null
      ? `env (AETHERIUS_NOSQL_DRIVER=${process.env.AETHERIUS_NOSQL_DRIVER})` : 'default (inmemory)';
    const summary: Record<string, unknown> = {
      driver,
      configSource: envSource,
      currentWorldId: worldId,
      latestSnapshot: snap ? {
        tick: snap.tick,
        timestamp: snap.timestamp,
        nodesCount: snap.nodes?.length ?? 0,
        entitiesCount: Array.isArray(snap.entities) ? snap.entities.length : 0
      } : null
    };
    const msg = snap
      ? `DB: ${driver} | world=${worldId} | latest tick=${snap.tick} | nodes=${snap.nodes?.length ?? 0} entities=${Array.isArray(snap.entities) ? snap.entities.length : 0}`
      : `DB: ${driver} | world=${worldId} | no snapshot yet`;
    return { success: true, message: msg, data: summary };
  }

  private handleSmite(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);
    const radius = parseFloat(args[2]) || 5;
    if (isNaN(x) || isNaN(y)) return { success: false, message: "Usage: smite <x> <y> [radius]" };
    this.world.environment.add(x, y, Layer.Temperature, 100);
    this.world.environment.add(x, y, Layer.SoilMoisture, -50);
    let killCount = 0;
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { position?: { x: number; y: number }; vitality?: { hp: number } } }> }) => {
      const behavior = entity.children?.[0];
      const comp = behavior?.components;
      if (!comp?.position || !comp?.vitality) return;
      const dist = Math.sqrt(Math.pow(comp.position.x - x, 2) + Math.pow(comp.position.y - y, 2));
      if (dist <= radius) { comp.vitality.hp = 0; killCount++; }
    });
    return { success: true, message: `THUNDERBOLT! You struck (${x},${y}). ${killCount} souls have perished in your wrath. The ground is scorched.` };
  }

  private handleBless(args: string[]): CommandResult {
    const target = args[0];
    let count = 0;
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { vitality?: { hp: number }; energy?: { energy: number }; growth?: unknown; goalGA?: unknown } }> }) => {
      const behavior = entity.children?.[0];
      const c = behavior?.components;
      if (!c?.vitality) return;
      let match = target === 'all' || (target === 'plants' && c.growth) || (target === 'creatures' && c.goalGA);
      if (match) { c.vitality.hp = 100; if (c.energy) c.energy.energy = 100; count++; }
    });
    return { success: true, message: `DIVINE GRACE! You have healed ${count} beings. They rejoice in your name.` };
  }

  private handleFlood(args: string[]): CommandResult {
    this.world.eventBus.publish(new Environment.GlobalParameterChange(Layer.SoilMoisture, 0.5, 'CommandHandler'));
    const waterLevel = parseFloat(args[0]) || 80;
    const grid = this.world.environment;
    let drownedCount = 0;
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { position?: { x: number; y: number }; vitality?: { hp: number } } }> }) => {
      const behavior = entity.children?.[0];
      const c = behavior?.components;
      if (!c?.vitality || !c?.position) return;
      const moisture = grid.get(c.position.x, c.position.y, Layer.SoilMoisture);
      if (moisture > waterLevel && this.world.random01() < 0.7) { c.vitality.hp = 0; drownedCount++; }
    });
    return { success: true, message: `THE GREAT FLOOD! Water covers the earth. ${drownedCount} land-dwellers have drowned.` };
  }

  private handleIceAge(_args: string[]): CommandResult {
    this.world.eventBus.publish(new Environment.GlobalParameterChange(Layer.Temperature, -5, 'CommandHandler'));
    let frozenCount = 0;
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { vitality?: { hp: number } } }> }) => {
      const c = entity.children?.[0]?.components;
      if (c?.vitality && this.world.random01() < 0.6) { c.vitality.hp = 0; frozenCount++; }
    });
    return { success: true, message: `WINTER IS HERE. The world freezes over. ${frozenCount} souls succumbed to the cold.` };
  }

  private handleMeteor(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);
    if (isNaN(x) || isNaN(y)) return { success: false, message: "Usage: meteor <x> <y>" };
    const radius = 15;
    this.world.environment.add(x, y, Layer.Temperature, 500);
    let obliterated = 0;
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { position?: { x: number; y: number }; vitality?: { hp: number } } }> }) => {
      const c = entity.children?.[0]?.components;
      if (!c?.position || !c?.vitality) return;
      const dist = Math.sqrt(Math.pow(c.position.x - x, 2) + Math.pow(c.position.y - y, 2));
      if (dist <= radius) { c.vitality.hp = 0; obliterated++; }
    });
    return { success: true, message: `STARFALL! A meteor impacts at (${x},${y}). ${obliterated} lives were extinguished in an instant.` };
  }

  private handleOracle(): CommandResult {
    const entityCount = this.getManager().entities.length;
    const tick = this.world.tickCount;
    let advice = entityCount < 10 ? "The world is barren. Consider 'spawn_entity' or 'bless'."
      : entityCount > 200 ? "Life teems uncontrollably. A 'smite' might restore balance."
        : "The world is in harmony. Watch and wait.";
    return { success: true, message: `The Oracle speaks: "In the year ${tick}, ${entityCount} souls wander. ${advice}"` };
  }

  private async handleNarrative(args: string[]): Promise<CommandResult> {
    const translateToKo = args.includes('--ko') || args.includes('--lang=ko') || process.env.AETHERIUS_OUTPUT_LANG === 'ko';
    try {
      const { combined } = await this.narrativeOrchestrator.getNarrative(this.world);
      const message = translateToKo ? await translateToKorean(createDefaultLLMService(), combined) : combined;
      return { success: true, message };
    } catch (e: unknown) {
      return { success: false, message: `Narrative failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  private handleWatch(args: string[]): CommandResult {
    const targetId = args[0];
    if (!targetId) return { success: false, message: "Usage: watch <id>" };
    const entity = this.getManager().getEntity(targetId);
    if (!entity) return { success: false, message: "Entity not found." };
    const comp = (entity as { children?: Array<{ components?: Record<string, unknown> }> })?.children?.[0]?.components;
    if (!comp) return { success: true, message: `👁️ WATCHING: ${targetId}` };
    let info = `👁️ WATCHING: ${targetId}\n`;
    if (comp.vitality && typeof (comp.vitality as { hp: number }).hp === 'number') info += `HP: ${(comp.vitality as { hp: number }).hp.toFixed(1)} | `;
    if (comp.energy && typeof (comp.energy as { energy: number }).energy === 'number') info += `Energy: ${(comp.energy as { energy: number }).energy.toFixed(1)} | `;
    if (comp.position && typeof (comp.position as { x: number; y: number }).x === 'number') {
      const p = comp.position as { x: number; y: number };
      info += `Pos: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})\n`;
    }
    if (comp.goalGA) {
      const ga = comp.goalGA as { purpose?: { kind: string; target: number }; metrics?: { lastAction: string }; genome?: { stats?: { size: number; speed: number; coldResist: number } } };
      info += `Purpose: ${ga.purpose?.kind} (Target: ${ga.purpose?.target?.toFixed(2) ?? '?'})\n`;
      info += `Last Action: ${ga.metrics?.lastAction ?? '?'}\n`;
      if (ga.genome?.stats) info += `Genes: Size=${ga.genome.stats.size.toFixed(2)} Speed=${ga.genome.stats.speed.toFixed(2)} ColdRes=${ga.genome.stats.coldResist.toFixed(2)}`;
    }
    return { success: true, message: info };
  }

  private handleMap(args: string[]): CommandResult {
    const type = args[0] || 'life';
    const grid = this.world.environment;
    const scale = 5;
    const w = Math.floor(100 / scale);
    const h = Math.floor(100 / scale);
    const counts = new Array(w * h).fill(0);
    this.getManager().entities.forEach((entity: { children?: Array<{ components?: { position?: { x: number; y: number } } }> }) => {
      const pos = entity.children?.[0]?.components?.position;
      if (!pos) return;
      const mx = Math.floor(Math.min(99, Math.max(0, pos.x)) / scale);
      const my = Math.floor(Math.min(99, Math.max(0, pos.y)) / scale);
      counts[my * w + mx]++;
    });
    let mapStr = `\n🗺️ WORLD MAP (${type.toUpperCase()})\n┌${'─'.repeat(w)}┐\n`;
    for (let y = 0; y < h; y++) {
      mapStr += '│';
      for (let x = 0; x < w; x++) {
        const count = counts[y * w + x];
        mapStr += count > 20 ? '@' : count > 10 ? 'O' : count > 5 ? 'o' : count > 2 ? ':' : count > 0 ? '.' : ' ';
      }
      mapStr += '│\n';
    }
    mapStr += '└' + '─'.repeat(w) + '┘\n';
    return { success: true, message: mapStr };
  }

  private handleAutoGod(args: string[]): CommandResult {
    const state = args[0]?.toLowerCase();
    const autoGod = (this.world as World & { autoGodSystem?: { toggle: (v: boolean) => void } }).autoGodSystem;
    if (!autoGod) return { success: false, message: "Auto God System not initialized." };
    if (state === 'on') { autoGod.toggle(true); return { success: true, message: "The AI God has awakened. It will now intervene periodically." }; }
    if (state === 'off') { autoGod.toggle(false); return { success: true, message: "The AI God slumbers. You are in control." }; }
    return { success: false, message: "Usage: auto_god <on|off>" };
  }

  private handleExploreLoc(args: string[]): CommandResult {
    const mazeSystem = (this.world as { mazeSystem?: { network: { nodes: Map<string, unknown> } } }).mazeSystem;
    if (!mazeSystem) return { success: false, message: "Maze System not active." };
    const network = mazeSystem.network;
    const count = network.nodes.size;
    const active = Array.from(network.nodes.values()).filter((n: unknown) => ((n as { maze?: { activityLevel: number } }).maze?.activityLevel ?? 0) > 10).length;
    if (args[0] === 'list') {
      let msg = `\n🏰 DISCOVERED PLACES (${count} total, ${active} active):\n`;
      network.nodes.forEach((node: unknown) => {
        const n = node as { id: string; maze?: { activityLevel: number; connections: Map<string, unknown> }; data?: { identity?: { name: string } }; position?: { x: number; y: number } };
        if ((n.maze?.activityLevel ?? 0) > 0) {
          msg += `- [${n.id}] ${n.data?.identity?.name ?? '?'} @ (${n.position?.x?.toFixed(0) ?? 0},${n.position?.y?.toFixed(0) ?? 0}) Activity: ${(n.maze?.activityLevel ?? 0).toFixed(1)}\n`;
          if (n.maze?.connections?.size) msg += `  Routes: ${Array.from(n.maze.connections.keys()).join(', ')}\n`;
        }
      });
      return { success: true, message: msg };
    }
    return { success: true, message: `The world contains ${count} places linked by creature trails. Type 'explore_loc list' to see them.` };
  }

  private async handleAskScience(args: string[]): Promise<CommandResult> {
    const executeFlag = args.includes('--execute');
    const translateToKo = args.includes('--ko') || args.includes('--lang=ko') || process.env.AETHERIUS_OUTPUT_LANG === 'ko';
    const queryParts = args.filter((a) => a !== '--execute' && a !== '--ko' && a !== '--lang=ko');
    const query = queryParts.join(' ');
    if (!query) return { success: false, message: "Usage: ask_science <question> [--execute] [--ko]" };
    try {
      const projectContext = await this.buildScienceContext();
      const report = await this.scienceOrchestrator.processQuery(query, projectContext);
      let markdown = this.renderScienceReportMarkdown(report);
      let executedActions: { cmd: string; success: boolean; message: string }[] | undefined;
      if (executeFlag && report.recommendedActions && report.recommendedActions.length > 0) {
        const { results } = await this.executeScienceActions(report.recommendedActions);
        executedActions = results;
        const executedBlock = results.map((r) => `- ${r.cmd}: ${r.success ? r.message : r.message}`).join('\n');
        markdown += `\n\n# Executed Actions\n${executedBlock}\n`;
      }
      await this.world.persistence.saveWorldEvent({
        worldId: this.world.id,
        tick: this.world.tickCount,
        type: 'OTHER',
        location: { x: 0, y: 0 },
        details: JSON.stringify({ kind: 'science_report', query, tick: this.world.tickCount, report })
      });
      if (this.world.config.telemetry.writeJsonlToDisk) {
        await this.appendScienceReportToFile({ worldId: this.world.id, tick: this.world.tickCount, query, report });
      }
      const message = translateToKo ? await translateToKorean(createDefaultLLMService(), markdown) : markdown;
      return {
        success: true,
        message,
        data: { report, executedActions }
      };
    } catch (e: unknown) {
      return { success: false, message: `Science failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /** Execute science-recommended commands (whitelist only, up to MAX_SCIENCE_ACTIONS). */
  async executeScienceActions(commands: string[]): Promise<{ results: { cmd: string; success: boolean; message: string }[] }> {
    const toRun = commands.slice(0, MAX_SCIENCE_ACTIONS);
    const results: { cmd: string; success: boolean; message: string }[] = [];
    for (const raw of toRun) {
      const cmd = raw.trim();
      if (!cmd) continue;
      const commandName = cmd.split(/\s+/)[0]?.toLowerCase();
      if (!commandName || !SCIENCE_ACTION_WHITELIST.has(commandName)) {
        results.push({ cmd, success: false, message: 'Command not in science whitelist.' });
        continue;
      }
      const result = await this.execute(cmd);
      results.push({ cmd, success: result.success, message: result.message });
    }
    return { results };
  }

  private async buildScienceContext(): Promise<string> {
    const narrativeBlock = await (async () => {
      try {
        const { combined } = await this.narrativeOrchestrator.getNarrative(this.world);
        return `World Narrative (reference for all scientists):\n${combined}`;
      } catch {
        return '';
      }
    })();
    const manager = this.getManager();
    const entities = manager.entities ?? [];
    const places = entities.filter((e: unknown) => (e as { type?: string })?.type === 'Place').length;
    const plants = entities.filter((e: unknown) => (e as { children?: Array<{ components?: { growth?: unknown } }> })?.children?.[0]?.components?.growth).length;
    const creatures = entities.filter((e: unknown) => (e as { children?: Array<{ components?: { goalGA?: unknown } }> })?.children?.[0]?.components?.goalGA).length;
    let totalHp = 0, totalEnergy = 0, counted = 0;
    for (const e of entities) {
      const c = (e as { children?: Array<{ components?: { vitality?: { hp: number }; energy?: { energy: number } } }> })?.children?.[0]?.components;
      if (!c) continue;
      if (c.vitality?.hp != null) totalHp += c.vitality.hp;
      if (c.energy?.energy != null) totalEnergy += c.energy.energy;
      counted++;
    }
    const maze = (this.world as World & { mazeSystem?: { network: { nodes: Map<unknown, unknown> } } }).mazeSystem?.network;
    const nodeCount = maze?.nodes?.size ?? 0;
    const edgeCount = maze ? Array.from(maze.nodes.values()).reduce((sum: number, n: unknown) => sum + ((n as { maze?: { connections?: { size: number } } })?.maze?.connections?.size ?? 0), 0) / 2 : 0;
    const env = this.world.environment;
    const divineActions = `
Available divine actions (you may recommend these; one command per line in Recommended Actions):
- advance_tick [count]: Let time flow
- spawn_entity plant|ga [name]: Create life
- change_environment temp|humidity|rain|wind|co2 <value>: Alter the sky
- bless all|plants|creatures: Heal your creations
- flood [level]: Raise water levels
- ice_age: Freeze the world
- inspect_pos <x> <y>: Gaze at the earth
- status [entityId]: Know a soul
- map [life]: View the world
- deploy_drone [role] [worldId] documentary|survey|irrigate|cool|heat|seed_place: Send a scientist drone
- drones [worldId]: List drones
- drone_mission <droneId> <mode> [text]: Update drone mission
- disease_stats [worldId]: Disease summary
- corpses [worldId]: Corpse summary
- migration_stats [worldId]: Place population summary
- taxonomy <entityId>: Inspect classification
- oracle: Seek wisdom about the world
- watch <id>: Observe a soul
- explore_loc list: Discover places formed by life
- create_place <x> <y> [name]: Create a new place (Geologist only)
- modify_terrain <x> <y> <radius> <layer> <value>: Modify terrain (Geologist only)`;
    const assemblyTypes = 'Assembly types for spawn_entity: plant -> Plant_Species_001..020, ga -> Creature_Type_001..040. Use spawn_entity plant <name> or spawn_entity ga <name> to create new life.';
    const baseContext = [
      `Project: Aetherius (life simulation + evolving maze places)`,
      `Tick: ${this.world.tickCount}`,
      `Population: entities=${entities.length} places=${places} plants=${plants} creatures=${creatures}`,
      `AvgStats: hp=${counted ? (totalHp / counted).toFixed(2) : 'n/a'} energy=${counted ? (totalEnergy / counted).toFixed(2) : 'n/a'}`,
      `Maze: nodes=${nodeCount} edges=${Math.floor(edgeCount)}`,
      `Env(center): temp=${env.get(50, 50, Layer.Temperature).toFixed(2)} moisture=${env.get(50, 50, Layer.SoilMoisture).toFixed(2)} light=${env.get(50, 50, Layer.LightIntensity).toFixed(2)}`,
      divineActions.trim(),
      assemblyTypes
    ].join('\n');
    return narrativeBlock ? `${narrativeBlock}\n\n---\n\n${baseContext}` : baseContext;
  }

  private renderScienceReportMarkdown(report: { query?: string; projectContext?: string; hypotheses?: Array<{ agent: string; content: string }>; reviews?: Array<{ reviewer: string; target: string; critique: string }>; rebuttals?: Array<{ agent: string; content: string }>; synthesis?: string; recommendedActions?: string[] }): string {
    const header = `\n📄 [Aetherius Science Report]\n- Tick: ${this.world.tickCount}\n- Query: ${report.query}\n\n`;
    const agents = (report.hypotheses ?? []).map((h) => `## ${h.agent}\n${h.content}\n`).join('\n');
    const reviews = (report.reviews ?? []).map((r) => `- ${r.reviewer} → ${r.target}\n${r.critique}\n`).join('\n');
    const rebuttals = (report.rebuttals ?? []).map((r) => `- ${r.agent}: ${r.content}\n`).join('\n');
    const recommended = (report.recommendedActions ?? []).length > 0
      ? `\n# Recommended Actions\n${(report.recommendedActions ?? []).map((c) => `- ${c}`).join('\n')}\n`
      : '';
    return `${header}# Context\n${report.projectContext ?? ''}\n\n# Hypotheses\n${agents}\n# Peer Review\n${reviews}\n# Rebuttals\n${rebuttals}\n# Synthesis\n${report.synthesis ?? ''}${recommended}\n`;
  }

  private async appendScienceReportToFile(entry: unknown): Promise<void> {
    const dir = path.join(process.cwd(), 'data', 'reports');
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, 'science_reports.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  }

  private handleAiEvents(args: string[]): CommandResult {
    const state = args[0]?.toLowerCase();
    const sys = (this.world as World & { aiEventOrchestratorSystem?: { toggle: (v: boolean) => void } }).aiEventOrchestratorSystem;
    if (!sys) return { success: false, message: 'AI event system not initialized.' };
    if (state === 'on') { sys.toggle(true); return { success: true, message: 'AI event handling enabled.' }; }
    if (state === 'off') { sys.toggle(false); return { success: true, message: 'AI event handling disabled.' }; }
    return { success: false, message: 'Usage: ai_events <on|off>' };
  }

  private handleSpace(_args: string[]): CommandResult {
    const worldIds = universeRegistry.listWorldIds();
    const wormholes = universeRegistry.listWormholes();
    const lines = [`\n🪐 [SPACE STATUS]`, `Worlds: ${worldIds.length ? worldIds.join(', ') : '(none registered)'}`];
    if (wormholes.length === 0) lines.push('Wormholes: (none)');
    else { lines.push('Wormholes:'); for (const w of wormholes) lines.push(`- ${w.id}: ${w.a} <-> ${w.b} (expires@${w.expiresAtTick}, stability=${w.stability.toFixed(2)})`); }
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
    const id = (handle?.world ?? this.world).nextId('Drone');
    const entity = createEntityByAssemblyWithManager(manager as ReturnType<World['getAssembleManager']>, 'Drone_Observer_001', id);
    const behavior = entity.children[0] as { components?: { identity?: { owner: string; role: string }; mission?: { mode: string }; intervention?: { enabled: boolean } } };
    if (behavior?.components) {
      behavior.components.identity = behavior.components.identity ?? {} as { owner: string; role: string };
      behavior.components.identity.owner = 'ScientistCouncil';
      behavior.components.identity.role = role;
      behavior.components.mission = behavior.components.mission ?? {} as { mode: string };
      behavior.components.mission.mode = mode;
      behavior.components.intervention = behavior.components.intervention ?? {} as { enabled: boolean };
      behavior.components.intervention.enabled = mode !== 'documentary';
    }
    return { success: true, message: `Deployed drone ${id} in world ${worldId} (role=${role}, mode=${mode})` };
  }

  private handleDrones(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const drones = (manager.entities ?? []).filter((e: unknown) => (e as { children?: Array<{ components?: { mission?: unknown; camera?: unknown } }> })?.children?.[0]?.components?.mission && (e as { children?: Array<{ components?: { camera?: unknown } }> })?.children?.[0]?.components?.camera);
    if (drones.length === 0) return { success: true, message: `No drones found in world ${worldId}.` };
    const lines = drones.map((e: unknown) => {
      const c = (e as { children?: Array<{ components?: { identity?: { role: string }; mission?: { mode: string }; energy?: { energy?: number } } }> })?.children?.[0]?.components;
      return `- ${(e as { id: string }).id} role=${c?.identity?.role} mode=${c?.mission?.mode} energy=${typeof c?.energy?.energy === 'number' ? c.energy.energy.toFixed(1) : c?.energy?.energy}`;
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
    const behavior = found.entity.children?.[0] as { components?: { mission?: { mode: string; text?: string }; intervention?: { enabled: boolean } } };
    const c = behavior?.components;
    if (!c?.mission) return { success: false, message: `Entity is not a drone: ${droneId}` };
    c.mission.mode = mode;
    c.mission.text = text || undefined;
    if (c.intervention) c.intervention.enabled = mode !== 'documentary';
    return { success: true, message: `Updated drone ${droneId}: mode=${mode}` };
  }

  private handleTaxonomy(args: string[]): CommandResult {
    const entityId = args[0];
    if (!entityId) return { success: false, message: 'Usage: taxonomy <entityId>' };
    const found = universeRegistry.findEntityAcrossWorlds(entityId);
    if (!found) return { success: false, message: `Entity not found: ${entityId}` };
    const c = (found.entity.children?.[0] as { components?: Record<string, unknown> })?.components;
    const snapshot = { worldId: found.worldId, id: entityId, classification: c?.classification, lifeStage: c?.lifeStage, taxonomy: c?.taxonomy, disease: c?.disease, position: c?.position, vitality: c?.vitality, energy: c?.energy, goalGA: c?.goalGA };
    return { success: true, message: JSON.stringify(snapshot, null, 2) };
  }

  /** 생명 과학자: 특징이 뚜렷한 종 발견 시 네이밍 후 DB(species_named) 저장 */
  private async handleLifeScienceDiscover(_args: string[]): Promise<CommandResult> {
    const manager = this.getManager();
    const entities = manager.entities ?? [];
    const withTaxonomy: Array<{ id: string; taxonomy: unknown; classification?: unknown; position?: { x: number; y: number } }> = [];
    for (const e of entities) {
      const ent = e as { id: string; children?: Array<{ components?: Record<string, unknown> }> };
      const c = ent.children?.[0]?.components;
      if (c?.taxonomy) withTaxonomy.push({ id: ent.id, taxonomy: c.taxonomy, classification: c.classification, position: c.position as { x: number; y: number } | undefined });
    }
    if (withTaxonomy.length === 0) return { success: true, message: 'No entities with taxonomy to discover. Spawn or run a few ticks first.' };
    const entitiesSummary = withTaxonomy.map((x) => `id=${x.id} taxonomy=${JSON.stringify(x.taxonomy)} classification=${JSON.stringify(x.classification)} position=${JSON.stringify(x.position)}`).join('\n');
    const llm = createDefaultLLMService();
    const lifeAgent = new LifeScienceAgent(llm);
    const discoveries = await lifeAgent.suggestSpeciesNames(entitiesSummary);
    const worldId = this.world.id;
    const tick = this.world.tickCount;
    for (const d of discoveries) {
      const taxonomySnapshot = withTaxonomy.find((x) => x.id === d.entityId)?.taxonomy;
      await this.world.persistence.saveWorldEvent({
        worldId,
        tick,
        type: 'species_named',
        location: { x: 0, y: 0 },
        details: JSON.stringify({ entityId: d.entityId, suggestedName: d.suggestedName, taxonomySnapshot, reason: d.reason, tick })
      });
    }
    if (discoveries.length === 0) return { success: true, message: 'Life scientist found no distinctly notable species to name this time.' };
    return { success: true, message: `Named ${discoveries.length} species and saved to DB: ${discoveries.map((d) => d.suggestedName).join(', ')}` };
  }

  /** 생명 과학자: 현재 생명 다양성 관찰 요약을 DB(life_science_observation)에 저장 */
  private async handleLifeScienceObserve(_args: string[]): Promise<CommandResult> {
    const manager = this.getManager();
    const entities = manager.entities ?? [];
    const withTaxonomy: Array<{ id: string; taxonomy: unknown }> = [];
    for (const e of entities) {
      const ent = e as { id: string; children?: Array<{ components?: Record<string, unknown> }> };
      const c = ent.children?.[0]?.components;
      if (c?.taxonomy) withTaxonomy.push({ id: ent.id, taxonomy: c.taxonomy });
    }
    const entitiesSummary = withTaxonomy.length > 0
      ? withTaxonomy.map((x) => `id=${x.id} taxonomy=${JSON.stringify(x.taxonomy)}`).join('\n')
      : 'No entities with taxonomy.';
    const llm = createDefaultLLMService();
    const lifeAgent = new LifeScienceAgent(llm);
    const summary = await lifeAgent.observeDiversity(entitiesSummary);
    await this.world.persistence.saveWorldEvent({
      worldId: this.world.id,
      tick: this.world.tickCount,
      type: 'life_science_observation',
      location: { x: 0, y: 0 },
      details: JSON.stringify({ tick: this.world.tickCount, summary, entityCount: withTaxonomy.length })
    });
    return { success: true, message: `Observation saved to DB.\n${summary}` };
  }

  private handleDiseaseStats(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const eco = (handle?.world as World & { ecosystemSystem?: { getDiseaseStats: (m: unknown) => unknown } })?.ecosystemSystem;
    if (!eco?.getDiseaseStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getDiseaseStats(manager);
    return { success: true, message: `\n🦠 [DISEASE @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleCorpses(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const manager = handle?.manager ?? this.getManager();
    const eco = (handle?.world as World & { ecosystemSystem?: { getCorpseStats: (m: unknown) => unknown } })?.ecosystemSystem;
    if (!eco?.getCorpseStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getCorpseStats(manager);
    return { success: true, message: `\n🪦 [CORPSES @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleMigrationStats(args: string[]): CommandResult {
    const worldId = args[0] || this.world.id;
    const handle = universeRegistry.getWorld(worldId);
    const eco = (handle?.world as World & { ecosystemSystem?: { getMigrationStats: () => unknown } })?.ecosystemSystem;
    if (!eco?.getMigrationStats) return { success: false, message: `Ecosystem system not active for world ${worldId}` };
    const stats = eco.getMigrationStats();
    return { success: true, message: `\n🧭 [MIGRATION @ ${worldId}]\n${JSON.stringify(stats, null, 2)}` };
  }

  private handleCreatePlace(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);
    const name = args.slice(2).join(' ') || `Place_${this.world.tickCount}`;

    if (isNaN(x) || isNaN(y)) {
      return { success: false, message: 'Usage: create_place <x> <y> [name]' };
    }

    const mazeSystem = (this.world as any).mazeSystem;
    if (!mazeSystem) return { success: false, message: 'MazeSystem not active.' };

    // Create the node via MazeNetwork
    const node = mazeSystem.network.createNode(x, y, name);
    return { success: true, message: `Created place '${name}' at (${x}, ${y}) with ID ${node.id}` };
  }

  private handleModifyTerrain(args: string[]): CommandResult {
    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);
    const radius = parseFloat(args[2]);
    const layerName = args[3]?.toLowerCase();
    const value = parseFloat(args[4]);

    if (isNaN(x) || isNaN(y) || isNaN(radius) || !layerName || isNaN(value)) {
      return { success: false, message: 'Usage: modify_terrain <x> <y> <radius> <layer> <value>' };
    }

    let layer: Layer | undefined;
    switch (layerName) {
      case 'temp': case 'temperature': layer = Layer.Temperature; break;
      case 'humidity': layer = Layer.Humidity; break;
      case 'moisture': case 'soil_moisture': layer = Layer.SoilMoisture; break;
      case 'elevation': case 'height': layer = Layer.Elevation; break;
      case 'nitrogen': layer = Layer.SoilNitrogen; break;
      case 'phosphorus': layer = Layer.SoilPhosphorus; break;
      case 'potassium': layer = Layer.SoilPotassium; break;
      case 'light': layer = Layer.LightIntensity; break;
      case 'co2': layer = Layer.CO2Concentration; break;
      case 'pollution': layer = Layer.Pollution; break;
      case 'compaction': layer = Layer.Compaction; break;
      case 'ph': layer = Layer.PHLevel; break;
      case 'salinity': layer = Layer.SoilSalinity; break;
      case 'organic': layer = Layer.OrganicMatter; break;
      case 'groundwater': layer = Layer.GroundWaterLevel; break;
      case 'uv': layer = Layer.UVRadiation; break;
    }

    if (layer === undefined) {
      return { success: false, message: `Unknown layer: ${layerName}` };
    }

    const env = this.world.environment;
    let count = 0;
    // Iterate over the bounding box of the circle
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(env.width - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(env.height - 1, Math.ceil(y + radius));

    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        const dist = Math.sqrt((i - x) ** 2 + (j - y) ** 2);
        if (dist <= radius) {
          env.set(i, j, layer, value);
          count++;
        }
      }
    }

    return { success: true, message: `Modified ${layerName} to ${value} in ${count} cells around (${x}, ${y})` };
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
  - ask_science <query> [--execute]: Consult the council of scientists; --execute runs recommended actions
  - ai_events <on|off>: Let AI handle events
  - space: View worlds and wormholes
  - warp <entityId> <worldId>: Move an entity between worlds
  - deploy_drone [role] [worldId] [mode]: Send a scientist drone (modes: documentary|survey|irrigate|cool|heat|seed_place)
  - drones [worldId]: List drones
  - drone_mission <droneId> <mode> [text]: Update drone mission
  - taxonomy <entityId>: Inspect classification/taxonomy/disease
  - life_science_discover: Life scientist names distinct species and saves to DB
  - life_science_observe: Life scientist observes biodiversity and saves observation to DB
  - disease_stats [worldId]: Disease summary
  - corpses [worldId]: Corpse summary
  - migration_stats [worldId]: Place population summary
  - spawn_entity <plant|ga> [name]: Create life
  - change_environment <param> <value>: Alter the sky
  - inspect_pos <x> <y>: Gaze at the earth
  - status [id]: Know a soul
  - latest_snapshot: Load latest saved snapshot (current world)
  - db_status: Show persistence driver and current DB state
  - help`
    };
  }
}
