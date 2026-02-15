import { Component } from '../core/interfaces.js';

export type GoalKind = 'Survive' | 'Grow' | 'Explore';

export interface GoalGenome {
  weights: {
    survive: number;
    grow: number;
    explore: number;
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
}

export class GoalGAComponent implements Component {
  name = 'GoalGA';
  state: GoalGAState;

  constructor(initial: Partial<GoalGAState> = {}) {
    this.state = {
      genome: initial.genome ?? {
        weights: { survive: 0.34, grow: 0.33, explore: 0.33 },
        mutationRate: 0.05
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
    };
  }
}

