import { EnvironmentGrid, EnvLayer } from './environmentGrid.js';

export class NatureSystem {
  grid: EnvironmentGrid;

  constructor(grid: EnvironmentGrid) {
    this.grid = grid;
  }

  // 매 틱마다 환경을 시뮬레이션
  simulate(tickCount: number) {
    // 1. 확산 (Diffusion) - 열, 가스, 수분의 이동
    this.diffuse(EnvLayer.Temperature, 0.05); 
    this.diffuse(EnvLayer.Humidity, 0.05);
    
    // 2. 바람 생성 및 이동 (Advection)
    this.updateWind(tickCount);
    this.advect(EnvLayer.Humidity, EnvLayer.WindX, EnvLayer.WindY);
    this.advect(EnvLayer.Temperature, EnvLayer.WindX, EnvLayer.WindY);

    // 3. 증발 및 강수 (Evaporation & Precipitation)
    this.cycleWater();

    // 4. 태양 복사열 (Solar Radiation)
    this.applySunlight(tickCount);
  }

  private updateWind(tick: number) {
    const time = tick * 0.01;
    // Simple swirling wind pattern
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        // Create a time-varying vector field
        // This simulates large scale weather patterns
        const nx = x * 0.05;
        const ny = y * 0.05;
        
        // Base flow + swirl
        const vx = Math.sin(ny + time) + Math.cos(nx * 0.5);
        const vy = Math.cos(nx + time) - Math.sin(ny * 0.5);
        
        this.grid.set(x, y, EnvLayer.WindX, vx);
        this.grid.set(x, y, EnvLayer.WindY, vy);
      }
    }
  }

  // Semi-Lagrangian Advection (Simplified)
  // Moves values based on wind velocity
  private advect(targetLayer: EnvLayer, velXLayer: EnvLayer, velYLayer: EnvLayer) {
    const dt = 1.0; // Time step
    // We need a temp buffer or just do a "scatter" approach which is easier but less accurate
    // Or "gather" approach: Look back where the wind came from
    
    // Using a simplified gather approach without interpolation for performance
    // (Ideally should use bilinear interpolation)
    
    // Since we can't allocate a full buffer every tick for performance,
    // we might accept some artifacts or process in chunks.
    // For now, let's just do a simple neighbor transfer based on wind direction.
    
    // NOTE: True fluid dynamics needs a buffer. Let's try a stochastic approach?
    // Or just simple integer lookup for now.
    
    const w = this.grid.width;
    const h = this.grid.height;
    
    // Create a small buffer for the row to avoid immediate feedback loop
    // Or just iterate and accept bias.
    
    // Better: "Gather" from (x - u*dt, y - v*dt)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = this.grid.get(x, y, velXLayer);
        const v = this.grid.get(x, y, velYLayer);
        
        // Backtrace
        let srcX = x - u * dt;
        let srcY = y - v * dt;
        
        // Clamp/Wrap coordinates
        srcX = (srcX + w) % w;
        srcY = (srcY + h) % h;
        
        // Nearest neighbor (floor)
        const val = this.grid.get(Math.floor(srcX), Math.floor(srcY), targetLayer);
        
        // Soft update (blend with current to simulate inertia/mixing)
        const current = this.grid.get(x, y, targetLayer);
        this.grid.set(x, y, targetLayer, current * 0.9 + val * 0.1);
      }
    }
  }

  private cycleWater() {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const temp = this.grid.get(x, y, EnvLayer.Temperature);
        const soilMoisture = this.grid.get(x, y, EnvLayer.SoilMoisture);
        let humidity = this.grid.get(x, y, EnvLayer.Humidity);
        
        // 1. Evaporation: Heat causes soil moisture to become humidity
        // Higher temp -> more evaporation
        if (soilMoisture > 0 && temp > 0) {
            const evapRate = 0.001 * (temp / 20); 
            const amount = Math.min(soilMoisture, evapRate);
            
            this.grid.add(x, y, EnvLayer.SoilMoisture, -amount);
            this.grid.add(x, y, EnvLayer.Humidity, amount);
        }
        
        // 2. Precipitation (Rain): If humidity is too high, it rains
        // Dew point logic simplified
        if (humidity > 0.8) {
            const rainAmount = (humidity - 0.8) * 0.1; // 10% of excess falls as rain
            
            this.grid.add(x, y, EnvLayer.Humidity, -rainAmount);
            this.grid.add(x, y, EnvLayer.SoilMoisture, rainAmount);
            
            // Rain cools the air
            this.grid.add(x, y, EnvLayer.Temperature, -rainAmount * 5);
        }
      }
    }
  }

  // 간단한 확산 알고리즘 (Box Blur)
  // 최적화를 위해 전체 그리드를 돌지 않고 확률적으로 일부만 업데이트하거나
  // GPU/WebAssembly 가속을 고려해야 하지만, 여기서는 CPU 기반 단순 구현
  private diffuse(layer: EnvLayer, rate: number) {
    // 임시 버퍼 없이 제자리 연산(In-place)은 아티팩트를 만들지만 빠름
    // 정확도를 위해 더블 버퍼링이 필요할 수 있음
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const current = this.grid.get(x, y, layer);
        
        // 주변 4방향 평균
        const n = this.grid.get(x, y - 1, layer);
        const s = this.grid.get(x, y + 1, layer);
        const e = this.grid.get(x + 1, y, layer);
        const w = this.grid.get(x - 1, y, layer);
        
        const average = (n + s + e + w) / 4;
        
        // 현재 값과 주변 평균 사이로 수렴
        const newValue = current + (average - current) * rate;
        this.grid.set(x, y, layer, newValue);
      }
    }
  }

  private applySunlight(tick: number) {
    // 하루 주기 (Day/Night Cycle) - 2400틱 = 1일 가정
    const timeOfDay = tick % 2400;
    const isDay = timeOfDay > 600 && timeOfDay < 1800; // 06:00 ~ 18:00
    
    if (!isDay) return; // 밤에는 광합성 불가 (달빛 제외)

    // 태양 고도에 따른 강도 (Sine Wave)
    const sunAngle = Math.sin(((timeOfDay - 600) / 1200) * Math.PI);
    const intensity = Math.max(0, sunAngle * 1000); // Max 1000 Lux

    // 전체 맵에 태양광 적용 (구름/그림자 로직 추가 가능)
    // 성능상 모든 셀을 매번 업데이트하기보다, 샘플링하거나 전역 변수로 처리할 수도 있음
    // 여기서는 "리얼함"을 위해 그리드에 기록
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        // 구름이 있다면 차감해야 함 (Humidity가 높으면 구름으로 가정)
        const cloudCover = this.grid.get(x, y, EnvLayer.Humidity);
        const actualLight = intensity * (1.0 - cloudCover * 0.8);
        
        this.grid.set(x, y, EnvLayer.LightIntensity, actualLight);
        
        // 빛은 온도를 높임
        this.grid.add(x, y, EnvLayer.Temperature, actualLight * 0.0001);
      }
    }
  }

  // 초기 지형 생성 (Perlin Noise 대용 - 단순 랜덤/그라데이션)
  initializeWorld() {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        // 기본 온도 20도 + 랜덤 변동
        this.grid.set(x, y, EnvLayer.Temperature, 20 + Math.random() * 5);
        // 습도 50%
        this.grid.set(x, y, EnvLayer.Humidity, 0.5 + Math.random() * 0.2);
        // 비옥도
        this.grid.set(x, y, EnvLayer.SoilNitrogen, 0.8);
        this.grid.set(x, y, EnvLayer.SoilMoisture, 0.4);
      }
    }
    console.log("Environment initialized with high-resolution parameters.");
  }
}
