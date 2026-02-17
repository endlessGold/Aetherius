import { ComponentBase } from '../core/interfaces.js';
import { System } from '../core/events/eventTypes.js';
export class PlantComponent extends ComponentBase {
    constructor(speciesName, growthRate = 0.5) {
        super({
            // Defaults
            speciesName,
            height: 0,
            age: 0,
            health: 100,
            maturityAge: 100,
            alive: true,
            waterContent: 50,
            sunlightExposure: 100,
            temperature: 20,
            soilNutrients: 50,
            co2Level: 400,
            windSpeed: 0,
            humidity: 50,
            growthRateBase: growthRate,
            photosynthesisRate: 1.0,
            respirationRate: 0.02,
            waterUptakeEfficiency: 0.8,
            nutrientUptakeEfficiency: 0.7,
            lightUseEfficiency: 0.9,
            shadingFactor: 1.0,
            competitionPressure: 0.0,
            herbivoryPressure: 0.0,
            droughtStress: 0.0,
            frostStress: 0.0,
            diseaseLoad: 0.0,
            pestLoad: 0.0
        });
        this.name = 'Plant';
    }
    handleEvent(event) {
        if (event instanceof System.Tick && this.state.alive) {
            // Expect environment data in payload, or fallback to defaults
            const env = event.payload.environment || {
                soilMoisture: 50,
                light: 100,
                temperature: 20,
                soilNutrients: 50,
                co2Level: 400,
                windSpeed: 0,
                humidity: 50
            };
            this.processGrowth(env);
        }
    }
    processGrowth(env) {
        // 1. Calculate Factors (0.0 - 1.0)
        const waterFactor = Math.min((env.soilMoisture / 100) * this.state.waterUptakeEfficiency, 1);
        const sunlightFactor = Math.min((env.light / 100) * this.state.lightUseEfficiency, 1);
        const nutrientFactor = Math.min((env.soilNutrients / 100) * this.state.nutrientUptakeEfficiency, 1);
        // Temperature: Optimal range 5-35°C (simplified)
        const temperatureFactor = (env.temperature >= 5 && env.temperature <= 35) ? 1.0 : 0.5;
        // CO2: normalized to 400ppm baseline
        const co2Factor = env.co2Level / 400;
        // 2. Calculate Growth Amount
        // Growth = Base * Water * Light * Nutrients * Temp * CO2 * Interactions
        // Note: shadingFactor should logically reduce light. If 1.0 means "full shade", we might use (1 - shading).
        // Let's assume shadingFactor is a multiplier (1.0 = no shade, 0.5 = half shade). 
        // Wait, design says "shadingFactor: 주변 식물 그림자 영향". Let's assume 1.0 = normal, < 1.0 = shaded.
        // Actually user design says "shadingFactor * (1 - competitionPressure)". 
        // If shadingFactor is 1.0 (good), then it multiplies.
        let growth = this.state.growthRateBase
            * waterFactor
            * sunlightFactor
            * nutrientFactor
            * temperatureFactor
            * co2Factor
            * this.state.shadingFactor
            * (1 - this.state.competitionPressure);
        // Apply generic health penalty
        if (this.state.health < 50)
            growth *= 0.5;
        this.state.height += Math.max(0, growth);
        // 3. Stress Calculation
        this.state.droughtStress = Math.max(0, 1 - waterFactor);
        this.state.frostStress = env.temperature < 5 ? 1 : 0;
        // Health Decay
        const stressDamage = (this.state.droughtStress * 0.5 +
            this.state.frostStress * 1.0 +
            this.state.diseaseLoad * 0.5 +
            this.state.pestLoad * 0.5);
        this.state.health -= stressDamage;
        this.state.health = Math.min(100, Math.max(0, this.state.health));
        // 4. Update Internal State
        this.state.age += 1; // Assuming 1 Tick = 1 Day for this model
        this.state.waterContent = env.soilMoisture;
        this.state.sunlightExposure = env.light;
        this.state.temperature = env.temperature;
        this.state.soilNutrients = env.soilNutrients;
        this.state.co2Level = env.co2Level;
        // 5. Check Death Conditions
        if (this.state.health <= 0 || this.state.age > (this.state.maturityAge * 2)) {
            this.state.alive = false;
            // Optionally emit a 'Death' event here
        }
    }
}
