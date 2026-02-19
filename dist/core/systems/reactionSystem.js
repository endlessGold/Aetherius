import { BaseSystem } from './baseSystem.js';
import { Environment, Biological } from '../events/eventTypes.js';
// 반응형 시스템 (Reaction System)
// 특정 이벤트가 발생했을 때 연쇄 반응을 일으키는 로직을 담당
export class ReactionSystem extends BaseSystem {
    registerHandlers() {
        // 예: 비(WeatherChange)가 내리면 -> 식물 성장 촉진 이벤트 발생?
        // 또는 특정 조건에서 화재 발생 등
        this.subscribe(Environment.WeatherChange, this.handleWeatherChange);
        this.subscribe(Biological.EntitySpawn, this.handleEntitySpawn);
    }
    handleWeatherChange(event) {
        // 비가 많이 오면 홍수 이벤트 발생 가능성 체크
        const { layer, delta } = event.payload;
        // 여기에 복잡한 연쇄 반응 로직 추가
        // if (delta > 0.5) this.publish(new Environment.Flood(...));
    }
    handleEntitySpawn(event) {
        const { entityType, position } = event.payload;
        // 새로운 생명체가 태어나면 주변 환경에 영향을 줌 (예: 영양분 감소)
        // 반응 이벤트 생성
        // this.publish(new NutrientDepletionEvent(...));
    }
}
