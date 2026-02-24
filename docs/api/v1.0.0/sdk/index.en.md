---
title: Aetherius SDK Overview (EN)
version: 1.0.0
language: en
module: sdk
description: Overview of Aetherius SDK structure and per-module API docs
sidebar:
  label: SDK Overview (EN)
  order: 1
---

# Aetherius SDK Overview

## 1. SDK Structure

- Core
  - Simulation runtime: World, systems, EventBus.
- Economy
  - Survival economy and evolutionary dynamics (Vertic/Edges/Poly).
- Events
  - Event types and categories used across the simulation.
- Entities
  - Assembly and catalog for Plant/Creature/Weather entities.

Each module has a “single responsibility page” pair (ko/en)  
that documents the entire public API surface of that module.

## 2. Per-Module SDK-API Docs

- Economy module
  - [Economy SDK API (KO)](economy.ko.md)
  - [Economy SDK API (EN)](economy.en.md)

Additional modules (Core/Events/Entities, etc.) will follow the same pattern  
with `{module}.ko.md` / `{module}.en.md` single-responsibility pages.

