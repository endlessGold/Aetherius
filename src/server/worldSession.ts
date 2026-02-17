import { World } from '../core/world.js';
import { System } from '../core/events/eventTypes.js';

// 비동기 요청을 Tick 루프에 안전하게 전달하기 위한 래퍼 이벤트
export type AsyncRequestEvent = System.AsyncRequest;

export class WorldSession {
    public world: World;
    private isRunning: boolean = false;
    private tickIntervalMs: number = 1000; // 1초
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

    // 핵심: API 요청을 이벤트 큐에 넣고 Promise 반환 (비동기 대기)
    enqueueRequest(action: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const event = new System.AsyncRequest({
                requestId: `req-${Date.now()}-${Math.random()}`,
                action,
                params,
                resolve,
                reject
            });

            // World의 EventLoop에 등록
            // 주의: World의 EventLoop는 단순히 emit만 하므로,
            // 이를 처리할 핸들러가 등록되어 있어야 함.
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
            // 1. World Tick 실행 (여기서 내부 큐에 쌓인 이벤트들이 처리됨)
            // AsyncRequestEvent는 별도의 핸들러가 처리해야 함
            await this.world.tick();
        } catch (error) {
            console.error(`[WorldSession] Tick error in world ${this.world.id}:`, error);
        } finally {
            this.isTicking = false;
        }
    }
}
