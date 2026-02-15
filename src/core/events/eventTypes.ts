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

// 추상화된 최상위 이벤트 정의
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

// --- 중간 계층 이벤트 (카테고리별 분류) ---

// 환경/물리 관련 이벤트 (Physics)
export class EnvEvent<T = any> extends SimEvent<T> {
    constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
        super(type, EventCategory.Physics, payload, sourceId, priority);
    }
}

// 생물 관련 이벤트 (Biological)
export class BioEvent<T = any> extends SimEvent<T> {
    constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
        super(type, EventCategory.Biological, payload, sourceId, priority);
    }
}

// 시스템 관련 이벤트 (System)
export class SysEvent<T = any> extends SimEvent<T> {
    constructor(type: string, payload: T, sourceId?: string, priority: number = 2) {
        super(type, EventCategory.System, payload, sourceId, priority);
    }
}

// 명령 관련 이벤트 (Command)
export class CmdEvent<T = any> extends SimEvent<T> {
    constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
        super(type, EventCategory.Command, payload, sourceId, priority);
    }
}

// --- 구체적인 이벤트 타입들 ---

export class TickEvent extends SysEvent<{ tickCount: number; deltaTime: number }> {
    constructor(tickCount: number, deltaTime: number) {
        super('Tick', { tickCount, deltaTime });
    }
}

export class EntitySpawnEvent extends BioEvent<{ entityType: string; position: { x: number, y: number } }> {
    constructor(entityType: string, x: number, y: number, sourceId?: string) {
        super('EntitySpawn', { entityType, position: { x, y } }, sourceId);
    }
}

export class WeatherChangeEvent extends EnvEvent<{ layer: number; delta: number; x: number; y: number }> {
    constructor(layer: number, delta: number, x: number, y: number) {
        super('WeatherChange', { layer, delta, x, y });
    }
}
