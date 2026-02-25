<script lang="ts">
  export interface Props {
    label: string;
    value: string | number;
    icon?: string;
  }
  let { label, value, icon }: Props = $props();
</script>

<div class="stat-row">
  <div class="label-col">
    {#if icon}<span class="icon">{icon}</span>{/if}
    <span class="label">{label}</span>
  </div>
  <span class="value">{value}</span>
</div>

<style>
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  }

  .stat-row:last-child {
    border-bottom: none;
  }

  .label-col {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #888;
    font-size: 0.9rem;
  }

  .value {
    font-family: monospace;
    color: #ccc;
    font-weight: bold;
  }
</style>
