<script lang="ts">
  import { currentScene } from '../store.svelte';
  import Card from '../ui/Card.svelte';
  import Typewriter from '../ui/Typewriter.svelte';
</script>

<div class="narrative-area">
  <article class="narrative-card">
    <h2>{currentScene.title}</h2>
    <div class="divider"></div>
    <div class="description-wrapper">
      <Typewriter text={currentScene.description} speed={20} />
    </div>
  </article>
</div>

<style>
  .narrative-area {
    flex: 1;
    padding: 3rem 4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(to bottom, #0f1318, #0b0f13);
    overflow-y: auto;
  }

  .narrative-card {
    max-width: 900px; /* Constrain reading width */
    margin: 0 auto;
    width: 100%;
  }

  .narrative-card h2 {
    color: var(--pico-primary);
    margin-bottom: 0.5rem;
    font-size: 2.2rem;
    font-weight: 300;
    letter-spacing: -0.02em;
  }

  .divider {
    width: 60px;
    height: 3px;
    background: var(--pico-primary);
    margin-bottom: 2rem;
  }

  .description-wrapper {
    font-size: 1.2rem;
    line-height: 1.8;
    color: #e0e0e0;
    font-weight: 300;
    min-height: 100px;
  }
</style>
