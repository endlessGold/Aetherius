// 기본 이벤트 인터페이스 (확장)
export interface BaseEvent {
    id: string;
    type: string;
    timestamp: number;
    sourceId?: string; // 이벤트를 발생시킨 주체 (Entity ID 등)
    priority: number; // 0: Low, 1: Normal, 2: High, 3: Critical
}

// 이벤트 카테고리 정의
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

// --- 네임스페이스 기반 이벤트 구조 ---

// 환경/물리 (Environment/Physics)
export namespace Env {
    export class Event<T = any> extends SimEvent<T> {
        constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
            super(type, EventCategory.Physics, payload, sourceId, priority);
        }
    }

    export class WeatherChange extends Event<{ layer: number; delta: number; x: number; y: number }> {
        constructor(layer: number, delta: number, x: number, y: number) {
            super('WeatherChange', { layer, delta, x, y });
        }
    }
}

// 생물 (Biological)
export namespace Bio {
    export class Event<T = any> extends SimEvent<T> {
        constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
            super(type, EventCategory.Biological, payload, sourceId, priority);
        }
    }

    export class EntitySpawn extends Event<{ entityType: string; position: { x: number, y: number } }> {
        constructor(entityType: string, x: number, y: number, sourceId?: string) {
            super('EntitySpawn', { entityType, position: { x, y } }, sourceId);
        }
    }
}

// 시스템 (System)
export namespace Sys {
    export class Event<T = any> extends SimEvent<T> {
        constructor(type: string, payload: T, sourceId?: string, priority: number = 2) {
            super(type, EventCategory.System, payload, sourceId, priority);
        }
    }

    export class Tick extends Event<{ tickCount: number; deltaTime: number }> {
        constructor(tickCount: number, deltaTime: number) {
            super('Tick', { tickCount, deltaTime });
        }
    }
}

// 명령 (Command)
export namespace Cmd {
    export class Event<T = any> extends SimEvent<T> {
        constructor(type: string, payload: T, sourceId?: string, priority: number = 1) {
            super(type, EventCategory.Command, payload, sourceId, priority);
        }
    }
}
