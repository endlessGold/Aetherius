<script lang="ts">
  import { gameState } from './lib/store.svelte';
  import TitleScreen from './lib/components/TitleScreen.svelte';
  import GameLayout from './lib/components/GameLayout.svelte';
</script>

{#if gameState.status === 'title'}
  <TitleScreen />
{:else if gameState.status === 'playing'}
  <GameLayout />
{/if}
