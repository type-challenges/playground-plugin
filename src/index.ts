import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import type { Sandbox } from './vendor/sandbox'
import { VirtualTypeScriptEnvironment } from './vendor/typescript-vfs'
import { log } from './logger'
import App from './components/App.svelte'

async function prepareTSVfs(sandbox: Sandbox) {
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
  return createVirtualTypeScriptEnvironment(
    system,
    [sandbox.filepath],
    ts,
    compilerOpts
  )
}

const makePlugin = (utils: PluginUtils) => {
  let vfs: VirtualTypeScriptEnvironment

  const customPlugin: PlaygroundPlugin = {
    id: 'type-challenges',
    displayName: 'Type Challenges',
    didMount: async (sandbox, container) => {
      log('DidMount type-challenges plugin')
      const ds = utils.createDesignSystem(container)
      container.id = 'type-challenges'

      vfs = await prepareTSVfs(sandbox)

      const tabBar = ds.createTabBar()
      new App({ target: container, props: { tabBar, sandbox, vfs } })
    },

    modelChangedDebounce: (sandbox) => {
      log('modelChangedDebounce in type-challenges')

      vfs.updateFile(sandbox.filepath, sandbox.getText())
      window.dispatchEvent(new CustomEvent('codeChanged'))
    },

    didUnmount: () => {
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
