import { Simulation, EventCategory, EventCtor } from './eventTypes.js';

// 이벤트 핸들러 타입 정의
export type EventHandler<T extends Simulation.Event = Simulation.Event> = (event: T) => void | Promise<void>;
export type EventFilter<T extends Simulation.Event = Simulation.Event> = (event: T) => boolean;
type HandlerEntry<T extends Simulation.Event = Simulation.Event> = { handler: EventHandler<T>; filter?: EventFilter<T> };

// 이벤트 버스 인터페이스
export interface IEventBus {
    subscribe<T extends Simulation.Event>(eventType: EventCtor<T>, handler: EventHandler<T>): void;
    subscribeFiltered<T extends Simulation.Event>(eventType: EventCtor<T>, handler: EventHandler<T>, filter: EventFilter<T>): void;
    subscribeCategory(category: EventCategory, handler: EventHandler): void;
    subscribeCategoryFiltered(category: EventCategory, handler: EventHandler, filter: EventFilter): void;
    publish(event: Simulation.Event): void;
    processQueue(): Promise<void>;
}

export class EventBus implements IEventBus {
    private handlers: Map<EventCtor, HandlerEntry[]> = new Map();
    private categoryHandlers: Map<EventCategory, HandlerEntry[]> = new Map();
    private queue: Simulation.Event[] = [];
    private isProcessing: boolean = false;

    // 특정 이벤트 타입 구독
    subscribe<T extends Simulation.Event>(eventType: EventCtor<T>, handler: EventHandler<T>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        (this.handlers.get(eventType) as HandlerEntry<T>[]).push({ handler });
    }

    subscribeFiltered<T extends Simulation.Event>(eventType: EventCtor<T>, handler: EventHandler<T>, filter: EventFilter<T>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        (this.handlers.get(eventType) as HandlerEntry<T>[]).push({ handler, filter });
    }

    // 카테고리 전체 구독 (예: 모든 물리 이벤트 로깅)
    subscribeCategory(category: EventCategory, handler: EventHandler): void {
        if (!this.categoryHandlers.has(category)) {
            this.categoryHandlers.set(category, []);
        }
        this.categoryHandlers.get(category)!.push({ handler });
    }

    subscribeCategoryFiltered(category: EventCategory, handler: EventHandler, filter: EventFilter): void {
        if (!this.categoryHandlers.has(category)) {
            this.categoryHandlers.set(category, []);
        }
        this.categoryHandlers.get(category)!.push({ handler, filter });
    }

    // 이벤트 발행 (큐에 추가)
    publish(event: Simulation.Event): void {
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

    private async handleEvent(event: Simulation.Event) {
        const propagate = (event.payload as any)?.propagate;
        const extraTypes = Array.isArray(propagate?.types) ? (propagate.types as EventCtor[]) : [];
        const types = new Set<EventCtor>([event.constructor as EventCtor, ...extraTypes]);
        const categories = new Set<EventCategory>([
            event.category,
            ...(Array.isArray(propagate?.categories) ? propagate.categories : [])
        ]);

        for (const type of types) {
            const specificHandlers = this.handlers.get(type) || [];
            for (const entry of specificHandlers) {
                if (entry.filter && !entry.filter(event)) continue;
                try {
                    await entry.handler(event);
                } catch (e) {
                    console.error(`[EventBus] Error in handler for ${type.name}:`, e);
                }
            }
        }

        for (const category of categories) {
            const catHandlers = this.categoryHandlers.get(category) || [];
            for (const entry of catHandlers) {
                if (entry.filter && !entry.filter(event)) continue;
                try {
                    await entry.handler(event);
                } catch (e) {
                    console.error(`[EventBus] Error in category handler for ${category}:`, e);
                }
            }
        }
    }
}
