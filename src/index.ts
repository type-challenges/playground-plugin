import type ts from 'typescript'
import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import type { Sandbox } from './vendor/sandbox'
import type { VirtualTypeScriptEnvironment } from './vendor/typescript-vfs'
import Challenge from './components/Challenge.svelte'

const log = (...args: any) => console.log('%ctype-challenges =>', 'color: teal', ...args)

const tabsDefine = {
  challenge: 'Challenge',
  types: 'Types',
}

const makePlugin = (utils: PluginUtils) => {
  let tabBar: HTMLDivElement
  let tabs: Record<keyof typeof tabsDefine, { name: string; button: HTMLButtonElement; panel: HTMLDivElement }> = {} as any
  let activeTab: keyof typeof tabsDefine = 'challenge'

  let sandbox: Sandbox
  let vfs: VirtualTypeScriptEnvironment
  let ds: ReturnType<typeof utils.createDesignSystem>

  let typeBlocks: string[] = []

  async function updateShowTypes() {
    const blocks = await getTypesBlocks()
    typeBlocks = await Promise.all(blocks.map(async (code) => await sandbox.monaco.editor.colorize(code, 'typescript', {})))

    updateView()
  }

  async function updateView() {
    // types
    const ds = utils.createDesignSystem(tabs.types.panel)
    ds.clear()
    const note = ds.p('')
    note.innerHTML = 'Add <code>// @show-types</code> above your type to be displayed'
    typeBlocks.forEach(async (code: string) => {
      const el = ds.code('')
      el.innerHTML = code
      // @ts-expect-error
      el.parentElement.style = 'margin-bottom: 1em'
      return el
    })
  }

  async function prepareTSVfs() {
    if (vfs) return vfs
    const compilerOpts = sandbox.getCompilerOptions()
    const ts = sandbox.ts
    const { createSystem, createDefaultMapFromCDN, createVirtualTypeScriptEnvironment } = sandbox.tsvfs
    const fsMap = await createDefaultMapFromCDN({ target: compilerOpts.target }, ts.version, false, ts)
    const system = createSystem(fsMap)
    fsMap.set(sandbox.filepath, sandbox.getText())
    vfs = createVirtualTypeScriptEnvironment(system, [sandbox.filepath], ts, compilerOpts)

    return vfs
  }

  async function getTypesBlocks() {
    const startTime = window.performance.now()
    const ts = sandbox.ts
    const { languageService, updateFile } = await prepareTSVfs()
    updateFile(sandbox.filepath, sandbox.getText())
    const sourceFile = languageService.getProgram()?.getSourceFile(sandbox.filepath)
    if (!sourceFile) throw new Error('No SourceFile in language service.')
    const needShowTypes = sourceFile.statements.filter((stat) => {
      if (ts.isTypeAliasDeclaration(stat)) {
        const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), stat.pos) || []
        return leadingComments.some((comment) => {
          const text = sourceFile.getFullText().slice(comment.pos, comment.end)
          return text.includes('@show-types')
        })
      }
      return false
    }) as ts.TypeAliasDeclaration[]

    const blocks = needShowTypes.map((el) => {
      return ts.displayPartsToString(
        languageService.getQuickInfoAtPosition(sandbox.filepath, el.name.pos + 1)?.displayParts
      )
    })

    log(`getShowTypesInCode - ${window.performance.now() - startTime}ms`)
    return blocks
  }

  const customPlugin: PlaygroundPlugin = {
    id: 'type-challenges',
    displayName: 'Type Challenges',
    didMount: (_sandbox, container) => {
      log('DidMount type-challenges plugin')
      sandbox = _sandbox
      ds = utils.createDesignSystem(container)
      container.id = 'type-challenges'

      tabBar = ds.createTabBar()

      const panels = document.createElement('div')

      ;(Object.entries(tabsDefine) as [keyof typeof tabsDefine, string][]).map(([key, name]) => {
        const button = ds.createTabButton(name)
        const panel = document.createElement('div')

        button.onclick = () => {
          activeTab = key
          Object.values(tabs).forEach((i) => {
            if (i.button === button) {
              i.button.classList.add('active')
              panels.appendChild(i.panel)
            } else {
              i.button.classList.remove('active')
              panels.removeChild(i.panel)
            }
          })
        }
        tabBar.append(button)

        if (key === activeTab) {
          panels.append(panel)
          button.classList.add('active')
        }

        tabs[key] = {
          name,
          button,
          panel,
        }
      })
      container.appendChild(tabBar)
      container.appendChild(panels)

      new Challenge({ target: tabs.challenge.panel, props: { sandbox } })
    },

    modelChangedDebounce: async (_sandbox, model) => {
      log('modelChangedDebounce in type-challenges')
      sandbox = _sandbox
      updateShowTypes()
    },

    didUnmount: () => {
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
