import { ComponentBase } from '../core/interfaces.js';

export type DirectionKind = 'Survive' | 'Grow' | 'Explore';
export type DirectionAgentRole = 'Progenitor' | 'Offspring';

export interface DirectionLineage {
  role: DirectionAgentRole;
  parentId?: string;
  offspringCount: number;
  generation: number;
}

export interface DirectionGenome {
  weights: {
    survive: number;
    grow: number;
    explore: number;
  };
  stats: {
    size: number;
    speed: number;
    coldResist: number;
  };
  mutationRate: number;
}

export interface DirectionGAState {
  genome: DirectionGenome;
  purpose: {
    kind: DirectionKind;
    target: number;
  };
  physiology: {
    energy: number;
    hydration: number;
  };
  growth: {
    biomass: number;
  };
  position: {
    x: number;
    y: number;
  };
  metrics: {
    ageTicks: number;
    fitness: number;
    purposeAchievement: number;
    lastAction: string;
  };
  lineage: DirectionLineage;
}

export class DirectionGAComponent extends ComponentBase<DirectionGAState> {
  name = 'DirectionGA';

  constructor(initial: Partial<DirectionGAState> = {}) {
    super({
      genome: initial.genome ?? {
        weights: { survive: 0.34, grow: 0.33, explore: 0.33 },
        stats: { size: 1.0, speed: 1.0, coldResist: 0.1 },
        mutationRate: 0.05
      },
      lineage: initial.lineage ?? {
        role: 'Progenitor',
        offspringCount: 0,
        generation: 0
      },
      purpose: initial.purpose ?? { kind: 'Survive', target: 1 },
      physiology: initial.physiology ?? { energy: 50, hydration: 50 },
      growth: initial.growth ?? { biomass: 0 },
      position: initial.position ?? { x: 0, y: 0 },
      metrics: initial.metrics ?? {
        ageTicks: 0,
        fitness: 0,
        purposeAchievement: 0,
        lastAction: 'Init'
      }
    });
  }
}
