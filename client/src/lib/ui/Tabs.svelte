<script lang="ts">
  interface Props {
    items: { id: string; label: string; icon?: string }[];
    activeId: string;
    onSelect: (id: string) => void;
  }
  let { items, activeId, onSelect }: Props = $props();
</script>

<div class="tabs">
  {#each items as item}
    <button 
      class="tab-btn {activeId === item.id ? 'active' : ''}"
      onclick={() => onSelect(item.id)}
    >
      {#if item.icon}<span class="icon">{item.icon}</span>{/if}
      {item.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }

  .tab-btn {
    flex: 1;
    padding: 0.8rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tab-btn:hover {
    color: #ccc;
    background: rgba(255, 255, 255, 0.02);
  }

  .tab-btn.active {
    color: var(--pico-primary);
    border-bottom-color: var(--pico-primary);
    background: rgba(15, 139, 141, 0.05);
  }

  .icon {
    margin-right: 0.4rem;
  }
</style>
