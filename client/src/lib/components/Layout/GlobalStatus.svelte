<script lang="ts">
  import { gameState } from "../../store.svelte";

  // Derived percentages for bars
  let hpPercent = $derived((gameState.hp / gameState.maxHp) * 100);
  let mpPercent = $derived((gameState.mp / gameState.maxMp) * 100);
</script>

<header class="hud-global-status">
  <!-- Left: Character Status (HP/MP/Level) -->
  <div class="status-container">
    <div class="level-badge">{gameState.level}</div>
    <div class="bars-container">
      <div class="bar-row">
        <div class="bar-fill hp" style="width: {hpPercent}%"></div>
        <span class="bar-text">{gameState.hp} / {gameState.maxHp}</span>
      </div>
      <div class="bar-row">
        <div class="bar-fill mp" style="width: {mpPercent}%"></div>
        <span class="bar-text">{gameState.mp} / {gameState.maxMp}</span>
      </div>
    </div>
    <div class="buff-row">
      <!-- Sci-Fi Buff Icons -->
      <div class="buff-icon" title="Shields Online">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 15c-2.5 0-4.5-2-4.5-4.5S9.5 8 12 8s4.5 2 4.5 4.5S14.5 17 12 17z"/>
          <path fill="currentColor" d="M12 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" opacity="0.5"/>
        </svg>
      </div>
      <div class="buff-icon" title="Weapon Systems">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- Right: Minimap & Menu -->
  <div class="menu-container">
    <div class="minimap-frame">
      <span class="location-name">{gameState.location}</span>
    </div>
    <div class="menu-buttons">
      <button class="menu-btn" title="Inventory">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/>
        </svg>
      </button>
      <button class="menu-btn" title="Logs">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      </button>
      <button class="menu-btn" title="Systems">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>
  </div>
</header>

<style>
  .hud-global-status {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    pointer-events: none;
    box-sizing: border-box;
    color: #f0f0f0;
  }

  /* Character Status - EVE Online Style */
  .status-container {
    display: flex;
    gap: 12px;
    pointer-events: auto;
    background: rgba(15, 20, 25, 0.9);
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top: 2px solid rgba(0, 200, 255, 0.5); /* Cyan accent top */
    align-items: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    position: relative;
    backdrop-filter: blur(4px);
  }

  /* Tech Grid Background */
  .status-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 10px 10px;
    pointer-events: none;
    z-index: 0;
  }

  .level-badge {
    position: relative;
    width: 32px;
    height: 32px;
    background: #0d1117;
    border: 1px solid #30363d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-family: 'Consolas', 'Monaco', monospace; /* Tech font */
    font-weight: 700;
    color: #00f0ff; /* Cyan text */
    box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1);
    z-index: 1;
  }
  
  /* Corner bracket for level */
  .level-badge::after {
    content: '';
    position: absolute;
    top: -2px; left: -2px;
    width: 6px; height: 6px;
    border-top: 2px solid #00f0ff;
    border-left: 2px solid #00f0ff;
  }

  .bars-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    width: 200px;
    z-index: 1;
  }

  .bar-row {
    position: relative;
    height: 12px;
    background-color: rgba(10, 15, 20, 0.8);
    border: 1px solid #333;
    overflow: hidden;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
  }

  .bar-fill {
    height: 100%;
    position: relative;
    transition: width 0.2s steps(10); /* Stepped transition for digital feel */
  }

  /* Energy Beam Style HP - Plasma Red */
  .bar-fill.hp {
    background: linear-gradient(90deg, #880000, #ff0000, #ffaaaa, #ff0000, #880000);
    background-size: 200% 100%;
    box-shadow: 
      0 0 10px #ff0000,
      0 0 20px rgba(255, 0, 0, 0.6),
      inset 0 0 5px rgba(255, 255, 255, 0.8);
    animation: energy-flow 1.5s linear infinite;
    filter: contrast(1.2) brightness(1.2);
    mix-blend-mode: screen;
  }

  /* Energy Beam Style MP - Plasma Blue */
  .bar-fill.mp {
    background: linear-gradient(90deg, #0088aa, #00ccff, #ccffff, #00ccff, #0088aa);
    background-size: 200% 100%;
    box-shadow: 
      0 0 10px #00ccff,
      0 0 20px rgba(0, 204, 255, 0.6),
      inset 0 0 5px rgba(255, 255, 255, 0.8);
    animation: energy-flow 1.5s linear infinite;
    filter: contrast(1.2) brightness(1.2);
    mix-blend-mode: screen;
  }

  @keyframes energy-flow {
    0% { background-position: 200% 0; }
    100% { background-position: 0% 0; }
  }

  .bar-text {
    position: absolute;
    top: -2px;
    right: 2px;
    font-size: 0.65rem;
    font-family: 'Consolas', 'Monaco', monospace;
    color: rgba(255, 255, 255, 0.7);
    z-index: 2;
    text-shadow: 1px 1px 0 #000;
    mix-blend-mode: difference;
  }

  .buff-row {
    display: flex;
    gap: 4px;
    align-items: center;
    z-index: 1;
  }

  .buff-icon {
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #444;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #888;
  }
  
  .buff-icon:hover {
    border-color: #00f0ff;
    color: #fff;
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
  }

  /* Right Menu - Radar Style */
  .menu-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: auto;
  }

  .minimap-frame {
    width: 160px;
    height: 160px;
    background: rgba(10, 15, 20, 0.85);
    border: 1px solid #333;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 50, 100, 0.2);
    backdrop-filter: blur(4px);
  }
  
  /* Radar rings */
  .minimap-frame::after {
    content: '';
    position: absolute;
    inset: 10%;
    border: 1px dashed rgba(0, 240, 255, 0.2);
    border-radius: 50%;
  }

  .minimap-frame::before {
    content: 'TACTICAL';
    color: rgba(0, 240, 255, 0.4);
    font-size: 0.6rem;
    font-family: 'Consolas', monospace;
    letter-spacing: 1px;
    position: absolute;
    top: 20px;
  }

  .location-name {
    position: absolute;
    bottom: 25px;
    font-size: 0.7rem;
    color: #fff;
    font-family: 'Consolas', monospace;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 6px;
    border: 1px solid #00f0ff;
  }

  .menu-buttons {
    display: flex;
    gap: 4px;
    background: rgba(0, 0, 0, 0.5);
    padding: 2px;
    border: 1px solid #333;
  }

  .menu-btn {
    width: 32px;
    height: 32px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #888;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.1s;
  }

  .menu-btn:hover {
    background: #2a2a2a;
    border-color: #00f0ff;
    color: #00f0ff;
  }

  .menu-btn:active {
    background: #00f0ff;
    color: #000;
  }
</style>
