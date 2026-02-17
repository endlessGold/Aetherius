export interface BaseEvent {
    id: string;
    type: string;
    timestamp: number;
    sourceId?: string;
    priority: number;
}

// 이벤트 카테고리 정의
export enum EventCategory {
    System = 'System',
    Physics = 'Physics',
    Biological = 'Biological',
    Interaction = 'Interaction',
    Command = 'Command'
}

// 추상화된 최상위 이벤트 정의 (Simulation Namespace)
export namespace Simulation {
    let seq = 0;
    export class Event<T = any> implements BaseEvent {
        id: string;
        type: string;
        category: EventCategory;
        timestamp: number;
        payload: T;
        sourceId?: string;
        priority: number;

        constructor(category: EventCategory, payload: T, sourceId?: string, priority: number = 1) {
            seq += 1;
            this.id = `${category}_${seq}`;
            this.type = (this.constructor as { name: string }).name;
            this.category = category;
            this.payload = payload;
            this.timestamp = seq;
            this.sourceId = sourceId;
            this.priority = priority;
        }
    }
}

export type EventCtor<T extends Simulation.Event = Simulation.Event> = new (...args: any[]) => T;

// --- 네임스페이스 기반 이벤트 구조 ---

// 환경/물리 (Environment/Physics)
export namespace Environment {
    export class Event<T = any> extends Simulation.Event<T> {
        constructor(payload: T, sourceId?: string, priority: number = 1) {
            super(EventCategory.Physics, payload, sourceId, priority);
        }
    }

    export class WeatherChange extends Event<{ layer: number; delta: number; x: number; y: number }> {
        constructor(layer: number, delta: number, x: number, y: number) {
            super({ layer, delta, x, y });
        }
    }

    export class GlobalParameterChange extends Event<{ layer: number; delta: number }> {
        constructor(layer: number, delta: number, sourceId?: string) {
            super({ layer, delta }, sourceId, 2);
        }
    }
}

// 생물 (Biological)
export namespace Biological {
    export class Event<T = any> extends Simulation.Event<T> {
        constructor(payload: T, sourceId?: string, priority: number = 1) {
            super(EventCategory.Biological, payload, sourceId, priority);
        }
    }

    export class EntitySpawn extends Event<{ entityType: string; position: { x: number, y: number } }> {
        constructor(entityType: string, x: number, y: number, sourceId?: string) {
            super({ entityType, position: { x, y } }, sourceId);
        }
    }

    export class EntityMoved extends Event<{
        entityId: string;
        from: { x: number; y: number; placeId?: string };
        to: { x: number; y: number; placeId?: string };
        reason: string;
    }> {
        constructor(
            entityId: string,
            from: { x: number; y: number; placeId?: string },
            to: { x: number; y: number; placeId?: string },
            reason: string,
            sourceId?: string
        ) {
            super({ entityId, from, to, reason }, sourceId, 1);
        }
    }

    export class InfectionExposed extends Event<{ entityId: string; strainId: string; load: number }> {
        constructor(entityId: string, strainId: string, load: number, sourceId?: string) {
            super({ entityId, strainId, load }, sourceId, 1);
        }
    }

    export class InfectionContracted extends Event<{ entityId: string; strainId: string }> {
        constructor(entityId: string, strainId: string, sourceId?: string) {
            super({ entityId, strainId }, sourceId, 1);
        }
    }

    export class Recovered extends Event<{ entityId: string; strainId: string }> {
        constructor(entityId: string, strainId: string, sourceId?: string) {
            super({ entityId, strainId }, sourceId, 1);
        }
    }

    export class DiedOfDisease extends Event<{ entityId: string; strainId: string }> {
        constructor(entityId: string, strainId: string, sourceId?: string) {
            super({ entityId, strainId }, sourceId, 2);
        }
    }

    export class NewStrainDiscovered extends Event<{ strainId: string; parentStrainId?: string; summary: Record<string, any> }> {
        constructor(strainId: string, summary: Record<string, any>, parentStrainId?: string, sourceId?: string) {
            super({ strainId, parentStrainId, summary }, sourceId, 2);
        }
    }

    export class Death extends Event<{ entityId: string; cause: string; position: { x: number; y: number }; biomass: number; pathogenLoad?: number }> {
        constructor(entityId: string, cause: string, position: { x: number; y: number }, biomass: number, pathogenLoad?: number, sourceId?: string) {
            super({ entityId, cause, position, biomass, pathogenLoad }, sourceId, 2);
        }
    }

    export class CorpseCreated extends Event<{ corpseId: string; fromEntityId: string; position: { x: number; y: number } }> {
        constructor(corpseId: string, fromEntityId: string, position: { x: number; y: number }, sourceId?: string) {
            super({ corpseId, fromEntityId, position }, sourceId, 1);
        }
    }

    export class DecompositionApplied extends Event<{ corpseId: string; position: { x: number; y: number }; nutrients: Record<string, number> }> {
        constructor(corpseId: string, position: { x: number; y: number }, nutrients: Record<string, number>, sourceId?: string) {
            super({ corpseId, position, nutrients }, sourceId, 1);
        }
    }

