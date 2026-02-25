<script lang="ts">
  import { gameState } from '../../store.svelte';
  import ActionButton from '../../ui/ActionButton.svelte';
  import Panel from '../../ui/Panel.svelte';

  function handleWait() {
    gameState.moveTime(60);
    gameState.addLog('시간을 보냈습니다. (Time +1h)');
  }

  function handleInspect() {
    gameState.addLog('주변을 자세히 조사했지만 특별한 것은 발견하지 못했습니다.');
  }
</script>

<Panel title="CONTEXTUAL ACTIONS">
  <div class="action-grid">
    <button class="context-btn" onclick={handleInspect}>
        <span class="icon">🔍</span>
        <span class="label">INSPECT</span>
    </button>
    <button class="context-btn" onclick={handleWait}>
        <span class="icon">⏳</span>
        <span class="label">WAIT</span>
    </button>
    <button class="context-btn disabled">
        <span class="icon">🎒</span>
        <span class="label">INVENTORY</span>
    </button>
  </div>
</Panel>

<style>
  .action-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }

  .context-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s;
  }

  .context-btn:hover:not(.disabled) {
    background: rgba(255,255,255,0.08);
    border-color: var(--pico-primary);
    color: #fff;
  }

  .context-btn.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.5rem;
  }

  .label {
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }
</style>
