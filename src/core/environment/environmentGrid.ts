// 고해상도 환경 시뮬레이션을 위한 데이터 구조체
// 메모리 효율성을 위해 TypedArray(Float32Array)를 사용합니다.
// 1024x1024 그리드 x 16개 레이어 = 약 1600만 파라미터 기본 생성
// 이를 청크 단위로 확장하면 수십억 개 이상의 파라미터 시뮬레이션 가능

export enum EnvLayer {
  Temperature = 0,    // 온도 (Celsius)
  Humidity = 1,       // 습도 (0.0 ~ 1.0)
  SoilMoisture = 2,   // 토양 수분 (0.0 ~ 1.0)
  SoilNitrogen = 3,   // 질소 함량 (N)
  SoilPhosphorus = 4, // 인 함량 (P)
  SoilPotassium = 5,  // 칼륨 함량 (K)
  LightIntensity = 6, // 광량 (Lux / 1000)
  WindX = 7,          // 바람 벡터 X
  WindY = 8,          // 바람 벡터 Y
  CO2Concentration = 9, // 이산화탄소 농도 (ppm)
  Elevation = 10,     // 고도 (m)
  Pollution = 11,     // 오염도
  MicrobialActivity = 12, // 미생물 활동성
  RootDensity = 13,   // 뿌리 밀도
  Compaction = 14,    // 토양 다짐도
  PHLevel = 15        // pH 레벨
}

export class EnvironmentGrid {
  width: number;
  height: number;
  layers: number;
  data: Float32Array;

  constructor(width: number, height: number, layers: number = 16) {
    this.width = width;
    this.height = height;
    this.layers = layers;
    // 전체 데이터 크기: 너비 * 높이 * 레이어 수
    // 1024 * 1024 * 16 * 4 bytes ≈ 64MB 메모리 사용
    this.data = new Float32Array(width * height * layers);
  }

  // 인덱스 계산 헬퍼
  private getIndex(x: number, y: number, layer: EnvLayer): number {
    // 경계 처리 (Torus topology - 세상은 둥글다)
    const wx = (x + this.width) % this.width;
    const wy = (y + this.height) % this.height;
    return (wy * this.width + wx) * this.layers + layer;
  }

  // 값 읽기
  get(x: number, y: number, layer: EnvLayer): number {
    return this.data[this.getIndex(x, y, layer)];
  }

  // 값 쓰기
  set(x: number, y: number, layer: EnvLayer, value: number): void {
    this.data[this.getIndex(x, y, layer)] = value;
  }

  // 값 더하기 (Delta 적용)
  add(x: number, y: number, layer: EnvLayer, delta: number): void {
    this.data[this.getIndex(x, y, layer)] += delta;
  }

  // 특정 영역의 평균값 계산 (식물 뿌리가 닿는 영역 등)
  getRegionAverage(centerX: number, centerY: number, radius: number, layer: EnvLayer): number {
    let sum = 0;
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx*dx + dy*dy <= radius*radius) {
          sum += this.get(centerX + dx, centerY + dy, layer);
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 0;
  }

  // 전체 통계 (디버깅용)
  getStatistics(layer: EnvLayer) {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    const size = this.width * this.height;
    
    for (let i = 0; i < size; i++) {
      const val = this.data[i * this.layers + layer];
      if (val < min) min = val;
      if (val > max) max = val;
      sum += val;
    }
    
    return { min, max, avg: sum / size };
  }
}
