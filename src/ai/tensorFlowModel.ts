import * as tf from '@tensorflow/tfjs';
import { EnvLayer, EnvironmentGrid } from '../core/environment/environmentGrid.js';
import { NodeInterface } from '../core/interfaces.js';

export interface PredictionResult {
  kind: 'GoalGA.GrowthDelta';
  value: number;
}

export class TensorFlowModel {
  private weights: tf.Tensor2D;
  private bias: tf.Tensor1D;

  constructor() {
    this.weights = tf.tensor2d([[0.01], [0.01], [0.02], [0.001], [0.005]]);
    this.bias = tf.tensor1d([0.0]);
  }

  predictForNode(node: NodeInterface, grid: EnvironmentGrid): PredictionResult | null {
    const ga = node.components.get('GoalGA') as any;
    if (!ga?.state) return null;

    const s = ga.state as {
      physiology: { energy: number; hydration: number };
      growth: { biomass: number };
      position: { x: number; y: number };
    };

    const temperature = grid.get(s.position.x, s.position.y, EnvLayer.Temperature);
    const soilMoisture = grid.get(s.position.x, s.position.y, EnvLayer.SoilMoisture);

    const features = [
      s.physiology.energy / 100,
      s.physiology.hydration / 100,
      s.growth.biomass / 100,
      temperature / 50,
      soilMoisture
    ];

    const value = tf.tidy(() => {
      const x = tf.tensor2d([features], [1, features.length]);
      const y = x.matMul(this.weights).add(this.bias);
      return y.dataSync()[0];
    });

    return { kind: 'GoalGA.GrowthDelta', value };
  }
}

