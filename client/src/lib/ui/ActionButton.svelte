<script lang="ts">
  export interface Props {
    text: string;
    disabled?: boolean;
    onclick: () => void;
  }
  let { text, disabled = false, onclick }: Props = $props();
</script>

<button class="action-btn" {onclick} {disabled}>
  <span class="btn-text">{text}</span>
  <span class="btn-arrow">→</span>
</button>

<style>
  .action-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.2rem 1.5rem;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #ccc;
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    border-radius: 2px;
    font-size: 0.95rem;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--pico-primary);
    background: linear-gradient(
      90deg,
      rgba(15, 139, 141, 0.15) 0%,
      rgba(15, 139, 141, 0.05) 100%
    );
    color: #fff;
    transform: translateX(4px);
    box-shadow: -4px 0 0 var(--pico-primary);
  }

  .btn-arrow {
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.2s ease;
    color: var(--pico-primary);
  }

  .action-btn:hover .btn-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    filter: grayscale(100%);
  }
</style>
