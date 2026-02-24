---
title: Economy SDK API (EN)
version: 1.0.0
language: en
module: economy
description: Full public SDK-API reference for the Aetherius Economy module
sidebar:
  label: Economy (EN)
  order: 10
---

# Economy SDK-API Reference (EN)

## 1. Module Overview

### 1.1 Runtime Context

- Aetherius is a TypeScript/Node.js project built into `dist/` via `npm run build`.
- The Economy SDK-API is typically used in two ways:
  - Inside this repository, importing modules via relative paths to drive simulations.
  - In the future, as a published package (`aetherius`) exposing the same API surface.
- This document focuses on types/functions/classes provided by the Economy module.

### 1.2 Economy Module Overview

- The Economy module provides:
  - State modeling for the survival economy (Vertic/Edges/Poly).
  - Evolution based on EconomyAgent and EconomyGenome.
  - AetheriusEngine for applying actions (mining, crafting, consuming, trading, photosynthesis, etc.).
  - Integration with World and EventBus via EconomySystem.

## 2. Public Types

### 2.1 Resources and State Types

- Vertic, Edges, Poly
  - Vertic: basic survival/action resource.
  - Edges: trust/credit/relationship lines.
  - Poly: tradable asset/nutrient with `area` and `energyDensity`.
- Economant
  - Aggregated state object for an entity’s Vertic/Edges/Poly.
- NutrientPool
  - Environmental pool of Poly, mainly consumed by plants.

### 2.2 Roles and Actions

- SpeciesRole (enum)
  - Roles such as `plant`, `marketAgent`, `grazer`, `predator`, `decomposer`.
  - Each value is an auto-assigned numeric ID that maps to a code name.
- SpeciesRoleId, PlantSpeciesRole, AnimalSpeciesRole, PrimaryProducerRole
  - Type aliases for role IDs and role groups.
- EconomyActionKind (enum)
  - Action IDs for MINE / CRAFT / CONSUME / TRADE_BUY / TRADE_SELL / WITNESS / IDLE
  - Plus plant-specific actions: PHOTOSYNTHESIS / PROCESS_NUTRIENT / COMPETE_NUTRIENT.

### 2.3 Agent and Genome Types

- EconomyAgent
  - An agent with Economant, EconomyGenome, and an ID.
- EconomyGenome
  - Stores action weights, craftArea, mutationRate, generation, and related parameters.
- RunOneStepResult
  - Summarizes a single round: which agents acted and which entered default state.

## 3. Engine Functions

### 3.1 AetheriusEngine

- Role
  - Applies actions (mining, crafting, consuming, trading, etc.) to Economant state.
- Characteristics
  - Mutates state directly; callers must be aware of when and how it is invoked.

### 3.2 selectAction

- Role
  - Chooses the next EconomyAction for an agent given its EconomyGenome and surrounding context.
- Characteristics
  - Uses probabilistic selection, so results depend on RNG state.

### 3.3 runOneStep

- Role
  - Executes one round for a population:
    - Select actions → apply via engine → process defaults.
- Result
  - Returns RunOneStepResult and can trigger callbacks (onAction, onDefault) for integration.

### 3.4 createPopulation

- Role
  - Creates an initial population of EconomyAgents.
- Input
  - Population size, optional speciesId, and PRNG to initialize genomes and states.

## 4. Evolution & Genome

### 4.1 EconomyEvolution

- Role
  - High-level engine evolving an EconomyAgent population generation by generation.
- Behavior
  - Selects elites based on fitness, then applies crossover/mutation to produce the next generation.

### 4.2 EconomyEvolutionConfig and Defaults

- EconomyEvolutionConfig
  - Holds populationSize, stepsPerGeneration, eliteCount, seed, etc.
- DEFAULT_EVOLUTION_CONFIG
  - Reasonable default configuration for EconomyEvolution.

### 4.3 Genome Utilities

- createEconomyGenome
  - Constructs an EconomyGenome with default weights (plant vs non-plant).
- fitness
  - Computes a single fitness score from an Economant’s V/E/P.
- mutate / crossover
  - mutate: injects noise into genome weights and parameters.
  - crossover: combines two genomes into a new one.

## 5. Events Integration

### 5.1 Economy Events Overview

- Economy.ActionApplied
  - Emitted when a concrete EconomyAction is applied.
- Economy.DefaultOccurred
  - Emitted when an entity enters a default/basic income state (e.g., Vertic=0).

### 5.2 RunOneStepResult and Events

- runOneStep’s actions/defaults are transformed into EventBus events via EconomySystem.
- Payload includes entityId, actionKind (EconomyActionKind), tickCount, rehabCount, etc.

## 6. Configuration

### 6.1 EconomySystemConfig

- enabled: whether EconomySystem is active.
- stepsPerGeneration: number of ticks per generation.
- populationSize: size of the EconomyAgent population.
- seed: random seed used for evolution.

### 6.2 Other Configuration Values

- DEFAULT_ENVIRONMENT
  - Default environmental state for Economy simulations.
- DEFAULT_EVOLUTION_CONFIG
  - Default configuration for EconomyEvolution.

## 7. Examples

### 7.1 Minimal Economy Simulation Flow

- Create an initial population via the Economy module.
- Prepare an AetheriusEngine and PRNG.
- Run a loop calling runOneStep and consume RunOneStepResult for logging/analytics.

### 7.2 World + Economy Integration Flow

- Create a World instance and register EconomySystem.
- Configure EconomySystemConfig (populationSize, stepsPerGeneration, etc.).
- Each World.tick() also drives EconomySystem.tick(world), evolving agents alongside environmental systems.

