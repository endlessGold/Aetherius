<script lang="ts">
  import { gameState, currentNode } from '../../store.svelte';
  import StatRow from '../../ui/StatRow.svelte';
</script>

<div class="location-header">
  <div class="main-info">
    <h2 class="location-name">{currentNode.name}</h2>
    <span class="location-type {currentNode.type}">{currentNode.type} ZONE</span>
  </div>
  
  <div class="sub-info">
    <StatRow label="TIME" value={gameState.time} icon="🕒" />
    <StatRow label="COORDS" value="Unknown" icon="📍" />
  </div>
</div>

<style>
  .location-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(0,0,0,0.3);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .location-name {
    margin: 0;
    font-size: 1.5rem;
    color: #fff;
    font-weight: 300;
    letter-spacing: 0.05em;
  }

  .location-type {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    border-radius: 2px;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.1em;
  }

  .location-type.safe { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
  .location-type.danger { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
  .location-type.neutral { background: rgba(255, 255, 255, 0.1); color: #ccc; }

  .sub-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
