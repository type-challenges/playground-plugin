<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { getTypesBlocks } from '../typeHelpers'
  import type { Context } from '../types'

  export let context: Context

  let blocks: string[] = []

  async function renderTypeBlocks() {
    blocks = await Promise.all(
      getTypesBlocks(context)
        .map((code) =>
          context.sandbox.monaco.editor.colorize(code, 'typescript', {})
        )
    )
  }

  onMount(async () => {
    window.addEventListener('codeChanged', renderTypeBlocks)
    await renderTypeBlocks()
  })

  onDestroy(() => {
    window.removeEventListener('codeChanged', renderTypeBlocks)
  })
</script>

<style>
</style>

<p>Add <code>// @show-types</code> above your type to be displayed.</p>
<div>
  {#each blocks as block}
    <pre><code>{@html block}</code></pre>
  {/each}
</div>
