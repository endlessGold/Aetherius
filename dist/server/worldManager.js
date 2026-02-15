import { World } from '../core/world.js';
import { v4 as uuidv4 } from 'uuid';
export class WorldManager {
    constructor() {
        this.worlds = new Map();
    }
    createWorld(id = uuidv4()) {
        const world = new World(id);
        this.worlds.set(id, world);
        console.log(`[WorldManager] Created world: ${id}`);
        return world;
    }
    getWorld(id) {
        return this.worlds.get(id);
    }
    deleteWorld(id) {
        return this.worlds.delete(id);
    }
    listWorlds() {
        return Array.from(this.worlds.keys());
    }
    // Tick all worlds
    tickAll() {
        this.worlds.forEach(world => {
            try {
                world.tick();
            }
            catch (e) {
                console.error(`[WorldManager] Error ticking world ${world.id}:`, e);
            }
        });
    }
}
