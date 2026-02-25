<script lang="ts">
  export interface Props {
    text: string;
    speed?: number;
    onComplete?: () => void;
  }
  let { text, speed = 30, onComplete }: Props = $props();

  let displayedText = $state("");
  let currentIndex = 0;
  let intervalId: any;

  $effect(() => {
    // 텍스트가 변경되면 초기화 및 시작
    displayedText = "";
    currentIndex = 0;
    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        displayedText += text[currentIndex];
        currentIndex++;
      } else {
        clearInterval(intervalId);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });
</script>

<div class="typewriter">
  {displayedText}<span class="cursor">_</span>
</div>

<style>
  .typewriter {
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .cursor {
    display: inline-block;
    width: 0.6em;
    background-color: var(--pico-primary);
    animation: blink 1s step-end infinite;
    margin-left: 2px;
    vertical-align: text-bottom;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
