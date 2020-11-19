<script lang="ts">
  import Challenge from './Challenge.svelte'
  import Types from './Types.svelte'
  import type { Context } from '../types'

  export let context: Context

  let active = 'challenge'
  let tabs: { name: string; text: string }[] = [
    { name: 'challenge', text: 'Challenge' },
    { name: 'types', text: 'Types' },
  ]
</script>

<style>
  .hide {
    display: none;
  }
</style>

<section>
  {#each tabs as { name, text } (name)}
    <button
      role="tab"
      class:active={active === name}
      on:click={() => (active = name)}>
      {text}
    </button>
  {/each}
</section>

<!-- We don't use `if` directive here because of keeping components alive. -->
<div class:hide={active !== 'challenge'}>
  <Challenge {context} />
</div>
<div class:hide={active !== 'types'}>
  <Types {context} />
</div>
