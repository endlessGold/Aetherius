// 고해상도 환경 시뮬레이션을 위한 데이터 구조체
// 메모리 효율성을 위해 TypedArray(Float32Array)를 사용합니다.
// 1024x1024 그리드 x 16개 레이어 = 약 1600만 파라미터 기본 생성
// 이를 청크 단위로 확장하면 수십억 개 이상의 파라미터 시뮬레이션 가능
export var EnvLayer;
(function (EnvLayer) {
    EnvLayer[EnvLayer["Temperature"] = 0] = "Temperature";
    EnvLayer[EnvLayer["Humidity"] = 1] = "Humidity";
    EnvLayer[EnvLayer["SoilMoisture"] = 2] = "SoilMoisture";
    EnvLayer[EnvLayer["SoilNitrogen"] = 3] = "SoilNitrogen";
    EnvLayer[EnvLayer["SoilPhosphorus"] = 4] = "SoilPhosphorus";
    EnvLayer[EnvLayer["SoilPotassium"] = 5] = "SoilPotassium";
    EnvLayer[EnvLayer["LightIntensity"] = 6] = "LightIntensity";
    EnvLayer[EnvLayer["WindX"] = 7] = "WindX";
    EnvLayer[EnvLayer["WindY"] = 8] = "WindY";
    EnvLayer[EnvLayer["CO2Concentration"] = 9] = "CO2Concentration";
    EnvLayer[EnvLayer["Elevation"] = 10] = "Elevation";
    EnvLayer[EnvLayer["Pollution"] = 11] = "Pollution";
    EnvLayer[EnvLayer["MicrobialActivity"] = 12] = "MicrobialActivity";
    EnvLayer[EnvLayer["RootDensity"] = 13] = "RootDensity";
    EnvLayer[EnvLayer["Compaction"] = 14] = "Compaction";
    EnvLayer[EnvLayer["PHLevel"] = 15] = "PHLevel"; // pH 레벨
})(EnvLayer || (EnvLayer = {}));
export class EnvironmentGrid {
    constructor(width, height, layers = 16) {
        this.width = width;
        this.height = height;
        this.layers = layers;
        // 전체 데이터 크기: 너비 * 높이 * 레이어 수
        // 1024 * 1024 * 16 * 4 bytes ≈ 64MB 메모리 사용
        this.data = new Float32Array(width * height * layers);
    }
    // 인덱스 계산 헬퍼
    getIndex(x, y, layer) {
        // 경계 처리 (Torus topology - 세상은 둥글다)
        const wx = (x + this.width) % this.width;
        const wy = (y + this.height) % this.height;
        return (wy * this.width + wx) * this.layers + layer;
    }
    // 값 읽기
    get(x, y, layer) {
        return this.data[this.getIndex(x, y, layer)];
    }
    // 값 쓰기
    set(x, y, layer, value) {
        this.data[this.getIndex(x, y, layer)] = value;
    }
    // 값 더하기 (Delta 적용)
    add(x, y, layer, delta) {
        this.data[this.getIndex(x, y, layer)] += delta;
    }
    // 특정 영역의 평균값 계산 (식물 뿌리가 닿는 영역 등)
    getRegionAverage(centerX, centerY, radius, layer) {
        let sum = 0;
        let count = 0;
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
    // 전체 통계 (디버깅용)
    getStatistics(layer) {
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        const size = this.width * this.height;
        for (let i = 0; i < size; i++) {
            const val = this.data[i * this.layers + layer];
            if (val < min)
                min = val;
            if (val > max)
                max = val;
            sum += val;
        }
        return { min, max, avg: sum / size };
    }
}
