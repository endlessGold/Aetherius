/**
 * 경제 유전 학습 실험: N 세대 진화 후 평균·최대 적합도 로그.
 * 목표: 모든 생명이 더 많은 V, E, P를 확보하도록 유전체 진화.
 */

import { EconomyEvolution } from '../dist/economy/evolution.js';

const GENERATIONS = 20;

function main() {
  console.log('🧬 Economy Evolution — V·E·P 극대화 유전 학습\n');
  const evo = new EconomyEvolution({
    populationSize: 24,
    stepsPerGeneration: 30,
    eliteCount: 4,
    seed: 42,
  });

  for (let g = 0; g < GENERATIONS; g++) {
    evo.tick();
    const { meanFitness, maxFitness } = evo.getLastStats();
    console.log(`  Gen ${String(evo.getGeneration()).padStart(2)}  meanFitness=${meanFitness.toFixed(2)}  maxFitness=${maxFitness.toFixed(2)}`);
  }

  console.log('\n✅ 유전 학습 실험 완료.');
}

main();
