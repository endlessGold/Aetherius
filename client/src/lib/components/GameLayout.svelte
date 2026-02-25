<script lang="ts">
  import GlobalStatus from "./Layout/GlobalStatus.svelte";
  import QuestTracker from "./Layout/QuestTracker.svelte";
  import InteractionView from "./Layout/InteractionView.svelte";
  import ActionFooter from "./Layout/ActionFooter.svelte";

  let isLeftHudOpen = $state(true);
</script>

<div class="hud-container">
  <!-- Layer 0: World Viewport (Background) -->
  <div class="world-viewport">
    <InteractionView />
  </div>

  <!-- Layer 1: HUD Overlay -->
  <div class="hud-overlay">
    <!-- Top Bar -->
    <div class="hud-top">
      <GlobalStatus />
    </div>

    <!-- Main Content Area (Left/Right panels) -->
    <div class="hud-mid-section">
      <div class="hud-left-container">
        <div class="hud-left" class:closed={!isLeftHudOpen}>
          <QuestTracker />
        </div>
        <button
          class="hud-toggle-btn"
          onclick={() => (isLeftHudOpen = !isLeftHudOpen)}
          aria-label="Toggle Quest Tracker"
        >
          <span class="toggle-icon">{isLeftHudOpen ? "◀" : "▶"}</span>
        </button>
      </div>

      <!-- Right side reserved for future use -->
      <div class="hud-right"></div>
    </div>

    <!-- Bottom Dashboard -->
    <div class="hud-bottom">
      <ActionFooter />
    </div>
  </div>

  <!-- Layer 2: Visual Effects -->
  <div class="visual-effects">
    <div class="vignette"></div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  .hud-container {
    position: relative;
    width: 100vw;
    height: 100dvh; /* Dynamic viewport height to prevent mobile/tablet cutoffs */
    background: #000;
    overflow: hidden;
  }

  /* Layer 0: World Viewport */
  .world-viewport {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  /* Layer 1: HUD Overlay */
  .hud-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none; /* Allow clicks to pass through empty areas to the world */
    padding: 0; /* Removed padding for compact full-screen usage */
    box-sizing: border-box;
  }

  /* HUD Sections */
  .hud-top {
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: auto;
    flex-shrink: 0;
  }

  .hud-mid-section {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0; /* Reduced vertical padding */
    overflow: hidden;
    min-height: 0; /* Important for flex child scrolling */
  }

  .hud-left {
    width: 300px;
    pointer-events: auto;
    max-height: 100%;
    overflow-y: auto;
    scrollbar-width: none; /* Hide scrollbar for cleaner look */
    mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
  }

  .hud-left::-webkit-scrollbar {
    display: none;
  }

  .hud-toggle-btn {
    background: rgba(0, 15, 30, 0.85);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-left: none;
    color: #0ff;
    width: 20px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.3s ease;
    clip-path: polygon(0 0, 100% 10%, 100% 90%, 0 100%);
    margin-top: 20px;
  }

  .hud-toggle-btn:hover {
    background: rgba(0, 255, 255, 0.2);
    width: 25px;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }

  .toggle-icon {
    font-size: 0.8rem;
    font-weight: bold;
  }

  .hud-bottom {
    width: 100%;
    pointer-events: auto;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
  }

  /* Layer 2: Visual Effects */
  .visual-effects {
    position: absolute;
    inset: 0;
    z-index: 5; /* Below HUD (z-index 10) but above world (z-index 0) */
    pointer-events: none;
  }

  .vignette {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle,
      transparent 60%,
      rgba(0, 0, 0, 0.6) 100%
    );
    pointer-events: none;
  }
</style>
