<script lang="ts">
  import { gameState } from '../../store.svelte';
</script>

<aside class="quest-tracker">
  <div class="section-header">
    <h3 class="title">Quests</h3>
  </div>

  <div class="quest-list">
    {#each gameState.quests as quest}
      <div class="quest-item {quest.status}">
        <div class="quest-title">{quest.title}</div>
        <p class="quest-desc">{quest.description}</p>
        <ul class="objectives">
          {#each quest.objectives as objective}
            <li class={objective.completed ? 'completed' : ''}>
              <span class="bullet">-</span>
              {objective.text}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>

  {#if gameState.party.length > 0}
    <div class="section-header party-header">
      <h3 class="title">Party</h3>
    </div>
    
    <div class="party-list">
      {#each gameState.party as member}
        <div class="party-member">
          <div class="member-info">
            <span class="name">{member.name}</span>
            <span class="hp-text">{member.hp}/{member.maxHp}</span>
          </div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill" style="width: {(member.hp / member.maxHp) * 100}%"></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</aside>

<style>
  /* Quest Tracker Container - EVE Style */
  .quest-tracker {
    width: 260px;
    padding: 12px;
    background: rgba(10, 15, 20, 0.85);
    border: 1px solid #333;
    border-top: 2px solid rgba(255, 165, 0, 0.5); /* Orange accent top */
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    pointer-events: auto;
    position: relative;
    font-family: 'Consolas', 'Monaco', monospace;
    box-shadow: -4px 4px 20px rgba(0,0,0,0.5);
  }

  /* Tech background grid */
  .quest-tracker::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 100% 20px;
    pointer-events: none;
    z-index: 0;
  }

  /* Section Headers */
  h3 {
    margin: 0;
    font-size: 0.7rem;
    color: #00f0ff;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }
  
  h3::after {
    content: '///';
    color: #333;
    letter-spacing: -1px;
  }

  /* Quest List */
  .quest-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  .quest-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 8px;
    border-left: 1px solid #333;
  }

  .quest-title {
    font-size: 0.8rem;
    color: #fff;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .quest-desc {
    font-size: 0.7rem;
    color: #888;
    line-height: 1.3;
    margin-bottom: 4px;
  }

  .objectives {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .objectives li {
    font-size: 0.7rem;
    color: #aaa;
    position: relative;
    padding-left: 14px;
    margin-bottom: 2px;
  }

  .objectives li::before {
    content: '[ ]';
    position: absolute;
    left: 0;
    color: #555;
    font-size: 0.65rem;
  }
  
  .objectives li.completed::before {
    content: '[x]';
    color: #00f0ff;
  }

  .objectives li.completed {
    color: #555;
    text-decoration: line-through;
  }

  .bullet {
    display: none;
  }

  /* Party List */
  .party-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 1;
  }

  .party-member {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #333;
    transition: all 0.2s;
  }

  .party-member:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #00f0ff;
  }

  .member-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .name {
    font-size: 0.75rem;
    color: #ddd;
    font-weight: 600;
    text-transform: uppercase;
  }

  .hp-text {
    font-size: 0.65rem;
    color: #00f0ff;
  }

  .hp-bar-bg {
    width: 100%;
    height: 6px;
    background-color: #0a0a0a;
    background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
    background-size: 4px 100%;
    overflow: hidden;
    border: 1px solid #333;
  }

  .hp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0088aa, #00f0ff, #ffffff, #00f0ff, #0088aa);
    background-size: 200% 100%;
    box-shadow: 
      0 0 8px #00f0ff,
      inset 0 0 2px #fff;
    transition: width 0.3s ease-out;
    animation: energy-flow 2s linear infinite;
    mix-blend-mode: screen;
  }

  @keyframes energy-flow {
    0% { background-position: 200% 0; }
    100% { background-position: 0% 0; }
  }
</style>
