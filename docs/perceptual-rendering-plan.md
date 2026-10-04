# Aetherius Perceptual Rendering Plan

## 1. 목적과 경계

Aetherius는 Godot의 물리 렌더링을 버리지 않는다. Forward+가 계산한 기하, 가시성, 깊이, 노멀, 재질, 조명, 모션 정보를 **관찰 근거(evidence)** 로 사용하고, 그 위에서 장면의 시각적 중요도를 판단해 정보를 보존·억제·단순화·강조·재구성한다.

이 문서는 Aetherius 전용 렌더링/아트 디렉션 계획이다. BBIDE에는 이 화풍이나 프로젝트 규칙을 넣지 않는다. BBIDE는 render.capture, render.inspect, shader.validate, shader.profile, render.compare 같은 범용 자동화 능력만 제공한다.

## 2. 설계 원칙

1. **Physical baseline first** — PBR/Forward+ 결과는 관찰 레이어이며 최종 미감 그 자체가 아니다.
2. **Perceptual importance over uniform stylization** — 화면 전체에 같은 셀 임계값을 적용하지 않는다.
3. **Semantic rendering** — 픽셀의 색뿐 아니라 object/material/role/importance를 렌더 판단에 사용한다.
4. **Information suppression is a feature** — 미세 노이즈를 무조건 보존하지 않고 focal/structural/characteristic 정보에 예산을 배분한다.
5. **Designed lighting** — 물리 조명 뒤에 value hierarchy와 focal contrast를 재설계한다.
6. **Temporal art stability** — 일반 TAA가 아니라 예술적 마스크/영역/표현 상태를 motion vector와 object ID로 재투영한다.
7. **Inspectable passes** — 각 중간 버퍼는 디버그/비교/자동평가가 가능해야 한다.

## 3. 렌더 그래프

```text
Godot Forward+
  -> Evidence Capture
     color HDR / depth / normal-roughness / motion / optional specular
  -> Boundary & Shape Analysis
  -> Complexity / Saliency / Semantic Importance
  -> Detail Budget
  -> Visual Mass
  -> Form Separation
  -> Artistic Shadow / Material Interpretation / Atmosphere
  -> Temporal Paint State
  -> Artistic Composite
  -> Final Frame + Diagnostics
```

## 4. 후킹 지점

- **PRE_OPAQUE**: 필요 시 사전 기하/보조 타깃 준비. 최종 색 수정 금지.
- **POST_OPAQUE**: opaque physical result를 기반으로 shape/material/light 분석.
- **POST_SKY**: 하늘-지면-초점 대상의 value/color relationship 조정.
- **POST_TRANSPARENT**: temporal state와 artistic operators를 최종 HDR에 합성.

외부 Vulkan/OpenGL interception은 기본 경로가 아니다. 엔진을 소유하므로 Godot CompositorEffect/RenderingDevice 기반의 engine-owned passes를 우선한다.

## 5. 핵심 필드와 알고리즘

### 5.1 Boundary / Shape
Depth gradient + normal discontinuity + curvature approximation으로 silhouette, major plane, contact boundary를 추출한다. 미세 normal noise는 구조적 edge와 분리한다.

### 5.2 Perceptual Importance
개념식:

```text
importance =
  focal_weight
+ semantic_weight
+ silhouette_weight
+ structural_curvature
+ lighting_relevance
+ motion_relevance
- noise_penalty
```

### 5.3 Detail Budget
complexity와 importance를 결합해 픽셀/영역별 표현 예산을 만든다. 저중요도 고주파 정보는 단순화하고 focal/characteristic detail은 보존한다. 이것은 mesh LOD와 별개의 **perceptual LOD**다.

### 5.4 Visual Mass
픽셀 단위 edge가 아니라 큰 색면·명암 덩어리·실루엣 군집을 생성한다. 축소 해상도에서 label/statistics를 계산하고 full-resolution 합성에서 사용한다.

### 5.5 Form Separation
형태가 읽히지 않는 영역에만 shadow/value/atmosphere/edge operator 가중치를 배분한다. 전체 화면 outline이나 균일 toon threshold를 피한다.

### 5.6 Artistic Shadow
physical shadow를 입력으로 받아 tiny shadow suppression, region merge, contact emphasis, hue/value shift를 적용한다. form shadow와 cast shadow의 역할을 구분한다.

### 5.7 Material Interpretation
PBR 채널을 파괴하지 않고 입력 근거로 사용한다. material family별로 macro color mass, roughness simplification, normal-detail suppression, characteristic accents를 파생한다.

