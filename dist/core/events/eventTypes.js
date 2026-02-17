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
    let seq = 0;
    class Event {
        constructor(category, payload, sourceId, priority = 1) {
            seq += 1;
            this.id = `${category}_${seq}`;
            this.type = this.constructor.name;
            this.category = category;
            this.payload = payload;
            this.timestamp = seq;
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
        constructor(payload, sourceId, priority = 1) {
            super(EventCategory.Physics, payload, sourceId, priority);
        }
    }
    Environment.Event = Event;
    class WeatherChange extends Event {
        constructor(layer, delta, x, y) {
            super({ layer, delta, x, y });
        }
    }
    Environment.WeatherChange = WeatherChange;
    class GlobalParameterChange extends Event {
        constructor(layer, delta, sourceId) {
            super({ layer, delta }, sourceId, 2);
        }
    }
    Environment.GlobalParameterChange = GlobalParameterChange;
})(Environment || (Environment = {}));
// 생물 (Biological)
export var Biological;
(function (Biological) {
    class Event extends Simulation.Event {
        constructor(payload, sourceId, priority = 1) {
            super(EventCategory.Biological, payload, sourceId, priority);
        }
    }
    Biological.Event = Event;
    class EntitySpawn extends Event {
        constructor(entityType, x, y, sourceId) {
            super({ entityType, position: { x, y } }, sourceId);
        }
    }
    Biological.EntitySpawn = EntitySpawn;
    class EntityMoved extends Event {
        constructor(entityId, from, to, reason, sourceId) {
            super({ entityId, from, to, reason }, sourceId, 1);
        }
    }
    Biological.EntityMoved = EntityMoved;
    class InfectionExposed extends Event {
        constructor(entityId, strainId, load, sourceId) {
            super({ entityId, strainId, load }, sourceId, 1);
        }
    }
    Biological.InfectionExposed = InfectionExposed;
    class InfectionContracted extends Event {
        constructor(entityId, strainId, sourceId) {
            super({ entityId, strainId }, sourceId, 1);
        }
    }
    Biological.InfectionContracted = InfectionContracted;
    class Recovered extends Event {
        constructor(entityId, strainId, sourceId) {
            super({ entityId, strainId }, sourceId, 1);
        }
    }
    Biological.Recovered = Recovered;
    class DiedOfDisease extends Event {
        constructor(entityId, strainId, sourceId) {
            super({ entityId, strainId }, sourceId, 2);
        }
    }
    Biological.DiedOfDisease = DiedOfDisease;
    class NewStrainDiscovered extends Event {
        constructor(strainId, summary, parentStrainId, sourceId) {
            super({ strainId, parentStrainId, summary }, sourceId, 2);
        }
    }
    Biological.NewStrainDiscovered = NewStrainDiscovered;
    class Death extends Event {
        constructor(entityId, cause, position, biomass, pathogenLoad, sourceId) {
            super({ entityId, cause, position, biomass, pathogenLoad }, sourceId, 2);
        }
    }
    Biological.Death = Death;
    class CorpseCreated extends Event {
        constructor(corpseId, fromEntityId, position, sourceId) {
            super({ corpseId, fromEntityId, position }, sourceId, 1);
        }
    }
    Biological.CorpseCreated = CorpseCreated;
    class DecompositionApplied extends Event {
        constructor(corpseId, position, nutrients, sourceId) {
            super({ corpseId, position, nutrients }, sourceId, 1);
        }
    }
    Biological.DecompositionApplied = DecompositionApplied;
    class HybridOffspringBorn extends Event {
        constructor(offspringId, parentA, parentB, worldId, sourceId) {
            super({ offspringId, parentA, parentB, worldId }, sourceId, 2);
        }
    }
    Biological.HybridOffspringBorn = HybridOffspringBorn;
})(Biological || (Biological = {}));
// 상호작용 (Interaction)
export var Interaction;
(function (Interaction) {
    class Event extends Simulation.Event {
        constructor(payload, sourceId, priority = 1) {
            super(EventCategory.Interaction, payload, sourceId, priority);
        }
    }
    Interaction.Event = Event;
    class Eat extends Event {
        constructor(targetId, amount, sourceId) {
            super({ targetId, amount }, sourceId);
        }
    }
    Interaction.Eat = Eat;
    class Attack extends Event {
        constructor(targetId, damage, sourceId) {
            super({ targetId, damage }, sourceId);
        }
    }
    Interaction.Attack = Attack;
    class Mate extends Event {
        constructor(targetId, sourceId) {
            super({ targetId }, sourceId);
        }
    }
    Interaction.Mate = Mate;
    class Communicate extends Event {
        constructor(message, targetId, sourceId) {
            super({ targetId, message }, sourceId);
        }
    }
    Interaction.Communicate = Communicate;
    class InterspeciesMatingAttempted extends Event {
        constructor(parentA, parentB, probability, success, sourceId) {
            super({ parentA, parentB, probability, success }, sourceId, 1);
        }
    }
    Interaction.InterspeciesMatingAttempted = InterspeciesMatingAttempted;
})(Interaction || (Interaction = {}));
// 시스템 (System)
export var System;
(function (System) {
    class Event extends Simulation.Event {
        constructor(payload, sourceId, priority = 2) {
            super(EventCategory.System, payload, sourceId, priority);
        }
    }
    System.Event = Event;
    class Tick extends Event {
        constructor(tickCount, deltaTime, environment) {
            super({ tickCount, deltaTime, environment });
        }
    }
    System.Tick = Tick;
    class ParameterChange extends Event {
        constructor(targetId, component, changes, sourceId) {
            super({ targetId, component, changes }, sourceId, 1);
        }
    }
    System.ParameterChange = ParameterChange;
    class AIAgentSense extends Event {
        constructor(payload) {
            super(payload);
        }
    }
    System.AIAgentSense = AIAgentSense;
    class ChangeWeather extends Event {
        constructor(payload) {
            super(payload, undefined, 1);
        }
    }
    System.ChangeWeather = ChangeWeather;
    class AsyncRequest extends Event {
        constructor(payload) {
            super(payload, undefined, 1);
        }
    }
    System.AsyncRequest = AsyncRequest;
    class WormholeOpened extends Event {
        constructor(wormholeId, a, b, expiresAtTick, stability, sourceId) {
            super({ wormholeId, a, b, expiresAtTick, stability }, sourceId, 2);
        }
    }
    System.WormholeOpened = WormholeOpened;
    class WormholeClosed extends Event {
        constructor(wormholeId, a, b, sourceId) {
            super({ wormholeId, a, b }, sourceId, 2);
        }
    }
    System.WormholeClosed = WormholeClosed;
    class WormholeTravel extends Event {
        constructor(wormholeId, fromWorldId, toWorldId, entityId, sourceId) {
            super({ wormholeId, fromWorldId, toWorldId, entityId }, sourceId, 1);
        }
    }
    System.WormholeTravel = WormholeTravel;
    class SeasonChanged extends Event {
        constructor(seasonIndex, seasonName, seasonLengthTicks, sourceId) {
            super({ seasonIndex, seasonName, seasonLengthTicks }, sourceId, 2);
        }
    }
    System.SeasonChanged = SeasonChanged;
})(System || (System = {}));
// 명령 (Command)
export var Command;
(function (Command) {
    class Event extends Simulation.Event {
        constructor(payload, sourceId, priority = 1) {
            super(EventCategory.Command, payload, sourceId, priority);
        }
    }
    Command.Event = Event;
    class EntityCreateRequested extends Event {
        constructor(id, assemblyType, sourceId) {
            super({ id, assemblyType }, sourceId, 2);
        }
    }
    Command.EntityCreateRequested = EntityCreateRequested;
    class AssemblyCreateRequested extends Event {
        constructor(id, assemblyType, sourceId) {
            super({ id, assemblyType }, sourceId, 2);
        }
    }
    Command.AssemblyCreateRequested = AssemblyCreateRequested;
})(Command || (Command = {}));
