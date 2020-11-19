<script lang="ts">
  import type { Sandbox } from '../vendor/sandbox'
  import { onMount } from 'svelte'
  import type { VirtualTypeScriptEnvironment } from '../vendor/typescript-vfs'
  import Challenge from './Challenge.svelte'
  import Types from './Types.svelte'

  export let tabBar: HTMLDivElement
  export let sandbox: Sandbox
  let vfs: VirtualTypeScriptEnvironment

  let active = 'challenge'
  let tabs: { name: string; text: string }[] = [
    { name: 'challenge', text: 'Challenge' },
    { name: 'types', text: 'Types' },
  ]

  let tabsRef: HTMLElement

  onMount(async () => {
    Array.from(tabsRef.children).forEach((tab) => tabBar.appendChild(tab))
    vfs = await prepareTSVfs()
    window.dispatchEvent(new CustomEvent('codeChanged'))
  })

  async function prepareTSVfs() {
    const compilerOpts = sandbox.getCompilerOptions()
    const ts = sandbox.ts
    const {
      createSystem,
      createDefaultMapFromCDN,
      createVirtualTypeScriptEnvironment,
    } = sandbox.tsvfs
    const fsMap = await createDefaultMapFromCDN(
      { target: compilerOpts.target },
      ts.version,
      false,
      ts
    )
    const system = createSystem(fsMap)
    fsMap.set(sandbox.filepath, sandbox.getText())
    vfs = createVirtualTypeScriptEnvironment(
      system,
      [sandbox.filepath],
      ts,
      compilerOpts
    )

    return vfs
  }
</script>

<style>
  section,
  .hide {
    display: none;
  }
</style>

<section bind:this={tabsRef}>
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
  <Challenge {sandbox} />
</div>
<div class:hide={active !== 'types'}>
  <Types {sandbox} {vfs} />
</div>
