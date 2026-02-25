<script lang="ts">
  export interface Props {
    logs: string[];
    title?: string;
  }
  let { logs, title = "SYSTEM LOG" }: Props = $props();

  let container: HTMLElement;

  $effect(() => {
    // Scroll to bottom when logs update
    if (logs.length && container) {
      container.scrollTop = container.scrollHeight;
    }
  });
</script>

<div class="log-viewer">
  {#if title}<h4 class="viewer-title">{title}</h4>{/if}
  <div class="log-content" bind:this={container}>
    {#each logs as log}
      <div class="log-entry">
        <span class="log-bullet">›</span>
        <span class="log-text">{log}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .log-viewer {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 1rem;
  }

  .viewer-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #555;
    margin-bottom: 1rem;
    border-bottom: 1px solid #222;
    padding-bottom: 0.5rem;
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-right: 0.5rem;
  }

  .log-entry {
    display: flex;
    gap: 0.6rem;
    opacity: 0.6;
    line-height: 1.4;
  }

  .log-entry:last-child {
    opacity: 1;
    color: var(--pico-primary-hover);
    background: rgba(15, 139, 141, 0.05);
    padding: 0.2rem 0;
  }

  .log-bullet {
    color: #444;
  }
</style>
