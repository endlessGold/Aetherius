// ======================================================
// ECR/ECE Pattern Definitions
// ======================================================

import { World } from '../core/world.js';

// ECS-Style Node/Entity/Behavior + AssembleManager
// - Node: Hierarchy, holds components
// - Entity: Manages Node connections, unaware of components
// - BehaviorNode: Node + System event-based actions
// - AssembleManager: Creates Entities, Nodes, injects components, registers actions

// ---------------------- Context ----------------------

export interface UpdateContext {
  world: World;
  deltaTime: number;
}

// ---------------------- System Event Types ----------------------

export enum SystemEvent {
  Update,
  FixedUpdate,
  LateUpdate,
  ListenUpdate
}

// ---------------------- Node Interface ----------------------

export interface INode<C extends object, TChild extends INode<any, any> = INode<any, any>> {
  id?: string; // Optional ID for debugging/tracking
  components: C;
  children: TChild[];
  addChild(child: TChild): void;
  update(): void;
  listenUpdate(context: UpdateContext): void;
}

// ---------------------- BaseNode ----------------------

export abstract class Node<C extends object, TChild extends INode<any, any> = INode<any, any>> implements INode<C, TChild> {
  components: C;
  children: TChild[] = [];
  protected updateHandler?: (components: C) => void;
  protected listenUpdateHandler?: (components: C, context: UpdateContext) => void;

  constructor(components: C) {
    this.components = components;
  }

  addChild(child: TChild) {
    this.children.push(child);
  }

  update() {
    if (this.updateHandler) {
      this.updateHandler(this.components);
    }
  }

  listenUpdate(context: UpdateContext) {
    if (this.listenUpdateHandler) {
      this.listenUpdateHandler(this.components, context);
    }
  }
}

// ---------------------- BehaviorNode ----------------------

export abstract class BehaviorNode<C extends object> extends Node<C> {
  private updateListeners: ((components: C) => void)[] = [];
  private contextListeners = new Map<SystemEvent, ((components: C, context: UpdateContext) => void)[]>();

  constructor(components: C) {
    super(components);
    this.updateHandler = () => {
      for (const listener of this.updateListeners) {
        listener(this.components);
      }
    };
    this.listenUpdateHandler = (_, context) => {
      const lst = this.contextListeners.get(SystemEvent.ListenUpdate);
      if (lst) {
        for (const listener of lst) {
          listener(this.components, context);
        }
      }
    };
  }

  on(event: SystemEvent.Update, listener: (components: C) => void): void;
  on(event: Exclude<SystemEvent, SystemEvent.Update>, listener: (components: C, context: UpdateContext) => void): void;
  on(event: SystemEvent, listener: ((components: C) => void) | ((components: C, context: UpdateContext) => void)) {
    if (event === SystemEvent.Update) {
      this.updateListeners.push(listener as (components: C) => void);
      return;
    }
    if (!this.contextListeners.has(event)) {
      this.contextListeners.set(event, []);
    }
    this.contextListeners.get(event)!.push(listener as (components: C, context: UpdateContext) => void);
  }

}

// ---------------------- Entity ----------------------

export class Entity<TChild extends INode<any, any>> extends Node<{}, TChild> {
  id: string;

  constructor(id: string) {
    super({});
    this.id = id;
  }
}

// ---------------------- AssembleManager ----------------------

export class AssembleManager implements INode<{}, INode<any, any>> {
  private static instance: AssembleManager | null = null;
  components: {} = {};
  children: INode<any, any>[] = [];
  entities: Entity<any>[] = [];
  private nodeSet: Set<INode<any, any>> = new Set();

  constructor() { }

  static getInstance(): AssembleManager {
    if (!AssembleManager.instance) {
      AssembleManager.instance = new AssembleManager();
    }
    return AssembleManager.instance;
  }

  registerNode(node: INode<any, any>): void {
    if (this.nodeSet.has(node)) return;
    this.nodeSet.add(node);
    this.children.push(node);
  }

  addChild(child: INode<any, any>): void {
    this.registerNode(child);
  }

  update(): void {
    for (const node of this.children) {
      node.update();
    }
  }

  listenUpdate(context: UpdateContext) {
    for (const node of this.children) {
      node.listenUpdate(context);
    }
  }
  // Create Entity + Create Node + Inject Components + Register Actions + Connect
  createEntity<T extends Entity<INode<any, any>>>(
    EntityClass: new (id: string, ...args: any[]) => T,
    id: string,
    entityArgs: any[] = [],
    nodeConfigs: {
      NodeClass: new (components: any, ...args: any[]) => BehaviorNode<any>,
      components: any,
      configure?: (node: BehaviorNode<any>) => void,
      args?: any[]
    }[] = []
  ): T {
    const entity = new EntityClass(id, ...entityArgs);
    this.registerNode(entity);
    for (const cfg of nodeConfigs) {
      const node = new cfg.NodeClass(cfg.components, ...(cfg.args || []));
      if (cfg.configure) cfg.configure(node);
      entity.addChild(node);
      this.registerNode(node);
    }
    this.entities.push(entity);
    return entity;
  }

  // Helper to find entity by ID
  getEntity(id: string): Entity<any> | undefined {
    return this.entities.find(e => e.id === id);
  }

  // Get debug summary of all entities
  getDebugSummary(): string[] {
    return this.entities.map(entity => {
      let info = `[${entity.id}]`;
      if (entity.children.length > 0) {
        const behavior = entity.children[0] as any;
        if (behavior.components) {
          const c = behavior.components;
          if (c.growth?.stage) info += ` Stage:${c.growth.stage} Age:${c.age?.age?.toFixed(1)}`;
          if (c.vitality?.hp) info += ` HP:${c.vitality.hp.toFixed(0)}`;
          if (c.position) info += ` Pos:(${c.position.x?.toFixed(1)},${c.position.y?.toFixed(1)})`;
          if (c.energy?.energy) info += ` Energy:${c.energy.energy?.toFixed(1)}`;
          if (c.weather?.condition) info += ` Weather:${c.weather.condition} Temp:${c.weather.temperature?.toFixed(1)}C`;
        }
      }
      return info;
    });
  }
}
