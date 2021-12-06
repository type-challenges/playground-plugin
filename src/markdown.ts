import MarkdownIt from 'markdown-it'
import { Sandbox } from './vendor/sandbox'

function unescape(source: string): string {
  return source
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

export async function markdownToHtml(str: string, sandbox: Sandbox): Promise<string> {
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
    const colorized = await sandbox.monaco.editor.colorize(
      unescape(code),
      'typescript',
      {}
    )
    rendered = rendered.replace(
      source,
      `<code class="language-ts">${colorized}</code>`
    )
  }

  return rendered
}
