import type { World } from '../world.js';
import { LLMService, createDefaultLLMService } from '../../ai/llmService.js';
import { EnvironmentLayer } from '../environment/environmentGrid.js';
import { Environment } from '../events/eventTypes.js';

export class AutoSystem {
  private world: World;
  private llm: LLMService;
  private isEnabled: boolean = false;
  private lastActionTick: number = 0;
  private actionInterval: number = 100; // Decisions every 100 ticks

  constructor(world: World) {
    this.world = world;
    this.llm = createDefaultLLMService();
  }

  toggle(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`🤖 [AUTO SYSTEM] System is now ${enabled ? 'ACTIVE' : 'DORMANT'}.`);
  }

  async tick() {
    if (!this.isEnabled) return;
    if (this.world.tickCount - this.lastActionTick < this.actionInterval) return;

    this.lastActionTick = this.world.tickCount;
    await this.decideAndAct();
  }

  private async decideAndAct() {
    // Gather World State
    const state = this.getWorldState();

    // Construct Prompt
    const prompt = `
    You are the AI Highest Authority System of a simulation. Analyze the current state and choose ONE system-level intervention.

    CURRENT STATE:
    - Tick: ${state.tick}
    - Population: ${state.population} (Plants: ${state.plants}, Creatures: ${state.creatures})
    - Avg Health: ${state.avgHp.toFixed(1)}
    - Avg Energy: ${state.avgEnergy.toFixed(1)}
    - Environment: Temp ${state.avgTemp.toFixed(1)}, Moisture ${state.avgMoisture.toFixed(1)}

    AVAILABLE ACTIONS:
    - "smite": Kill entities in a radius (use if overpopulated > 50)
    - "bless": Heal entities (use if health < 30)
    - "flood": Raise moisture globally (use if moisture < 20)
    - "none": Do nothing (if balanced)

    OUTPUT FORMAT (JSON ONLY):
    {
      "action": "smite" | "bless" | "flood" | "none",
      "reason": "Brief explanation",
      "target": { "x": number, "y": number } (Required for smite, 0-100 range)
    }
    `;

    // Call LLM
    console.log(`🤖 [AUTO SYSTEM] Contemplating...`);
    const decision = await this.llm.generateDecision(prompt, null);

    if (decision) {
      await this.executeDecision(decision);
    } else {
      console.log(`🤖 [AUTO SYSTEM] The system remained silent (LLM Error).`);
    }
  }

  private getWorldState() {
    const manager = this.world.getAssembleManager();
    let plants = 0;
    let creatures = 0;
    let totalHp = 0;
    let totalEnergy = 0;
    const count = manager.entities.length;

    manager.entities.forEach(e => {
      const c = (e.children[0] as any).components;
      if (c.growth) plants++;
      if (c.directionGA) creatures++;
      if (c.vitality) totalHp += c.vitality.hp;
      if (c.energy) totalEnergy += c.energy.energy;
    });

    // Env samples (center)
    const grid = this.world.environment;
    const centerT = grid.get(50, 50, EnvironmentLayer.Temperature);
    const centerM = grid.get(50, 50, EnvironmentLayer.SoilMoisture);

    return {
      tick: this.world.tickCount,
      population: count,
      plants,
      creatures,
      avgHp: count > 0 ? totalHp / count : 0,
      avgEnergy: count > 0 ? totalEnergy / count : 0,
      avgTemp: centerT,
      avgMoisture: centerM
    };
  }

  private async executeDecision(decision: any) {
    console.log(`🤖 [AUTO SYSTEM] Decision: ${decision.action.toUpperCase()} - "${decision.reason}"`);

    // Save log (DB telemetry)
    this.world.persistence.saveWorldEvent({
      worldId: this.world.id,
      tick: this.world.tickCount,
      type: 'OTHER',
      location: { x: 0, y: 0 },
      details: `[AUTO_SYSTEM] ${decision.action}: ${decision.reason}`
    }).catch(e => { });

    switch (decision.action) {
      case 'smite':
        // Reuse logic via command handler style or direct implementation?
        // For now, direct implementation for simplicity
        if (decision.target) {
          this.world.environment.add(decision.target.x, decision.target.y, EnvironmentLayer.Temperature, 100);
          console.log(`⚡ [AUTO SYSTEM] Smited location (${decision.target.x}, ${decision.target.y})`);
        }
        break;
      case 'bless':
        this.world.getAssembleManager().entities.forEach(e => {
          const c = (e.children[0] as any).components;
          if (c.vitality) c.vitality.hp = 100;
        });
        console.log(`✨ [AUTO SYSTEM] Blessed the world.`);
        break;
      case 'flood':
        this.world.eventBus.publish(new Environment.GlobalParameterChange(EnvironmentLayer.SoilMoisture, 0.5, 'AutoGodSystem'));
        console.log(`🌊 [AUTO SYSTEM] Brought the rain.`);
        break;
      case 'none':
      default:
        console.log(`🍃 [AUTO SYSTEM] Watches silently.`);
        break;
    }
  }
}
