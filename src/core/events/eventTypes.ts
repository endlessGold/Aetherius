// 기본 이벤트 인터페이스 (확장)
export interface BaseEvent {
    id: string;
    type: string;
    timestamp: number;
    sourceId?: string; // 이벤트를 발생시킨 주체 (Entity ID 등)
    priority: number; // 0: Low, 1: Normal, 2: High, 3: Critical
}

// 이벤트 카테고리 정의 (분기 처리를 위함)
export enum EventCategory {
    System = 'System',
    Physics = 'Physics',
    Biological = 'Biological',
    Interaction = 'Interaction',
    Command = 'Command'
}

// 추상화된 이벤트 정의
export class SimEvent<T = any> implements BaseEvent {
    id: string;
    type: string;
    category: EventCategory;
    timestamp: number;
    payload: T;
    sourceId?: string;
    priority: number;

    constructor(type: string, category: EventCategory, payload: T, sourceId?: string, priority: number = 1) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.category = category;
        this.payload = payload;
        this.timestamp = Date.now();
        this.sourceId = sourceId;
        this.priority = priority;
    }
}

// 구체적인 이벤트 타입들
export class TickEvent extends SimEvent<{ tickCount: number; deltaTime: number }> {
    constructor(tickCount: number, deltaTime: number) {
        super('Tick', EventCategory.System, { tickCount, deltaTime }, undefined, 2);
    }
}

export class EntitySpawnEvent extends SimEvent<{ entityType: string; position: { x: number, y: number } }> {
    constructor(entityType: string, x: number, y: number, sourceId?: string) {
        super('EntitySpawn', EventCategory.Biological, { entityType, position: { x, y } }, sourceId);
    }
}

export class WeatherChangeEvent extends SimEvent<{ layer: number; delta: number; x: number; y: number }> {
    constructor(layer: number, delta: number, x: number, y: number) {
        super('WeatherChange', EventCategory.Physics, { layer, delta, x, y });
    }
}
