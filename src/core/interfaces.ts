export interface Event {
  type: string;
  payload: any;
  timestamp: number;
}

export interface Component {
  name: string;
  state: Record<string, any>;
  handleEvent?: (event: Event) => void;
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
