// 이벤트 카테고리 정의 (분기 처리를 위함)
export var EventCategory;
(function (EventCategory) {
    EventCategory["System"] = "System";
    EventCategory["Physics"] = "Physics";
    EventCategory["Biological"] = "Biological";
    EventCategory["Interaction"] = "Interaction";
    EventCategory["Command"] = "Command";
})(EventCategory || (EventCategory = {}));
// 추상화된 최상위 이벤트 정의
export class SimEvent {
    constructor(type, category, payload, sourceId, priority = 1) {
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
export class EnvEvent extends SimEvent {
    constructor(type, payload, sourceId, priority = 1) {
        super(type, EventCategory.Physics, payload, sourceId, priority);
    }
}
// 생물 관련 이벤트 (Biological)
export class BioEvent extends SimEvent {
    constructor(type, payload, sourceId, priority = 1) {
        super(type, EventCategory.Biological, payload, sourceId, priority);
    }
}
// 시스템 관련 이벤트 (System)
export class SysEvent extends SimEvent {
    constructor(type, payload, sourceId, priority = 2) {
        super(type, EventCategory.System, payload, sourceId, priority);
    }
}
// 명령 관련 이벤트 (Command)
export class CmdEvent extends SimEvent {
    constructor(type, payload, sourceId, priority = 1) {
        super(type, EventCategory.Command, payload, sourceId, priority);
    }
}
// --- 구체적인 이벤트 타입들 ---
export class TickEvent extends SysEvent {
    constructor(tickCount, deltaTime) {
        super('Tick', { tickCount, deltaTime });
    }
}
export class EntitySpawnEvent extends BioEvent {
    constructor(entityType, x, y, sourceId) {
        super('EntitySpawn', { entityType, position: { x, y } }, sourceId);
    }
}
export class WeatherChangeEvent extends EnvEvent {
    constructor(layer, delta, x, y) {
        super('WeatherChange', { layer, delta, x, y });
    }
}
