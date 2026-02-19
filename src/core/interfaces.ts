import { Simulation, Interaction } from './events/eventTypes.js';

export type Event = Simulation.Event<any>;

export type InteractionType =
  | typeof Interaction.Eat
  | typeof Interaction.Attack
  | typeof Interaction.Mate
  | typeof Interaction.Communicate;

export interface Interactable {
  id: string;
  interact: (type: InteractionType, sourceId?: string) => void;
}

export interface Component {
  name: string;
  state: Record<string, any>;
  handleEvent?: (event: Event) => void;
}

export abstract class ComponentBase<TState extends Record<string, any>> implements Component {
  abstract name: string;
  state: TState;

  constructor(state: TState) {
    this.state = state;
  }
}

export interface NodeInterface {
  id: string;
  type: string;
  parent?: NodeInterface;
  children: NodeInterface[];
  components: Map<string, Component>;
  handleEvent: (event: Event) => void;
  addComponent(component: Component): void;
}
