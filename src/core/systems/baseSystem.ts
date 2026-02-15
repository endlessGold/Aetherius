import { IEventBus, EventHandler } from './events/eventBus.js';
import { GameEvent, EventCategory } from './events/eventTypes.js';

// 모든 시스템(System)의 기본 추상 클래스
export abstract class BaseSystem {
    protected eventBus: IEventBus;
    public id: string;

    constructor(id: string, eventBus: IEventBus) {
        this.id = id;
        this.eventBus = eventBus;
        this.registerHandlers();
    }

    // 하위 클래스에서 구현: 이벤트 구독 등록
    protected abstract registerHandlers(): void;

    // 편의 메서드: 이벤트 발행
    protected publish(event: GameEvent): void {
        this.eventBus.publish(event);
    }

    // 편의 메서드: 구독
    protected subscribe(eventType: string, handler: EventHandler): void {
        this.eventBus.subscribe(eventType, handler.bind(this));
    }
}
