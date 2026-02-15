import { GameEvent, EventCategory } from './eventTypes.js';

// 이벤트 핸들러 타입 정의
export type EventHandler<T = any> = (event: GameEvent<T>) => void | Promise<void>;

// 이벤트 버스 인터페이스
export interface IEventBus {
    subscribe(eventType: string, handler: EventHandler): void;
    subscribeCategory(category: EventCategory, handler: EventHandler): void;
    publish(event: GameEvent): void;
    processQueue(): Promise<void>;
}

export class EventBus implements IEventBus {
    private handlers: Map<string, EventHandler[]> = new Map();
    private categoryHandlers: Map<EventCategory, EventHandler[]> = new Map();
    private queue: GameEvent[] = [];
    private isProcessing: boolean = false;

    // 특정 이벤트 타입 구독
    subscribe(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    // 카테고리 전체 구독 (예: 모든 물리 이벤트 로깅)
    subscribeCategory(category: EventCategory, handler: EventHandler): void {
        if (!this.categoryHandlers.has(category)) {
            this.categoryHandlers.set(category, []);
        }
        this.categoryHandlers.get(category)!.push(handler);
    }

    // 이벤트 발행 (큐에 추가)
    publish(event: GameEvent): void {
        // 우선순위에 따라 큐 정렬 (간단한 삽입 정렬 또는 힙 사용 가능하지만 여기선 push 후 sort)
        this.queue.push(event);
        // 높은 우선순위가 먼저 오도록 정렬 (내림차순)
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    // 큐 처리 (Tick 루프에서 호출)
    async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const eventsToProcess = [...this.queue];
        this.queue = []; // 큐 비우기

        for (const event of eventsToProcess) {
            await this.handleEvent(event);
        }

        this.isProcessing = false;
    }

    private async handleEvent(event: GameEvent) {
        // 1. 타입별 핸들러 실행
        const specificHandlers = this.handlers.get(event.type) || [];
        for (const handler of specificHandlers) {
            try {
                await handler(event);
            } catch (e) {
                console.error(`[EventBus] Error in handler for ${event.type}:`, e);
            }
        }

        // 2. 카테고리별 핸들러 실행
        const catHandlers = this.categoryHandlers.get(event.category) || [];
        for (const handler of catHandlers) {
            try {
                await handler(event);
            } catch (e) {
                console.error(`[EventBus] Error in category handler for ${event.category}:`, e);
            }
        }
    }
}
