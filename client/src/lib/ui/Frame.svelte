<script lang="ts">
  interface Props {
    children?: any;
    height?: string;
  }
  let { children, height = "55%" }: Props = $props();
</script>

<div class="visual-frame" style:height>
  <div class="frame-content">
    {#if children}
      {@render children()}
    {/if}
  </div>

  <!-- Scanlines Effect -->
  <div class="scanlines"></div>
</div>

<style>
  .visual-frame {
    min-height: 350px;
    position: relative;
    background-color: #000;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .frame-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, #1a242f 0%, #050708 100%);
    position: relative;
    z-index: 2;
  }

  .frame-content::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        rgba(18, 16, 16, 0) 50%,
        rgba(0, 0, 0, 0.25) 50%
      ),
      linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.06),
        rgba(0, 255, 0, 0.02),
        rgba(0, 0, 255, 0.06)
      );
    background-size:
      100% 2px,
      3px 100%;
    pointer-events: none;
    z-index: 1;
  }

  .scanlines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(0, 0, 0, 0.5) 51%
    );
    background-size: 100% 4px;
    animation: scanline 10s linear infinite;
    opacity: 0.1;
    pointer-events: none;
    z-index: 5;
  }

  @keyframes scanline {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 100%;
    }
  }

  @media (max-width: 767px) {
    .visual-frame {
      height: 250px !important;
    }
  }
</style>
