import { World } from '../../core/world.js';
import { System } from '../../core/events/eventTypes.js';

export type AsyncRequestEvent = System.AsyncRequest;

export class WorldSession {
    public world: World;
    private isRunning: boolean = false;
    private tickIntervalMs: number = 1000;
    private tickTimer: NodeJS.Timeout | null = null;
    private isTicking: boolean = false;

    constructor(world: World) {
        this.world = world;
    }

    startLoop(intervalMs: number = 1000) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.tickIntervalMs = intervalMs;

        console.log(`[WorldSession] Starting tick loop for world ${this.world.id} (${intervalMs}ms)`);

        this.tickTimer = setInterval(() => {
            void this.processTick();
        }, this.tickIntervalMs);
    }

    stopLoop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
        console.log(`[WorldSession] Stopped tick loop for world ${this.world.id}`);
    }

    enqueueRequest(action: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const event = new System.AsyncRequest({
                requestId: this.world.nextId('req'),
                action,
                params,
                resolve,
                reject
            });

            this.world.eventLoop.emit(event);
        });
    }

    async tickNow(count: number = 1): Promise<any> {
        const n = Math.max(1, Number(count || 1));
        if (this.isTicking) return { success: false, message: 'World is currently ticking.' };
        this.isTicking = true;
        try {
            for (let i = 0; i < n; i++) {
                await this.world.tick();
            }
            return { success: true, message: `Advanced ${n} ticks. (worldTick=${this.world.tickCount})` };
        } finally {
            this.isTicking = false;
        }
    }

    private async processTick(): Promise<void> {
        if (this.isTicking) return;
        this.isTicking = true;
        try {
            await this.world.tick();
        } catch (error) {
            console.error(`[WorldSession] Tick error in world ${this.world.id}:`, error);
        } finally {
            this.isTicking = false;
        }
    }
}
