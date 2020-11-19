import ts from 'typescript'
import { log } from './logger'
import { Context } from './types'
import { Sandbox } from './vendor/sandbox'

export async function prepareTSVfs(sandbox: Sandbox) {
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

export function getTypesBlocks({ sandbox, vfs }: Context) {
  const startTime = window.performance.now()
  const ts = sandbox.ts

  const sourceFile = vfs.getSourceFile(sandbox.filepath)
  if (!sourceFile) {
    throw new Error('No SourceFile in language service.')
  }

  const blocks = sourceFile.statements
    .filter((stmt): stmt is ts.TypeAliasDeclaration => {
      if (ts.isTypeAliasDeclaration(stmt)) {
        const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), stmt.pos) || []
        return leadingComments.some((comment) => sourceFile.getFullText().slice(comment.pos, comment.end).includes('@show-types'))
      }
      return false
    })
    .map((typeAlias) => {
      return ts.displayPartsToString(vfs.languageService.getQuickInfoAtPosition(sandbox.filepath, typeAlias.name.pos + 1)?.displayParts)
    })

  log(`getShowTypesInCode - ${window.performance.now() - startTime}ms`)
  return blocks
}
