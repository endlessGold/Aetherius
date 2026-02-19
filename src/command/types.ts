import type { World } from '../core/world.js';
import type { ScienceOrchestrator } from '../ai/orchestrator.js';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export type CommandHandlerFn = (
  ctx: CommandContext,
  args: string[]
) => CommandResult | Promise<CommandResult>;

export interface CommandContext {
  world: World;
  weatherEntity: { children?: Array<{ components?: unknown }> } | null;
  getManager: () => { entities: unknown[]; getEntity: (id: string) => unknown };
  scienceOrchestrator: ScienceOrchestrator;
}
