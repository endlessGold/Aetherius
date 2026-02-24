# 2026-02-23 API Abstraction, Beginner Docs, and LLM-Free Mode Updates

## 1. Architectural Abstraction & LLM-Free Mode

### 1.1 `ControlService` Abstraction
- `src/ai/llmService.ts`
  - Introduced `ControlService` as the top-level interface for AI/System control.
  - `LLMService` now extends `ControlService` as a marker interface for LLM-based implementations.
  - Renamed factory function `createDefaultLLMService` to `createControlService`.

### 1.2 `NativeService` Implementation
- `src/ai/llmService.ts`
  - Added `NativeService` class that implements `ControlService`.
  - Represents the native system capabilities without external AI dependencies.
  - Returns `[System::Native]` prefixed responses indicating the system is running in native mode.
  - Added `isEnabled()` method to `ControlService` interface.

### 1.3 Environment Variable Support
- `src/ai/llmService.ts`
  - `createControlService` checks `AETHERIUS_LLM_ENABLED` (default: '1').
  - If '0', returns `NativeService`.
  - If '1', returns `GeminiLLMService` or `OpenRouterLLMService` based on `AETHERIUS_LLM_PROVIDER`.

### 1.4 Consumer Refactoring
- Updated all service consumers to depend on `ControlService` instead of `LLMService`:
  - `src/ai/agents/scientistAgents.ts` (replaced `this.llm` with `this.control`)
  - `src/ai/agents/narrativeAgents.ts`
  - `src/ai/orchestrator.ts`
  - `src/ai/narrativeOrchestrator.ts`
  - `src/ai/generators/bioEntityGenerator.ts`
  - `src/ai/translate.ts`
  - `src/command/commandHandler.ts`
  - `src/core/systems/aiEventOrchestratorSystem.ts`
  - `src/core/systems/autoSystem.ts`

### 1.5 Status API Update
- `src/app/server/routes/getStatus.ts`
  - Added `llm` field to the status response.
  - Example: `{"llm": {"enabled": false, "model": "native-service-v1"}}`

## 2. High-Level Scenario API Implementation

### 2.1 New API Endpoints
- **GET /api/scenarios**: Returns list of available scenarios.
- **POST /api/scenarios/:id/start**: Executes a specific scenario.

### 2.2 Scenario Registry
- Implemented in `src/app/server/routes/scenarios.ts`.
- **quick-start**: Spawns initial plant and creature, advances 10 ticks.
- **mass-extinction**: Triggers meteor impact and simulates aftermath.

### 2.3 Implementation Details
- Uses `WorldSession.enqueueRequest` for commands.
- Handles `advance_tick` explicitly via `WorldSession.tickNow` to bypass async command restrictions.
- Provides step-by-step execution results.

## 3. Documentation Improvements

### 3.1 Issue Documentation
- Created `docs/issues/2026-02-23-api-abstraction-beginner-docs-and-llm-free-mode.md` detailing the requirements and design rationale.

### 3.2 Update Documentation
- This file tracks the implementation progress.

## 4. Verification
- Validated code changes via static analysis and existing patterns.
- Ensure `AETHERIUS_LLM_ENABLED=0` creates a functional environment without external API calls.
