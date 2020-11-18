<script lang="ts">
  import type { Sandbox } from '../vendor/sandbox'
  import MarkdownIt from 'markdown-it'
  import { onMount } from 'svelte'

  export let sandbox: Sandbox

  let rendered = ''

  async function fetchQuestion() {
    const match = sandbox
      .getText()
      .match(/\/\/tsch\.js\.org\/(\d+)(?:\/([\w-]+)|)/)
    if (match) {
      const [, no, lang] = match
      const questionNo = +no

      const questionReadMe = await fetch(
        `https://tsch.js.org/${questionNo}/raw`
      ).then((r) => r.text())
      rendered = await renderMarkdown(
        questionReadMe
          .replace(/<!--info-footer-start-->.*<!--info-footer-end-->/, '')
          .replace(/<h1>/, '<h2>')
          .replace(/<\/h1>/, '</h2>')
          .replace(
            /<a\shref="https:\/\/tsch\.js\.org\/\d+\/play.+alt="Take\sthe\sChallenge"\/><\/a>/,
            ''
          )
      )
    }
  }

  async function renderMarkdown(str: string): Promise<string> {
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
        code.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
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

  onMount(() => {
    fetchQuestion()
  })
</script>

<style>
  div :global(code) {
    background: rgba(125, 125, 125, 0.2);
    padding: 2px 4px;
    border-radius: 4px;
  }

  div :global(blockquote) {
    margin: 0;
    padding: 0 5px;
    border-left: 2px solid;
  }

  .loading {
    display: grid;
    place-items: center;
    font-size: 15px;
  }
</style>

<div>
  {#if rendered === ''}
    <div class="loading">
      <p>Loading question...</p>
    </div>
  {:else}
    {@html rendered}
  {/if}
</div>
