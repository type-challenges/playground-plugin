<script lang="ts">
  import { onMount } from 'svelte'
  import { fetchQuestion } from '../fetch'
  import { Context } from '../types';

  export let context: Context

  let rendered: string | null = null

  onMount(async () => {
    rendered = await fetchQuestion(context)
  })
</script>

<style>
  div :global(code) {
    background: rgba(125, 125, 125, 0.2);
    padding: 2px 4px;
    border-radius: 4px;
  }

  div :global(blockquote) {
    margin: 0;
    padding: 0 5px;
    border-left: 2px solid;
  }

  .loading {
    display: grid;
    place-items: center;
    font-size: 15px;
  }
</style>

<div>
  {#if rendered === null}
    <div class="loading">
      <p>Loading question...</p>
    </div>
  {:else if rendered === ''}
    <p>No question found</p>
  {:else}
    {@html rendered}
  {/if}
</div>
