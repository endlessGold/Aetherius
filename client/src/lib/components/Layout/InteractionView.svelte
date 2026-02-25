<script lang="ts">
  import { currentNode, gameState } from "../../store.svelte";
  import { onMount } from "svelte";

  // Mock data for interaction (unchanged for now, but styled differently)
  let npcs = $state([
    { id: "npc1", name: "Mysterious Merchant", type: "merchant" },
    { id: "npc2", name: "Guard Captain", type: "quest_giver" },
  ]);

  let objects = $state([
    { id: "obj1", name: "Old Crate", type: "container" },
    { id: "obj2", name: "Notice Board", type: "sign" },
  ]);

  function handleInteract(target: any) {
    gameState.addLog(`[System] Targeting ${target.name}...`);
    // TODO: Implement interaction logic
  }

  function handleMove(targetId: string, locked: boolean) {
    if (locked) {
      gameState.addLog(`[System] Route locked. Access denied.`);
      return;
    }
    gameState.addLog(`[System] Travelling to ${targetId}...`);
    currentNode.moveTo(targetId);
  }

  function getNodePosition(index: number, total: number) {
    // Distribute in an arc/perspective layout
    if (total === 1) return { x: 50, y: 50 };

    // Spread horizontally
    const x = 15 + (70 * index) / (total - 1);

    // Arc effect: center items higher (closer to horizon), edges lower
    const centerDist = Math.abs((index / (total - 1)) * 2 - 1);
    const y = 30 + centerDist * 20; // 30% at center, 50% at edges

    return { x, y };
  }
</script>

<div class="interaction-view">
  <!-- Background Scene -->
  <div
    class="background-layer {gameState.isMoving ? 'moving' : ''}"
    style="background-image: url({currentNode.image ||
      '/assets/placeholder_bg.jpg'})"
  >
    <div class="vignette"></div>
  </div>

  <!-- HUD Navigation Overlay -->
  <div class="nav-layer">
    <div class="scene-markers">
      {#if !gameState.isMoving}
        <!-- Tactical Connection Lines (Complex Node Tree Viz) -->
        <svg class="connection-lines">
          <defs>
            <linearGradient
              id="line-gradient"
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stop-color="rgba(0, 240, 255, 0)" />
              <stop offset="100%" stop-color="rgba(0, 240, 255, 0.3)" />
            </linearGradient>
          </defs>
          {#each currentNode.connections as conn, i}
            {@const pos = getNodePosition(i, currentNode.connections.length)}
            <line
              x1="50%"
              y1="120%"
              x2="{pos.x}%"
              y2="{pos.y}%"
              stroke="url(#line-gradient)"
              stroke-width="1"
              stroke-dasharray="4 2"
            />
            <circle
              cx="{pos.x}%"
              cy="{pos.y}%"
              r="2"
              fill="#00f0ff"
              opacity="0.6"
            />
          {/each}
        </svg>

        {#each currentNode.connections as conn, i}
          {@const pos = getNodePosition(i, currentNode.connections.length)}
          <button
            class="travel-marker {conn.isLocked ? 'locked' : ''}"
            style="left: {pos.x}%; top: {pos.y}%;"
            onclick={() => handleMove(conn.targetNodeId, !!conn.isLocked)}
          >
            <div class="marker-icon">
              {#if conn.isLocked}
                <!-- Sci-Fi Lock Icon -->
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                  />
                  <path
                    fill="currentColor"
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"
                  />
                </svg>
              {:else}
                <!-- Sci-Fi Diamond Target Icon -->
                <svg viewBox="0 0 40 40" width="100%" height="100%">
                  <!-- Outer Brackets -->
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    d="M10 8 L4 8 L4 14 M30 8 L36 8 L36 14 M10 32 L4 32 L4 26 M30 32 L36 32 L36 26"
                  />
                  <!-- Center Diamond -->
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    d="M20 12 L28 20 L20 28 L12 20 Z"
                  />
                  <!-- Inner Dot -->
                  <circle cx="20" cy="20" r="3" fill="currentColor" />
                </svg>
              {/if}
            </div>
            <div class="marker-label">
              {conn.label}
            </div>
          </button>
        {/each}
      {/if}

      {#if gameState.isMoving}
        <div class="travel-status">TRAVELLING...</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .interaction-view {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: "Consolas", "Monaco", monospace;
    color: #f0f0f0;
  }

  .background-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition:
      transform 10s ease-in-out,
      filter 0.5s;
    z-index: 0;
  }

  .background-layer.moving {
    filter: blur(2px) brightness(1.2);
    transform: scale(1.1);
  }

  /* Tactical Overlay Grid */
  .vignette {
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(10, 20, 30, 0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba(10, 20, 30, 0.2) 1px, transparent 1px);
    background-size: 40px 40px;
    box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.8);
    pointer-events: none;
  }

  .nav-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }

  .scene-markers {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 50%;
    pointer-events: none;
  }

  .connection-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  .travel-marker {
    position: absolute;
    /* top and left set inline */
    transform: translate(-50%, -50%);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 10;
    pointer-events: auto;
    transition: z-index 0s linear 0.2s;

    /* Reset Button Styles */
    background: transparent;
    border: none;
    padding: 0;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .travel-marker:hover {
    z-index: 20;
    transition-delay: 0s;
  }

  /* Tactical Bracket Icon */
  .marker-icon {
    width: 48px;
    height: 48px;
    /* Remove border/bg to use SVG visuals */
    background: rgba(10, 15, 20, 0.7);
    border: 1px solid rgba(0, 240, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: #00f0ff;
    position: relative;
    transition: all 0.2s;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }

  /* Remove CSS brackets, using SVG now */
  .marker-icon::before,
  .marker-icon::after {
    display: none;
  }

  .travel-marker:hover .marker-icon {
    background: rgba(0, 240, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
    border-color: #00f0ff;
    transform: scale(1.1);
  }

  .marker-label {
    background: rgba(5, 10, 15, 0.9);
    padding: 4px 10px;
    border: 1px solid #333;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #888;
    position: relative;
    transition: all 0.2s;
    min-width: 80px;
    text-align: center;
  }

  /* Distance indicator mock */
  .marker-label::after {
    content: " [12 KM]";
    color: #555;
    font-size: 0.6rem;
  }

  .travel-marker:hover .marker-label {
    color: #fff;
    border-color: #00f0ff;
    background: rgba(10, 20, 30, 0.9);
  }

  .travel-marker:hover .marker-label::after {
    color: #00f0ff;
  }

  /* Warp Drive Status */
  .travel-status {
    position: absolute;
    top: 60%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #00f0ff;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.8);
    animation: pulse 1s infinite alternate;
  }

  .travel-status::before {
    content: "WARP DRIVE ACTIVE";
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: #fff;
    letter-spacing: 2px;
    opacity: 0.7;
  }

  @keyframes pulse {
    from {
      opacity: 0.6;
      text-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
    }
    to {
      opacity: 1;
      text-shadow: 0 0 20px rgba(0, 240, 255, 1);
    }
  }
</style>
