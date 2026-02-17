import type { World } from '../world.js';
import { Place } from './placeNode.js';
import type { AssembleManager } from '../../entities/assembly.js';

export class MazeNetwork {
    nodes: Map<string, Place> = new Map();
    private nextId: number = 1;
    private manager: AssembleManager;

    constructor(manager: AssembleManager) {
        this.manager = manager;
        // Create initial seed nodes
        this.createNode(20, 20, "Origin");
        this.createNode(80, 80, "Farlands");
        this.createNode(20, 80, "Wilds");
        this.createNode(80, 20, "Oasis");
    }

    createNode(x: number, y: number, name?: string): Place {
        const id = `Loc_${this.nextId++}`;
        const node = new Place(id, name || `Place ${this.nextId}`, x, y);
        this.nodes.set(id, node);
        
        // Register to AssembleManager so it exists in the world
        // AssembleManager handles entities, and Place IS an entity now.
        this.manager.registerEntity(node);
        
        return node;
    }

    getNearestNode(x: number, y: number, maxDist: number = 20): Place | null {
        let nearest: Place | null = null;
        let minDist = maxDist;

        for (const node of this.nodes.values()) {
            const pos = node.position;
            const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            if (dist < minDist) {
                minDist = dist;
                nearest = node;
            }
        }
        return nearest;
    }

    reinforcePath(fromId: string, toId: string, amount: number) {
        const from = this.nodes.get(fromId);
        const to = this.nodes.get(toId);
        if (!from || !to) return;

        // Add connection or strengthen existing
        const w1 = from.maze.connections.get(toId) || 0;
        from.maze.connections.set(toId, Math.min(100, w1 + amount));

        const w2 = to.maze.connections.get(fromId) || 0;
        to.maze.connections.set(fromId, Math.min(100, w2 + amount));
        
        // Boost activity
        from.maze.activityLevel = Math.min(100, from.maze.activityLevel + amount);
        to.maze.activityLevel = Math.min(100, to.maze.activityLevel + amount);
    }

    decay(amount: number) {
        // const toRemove: string[] = [];
        
        for (const node of this.nodes.values()) {
            node.maze.activityLevel = Math.max(0, node.maze.activityLevel - amount);
            
            // Decay connections
            for (const [targetId, weight] of node.maze.connections) {
                const newWeight = Math.max(0, weight - amount);
                if (newWeight <= 0) {
                    node.maze.connections.delete(targetId);
                } else {
                    node.maze.connections.set(targetId, newWeight);
                }
            }

            // Mark dead nodes
            if (node.maze.activityLevel <= 0 && node.maze.connections.size === 0) {
                // toRemove.push(node.id); 
            }
        }
        
        // toRemove.forEach(id => this.nodes.delete(id));
    }
}

export class MazeSystem {
    network: MazeNetwork;
    private world: World;
    private entityLastNode: Map<string, string> = new Map(); // EntityID -> LastVisitedNodeID
    private manager: AssembleManager;

    constructor(world: World) {
        this.world = world;
        this.manager = world.getAssembleManager();
        this.network = new MazeNetwork(this.manager);
    }

    tick() {
        if (this.world.tickCount % 100 === 0) {
            this.network.decay(1); // Slow decay every 100 ticks
            this.spawnNewPlaces();
        }

        this.trackMovement();
    }

    private trackMovement() {
        this.manager.entities.forEach(entity => {
            // Skip Places to avoid self-reinforcement loops
            if (entity instanceof Place) return;

            const behavior = entity.children[0] as any;
            if (!behavior || !behavior.components || !behavior.components.position) return;
            
            const pos = behavior.components.position;
            const nearest = this.network.getNearestNode(pos.x, pos.y, 8); // Within 8 units

            if (nearest) {
                const lastNodeId = this.entityLastNode.get(entity.id);
                
                if (lastNodeId && lastNodeId !== nearest.id) {
                    // Moved from one node to another -> Reinforce path
                    this.network.reinforcePath(lastNodeId, nearest.id, 0.5);
                }
                
                // Update current node
                this.entityLastNode.set(entity.id, nearest.id);
                nearest.maze.activityLevel = Math.min(100, nearest.maze.activityLevel + 0.1);
            }
        });
    }

    private spawnNewPlaces() {
        if (this.manager.entities.length === 0) return;
        
        for(let i=0; i<5; i++) {
            const rnd = Math.floor(Math.random() * this.manager.entities.length);
            const entity = this.manager.entities[rnd];
            
            // Skip Places
            if (entity instanceof Place) continue;

            const behavior = entity.children[0] as any;
            if (!behavior || !behavior.components || !behavior.components.position) continue;
            
            const pos = behavior.components.position;
            
            const nearest = this.network.getNearestNode(pos.x, pos.y, 15);
            if (!nearest) {
                if (Math.random() < 0.05) {
                    const node = this.network.createNode(pos.x, pos.y);
                    console.log(`🏰 New Place Discovered: ${node.data.identity.name} at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                }
            }
        }
    }
}
