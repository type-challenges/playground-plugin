<script lang="ts">
  import { onMount } from 'svelte'
  import { fetchQuestion } from '../fetch'
  import type { Context } from '../types'
  import type { editor } from 'monaco-editor'

  export let context: Context

  let rendered: string | null = null
  let markersLoaded = false
  let markers: editor.IMarker[] = []

  onMount(async () => {
    rendered = await fetchQuestion(context)

    // set a delay for letting TypeScript does type-checking
    setTimeout(() => (markersLoaded = true), 3000)
  })

  context.sandbox.editor.onDidChangeModelDecorations(() => {
    markers = context.sandbox.monaco.editor
      .getModelMarkers({
        resource: context.sandbox.getModel().uri,
      })
      .filter(
        ({ severity }) =>
          severity === context.sandbox.monaco.MarkerSeverity.Error
      )
  })
</script>

<style>
  p > :global(code) {
    background: rgba(125, 125, 125, 0.2);
    padding: 2px 4px;
    border-radius: 4px;
  }

  :global(blockquote) {
    margin: 0;
    padding: 0;
    opacity: 0.8;
    font-style: italic;
  }

  .loading {
    display: grid;
    place-items: center;
    font-size: 15px;
  }

  .status {
    padding: 0.6rem 1rem;
    border: 1px solid #f5c6cb;
    border-radius: 0.25rem;
    color: #721c24;
    background-color: #f8d7da;
  }
  .status.passed {
    color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
  }

  .message:not(:last-child) {
    margin-bottom: 3px;
  }
  .message span {
    margin-left: 5px;
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

{#if markersLoaded}
  <div class="status" class:passed={markers.length === 0}>
    {#each markers as marker}
      <div class="message">
        ❌ Line{' '}
        {marker.startLineNumber}:
        <span>{marker.message}</span>
      </div>
    {:else}🎉 Yay! You have finished this challenge.{/each}
  </div>
{/if}
