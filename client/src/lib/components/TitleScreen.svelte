<script lang="ts">
  import { gameState } from '../store.svelte';
</script>

<div class="title-screen">
  <div class="title-content">
    <h1>AETHERIUS</h1>
    <p class="subtitle">PROJECT: RECLAMATION</p>
    
    <button class="start-btn" onclick={() => gameState.setStatus('playing')}>
      INITIALIZE SYSTEM
    </button>
  </div>
  
  <div class="scanlines"></div>
</div>

<style>
  .title-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #000;
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  .title-content {
    z-index: 10;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  h1 {
    font-size: 6rem;
    margin: 0;
    letter-spacing: 1rem;
    font-weight: 200;
    text-shadow: 0 0 20px rgba(255,255,255,0.3);
    animation: glow 3s infinite alternate;
  }

  .subtitle {
    font-size: 1.2rem;
    letter-spacing: 0.5rem;
    color: #666;
    margin-bottom: 3rem;
  }

  .start-btn {
    padding: 1.2rem 4rem;
    font-size: 1.2rem;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: #ccc;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
  }

  .start-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--pico-primary);
    color: #fff;
    box-shadow: 0 0 20px rgba(15, 139, 141, 0.3);
  }

  .scanlines {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 51%);
    background-size: 100% 4px;
    animation: scanline 10s linear infinite;
    opacity: 0.1;
    pointer-events: none;
  }

  @keyframes glow {
    from { text-shadow: 0 0 10px rgba(255,255,255,0.1); }
    to { text-shadow: 0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(15, 139, 141, 0.2); }
  }

  @keyframes scanline {
    0% { background-position: 0 0; }
    100% { background-position: 0 100%; }
  }
</style>
