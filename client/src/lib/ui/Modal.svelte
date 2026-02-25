<script lang="ts">
  interface Props {
    open: boolean;
    title?: string;
    onclose: () => void;
    children?: any;
  }
  let { open, title, onclose, children }: Props = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay" onclick={onclose} role="dialog" tabindex="-1">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        {#if title}<h3>{title}</h3>{/if}
        <button class="close-btn" onclick={onclose}>×</button>
      </div>
      <div class="modal-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: #0f1318;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    min-width: 400px;
    max-width: 90vw;
    border-radius: 4px;
    animation: slideUp 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--pico-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .close-btn:hover {
    color: #fff;
  }

  .modal-body {
    padding: 1.5rem;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
