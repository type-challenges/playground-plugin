<script lang="ts">
  import Challenge from './Challenge.svelte'
  import Types from './Types.svelte'
  import type { Context } from '../types'

  export let context: Context

  let active = 'challenge'
  let tabs: { name: string; text: string }[] = [
    { name: 'challenge', text: 'Description' },
    { name: 'comments', text: 'Comments' },
    { name: 'solutions', text: 'Solutions' },
    { name: 'types', text: 'Type Helper' },
  ]
</script>

<style>
  :global(#type-challenges) {
    margin: 0 -0.5rem;
    width: calc(100% + 1rem) !important;
    max-width: unset !important;
  }
  :global(#type-challenges pre) {
    margin-bottom: 1em;
  }

  .hide {
    display: none;
  }

  :root {
    --border-color: rgba(125, 125, 125, 0.4);;
  }

  nav {
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  nav button {
    background: transparent;
    outline: none;
    border: none;
    color: inherit;
    padding: 10px 5px 12px 5px;
    font-size: 14px;
    width: 120px;
    border-right: 1px solid var(--border-color);
  }

  nav button.active {
    background: rgba(125, 125, 125, 0.1);
    font-weight: bold;
  }

  .panel {
    padding: 0 1rem;
    position: relative;
  }
</style>

<nav>
  {#each tabs as { name, text } (name)}
    <button
      role="tab"
      class:active={active === name}
      on:click={() => (active = name)}>
      {text}
    </button>
  {/each}
</nav>

<div class="panel">
  <!-- We don't use `if` directive here because of keeping components alive. -->
  <div class:hide={active !== 'challenge'}>
    <Challenge {context} />
  </div>
  <div class:hide={active !== 'types'}>
    <Types {context} />
  </div>
</div>
