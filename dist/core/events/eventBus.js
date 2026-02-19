export class EventBus {
    constructor() {
        this.handlers = new Map();
        this.categoryHandlers = new Map();
        this.queue = [];
        this.isProcessing = false;
    }
    // 특정 이벤트 타입 구독
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push({ handler });
    }
    subscribeFiltered(eventType, handler, filter) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push({ handler, filter });
    }
    // 카테고리 전체 구독 (예: 모든 물리 이벤트 로깅)
    subscribeCategory(category, handler) {
        if (!this.categoryHandlers.has(category)) {
            this.categoryHandlers.set(category, []);
        }
        this.categoryHandlers.get(category).push({ handler });
    }
    subscribeCategoryFiltered(category, handler, filter) {
        if (!this.categoryHandlers.has(category)) {
            this.categoryHandlers.set(category, []);
        }
        this.categoryHandlers.get(category).push({ handler, filter });
    }
    // 이벤트 발행 (큐에 추가)
    publish(event) {
        // 우선순위에 따라 큐 정렬 (간단한 삽입 정렬 또는 힙 사용 가능하지만 여기선 push 후 sort)
        this.queue.push(event);
        // 높은 우선순위가 먼저 오도록 정렬 (내림차순)
        this.queue.sort((a, b) => b.priority - a.priority);
    }
    // 큐 처리 (Tick 루프에서 호출)
    async processQueue() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        const eventsToProcess = [...this.queue];
        this.queue = []; // 큐 비우기
        for (const event of eventsToProcess) {
            await this.handleEvent(event);
        }
        this.isProcessing = false;
    }
    async handleEvent(event) {
        const propagate = event.payload?.propagate;
        const extraTypes = Array.isArray(propagate?.types) ? propagate.types : [];
        const types = new Set([event.constructor, ...extraTypes]);
        const categories = new Set([
            event.category,
            ...(Array.isArray(propagate?.categories) ? propagate.categories : [])
        ]);
        for (const type of types) {
            const specificHandlers = this.handlers.get(type) || [];
            for (const entry of specificHandlers) {
                if (entry.filter && !entry.filter(event))
                    continue;
                try {
                    await entry.handler(event);
                }
                catch (e) {
                    console.error(`[EventBus] Error in handler for ${type.name}:`, e);
                }
            }
        }
        for (const category of categories) {
            const catHandlers = this.categoryHandlers.get(category) || [];
            for (const entry of catHandlers) {
                if (entry.filter && !entry.filter(event))
                    continue;
                try {
                    await entry.handler(event);
                }
                catch (e) {
                    console.error(`[EventBus] Error in category handler for ${category}:`, e);
                }
            }
        }
    }
}
