import { World } from '../core/world.js';
import { v4 as uuidv4 } from 'uuid';

export class WorldManager {
    private worlds: Map<string, World> = new Map();

    createWorld(id: string = uuidv4()): World {
        const world = new World(id);
        this.worlds.set(id, world);
        console.log(`[WorldManager] Created world: ${id}`);
        return world;
    }

    getWorld(id: string): World | undefined {
        return this.worlds.get(id);
    }

    deleteWorld(id: string): boolean {
        return this.worlds.delete(id);
    }

    listWorlds(): string[] {
        return Array.from(this.worlds.keys());
    }

    // Tick all worlds
    async tickAll(): Promise<void> {
        for (const world of this.worlds.values()) {
            try {
                await world.tick();
            } catch (e) {
                console.error(`[WorldManager] Error ticking world ${world.id}:`, e);
            }
        }
    }
}
