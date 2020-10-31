import type { editor } from 'monaco-editor'
import type ts from 'typescript'
import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground"
import type { Sandbox } from './vendor/sandbox'

const log = (...args) => console.log('%ctype-challenges =>', 'color: yellow', ...args)

const makePlugin = (utils: PluginUtils) => {
  let mainDiv: HTMLDivElement | null = null
  let showTypesContainer: HTMLElement | null = null

  async function getShowTypesInCode (sandbox: Sandbox, model: editor.ITextModel) {
    const startTime = window.performance.now()
    const program = await sandbox.createTSProgram()
    const sourceFile = program.getSourceFile(sandbox.filepath)
    const needShowTypes = sourceFile.statements.filter((stat) => {
      if (sandbox.ts.isTypeAliasDeclaration(stat)) {
        const leadingComments = sandbox.ts.getLeadingCommentRanges(sourceFile.getFullText(), stat.pos) || []
        return leadingComments.some((comment) => {
          const text = sourceFile.getFullText().slice(comment.pos, comment.end)
          return text.includes('@show-types')
        })
      }
      return false
    }) as ts.TypeAliasDeclaration[]
    const typeChecker = program.getTypeChecker()
    const result = needShowTypes.map((el) => {
      const displayParts = (sandbox.ts as any).typeToDisplayParts(typeChecker, typeChecker.getTypeAtLocation(el), undefined, sandbox.ts.TypeFormatFlags.InTypeAlias)
      const typeString = sandbox.ts.displayPartsToString(displayParts)
      return `type ${el.name.getText()} = ${typeString}`
    }).join('\n')

    if (!showTypesContainer) {
      showTypesContainer = utils.createDesignSystem(mainDiv).code(result)
    } else {
      showTypesContainer.textContent = result
    }
    log(`getShowTypesInCode - ${window.performance.now() - startTime}ms`)
  }

  const customPlugin: PlaygroundPlugin = {
    id: "type-challenges",
    displayName: "Type Challenges",
    didMount: (sandbox, container) => {
      log("DidMount type-challenges plugin")

      // Create a design system object to handle
      // making DOM elements which fit the playground (and handle mobile/light/dark etc)
      mainDiv = container
    },

    // This is called occasionally as text changes in monaco,
    // it does not directly map 1 keyup to once run of the function
    // because it is intentionally called at most once every 0.3 seconds
    // and then will always run at the end.
    modelChangedDebounce: async (sandbox, model) => {
      log('modelChangedDebounce in type-challenges')
      // Do some work with the new text
      getShowTypesInCode(sandbox, model)
    },

    // Gives you a chance to remove anything set up,
    // the container itself if wiped of children after this.
    didUnmount: () => {
      log("De-focusing plugin")
    },
  }

  return customPlugin
}

export default makePlugin
