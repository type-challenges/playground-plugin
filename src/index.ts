import type ts from 'typescript'
import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import type { Sandbox } from './vendor/sandbox'
import MarkdownIt from 'markdown-it'

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
  let program: ts.Program
  let typeChecker: ts.TypeChecker
  let ds: ReturnType<typeof utils.createDesignSystem>

  let typeBlocks: string[] = []
  let questionNo: number | null
  let questionLang: string = 'en'
  let questionReadMe: string = ''
  let questionReadMeRenedered: string = ''

  async function fetchQuestion() {
    if (questionNo) return

    const match = sandbox.getText().match(/\/\/tsch\.js\.org\/(\d+)(?:\/([\w-]+)|)/)
    if (match) {
      const [, no, lang] = match
      questionNo = +no
      questionLang = lang || 'en'

      questionReadMe = await fetch(`https://tsch.js.org/${questionNo}/raw`).then((r) => r.text())
      questionReadMeRenedered = await renderMarkdown(
        questionReadMe
          .replace(/<!--info-footer-start-->.*<!--info-footer-end-->/, '')
          .replace(/<h1>/, '<h2>')
          .replace(/<\/h1>/, '</h2>')
      )
      updateView()
    }
  }

  async function renderMarkdown(str: string) {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    })
    let rendered = md.render(str)

    const codeBlockRegex = /<code class="language-ts">([\s\S]*?)<\/code>/gm

    let matches = []

    while (true) {
      let match = codeBlockRegex.exec(rendered)
      if (match) matches.push(match)
      else break
    }

    for (const match of matches) {
      const [source, code] = match
      const colorized = await sandbox.monaco.editor.colorize(code.replace(/&lt;/g, '<').replace(/&gt;/g, '>'), 'typescript', {})
      rendered = rendered.replace(source, `<code class="language-ts">${colorized}</code>`)
    }

    return rendered
  }

  async function updateShowTypes() {
    const blocks = await getTypesBlocks()
    typeBlocks = await Promise.all(blocks.map(async (code) => await sandbox.monaco.editor.colorize(code, 'typescript', {})))

    updateView()
  }

  async function updateView() {
    // readme
    tabs.challenge.panel.innerHTML = questionReadMeRenedered

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

  async function getTypesBlocks() {
    const ts = sandbox.ts
    program = await sandbox.createTSProgram()
    typeChecker = program.getTypeChecker()
    const startTime = window.performance.now()
    const sourceFile = program.getSourceFile(sandbox.filepath)!
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
      // @ts-expect-error - private API
      const displayParts = ts.typeToDisplayParts(typeChecker, typeChecker.getTypeAtLocation(el), undefined, ts.TypeFormatFlags.InTypeAlias)
      const typeString = ts.displayPartsToString(displayParts)
      return `type ${el.name.getText()} = ${typeString}`
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

      const style = document.createElement('style')
      style.innerHTML = `
        #type-challenges p>code {
          background: rgba(125, 125, 125, 0.2);
          padding: 2px 4px;
          border-radius: 4px;
        }
        #type-challenges blockquote {
          margin: 0;
          padding: 0 5px;
          border-left: 2px solid;
        }
      `
      container.appendChild(style)

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
    },

    modelChangedDebounce: async (_sandbox, model) => {
      log('modelChangedDebounce in type-challenges')
      sandbox = _sandbox
      updateShowTypes()
      fetchQuestion()
    },

    didUnmount: () => {
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
