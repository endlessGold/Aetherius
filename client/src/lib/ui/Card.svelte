<script lang="ts">
  interface Props {
    title: string;
    description: string;
  }
  let { title, description }: Props = $props();
</script>

<article class="narrative-card">
  <h2>{title}</h2>
  <div class="divider"></div>
  <p class="description">{description}</p>
</article>

<style>
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

  .description {
    font-size: 1.2rem;
    line-height: 1.8;
    color: #e0e0e0;
    font-weight: 300;
  }
</style>