### 5.8 Temporal Artistic Stabilization
motion vector로 이전 paint state를 재투영한다. object ID 불일치와 disocclusion에서는 history를 폐기한다. 누적 대상은 최종 색만이 아니라 detail mask, operator weights, mass identity, palette region 등이다.

## 6. Semantic Buffer

각 렌더 객체는 최소한 다음 메타데이터를 제공할 수 있어야 한다.

```text
semantic_class
material_family
artistic_role
importance
detail_priority
stable_object_id
```

GPU에서는 ID auxiliary target + lookup table/structured data로 전달한다. character/focal object와 background foliage가 같은 edge 정책을 사용하지 않도록 한다.

## 7. GPU 자원 계획

- HDR color: RGBA16F, full resolution
- boundary/detail fields: R16F, 1/2~full resolution
- operator weights: RGBA16F, 1/2 resolution
- motion: engine velocity target
- object ID: R32UI
- history: RGBA16F 또는 pass별 compact target
- atmosphere/importance/visual-mass statistics: 1/4~1/2 resolution

Transient texture는 GPUResourcePool에서 수명/크기/format 기준으로 재사용한다. 해상도 변경 시 안전하게 재할당한다.

## 8. 구현 단계

### Phase A — Evidence & Inspector
Forward+ 전환, CompositorEffect 연결, color/depth/normal-roughness/motion 접근 검증, 버퍼 inspector/diagnostic contract 구축.

### Phase B — Shape & Information
GPUResourcePool, boundary, complexity, saliency, detail-budget compute chain을 실제 dispatch graph로 연결한다.

### Phase C — Semantics & Visual Mass
stable object/semantic ID auxiliary pass, reduced-resolution mass clustering/statistics, semantic importance를 연결한다.

### Phase D — Artistic Operators
form separation, artistic shadow, material interpretation, atmosphere/value hierarchy를 독립 pass로 구현한다.

### Phase E — Temporal Painting
motion reprojection + object-ID gating + disocclusion rejection + history reset 정책을 구현한다.

### Phase F — Evaluation
중간 pass export, GPU timing, flicker/history rejection, edge density, detail density, value hierarchy, focal separation을 수치화한다. BBIDE는 이 진단값을 범용 인터페이스로 읽어 Loop Engineering에서 부분 재실행 판단에 사용할 수 있다.

## 9. 품질 게이트

각 Phase는 다음을 만족해야 다음 단계로 진행한다.

- Godot project load/smoke 성공
- render graph dependency validation 성공
- shader compilation 성공
- buffer format/size contract 일치
- physical baseline toggle 유지
- 중간 pass를 독립적으로 검사 가능
- 이전 프레임 history가 object boundary를 넘어 누출되지 않음
- fallback/debug path와 Forward+ compositor를 동시에 활성화하지 않음

## 10. 실패/폴백 정책

- required buffer 미지원: 해당 artistic pass만 비활성화하고 physical baseline 유지
- semantic ID 미준비: temporal paint 비활성화; 화면 좌표 기반 history로 가짜 대체하지 않음
- GPU budget 초과: atmosphere/statistics/importance부터 저해상도화
- shader compile 실패: 이전 검증된 pipeline을 유지
- 외부 graphics hooking은 Godot-owned buffer로 해결할 수 없는 경우에만 adapter로 검토

## 11. 첫 구현 범위

첫 구현은 Phase A와 Phase B의 기반까지로 제한한다.

1. Forward+ 전환
2. 실제 CompositorEffect 설치
3. resolved color/depth/normal-roughness/motion buffer contract 확인
4. RenderingDevice compute dispatch
5. PerceptualRenderGraph 계약
6. ShotProfile 데이터 모델
7. boundary/detail-budget/form-separation/temporal-reprojection GPU kernel 골격
8. live fused perception/composite pass
9. smoke/contract test

다음 구현에서 resource pool, semantic/object ID target, 실제 multi-pass dispatch, visual-mass clustering, temporal history를 순차적으로 연결한다.

## 12. 비목표

- 특정 작가 이름을 style preset으로 구현하지 않는다.
- 단순 cel shader를 최종 렌더러로 취급하지 않는다.
- BBIDE에 Aetherius 전용 shader/preset/pipeline을 넣지 않는다.
- 존재하지 않는 buffer나 완성되지 않은 pass를 구현 완료로 표시하지 않는다.
