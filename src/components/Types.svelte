<script lang="ts">
  import type ts from 'typescript'
  import type { Sandbox } from '../vendor/sandbox'
  import type { VirtualTypeScriptEnvironment } from '../vendor/typescript-vfs'
  import { onMount, onDestroy } from 'svelte'
  import { log } from '../logger'

  export let sandbox: Sandbox

  export let vfs: VirtualTypeScriptEnvironment
  let blocks: string[] = []

  function getTypesBlocks() {
    if (!vfs) {
      return []
    }

    const startTime = window.performance.now()
    const ts = sandbox.ts
    const { languageService, updateFile } = vfs

    updateFile(sandbox.filepath, sandbox.getText())
    const sourceFile = vfs.getSourceFile(sandbox.filepath)
    if (!sourceFile) {
      throw new Error('No SourceFile in language service.')
    }

    const blocks = sourceFile.statements
      .filter((stmt): stmt is ts.TypeAliasDeclaration => {
        if (ts.isTypeAliasDeclaration(stmt)) {
          const leadingComments =
            ts.getLeadingCommentRanges(sourceFile.getFullText(), stmt.pos) || []
          return leadingComments.some((comment) =>
            sourceFile
              .getFullText()
              .slice(comment.pos, comment.end)
              .includes('@show-types')
          )
        }
        return false
      })
      .map((typeAlias) => {
        return ts.displayPartsToString(
          languageService.getQuickInfoAtPosition(
            sandbox.filepath,
            typeAlias.name.pos + 1
          )?.displayParts
        )
      })

    log(`getShowTypesInCode - ${window.performance.now() - startTime}ms`)
    return blocks
  }

  async function renderTypeBlocks() {
    blocks = await Promise.all(
      getTypesBlocks().map((code) =>
        sandbox.monaco.editor.colorize(code, 'typescript', {})
      )
    )
  }

  onMount(async () => {
    window.addEventListener('codeChanged', renderTypeBlocks)
  })

  onDestroy(() => {
    window.removeEventListener('codeChanged', renderTypeBlocks)
  })
</script>

<style>
  :global(#type-challenges) pre {
    margin-bottom: 1em;
  }
</style>

<p>Add <code>// @show-types</code> above your type to be displayed.</p>
<div>
  {#each blocks as block}
    <pre><code>{@html block}</code></pre>
  {/each}
</div>
