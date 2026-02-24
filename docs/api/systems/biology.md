# 미시적 BiologicalEntity & LLM 기반 파라미터 모델링 (Biology)

## 1. 목적

- 단세포·미생물 수준의 생명체를 **형태(Topology), 대사(Metabolism), 감각/전투, 이동, 번식** 등 파라미터 그룹으로 나누어 모델링한다.
- 사용자는 자연어로 생명체의 생김새·성격·역할을 묘사하고, 필요한 일부 파라미터만 직접 채운다.
- LLM은 나머지 세부 파라미터를 설계·보완하고, 누락된 필수 필드가 있으면 정책에 따라 **자동 보완 또는 사용자 확인 요청**을 수행한다.

## 2. 파라미터 그룹 (요약)

- **공통 메타데이터**
  - `entity_id`: 종 식별자 (`CELL-00A-PROKARYOTE` 등, 유일)
  - `biomass_picograms`: 개체 질량 (pg 단위)

- **Topology (형태·구조)**
  - `shape_family`: COCCUS / BACILLUS / SPIRILLUM / AMORPHOUS 등 기하학 카테고리
  - `length_microns`, `diameter_microns`, `aspect_ratio`: 크기·비율
  - `membrane_fluidity`: 세포막 유동성 (0~1)
  - `membrane_layers`: SINGLE / DOUBLE / TRIPLE 등 막 레이어
  - `cell_wall_type`: NONE / GRAM_POSITIVE / GRAM_NEGATIVE / OTHER
  - `cytoskeleton_integrity`, `osmotic_tolerance`: 구조 강도·삼투압 내성

- **Metabolic Engine (대사 엔진)**
  - `primary_metabolism`: PHAGOCYTOSIS / PHOTOSYNTHESIS / CHEMOSYNTHESIS / FERMENTATION / AEROBIC_RESPIRATION ...
  - `secondary_metabolism[]`: 보조 대사 경로
  - `atp_generation_rate`, `basal_atp_cost`: 에너지 생산·유지 비용
  - `substrate_preferences[]`: 영양원 선호도 (substrate, affinity)
  - `waste_products[]`: 폐기물 유형·독성
  - `starvation_response`: `tissue_sacrifice_ratio`, `sporulation_trigger`, `sporulation_threshold_energy`, `sporulation_survival_ticks`

- **Nervous & Sensory (신경·감각)**
  - `nervous_system`: 존재 여부, `complexity_level`, `reaction_latency_ticks`
  - `sensory_array`: 시각 스펙트럼, `chemotaxis`(감지 반경·유인/기피 물질·민감도), 기계적/온도 감각 레벨

- **Warfare & Defense (포식·화학전·방어)**
  - `predatory_array`: 물리적 공격 여부, 접촉 피해량, 삼키기 임계치
  - `chemical_warfare`: 용해 효소(`lysis_enzymes`), 독소 리스트(`toxins`), `toxin_resistance`, `self_immunity`
  - `defense_traits`: 껍질 경도, 재생력, 위장 수준 등

- **Locomotion (이동 기제)**
  - `primary_method`: FLAGELLAR_PROPULSION / CILIA_BEATING / AMOEBOID_MOVEMENT / GLIDING / PASSIVE_DRIFT
  - `base_speed_microns_per_sec`, `acceleration_microns_per_sec2`, `turn_rate_deg_per_sec`
  - `energy_cost_per_micron`, 유체 점도에 따른 이동 효율

- **Reproductive Cycle & Genome (번식·유전자)**
  - `method`: BINARY_FISSION / BUDDING / FRAGMENTATION / SPORE_FORMATION ...
  - `generation_time_ticks`, `offspring_variance`
  - `horizontal_gene_transfer`: 활성 여부, 성공 확률, 선호 소스, 이벤트당 DNA 조각 수
  - `genome_descriptor`: 유전체 크기, GC 비율, 세대당 돌연변이율, 복구 효율

- **Visuals (선택, 설명용)**
  - `description`: 자연어 생김새 설명
  - `phenotype_tags[]`: TRANSPARENT / SPIKY / GLOWING / CHAIN_FORMING 등
  - `danger_level`: 플레이어 체감 위험도 (0~10)

### 3. LLM 기반 생성 플로우

#### 입력 (요청)

- `description_text`: 사용자가 작성한 자연어 설명 (ko/en 등)
- `description_language`: 설명 언어 코드
- `partial_parameters?`: `BiologicalEntity` 구조의 부분 집합 (사용자가 직접 고정하고 싶은 값)
- `target_detail_level`: LOW / MEDIUM / HIGH (세밀도 힌트)
- `auto_fill_policy`:
  - `mode`: ASK / AUTO_FILL / STRICT_MANUAL
  - `group_overrides?`: 그룹별 별도 정책 (예: Topology는 STRICT, Metabolism은 AUTO)
- `constraints_profile?`: 값 범위·환경 제약 프리셋 (예: MICROBE_STANDARD, EXTREME_ENVIRONMENT)
- `existing_species_id?`: 기존 종을 베이스로 재설계할 때 사용

#### 출력 (응답 타입)

1. `COMPLETE_MODEL`
   - `model: BiologicalEntity`
   - `provenance`: 필드별 출처 (`USER_PROVIDED` / `LLM_INFERRED` / `DEFAULT_RULE`)
   - `notes[]`: 주요 선택에 대한 짧은 설명

2. `MISSING_REQUIRED_FIELDS`
   - `draft_model`: LLM이 채운 초안 모델
   - `missing_fields[]`: 누락된 필수 필드 목록 + 제안값
   - `message_for_user`: 사용자에게 보여줄 안내/질문

3. `INVALID_MODEL`
   - `draft_model?`
   - `violations[]`: 위반된 제약 규칙 목록
   - `suggested_actions[]`: 수정 제안

### 4. 설계 원칙

- **사용자 입력 우선**: `partial_parameters`로 들어온 값은 LLM이 덮어쓰지 않는다.
- **그룹 단위 제어**: 파라미터를 Topology/Metabolism/… 그룹으로 나눔으로써, 그룹별로 자동 보완 정책을 다르게 가져갈 수 있다.
- **설명 가능성**: 주요 결정(예: 대사 타입, 이동 방식, 독성)은 `notes`를 통해 이유를 남긴다.
- **언어 독립성**: 자연어 설명은 다국어를 허용하지만, 최종 파라미터 구조는 언어 비의존적이어야 한다.

이 명세를 기준으로, LLM 오케스트레이션 레이어에서 `BiologicalEntity` 종 데이터(예: `src/gamedata/species.ts`)를 생성·보완하는 기능을 구현한다.
