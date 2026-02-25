<script lang="ts">
  import { gameState, currentScene } from "../store.svelte";
  import Panel from "../ui/Panel.svelte";
  import ProgressBar from "../ui/ProgressBar.svelte";
  import NavigationPanel from "./Navigation/NavigationPanel.svelte";
  import NodeActions from "./Navigation/NodeActions.svelte";
  import LogViewer from "../ui/LogViewer.svelte";
  import ActionButton from "../ui/ActionButton.svelte";
</script>

<aside class="side-panel">
  <!-- 1. Status HUD -->
  <Panel title="STATUS MONITOR">
    <ProgressBar
      label="HP (Integrity)"
      value={gameState.hp}
      max={gameState.maxHp}
      color="red"
    />
    <ProgressBar
      label="Mental (Entropy)"
      value={gameState.mental}
      max={gameState.maxMental}
      color="blue"
    />

    <div class="currency-row">
      <div class="sap-container">
        <span class="sap-icon">💧</span>
        <span class="sap-value">{gameState.sap}</span>
        <span class="sap-label">SAP</span>
      </div>
    </div>
  </Panel>

  <!-- 2. Navigation & Actions -->
  <Panel title="NAVIGATION">
    <NavigationPanel />
  </Panel>

  <NodeActions />

  <!-- 3. Log Area -->
  <div class="log-panel-wrapper">
    <LogViewer logs={gameState.log} />
  </div>

  <!-- 4. Choices Area (Deprecated/Optional for Scene Events) -->
  {#if currentScene.choices.length > 0}
    <Panel title="SCENE INTERACTION">
      <div class="choices-list">
        {#each currentScene.choices as choice}
          <ActionButton
            text={choice.text}
            onclick={choice.action}
            disabled={choice.disabled}
          />
        {/each}
      </div>
    </Panel>
  {/if}
</aside>

<style>
  .side-panel {
    width: var(--panel-width);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: #080a0c;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 767px) {
    .side-panel {
      flex: 1;
      width: 100%;
      border-left: none;
    }
  }

  .currency-row {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .sap-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .sap-value {
    color: #ffd700;
    font-weight: bold;
    font-family: monospace;
    font-size: 1.4rem;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }

  .sap-label {
    font-size: 0.7rem;
    color: #666;
    margin-top: 4px;
  }

  .log-panel-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 200px;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
</style>
