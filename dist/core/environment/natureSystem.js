import { Layer, EnvLayer } from './environmentGrid.js';
import { getEnvironmentRecipe } from './environmentRecipes.js';
export class NatureSystem {
    constructor(grid) {
        this.grid = grid;
    }
    // 매 틱마다 환경을 시뮬레이션 (활성 청크만 처리하여 최적화)
    simulate(tickCount) {
        // 1. 청크 단위 병렬 처리 (가상)
        this.grid.forEachActiveChunk((chunk, cx, cy, w, h) => {
            // 청크 내부 시뮬레이션 (Local)
            this.processChunk(chunk, cx, cy, w, h, tickCount);
        });
        // 2. 확산 및 이류 (경계면 처리가 필요하지만 현재는 약식 구현)
        // 전역 루프 대신 활성 청크 기반으로 처리해야 함
        // 현재는 성능을 위해 확산/이류는 일시적으로 비활성화하거나,
        // 플레이어 주변 등 핵심 영역만 처리하는 로직으로 변경 필요.
        // 여기서는 "과학적 시뮬레이션"을 보여주기 위해 일부 샘플링만 수행하거나
        // 활성 청크에 대해서만 단순화된 연산을 수행합니다.
    }
    // 청크 단위 처리 (CPU 캐시 효율성 증대)
    processChunk(chunk, cx, cy, w, h, tick) {
        const layers = 21; // Grid layers
        const size = w * h;
        // 상수 미리 계산
        const timeOfDay = tick % 2400;
        const isDay = timeOfDay > 600 && timeOfDay < 1800;
        const sunAngle = Math.sin(((timeOfDay - 600) / 1200) * Math.PI);
        const sunIntensity = Math.max(0, sunAngle * 1000);
        for (let i = 0; i < size; i++) {
            const baseIndex = i * layers;
            // 1. 태양 복사열 (Solar Radiation)
            if (isDay) {
                const humidity = chunk[baseIndex + Layer.Humidity];
                const actualLight = sunIntensity * (1.0 - humidity * 0.8);
                chunk[baseIndex + Layer.LightIntensity] = actualLight;
                chunk[baseIndex + Layer.Temperature] += actualLight * 0.0001;
                chunk[baseIndex + Layer.UVRadiation] = actualLight * 0.1; // 자외선
            }
            else {
                chunk[baseIndex + Layer.LightIntensity] = 0;
                chunk[baseIndex + Layer.UVRadiation] = 0;
            }
            // 2. 물 순환 (Water Cycle)
            const temp = chunk[baseIndex + Layer.Temperature];
            const soilMoisture = chunk[baseIndex + Layer.SoilMoisture];
            const humidity = chunk[baseIndex + Layer.Humidity];
            // 증발
            if (soilMoisture > 0 && temp > 0) {
                const evapRate = 0.001 * (temp / 20);
                const amount = Math.min(soilMoisture, evapRate);
                chunk[baseIndex + Layer.SoilMoisture] -= amount;
                chunk[baseIndex + Layer.Humidity] += amount;
            }
            // 강수
            if (humidity > 0.8) {
                const rainAmount = (humidity - 0.8) * 0.1;
                chunk[baseIndex + Layer.Humidity] -= rainAmount;
                chunk[baseIndex + Layer.SoilMoisture] += rainAmount;
                chunk[baseIndex + Layer.Temperature] -= rainAmount * 5;
                chunk[baseIndex + Layer.GroundWaterLevel] += rainAmount * 0.5; // 지하수 함양
            }
            // 3. 바람 (Wind) - 절차적 생성 (Procedural Generation)
            // 전역 좌표 계산
            const lx = i % w;
            const ly = Math.floor(i / w);
            const gx = cx * w + lx;
            const gy = cy * h + ly;
            const time = tick * 0.01;
            const nx = gx * 0.05;
            const ny = gy * 0.05;
            chunk[baseIndex + Layer.WindX] = Math.sin(ny + time) + Math.cos(nx * 0.5);
            chunk[baseIndex + Layer.WindY] = Math.cos(nx + time) - Math.sin(ny * 0.5);
            // 3D 바람 (수직 기류)
            chunk[baseIndex + Layer.WindZ] = (chunk[baseIndex + Layer.Temperature] - 20) * 0.1;
        }
    }
    initializeWorld(rng, recipeId = 'forest') {
        console.log("[NatureSystem] Initializing starting zone (1024x1024)...");
        const startSize = 1024;
        const rand = () => (rng ? rng.nextFloat01() : Math.random());
        const recipe = getEnvironmentRecipe(recipeId);
        // 시작 지점 주변만 초기화
        for (let y = 0; y < startSize; y++) {
            for (let x = 0; x < startSize; x++) {
                const baseTemp = recipe.base[EnvLayer.Temperature] ?? 20;
                const baseHumidity = recipe.base[EnvLayer.Humidity] ?? 0.5;
                const baseSoilMoisture = recipe.base[EnvLayer.SoilMoisture] ?? 0.4;
                const baseNitrogen = recipe.base[EnvLayer.SoilNitrogen] ?? 0.8;
                const basePh = recipe.base[EnvLayer.PHLevel] ?? 6.5;
                const baseOrganic = recipe.base[EnvLayer.OrganicMatter] ?? 0.3;
                const baseGroundWater = recipe.base[EnvLayer.GroundWaterLevel] ?? 5.0;
                const baseSalinity = recipe.base[EnvLayer.SoilSalinity] ?? 0.01;
                this.grid.set(x, y, Layer.Temperature, baseTemp + (rand() - 0.5) * 5);
                this.grid.set(x, y, Layer.Humidity, baseHumidity + (rand() - 0.5) * 0.2);
                this.grid.set(x, y, Layer.SoilNitrogen, baseNitrogen);
                this.grid.set(x, y, Layer.SoilMoisture, baseSoilMoisture);
                this.grid.set(x, y, Layer.PHLevel, basePh + (rand() - 0.5) * 0.5);
                this.grid.set(x, y, Layer.OrganicMatter, baseOrganic);
                this.grid.set(x, y, Layer.GroundWaterLevel, baseGroundWater);
                this.grid.set(x, y, Layer.SoilSalinity, baseSalinity);
            }
        }
        console.log("Environment initialized with high-resolution parameters.");
    }
    applyRecipeAt(x, y, recipeId, radius) {
        const recipe = getEnvironmentRecipe(recipeId);
        const r = radius;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy > r * r)
                    continue;
                const gx = x + dx;
                const gy = y + dy;
                for (const [layerKey, value] of Object.entries(recipe.base)) {
                    const layer = Number(layerKey);
                    this.grid.set(gx, gy, layer, value);
                }
            }
        }
    }
}
