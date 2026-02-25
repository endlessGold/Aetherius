<script lang="ts">
  interface Props {
    label: string;
    icon?: string;
  }
  let { label, icon }: Props = $props();
</script>

<span class="badge">
  {#if icon}{icon} {/if}
  {label}
</span>

<style>
  .badge {
    background: rgba(0, 0, 0, 0.6);
    padding: 0.4rem 1rem;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 0.85rem;
    backdrop-filter: blur(8px);
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
