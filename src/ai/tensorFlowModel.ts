import * as tf from '@tensorflow/tfjs';
import { NodeInterface } from '../core/interfaces.js';
import fs from 'node:fs';

export interface LinearModelJson {
  modelType: 'linear';
  featureOrder: string[];
  mean: number[];
  std: number[];
  weights: number[];
  bias: number;
}

export interface PredictionResult {
  kind: 'GoalGA.GrowthDelta';
  value: number;
}

export class TensorFlowModel {
  private static readonly FEATURE_COUNT = 7;
  private weights: tf.Tensor2D;
  private bias: tf.Tensor1D;
  private mean: tf.Tensor1D | null = null;
  private std: tf.Tensor1D | null = null;

  constructor() {
    this.weights = tf.tensor2d([[0.01], [0.01], [0.02], [0.01], [0.01], [0.01], [0.01]]);
    this.bias = tf.tensor1d([0.0]);

    const p = process.env.AETHERIUS_TF_LINEAR_WEIGHTS_PATH || 'models/linear-latest.json';
    if (p && fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const json = JSON.parse(raw) as LinearModelJson;
      this.setFromJson(json);
    }
  }

  setFromJson(json: LinearModelJson): void {
    if (!json || json.modelType !== 'linear') return;
    if (!Array.isArray(json.weights) || json.weights.length !== TensorFlowModel.FEATURE_COUNT) return;
    if (!Array.isArray(json.mean) || json.mean.length !== TensorFlowModel.FEATURE_COUNT) return;
    if (!Array.isArray(json.std) || json.std.length !== TensorFlowModel.FEATURE_COUNT) return;

    this.weights.dispose();
    this.bias.dispose();
    this.mean?.dispose();
    this.std?.dispose();

    this.weights = tf.tensor2d(json.weights.map((v) => [v]), [TensorFlowModel.FEATURE_COUNT, 1]);
    this.bias = tf.tensor1d([json.bias]);
    this.mean = tf.tensor1d(json.mean);
    this.std = tf.tensor1d(json.std);
  }

  predictForNode(node: NodeInterface): PredictionResult | null {
    const features = this.extractFeatures(node);
    if (!features) return null;

    const value = this.predictFromFeatures(features);

    return { kind: 'GoalGA.GrowthDelta', value };
  }

  private predictFromFeatures(features: number[]): number {
    return tf.tidy(() => {
      let x = tf.tensor2d([features], [1, features.length]);
      if (this.mean && this.std) {
        x = x.sub(this.mean).div(this.std);
      }
      const y = x.matMul(this.weights).add(this.bias);
      return y.dataSync()[0];
    });
  }

  private extractFeatures(node: NodeInterface): number[] | null {
    const ga = node.components.get('GoalGA') as any;
    if (!ga?.state) return null;

    const s = ga.state as {
      genome?: { weights?: { survive: number; grow: number; explore: number } };
      purpose?: { kind?: string };
      physiology: { energy: number; hydration: number };
      growth: { biomass: number };
    };

    const w = s.genome?.weights;
    if (!w) return null;

    return [
      s.physiology.energy / 100,
      s.physiology.hydration / 100,
      s.growth.biomass / 100,
      w.survive,
      w.grow,
      w.explore,
      purposeToScalar(s.purpose?.kind)
    ];
  }
}

function purposeToScalar(kind?: string): number {
  if (kind === 'Survive') return 0.0;
  if (kind === 'Grow') return 0.5;
  if (kind === 'Explore') return 1.0;
  return 0.0;
}
