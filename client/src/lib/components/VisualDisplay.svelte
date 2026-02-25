<script lang="ts">
  import { currentNode } from "../store.svelte";
  import Frame from "../ui/Frame.svelte";
  import LocationHeader from "./Navigation/LocationHeader.svelte";
</script>

<Frame>
  <div class="header-overlay">
    <LocationHeader />
  </div>

  <div class="visual-content">
    <p class="visual-placeholder-text">VISUAL FEED: {currentNode.id}</p>
  </div>
</Frame>

<style>
  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }

  .visual-content {
    text-align: center;
    color: rgba(255, 255, 255, 0.3);
    font-family: monospace;
  }
</style>
