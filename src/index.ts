import type { editor } from 'monaco-editor'
import type ts from 'typescript'
import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import type { Sandbox } from './vendor/sandbox'

const log = (...args: any) => console.log('%ctype-challenges =>', 'color: teal', ...args)

const makePlugin = (utils: PluginUtils) => {
  let mainDiv: HTMLDivElement
  let program: ts.Program
  let typeChecker: ts.TypeChecker
  let ds: ReturnType<typeof utils.createDesignSystem>

  async function createTSCodeBlock(sandbox: Sandbox, code: string) { 
    const el = ds.code('')
    // @ts-expect-error
    el.parentElement.style = 'margin-bottom: 1em'
    el.innerHTML = await sandbox.monaco.editor.colorize(code, 'typescript', {})
    return el
  }

  async function getShowTypesInCode(sandbox: Sandbox, model: editor.ITextModel) {
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

    const blocks = needShowTypes
      .map((el) => {
        // @ts-expect-error - private API
        const displayParts = ts.typeToDisplayParts(typeChecker, typeChecker.getTypeAtLocation(el), undefined, ts.TypeFormatFlags.InTypeAlias)
        const typeString = ts.displayPartsToString(displayParts)
        return `type ${el.name.getText()} = ${typeString}`
      })

    ds.clear()
    blocks.forEach((code) => createTSCodeBlock(sandbox, code))
    log(`getShowTypesInCode - ${window.performance.now() - startTime}ms`)
  }

  const customPlugin: PlaygroundPlugin = {
    id: 'type-challenges',
    displayName: 'Type Challenges',
    didMount: (sandbox, container) => {
      log('DidMount type-challenges plugin')
      mainDiv = container
      ds = utils.createDesignSystem(mainDiv)
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
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