    export class HybridOffspringBorn extends Event<{ offspringId: string; parentA: string; parentB: string; worldId: string }> {
        constructor(offspringId: string, parentA: string, parentB: string, worldId: string, sourceId?: string) {
            super({ offspringId, parentA, parentB, worldId }, sourceId, 2);
        }
    }
}

// 상호작용 (Interaction)
export namespace Interaction {
    export class Event<T = any> extends Simulation.Event<T> {
        constructor(payload: T, sourceId?: string, priority: number = 1) {
            super(EventCategory.Interaction, payload, sourceId, priority);
        }
    }

    export class Eat extends Event<{ targetId: string; amount: number }> {
        constructor(targetId: string, amount: number, sourceId?: string) {
            super({ targetId, amount }, sourceId);
        }
    }

    export class Attack extends Event<{ targetId: string; damage: number }> {
        constructor(targetId: string, damage: number, sourceId?: string) {
            super({ targetId, damage }, sourceId);
        }
    }

    export class Mate extends Event<{ targetId: string }> {
        constructor(targetId: string, sourceId?: string) {
            super({ targetId }, sourceId);
        }
    }

    export class Communicate extends Event<{ targetId?: string; message: string }> {
        constructor(message: string, targetId?: string, sourceId?: string) {
            super({ targetId, message }, sourceId);
        }
    }

    export class InterspeciesMatingAttempted extends Event<{ parentA: string; parentB: string; probability: number; success: boolean }> {
        constructor(parentA: string, parentB: string, probability: number, success: boolean, sourceId?: string) {
            super({ parentA, parentB, probability, success }, sourceId, 1);
        }
    }
}

// 시스템 (System)
export namespace System {
    export class Event<T = any> extends Simulation.Event<T> {
        constructor(payload: T, sourceId?: string, priority: number = 2) {
            super(EventCategory.System, payload, sourceId, priority);
        }
    }

    export class Tick extends Event<{ tickCount: number; deltaTime: number; environment?: Record<string, any> }> {
        constructor(tickCount: number, deltaTime: number, environment?: Record<string, any>) {
            super({ tickCount, deltaTime, environment });
        }
    }

    export class ParameterChange extends Event<{ targetId: string; component: string; changes: Record<string, number> }> {
        constructor(targetId: string, component: string, changes: Record<string, number>, sourceId?: string) {
            super({ targetId, component, changes }, sourceId, 1);
        }
    }

    export class AIAgentSense extends Event<{
        targetId: string;
        bioState: { hunger: number; energy: number; stress: number; health: number };
        actionParams: Record<string, any>;
        environment?: Record<string, any>;
    }> {
        constructor(payload: {
            targetId: string;
            bioState: { hunger: number; energy: number; stress: number; health: number };
            actionParams: Record<string, any>;
            environment?: Record<string, any>;
        }) {
            super(payload);
        }
    }

    export class ChangeWeather extends Event<Record<string, any>> {
        constructor(payload: Record<string, any>) {
            super(payload, undefined, 1);
        }
    }

    export class AsyncRequest extends Event<{
        requestId: string;
        action: string;
        params: any;
        resolve: (value: any) => void;
        reject: (reason: any) => void;
    }> {
        constructor(payload: {
            requestId: string;
            action: string;
            params: any;
            resolve: (value: any) => void;
            reject: (reason: any) => void;
        }) {
            super(payload, undefined, 1);
        }
    }

    export class WormholeOpened extends Event<{ wormholeId: string; a: string; b: string; expiresAtTick: number; stability: number }> {
        constructor(wormholeId: string, a: string, b: string, expiresAtTick: number, stability: number, sourceId?: string) {
            super({ wormholeId, a, b, expiresAtTick, stability }, sourceId, 2);
        }
    }

    export class WormholeClosed extends Event<{ wormholeId: string; a: string; b: string }> {
        constructor(wormholeId: string, a: string, b: string, sourceId?: string) {
            super({ wormholeId, a, b }, sourceId, 2);
        }
    }

    export class WormholeTravel extends Event<{ wormholeId: string; fromWorldId: string; toWorldId: string; entityId: string }> {
        constructor(wormholeId: string, fromWorldId: string, toWorldId: string, entityId: string, sourceId?: string) {
            super({ wormholeId, fromWorldId, toWorldId, entityId }, sourceId, 1);
        }
    }

    export class SeasonChanged extends Event<{ seasonIndex: number; seasonName: string; seasonLengthTicks: number }> {
        constructor(seasonIndex: number, seasonName: string, seasonLengthTicks: number, sourceId?: string) {
            super({ seasonIndex, seasonName, seasonLengthTicks }, sourceId, 2);
        }
    }
}

// 명령 (Command)
export namespace Command {
    export class Event<T = any> extends Simulation.Event<T> {
        constructor(payload: T, sourceId?: string, priority: number = 1) {
            super(EventCategory.Command, payload, sourceId, priority);
        }
    }

    export class EntityCreateRequested extends Event<{ id: string; assemblyType: string }> {
        constructor(id: string, assemblyType: string, sourceId?: string) {
            super({ id, assemblyType }, sourceId, 2);
        }
    }

    export class AssemblyCreateRequested extends Event<{ id: string; assemblyType: string }> {
        constructor(id: string, assemblyType: string, sourceId?: string) {
            super({ id, assemblyType }, sourceId, 2);
        }
    }
}
