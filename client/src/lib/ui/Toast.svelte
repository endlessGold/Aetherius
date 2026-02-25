<script lang="ts">
  interface Props {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    onclose?: () => void;
  }
  let { message, type = 'info', duration = 3000, onclose }: Props = $props();

  $effect(() => {
    const timer = setTimeout(() => {
      onclose?.();
    }, duration);
    return () => clearTimeout(timer);
  });
</script>

<div class="toast {type}">
  <span class="icon">
    {#if type === 'success'}✓
    {:else if type === 'warning'}⚠
    {:else if type === 'error'}✕
    {:else}ℹ{/if}
  </span>
  <span class="message">{message}</span>
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 1.5rem;
    background: #1a1a1a;
    border-left: 4px solid #666;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
  }

  .toast.success { border-left-color: #2ecc71; }
  .toast.warning { border-left-color: #f1c40f; }
  .toast.error { border-left-color: #e74c3c; }
  .toast.info { border-left-color: var(--pico-primary); }

  .icon {
    font-weight: bold;
    font-size: 1.2rem;
  }

  .message {
    color: #eee;
    font-size: 0.95rem;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
