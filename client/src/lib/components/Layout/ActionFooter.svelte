<script lang="ts">
  import { gameState } from '../../store.svelte';
  
  let chatInput = $state('');

  function handleSend() {
    if (chatInput.trim()) {
      gameState.addLog(`[Player]: ${chatInput}`);
      chatInput = '';
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSend();
  }

  function handleWait() {
    if (gameState.isMoving) return;
    gameState.addLog("[System]: Rested for a while. (10m passed)");
    gameState.moveTime(10);
    gameState.modifyHp(5);
  }
</script>

<footer class="hud-action-footer">
  <!-- Left: Chat Window -->
  <div class="chat-panel">
    <div class="chat-tabs">
      <button class="tab-btn active">All</button>
      <button class="tab-btn">Party</button>
      <button class="tab-btn">System</button>
    </div>
    <div class="chat-log">
      {#each gameState.log.slice(-5) as log}
        <div class="log-line">{log}</div>
      {/each}
    </div>
    <div class="chat-input-wrapper">
      <input 
        type="text" 
        bind:value={chatInput} 
        onkeypress={handleKeyPress}
        placeholder="Enter message..." 
        class="chat-input"
      />
      <button class="chat-btn" onclick={handleSend}>↵</button>
    </div>
  </div>

  <!-- Center: Quick Slots & Exp -->
  <div class="center-panel">
    <!-- Exp Bar -->
    <div class="exp-bar-container">
      <div class="exp-fill" style="width: {gameState.exp / gameState.maxExp * 100}%"></div>
      <span class="exp-text">{gameState.exp.toFixed(1)}%</span>
    </div>

    <!-- Quick Slots -->
    <div class="quick-slots">
      {#each Array(8) as _, i}
        <button class="slot-btn">
          <span class="key-hint">{i + 1}</span>
          <div class="slot-icon">
             <!-- Abstract Tech Pattern for empty slots -->
             <svg viewBox="0 0 24 24" width="16" height="16" style="opacity: 0.3;">
                <path fill="none" stroke="currentColor" stroke-width="1" d="M2 2h4v4H2z M18 2h4v4h-4z M2 18h4v4H2z M18 18h4v4h-4z M12 8l-4 4 4 4 4-4-4-4z"/>
             </svg>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Right: Actions -->
  <div class="action-panel">
    <button class="main-action-btn attack">
      <div class="action-icon">
        <!-- Sci-Fi Target Reticle -->
        <svg viewBox="0 0 24 24" width="40" height="40">
           <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
           <path fill="currentColor" d="M12 2l2 4h-4l2-4zm0 20l-2-4h4l-2 4zM2 12l4-2v4l-4-2zm20 0l-4 2v-4l4 2z"/>
           <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      </div>
    </button>
    <button class="sub-action-btn" onclick={handleWait} disabled={gameState.isMoving}>
      <div class="action-icon">
         <!-- Standby / Power Icon -->
         <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" stroke="currentColor" stroke-width="2" d="M12 2v10M6.3 4.9a9 9 0 1 0 11.4 0"/>
         </svg>
      </div>
    </button>
    <button class="sub-action-btn">
      <div class="action-icon">
         <!-- Halt / Hand Icon replacement -->
         <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" stroke="currentColor" stroke-width="2" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
            <path fill="currentColor" d="M8 11h8v2H8z"/>
         </svg>
      </div>
    </button>
  </div>
</footer>

<style>
  .hud-action-footer {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    width: 100%;
    height: 200px;
    position: relative;
    pointer-events: none;
    font-family: 'Consolas', 'Monaco', monospace; /* Tech font */
  }

  /* Left Chat Panel - Comms Terminal */
  .chat-panel {
    pointer-events: auto;
    width: 400px;
    height: 180px;
    background: rgba(10, 15, 20, 0.9);
    border: 1px solid #333;
    border-left: 2px solid rgba(255, 165, 0, 0.5); /* Orange accent */
    display: flex;
    flex-direction: column;
    padding: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    position: relative;
  }
  
  /* Tech decoration */
  .chat-panel::before {
    content: 'COMMS_CHANNEL_01';
    position: absolute;
    top: -16px;
    left: 0;
    font-size: 0.6rem;
    color: rgba(255, 165, 0, 0.7);
    letter-spacing: 1px;
    background: rgba(0,0,0,0.8);
    padding: 2px 4px;
    border: 1px solid #333;
    border-bottom: none;
  }

  .chat-tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px;
  }

  .tab-btn {
    background: #111;
    border: 1px solid #333;
    color: #555;
    font-size: 0.7rem;
    cursor: pointer;
    padding: 2px 12px;
    transition: all 0.1s;
    font-family: inherit;
    text-transform: uppercase;
  }

  .tab-btn:hover {
    color: #888;
    border-color: #555;
  }

  .tab-btn.active {
    background: #222;
    color: #00f0ff;
    border-color: #00f0ff;
    box-shadow: inset 0 0 5px rgba(0, 240, 255, 0.2);
  }

  .chat-log {
    flex: 1;
    overflow-y: auto;
    font-size: 0.8rem;
    color: #ccc;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
    padding: 4px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .log-line {
    line-height: 1.3;
    padding: 1px 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .chat-input-wrapper {
    display: flex;
    gap: 4px;
    background: #000;
    border: 1px solid #333;
    padding: 2px;
  }

  .chat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #00f0ff;
    font-family: inherit;
    font-size: 0.8rem;
    padding: 4px 8px;
    outline: none;
  }
  
  .chat-input::placeholder {
    color: #333;
  }

  .chat-btn {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #555;
    cursor: pointer;
    padding: 0 10px;
    transition: all 0.1s;
  }

  .chat-btn:hover {
    color: #00f0ff;
    border-color: #00f0ff;
  }

  /* Center Panel */
  .center-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
    pointer-events: auto;
  }

  /* Exp Bar - Energy Beam */
  .exp-bar-container {
    width: 100%;
    max-width: 400px;
    height: 8px;
    background: rgba(10, 15, 20, 0.8);
    border: 1px solid #333;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
    position: relative;
    margin-bottom: 4px;
    overflow: hidden;
  }

  .exp-fill {
    height: 100%;
    background: linear-gradient(90deg, #0088aa, #00f0ff, #ffffff, #00f0ff, #0088aa);
    background-size: 200% 100%;
    box-shadow: 
      0 0 10px #00f0ff,
      0 0 20px rgba(0, 240, 255, 0.6),
      inset 0 0 4px #fff;
    position: relative;
    transition: width 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
    animation: energy-flow 3s linear infinite;
    mix-blend-mode: screen;
  }
  
  @keyframes energy-flow {
    0% { background-position: 200% 0; }
    100% { background-position: 0% 0; }
  }
  
  .exp-fill::after {
    content: '';
    position: absolute;
    right: 0;
    top: -2px;
    width: 6px;
    height: 6px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 5px #fff;
  }

  .exp-text {
    position: absolute;
    right: 0;
    top: -14px;
    font-size: 0.6rem;
    color: #00f0ff;
    font-family: 'Consolas', monospace;
  }

  /* Module Rack */
  .quick-slots {
    display: flex;
    gap: 2px;
    background: rgba(10, 15, 20, 0.9);
    padding: 6px;
    border: 1px solid #333;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    position: relative;
  }
  
  .quick-slots::before {
    content: 'MODULES';
    position: absolute;
    top: -14px;
    left: 0;
    font-size: 0.6rem;
    color: #555;
    font-family: 'Consolas', monospace;
  }

  .slot-btn {
    width: 40px;
    height: 40px;
    background: #0d1117;
    border: 1px solid #2a2a2a;
    position: relative;
    cursor: pointer;
    transition: all 0.1s;
  }
  
  /* Corner accents */
  .slot-btn::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 4px; height: 4px;
    border-top: 1px solid #555;
    border-right: 1px solid #555;
  }
  
  .slot-btn::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 4px; height: 4px;
    border-bottom: 1px solid #555;
    border-left: 1px solid #555;
  }

  .slot-btn:hover {
    border-color: #00f0ff;
    box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1);
  }
  
  .slot-btn:hover::after,
  .slot-btn:hover::before {
    border-color: #00f0ff;
  }

  .key-hint {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 0.6rem;
    color: #444;
    font-family: 'Consolas', monospace;
  }

  .slot-icon {
    width: 100%;
    height: 100%;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #333;
  }

  /* Right Action Panel */
  .action-panel {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    margin-bottom: 12px;
    margin-right: 16px;
    pointer-events: auto;
  }

  /* Weapon Hardpoint Button */
  .main-action-btn {
    width: 64px;
    height: 64px;
    background: #0d1117;
    border: 1px solid #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    transition: all 0.1s;
  }
  
  .main-action-btn::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px dashed #ff3333;
    opacity: 0.5;
  }

  .main-action-btn:hover {
    border-color: #ff3333;
    box-shadow: 0 0 15px rgba(255, 50, 50, 0.2);
  }
  
  .main-action-btn:active {
    background: #1a0505;
    transform: translateY(1px);
  }

  .main-action-btn .action-icon {
    font-size: 1.5rem;
    color: #ff3333;
    text-shadow: 0 0 8px rgba(255, 50, 50, 0.5);
  }

  .sub-action-btn {
    width: 40px;
    height: 40px;
    background: #0d1117;
    border: 1px solid #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }

  .sub-action-btn:hover {
    border-color: #00f0ff;
    color: #00f0ff;
  }

  .sub-action-btn .action-icon {
    font-size: 1rem;
    color: #555;
    transition: all 0.1s;
  }
  
  .sub-action-btn:hover .action-icon {
    color: #00f0ff;
    text-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
  }
</style>
