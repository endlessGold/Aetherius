# Aetherius: 생태적 존재를 위한 기하학적 역학

비언어적 생명체(식물, 나무)부터 고도화된 문명까지 포괄하는 **범우주적 생존 역학** 명세.

---

## 1. 존재의 3요소 (The Bio-Geometric Pillars)

| 요소 | 기하학적 형태 | 생태적 현상 (예: 나무) | 수학적 기능 |
|------|---------------|-------------------------|-------------|
| **Vertic** | 점 (Point) | 활성 기회 (광합성 가능 시간, 수분) | 모든 생명 활동의 **고정 비용 (1V)** |
| **Edges** | 선 (Line) | 근권/영역 (뿌리의 뻗침, 영양분 뺏기) | 공간 점유 및 타 개체와의 **관계/경쟁** |
| **Poly** | 면 (Surface) | 영양분/열매 (고정된 유기 에너지) | 차후 기회(V)로 환원 가능한 **저장 자산** |

핵심: **에너지를 투입하여 유기물을 만들고 물리적 점유권을 확장하는 행위** = **[기회 소모 → 가치 연성 → 관계 확장]**.

---

## 2. 생태적 행동의 경제적 치환 (Economic Translation)

| 경제 행동 | 생태 행동 | 비용 | 결과 |
|-----------|-----------|------|------|
| **채굴 (Mining)** | 광합성/흡수 | 1V (생물학적 시간·대사) | 원료 확보 → 영양분(Poly) 생성 |
| **가공 (Processing)** | 영양분(유기물) 합성 | 1V (화학적 연산) | 포도당·열매 등 고정 형태(Poly). $P_{area}$↑ → 기근 시 생존 기회↑ |
| **거래 (Trading)** | 영역 확장·영양분 찬탈 | 1V (뿌리 뻗는 기회) | 뿌리로 주변 영양분 흡수·타 개체 영역 침범. **관측자(환경/미생물) 개입 시** 자산 이동으로 동일 수식 처리 |

---

## 3. 생물학적 필연성

1. **기회 비용의 공정성**: 광합성 가능 시간(V)은 한정. 성장 vs 방어 등 배분이 진화론적 생존 전략.
2. **관계의 증명**: 열매·영양분 이동 시 **보증인(Witness)** 에너지 소모로 엔트로피 법칙 유지. Witness는 반드시 다른 Economant일 필요 없고, **환경 엔터티**가 보증인 역할 가능.
3. **파산(Default)의 자연 선택**: 기회 소진 후에도 Poly를 만들지 못한 개체는 고사(파산). Edges·Poly는 토양(시스템)으로 회수, 새 씨앗(3V)으로 기초수급.

---

## 4. 구현 요약

| 구성요소 | 역할 |
|----------|------|
| **BioEntity** | Economant와 동일. speciesId = 생물 종 (예: OakTree, WildFlower). |
| **EcologicalEngine** | AetheriusEngine 확장. `photosynthesis`, `synthesizeNutrient`, `competeForResource`(환경 Witness). 환경 배율 적용 `spendVertic`. |
| **EnvironmentState** | `vCostMultiplier`: 행동당 V 소모 배율. 가뭄 >1, 양호 <1. |
| **RootNetwork** | 뿌리 네트워크(연결 그래프). `connect`, `areConnected`, `neighbours`. 군집 시뮬레이션에서 연결된 개체 간에만 공유/찬탈. |

- **군집 시뮬레이션**: `colony.ts`의 `RootNetwork`로 연결 그래프 유지. `competeForResource` 호출 전 `areConnected(attacker.id, defender.id)`로 제한 가능.
- **환경 영향**: `EcologicalEngine` 생성 시 또는 `setEnvironment(EnvironmentState)`로 `vCostMultiplier` 설정. `spendVertic` 시 배율 적용(ceil).
- **Tick/EventBus 연동**: `core/events/eventTypes.ts`에 `Economy` 네임스페이스(`ActionApplied`, `DefaultOccurred`)가 정의되어 있어, `World.tick()` 경계에서 economy 스텝을 실행하고 이벤트를 발행하는 방식으로 통합할 수 있음.
