/**
 * Command registry: command name -> handler.
 * Handlers live in app/commandHandler for now; this index is for future per-domain modules.
 */
import type { CommandHandlerFn } from '../types.js';

export type CommandRegistry = Map<string, CommandHandlerFn>;

export function createCommandRegistry(handlers: Record<string, CommandHandlerFn>): CommandRegistry {
  const map = new Map<string, CommandHandlerFn>();
  for (const [name, fn] of Object.entries(handlers)) {
    map.set(name.toLowerCase(), fn);
  }
  return map;
}
