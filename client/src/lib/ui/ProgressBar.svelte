<script lang="ts">
  export interface Props {
    value: number;
    max: number;
    label: string;
    color?: "red" | "blue" | "default";
  }
  let { value, max, label, color = "default" }: Props = $props();
</script>

<div class="progress-group">
  <div class="label-row">
    <span class="label-text">{label}</span>
    <span class="value">{value}/{max}</span>
  </div>
  <progress {value} {max} class={color}></progress>
</div>

<style>
  .progress-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #888;
  }

  .label-text {
    font-weight: 500;
  }

  .value {
    font-family: monospace;
    color: #aaa;
  }

  progress {
    width: 100%;
    height: 0.4rem;
    margin: 0;
    background-color: #1a1a1a;
    border-radius: 1px;
    border: none;
  }

  progress.red::-webkit-progress-value {
    background-color: #d62828;
  }
  progress.blue::-webkit-progress-value {
    background-color: #457b9d;
  }
  progress.default::-webkit-progress-value {
    background-color: var(--pico-primary);
  }
</style>
