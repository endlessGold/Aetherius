<script lang="ts">
  import { currentNode } from "../../store.svelte";

  function handleMove(targetId: string) {
    currentNode.moveTo(targetId);
  }
</script>

<div class="navigation-panel">
  <div class="connections-list">
    {#each currentNode.connections as conn}
      <button
        class="nav-btn {conn.isLocked ? 'locked' : ''}"
        onclick={() => handleMove(conn.targetNodeId)}
        disabled={conn.isLocked}
        title={conn.isLocked ? conn.lockedMessage : ""}
      >
        <div class="nav-info">
          <span class="nav-label">{conn.label}</span>
          <span class="nav-cost">{conn.cost}m</span>
        </div>
        {#if conn.isLocked}
          <span class="lock-icon">🔒</span>
        {:else}
          <span class="arrow-icon">➜</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .navigation-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .connections-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .nav-btn:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--pico-primary);
    color: #fff;
    padding-left: 1.2rem;
  }

  .nav-btn.locked {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(20, 0, 0, 0.3);
    border-color: rgba(255, 0, 0, 0.1);
  }

  .nav-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .nav-label {
    font-weight: bold;
    font-size: 0.9rem;
  }

  .nav-cost {
    font-size: 0.7rem;
    color: #666;
    font-family: monospace;
  }

  .arrow-icon {
    opacity: 0.5;
  }
</style>
