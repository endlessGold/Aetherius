// 고해상도 환경 시뮬레이션을 위한 데이터 구조체
// 메모리 효율성을 위해 TypedArray(Float32Array)를 사용합니다.
// Chunk 시스템을 도입하여 10억 개(1 Billion) 이상의 파라미터를 처리할 수 있는 구조를 구현합니다.

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
  PHLevel = 15,       // pH 레벨

  // 확장된 과학적 파라미터 (Total 21 Layers)
  SoilSalinity = 16,  // 토양 염분
  OrganicMatter = 17, // 유기물 함량
  GroundWaterLevel = 18, // 지하수위
  UVRadiation = 19,   // 자외선 지수
  WindZ = 20          // 수직 상승 기류 (3D 바람)
}

export { EnvLayer as Layer };

const CHUNK_SIZE = 256; // 256x256 셀 per Chunk (약 6.5만 셀)
// 21개 레이어 * 65536셀 * 4byte = 약 5.5MB per Chunk

export class Grid {
  private chunks: Map<string, Float32Array> = new Map();
  private readonly layers: number = 21; // EnvLayer 키 개수

  // 전체 월드 크기 (가상)
  // 10억 파라미터 목표: 21 layers * 7000 * 7000 cells ≈ 1.029 Billion parameters
  width: number = 7000;
  height: number = 7000;

  constructor(width: number = 7000, height: number = 7000) {
    this.width = width;
    this.height = height;
    console.log(`[EnvironmentGrid] Initialized virtual grid: ${width}x${height}`);
    console.log(`[EnvironmentGrid] Total potential parameters: ${(width * height * this.layers).toLocaleString()} (Target: >1 Billion)`);
  }

  // Chunk Key 생성
  private getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  // Chunk 가져오기 (없으면 생성 - Lazy Loading)
  // readOnly=true이면 생성하지 않고 undefined 반환
  private getChunk(cx: number, cy: number, readOnly: boolean = false): Float32Array | undefined {
    const key = this.getChunkKey(cx, cy);
    if (!this.chunks.has(key)) {
      if (readOnly) return undefined;

      // SharedArrayBuffer를 사용하면 Worker 스레드와 공유 가능 (확장성 고려)
      // 여기서는 표준 Float32Array 사용
      const buffer = new Float32Array(CHUNK_SIZE * CHUNK_SIZE * this.layers);
      this.chunks.set(key, buffer);
    }
    return this.chunks.get(key)!;
  }

  // 인덱스 계산 헬퍼
  // Global (x, y) -> Chunk (cx, cy) + Local (lx, ly)
  private getLocation(x: number, y: number) {
    // Torus Topology (세계는 둥글다)
    const gx = Math.floor((x + this.width) % this.width);
    const gy = Math.floor((y + this.height) % this.height);

    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);

    const lx = gx % CHUNK_SIZE;
    const ly = gy % CHUNK_SIZE;

    // Chunk 내 인덱스: (ly * CHUNK_SIZE + lx) * layers + layerIndex
    const localIndexBase = (ly * CHUNK_SIZE + lx) * this.layers;

    return { cx, cy, localIndexBase };
  }

  // 값 읽기
  get(x: number, y: number, layer: EnvLayer): number {
    const { cx, cy, localIndexBase } = this.getLocation(x, y);
    const chunk = this.getChunk(cx, cy, true); // Read-only
    if (!chunk) return 0; // 빈 공간은 0 (기본값)
    return chunk[localIndexBase + layer];
  }

  // 값 쓰기
  set(x: number, y: number, layer: EnvLayer, value: number): void {
    const { cx, cy, localIndexBase } = this.getLocation(x, y);
    const chunk = this.getChunk(cx, cy, false); // Create if needed
    if (chunk) chunk[localIndexBase + layer] = value;
  }

  // 값 더하기 (Delta 적용)
  add(x: number, y: number, layer: EnvLayer, delta: number): void {
    const { cx, cy, localIndexBase } = this.getLocation(x, y);
    const chunk = this.getChunk(cx, cy, false); // Create if needed
    if (chunk) chunk[localIndexBase + layer] += delta;
  }

  // 활성 청크 순회 (최적화된 시뮬레이션 루프용)
  // callback(chunkData, chunkX, chunkY, width, height)
  forEachActiveChunk(callback: (chunk: Float32Array, cx: number, cy: number, w: number, h: number) => void) {
    for (const [key, chunk] of this.chunks) {
      const [cx, cy] = key.split(',').map(Number);
      callback(chunk, cx, cy, CHUNK_SIZE, CHUNK_SIZE);
    }
  }

  // 특정 영역의 평균값 계산 (최적화 필요: 경계면 Chunk 처리 복잡함)
  // 현재는 단순 구현으로 get()을 반복 호출
  getRegionAverage(centerX: number, centerY: number, radius: number, layer: EnvLayer): number {
    let sum = 0;
    let count = 0;
    // 간단한 사각형 범위 순회로 근사 (원형 검사는 비용이 큼)
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          sum += this.get(centerX + dx, centerY + dy, layer);
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 0;
  }

  // 전체 통계 (현재 로드된 청크만 계산)
  getStatistics(layer: EnvLayer) {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;

    for (const chunk of this.chunks.values()) {
      const size = CHUNK_SIZE * CHUNK_SIZE;
      for (let i = 0; i < size; i++) {
        const val = chunk[i * this.layers + layer];
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
        count++;
      }
    }

    return count > 0 ? { min, max, avg: sum / count, activeChunks: this.chunks.size }
      : { min: 0, max: 0, avg: 0, activeChunks: 0 };
  }

  // 현재 활성화된 총 파라미터 수 확인
  getTotalActiveParameters(): number {
    return this.chunks.size * CHUNK_SIZE * CHUNK_SIZE * this.layers;
  }
}

export namespace Environment {
  export const Layer = EnvLayer;
  export type Layer = EnvLayer;
  export type Grid = Grid;
}
