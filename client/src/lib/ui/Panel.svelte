<script lang="ts">
  export interface Props {
    title?: string;
    children?: any;
    className?: string;
  }
  let { title, children, className = '' }: Props = $props();
</script>

<div class={`panel-section ${className}`}>
  {#if title}
    <h4 class="section-title">{title}</h4>
  {/if}
  <div class="section-content">
    {@render children?.()}
  </div>
</div>

<style>
  .panel-section {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .section-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #555;
    margin-bottom: 1rem;
    border-bottom: 1px solid #222;
    padding-bottom: 0.5rem;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
