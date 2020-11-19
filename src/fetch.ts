import { renderMarkdown } from "./markdown"
import { Sandbox } from "./vendor/sandbox"

export async function fetchQuestion(sandbox: Sandbox) {
  const match = sandbox
    .getText()
    .match(/\/\/tsch\.js\.org\/(\d+)(?:\/([\w-]+)|)/)
    
  if (match) {
    const [, no, lang] = match
    const questionNo = +no

    // TODO: base on lang
    const questionReadMe = await fetch(`https://tsch.js.org/${questionNo}/raw`).then((r) => r.text())

    return await renderMarkdown(
      questionReadMe
        .replace(/<!--info-footer-start-->.*<!--info-footer-end-->/, '')
        .replace(/<h1>/, '<h2>')
        .replace(/<\/h1>/, '</h2>')
        .replace( /<a\shref="https:\/\/tsch\.js\.org\/\d+\/play.+alt="Take\sthe\sChallenge"\/><\/a>/,''),
        // TODO: replace the behavior of locale badges
      sandbox,
    )
  }

  return ''
}
