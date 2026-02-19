import { ComponentBase } from '../core/interfaces.js';
import { System } from '../core/events/eventTypes.js';
export class WeatherComponent extends ComponentBase {
    constructor() {
        // Default starting weather
        super({
            condition: 'Sunny',
            temperature: 25,
            humidity: 50,
            windSpeed: 2,
            co2Level: 400,
            sunlightIntensity: 100,
            precipitation: 0
        });
        this.name = 'Weather';
    }
    handleEvent(event) {
        // 1. Handle External Weather Change Events
        if (event instanceof System.ChangeWeather) {
            this.updateWeather(event.payload);
            console.log(`[Weather] Changed to ${this.state.condition}, Temp: ${this.state.temperature}°C, Rain: ${this.state.precipitation}mm`);
        }
        // 2. Dynamic Fluctuations on Tick (Optional)
        if (event instanceof System.Tick) {
            // Small random fluctuations could be added here
            // e.g., temperature varies by time of day if we had time
        }
    }
    updateWeather(payload) {
        Object.assign(this.state, payload);
        // Auto-adjust derived values based on condition if not explicitly provided
        switch (this.state.condition) {
            case 'Sunny':
                if (payload.sunlightIntensity === undefined)
                    this.state.sunlightIntensity = 100;
                if (payload.precipitation === undefined)
                    this.state.precipitation = 0;
                break;
            case 'Rainy':
                if (payload.sunlightIntensity === undefined)
                    this.state.sunlightIntensity = 40;
                if (payload.humidity === undefined)
                    this.state.humidity = 80;
                if (payload.precipitation === undefined)
                    this.state.precipitation = 10;
                break;
            case 'Stormy':
                if (payload.sunlightIntensity === undefined)
                    this.state.sunlightIntensity = 20;
                if (payload.windSpeed === undefined)
                    this.state.windSpeed = 15;
                if (payload.precipitation === undefined)
                    this.state.precipitation = 50;
                break;
            case 'Cloudy':
                if (payload.sunlightIntensity === undefined)
                    this.state.sunlightIntensity = 60;
                break;
            case 'Drought':
                if (payload.precipitation === undefined)
                    this.state.precipitation = 0;
                if (payload.humidity === undefined)
                    this.state.humidity = 10;
                if (payload.temperature === undefined)
                    this.state.temperature = 35;
                break;
        }
    }
}
