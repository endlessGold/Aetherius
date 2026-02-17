import { ComponentBase } from '../core/interfaces.js';

export interface BioState {
  hunger: number;
  energy: number;
  stress: number;
  health: number;
}

export class BioStateComponent extends ComponentBase<BioState> {
  name = 'BioState';

  constructor(initial?: Partial<BioState>) {
    super({
      hunger: 0,
      energy: 100,
      stress: 0,
      health: 100,
      ...initial
    });
  }
}
