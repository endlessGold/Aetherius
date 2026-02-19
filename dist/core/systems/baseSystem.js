// 모든 시스템(System)의 기본 추상 클래스
export class BaseSystem {
    constructor(id, eventBus) {
        this.id = id;
        this.eventBus = eventBus;
        this.registerHandlers();
    }
    // 편의 메서드: 이벤트 발행
    publish(event) {
        this.eventBus.publish(event);
    }
    // 편의 메서드: 구독
    subscribe(eventType, handler) {
        this.eventBus.subscribe(eventType, handler.bind(this));
    }
}
