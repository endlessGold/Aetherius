# Aetherius UMS Engine Architecture

## 1. Purpose

Aetherius UMS is a data-driven game-system runtime on Godot. Game rules and content should be represented as structured Game IR wherever practical so humans, editors, automation and AI agents can modify the same executable representation.

The primary artifact of design is an executable system change, not a prose design document.

```text
Human / AI Agent / Editor
          |
       ChangeSet
          |
        Game IR
          |
      Validation
          |
      Rule Runtime
          |
     Godot Adapter
          |
 Play / Simulation / Web
```

## 2. Architectural boundaries

The engine is divided into Authoring, Change, Game IR, Validation, Runtime, Simulation, Godot Adapter and Presentation layers. Logical game entities are not Godot Nodes; Nodes are presentation/runtime projections of logical entities.

Godot is the runtime backend, renderer, physics/navigation provider, editor preview and headless simulation host.

## 3. Game IR

The initial vocabulary is deliberately small and composable:

- World, Entity, Component, Group
- Event, Trigger, Condition, Action, Rule
- State, Variable, Resource
- Material, Effect, SpawnRule, Encounter

A rule follows `WHEN -> IF -> DO`.

```json
{
  "id": "open_ancient_gate",
  "when": {"event": "entity_entered", "area": "ancient_gate"},
  "if": {"enemy_count": {"group": "gate_guardians", "equals": 0}},
  "do": [
    {"open_gate": "ancient_gate"},
    {"activate": "crystal"},
    {"set_world_state": {"gate_restored": true}}
  ]
}
```

## 4. Runtime

The target runtime is decomposed into:

```text
EventBus
EntityRegistry
RuleRuntime
ConditionEvaluator
ActionExecutor
WorldState
ResourceRuntime
GodotAdapter
```

Godot events are normalized into EventBus events. RuleRuntime selects matching rules. ConditionEvaluator performs read-only queries. ActionExecutor applies mutations through adapters rather than embedding Godot-specific operations into Game IR.

## 5. Rule atoms and graphs

Reusable rule atoms form the design vocabulary: Damage, Reflect, Split, Repeat, Delay, Chance, Sequence, Spawn, Transform, Redirect, Accumulate, Consume, Convert, Scale, Clamp, Copy and Link.

Rules should be representable as graphs so dependencies, cycles and execution traces can be inspected. New content should compose existing atoms. Engine code is added only when a genuinely new primitive is required.

## 6. ChangeSet and transactions

All automated mutations should eventually occur through ChangeSets:

```text
begin_change
 -> patch working Game IR
 -> validate
 -> simulate
 -> compare
 -> commit | rollback
```

The live representation must not expose partially applied changes. Diffs should preserve reason, affected rules/entities, validation results and simulation evidence.

## 7. Validation

Validation proceeds through schema, reference, graph and semantic stages. It detects malformed data, duplicate IDs, missing references, unsupported operations, dangling dependencies, dangerous cycles and invariant violations.

Project invariants can encode engine limits and game principles. Scenario tests then verify observable outcomes such as `gate_restored == true`.

## 8. Simulation

Headless Godot executes deterministic scenarios and batch simulations. Expected metrics include completion rate, encounter duration, damage, deaths, resource flow, build distribution, dead-content rate and dominant-strategy rate.

CI progression:

```text
Game IR validation
 -> headless scenario tests
 -> Godot Web export
 -> smoke check
 -> artifact
 -> Vercel deployment
```

## 9. Presentation

Presentation is separated from game logic. A logical entity resolves through a presentation descriptor to mesh/artwork, material, animation, VFX, audio and UI feedback.

The current visual baseline is 3D space with illustration-oriented 2D-style materials. Material IR should expose palette, shadow bands, rim, emission, painted variation, outline and environment response without changing game rules.

## 10. UMS package target

```text
map/
  manifest.json
  world/
    world.json
    regions.json
  entities/
    enemies.json
    objects.json
    interactables.json
  rules/
    combat.json
    encounters.json
    progression.json
  presentation/
    materials.json
    effects.json
    environment.json
  scenarios/
    tests.json
  assets/
```

The current single `ums/map_definition.json` is the vertical-slice form and should migrate toward this package structure as the IR stabilizes.

## 11. AI/MCP surface

The intended editor API is capability-oriented:

- World: get/query world and state
- Entity: create/patch/remove/query
- Rule: create/patch/remove/trace
- Graph: connect/disconnect/query dependencies/find cycles
- Runtime: emit/execute/spawn/reset
- Simulation: simulate/batch/compare
- Validation: validate/check invariants/detect dead content
- ChangeSet: begin/apply/diff/commit/rollback

Agents should receive this API rather than unrestricted source-file editing for normal design work.

## 12. Delivery loop

```text
Demand / Human intent
 -> Council
 -> ChangeSet
 -> Game IR
 -> Validation
 -> Simulation
 -> Godot UMS
 -> Web build
 -> Players
 -> Telemetry
 -> Demand
```

GitHub is the traceable change/build surface. Vercel is the browser-playable presentation surface for builds that already passed GitHub CI.

## 13. Implementation phases

- Phase 0: Godot Web CI — complete.
- Phase 1: executable Trigger/Condition/Action vertical slice — complete.
- Phase 2: decomposed Game IR runtime.
- Phase 3: Entity/Component Registry.
- Phase 4: Rule Graph.
- Phase 5: ChangeSet and transactions.
- Phase 6: validation and scenarios.
- Phase 7: headless simulation.
- Phase 8: MCP editor API.
- Phase 9: multi-agent council.
- Phase 10: demand-to-deployment closed loop.
