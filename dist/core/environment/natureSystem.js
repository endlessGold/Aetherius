import { EnvLayer } from './environmentGrid.js';
export class NatureSystem {
    constructor(grid) {
        this.grid = grid;
    }
    // 매 틱마다 환경을 시뮬레이션
    simulate(tickCount) {
        // 1. 확산 (Diffusion) - 열, 가스, 수분의 이동
        this.diffuse(EnvLayer.Temperature, 0.1); // 열 확산
        this.diffuse(EnvLayer.Humidity, 0.05); // 습도 확산
        // 2. 바람 이동 (Advection) - 바람에 의한 구름/씨앗 이동
        // this.advect(EnvLayer.Humidity, EnvLayer.WindX, EnvLayer.WindY);
        // 3. 증발 및 강수 (Evaporation & Precipitation)
        // this.cycleWater();
        // 4. 태양 복사열 (Solar Radiation)
        this.applySunlight(tickCount);
    }
    // 간단한 확산 알고리즘 (Box Blur)
    // 최적화를 위해 전체 그리드를 돌지 않고 확률적으로 일부만 업데이트하거나
    // GPU/WebAssembly 가속을 고려해야 하지만, 여기서는 CPU 기반 단순 구현
    diffuse(layer, rate) {
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
    applySunlight(tick) {
        // 하루 주기 (Day/Night Cycle) - 2400틱 = 1일 가정
        const timeOfDay = tick % 2400;
        const isDay = timeOfDay > 600 && timeOfDay < 1800; // 06:00 ~ 18:00
        if (!isDay)
            return; // 밤에는 광합성 불가 (달빛 제외)
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
