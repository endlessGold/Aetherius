import { ComponentBase } from '../core/interfaces.js';

export interface ActionParamsState {
  speed: number;
  perceptionRange: number;
  aggression: number;
}

export class ActionParamsComponent extends ComponentBase<ActionParamsState> {
  name = 'ActionParams';

  constructor(initial?: Partial<ActionParamsState>) {
    super({
      speed: 1,
      perceptionRange: 5,
      aggression: 0.2,
      ...initial
    });
  }
}
