import { ComponentBase } from '../core/interfaces.js';

export type GoalKind = 'Survive' | 'Grow' | 'Explore';
export type GoalAgentRole = 'Progenitor' | 'Offspring';

export interface GoalLineage {
  role: GoalAgentRole;
  parentId?: string;
  offspringCount: number;
  generation: number;
}

export interface GoalGenome {
  weights: {
    survive: number;
    grow: number;
    explore: number;
  };
  stats: {
    size: number; // 0.1 to 2.0 (Impacts HP, Energy Cost)
    speed: number; // 0.1 to 2.0 (Impacts Exploration, Energy Cost)
    coldResist: number; // 0.0 to 1.0 (Impacts Survival in Cold)
  };
  mutationRate: number;
}

export interface GoalGAState {
  genome: GoalGenome;
  purpose: {
    kind: GoalKind;
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
  lineage: GoalLineage;
}

export class GoalGAComponent extends ComponentBase<GoalGAState> {
  name = 'GoalGA';

  constructor(initial: Partial<GoalGAState> = {}) {
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
