// 이벤트 카테고리 정의 (분기 처리를 위함)
export var EventCategory;
(function (EventCategory) {
    EventCategory["System"] = "System";
    EventCategory["Physics"] = "Physics";
    EventCategory["Biological"] = "Biological";
    EventCategory["Interaction"] = "Interaction";
    EventCategory["Command"] = "Command";
})(EventCategory || (EventCategory = {}));
// 추상화된 이벤트 정의
export class GameEvent {
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
// 구체적인 이벤트 타입들
export class TickEvent extends GameEvent {
    constructor(tickCount, deltaTime) {
        super('Tick', EventCategory.System, { tickCount, deltaTime }, undefined, 2);
    }
}
export class EntitySpawnEvent extends GameEvent {
    constructor(entityType, x, y, sourceId) {
        super('EntitySpawn', EventCategory.Biological, { entityType, position: { x, y } }, sourceId);
    }
}
export class WeatherChangeEvent extends GameEvent {
    constructor(layer, delta, x, y) {
        super('WeatherChange', EventCategory.Physics, { layer, delta, x, y });
    }
}
