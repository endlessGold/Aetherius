// 이벤트 카테고리 정의
export var EventCategory;
(function (EventCategory) {
    EventCategory["System"] = "System";
    EventCategory["Physics"] = "Physics";
    EventCategory["Biological"] = "Biological";
    EventCategory["Interaction"] = "Interaction";
    EventCategory["Command"] = "Command";
})(EventCategory || (EventCategory = {}));
// 추상화된 최상위 이벤트 정의 (Simulation Namespace)
export var Simulation;
(function (Simulation) {
    class Event {
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
    Simulation.Event = Event;
})(Simulation || (Simulation = {}));
// --- 네임스페이스 기반 이벤트 구조 ---
// 환경/물리 (Environment/Physics)
export var Environment;
(function (Environment) {
    class Event extends Simulation.Event {
        constructor(type, payload, sourceId, priority = 1) {
            super(type, EventCategory.Physics, payload, sourceId, priority);
        }
    }
    Environment.Event = Event;
    class WeatherChange extends Event {
        constructor(layer, delta, x, y) {
            super('WeatherChange', { layer, delta, x, y });
        }
    }
    Environment.WeatherChange = WeatherChange;
})(Environment || (Environment = {}));
// 생물 (Biological)
export var Biological;
(function (Biological) {
    class Event extends Simulation.Event {
        constructor(type, payload, sourceId, priority = 1) {
            super(type, EventCategory.Biological, payload, sourceId, priority);
        }
    }
    Biological.Event = Event;
    class EntitySpawn extends Event {
        constructor(entityType, x, y, sourceId) {
            super('EntitySpawn', { entityType, position: { x, y } }, sourceId);
        }
    }
    Biological.EntitySpawn = EntitySpawn;
})(Biological || (Biological = {}));
// 시스템 (System)
export var System;
(function (System) {
    class Event extends Simulation.Event {
        constructor(type, payload, sourceId, priority = 2) {
            super(type, EventCategory.System, payload, sourceId, priority);
        }
    }
    System.Event = Event;
    class Tick extends Event {
        constructor(tickCount, deltaTime) {
            super('Tick', { tickCount, deltaTime });
        }
    }
    System.Tick = Tick;
})(System || (System = {}));
// 명령 (Command)
export var Command;
(function (Command) {
    class Event extends Simulation.Event {
        constructor(type, payload, sourceId, priority = 1) {
            super(type, EventCategory.Command, payload, sourceId, priority);
        }
    }
    Command.Event = Event;
})(Command || (Command = {}));
